import random
from .models import Zone, SystemState, TelemetryReading, SystemAlert

def get_or_create_system_state():
    state = SystemState.objects.first()
    if not state:
        state = SystemState.objects.create(
            tank_name='AquaFair Municipal Storage Reservoir (ESR)',
            tank_capacity_liters=2500000.0,
            tank_level_liters=1950000.0,
            pump_status='Running',
            system_mode='Auto',
            pump_efficiency=95.4,
            pressure_psi=48.0,
            pumping_station='AquaFair Headworks Station',
            chlorination_ppm=0.8,
            turbidity_ntu=1.2,
            overflow_guard=True,
            overflow_status='Safe (<90%)',
            dry_run_protection=True,
            leak_detection_status='Normal (Zero Active Leaks)',
            abnormal_usage_alerts_count=0,
            water_wastage_prevented_liters=92500.0
        )
    return state

def run_distribution_tick():
    """
    Executes one cycle of the AquaFair Smart Water Monitoring and Equity Engine.
    - Monitors water usage from flow sensors and storage tank.
    - Enforces fair equitable distribution across households.
    - Detects leaks, overflow hazards, and abnormal water draw.
    - Accumulates conserved water metrics.
    """
    state = get_or_create_system_state()
    zones = list(Zone.objects.all().order_by('order', 'ward_number', 'id'))
    if not zones:
        return {'state': state, 'zones': []}

    active_zones = [z for z in zones if z.status not in ['Paused', 'Closed', 'Emergency Isolated', 'Shutdown'] and z.valve_percent > 0]
    non_completed_active = [z for z in active_zones if z.delivered_liters < z.target_liters]

    total_increment = 0.0

    # 1. OVERFLOW, STRATEGIC RESERVE & DRY-RUN GUARD
    MIN_STRATEGIC_RESERVE_PERCENT = 20.0  # Mandatory 20% Strategic Reserve (100,000 L of 500 kL ESR)
    min_reserve_liters = (MIN_STRATEGIC_RESERVE_PERCENT / 100.0) * state.tank_capacity_liters

    tank_pct = (state.tank_level_liters / max(1.0, state.tank_capacity_liters)) * 100.0
    if tank_pct >= 95.0:
        state.overflow_status = 'Overflow Guard Triggered (>95%)'
        if state.pump_status == 'Running':
            state.pump_status = 'Standby'
            SystemAlert.objects.get_or_create(
                title="Storage Tank Overflow Prevented",
                category='overflow',
                resolved=False,
                defaults={
                    'level': 'warning',
                    'message': f"Automated overflow guard engaged at {state.tank_level_liters:,.0f} L. Intake pump automatically stopped to prevent water wastage."
                }
            )
    elif tank_pct <= 12.0:
        state.overflow_status = 'Dry-Run Protection Tripped (<12%)'
        if state.pump_status == 'Running':
            state.pump_status = 'Stopped'
            SystemAlert.objects.get_or_create(
                title="Pump Dry-Run Protection Tripped",
                category='low_water',
                resolved=False,
                defaults={
                    'level': 'critical',
                    'message': f"Water level depleted below 12% ({state.tank_level_liters:,.0f} L). Main distribution pumps halted to prevent cavitation motor burnout."
                }
            )
    elif tank_pct <= MIN_STRATEGIC_RESERVE_PERCENT:
        # Mandatory strategic reserve protected - water MUST remain in tank, tank never empties!
        state.overflow_status = f'Strategic Reserve Protected (20% • {state.tank_level_liters:,.0f} L Remaining)'
        if state.pump_status == 'Running':
            state.pump_status = 'Standby'
            SystemAlert.objects.get_or_create(
                title="Mandatory Strategic Water Reserve Protected",
                category='low_water',
                resolved=False,
                defaults={
                    'level': 'warning',
                    'message': f"Storage reservoir reached mandatory 20% reserve ({state.tank_level_liters:,.0f} L). Outflow automatically halted to protect fire hydrants and lifelines. Storage tank will never become empty."
                }
            )
    elif tank_pct <= 28.0:
        state.overflow_status = f'Reserve Approaching Threshold ({tank_pct:.1f}%)'
    else:
        state.overflow_status = f'Safe ({tank_pct:.1f}%)'

    # 2. REAL-TIME WATER QUALITY MONITORING & CONTAMINATION WATCHDOG (Objectives 1 & 3)
    if not state.contamination_detected:
        state.ph_level = round(max(6.8, min(7.9, 7.4 + (random.random() - 0.5) * 0.08)), 2)
        state.tds_ppm = round(max(150.0, min(220.0, 185.0 + (random.random() - 0.5) * 3.5)), 1)
        state.turbidity_ntu = round(max(0.9, min(1.8, 1.2 + (random.random() - 0.5) * 0.1)), 2)
        state.chlorination_ppm = round(max(0.65, min(0.92, 0.8 + (random.random() - 0.5) * 0.04)), 2)
        state.water_temp_c = round(max(22.5, min(25.5, 24.2 + (random.random() - 0.5) * 0.15)), 1)

        ph_dev = abs(state.ph_level - 7.4) * 10.0
        tds_dev = max(0.0, (state.tds_ppm - 200.0) / 15.0)
        turb_dev = max(0.0, (state.turbidity_ntu - 1.0) * 5.0)
        cl_dev = abs(state.chlorination_ppm - 0.8) * 12.0
        state.water_quality_index = round(max(85.0, min(100.0, 100.0 - ph_dev - tds_dev - turb_dev - cl_dev)), 1)
        state.contamination_status = f'Potable (Grade A Safe Drinking Quality - WQI: {state.water_quality_index}%)'
    else:
        # Contamination detected: Automated Safety Isolation (Objective 3)
        for zone in zones:
            zone.valve_percent = 0
            zone.flow_rate = 0.0
            zone.status = 'Emergency Isolated'
            zone.contamination_detected = True
            zone.save()
        state.pump_status = 'Stopped'
        state.save()
        return {'state': state, 'zones': zones}

    # 3. EQUITABLE WATER ALLOCATION ENGINE WITH LOGICAL VALVE HYDRODYNAMICS
    if state.system_mode == 'Auto' and state.pump_status == 'Running':
        # Supply water available without encroaching upon mandatory reserve
        available_supply_water = max(0.0, state.tank_level_liters - min_reserve_liters)
        if available_supply_water <= 0.0:
            for zone in zones:
                zone.flow_rate = 0.0
                if zone.valve_percent > 0:
                    zone.valve_percent = 0
                    if zone.status not in ['Completed', 'Paused', 'Emergency Isolated']:
                        zone.status = 'Paused'
                zone.save()
            state.pump_status = 'Standby'
            state.save()
            return {'state': state, 'zones': zones}

        # Check if hardware operations are active on any ward
        hw_zone = next((z for z in zones if getattr(z, 'is_hardware_active', False)), None)
        if hw_zone:
            # Hardware Operations Isolation:
            # All other wards are idle/completed; operations run exclusively on the hardware ward
            for z in zones:
                if z.id != hw_zone.id:
                    if z.valve_percent != 0 or z.flow_rate != 0.0 or z.status != 'Completed':
                        z.valve_percent = 0
                        z.flow_rate = 0.0
                        z.status = 'Completed'
                        z.save()
            non_completed_active = [hw_zone] if hw_zone.delivered_liters < hw_zone.target_liters else []

        progresses = [(z.delivered_liters / z.target_liters) if z.target_liters > 0 else 1.0 for z in non_completed_active]
        avg_progress = sum(progresses) / len(progresses) if progresses else 0.0

        for zone in zones:
            if hw_zone and zone.id != hw_zone.id:
                continue

            # If valve is closed or marked Paused/Closed: Flow rate drops to 0 immediately
            is_valve_closed = (zone.valve_percent == 0 or zone.status in ['Paused', 'Closed', 'Valve Closed', 'Shutdown', 'Emergency Isolated'])
            if is_valve_closed:
                zone.flow_rate = 0.0
                zone.valve_percent = 0
                if zone.status not in ['Paused', 'Emergency Isolated', 'Shutdown']:
                    zone.status = 'Paused'
                zone.save()
                continue

            if zone.delivered_liters >= zone.target_liters:
                zone.status = 'Completed'
                zone.flow_rate = 0.0
                zone.valve_percent = 0
                zone.equity_score = 100.0
                zone.save()
                continue

            curr_progress = (zone.delivered_liters / zone.target_liters) if zone.target_liters > 0 else 0
            delta = curr_progress - avg_progress

            # Dynamic Valve Trimming for Fair Parity (Only for open valves)
            if delta > 0.015:
                throttle_amount = int(min(60, delta * 350))
                zone.valve_percent = max(35, 95 - throttle_amount)
                zone.status = 'Throttled'
            elif delta < -0.015:
                zone.valve_percent = 100
                zone.status = 'Balanced'
            else:
                zone.valve_percent = 92
                zone.status = 'Balanced'

            # Flow calculation from smart flow sensors proportional to valve aperture
            pressure_factor = state.pressure_psi / 48.0
            base_flow = (zone.valve_percent / 100.0) * 19.5 * pressure_factor
            jitter = (random.random() - 0.5) * 0.4
            flow = max(0.0, round(base_flow + jitter, 1))
            zone.flow_rate = flow

            # Delivered water calculation: ONLY SUPPLY REQUIRED WATER
            households = max(1, zone.households_count or 1)
            per_family_inc = (flow / 19.5) * 5.0
            raw_increment = round(per_family_inc * households, 1)

            # Cap strictly to remaining required water for the ward
            remaining_required = max(0.0, zone.target_liters - zone.delivered_liters)
            increment = min(raw_increment, remaining_required)

            if zone.delivered_liters + increment >= zone.target_liters:
                zone.delivered_liters = zone.target_liters
                zone.status = 'Completed'
                zone.flow_rate = 0.0
                zone.valve_percent = 0
                zone.equity_score = 100.0
            else:
                zone.delivered_liters = round(zone.delivered_liters + increment, 1)
                zone.equity_score = round(max(90.0, min(100.0, 100.0 - abs(delta) * 100.0)), 1)

            # 4. LEAK & ABNORMAL USAGE WATCHDOG
            if zone.flow_rate > 22.0:
                zone.abnormal_usage_detected = True
                state.abnormal_usage_alerts_count += 1
            elif not getattr(zone, '_simulated_abnormal', False):
                zone.abnormal_usage_detected = False

            zone.save()
            total_increment += increment

            # Save snapshot telemetry
            if random.random() < 0.2:
                TelemetryReading.objects.create(
                    zone=zone,
                    flow_rate=zone.flow_rate,
                    delivered_snapshot=zone.delivered_liters,
                    valve_percent=zone.valve_percent,
                    pressure_bar=round(state.pressure_psi * 0.0689, 2),
                    is_anomaly=zone.abnormal_usage_detected or zone.leak_detected
                )

        # Update Storage Tank & Water Conserved: PRESERVE MANDATORY STRATEGIC RESERVE
        actual_drainage = min(total_increment, available_supply_water)
        new_tank_level = max(min_reserve_liters, round(state.tank_level_liters - actual_drainage, 1))
        state.tank_level_liters = new_tank_level
        state.water_wastage_prevented_liters = round(state.water_wastage_prevented_liters + (actual_drainage * 0.12), 1)
        state.pump_efficiency = round(max(88.0, min(99.0, 95.4 + (random.random() - 0.5) * 1.2)), 1)
        state.pressure_psi = round(max(38.0, min(58.0, 48.0 + (random.random() - 0.5) * 1.5)), 1)

        if new_tank_level <= min_reserve_liters:
            state.pump_status = 'Standby'
            state.overflow_status = f'Strategic Reserve Protected (20% • {new_tank_level:,.0f} L Remaining)'

        # Check if all completed
        all_done = all(z.delivered_liters >= z.target_liters or z.status == 'Paused' or z.valve_percent == 0 for z in zones)
        if all_done and non_completed_active:
            state.pump_status = 'Standby'
            SystemAlert.objects.get_or_create(
                title="AquaFair Quota Allocation Complete",
                category='equity',
                defaults={
                    'level': 'info',
                    'message': f'All connected households have received 100% of their equitable daily water quota. Supply automatically halted; {state.tank_level_liters:,.0f} L remains safely in ESR.'
                }
            )

        state.save()

    elif state.system_mode == 'Manual':
        available_supply_water = max(0.0, state.tank_level_liters - min_reserve_liters)
        if state.pump_status == 'Running' and available_supply_water > 0.0:
            for zone in zones:
                is_closed = (zone.valve_percent == 0 or zone.status in ['Paused', 'Closed', 'Shutdown', 'Emergency Isolated'])
                if not is_closed and zone.delivered_liters < zone.target_liters:
                    flow = round((zone.valve_percent / 100.0) * 19.0 + (random.random() - 0.5) * 0.4, 1)
                    zone.flow_rate = flow
                    households = max(1, zone.households_count or 1)
                    per_family_inc = (flow / 19.0) * 5.0
                    raw_inc = round(per_family_inc * households, 1)
                    remaining_req = max(0.0, zone.target_liters - zone.delivered_liters)
                    increment = min(raw_inc, remaining_req)
                    zone.delivered_liters = round(zone.delivered_liters + increment, 1)
                    if zone.delivered_liters >= zone.target_liters:
                        zone.status = 'Completed'
                        zone.flow_rate = 0.0
                        zone.valve_percent = 0
                    zone.save()
                    total_increment += increment
                else:
                    zone.flow_rate = 0.0
                    if is_closed:
                        zone.valve_percent = 0
                    zone.save()
            actual_drain = min(total_increment, available_supply_water)
            state.tank_level_liters = max(min_reserve_liters, round(state.tank_level_liters - actual_drain, 1))
            if state.tank_level_liters <= min_reserve_liters:
                state.pump_status = 'Standby'
                state.overflow_status = f'Strategic Reserve Protected (20% • {state.tank_level_liters:,.0f} L Remaining)'
            state.save()
        else:
            for zone in zones:
                zone.flow_rate = 0.0
                zone.save()
            state.save()
    else:
        for zone in zones:
            zone.flow_rate = 0.0
            zone.save()
        state.save()

    # Calculate logical municipal water supply rate & closed valve reduction
    total_supply_rate = round(sum(z.flow_rate for z in zones), 1)
    nominal_supply_rate = round(len(zones) * 18.5, 1) if zones else 74.0
    closed_valves_count = sum(1 for z in zones if (z.status in ['Paused', 'Closed', 'Emergency Isolated'] or (z.valve_percent == 0 and z.status != 'Completed')))
    supply_reduction_pct = round(max(0.0, min(100.0, (1.0 - (total_supply_rate / nominal_supply_rate)) * 100.0)), 1) if (closed_valves_count > 0 and nominal_supply_rate > 0) else 0.0
    closed_ward_names = [z.name for z in zones if (z.status in ['Paused', 'Closed', 'Emergency Isolated'] or (z.valve_percent == 0 and z.status != 'Completed'))]

    return {
        'state': state,
        'zones': zones,
        'supply_metrics': {
            'total_supply_rate_lpm': total_supply_rate,
            'nominal_supply_rate_lpm': nominal_supply_rate,
            'supply_reduction_pct': supply_reduction_pct,
            'closed_valves_count': closed_valves_count,
            'closed_ward_names': closed_ward_names
        }
    }


