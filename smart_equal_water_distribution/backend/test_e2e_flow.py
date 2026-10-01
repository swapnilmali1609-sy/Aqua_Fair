import requests
import json

BASE_URL = "http://127.0.0.1:8000/api"

def run_tests():
    print("=== 1. TEST TANKER DRIVER LOGIN ===")
    res = requests.post(f"{BASE_URL}/auth/login/", json={"username": "suresh_driver", "password": "driver123"})
    assert res.status_code == 200, f"Driver login failed: {res.text}"
    driver_data = res.json()
    print(f"Driver Login OK: {driver_data['user']['username']}, Role: {driver_data['user']['role']}, Vehicle: {driver_data.get('driver', {}).get('vehicle_no')}")

    print("\n=== 2. TEST TANKER LIST & MARK DELIVERED ===")
    res = requests.get(f"{BASE_URL}/tankers/")
    assert res.status_code == 200
    tankers = res.json()
    assert len(tankers) > 0, "No tankers found"
    target_tanker = tankers[0]
    print(f"Tanker ID: {target_tanker['id']}, Ward: {target_tanker.get('target_ward_name')}, Status: {target_tanker['status']}")

    patch_res = requests.patch(f"{BASE_URL}/tankers/{target_tanker['id']}/status/", json={
        "status": "Delivered",
        "notes": "Delivered 6,000L to Ward 2 Community Sump via driver portal"
    })
    assert patch_res.status_code == 200
    updated_t = patch_res.json()
    print(f"Updated Tanker Status: {updated_t['tanker']['status']}, Notes: {updated_t['tanker']['notes']}")

    print("\n=== 3. TEST DISPATCH TEAM LEADER LOGIN ===")
    res = requests.post(f"{BASE_URL}/auth/login/", json={"username": "suresh_leader", "password": "leader123"})
    assert res.status_code == 200, f"Leader login failed: {res.text}"
    leader_data = res.json()
    print(f"Leader Login OK: {leader_data['user']['username']}, Role: {leader_data['user']['role']}, Badge: {leader_data.get('leader', {}).get('badge_id')}")

    print("\n=== 4. TEST GRIEVANCES LIST & RESOLUTION ===")
    res = requests.get(f"{BASE_URL}/grievances/")
    assert res.status_code == 200
    grievances = res.json()
    assert len(grievances) > 0, "No grievances found"
    target_g = grievances[0]
    print(f"Grievance ID: {target_g['id']}, Problem: {target_g.get('incident_type')}, Status: {target_g['status']}, Location: {target_g['location']}")

    # Start On-site repair
    prog_res = requests.post(f"{BASE_URL}/grievances/{target_g['id']}/status/", json={
        "status": "In Progress",
        "assigned_technician": "Suresh More (Field Leader)",
        "resolution_notes": f"Squad arrived on site at {target_g['location']}"
    })
    assert prog_res.status_code == 200
    print(f"In-Progress result: {prog_res.json()['grievance']['status']}")

    # Mark resolved
    resolv_res = requests.post(f"{BASE_URL}/grievances/{target_g['id']}/status/", json={
        "status": "Resolved",
        "resolution_notes": "Replaced damaged main clamp, restored pipeline pressure. Flow confirmed normal."
    })
    assert resolv_res.status_code == 200
    resolv_data = resolv_res.json()['grievance']
    print(f"Resolved result: {resolv_data['status']}, Resolution notes: {resolv_data['resolution_notes']}")

    print("\n=== 5. TEST OFFICER DASHBOARD DISPLAY ===")
    dash_res = requests.get(f"{BASE_URL}/dashboard/")
    assert dash_res.status_code == 200
    dash = dash_res.json()

    # In AquaFair architecture, Officer SCADA queries grievances and tankers endpoints
    g_res = requests.get(f"{BASE_URL}/grievances/").json()
    t_res = requests.get(f"{BASE_URL}/tankers/").json()

    g_on_dash = next(g for g in g_res if g['id'] == target_g['id'])
    t_on_dash = next(t for t in t_res if t['id'] == target_tanker['id'])
    print(f"Officer SCADA reflects Grievance #{g_on_dash['id']}: Status = {g_on_dash['status']} (Notes: {g_on_dash['resolution_notes']})")
    print(f"Officer SCADA reflects Tanker #{t_on_dash['id']}: Status = {t_on_dash['status']}")
    assert g_on_dash['status'] == 'Resolved'
    assert t_on_dash['status'] == 'Delivered'

    print("\n=== 6. TEST LOGICAL WATER SUPPLY REDUCTION ON CLOSED VALVE ===")
    # Reset distribution cycle to start fresh with all active valves
    requests.post(f"{BASE_URL}/system/control/", json={"action": "reset_cycle"})

    dash_fresh = requests.get(f"{BASE_URL}/dashboard/").json()
    initial_flow = dash_fresh['summary']['total_supply_rate_lpm']
    nominal_flow = dash_fresh['summary']['nominal_supply_rate_lpm']
    print(f"Nominal Flow: {nominal_flow:.2f} L/min | Active Flow: {initial_flow:.2f} L/min | Closed Valves: {dash_fresh['summary']['closed_valves_count']}")
    assert initial_flow > 50.0, f"Expected high flow initially, got {initial_flow}"
    assert dash_fresh['summary']['closed_valves_count'] == 0

    # Pick Ward 2 to close valve
    zone_to_close = next(z for z in dash_fresh['zones'] if '2' in z['name'])
    print(f"Closing valve for Zone: {zone_to_close['name']} (was {zone_to_close['valve_percent']}%, {zone_to_close['flow_rate']} L/min)")

    patch_zone = requests.patch(f"{BASE_URL}/zones/{zone_to_close['id']}/", json={
        "valve_percent": 0,
        "status": "Paused"
    })
    assert patch_zone.status_code == 200
    closed_z = patch_zone.json()
    print(f"Zone after close: Valve = {closed_z['valve_percent']}%, Flow = {closed_z['flow_rate']} L/min, Status = {closed_z['status']}")
    assert closed_z['flow_rate'] == 0.0
    assert closed_z['valve_percent'] == 0

    # Run tick
    tick_res = requests.post(f"{BASE_URL}/system/tick/")
    assert tick_res.status_code == 200
    metrics = tick_res.json().get('supply_metrics', {})
    print(f"Tick Supply Metrics: Flow = {metrics.get('total_supply_rate_lpm'):.2f} L/min, Reduction = {metrics.get('supply_reduction_pct'):.1f}%, Closed count = {metrics.get('closed_valves_count')}")

    # Check officer dashboard after closing
    dash_after = requests.get(f"{BASE_URL}/dashboard/").json()
    summary = dash_after['summary']
    print(f"Post-close Officer Dashboard Summary:")
    print(f" - Total Supply Outflow: {summary['total_supply_rate_lpm']:.2f} L/min (vs nominal {summary['nominal_supply_rate_lpm']:.2f} L/min)")
    print(f" - Supply Reduction: {summary['supply_reduction_pct']:.1f}%")
    print(f" - Closed Ward Valves: {summary['closed_valves_count']} ({', '.join(summary['closed_ward_names'])})")
    assert summary['closed_valves_count'] >= 1
    assert summary['total_supply_rate_lpm'] < nominal_flow
    assert summary['supply_reduction_pct'] > 0

    print("\n>>> ALL END-TO-END FLOWS AND WATER SUPPLY REDUCTION LOGIC VALIDATED SUCCESSFULLY! <<<")

if __name__ == '__main__':
    run_tests()
