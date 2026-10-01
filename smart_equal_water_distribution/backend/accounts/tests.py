from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import (
    Zone, UserProfile, SystemState, TelemetryReading, SystemAlert,
    Household, WaterDemandRequest, Grievance, WaterTanker,
    FleetTanker, FleetDriver, DispatchTeamMember
)
from accounts.distribution_engine import (
    get_or_create_system_state, run_distribution_tick, simulate_anomaly
)

class AquaFairCoreTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create basic wards
        self.zone1 = Zone.objects.create(
            ward_number=1,
            name='Ward 1 - Shivaji Nagar',
            sector_type='Residential Lowland',
            households_count=100,
            target_liters=50000.0,
            delivered_liters=25000.0,
            flow_rate=18.5,
            valve_percent=90,
            status='Balanced',
            elevation_tier='Lowland',
            equity_score=99.0
        )
        self.zone2 = Zone.objects.create(
            ward_number=2,
            name='Ward 2 - Gandhi Ward',
            sector_type='Market & Mixed',
            households_count=120,
            target_liters=60000.0,
            delivered_liters=30000.0,
            flow_rate=18.5,
            valve_percent=90,
            status='Balanced',
            elevation_tier='Standard',
            equity_score=99.0
        )

        # Create system state
        self.state = get_or_create_system_state()

        # Create demo household
        self.household = Household.objects.create(
            zone=self.zone1,
            household_id='AF-W1-1042',
            owner_name='Aniket Kulkarni',
            address_or_lane='House #42, Lane 2',
            phone='9822001122',
            members_count=4,
            daily_quota_liters=540.0,
            current_usage_liters=270.0,
            meter_status='Active'
        )

        # Create demo fleet driver and team leader
        self.driver = FleetDriver.objects.create(
            name='Suresh Pawar',
            phone='9822334455',
            license_number='MH14-2018-009112'
        )
        self.team_leader = DispatchTeamMember.objects.create(
            name='Suresh More',
            phone='9890223344',
            badge_id='NP-SUPV-04',
            role='Field Supervisor'
        )

    def test_system_state_initialization(self):
        """Verify storage reservoir state initialization and safe drinking water quality index."""
        state = get_or_create_system_state()
        self.assertEqual(state.tank_capacity_liters, 2500000.0)
        self.assertTrue(state.tank_level_liters > 0)
        self.assertFalse(state.contamination_detected)
        self.assertEqual(state.overflow_guard, True)
        self.assertEqual(state.dry_run_protection, True)

    def test_dashboard_api(self):
        """Verify the SCADA dashboard API returns all core metrics, wards, and alerts."""
        res = self.client.get('/api/dashboard/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('system', res.data)
        self.assertIn('zones', res.data)
        self.assertIn('summary', res.data)
        self.assertIn('equity_index', res.data['summary'])
        self.assertEqual(len(res.data['zones']), 2)

    def test_simulation_tick_and_equalization(self):
        """Verify that simulation tick enforces fair equitable allocation."""
        initial_delivered = self.zone1.delivered_liters
        result = run_distribution_tick()
        z1_updated = Zone.objects.get(pk=self.zone1.pk)
        self.assertTrue(z1_updated.delivered_liters >= initial_delivered)
        self.assertTrue(z1_updated.equity_score >= 90.0)

    def test_overflow_protection_guard(self):
        """Verify intake pump automated cutoff when reservoir reaches >= 95% capacity."""
        simulate_anomaly('simulate_overflow')
        state = SystemState.objects.first()
        self.assertEqual(state.pump_status, 'Standby')
        self.assertIn('Overflow Guard Triggered', state.overflow_status)
        self.assertTrue(SystemAlert.objects.filter(category='overflow').exists())

    def test_dry_run_pump_protection(self):
        """Verify main pump cutoff when reservoir drops <= 12% to prevent motor burnout."""
        self.state.tank_level_liters = 50000.0  # 10% of 500 kL
        self.state.save()
        run_distribution_tick()
        state = SystemState.objects.first()
        self.assertEqual(state.pump_status, 'Stopped')
        self.assertIn('Dry-Run Protection', state.overflow_status)

    def test_early_contamination_emergency_isolation(self):
        """Verify automated multi-valve isolation when chemical contamination is detected."""
        simulate_anomaly('simulate_contamination')
        state = SystemState.objects.first()
        self.assertTrue(state.contamination_detected)
        self.assertEqual(state.pump_status, 'Stopped')

        # Check all zones are emergency isolated with 0% valve aperture
        for zone in Zone.objects.all():
            self.assertEqual(zone.valve_percent, 0)
            self.assertEqual(zone.flow_rate, 0.0)
            self.assertEqual(zone.status, 'Emergency Isolated')

    def test_household_registration_and_quota_calculation(self):
        """Verify citizen registration calculates standard CPHEEO quota (135 L/person)."""
        payload = {
            'name': 'Suresh Patil',
            'email': 'suresh@patil.org',
            'password': 'password123',
            'role': 'Citizen / Household',
            'ward': self.zone1.id,
            'address': 'House 10, Shivaji Chowk',
            'phone': '9876543210',
            'members_count': 5
        }
        res = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('household_id', res.data)

        # 5 members * 135 L = 675 L quota
        hh = Household.objects.get(owner_name='Suresh Patil')
        self.assertEqual(hh.members_count, 5)
        self.assertEqual(hh.daily_quota_liters, 675.0)

    def test_extra_water_demand_lifecycle(self):
        """Verify submitting, approving and dispatching extra water quota to household."""
        # 1. Submit demand
        demand_data = {
            'household_id': self.household.household_id,
            'household': self.household.id,
            'zone': self.zone1.id,
            'requested_by': 'Aniket Kulkarni',
            'extra_liters': 600.0,
            'reason': 'Family Gathering',
            'urgency': 'High'
        }
        res_create = self.client.post('/api/demands/', demand_data, format='json')
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)
        demand_id = res_create.data['id']

        # 2. Approve demand
        res_approve = self.client.post(f'/api/demands/{demand_id}/approve/')
        self.assertEqual(res_approve.status_code, status.HTTP_200_OK)

        demand = WaterDemandRequest.objects.get(pk=demand_id)
        self.assertEqual(demand.status, 'Approved')

        # Check household extra quota granted was incremented
        hh = Household.objects.get(pk=self.household.pk)
        self.assertEqual(hh.extra_water_granted, 600.0)

    def test_grievance_desk_and_field_technician_dispatch(self):
        """Verify citizen incident reporting, field technician dispatch, and resolution."""
        # 1. Report incident
        report_data = {
            'citizen_name': 'Ramesh Patil',
            'phone': '9822341256',
            'ward_id': self.zone1.id,
            'incident_type': 'Pipeline Leak / Burst',
            'location': 'Near Shivaji Chowk, Lane 2',
            'description': 'Underground distribution pipe weeping fresh potable water.'
        }
        res_report = self.client.post('/api/alerts/report/', report_data, format='json')
        self.assertEqual(res_report.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res_report.data['success'])
        ticket_code = res_report.data['ticket_code']

        grievance = Grievance.objects.get(ticket_code=ticket_code)
        self.assertEqual(grievance.status, 'Pending Investigation')

        # 2. Dispatch technician
        dispatch_payload = {
            'technician': 'Rajesh Shinde (Lead Inspector)',
            'eta_minutes': 20
        }
        res_dispatch = self.client.post(f'/api/grievances/{grievance.id}/dispatch/', dispatch_payload, format='json')
        self.assertEqual(res_dispatch.status_code, status.HTTP_200_OK)
        grievance.refresh_from_db()
        self.assertEqual(grievance.status, 'Field Team Dispatched')
        self.assertEqual(grievance.assigned_technician, 'Rajesh Shinde (Lead Inspector)')
        self.assertEqual(grievance.eta_minutes, 20)

        # 3. Resolve ticket
        resolve_payload = {
            'resolution_notes': 'Repaired pinhole leak with stainless repair clamp. Pressure restored to 48 PSI.'
        }
        res_resolve = self.client.post(f'/api/grievances/{grievance.id}/resolve/', resolve_payload, format='json')
        self.assertEqual(res_resolve.status_code, status.HTTP_200_OK)
        grievance.refresh_from_db()
        self.assertEqual(grievance.status, 'Resolved')

    def test_emergency_water_tanker_fleet(self):
        """Verify emergency tanker dispatch and status update to Delivered."""
        tanker_data = {
            'vehicle_no': 'MH-12-AQ-999',
            'driver_name': 'Santosh Gaikwad',
            'driver_phone': '9822123456',
            'capacity_liters': 10000.0,
            'target_ward_id': self.zone1.id,
            'destination_location': 'Shivaji Chowk Central Community Tank',
            'requester_name': 'Emergency Drought Requisition',
            'purpose': 'Ridge elevation compensation'
        }
        res_tnk = self.client.post('/api/tankers/', tanker_data, format='json')
        self.assertEqual(res_tnk.status_code, status.HTTP_201_CREATED)
        tanker_id = res_tnk.data['tanker']['id']

        # Update status to Delivered
        res_status = self.client.post(f'/api/tankers/{tanker_id}/status/', {'status': 'Delivered'}, format='json')
        self.assertEqual(res_status.status_code, status.HTTP_200_OK)
        tanker = WaterTanker.objects.get(pk=tanker_id)
        self.assertEqual(tanker.status, 'Delivered')
        self.assertIsNotNone(tanker.delivered_at)

    def test_fleet_and_crew_management(self):
        """Verify officer authority to register tankers, drivers, crew and dispatch with automated status transitions."""
        # 1. Register a fleet tanker
        tanker_res = self.client.post('/api/fleet/tankers/', {
            'vehicle_no': 'MH-12-AQ-777',
            'tanker_name': 'Aqua Cruiser 7',
            'capacity_liters': 8000.0,
            'model_make': 'BharatBenz 1217C',
            'ownership_type': 'Municipal Owned',
            'status': 'Available'
        }, format='json')
        self.assertEqual(tanker_res.status_code, status.HTTP_201_CREATED)
        f_tanker_id = tanker_res.data['tanker']['id']

        # 2. Register a certified driver
        driver_res = self.client.post('/api/fleet/drivers/', {
            'name': 'Anand Patil',
            'phone': '9822998877',
            'license_number': 'MH12-2016-009988',
            'experience_years': 9,
            'status': 'Available'
        }, format='json')
        self.assertEqual(driver_res.status_code, status.HTTP_201_CREATED)
        f_driver_id = driver_res.data['driver']['id']

        # 3. Register a dispatch team member
        crew_res = self.client.post('/api/fleet/team/', {
            'name': 'Vijay Shinde',
            'role': 'Valve Technician',
            'phone': '9890123456',
            'badge_id': 'NP-VALVE-99',
            'status': 'Active'
        }, format='json')
        self.assertEqual(crew_res.status_code, status.HTTP_201_CREATED)
        f_crew_id = crew_res.data['member']['id']

        # 4. Officer dispatches tanker selecting the fleet tanker, driver, and crew
        dispatch_res = self.client.post('/api/tankers/', {
            'fleet_tanker': f_tanker_id,
            'fleet_driver': f_driver_id,
            'team_members': 'Vijay Shinde (Valve Tech)',
            'target_ward_id': self.zone1.id,
            'destination_location': 'Shivaji Ward Reservoir Point',
            'purpose': 'Peak hour emergency equalization'
        }, format='json')
        self.assertEqual(dispatch_res.status_code, status.HTTP_201_CREATED)
        created_tanker = dispatch_res.data['tanker']
        self.assertEqual(created_tanker['vehicle_no'], 'MH-12-AQ-777')
        self.assertEqual(created_tanker['driver_name'], 'Anand Patil')
        self.assertEqual(created_tanker['driver_phone'], '9822998877')
        self.assertEqual(created_tanker['team_members'], 'Vijay Shinde (Valve Tech)')
        self.assertEqual(created_tanker['capacity_liters'], 8000.0)

        # 5. Check automated status transitions
        tanker_obj = FleetTanker.objects.get(pk=f_tanker_id)
        driver_obj = FleetDriver.objects.get(pk=f_driver_id)
        crew_obj = DispatchTeamMember.objects.get(pk=f_crew_id)
        self.assertEqual(tanker_obj.status, 'In Transit')
        self.assertEqual(driver_obj.status, 'On Route')
        self.assertEqual(crew_obj.status, 'Assigned')

        # 6. Mark delivery completed and check automated asset release
        deliv_res = self.client.post(f"/api/tankers/{created_tanker['id']}/status/", {'status': 'Delivered'}, format='json')
        self.assertEqual(deliv_res.status_code, status.HTTP_200_OK)
        tanker_obj.refresh_from_db()
        driver_obj.refresh_from_db()
        crew_obj.refresh_from_db()
        self.assertEqual(tanker_obj.status, 'Available')
        self.assertEqual(driver_obj.status, 'Available')
        self.assertEqual(crew_obj.status, 'Active')

    def test_nagarparishad_export_and_import(self):
        """Verify bulk municipal export and import in standard Nagar Parishad format."""
        # 1. Export
        res_export = self.client.get('/api/export/nagarparishad/')
        self.assertEqual(res_export.status_code, status.HTTP_200_OK)
        self.assertEqual(res_export.data['total_wards'], 2)
        self.assertEqual(res_export.data['total_households'], 1)

        # 2. Ingest bulk wards
        import_payload = {
            'wards': [
                {
                    'ward_number': 3,
                    'name': 'Ward 3 - Subhash Nagar',
                    'sector_type': 'Elevated Ridge Mohalla',
                    'elevation_tier': 'High-Altitude',
                    'households_count': 150,
                    'target_liters': 75000.0
                }
            ],
            'households': [
                {
                    'ward_number': 3,
                    'household_id': 'AF-W3-3001',
                    'owner_name': 'Kavita Joshi',
                    'address_or_lane': 'Lane 1, Subhash Nagar',
                    'phone': '9890123456',
                    'members_count': 4
                }
            ]
        }
        res_import = self.client.post('/api/import/nagarparishad/', import_payload, format='json')
        self.assertEqual(res_import.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Zone.objects.filter(ward_number=3).count(), 1)
        self.assertEqual(Household.objects.filter(household_id='AF-W3-3001').count(), 1)

    def test_user_login_by_name_and_password(self):
        """Verify user login by full name, first name, and custom set password."""
        reg_data = {
            'name': 'Pooja Deshmukh',
            'email': 'pooja@nagarparishad.gov.in',
            'password': 'poojaSecurePassword123',
            'role': 'Citizen / Household',
            'ward': self.zone1.id,
            'address': 'Lane 4, House 12',
            'phone': '9822998877'
        }
        res_reg = self.client.post('/api/auth/register/', reg_data, format='json')
        self.assertEqual(res_reg.status_code, status.HTTP_201_CREATED)

        # Login using Full Name
        res_login_full = self.client.post('/api/auth/login/', {
            'username': 'Pooja Deshmukh',
            'password': 'poojaSecurePassword123'
        }, format='json')
        self.assertEqual(res_login_full.status_code, status.HTTP_200_OK)
        self.assertEqual(res_login_full.data['user']['full_name'], 'Pooja Deshmukh')
        self.assertEqual(res_login_full.data['user']['profile']['assigned_zone_id'], self.zone1.id)

        # Login using First Name
        res_login_first = self.client.post('/api/auth/login/', {
            'username': 'Pooja',
            'password': 'poojaSecurePassword123'
        }, format='json')
        self.assertEqual(res_login_first.status_code, status.HTTP_200_OK)

        # Incorrect password
        res_bad_pw = self.client.post('/api/auth/login/', {
            'username': 'Pooja Deshmukh',
            'password': 'wrongpassword'
        }, format='json')
        self.assertEqual(res_bad_pw.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_tanker_notification_for_particular_ward(self):
        """Verify tanker dispatch contains driver name, vehicle no, driver mobile no, and filters by ward."""
        tanker_payload = {
            'vehicle_no': 'MH-12-AQ-777',
            'driver_name': 'Kailash Patil',
            'driver_phone': '9822445566',
            'capacity_liters': 5000.0,
            'target_ward_id': self.zone1.id,
            'destination_location': 'Shivaji Chowk Community Sump',
            'purpose': 'Emergency drinking water supply'
        }
        res = self.client.post('/api/tankers/', tanker_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['tanker']['driver_name'], 'Kailash Patil')
        self.assertEqual(res.data['tanker']['driver_phone'], '9822445566')
        self.assertEqual(res.data['tanker']['vehicle_no'], 'MH-12-AQ-777')
        self.assertEqual(res.data['tanker']['status'], 'In Transit')

        # Check ward filter returns tanker for zone 1
        res_ward1 = self.client.get(f'/api/tankers/?ward={self.zone1.id}')
        self.assertTrue(any(t['vehicle_no'] == 'MH-12-AQ-777' for t in res_ward1.data))

        # Check other ward does not have this tanker
        res_ward2 = self.client.get(f'/api/tankers/?ward={self.zone2.id}')
        self.assertFalse(any(t['vehicle_no'] == 'MH-12-AQ-777' for t in res_ward2.data))

    def test_driver_and_team_leader_login(self):
        """Verify driver and dispatch team leader can log in and have proper roles."""
        # 1. Driver Login
        res_driver = self.client.post('/api/auth/login/', {
            'username': 'Suresh Pawar',
            'password': 'driver123'
        }, format='json')
        self.assertEqual(res_driver.status_code, status.HTTP_200_OK)
        self.assertEqual(res_driver.data['user']['profile']['role'], 'Tanker Driver')

        # 2. Team Leader Login
        res_leader = self.client.post('/api/auth/login/', {
            'username': 'Suresh More',
            'password': 'leader123'
        }, format='json')
        self.assertEqual(res_leader.status_code, status.HTTP_200_OK)
        self.assertEqual(res_leader.data['user']['profile']['role'], 'Dispatch Team Leader')

    def test_logical_water_supply_rate_reduction_on_closed_valve(self):
        """Verify water supply rate drops to 0 on closed valve and total supply rate reduces proportionally."""
        # Close zone 1's valve
        res_patch = self.client.patch(f'/api/zones/{self.zone1.id}/', {
            'valve_percent': 0,
            'status': 'Paused'
        }, format='json')
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data['flow_rate'], 0.0)
        self.assertEqual(res_patch.data['valve_percent'], 0)

        # Run tick
        res_tick = self.client.post('/api/system/tick/')
        self.assertEqual(res_tick.status_code, status.HTTP_200_OK)

        # Check dashboard summary
        res_dash = self.client.get('/api/dashboard/')
        summary = res_dash.data['summary']
        self.assertGreaterEqual(summary['closed_valves_count'], 1)
        self.assertGreater(summary['supply_reduction_pct'], 0)

    def test_strategic_reserve_floor_prevents_empty_tank(self):
        """Verify storage reservoir never drops below 20% (500,000 L) strategic reserve floor."""
        min_reserve = self.state.tank_capacity_liters * 0.20
        self.state.tank_level_liters = min_reserve + 500.0  # Just above 20%
        self.state.save()

        # Run tick
        run_distribution_tick()
        self.state.refresh_from_db()

        # Tank level must NEVER drop below 20% reserve
        self.assertGreaterEqual(self.state.tank_level_liters, min_reserve)

        # Now test when exactly at or below 20% reserve
        self.state.tank_level_liters = min_reserve
        self.state.save()
        run_distribution_tick()
        self.state.refresh_from_db()

        self.assertEqual(self.state.tank_level_liters, min_reserve)
        self.assertEqual(self.state.pump_status, 'Standby')
        self.assertIn('Strategic Reserve', self.state.overflow_status)

    def test_exact_required_water_quota_auto_cutoff(self):
        """Verify only the required quota is delivered and valve auto-closes upon completion."""
        # Zone 1 target is 50,000. Set delivered to 49,990 (only 10 L required)
        self.zone1.delivered_liters = 49990.0
        self.zone1.save()

        # Run tick
        run_distribution_tick()
        self.zone1.refresh_from_db()

        # Zone 1 delivered must be exactly capped at target 50000.0
        self.assertEqual(self.zone1.delivered_liters, 50000.0)
        # Valve must auto-close to 0% and flow rate must be 0
        self.assertEqual(self.zone1.valve_percent, 0)
        self.assertEqual(self.zone1.flow_rate, 0.0)
        self.assertEqual(self.zone1.status, 'Completed')

    def test_officer_cannot_resolve_maintenance_or_deliver_tanker(self):
        """Verify Municipal Officers receive 403 Forbidden when attempting maintenance resolution or tanker delivery."""
        # 1. Attempt grievance resolution as Officer
        grievance = Grievance.objects.create(
            ward=self.zone1,
            ticket_code='TK-TEST-001',
            citizen_name='Test Citizen',
            phone='9999999999',
            incident_type='Pipeline Leak / Burst',
            location='Test Location',
            description='Test description',
            status='Field Team Dispatched'
        )
        res_resolve = self.client.post(
            f'/api/grievances/{grievance.id}/resolve/',
            {'resolution_notes': 'Officer trying to resolve', 'user_role': 'Municipal Officer'},
            format='json'
        )
        self.assertEqual(res_resolve.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Permission Denied', res_resolve.data['error'])

        # 2. Attempt tanker delivery as Officer
        tanker = WaterTanker.objects.create(
            vehicle_no='MH-12-TEST',
            driver_name='Driver Test',
            driver_phone='9999999999',
            capacity_liters=5000.0,
            target_ward=self.zone1,
            destination_location='Test Sump',
            status='In Transit'
        )
        res_tanker = self.client.post(
            f'/api/tankers/{tanker.id}/status/',
            {'status': 'Delivered', 'user_role': 'Municipal Officer'},
            format='json'
        )
        self.assertEqual(res_tanker.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('Permission Denied', res_tanker.data['error'])

    def test_hardware_iot_telemetry_integration(self):
        """Verify ESP32 / microcontroller telemetry ingestion and real-time actuator command dispatch."""
        # 1. Hardware queries current valve and pump status via GET
        res_get = self.client.get('/api/hardware/telemetry/')
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        self.assertIn('ward_controls', res_get.data)
        self.assertIn('tank_level_liters', res_get.data)

        # 2. Hardware POSTs sensor telemetry (tank level, flow meter, and water quality)
        payload = {
            'device_id': 'ESP32-WARD-HUB-01',
            'tank_level_liters': 1800000.0,
            'ph_level': 7.3,
            'turbidity_ntu': 1.1,
            'wards': [
                {
                    'ward_number': 1,
                    'flow_rate': 18.5,
                    'delivered_liters': 30000.0,
                    'pressure_bar': 3.4
                }
            ]
        }
        res_post = self.client.post('/api/hardware/telemetry/', payload, format='json')
        self.assertEqual(res_post.status_code, status.HTTP_200_OK)
        self.assertEqual(res_post.data['pump_command'], 'Running')
        self.assertEqual(len(res_post.data['valves_command']), 1)
        self.assertEqual(res_post.data['valves_command'][0]['ward_number'], 1)

        # Verify DB updated
        self.zone1.refresh_from_db()
        self.assertEqual(self.zone1.delivered_liters, 30000.0)
        self.assertEqual(self.zone1.flow_rate, 18.5)

        # 3. Test quota completion auto-shutoff via hardware
        quota_payload = {
            'ward_number': 1,
            'flow_rate': 18.5,
            'delivered_liters': 50000.0  # Exactly reached target 50,000 L
        }
        res_cutoff = self.client.post('/api/hardware/telemetry/', quota_payload, format='json')
        self.assertEqual(res_cutoff.status_code, status.HTTP_200_OK)
        cmd = res_cutoff.data['valves_command'][0]
        self.assertEqual(cmd['target_valve_percent'], 0)
        self.assertTrue(cmd['quota_fulfilled'])

        self.zone1.refresh_from_db()
        self.assertEqual(self.zone1.valve_percent, 0)
        self.assertEqual(self.zone1.flow_rate, 0.0)
        self.assertEqual(self.zone1.status, 'Completed')


