import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aquabalance.settings')
django.setup()

from accounts.models import SystemState, Zone
from accounts.distribution_engine import get_or_create_system_state, run_distribution_tick
from rest_framework.test import APIClient

def run_tests():
    print("======================================================================")
    print("AQUABALANCE END-TO-END VALIDATION: 1M L TANK & HARDWARE NEW WARD")
    print("======================================================================")
    
    client = APIClient()

    # 1. Verify Storage Tank Capacity is 2,500,000 L
    Zone.objects.filter(ward_number__gte=5).delete()
    state = get_or_create_system_state()
    state.tank_capacity_liters = 2500000.0
    state.tank_level_liters = 1950000.0
    state.save()
    
    dash_res = client.get('/api/dashboard/')
    assert dash_res.status_code == 200
    summary = dash_res.data['summary']
    sys_data = dash_res.data['system']
    
    print(f"\n[STEP 1: Tank Capacity]")
    print(f" - Storage Reservoir Capacity: {sys_data['tank_capacity_liters']:,.0f} L")
    print(f" - Storage Reservoir Level:    {sys_data['tank_level_liters']:,.0f} L ({sys_data['tank_percentage']}%)")
    assert sys_data['tank_capacity_liters'] == 2500000.0, f"Expected 2,500,000 L, got {sys_data['tank_capacity_liters']}"
    assert sys_data['tank_level_liters'] == 1950000.0

    # 2. Verify No False Throttling Warning
    # Set all existing zones to balanced with non-zero flow
    zones = list(Zone.objects.all())
    for z in zones:
        z.status = 'Balanced'
        z.valve_percent = 90
        z.flow_rate = 18.0
        z.is_hardware_active = False
        z.save()
        
    dash_res = client.get('/api/dashboard/')
    summary = dash_res.data['summary']
    print(f"\n[STEP 2: Mainline Outflow & Zero False Throttling Warning]")
    print(f" - Active Wards Count: {summary['active_zones_count']} / {summary['total_zones_count']}")
    print(f" - Closed Valves Count: {summary['closed_valves_count']}")
    print(f" - Supply Reduction %: {summary['supply_reduction_pct']}%")
    print(f" - Total Supply Outflow: {summary['total_supply_rate_lpm']} L/min")
    assert summary['closed_valves_count'] == 0, f"Expected 0 closed valves, got {summary['closed_valves_count']}"
    assert summary['supply_reduction_pct'] == 0.0, f"Expected 0.0% reduction, got {summary['supply_reduction_pct']}"

    # 3. Hardware Integration: Telemetry for a NEW Ward (Ward 5 with 200 houses)
    print(f"\n[STEP 3: Hardware Ingestion on NEW Ward]")
    telemetry_payload = {
        "device_id": "ESP32-AQUABALANCE-TEST-01",
        "tank_capacity_liters": 2500000,
        "wards": [
            {
                "ward_number": 5,
                "ward_name": "Ward 5 - Sector 7 (Hardware Node)",
                "no_of_houses": 200,
                "flow_rate": 18.5,
                "delivered_increment_liters": 250.0,
                "pressure_bar": 3.2
            }
        ]
    }
    
    hw_res = client.post('/api/hardware/telemetry/', telemetry_payload, format='json')
    assert hw_res.status_code == 200, f"Hardware telemetry failed: {hw_res.data}"
    
    hw_data = hw_res.data
    print(f" - Ingestion status: {hw_data['status']}")
    print(f" - ESR Capacity reported: {hw_data['tank_capacity_liters']:,.0f} L")
    print(f" - ESR Level reported:    {hw_data['tank_level_liters']:,.0f} L")
    
    # 4. Verify Operations Isolate to the New Ward
    print(f"\n[STEP 4: Operations Isolation Verification]")
    w5 = Zone.objects.filter(ward_number=5).first()
    assert w5 is not None, "Ward 5 was not created by hardware integration!"
    assert w5.is_hardware_active == True, "Ward 5 should have is_hardware_active=True!"
    assert w5.households_count == 200, f"Expected 200 houses, got {w5.households_count}"
    assert w5.target_liters == 100000.0, f"Expected 100,000 L target, got {w5.target_liters}"
    assert w5.status == 'Balanced'
    assert w5.flow_rate == 18.5
    assert w5.valve_percent > 0
    assert w5.delivered_liters == 250.0
    print(f" - New Ward: {w5.name} (Ward #{w5.ward_number})")
    print(f"   * Number of Houses: {w5.households_count} families")
    print(f"   * Target Quota:     {w5.target_liters:,.0f} L (500 L/family)")
    print(f"   * Delivered Water:  {w5.delivered_liters:,.0f} L")
    print(f"   * Live Flow Rate:   {w5.flow_rate} L/min")
    print(f"   * Valve Aperture:   {w5.valve_percent}% (Open)")
    print(f"   * Status:           {w5.status}")

    # Check that ALL OTHER wards were marked Completed with 0 valve and 0 flow
    other_zones = Zone.objects.exclude(id=w5.id)
    print(f"\n - Verifying other wards are Completed/Idle with 0 flow:")
    for oz in other_zones:
        print(f"   * {oz.name} -> Status: {oz.status} | Valve: {oz.valve_percent}% | Flow: {oz.flow_rate} L/min")
        assert oz.status == 'Completed', f"Expected {oz.name} to be Completed, got {oz.status}"
        assert oz.valve_percent == 0, f"Expected {oz.name} valve 0, got {oz.valve_percent}"
        assert oz.flow_rate == 0.0, f"Expected {oz.name} flow 0.0, got {oz.flow_rate}"
        assert oz.is_hardware_active == False

    # 5. Run SCADA simulation tick and verify tick operations ONLY run on Ward 5
    print(f"\n[STEP 5: SCADA Distribution Engine Simulation Tick]")
    initial_w5_delivered = w5.delivered_liters
    initial_tank_level = state.tank_level_liters
    
    tick_result = run_distribution_tick()
    w5.refresh_from_db()
    state.refresh_from_db()
    
    print(f" - Post-Tick New Ward Delivered: {w5.delivered_liters:,.1f} L (was {initial_w5_delivered:,.1f} L)")
    print(f" - Post-Tick ESR Level:          {state.tank_level_liters:,.1f} L (was {initial_tank_level:,.1f} L)")
    assert w5.delivered_liters > initial_w5_delivered, "Ward 5 should accumulate water during tick"
    assert state.tank_level_liters < initial_tank_level, "Reservoir level should decrease by delivered water"
    
    # Check other wards did NOT accumulate water or change from Completed
    for oz in Zone.objects.exclude(id=w5.id):
        assert oz.flow_rate == 0.0
        assert oz.valve_percent == 0
        assert oz.status == 'Completed'

    print(f"\n[STEP 6: Dashboard SCADA Verification]")
    dash_final = client.get('/api/dashboard/').data
    dash_summary = dash_final['summary']
    print(f" - Total Municipal Supply Flow: {dash_summary['total_supply_rate_lpm']} L/min (Equals Ward 5 Flow: {w5.flow_rate} L/min)")
    print(f" - Closed Valves Count:         {dash_summary['closed_valves_count']} (Completed quotas are not an error/throttled warning)")
    print(f" - Supply Reduction:            {dash_summary['supply_reduction_pct']}%")
    assert dash_summary['closed_valves_count'] == 0, "Completed wards must not trigger closed valve warning!"
    assert dash_summary['supply_reduction_pct'] == 0.0, "Completed wards must not show supply throttled warning!"

    print("\n======================================================================")
    print(">>> ALL VERIFICATION CHECKS PASSED PERFECTLY! <<<")
    print("======================================================================")

if __name__ == '__main__':
    run_tests()
