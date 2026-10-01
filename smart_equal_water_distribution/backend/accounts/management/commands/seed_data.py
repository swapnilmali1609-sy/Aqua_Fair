from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from accounts.models import (
    Zone, SystemState, SystemAlert, UserProfile, Household,
    WaterDemandRequest, Grievance, WaterTanker, FleetTanker, FleetDriver, DispatchTeamMember
)

class Command(BaseCommand):
    help = 'Seeds initial data for AquaFair – Smart Water Monitoring and Equity System'

    def handle(self, *args, **options):
        self.stdout.write('Seeding AquaFair Smart Water Monitoring and Equity System data...')

        # 1. System State (Central Storage Tank & Protection Watchdogs)
        state, created = SystemState.objects.get_or_create(
            id=1,
            defaults={
                'tank_name': 'AquaFair Municipal Storage Reservoir (ESR)',
                'tank_capacity_liters': 2500000.0,
                'tank_level_liters': 1950000.0,
                'pump_status': 'Running',
                'system_mode': 'Auto',
                'pump_efficiency': 95.4,
                'pressure_psi': 48.0,
                'pumping_station': 'AquaFair Central Headworks Pumping Station',
                'chlorination_ppm': 0.8,
                'turbidity_ntu': 1.2,
                'overflow_guard': True,
                'overflow_status': 'Safe (78% Capacity)',
                'dry_run_protection': True,
                'leak_detection_status': 'Normal (Zero Active Leaks)',
                'abnormal_usage_alerts_count': 0,
                'water_wastage_prevented_liters': 92500.0
            }
        )
        if not created:
            state.tank_name = 'AquaFair Municipal Storage Reservoir (ESR)'
            state.tank_capacity_liters = 2500000.0
            state.tank_level_liters = 1950000.0
            state.pump_status = 'Running'
            state.system_mode = 'Auto'
            state.overflow_guard = True
            state.overflow_status = 'Safe (78% Capacity)'
            state.dry_run_protection = True
            state.leak_detection_status = 'Normal (Zero Active Leaks)'
            state.water_wastage_prevented_liters = 92500.0
            state.save()
        self.stdout.write(f"AquaFair Storage Reservoir State: {'Created' if created else 'Updated'}")

        # 2. Municipal Wards / Community Sectors
        initial_wards = [
            {
                'order': 1,
                'ward_number': 1,
                'name': 'Ward 1 - Shivaji Nagar',
                'sector_type': 'Residential Lowland',
                'households_count': 250,
                'target_liters': 125000.0,
                'delivered_liters': 122500.0,
                'flow_rate': 18.2,
                'valve_percent': 88,
                'elevation_tier': 'Lowland',
                'supply_timing': '06:00 AM - 08:30 AM',
                'status': 'Balanced',
                'leak_detected': False,
                'abnormal_usage_detected': False,
                'equity_score': 99.2
            },
            {
                'order': 2,
                'ward_number': 2,
                'name': 'Ward 2 - Gandhi Ward',
                'sector_type': 'Market & Residential',
                'households_count': 280,
                'target_liters': 140000.0,
                'delivered_liters': 140000.0,
                'flow_rate': 0.0,
                'valve_percent': 0,
                'elevation_tier': 'Standard',
                'supply_timing': '06:00 AM - 08:30 AM',
                'status': 'Completed',
                'leak_detected': False,
                'abnormal_usage_detected': False,
                'equity_score': 100.0
            },
            {
                'order': 3,
                'ward_number': 3,
                'name': 'Ward 3 - Subhash Nagar',
                'sector_type': 'Elevated Ridge Mohalla',
                'households_count': 220,
                'target_liters': 110000.0,
                'delivered_liters': 108200.0,
                'flow_rate': 18.8,
                'valve_percent': 96,
                'elevation_tier': 'High-Altitude',
                'supply_timing': '06:00 AM - 08:30 AM',
                'status': 'Balanced',
                'leak_detected': False,
                'abnormal_usage_detected': False,
                'equity_score': 98.8
            },
            {
                'order': 4,
                'ward_number': 4,
                'name': 'Ward 4 - Ambedkar Ward',
                'sector_type': 'Tail-End Sector',
                'households_count': 260,
                'target_liters': 130000.0,
                'delivered_liters': 126800.0,
                'flow_rate': 18.5,
                'valve_percent': 100,
                'elevation_tier': 'Tail-End',
                'supply_timing': '06:00 AM - 08:30 AM',
                'status': 'Balanced',
                'leak_detected': False,
                'abnormal_usage_detected': False,
                'equity_score': 98.2
            },
        ]

        for w_data in initial_wards:
            ward, w_created = Zone.objects.update_or_create(
                ward_number=w_data['ward_number'],
                defaults=w_data
            )
            self.stdout.write(f"Ward {ward.name}: {'Created' if w_created else 'Updated'}")

        # 3. AquaFair Categorized Alerts
        SystemAlert.objects.all().delete()
        alerts_data = [
            {
                'level': 'warning',
                'category': 'equity',
                'title': 'High-Altitude Ridge Elevation Equalized',
                'message': 'Subhash Nagar motorized sluice valve trimmed to 96% to compensate for +18m elevation head loss and protect household tap pressure.'
            },
            {
                'level': 'info',
                'category': 'overflow',
                'title': 'Storage Tank Overflow Guard Armed',
                'message': 'ESR level operating safely at 3,90,000 L (78% capacity). Automated 95% overflow cutoff protection active.'
            },
            {
                'level': 'info',
                'category': 'leak',
                'title': 'Nocturnal Leak Scan Verified Zero Loss',
                'message': 'Baseline differential pressure tests confirmed zero pipe bursts or unmetered leaks across all 4 ward feeder mains.'
            },
            {
                'level': 'info',
                'category': 'equity',
                'title': 'AquaFair Morning Shift: 1,010 Households Supplying',
                'message': 'Fair distribution active with 500 L per family quota. City-wide equity parity index: 99.1%.'
            },
        ]

        for a in alerts_data:
            SystemAlert.objects.create(
                title=a['title'],
                category=a['category'],
                level=a['level'],
                message=a['message'],
                resolved=False
            )

        # 4. Connected Municipal Households (1,010 total across 4 wards)
        first_names = ['Ramesh', 'Suresh', 'Pooja', 'Sunita', 'Anil', 'Ganesh', 'Meena', 'Prakash', 'Deepak', 'Kavita', 'Sachin', 'Nitin', 'Vijay', 'Sneha', 'Rahul', 'Smita', 'Santosh', 'Manish', 'Jyoti', 'Rajesh', 'Priyanka', 'Amol', 'Shilpa', 'Vikas', 'Sangita', 'Pradeep', 'Sunil', 'Anita', 'Mahesh', 'Madhuri']
        last_names = ['Patil', 'Deshmukh', 'Jadhav', 'Shinde', 'Kadam', 'Pawar', 'Chavan', 'More', 'Gaikwad', 'Sawant', 'Bhosale', 'Kulkarni', 'Joshi', 'Kale', 'Wagh', 'Tambe', 'Salunkhe', 'Mane', 'Sutar', 'Thorat']

        ward_lane_map = {
            1: ['Shivaji Main Road', 'Shivaji Chowk Lane 1', 'Shivaji Chowk Lane 2', 'Near Temple Galli', 'Market Yard By-lane', 'Lowland Bypass Road', 'Zilla Parishad Path', 'Hanuman Galli'],
            2: ['Gandhi Chowk Road', 'Vegetable Mandi Galli', 'Cloth Market Lane 1', 'Cloth Market Lane 2', 'Commercial Complex Lane', 'Station Link Road', 'Post Office Lane', 'Bazar Galli'],
            3: ['Elevated Hill Road', 'Ridge Colony Lane 1', 'Ridge Colony Lane 2', 'High-Tank Slope Road', 'Water Tower Path', 'Subhash Tekdi Lane', 'Upper Hillview Galli', 'Ridge Crest Way'],
            4: ['Ambedkar Chowk Main', 'Samata Nagar Lane 1', 'Samata Nagar Lane 2', 'Ring Road Sector 4', 'Bhim Nagar Main Road', 'Vikas Nagar Lane 3', 'School Road Near ZP', 'Tail-End Garden Lane 5']
        }

        created_hh_count = 0
        for ward_data in initial_wards:
            w_num = ward_data['ward_number']
            w_obj = Zone.objects.filter(ward_number=w_num).first()
            if not w_obj:
                continue
            
            lanes = ward_lane_map.get(w_num, ['Main Street'])
            count = ward_data['households_count']
            
            for i in range(1, count + 1):
                hh_num = (w_num * 1000) + i
                hh_id = f"AF-W{w_num}-{hh_num}"
                
                fn = first_names[(i * 3 + w_num * 7) % len(first_names)]
                ln = last_names[(i * 5 + w_num * 11) % len(last_names)]
                owner = f"{fn} {ln}"
                
                if hh_num == 1042:
                    owner = "Aniket Kulkarni (Patil Family)"
                    hh_id = "AF-W1-1042"

                lane = lanes[(i - 1) % len(lanes)]
                address = f"House #{i}, {lane}"
                phone = f"98{w_num}{10 + (i % 89)}{10000 + ((i * 137) % 90000)}"
                members = 3 if i % 5 == 0 else (5 if i % 7 == 0 else (6 if i % 11 == 0 else 4))
                quota = float(members * 135)
                
                is_abnormal = (w_num == 1 and i in [4, 63]) or (w_num == 2 and i in [29, 88]) or (w_num == 3 and i == 14)
                usage = round(quota * 1.18, 1) if is_abnormal else round(quota * (0.68 + ((i % 25) / 100.0)), 1)
                extra = 500.0 if (i == 2 or i == 18) else 0.0

                Household.objects.update_or_create(
                    household_id=hh_id,
                    defaults={
                        'zone': w_obj,
                        'owner_name': owner,
                        'address_or_lane': address,
                        'phone': phone,
                        'members_count': members,
                        'daily_quota_liters': quota,
                        'current_usage_liters': usage,
                        'meter_status': 'Flagged' if is_abnormal else 'Active',
                        'abnormal_draw': is_abnormal,
                        'extra_water_granted': extra
                    }
                )
                created_hh_count += 1

            w_obj.households_count = w_obj.households.count()
            w_obj.save()

        self.stdout.write(f"Connected Households Seeded: {created_hh_count} across 4 Wards")

        # 5. Water Demand Requests
        w1 = Zone.objects.filter(ward_number=1).first()
        w2 = Zone.objects.filter(ward_number=2).first()
        w3 = Zone.objects.filter(ward_number=3).first()
        w4 = Zone.objects.filter(ward_number=4).first()
        h1042 = Household.objects.filter(household_id='AF-W1-1042').first()

        WaterDemandRequest.objects.all().delete()
        demands_seed = [
            {
                'household': h1042,
                'household_code': 'AF-W1-1042',
                'zone': w1,
                'requested_by': 'Aniket Kulkarni (Patil Family)',
                'extra_liters': 500.0,
                'reason': 'Wedding Ceremony & Family Gathering',
                'urgency': 'High',
                'status': 'Pending',
                'notes': 'Requested extra allocation for upcoming family ceremony in Shivaji Nagar.'
            },
            {
                'household': Household.objects.filter(household_id='AF-W2-2015').first(),
                'household_code': 'AF-W2-2015',
                'zone': w2,
                'requested_by': 'Sunil Deshmukh',
                'extra_liters': 750.0,
                'reason': 'Underground Sump Deep Clean & Refill',
                'urgency': 'Normal',
                'status': 'Approved',
                'notes': 'Approved by Municipal Officer on morning review.'
            },
            {
                'household': Household.objects.filter(household_id='AF-W3-3008').first(),
                'household_code': 'AF-W3-3008',
                'zone': w3,
                'requested_by': 'Kavita Joshi',
                'extra_liters': 1000.0,
                'reason': 'Religious Festival (Ganesh Utsav Community Point)',
                'urgency': 'Emergency',
                'status': 'Approved',
                'notes': 'Dispatched emergency ridge allocation.'
            },
            {
                'household': Household.objects.filter(household_id='AF-W4-4022').first(),
                'household_code': 'AF-W4-4022',
                'zone': w4,
                'requested_by': 'Prakash Bhosale',
                'extra_liters': 400.0,
                'reason': 'Home Renovation Plastering Work',
                'urgency': 'Normal',
                'status': 'Rejected',
                'notes': 'Officer note: Commercial/construction draw not permitted under domestic fair quota.'
            },
        ]
        for d_info in demands_seed:
            if d_info['zone']:
                WaterDemandRequest.objects.create(**d_info)
        self.stdout.write(f"Water Demands Seeded: {len(demands_seed)} requests")

        # 6. Municipal Incident Grievance Desk
        Grievance.objects.all().delete()
        grievances_seed = [
            {
                'ticket_code': 'AF-GRV-101',
                'citizen_name': 'Ramesh Patil',
                'phone': '9822341256',
                'ward': w1,
                'ward_name': w1.name if w1 else 'Ward 1 - Shivaji Nagar',
                'ward_number': 1,
                'location': 'Near Shivaji Chowk, Lane 2',
                'incident_type': 'Pipeline Leak / Burst',
                'priority': 'High',
                'status': 'Pending Investigation',
                'assigned_technician': 'Unassigned',
                'description': 'Main distribution sub-collar dripping fresh potable water onto roadside near house #42.'
            },
            {
                'ticket_code': 'AF-GRV-102',
                'citizen_name': 'Sunita Deshmukh',
                'phone': '9822419876',
                'ward': w3,
                'ward_name': w3.name if w3 else 'Ward 3 - Subhash Nagar',
                'ward_number': 3,
                'location': 'Upper Ridge Slope, Near High Tank Path',
                'incident_type': 'Low Water Pressure / Dry Tap',
                'priority': 'High',
                'status': 'Field Team Dispatched',
                'assigned_technician': 'Rajesh Shinde (Lead Inspector)',
                'eta_minutes': 25,
                'description': 'Ridge elevation line showing 1.2 bar head pressure. Top tier households reporting slow filling.'
            },
            {
                'ticket_code': 'AF-GRV-103',
                'citizen_name': 'Anil Kadam',
                'phone': '9845127890',
                'ward': w2,
                'ward_name': w2.name if w2 else 'Ward 2 - Gandhi Ward',
                'ward_number': 2,
                'location': 'Vegetable Mandi Galli, House #14',
                'incident_type': 'Unauthorized Suction Motor Detected',
                'priority': 'High',
                'status': 'In Progress',
                'assigned_technician': 'Suresh Mane (Enforcement Officer)',
                'eta_minutes': 15,
                'description': 'Neighbor running 1.5 HP inline suction motor directly on municipal feeder line, dropping line head.'
            },
            {
                'ticket_code': 'AF-GRV-104',
                'citizen_name': 'Meena Chavan',
                'phone': '9866782341',
                'ward': w4,
                'ward_name': w4.name if w4 else 'Ward 4 - Ambedkar Ward',
                'ward_number': 4,
                'location': 'Samata Nagar Lane 1, House #19',
                'incident_type': 'Pipeline Sluice Valve Malfunction',
                'priority': 'Normal',
                'status': 'Resolved',
                'assigned_technician': 'Amol Raut (Technician)',
                'eta_minutes': 0,
                'description': 'Secondary line sluice valve jammed at 30% aperture. Line team serviced spindle.',
                'resolution_notes': 'Replaced rubber gasket and greased gate spindle. Nominal 18.5 L/min flow restored.'
            },
        ]
        for g_info in grievances_seed:
            Grievance.objects.create(**g_info)
        self.stdout.write(f"Municipal Grievances Seeded: {len(grievances_seed)} tickets")

        # 7. Municipal Fleet Vehicles, Certified Drivers, Dispatch Crew & Emergency Tankers
        FleetTanker.objects.all().delete()
        fleet_tankers_seed = [
            {
                'vehicle_no': 'MH-12-AQ-101',
                'tanker_name': 'Aqua Titan 1',
                'capacity_liters': 10000.0,
                'model_make': 'Tata 1613 SE',
                'ownership_type': 'Municipal Owned',
                'status': 'In Transit',
                'gps_tracking_id': 'GPS-MH12-101',
                'notes': 'Heavy capacity municipal fleet tanker assigned to core pressure deficits.'
            },
            {
                'vehicle_no': 'MH-12-AQ-102',
                'tanker_name': 'Aqua Star 2',
                'capacity_liters': 5000.0,
                'model_make': 'Eicher Pro 2049',
                'ownership_type': 'Municipal Owned',
                'status': 'Available',
                'gps_tracking_id': 'GPS-MH12-102',
                'notes': 'Medium capacity agile tanker for narrow lane distribution.'
            },
            {
                'vehicle_no': 'MH-12-AQ-204',
                'tanker_name': 'Aqua Cruiser 3',
                'capacity_liters': 8000.0,
                'model_make': 'BharatBenz 1217C',
                'ownership_type': 'Municipal Owned',
                'status': 'Available',
                'gps_tracking_id': 'GPS-MH12-204',
                'notes': 'High-torque tanker fitted with stainless steel Grade A food grade tank.'
            },
            {
                'vehicle_no': 'MH-14-BT-505',
                'tanker_name': 'Jal Rath Express',
                'capacity_liters': 12000.0,
                'model_make': 'Ashok Leyland Ecomet',
                'ownership_type': 'Contractor Leased',
                'status': 'Available',
                'gps_tracking_id': 'GPS-MH14-505',
                'notes': 'Contractor leased emergency relief carrier on standby at Headworks.'
            }
        ]
        tanker_objs = {}
        for ft in fleet_tankers_seed:
            t = FleetTanker.objects.create(**ft)
            tanker_objs[t.vehicle_no] = t
        self.stdout.write(f"Municipal Fleet Tankers Seeded: {len(fleet_tankers_seed)} vehicles")

        FleetDriver.objects.all().delete()
        drivers_seed = [
            {
                'name': 'Sitaram Gaikwad',
                'phone': '9822456789',
                'license_number': 'MH12-2014-004312',
                'experience_years': 10,
                'emergency_contact': '9822001144',
                'status': 'On Route',
                'assigned_tanker': tanker_objs.get('MH-12-AQ-101'),
                'notes': 'Lead heavy vehicle certified driver. 10 years municipal service.'
            },
            {
                'name': 'Kishor Shinde',
                'phone': '9822567890',
                'license_number': 'MH12-2017-009843',
                'experience_years': 7,
                'emergency_contact': '9822001155',
                'status': 'Available',
                'assigned_tanker': tanker_objs.get('MH-12-AQ-102'),
                'notes': 'Experienced in hilly high-altitude narrow lane maneuvering.'
            },
            {
                'name': 'Suresh Pawar',
                'phone': '9822334455',
                'license_number': 'MH14-2018-009112',
                'experience_years': 8,
                'emergency_contact': '9822001166',
                'status': 'Available',
                'assigned_tanker': tanker_objs.get('MH-12-AQ-204'),
                'notes': 'Certified commercial tanker operator on day standby shift.'
            },
            {
                'name': 'Ramesh Kadam',
                'phone': '9822114477',
                'license_number': 'MH12-2015-004523',
                'experience_years': 11,
                'emergency_contact': '9822001177',
                'status': 'Available',
                'assigned_tanker': tanker_objs.get('MH-14-BT-505'),
                'notes': 'Senior emergency relief driver, night shift roster.'
            }
        ]
        driver_objs = {}
        for dr in drivers_seed:
            d = FleetDriver.objects.create(**dr)
            driver_objs[d.name] = d
        self.stdout.write(f"Municipal Certified Drivers Seeded: {len(drivers_seed)} drivers")

        DispatchTeamMember.objects.all().delete()
        team_seed = [
            {
                'name': 'Ganesh Shinde',
                'role': 'Valve Technician',
                'phone': '9890112233',
                'badge_id': 'NP-VALVE-01',
                'status': 'Assigned',
                'ward_assignment': 'Ward 1 & Ward 3',
                'notes': 'Operates distribution discharge manifold and flow regulators.'
            },
            {
                'name': 'Suresh More',
                'role': 'Field Supervisor',
                'phone': '9890223344',
                'badge_id': 'NP-SUPV-04',
                'status': 'Active',
                'ward_assignment': 'All Wards',
                'notes': 'Verifies equity distribution volume and logs delivery receipts.'
            },
            {
                'name': 'Ajay Jadhav',
                'role': 'Security & Queue Escort',
                'phone': '9890334455',
                'badge_id': 'NP-ESCRT-12',
                'status': 'Assigned',
                'ward_assignment': 'Ward 3 & Ward 4',
                'notes': 'Maintains orderly resident lines and ensures senior citizen priority.'
            },
            {
                'name': 'Sunil Gaikwad',
                'role': 'Sanitation & Chlorination Crew',
                'phone': '9890445566',
                'badge_id': 'NP-CHLOR-07',
                'status': 'Active',
                'ward_assignment': 'All Wards',
                'notes': 'Tests chlorine ppm level and water potability at point of discharge.'
            },
            {
                'name': 'Mahesh Kamble',
                'role': 'Valve Technician',
                'phone': '9890556677',
                'badge_id': 'NP-VALVE-03',
                'status': 'Active',
                'ward_assignment': 'Ward 2 & Ward 4',
                'notes': 'Field technician specialized in rapid hose and hydrant coupling.'
            }
        ]
        for tm in team_seed:
            DispatchTeamMember.objects.create(**tm)
        self.stdout.write(f"Dispatch Team Crew Seeded: {len(team_seed)} members")

        WaterTanker.objects.all().delete()
        tankers_seed = [
            {
                'dispatch_code': 'TNK-MH12-101',
                'fleet_tanker': tanker_objs.get('MH-12-AQ-101'),
                'fleet_driver': driver_objs.get('Sitaram Gaikwad'),
                'vehicle_no': 'MH-12-AQ-101',
                'driver_name': 'Sitaram Gaikwad',
                'driver_phone': '9822456789',
                'team_members': 'Ganesh Shinde (Valve Tech), Ajay Jadhav (Queue Escort)',
                'capacity_liters': 10000.0,
                'target_ward': w3,
                'target_ward_name': w3.name if w3 else 'Ward 3 - Subhash Nagar',
                'target_ward_number': 3,
                'destination_location': 'Subhash Chowk Central Community Tank',
                'requester_name': 'Ward 3 Mohalla Committee',
                'purpose': 'Ridge elevation pressure compensation for 40 hilltop families',
                'status': 'In Transit',
                'notes': 'Water drawn from central ESR headworks. Grade A Potable certified.'
            },
            {
                'dispatch_code': 'TNK-MH12-102',
                'fleet_tanker': tanker_objs.get('MH-12-AQ-102'),
                'fleet_driver': driver_objs.get('Kishor Shinde'),
                'vehicle_no': 'MH-12-AQ-102',
                'driver_name': 'Kishor Shinde',
                'driver_phone': '9822567890',
                'team_members': 'Mahesh Kamble (Valve Tech)',
                'capacity_liters': 5000.0,
                'target_ward': w4,
                'target_ward_name': w4.name if w4 else 'Ward 4 - Ambedkar Ward',
                'target_ward_number': 4,
                'destination_location': 'Ambedkar Community Hall Sump',
                'requester_name': 'Community Festival Committee',
                'purpose': 'Standby potable supply during nocturnal valve servicing',
                'status': 'Scheduled',
                'notes': 'Scheduled for 02:00 PM shift.'
            }
        ]
        for t_info in tankers_seed:
            WaterTanker.objects.create(**t_info)
        self.stdout.write(f"Emergency Water Tankers Seeded: {len(tankers_seed)} dispatches")

        # 8. Check Demo Users
        user_officer = User.objects.filter(username='samru').first()
        if not user_officer:
            user_officer = User.objects.create_user(
                username='samru',
                email='swapnilmali1613@gmail.com',
                password='samru123',
                first_name='Samru',
                last_name='(Municipal Officer)'
            )
        else:
            user_officer.set_password('samru123')
            user_officer.save()
        profile_off, _ = UserProfile.objects.get_or_create(user=user_officer)
        profile_off.role = 'Municipal Officer'
        profile_off.household_id = 'AF-OFFICER-01'
        profile_off.save()

        user_citizen = User.objects.filter(username__in=['AF-W1-1042', 'af_w1_1042', 'ramesh_patil']).first()
        if not user_citizen:
            user_citizen = User.objects.create_user(
                username='ramesh_patil',
                email='ramesh.patil@aquafair.org',
                password='123456',
                first_name='Ramesh',
                last_name='Patil'
            )
        else:
            user_citizen.first_name = 'Ramesh'
            user_citizen.last_name = 'Patil'
            user_citizen.set_password('123456')
            user_citizen.save()

        profile_cit, _ = UserProfile.objects.get_or_create(user=user_citizen)
        profile_cit.role = 'Citizen / Household'
        profile_cit.household_id = 'AF-W1-1042'
        profile_cit.household_name = 'Ramesh Patil'
        profile_cit.assigned_zone = w1
        profile_cit.phone = '9822341256'
        profile_cit.address = 'House #42, Shivaji Chowk Lane 2'
        profile_cit.save()

        # Tanker Driver User: Suresh Pawar
        user_driver = User.objects.filter(username='suresh_driver').first()
        if not user_driver:
            user_driver = User.objects.create_user(
                username='suresh_driver',
                email='suresh.driver@aquafair.org',
                password='driver123',
                first_name='Suresh',
                last_name='Pawar (Driver)'
            )
        else:
            user_driver.set_password('driver123')
            user_driver.save()
        prof_drv, _ = UserProfile.objects.get_or_create(user=user_driver)
        prof_drv.role = 'Tanker Driver'
        prof_drv.phone = '9822334455'
        prof_drv.household_id = 'DRV-MH14-2018'
        prof_drv.household_name = 'Suresh Pawar'
        prof_drv.address = 'Municipal Tanker Depot, Bay 3'
        prof_drv.save()

        # Dispatch Team Leader User: Suresh More
        user_leader = User.objects.filter(username='suresh_leader').first()
        if not user_leader:
            user_leader = User.objects.create_user(
                username='suresh_leader',
                email='suresh.leader@aquafair.org',
                password='leader123',
                first_name='Suresh',
                last_name='More (Supervisor)'
            )
        else:
            user_leader.set_password('leader123')
            user_leader.save()
        prof_lead, _ = UserProfile.objects.get_or_create(user=user_leader)
        prof_lead.role = 'Dispatch Team Leader'
        prof_lead.phone = '9890223344'
        prof_lead.household_id = 'NP-SUPV-04'
        prof_lead.household_name = 'Suresh More'
        prof_lead.address = 'Nagar Parishad Field Maintenance Squad'
        prof_lead.save()

        self.stdout.write(self.style.SUCCESS('Successfully seeded AquaFair Smart Water Monitoring and Equity System database!'))