def simulate_anomaly(action):
    """
    Triggers simulated real-time anomalies for testing and demonstration:
    - trigger_leak: Flags pipe burst/leak in Ward 3 with pressure drop
    - simulate_overflow: Fills tank to 97% to test automated pump shutoff
    - simulate_low_water: Depletes tank to 19% to test low-water warning
    - simulate_abnormal_usage: Triggers suction pump / rapid unmetered draw in Ward 1
    - reset_simulation: Restores nominal balanced operations
    """
    state = get_or_create_system_state()
    zones = list(Zone.objects.all().order_by('order', 'ward_number', 'id'))

    if action == 'trigger_leak':
        target_zone = zones[2] if len(zones) > 2 else zones[0]
        target_zone.leak_detected = True
        target_zone.save()
        state.pressure_psi = 32.5
        state.leak_detection_status = f'Active Micro-Leak Detected ({target_zone.name})'
        state.save()

        SystemAlert.objects.create(
            level='critical',
            category='leak',
            title=f'Micro-Leak Detected in {target_zone.name}',
            message=f'Differential telemetry sensors detected a 4.5 L/min flow deficit with line pressure drop to 32.5 PSI. Automated isolation recommended.'
        )

    elif action == 'simulate_overflow':
        state.tank_level_liters = 485000.0  # 97%
        state.overflow_status = 'Overflow Guard Triggered (>95%)'
        state.pump_status = 'Standby'
        state.save()

        SystemAlert.objects.create(
            level='warning',
            category='overflow',
            title='Storage Reservoir Overflow Prevented (>95%)',
            message='Storage reservoir reached 4,85,000 L (97% capacity). Automated inlet cutoff engaged immediately, saving water from spillage.'
        )

    elif action == 'simulate_low_water':
        state.tank_level_liters = 95000.0  # 19%
        state.overflow_status = 'Low Water Reserve Warning (19%)'
        state.save()

        SystemAlert.objects.create(
            level='warning',
            category='low_water',
            title='Storage Reservoir Low Water Reserve Alert',
            message='Storage reservoir depleted to 95,000 L (19% capacity). Upstream intake pumps alerted to refill reservoir before next supply window.'
        )

    elif action == 'simulate_abnormal_usage':
        target_zone = zones[0] if zones else None
        if target_zone:
            target_zone.flow_rate = 26.8
            target_zone.abnormal_usage_detected = True
            target_zone.save()
            state.abnormal_usage_alerts_count += 1
            state.save()

            SystemAlert.objects.create(
                level='warning',
                category='abnormal',
                title=f'Abnormal Suction / Excessive Draw in {target_zone.name}',
                message=f'Flow sensor detected rapid 26.8 L/min draw exceeding standard household gravity limit. Potential unauthorized booster motor in Lane 3.'
            )

    elif action == 'simulate_contamination':
        state.ph_level = 5.4  # Severe acidic drop
        state.tds_ppm = 680.0  # Heavy dissolved solids
        state.turbidity_ntu = 8.6  # Turbidity spike
        state.chlorination_ppm = 0.12  # Disinfection failed
        state.water_quality_index = 38.5  # Hazardous
        state.contamination_detected = True
        state.contamination_status = 'EMERGENCY: Contamination Detected (pH 5.4, TDS 680) - Distribution Valves Isolated'
        state.pump_status = 'Stopped'
        state.save()

        for z in zones:
            z.valve_percent = 0
            z.flow_rate = 0.0
            z.status = 'Emergency Isolated'
            z.contamination_detected = True
            z.ph_level = 5.4
            z.save()

        SystemAlert.objects.create(
            level='critical',
            category='contamination',
            title='EMERGENCY: Early Stage Water Contamination Detected',
            message='Multi-parameter IoT water quality sensors flagged severe chemical anomaly: pH 5.4 (<6.5) and TDS 680 ppm (>500 ppm). Automated safety watchdog has immediately isolated all motorized distribution sluice valves to prevent toxic water from reaching citizen homes.'
        )

    elif action == 'reset_simulation':
        for z in zones:
            z.leak_detected = False
            z.abnormal_usage_detected = False
            z.contamination_detected = False
            z.ph_level = 7.4
            z.flow_rate = 18.2
            z.valve_percent = 92
            z.status = 'Balanced'
            per_hh = 490.0
            z.delivered_liters = round(min(z.target_liters, (z.households_count or 1) * per_hh), 1)
            z.equity_score = 99.2
            z.save()
        state.tank_capacity_liters = 2500000.0
        state.tank_level_liters = 1950000.0
        state.pressure_psi = 48.0
        state.ph_level = 7.4
        state.tds_ppm = 185.0
        state.turbidity_ntu = 1.2
        state.chlorination_ppm = 0.8
        state.water_temp_c = 24.2
        state.water_quality_index = 96.5
        state.contamination_detected = False
        state.contamination_status = 'Potable (Grade A Safe Drinking Quality)'
        state.pump_status = 'Running'
        state.system_mode = 'Auto'
        state.overflow_status = 'Safe (78%)'
        state.leak_detection_status = 'Normal (Zero Active Leaks)'
        state.save()

        SystemAlert.objects.create(
            level='info',
            category='quality',
            title='AquaFair Potable Quality & Nominal Equilibrium Restored',
            message='Simulation reset: Storage reservoir at 78% capacity, Grade A potable water (WQI 96.5%), zero active leaks or contamination alerts.'
        )

    return {'state': state, 'zones': zones}


