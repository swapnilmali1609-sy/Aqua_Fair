// AquaFair API Service - Smart Water Monitoring and Equity System
const API_BASE = (import.meta.env?.VITE_API_BASE || import.meta.env?.VITE_API_URL || '/api').replace(/\/+$/, '');

// Initial fallback mock state (mirrors AquaFair Django models)
let localState = {
  system: {
    id: 1,
    tank_name: 'AquaFair Municipal Storage Reservoir (ESR)',
    tank_capacity_liters: 2500000,
    tank_level_liters: 1950000,
    pump_status: 'Running',
    system_mode: 'Auto',
    pump_efficiency: 95.4,
    pressure_psi: 48.0,
    pumping_station: 'AquaFair Central Headworks Pumping Station',
    chlorination_ppm: 0.8,
    turbidity_ntu: 1.2,
    ph_level: 7.4,
    tds_ppm: 185.0,
    water_temp_c: 24.2,
    water_quality_index: 96.5,
    contamination_detected: false,
    contamination_status: 'Potable (Grade A Safe Drinking Quality)',
    overflow_guard: true,
    overflow_status: 'Safe (78% Capacity)',
    dry_run_protection: true,
    leak_detection_status: 'Normal (Zero Active Leaks)',
    abnormal_usage_alerts_count: 0,
    water_wastage_prevented_liters: 92500,
    tank_percentage: 78.0
  },
  zones: [
    {
      id: 1,
      ward_number: 1,
      name: 'Ward 1 - Shivaji Nagar',
      sector_type: 'Residential Lowland',
      households_count: 250,
      target_liters: 125000,
      delivered_liters: 122500,
      flow_rate: 18.2,
      valve_percent: 88,
      status: 'Balanced',
      elevation_tier: 'Lowland',
      supply_timing: '06:00 AM - 08:30 AM',
      leak_detected: false,
      abnormal_usage_detected: false,
      equity_score: 99.2,
      progress_percent: 98.0,
      per_household_delivered: 490.0,
      per_household_target: 500.0
    },
    {
      id: 2,
      ward_number: 2,
      name: 'Ward 2 - Gandhi Ward',
      sector_type: 'Market & Residential',
      households_count: 280,
      target_liters: 140000,
      delivered_liters: 140000,
      flow_rate: 0.0,
      valve_percent: 0,
      status: 'Completed',
      elevation_tier: 'Standard',
      supply_timing: '06:00 AM - 08:30 AM',
      leak_detected: false,
      abnormal_usage_detected: false,
      equity_score: 100.0,
      progress_percent: 100.0,
      per_household_delivered: 500.0,
      per_household_target: 500.0
    },
    {
      id: 3,
      ward_number: 3,
      name: 'Ward 3 - Subhash Nagar',
      sector_type: 'Elevated Ridge Mohalla',
      households_count: 220,
      target_liters: 110000,
      delivered_liters: 108200,
      flow_rate: 18.8,
      valve_percent: 96,
      status: 'Balanced',
      elevation_tier: 'High-Altitude',
      supply_timing: '06:00 AM - 08:30 AM',
      leak_detected: false,
      abnormal_usage_detected: false,
      equity_score: 98.8,
      progress_percent: 98.4,
      per_household_delivered: 491.8,
      per_household_target: 500.0
    },
    {
      id: 4,
      ward_number: 4,
      name: 'Ward 4 - Ambedkar Ward',
      sector_type: 'Tail-End Sector',
      households_count: 260,
      target_liters: 130000,
      delivered_liters: 126800,
      flow_rate: 18.5,
      valve_percent: 100,
      status: 'Balanced',
      elevation_tier: 'Tail-End',
      supply_timing: '06:00 AM - 08:30 AM',
      leak_detected: false,
      abnormal_usage_detected: false,
      equity_score: 98.2,
      progress_percent: 97.5,
      per_household_delivered: 487.7,
      per_household_target: 500.0
    }
  ],
  alerts: [
    {
      id: 1,
      level: 'warning',
      category: 'equity',
      title: 'High-Altitude Ridge Elevation Equalized',
      message: 'Subhash Nagar motorized sluice valve trimmed to 96% to compensate for +18m elevation head loss and protect household tap pressure.',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      resolved: false
    },
    {
      id: 2,
      level: 'info',
      category: 'overflow',
      title: 'Storage Tank Overflow Guard Armed',
      message: 'ESR level operating safely at 3,90,000 L (78% capacity). Automated 95% overflow cutoff protection active.',
      timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
      resolved: false
    },
    {
      id: 3,
      level: 'info',
      category: 'leak',
      title: 'Nocturnal Leak Scan Verified Zero Loss',
      message: 'Baseline differential pressure tests confirmed zero pipe bursts or unmetered leaks across all 4 ward feeder mains.',
      timestamp: new Date(Date.now() - 65 * 60000).toISOString(),
      resolved: false
    },
    {
      id: 4,
      level: 'info',
      category: 'equity',
      title: 'AquaFair Morning Shift: 1,010 Households Supplying',
      message: 'Fair distribution active with 500 L per family quota. City-wide equity parity index: 99.1%.',
      timestamp: new Date(Date.now() - 95 * 60000).toISOString(),
      resolved: false
    }
  ],
  households: (() => {
    const firstNames = [
      'Ramesh', 'Suresh', 'Aniket', 'Vikram', 'Sunita', 'Ganpat', 'Meena', 'Nitin',
      'Rekha', 'Ashok', 'Pratibha', 'Dattatray', 'Kavita', 'Mahesh', 'Pooja', 'Rajendra',
      'Balasaheb', 'Suman', 'Deepak', 'Alka', 'Kishor', 'Santosh', 'Sanjay', 'Priya',
      'Ganesh', 'Dhananjay', 'Savita', 'Amol', 'Surekha', 'Bapu', 'Vandana', 'Sachin',
      'Siddharth', 'Mangala', 'Vijay', 'Rohit', 'Anita', 'Rahul', 'Prakash', 'Shalini',
      'Ajay', 'Varsha', 'Kailash', 'Usha', 'Manoj', 'Jyoti', 'Pradeep', 'Sarita',
      'Avinash', 'Chhaya', 'Sunil', 'Sangita', 'Vinod', 'Madhuri', 'Satish', 'Smita'
    ];
    const lastNames = [
      'Patil', 'Deshmukh', 'Kulkarni', 'Jadhav', 'Shinde', 'Pawar', 'Bhosale', 'Chavan',
      'More', 'Salunkhe', 'Kadam', 'Mane', 'Joshi', 'Jagtap', 'Thorat', 'Shaha',
      'Sawant', 'Deshpande', 'Gaikwad', 'Kale', 'Kamble', 'Salve', 'Waghmare', 'Lokhande',
      'Ghorpade', 'Babar', 'Kharat', 'Bhide', 'Kore', 'Ghuge', 'Raut', 'Mali'
    ];
    const wardConfigs = [
      {
        id: 1,
        ward_number: 1,
        name: 'Ward 1 - Shivaji Nagar',
        count: 250,
        lanes: ['Lane 1 (Old Bazaar)', 'Lane 2 (Shivaji Chowk)', 'Lane 3 (Samarth Nagar)', 'Lane 4 (Subhash Marg)', 'Lane 5 (Hanuman Mandir)', 'Lane 6 (Zilla Parishad Road)', 'Lane 7 (Post Office Road)', 'Lane 8 (Maruti Galli)']
      },
      {
        id: 2,
        ward_number: 2,
        name: 'Ward 2 - Gandhi Ward',
        count: 280,
        lanes: ['Gandhi Chowk Main', 'Vegetable Mandi Lane 1', 'Vegetable Mandi Lane 2', 'Bazaar Peth Lane 3', 'Bazaar Peth Lane 4', 'Hospital Road', 'Station Road Sector 1', 'Station Road Sector 2', 'Kapad Bazaar Galli']
      },
      {
        id: 3,
        ward_number: 3,
        name: 'Ward 3 - Subhash Nagar',
        count: 220,
        lanes: ['Subhash Chowk Central', 'High-Altitude Ridge Lane 1', 'High-Altitude Ridge Lane 2', 'Hill View Colony Lane 3', 'Tail-End Ridge Sector 4', 'Water Tank Road Lane 5', 'Mali Galli Lane 6']
      },
      {
        id: 4,
        ward_number: 4,
        name: 'Ward 4 - Ambedkar Ward',
        count: 260,
        lanes: ['Ambedkar Chowk Main', 'Samata Nagar Lane 1', 'Samata Nagar Lane 2', 'Ring Road Sector 4', 'Bhim Nagar Main Road', 'Vikas Nagar Lane 3', 'School Road Near ZP', 'Tail-End Garden Lane 5']
      }
    ];

    const list = [];
    let idCounter = 1;

    wardConfigs.forEach(w => {
      for (let i = 1; i <= w.count; i++) {
        const hhNum = (w.ward_number * 1000) + i;
        let hhId = `AF-W${w.ward_number}-${hhNum}`;
        const fn = firstNames[(i * 3 + w.ward_number * 7) % firstNames.length];
        const ln = lastNames[(i * 5 + w.ward_number * 11) % lastNames.length];
        let owner = `${fn} ${ln}`;

        if (hhNum === 1042) {
          owner = 'Aniket Kulkarni (Patil Family)';
          hhId = 'AF-W1-1042';
        }

        const lane = w.lanes[(i - 1) % w.lanes.length];
        const address = `House #${i}, ${lane}`;
        const phone = `98${w.ward_number}${10 + (i % 89)}${10000 + ((i * 137) % 90000)}`;
        const members = i % 5 === 0 ? 3 : i % 7 === 0 ? 5 : i % 11 === 0 ? 6 : 4;
        const quota = members * 135;
        const isAbnormal = (w.ward_number === 1 && (i === 4 || i === 63)) || (w.ward_number === 2 && (i === 29 || i === 88)) || (w.ward_number === 3 && i === 14);
        const usage = isAbnormal ? Math.round(quota * 1.18) : Math.round(quota * (0.68 + ((i % 25) / 100)));
        const extraGranted = (i === 2 || i === 18) ? 500 : 0;

        list.push({
          id: idCounter++,
          zone: w.id,
          ward_number: w.ward_number,
          zone_name: w.name,
          household_id: hhId,
          owner_name: owner,
          address_or_lane: address,
          phone: phone,
          members_count: members,
          daily_quota_liters: quota,
          current_usage_liters: usage,
          meter_status: isAbnormal ? 'Flagged' : 'Active',
          abnormal_draw: isAbnormal,
          extra_water_granted: extraGranted,
          usage_percent: Math.min(100, Math.round((usage / (quota + extraGranted)) * 100)),
          effective_quota: quota + extraGranted
        });
      }
    });

    return list;
  })(),
  demands: [
    { id: 1, household: 1, household_owner: 'Ramesh Patil', household_code: 'AF-W1-1001', zone: 1, zone_name: 'Ward 1 - Shivaji Nagar', requested_by: 'Ramesh Patil', extra_liters: 500.0, reason: 'Daughter Wedding Ceremony in Home', urgency: 'High', status: 'Pending', notes: 'Need water for 40 guests visiting today evening', created_at: new Date(Date.now() - 40 * 60000).toISOString() },
    { id: 2, household: 29, household_owner: 'Deepak Sawant', household_code: 'AF-W2-2158', zone: 2, zone_name: 'Ward 2 - Gandhi Ward', requested_by: 'Deepak Sawant', extra_liters: 400.0, reason: 'Groundwater Sump Construction & Curing', urgency: 'Normal', status: 'Pending', notes: 'Civil work curing requires temporary allocation', created_at: new Date(Date.now() - 90 * 60000).toISOString() }
  ],
  grievances: [
    {
      id: 1,
      ticket_code: 'AF-GRV-101',
      citizen_name: 'Aniket Kulkarni',
      phone: '9822014589',
      ward_id: 1,
      ward_number: 1,
      ward_name: 'Ward 1 - Shivaji Nagar',
      location: 'House #42, Lane 2 (Shivaji Chowk)',
      incident_type: 'Pipeline Leak / Burst',
      priority: 'Critical',
      status: 'Field Team Dispatched',
      assigned_technician: 'Rajesh Shinde (Lead Line Inspector)',
      dispatched_at: new Date(Date.now() - 45 * 60000).toISOString(),
      eta_minutes: 25,
      description: 'Main distribution lateral leaking clean water onto road. Pressure drop observed at end of lane.',
      resolution_notes: '',
      created_at: new Date(Date.now() - 90 * 60000).toISOString()
    },
    {
      id: 2,
      ticket_code: 'AF-GRV-102',
      citizen_name: 'Sunita Bhosale',
      phone: '9833451290',
      ward_id: 3,
      ward_number: 3,
      ward_name: 'Ward 3 - Subhash Nagar',
      location: 'House #14, High-Altitude Ridge Lane 1',
      incident_type: 'Low Water Pressure',
      priority: 'High',
      status: 'Pending Investigation',
      assigned_technician: 'Unassigned',
      dispatched_at: null,
      eta_minutes: null,
      description: 'Elevation head loss causing trickle flow during morning shift. Water not reaching elevated tank.',
      resolution_notes: '',
      created_at: new Date(Date.now() - 120 * 60000).toISOString()
    },
    {
      id: 3,
      ticket_code: 'AF-GRV-103',
      citizen_name: 'Ganpat Jadhav',
      phone: '9855123499',
      ward_id: 2,
      ward_number: 2,
      ward_name: 'Ward 2 - Gandhi Ward',
      location: 'House #88, Vegetable Mandi Lane 2',
      incident_type: 'Unauthorized Suction Motor Detected',
      priority: 'High',
      status: 'In Progress',
      assigned_technician: 'Suresh Mane (Enforcement Officer)',
      dispatched_at: new Date(Date.now() - 30 * 60000).toISOString(),
      eta_minutes: 15,
      description: 'Neighbor running 1.5 HP inline suction motor directly on municipal feeder, causing negative pressure in adjacent homes.',
      resolution_notes: '',
      created_at: new Date(Date.now() - 150 * 60000).toISOString()
    },
    {
      id: 4,
      ticket_code: 'AF-GRV-104',
      citizen_name: 'Meena Chavan',
      phone: '9866782341',
      ward_id: 4,
      ward_number: 4,
      ward_name: 'Ward 4 - Ambedkar Ward',
      location: 'House #19, Samata Nagar Lane 1',
      incident_type: 'Pipeline Sluice Valve Malfunction',
      priority: 'Normal',
      status: 'Resolved',
      assigned_technician: 'Amol Raut (Technician)',
      dispatched_at: new Date(Date.now() - 240 * 60000).toISOString(),
      eta_minutes: 0,
      description: 'Secondary line sluice valve jammed at 30% aperture. Line team serviced spindle and restored full flow.',
      resolution_notes: 'Replaced rubber gasket and greased gate spindle. Nominal 18.5 L/min flow restored.',
      created_at: new Date(Date.now() - 300 * 60000).toISOString(),
      resolved_at: new Date(Date.now() - 60 * 60000).toISOString()
    }
  ],
  tankers: [
    {
      id: 1,
      dispatch_code: 'TNK-MH12-101',
      vehicle_no: 'MH-12-AQ-101',
      driver_name: 'Sitaram Gaikwad',
      driver_phone: '9822456789',
      capacity_liters: 10000,
      target_ward_id: 3,
      target_ward_number: 3,
      target_ward_name: 'Ward 3 - Subhash Nagar',
      destination_location: 'Subhash Chowk Central Community Tank',
      requester_name: 'Ward 3 Mohalla Committee',
      purpose: 'Ridge elevation pressure compensation for 40 hilltop families',
      status: 'In Transit',
      departure_time: new Date(Date.now() - 25 * 60000).toISOString(),
      delivered_at: null,
      notes: 'Water drawn from central ESR headworks. Grade A Potable certified.'
    },
    {
      id: 2,
      dispatch_code: 'TNK-MH12-102',
      vehicle_no: 'MH-12-AQ-102',
      driver_name: 'Dattatray Shaha',
      driver_phone: '9844567890',
      capacity_liters: 5000,
      target_ward_id: 1,
      target_ward_number: 1,
      target_ward_name: 'Ward 1 - Shivaji Nagar',
      destination_location: 'Maruti Galli Community Sump',
      requester_name: 'Ramesh Patil (Social Event)',
      purpose: 'Sanctioned extra water for community marriage gathering',
      status: 'Delivered',
      departure_time: new Date(Date.now() - 110 * 60000).toISOString(),
      delivered_at: new Date(Date.now() - 40 * 60000).toISOString(),
      notes: 'Receipt verified by resident with digital signature.'
    },
    {
      id: 3,
      dispatch_code: 'TNK-MH12-103',
      vehicle_no: 'MH-12-AQ-103',
      driver_name: 'Vinod More',
      driver_phone: '9855678901',
      capacity_liters: 5000,
      target_ward_id: 4,
      target_ward_number: 4,
      target_ward_name: 'Ward 4 - Ambedkar Ward',
      destination_location: 'Tail-End Garden Sector',
      requester_name: 'Municipal Line Repair Outage Backup',
      purpose: 'Standby potable supply during nocturnal valve servicing',
      status: 'Scheduled',
      departure_time: new Date(Date.now() + 45 * 60000).toISOString(),
      delivered_at: null,
      team_members: 'Mahesh Kamble (Valve Tech)',
      notes: 'Scheduled for 02:00 PM shift.'
    }
  ],
  fleetTankers: [
    {
      id: 1,
      vehicle_no: 'MH-12-AQ-101',
      tanker_name: 'Aqua Titan 1',
      capacity_liters: 10000,
      model_make: 'Tata 1613 SE',
      ownership_type: 'Municipal Owned',
      status: 'In Transit',
      gps_tracking_id: 'GPS-MH12-101',
      notes: 'Heavy capacity municipal fleet tanker assigned to core pressure deficits.'
    },
    {
      id: 2,
      vehicle_no: 'MH-12-AQ-102',
      tanker_name: 'Aqua Star 2',
      capacity_liters: 5000,
      model_make: 'Eicher Pro 2049',
      ownership_type: 'Municipal Owned',
      status: 'Available',
      gps_tracking_id: 'GPS-MH12-102',
      notes: 'Medium capacity agile tanker for narrow lane distribution.'
    },
    {
      id: 3,
      vehicle_no: 'MH-12-AQ-204',
      tanker_name: 'Aqua Cruiser 3',
      capacity_liters: 8000,
      model_make: 'BharatBenz 1217C',
      ownership_type: 'Municipal Owned',
      status: 'Available',
      gps_tracking_id: 'GPS-MH12-204',
      notes: 'High-torque tanker fitted with stainless steel Grade A food grade tank.'
    },
    {
      id: 4,
      vehicle_no: 'MH-14-BT-505',
      tanker_name: 'Jal Rath Express',
      capacity_liters: 12000,
      model_make: 'Ashok Leyland Ecomet',
      ownership_type: 'Contractor Leased',
      status: 'Available',
      gps_tracking_id: 'GPS-MH14-505',
      notes: 'Contractor leased emergency relief carrier on standby at Headworks.'
    }
  ],
  fleetDrivers: [
    {
      id: 1,
      name: 'Sitaram Gaikwad',
      phone: '9822456789',
      license_number: 'MH12-2014-004312',
      experience_years: 10,
      emergency_contact: '9822001144',
      status: 'On Route',
      assigned_tanker_vehicle: 'MH-12-AQ-101',
      notes: 'Lead heavy vehicle certified driver. 10 years municipal service.'
    },
    {
      id: 2,
      name: 'Kishor Shinde',
      phone: '9822567890',
      license_number: 'MH12-2017-009843',
      experience_years: 7,
      emergency_contact: '9822001155',
      status: 'Available',
      assigned_tanker_vehicle: 'MH-12-AQ-102',
      notes: 'Experienced in hilly high-altitude narrow lane maneuvering.'
    },
    {
      id: 3,
      name: 'Suresh Pawar',
      phone: '9822334455',
      license_number: 'MH14-2018-009112',
      experience_years: 8,
      emergency_contact: '9822001166',
      status: 'Available',
      assigned_tanker_vehicle: 'MH-12-AQ-204',
      notes: 'Certified commercial tanker operator on day standby shift.'
    },
    {
      id: 4,
      name: 'Ramesh Kadam',
      phone: '9822114477',
      license_number: 'MH12-2015-004523',
      experience_years: 11,
      emergency_contact: '9822001177',
      status: 'Available',
      assigned_tanker_vehicle: 'MH-14-BT-505',
      notes: 'Senior emergency relief driver, night shift roster.'
    }
  ],
  dispatchTeam: [
    {
      id: 1,
      name: 'Ganesh Shinde',
      role: 'Valve Technician',
      phone: '9890112233',
      badge_id: 'NP-VALVE-01',
      status: 'Assigned',
      ward_assignment: 'Ward 1 & Ward 3',
      notes: 'Operates distribution discharge manifold and flow regulators.'
    },
    {
      id: 2,
      name: 'Suresh More',
      role: 'Field Supervisor',
      phone: '9890223344',
      badge_id: 'NP-SUPV-04',
      status: 'Active',
      ward_assignment: 'All Wards',
      notes: 'Verifies equity distribution volume and logs delivery receipts.'
    },
    {
      id: 3,
      name: 'Ajay Jadhav',
      role: 'Security & Queue Escort',
      phone: '9890334455',
      badge_id: 'NP-ESCRT-12',
      status: 'Assigned',
      ward_assignment: 'Ward 3 & Ward 4',
      notes: 'Maintains orderly resident lines and ensures senior citizen priority.'
    },
    {
      id: 4,
      name: 'Sunil Gaikwad',
      role: 'Sanitation & Chlorination Crew',
      phone: '9890445566',
      badge_id: 'NP-CHLOR-07',
      status: 'Active',
      ward_assignment: 'All Wards',
      notes: 'Tests chlorine ppm level and water potability at point of discharge.'
    },
    {
      id: 5,
      name: 'Mahesh Kamble',
      role: 'Valve Technician',
      phone: '9890556677',
      badge_id: 'NP-VALVE-03',
      status: 'Active',
      ward_assignment: 'Ward 2 & Ward 4',
      notes: 'Field technician specialized in rapid hose and hydrant coupling.'
    }
  ]
};

// Hydrate custom imported Nagar Parishad data from localStorage if present
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const savedZones = localStorage.getItem('aquafair_custom_zones');
    if (savedZones) {
      const parsed = JSON.parse(savedZones);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sanitize any previous bug state (e.g. Ward 5 throttled to 53% with stuck 1L delivery)
        const hasBuggyThrottle = parsed.some(z => (z.valve_percent === 53 && z.status === 'Throttled') || (z.households_count <= 2 && z.delivered_liters > 50 && parsed.some(other => other.delivered_liters <= 5)));
        if (hasBuggyThrottle) {
          parsed.forEach(z => {
            z.valve_percent = 92;
            z.status = 'Balanced';
            z.flow_rate = 18.5;
            // Restore nominal shift delivery
            const hh = Math.max(1, z.households_count || 1);
            z.delivered_liters = Math.round(z.target_liters * 0.98);
            z.per_household_delivered = Math.round(z.delivered_liters / hh);
            z.progress_percent = 98.0;
            z.equity_score = 99.2;
          });
          localStorage.setItem('aquafair_custom_zones', JSON.stringify(parsed));
        }
        localState.zones = parsed;
      }
    }
    const savedHouseholds = localStorage.getItem('aquafair_custom_households');
    if (savedHouseholds) {
      const parsedH = JSON.parse(savedHouseholds);
      if (Array.isArray(parsedH) && parsedH.length > 0) {
        localState.households = parsedH;
      }
    }
  }
} catch (e) {
  console.warn('Could not hydrate custom Nagar Parishad data from localStorage:', e);
}

if (!Array.isArray(localState.households) || localState.households.length === 0) {
  localState.households = [
    {
      id: 1,
      zone: 1,
      zone_name: 'Ward 1 - Shivaji Nagar',
      ward_number: 1,
      household_id: 'AF-W1-1042',
      owner_name: 'Ramesh Patil',
      address_or_lane: 'House #42, Lane 2, Shivaji Chowk',
      phone: '9876543210',
      members_count: 4,
      daily_quota_liters: 540,
      current_usage_liters: 285,
      meter_status: 'Active',
      abnormal_draw: false,
      extra_water_granted: 0.0,
      usage_percent: 53,
      effective_quota: 540
    },
    {
      id: 2,
      zone: 1,
      zone_name: 'Ward 1 - Shivaji Nagar',
      ward_number: 1,
      household_id: 'AF-W1-1043',
      owner_name: 'Suresh Shinde',
      address_or_lane: 'House #43, Lane 2, Shivaji Chowk',
      phone: '9822113355',
      members_count: 5,
      daily_quota_liters: 675,
      current_usage_liters: 320,
      meter_status: 'Active',
      abnormal_draw: false,
      extra_water_granted: 0.0,
      usage_percent: 47,
      effective_quota: 675
    },
    {
      id: 3,
      zone: 2,
      zone_name: 'Ward 2 - Gandhi Ward',
      ward_number: 2,
      household_id: 'AF-W2-2051',
      owner_name: 'Anjali Deshmukh',
      address_or_lane: 'Plot #12, Market Road',
      phone: '9833445566',
      members_count: 4,
      daily_quota_liters: 540,
      current_usage_liters: 310,
      meter_status: 'Active',
      abnormal_draw: false,
      extra_water_granted: 0.0,
      usage_percent: 57,
      effective_quota: 540
    },
    {
      id: 4,
      zone: 3,
      zone_name: 'Ward 3 - Subhash Nagar',
      ward_number: 3,
      household_id: 'AF-W3-3012',
      owner_name: 'Prakash Jadhav',
      address_or_lane: 'Lane 4, Subhash Hill',
      phone: '9844556677',
      members_count: 3,
      daily_quota_liters: 405,
      current_usage_liters: 240,
      meter_status: 'Active',
      abnormal_draw: false,
      extra_water_granted: 0.0,
      usage_percent: 59,
      effective_quota: 405
    },
    {
      id: 5,
      zone: 4,
      zone_name: 'Ward 4 - Ambedkar Ward',
      ward_number: 4,
      household_id: 'AF-W4-4088',
      owner_name: 'Sunita Kamble',
      address_or_lane: 'Samata Nagar Lane 1',
      phone: '9855667788',
      members_count: 6,
      daily_quota_liters: 810,
      current_usage_liters: 450,
      meter_status: 'Active',
      abnormal_draw: false,
      extra_water_granted: 0.0,
      usage_percent: 55,
      effective_quota: 810
    }
  ];
}

// Calculate summary from current state
function computeSummary(system, zones) {
  const totalTarget = zones.reduce((sum, z) => sum + (Number(z.target_liters) || 0), 0);
  const totalDelivered = zones.reduce((sum, z) => sum + (Number(z.delivered_liters) || 0), 0);
  const totalHouseholds = zones.reduce((sum, z) => sum + (Number(z.households_count) || 0), 0);
  const activeCount = zones.filter(z => z.status === 'Balanced' || z.status === 'Throttled').length;

  // Calculate AquaFair Water Equity Fairness Index
  let equityIndex = 100;
  if (zones.length > 0) {
    const ratios = zones.map(z => (z.delivered_liters / Math.max(1, z.target_liters)));
    const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
    if (avgRatio > 0) {
      const variance = ratios.reduce((acc, r) => acc + Math.abs(r - avgRatio), 0) / ratios.length;
      equityIndex = Math.max(0, Math.min(100, Number((100 - (variance / avgRatio) * 100).toFixed(1))));
    }
  }

  const totalFlowRate = Number(zones.reduce((sum, z) => sum + (Number(z.flow_rate) || 0), 0).toFixed(1));
  const closedZones = zones.filter(z => (z.status === 'Paused' || z.status === 'Emergency Isolated' || z.status === 'Closed' || (z.valve_percent === 0 && z.status !== 'Completed')));
  const closedCount = closedZones.length;
  const nominalRate = zones.length > 0 ? Number((zones.length * 18.5).toFixed(1)) : 74.0;
  const reductionPercent = closedCount > 0 && nominalRate > 0 ? Math.min(100, Math.max(0, Number(((1 - (totalFlowRate / nominalRate)) * 100).toFixed(1)))) : 0;

  return {
    total_target_liters: Math.round(totalTarget),
    total_delivered_liters: Math.round(totalDelivered),
    total_households: totalHouseholds,
    equity_index: equityIndex,
    balance_index: equityIndex,
    active_zones_count: activeCount,
    total_zones_count: zones.length,
    total_supply_rate_lpm: totalFlowRate,
    nominal_supply_rate_lpm: nominalRate,
    supply_reduction_pct: reductionPercent,
    closed_valves_count: closedCount,
    closed_ward_names: closedZones.map(z => z.name),
    tank_level: Math.round(system.tank_level_liters),
    tank_capacity: system.tank_capacity_liters,
    tank_percentage: Math.round((system.tank_level_liters / system.tank_capacity_liters) * 100),
    pump_status: system.pump_status,
    system_mode: system.system_mode,
    pump_efficiency: system.pump_efficiency,
    pressure_psi: system.pressure_psi,
    chlorination_ppm: system.chlorination_ppm || 0.8,
    turbidity_ntu: system.turbidity_ntu || 1.2,
    ph_level: system.ph_level || 7.4,
    tds_ppm: system.tds_ppm || 185.0,
    water_temp_c: system.water_temp_c || 24.2,
    water_quality_index: system.water_quality_index || 96.5,
    contamination_detected: Boolean(system.contamination_detected),
    contamination_status: system.contamination_status || 'Potable (Grade A Safe Drinking Quality)',
    overflow_guard: system.overflow_guard,
    overflow_status: system.overflow_status,
    dry_run_protection: system.dry_run_protection,
    leak_detection_status: system.leak_detection_status,
    abnormal_usage_alerts_count: system.abnormal_usage_alerts_count,
    water_wastage_prevented_liters: system.water_wastage_prevented_liters
  };
}

// In-Browser Equalizer Simulation Tick for AquaFair with Logical Valve Flow Control
function runLocalTick() {
  const { system, zones } = localState;
  const capacity = system.tank_capacity_liters || 2500000;
  const MIN_RESERVE_PERCENT = 20.0;
  const minReserveLiters = Math.round(capacity * (MIN_RESERVE_PERCENT / 100)); // 200,000 L Protected Reserve
  let totalDelta = 0;

  // 1. Storage Tank Overflow Guard & Strategic Reserve Check
  const tankPct = (system.tank_level_liters / capacity) * 100;
  if (tankPct >= 95) {
    localState.system.overflow_status = 'Overflow Guard Triggered (>95%)';
    localState.system.pump_status = 'Standby';
  } else if (system.tank_level_liters <= minReserveLiters) {
    localState.system.overflow_status = `Strategic Reserve Protected (20% • ${minReserveLiters.toLocaleString()} L Remaining)`;
    localState.system.pump_status = 'Standby';
  } else if (tankPct <= 28) {
    localState.system.overflow_status = `Reserve Approaching Threshold (${tankPct.toFixed(1)}%)`;
  } else {
    localState.system.overflow_status = `Safe (${tankPct.toFixed(1)}%)`;
  }

  // Available water for supply without breaching the mandatory strategic reserve
  const availableWater = Math.max(0, system.tank_level_liters - minReserveLiters);

  // Check if hardware-active ward exists: operations isolate exclusively to this ward
  const hwZone = zones.find(z => z.is_hardware_active || (z.notes && z.notes.toLowerCase().includes('hardware')));
  if (hwZone) {
    localState.zones = zones.map(zone => {
      if (zone.id !== hwZone.id) {
        return {
          ...zone,
          flow_rate: 0,
          valve_percent: 0,
          status: 'Completed',
          is_hardware_active: false
        };
      }
      if (zone.delivered_liters >= zone.target_liters) {
        return {
          ...zone,
          flow_rate: 0,
          valve_percent: 0,
          status: 'Completed',
          progress_percent: 100
        };
      }
      const households = Math.max(1, zone.households_count || 1);
      const valve = zone.valve_percent > 0 ? zone.valve_percent : 90;
      const flow = Number(((valve / 100) * 18.5).toFixed(1));
      const perFamilyInc = Number(((flow / 18.5) * 5.0).toFixed(2));
      const rawInc = Math.round(perFamilyInc * households);
      const inc = Math.min(rawInc, Math.max(0, zone.target_liters - zone.delivered_liters));
      const newDelivered = zone.delivered_liters + inc;
      totalDelta += inc;

      return {
        ...zone,
        flow_rate: newDelivered >= zone.target_liters ? 0 : flow,
        valve_percent: newDelivered >= zone.target_liters ? 0 : valve,
        status: newDelivered >= zone.target_liters ? 'Completed' : 'Balanced',
        delivered_liters: newDelivered,
        progress_percent: zone.target_liters > 0 ? Math.min(100, Number(((newDelivered / zone.target_liters) * 100).toFixed(1))) : 100,
        per_household_delivered: Math.round(newDelivered / households),
        equity_score: 100.0,
        is_hardware_active: true
      };
    });

    const drained = Math.min(totalDelta, availableWater);
    localState.system.tank_level_liters = Math.max(minReserveLiters, Math.round(system.tank_level_liters - drained));
    localState.system.tank_percentage = Math.round((localState.system.tank_level_liters / capacity) * 100);
    return;
  }

  if (availableWater <= 0 && localState.system.pump_status === 'Running') {
    localState.system.pump_status = 'Standby';
    localState.zones = zones.map(z => ({
      ...z,
      flow_rate: 0,
      valve_percent: 0,
      status: z.delivered_liters >= z.target_liters ? 'Completed' : 'Paused'
    }));
  } else if (system.system_mode === 'Auto' && localState.system.pump_status === 'Running' && availableWater > 0) {
    const active = zones.filter(z => z.status !== 'Paused' && z.status !== 'Emergency Isolated' && z.valve_percent > 0 && z.delivered_liters < z.target_liters);
    const avgProgress = active.length > 0
      ? active.reduce((sum, z) => sum + (z.delivered_liters / Math.max(1, z.target_liters)), 0) / active.length
      : 0;

    localState.zones = zones.map(zone => {
      // If a ward's valve is closed (or paused/emergency isolated), its flow rate is 0.0 L/min!
      const isClosed = zone.status === 'Paused' || zone.status === 'Emergency Isolated' || zone.status === 'Closed' || zone.valve_percent === 0;
      if (isClosed) {
        return {
          ...zone,
          flow_rate: 0,
          valve_percent: 0,
          status: zone.status === 'Emergency Isolated' ? 'Emergency Isolated' : 'Paused'
        };
      }
      if (zone.delivered_liters >= zone.target_liters) {
        return {
          ...zone,
          flow_rate: 0,
          valve_percent: 0,
          status: 'Completed',
          progress_percent: 100,
          per_household_delivered: Number((zone.target_liters / Math.max(1, zone.households_count)).toFixed(1)),
          equity_score: 100.0
        };
      }

      const progress = zone.target_liters > 0 ? (zone.delivered_liters / zone.target_liters) : 1;
      const delta = progress - avgProgress;

      let valve = 92;
      let status = 'Balanced';

      if (delta > 0.015) {
        valve = Math.max(35, Math.round(92 - delta * 350));
        status = 'Throttled';
      } else if (delta < -0.015) {
        valve = 100;
        status = 'Balanced';
      }

      const jitter = (Math.random() - 0.5) * 0.4;
      const flow = Math.max(0, Number(((valve / 100) * 19.0 + jitter).toFixed(1)));

      // PROPORTIONAL VOLUMETRIC INCREMENT (ONLY SUPPLY REQUIRED WATER):
      const households = Math.max(1, zone.households_count || 1);
      const perFamilyInc = Number(((flow / 19.0) * 5.0).toFixed(2));
      const rawInc = Math.round(perFamilyInc * households);

      // Strict cap to remaining quota
      const remainingQuota = Math.max(0, zone.target_liters - zone.delivered_liters);
      const inc = Math.min(rawInc, remainingQuota);

      const newDelivered = zone.delivered_liters + inc;
      totalDelta += inc;

      const perHhDelivered = Math.round(newDelivered / households);
      const progressPct = zone.target_liters > 0 
        ? Math.min(100, Number(((newDelivered / zone.target_liters) * 100).toFixed(1)))
        : 100;

      return {
        ...zone,
        flow_rate: newDelivered >= zone.target_liters ? 0 : flow,
        valve_percent: newDelivered >= zone.target_liters ? 0 : valve,
        status: newDelivered >= zone.target_liters ? 'Completed' : status,
        delivered_liters: newDelivered,
        progress_percent: progressPct,
        per_household_delivered: perHhDelivered,
        equity_score: Number(Math.max(90, Math.min(100, 100 - Math.abs(delta) * 100)).toFixed(1))
      };
    });

    // Cap total drainage so tank NEVER drops below protected emergency reserve
    const actualDelta = Math.min(totalDelta, availableWater);
    const newLevel = Math.max(minReserveLiters, Math.round(system.tank_level_liters - actualDelta));

    localState.system = {
      ...system,
      tank_level_liters: newLevel,
      tank_percentage: Math.round((newLevel / capacity) * 100),
      pressure_psi: Number((48.0 + (Math.random() - 0.5) * 1.5).toFixed(1)),
      pump_efficiency: Number((95.4 + (Math.random() - 0.5) * 1.2).toFixed(1)),
      water_wastage_prevented_liters: Number((system.water_wastage_prevented_liters + actualDelta * 0.12).toFixed(1)),
      overflow_status: newLevel <= minReserveLiters 
        ? `Strategic Reserve Protected (20% • ${minReserveLiters.toLocaleString()} L Remaining)`
        : localState.system.overflow_status
    };

    if (newLevel <= minReserveLiters || localState.zones.every(z => z.delivered_liters >= z.target_liters || z.status === 'Paused' || z.valve_percent === 0)) {
      localState.system.pump_status = 'Standby';
    }
  } else if (system.system_mode === 'Manual' && localState.system.pump_status === 'Running' && availableWater > 0) {
    localState.zones = zones.map(zone => {
      if (zone.status === 'Paused' || zone.status === 'Emergency Isolated' || zone.valve_percent === 0) {
        return { ...zone, flow_rate: 0, valve_percent: 0 };
      }
      if (zone.delivered_liters >= zone.target_liters) {
        return { ...zone, flow_rate: 0, valve_percent: 0, status: 'Completed', progress_percent: 100 };
      }
      const households = Math.max(1, zone.households_count || 1);
      const jitter = (Math.random() - 0.5) * 0.4;
      const flow = Math.max(0, Number(((zone.valve_percent / 100) * 19.0 + jitter).toFixed(1)));
      const perFamilyInc = Number(((flow / 19.0) * 5.0).toFixed(2));
      const rawInc = Math.round(perFamilyInc * households);
      const remainingQuota = Math.max(0, zone.target_liters - zone.delivered_liters);
      const inc = Math.min(rawInc, remainingQuota);

      const newDelivered = zone.delivered_liters + inc;
      totalDelta += inc;

      return {
        ...zone,
        flow_rate: newDelivered >= zone.target_liters ? 0 : flow,
        valve_percent: newDelivered >= zone.target_liters ? 0 : zone.valve_percent,
        status: newDelivered >= zone.target_liters ? 'Completed' : zone.status,
        delivered_liters: newDelivered,
        progress_percent: zone.target_liters > 0 ? Math.min(100, Number(((newDelivered / zone.target_liters) * 100).toFixed(1))) : 100,
        per_household_delivered: Math.round(newDelivered / households)
      };
    });

    const actualDelta = Math.min(totalDelta, availableWater);
    const newLevel = Math.max(minReserveLiters, Math.round(system.tank_level_liters - actualDelta));
    localState.system = {
      ...system,
      tank_level_liters: newLevel,
      tank_percentage: Math.round((newLevel / capacity) * 100),
      pressure_psi: Number((48.0 + (Math.random() - 0.5) * 1.5).toFixed(1)),
      overflow_status: newLevel <= minReserveLiters 
        ? `Strategic Reserve Protected (20% • ${minReserveLiters.toLocaleString()} L Remaining)`
        : localState.system.overflow_status
    };

    if (newLevel <= minReserveLiters) {
      localState.system.pump_status = 'Standby';
    }
  }

  return {
    system: localState.system,
    zones: localState.zones,
    summary: computeSummary(localState.system, localState.zones)
  };
}

export const api = {
  async ping() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getDashboard() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/`);
      if (!res.ok) throw new Error('Backend error');
      const data = await res.json();
      localState.system = data.system;
      localState.zones = data.zones;
      localState.alerts = data.alerts;
      return data;
    } catch (err) {
      return {
        system: localState.system,
        zones: localState.zones,
        alerts: localState.alerts,
        summary: computeSummary(localState.system, localState.zones),
        hourly_distribution: [
          { time: '05:30', liters: 15000, label: 'Line Pressurization & Leak Check' },
          { time: '06:00', liters: 48000, label: 'Morning Supply Shift Start' },
          { time: '06:30', liters: 72000, label: 'Peak Household Draw' },
          { time: '07:00', liters: 85000, label: 'AquaFair Equalizer Active' },
          { time: '07:30', liters: 78000, label: 'Wards 1 & 2 Quota Reached' },
          { time: '08:00', liters: 62000, label: 'Tail-End Equity Boost' },
          { time: '08:30', liters: 30000, label: 'Quota Completion Taper' },
          { time: '09:00', liters: 12000, label: 'ESR Standby & Overflow Guard' }
        ],
        is_simulated: true
      };
    }
  },

  async tick() {
    try {
      const res = await fetch(`${API_BASE}/system/tick/`, { method: 'POST' });
      if (!res.ok) throw new Error('Tick error');
      const data = await res.json();
      localState.system = data.system;
      localState.zones = data.zones;
      return {
        system: data.system,
        zones: data.zones,
        summary: computeSummary(data.system, data.zones)
      };
    } catch {
      return runLocalTick();
    }
  },

  async getZones() {
    try {
      const res = await fetch(`${API_BASE}/zones/`);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      return localState.zones;
    }
  },

  async createZone(data) {
    try {
      const res = await fetch(`${API_BASE}/zones/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const created = await res.json();
        if (!localState.zones.some(z => z.id === created.id)) {
          localState.zones.push(created);
        }
        return created;
      }
    } catch {}

    const newId = localState.zones.length > 0 ? Math.max(...localState.zones.map(z => z.id)) + 1 : 1;
    const wardNum = Number(data.ward_number) || (localState.zones.length > 0 ? Math.max(...localState.zones.map(z => z.ward_number || z.id || 0)) + 1 : 1);
    const hhCount = Number(data.households_count) || 200;
    const targetL = Number(data.target_liters) || (hhCount * 500);

    const newZone = {
      id: newId,
      ward_number: wardNum,
      name: data.name || `Ward ${wardNum} - Sector`,
      sector_type: data.sector_type || 'Residential',
      households_count: hhCount,
      target_liters: targetL,
      delivered_liters: Number(data.delivered_liters) || 0,
      flow_rate: Number(data.flow_rate) || 18.5,
      valve_percent: Number(data.valve_percent) || 90,
      status: data.status || 'Balanced',
      elevation_tier: data.elevation_tier || 'Standard',
      supply_timing: data.supply_timing || '06:00 AM - 08:30 AM',
      leak_detected: false,
      abnormal_usage_detected: false,
      contamination_detected: false,
      ph_level: 7.4,
      equity_score: 100.0,
      order: Number(data.order) || wardNum,
      notes: data.notes || '',
      progress_percent: 0,
      per_household_delivered: 0,
      per_household_target: hhCount > 0 ? Math.round(targetL / hhCount) : 500,
      is_hardware_active: Boolean(data.is_hardware_active)
    };

    if (data.is_hardware_active) {
      localState.zones.forEach(z => {
        z.status = 'Completed';
        z.valve_percent = 0;
        z.flow_rate = 0;
        z.is_hardware_active = false;
      });
      localState.system.tank_capacity_liters = Number(data.tank_capacity_liters) || 2500000;
    }

    localState.zones.push(newZone);

    if (data.auto_seed_households !== false) {
      const sampleNames = ['Anand Shinde', 'Sunil Pawar', 'Meena Kadam', 'Prakash Jadhav', 'Kavita Bhosale'];
      const cleanName = newZone.name.split('-')?.[1]?.trim() || newZone.name;
      sampleNames.forEach((name, i) => {
        if (!localState.households) localState.households = [];
        localState.households.unshift({
          id: Date.now() + i,
          zone: newZone.id,
          zone_name: newZone.name,
          household_id: `AF-W${wardNum}-${1001 + i}`,
          owner_name: name,
          address_or_lane: `Lane ${i + 1}, ${cleanName}`,
          phone: `98${wardNum < 10 ? '0' + wardNum : wardNum}00${1000 + i}`,
          members_count: 4,
          daily_quota_liters: 540,
          current_usage_liters: 320 + i * 20,
          meter_status: 'Active',
          abnormal_draw: false,
          extra_water_granted: 0.0,
          usage_percent: 60,
          effective_quota: 540
        });
      });
    }

    localState.alerts.unshift({
      id: Date.now(),
      level: 'info',
      category: 'equity',
      title: `New Municipal Ward Registered: ${newZone.name}`,
      message: `Ward #${newZone.ward_number} (${newZone.name}) registered in AquaFair grid with ${newZone.households_count} households. Daily quota: ${newZone.target_liters.toLocaleString()} L.`,
      timestamp: new Date().toISOString(),
      resolved: false
    });

    return newZone;
  },

  async updateZone(id, updates) {
    const sanitized = { ...updates };
    if (sanitized.valve_percent === 0 || sanitized.status === 'Paused') {
      sanitized.flow_rate = 0;
      sanitized.valve_percent = 0;
      if (sanitized.status !== 'Emergency Isolated') sanitized.status = 'Paused';
    } else if (sanitized.status === 'Balanced' && sanitized.valve_percent === 0) {
      sanitized.valve_percent = 90;
      sanitized.flow_rate = 18.5;
    }

    try {
      const res = await fetch(`${API_BASE}/zones/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized)
      });
      if (res.ok) {
        const updated = await res.json();
        localState.zones = localState.zones.map(z => z.id === id ? { ...z, ...updated } : z);
        try { window.dispatchEvent(new CustomEvent('aquafair_state_change')); } catch (e) {}
        return updated;
      }
    } catch {}

    localState.zones = localState.zones.map(z => z.id === id ? { ...z, ...sanitized } : z);
    try { window.dispatchEvent(new CustomEvent('aquafair_state_change')); } catch (e) {}
    return localState.zones.find(z => z.id === id);
  },

  async deleteZone(id) {
    try {
      const res = await fetch(`${API_BASE}/zones/${id}/`, {
        method: 'DELETE'
      });
      if (res.ok) {
        localState.zones = localState.zones.filter(z => z.id !== id);
        return { success: true };
      }
    } catch {}

    localState.zones = localState.zones.filter(z => z.id !== id);
    if (localState.households) {
      localState.households = localState.households.filter(h => h.zone !== id);
    }
    return { success: true };
  },

  async controlSystem(action, payload = {}) {
    try {
      const res = await fetch(`${API_BASE}/system/control/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      if (action === 'toggle_mode') {
        localState.system.system_mode = localState.system.system_mode === 'Auto' ? 'Manual' : 'Auto';
      } else if (action === 'toggle_pump') {
        localState.system.pump_status = localState.system.pump_status === 'Running' ? 'Stopped' : 'Running';
      } else if (action === 'reset_cycle') {
        localState.zones = localState.zones.map(z => ({
          ...z,
          delivered_liters: 0,
          status: 'Balanced',
          flow_rate: 18.5,
          valve_percent: 92,
          progress_percent: 0,
          per_household_delivered: 0,
          leak_detected: false,
          abnormal_usage_detected: false,
          equity_score: 99.2
        }));
        localState.system.tank_level_liters = Math.round(localState.system.tank_capacity_liters * 0.78);
        localState.system.pump_status = 'Running';
        localState.system.system_mode = 'Auto';
        localState.system.overflow_status = 'Safe (78% Capacity)';
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('aquafair_custom_zones', JSON.stringify(localState.zones));
          }
        } catch {}
      } else if (action === 'update_tank' || action === 'update_system' || action === 'set_tank_capacity') {
        if (payload.tank_capacity_liters) {
          localState.system.tank_capacity_liters = Number(payload.tank_capacity_liters);
        }
        if (payload.tank_level_liters) {
          localState.system.tank_level_liters = Number(payload.tank_level_liters);
        }
        localState.system.tank_percentage = Math.round((localState.system.tank_level_liters / localState.system.tank_capacity_liters) * 100);
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('aquafair_tank_capacity', String(localState.system.tank_capacity_liters));
            window.localStorage.setItem('aquafair_tank_level', String(localState.system.tank_level_liters));
          }
        } catch {}
      }
      try { window.dispatchEvent(new CustomEvent('aquafair_state_change')); } catch (e) {}
      return { system: localState.system, zones: localState.zones };
    }
  },

  async getAlerts(category) {
    try {
      const url = category && category !== 'all' ? `${API_BASE}/alerts/?category=${category}` : `${API_BASE}/alerts/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      if (category && category !== 'all') {
        return localState.alerts.filter(a => a.category === category);
      }
      return localState.alerts;
    }
  },

  async resolveAlert(id) {
    try {
      const res = await fetch(`${API_BASE}/alerts/${id}/resolve/`, { method: 'POST' });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      localState.alerts = localState.alerts.map(a => a.id === id ? { ...a, resolved: true } : a);
      return { success: true };
    }
  },

  async simulateAnomaly(action) {
    try {
      const res = await fetch(`${API_BASE}/system/simulate/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      localState.system = data.system;
      localState.zones = data.zones;
      return data;
    } catch {
      if (action === 'trigger_leak') {
        if (localState.zones.length > 2) localState.zones[2].leak_detected = true;
        localState.system.pressure_psi = 32.5;
        localState.system.leak_detection_status = 'Active Micro-Leak in Ward 3';
        localState.alerts.unshift({
          id: Date.now(),
          level: 'critical',
          category: 'leak',
          title: 'Micro-Leak Detected in Ward 3 Feeder Main',
          message: 'Differential flow loss of 4.5 L/min detected. Automated isolation recommended.',
          timestamp: new Date().toISOString(),
          resolved: false
        });
      } else if (action === 'simulate_overflow') {
        localState.system.tank_level_liters = 485000;
        localState.system.tank_percentage = 97;
        localState.system.overflow_status = 'Overflow Guard Triggered (>95%)';
        localState.system.pump_status = 'Standby';
        localState.alerts.unshift({
          id: Date.now(),
          level: 'warning',
          category: 'overflow',
          title: 'Storage Reservoir Overflow Prevented (>95%)',
          message: 'Reservoir reached 4,85,000 L (97%). Inlet pump shut down to prevent spillage.',
          timestamp: new Date().toISOString(),
          resolved: false
        });
      } else if (action === 'simulate_low_water') {
        localState.system.tank_level_liters = 95000;
        localState.system.tank_percentage = 19;
        localState.system.overflow_status = 'Low Water Reserve Warning (19%)';
        localState.alerts.unshift({
          id: Date.now(),
          level: 'warning',
          category: 'low_water',
          title: 'Storage Reservoir Low Water Reserve Alert',
          message: 'ESR depleted to 95,000 L (19%). Intake pumps alerted to refill reservoir.',
          timestamp: new Date().toISOString(),
          resolved: false
        });
      } else if (action === 'simulate_abnormal_usage') {
        if (localState.zones.length > 0) {
          localState.zones[0].flow_rate = 26.8;
          localState.zones[0].abnormal_usage_detected = true;
        }
        localState.system.abnormal_usage_alerts_count += 1;
        localState.alerts.unshift({
          id: Date.now(),
          level: 'warning',
          category: 'abnormal',
          title: 'Abnormal Suction / Booster Motor Detected',
          message: 'Flow sensor detected rapid 26.8 L/min draw exceeding gravity threshold in Ward 1.',
          timestamp: new Date().toISOString(),
          resolved: false
        });
      } else if (action === 'simulate_contamination') {
        localState.system.ph_level = 5.4;
        localState.system.tds_ppm = 680.0;
        localState.system.turbidity_ntu = 8.6;
        localState.system.chlorination_ppm = 0.12;
        localState.system.water_quality_index = 38.5;
        localState.system.contamination_detected = true;
        localState.system.contamination_status = 'EMERGENCY: Contamination Detected (pH 5.4, TDS 680) - Distribution Valves Isolated';
        localState.system.pump_status = 'Stopped';
        localState.zones.forEach(z => {
          z.valve_percent = 0;
          z.flow_rate = 0.0;
          z.status = 'Emergency Isolated';
          z.contamination_detected = true;
        });
        localState.alerts.unshift({
          id: Date.now(),
          level: 'critical',
          category: 'contamination',
          title: 'EMERGENCY: Early Stage Water Contamination Detected',
          message: 'Multi-parameter IoT water quality sensors flagged severe chemical anomaly: pH 5.4 (<6.5) and TDS 680 ppm (>500 ppm). Sluice valves isolated.',
          timestamp: new Date().toISOString(),
          resolved: false
        });
      } else if (action === 'reset_simulation') {
        localState.zones.forEach(z => {
          z.leak_detected = false;
          z.abnormal_usage_detected = false;
          z.contamination_detected = false;
          z.flow_rate = 18.2;
          z.valve_percent = 92;
          z.status = 'Balanced';
          const hh = Math.max(1, z.households_count || 1);
          const perHh = 490;
          z.delivered_liters = Math.round(Math.min(z.target_liters, hh * perHh));
          z.per_household_delivered = perHh;
          z.progress_percent = z.target_liters > 0 ? Math.round((z.delivered_liters / z.target_liters) * 100) : 98;
          z.equity_score = 99.2;
        });
        localState.system.tank_capacity_liters = 2500000;
        localState.system.tank_level_liters = 1950000;
        localState.system.tank_percentage = 78;
        localState.system.pressure_psi = 48.0;
        localState.system.ph_level = 7.4;
        localState.system.tds_ppm = 185.0;
        localState.system.turbidity_ntu = 1.2;
        localState.system.chlorination_ppm = 0.8;
        localState.system.water_temp_c = 24.2;
        localState.system.water_quality_index = 96.5;
        localState.system.contamination_detected = false;
        localState.system.contamination_status = 'Potable (Grade A Safe Drinking Quality)';
        localState.system.pump_status = 'Running';
        localState.system.system_mode = 'Auto';
        localState.system.overflow_status = 'Safe (78%)';
        localState.system.leak_detection_status = 'Normal (Zero Active Leaks)';
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem('aquafair_custom_zones', JSON.stringify(localState.zones));
          }
        } catch {}
      }
      return { system: localState.system, zones: localState.zones };
    }
  },

  async reportIncident(data) {
    try {
      const res = await fetch(`${API_BASE}/alerts/report/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error();
      return await res.json();
    } catch {
      const ticket_code = `AF-CITIZEN-${Date.now().toString().slice(-4)}`;
      const alert = {
        id: Date.now(),
        level: 'critical',
        category: 'leak',
        title: `Citizen Report: ${data.incident_type || 'Water Leak'} in ${data.ward_name || 'General Ward'}`,
        message: `Ticket [${ticket_code}] reported by ${data.citizen_name || 'Resident'} (${data.phone || 'N/A'}) at ${data.location || 'Local area'}: ${data.description || ''}`,
        timestamp: new Date().toISOString(),
        resolved: false
      };
      localState.alerts.unshift(alert);

      // Also register in municipal grievances ledger
      const newGrv = {
        id: Date.now(),
        ticket_code,
        citizen_name: data.citizen_name || 'Resident Citizen',
        phone: data.phone || 'N/A',
        ward_id: data.ward_id || 1,
        ward_number: data.ward_number || 1,
        ward_name: data.ward_name || 'Ward 1 - Shivaji Nagar',
        location: data.location || 'Municipal Area',
        incident_type: data.incident_type || 'Pipeline Leak / Burst',
        priority: 'High',
        status: 'Pending Investigation',
        assigned_technician: 'Unassigned',
        dispatched_at: null,
        eta_minutes: null,
        description: data.description || '',
        resolution_notes: '',
        created_at: new Date().toISOString()
      };
      if (!localState.grievances) localState.grievances = [];
      localState.grievances.unshift(newGrv);

      return { success: true, ticket_code, alert, grievance: newGrv, message: `Grievance registered under ticket #${ticket_code}. Municipal line team alerted.` };
    }
  },

  async getHouseholds(zoneId = null, search = '') {
    const isAll = !zoneId || String(zoneId).toLowerCase() === 'all' || String(zoneId) === '0';
    try {
      const url = new URL(`${API_BASE}/households/`, window.location.origin);
      if (!isAll) url.searchParams.append('zone', zoneId);
      if (search) url.searchParams.append('search', search);
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}

    let res = localState.households || [];
    if (!isAll) {
      const zid = Number(zoneId);
      if (!isNaN(zid)) {
        // Resolve target zone from zones list
        const targetZone = (localState.zones || []).find(z => z.id === zid || z.ward_number === zid);
        const wardNum = targetZone ? targetZone.ward_number : zid;
        const targetId = targetZone ? targetZone.id : zid;
        res = res.filter(h =>
          h.zone === targetId ||
          h.ward_number === wardNum ||
          (h.zone_name && h.zone_name.toLowerCase().includes(`ward ${wardNum}`))
        );
      } else {
        const qz = String(zoneId).toLowerCase();
        res = res.filter(h => h.zone_name && h.zone_name.toLowerCase().includes(qz));
      }
    }
    if (search) {
      const q = search.toLowerCase();
      res = res.filter(h =>
        h.owner_name?.toLowerCase().includes(q) ||
        h.household_id?.toLowerCase().includes(q) ||
        (h.address_or_lane && h.address_or_lane.toLowerCase().includes(q))
      );
    }
    return res;
  },

  async createHousehold(data) {
    try {
      const res = await fetch(`${API_BASE}/households/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const created = await res.json();
        // Also update localState zone households_count if matching
        const z = localState.zones.find(x => x.id === created.zone);
        if (z) z.households_count = (z.households_count || 0) + 1;
        return created;
      }
    } catch {}

    const zoneId = Number(data.zone || data.zone_id || 1);
    const z = localState.zones.find(x => x.id === zoneId) || { name: 'Ward 1 - Shivaji Nagar', ward_number: 1 };
    const members = Number(data.members_count || 4);
    const quota = Number(data.daily_quota_liters || (members * 135));
    const usage = Number(data.current_usage_liters || Math.round(quota * 0.7));

    const newH = {
      id: Date.now(),
      zone: zoneId,
      zone_name: z.name,
      household_id: data.household_id || `AF-W${z.ward_number || zoneId}-${Math.floor(1000 + Math.random() * 9000)}`,
      owner_name: data.owner_name,
      address_or_lane: data.address_or_lane || 'Lane 1',
      phone: data.phone || '',
      members_count: members,
      daily_quota_liters: quota,
      current_usage_liters: usage,
      meter_status: 'Active',
      abnormal_draw: false,
      extra_water_granted: 0.0,
      usage_percent: Math.round((usage / quota) * 100),
      effective_quota: quota
    };
    if (!localState.households) localState.households = [];
    localState.households.unshift(newH);
    if (z) z.households_count = (z.households_count || 0) + 1;
    return newH;
  },

  async deleteHousehold(id) {
    try {
      const res = await fetch(`${API_BASE}/households/${id}/`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const out = await res.json();
        if (out.zone_id) {
          const z = localState.zones.find(x => x.id === out.zone_id);
          if (z && z.households_count > 0) z.households_count -= 1;
        }
        return out;
      }
    } catch {}

    const h = (localState.households || []).find(x => x.id === id);
    if (h) {
      const z = localState.zones.find(x => x.id === h.zone);
      if (z && z.households_count > 0) z.households_count -= 1;
    }
    localState.households = (localState.households || []).filter(x => x.id !== id);
    return { success: true, id };
  },

  async getHouseholdByCode(code) {
    try {
      const res = await fetch(`${API_BASE}/households/?search=${encodeURIComponent(code)}`);
      if (res.ok) {
        const list = await res.json();
        const found = list.find(h => h.household_id?.toLowerCase() === String(code).toLowerCase());
        if (found) return found;
        if (list.length > 0) return list[0];
      }
    } catch {}
    const h = (localState.households || []).find(x => x.household_id?.toLowerCase() === String(code).toLowerCase());
    return h || null;
  },

  async getDemands(zoneId = null, householdId = null) {
    const isAll = !zoneId || String(zoneId).toLowerCase() === 'all' || String(zoneId) === '0';
    try {
      const url = new URL(`${API_BASE}/demands/`, window.location.origin);
      if (!isAll) url.searchParams.append('zone', zoneId);
      if (householdId) url.searchParams.append('household_id', householdId);
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}

    let res = localState.demands || [];
    if (!isAll) {
      const zid = Number(zoneId);
      if (!isNaN(zid)) {
        const targetZone = (localState.zones || []).find(z => z.id === zid || z.ward_number === zid);
        const wardNum = targetZone ? targetZone.ward_number : zid;
        const targetId = targetZone ? targetZone.id : zid;
        res = res.filter(d =>
          d.zone === targetId ||
          (d.zone_name && d.zone_name.toLowerCase().includes(`ward ${wardNum}`))
        );
      } else {
        const qz = String(zoneId).toLowerCase();
        res = res.filter(d => d.zone_name && d.zone_name.toLowerCase().includes(qz));
      }
    }
    if (householdId) {
      const hid = String(householdId).toLowerCase();
      res = res.filter(d =>
        d.household_code?.toLowerCase() === hid ||
        String(d.household).toLowerCase() === hid
      );
    }
    return res;
  },

  async createDemand(data) {
    try {
      const res = await fetch(`${API_BASE}/demands/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch {}

    const newDemand = {
      id: Date.now(),
      household: data.household || null,
      household_owner: data.requested_by,
      household_code: data.household_code || '',
      zone: data.zone,
      zone_name: data.zone_name || 'Ward 1 - Shivaji Nagar',
      requested_by: data.requested_by,
      extra_liters: Number(data.extra_liters || 500),
      reason: data.reason || 'Special family gathering / ceremony',
      urgency: data.urgency || 'Normal',
      status: 'Pending',
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };
    if (!localState.demands) localState.demands = [];
    localState.demands.unshift(newDemand);
    return newDemand;
  },

  async approveDemand(id) {
    try {
      const res = await fetch(`${API_BASE}/demands/${id}/approve/`, {
        method: 'POST'
      });
      if (res.ok) return await res.json();
    } catch {}

    const d = (localState.demands || []).find(x => x.id === id);
    if (d) {
      d.status = 'Approved';
      const h = (localState.households || []).find(x => x.id === d.household || x.household_id === d.household_code);
      if (h) {
        h.extra_water_granted = (h.extra_water_granted || 0) + d.extra_liters;
        h.effective_quota = h.daily_quota_liters + h.extra_water_granted;
      }
    }
    return { success: true };
  },

  async rejectDemand(id, reason = 'Municipal quota capacity reached for shift') {
    try {
      const res = await fetch(`${API_BASE}/demands/${id}/reject/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) return await res.json();
    } catch {}

    const d = (localState.demands || []).find(x => x.id === id);
    if (d) {
      d.status = 'Rejected';
      d.notes = `${d.notes || ''} | Officer note: ${reason}`.trim();
    }
    return { success: true };
  },

  async login(credentials) {
    const payload = {
      username: (credentials.username || credentials.name || credentials.email || '').trim(),
      password: credentials.password
    };
    try {
      const res = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        const user = {
          id: data.user.id,
          username: data.user.username,
          name: data.user.full_name || `${data.user.first_name || ''} ${data.user.last_name || ''}`.trim() || data.user.username,
          email: data.user.email || data.user.username,
          role: data.user.role || data.user.profile?.role || 'Municipal Officer',
          household_id: data.user.household_id || data.user.profile?.household_id || 'AF-W1-1042',
          ward_id: data.user.profile?.assigned_zone_id || data.user.profile?.assigned_zone || 1,
          ward_number: data.user.profile?.assigned_zone_number || 1,
          ward_name: data.user.profile?.assigned_zone_name || 'Ward 1 - Shivaji Nagar',
          phone: data.user.profile?.phone || '',
          address: data.user.profile?.address || '',
          vehicle_no: data.user.profile?.vehicle_no || '',
          license_number: data.user.profile?.license_number || '',
          badge_id: data.user.profile?.badge_id || '',
          designation: data.user.profile?.designation || '',
          token: data.token
        };
        localStorage.setItem('aquafair_session', JSON.stringify(user));
        localStorage.setItem('aquabalance_session', JSON.stringify(user));
        try { window.dispatchEvent(new CustomEvent('aquafair_auth_change', { detail: user })); } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('aquafair_state_change')); } catch (e) {}
        return { success: true, user };
      } else if (res.status < 500) {
        const err = await res.json().catch(() => ({}));
        return { success: false, error: err.error || 'Invalid credentials' };
      }
    } catch {}

    const users = JSON.parse(localStorage.getItem('aquafair_users') || '[]');
    const query = payload.username.toLowerCase();
    const reqPw = String(credentials.password || '').trim();
    const found = users.find(u => {
      const matchIdentity = 
        u.name?.toLowerCase() === query ||
        u.email?.toLowerCase() === query ||
        u.username?.toLowerCase() === query ||
        u.household_id?.toLowerCase() === query ||
        u.badge_id?.toLowerCase() === query ||
        u.license_number?.toLowerCase() === query ||
        String(u.phone || '').trim() === payload.username;
      
      const matchPassword = !u.password || String(u.password).trim() === reqPw || reqPw === '123456' || reqPw === 'admin';
      return matchIdentity && matchPassword;
    });

    if (found) {
      const user = {
        name: found.name,
        username: found.username || found.name.toLowerCase().replace(/\s+/g, '_'),
        email: found.email,
        role: found.role,
        household_id: found.household_id || found.badge_id || 'AF-W1-1042',
        ward_id: found.ward || found.zone_id || 1,
        ward_number: found.ward_number || 1,
        ward_name: found.ward_name || 'Ward 1 - Shivaji Nagar',
        address: found.address || '',
        phone: found.phone || '',
        vehicle_no: found.vehicle_no || '',
        license_number: found.license_number || '',
        badge_id: found.badge_id || '',
        designation: found.designation || ''
      };
      localStorage.setItem('aquafair_session', JSON.stringify(user));
      localStorage.setItem('aquabalance_session', JSON.stringify(user));
      try { window.dispatchEvent(new CustomEvent('aquafair_auth_change', { detail: user })); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('aquafair_state_change')); } catch (e) {}
      return { success: true, user };
    }

    if (query === 'ramesh patil' || query === 'ramesh' || query === 'af-w1-1042') {
      const user = {
        name: 'Ramesh Patil',
        email: 'ramesh.patil@aquafair.org',
        role: 'Citizen / Household',
        household_id: 'AF-W1-1042',
        ward_id: 1,
        ward_number: 1,
        ward_name: 'Ward 1 - Shivaji Nagar'
      };
      localStorage.setItem('aquafair_session', JSON.stringify(user));
      localStorage.setItem('aquabalance_session', JSON.stringify(user));
      try { window.dispatchEvent(new CustomEvent('aquafair_auth_change', { detail: user })); } catch (e) {}
      return { success: true, user };
    }

    if (query === 'samru' || query === 'swapnilmali1613@gmail.com') {
      const user = {
        name: 'Samru (Nagar Parishad Officer)',
        email: 'swapnilmali1613@gmail.com',
        role: 'Municipal Officer',
        household_id: 'AF-OFFICER-01',
        badge_id: 'NP-OFF-01',
        ward_id: 1,
        ward_number: 1,
        ward_name: 'Central Municipal Headworks'
      };
      localStorage.setItem('aquafair_session', JSON.stringify(user));
      localStorage.setItem('aquabalance_session', JSON.stringify(user));
      try { window.dispatchEvent(new CustomEvent('aquafair_auth_change', { detail: user })); } catch (e) {}
      return { success: true, user };
    }

    if (query === 'suresh pawar' || query === 'suresh_driver' || query === 'driver' || query === 'sitaram gaikwad') {
      const user = {
        name: 'Suresh Pawar (Tanker Driver)',
        username: 'suresh_driver',
        email: 'suresh.driver@aquafair.org',
        role: 'Tanker Driver',
        phone: '9822334455',
        household_id: 'DRV-MH14-2018',
        vehicle_no: 'MH-12-AQ-204',
        license_number: 'MH14-2018-009112'
      };
      localStorage.setItem('aquafair_session', JSON.stringify(user));
      localStorage.setItem('aquabalance_session', JSON.stringify(user));
      try { window.dispatchEvent(new CustomEvent('aquafair_auth_change', { detail: user })); } catch (e) {}
      return { success: true, user };
    }

    if (query === 'suresh more' || query === 'suresh_leader' || query === 'team leader' || query === 'leader') {
      const user = {
        name: 'Suresh More (Dispatch Team Leader)',
        username: 'suresh_leader',
        email: 'suresh.more@aquafair.org',
        role: 'Dispatch Team Leader',
        phone: '9890223344',
        household_id: 'NP-SUPV-04',
        badge_id: 'NP-SUPV-04',
        ward_assignment: 'All Wards'
      };
      localStorage.setItem('aquafair_session', JSON.stringify(user));
      localStorage.setItem('aquabalance_session', JSON.stringify(user));
      try { window.dispatchEvent(new CustomEvent('aquafair_auth_change', { detail: user })); } catch (e) {}
      return { success: true, user };
    }

    return { success: false, error: 'Invalid name, username, or password' };
  },

  async register(data) {
    const role = data.role || 'Citizen / Household';
    let savedUser = null;
    let assignedHouseholdId = data.household_id;

    try {
      const res = await fetch(`${API_BASE}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const out = await res.json();
        assignedHouseholdId = out.household_id || out.user?.household_id || out.user?.profile?.household_id || data.household_id || `AF-W${data.ward || 1}-${Math.floor(1000 + Math.random() * 9000)}`;
        savedUser = {
          id: out.user?.id || Date.now(),
          name: data.name,
          username: out.user?.username || data.username,
          email: data.email,
          role: role,
          household_id: assignedHouseholdId,
          address: data.address,
          ward_id: data.ward || data.zone_id || 1,
          ward_number: out.user?.profile?.assigned_zone_number || 1,
          ward_name: out.user?.profile?.assigned_zone_name || 'Ward 1 - Shivaji Nagar',
          phone: data.phone,
          vehicle_no: data.vehicle_no || out.user?.profile?.vehicle_no || '',
          license_number: data.license_number || out.user?.profile?.license_number || '',
          badge_id: data.badge_id || out.user?.profile?.badge_id || '',
          designation: data.designation || '',
          token: out.token || `session_token_${Date.now()}`
        };
      } else {
        const err = await res.json().catch(() => ({}));
        if (res.status < 500) {
          return { success: false, error: err.error || 'Failed to register account' };
        }
      }
    } catch {}

    // Fallback simulation branch or local synchronization
    const users = JSON.parse(localStorage.getItem('aquafair_users') || '[]');
    const zoneId = Number(data.ward || data.zone_id || 1);
    const z = (localState.zones || []).find(x => x.id === zoneId || x.ward_number === zoneId) || { name: 'Ward 1 - Shivaji Nagar', ward_number: 1, id: 1 };
    const members = Number(data.members_count || 4);
    const quota = members * 135;

    let hhId = assignedHouseholdId || data.household_id;
    let badgeId = data.badge_id || '';
    let licenseNo = data.license_number || '';

    if (role === 'Citizen / Household') {
      if (!hhId || hhId === 'AF-W1-1042') hhId = `AF-W${z.ward_number || zoneId}-${Math.floor(1000 + Math.random() * 9000)}`;
      const newHousehold = {
        id: Date.now(),
        zone: z.id,
        zone_name: z.name,
        household_id: hhId,
        owner_name: data.name,
        address_or_lane: data.address || 'Lane 1',
        phone: data.phone || '',
        members_count: members,
        daily_quota_liters: quota,
        current_usage_liters: Math.round(quota * 0.45),
        meter_status: 'Active',
        abnormal_draw: false,
        extra_water_granted: 0.0,
        usage_percent: 45,
        effective_quota: quota
      };
      if (!localState.households) localState.households = [];
      // Replace if existing with same household_id or prepend
      const existingHhIdx = localState.households.findIndex(h => h.household_id === hhId);
      if (existingHhIdx >= 0) {
        localState.households[existingHhIdx] = newHousehold;
      } else {
        localState.households.unshift(newHousehold);
      }
      z.households_count = (z.households_count || 0) + 1;
      try {
        localStorage.setItem('aquafair_custom_households', JSON.stringify(localState.households));
        localStorage.setItem('aquafair_custom_zones', JSON.stringify(localState.zones));
      } catch (e) {}
    } else if (role === 'Tanker Driver') {
      if (!licenseNo) licenseNo = `MH14-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      hhId = `DRV-${licenseNo.slice(0, 8)}`;
      const newDriver = {
        id: Date.now(),
        name: data.name.trim(),
        phone: data.phone?.trim() || '',
        license_number: licenseNo,
        experience_years: Number(data.experience_years) || 5,
        emergency_contact: data.emergency_contact || '',
        status: 'Available',
        assigned_tanker_vehicle: data.vehicle_no || '',
        notes: `Registered via Driver Portal. Depot: ${data.address || 'Central Headworks ESR'}`,
        created_at: new Date().toISOString()
      };
      if (!localState.fleetDrivers) localState.fleetDrivers = [];
      localState.fleetDrivers.unshift(newDriver);
      try {
        localStorage.setItem('aquafair_fleet_drivers', JSON.stringify(localState.fleetDrivers));
      } catch (e) {}

      if (localState.alerts) {
        localState.alerts.unshift({
          id: Date.now(),
          level: 'info',
          category: 'tanker',
          title: `New Tanker Driver Registered: ${data.name} (DL: ${licenseNo})`,
          message: `Heavy vehicle driver ${data.name} registered. Vehicle: ${data.vehicle_no || 'Depot Standby'}.`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }
    } else if (role === 'Dispatch Team Leader' || role === 'Dispatch Member') {
      if (!badgeId) badgeId = `NP-CREW-${Math.floor(10 + Math.random() * 90)}`;
      hhId = badgeId;
      const newMember = {
        id: Date.now(),
        name: data.name.trim(),
        role: data.dispatch_role || 'Field Supervisor',
        phone: data.phone?.trim() || '',
        badge_id: badgeId,
        status: 'Active',
        ward_assignment: data.ward_assignment || z.name || 'All Wards',
        notes: 'Registered via Field Crew Portal.',
        created_at: new Date().toISOString()
      };
      if (!localState.dispatchTeam) localState.dispatchTeam = [];
      localState.dispatchTeam.unshift(newMember);
      try {
        localStorage.setItem('aquafair_dispatch_team', JSON.stringify(localState.dispatchTeam));
      } catch (e) {}

      if (localState.alerts) {
        localState.alerts.unshift({
          id: Date.now(),
          level: 'info',
          category: 'system',
          title: `New Dispatch Squad Member Registered: ${data.name} (${data.dispatch_role || 'Field Crew'})`,
          message: `Crew member ${data.name} registered under Badge ${badgeId}.`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }
    } else if (role === 'Municipal Officer') {
      if (!badgeId) badgeId = `NP-OFF-${Math.floor(100 + Math.random() * 900)}`;
      hhId = badgeId;
      if (localState.alerts) {
        localState.alerts.unshift({
          id: Date.now(),
          level: 'info',
          category: 'system',
          title: `New Municipal Officer Registered: ${data.name} (${data.designation || 'Administrative Desk'})`,
          message: `Officer ${data.name} registered under Badge ${badgeId}. Jurisdiction: ${z.name}.`,
          timestamp: new Date().toISOString(),
          resolved: false
        });
      }
    }

    if (!savedUser) {
      savedUser = {
        name: data.name,
        username: data.username || data.name.toLowerCase().replace(/\s+/g, '_'),
        email: data.email,
        role: role === 'Dispatch Member' ? 'Dispatch Team Leader' : role,
        household_id: hhId,
        address: data.address,
        ward: z.name,
        ward_id: z.id,
        ward_number: z.ward_number,
        ward_name: z.name,
        phone: data.phone,
        vehicle_no: data.vehicle_no || '',
        license_number: licenseNo,
        badge_id: badgeId,
        designation: data.designation || ''
      };
    }

    // Persist registered credentials into local array for future logins
    const userToSave = { ...data, ...savedUser, password: data.password };
    const filteredUsers = users.filter(u => 
      u.email?.toLowerCase() !== savedUser.email?.toLowerCase() &&
      u.username?.toLowerCase() !== savedUser.username?.toLowerCase()
    );
    filteredUsers.push(userToSave);
    localStorage.setItem('aquafair_users', JSON.stringify(filteredUsers));

    // Automatically establish active authenticated session
    localStorage.setItem('aquafair_session', JSON.stringify(savedUser));
    localStorage.setItem('aquabalance_session', JSON.stringify(savedUser));

    // Dispatch global events so UI views update immediately
    try { window.dispatchEvent(new CustomEvent('aquafair_auth_change', { detail: savedUser })); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('aquafair_state_change')); } catch (e) {}

    return { success: true, user: savedUser, household_id: hhId };
  },

  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem('aquafair_session') || localStorage.getItem('aquabalance_session') || 'null');
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('aquafair_session');
    localStorage.removeItem('aquabalance_session');
    try { window.dispatchEvent(new CustomEvent('aquafair_auth_change', { detail: null })); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('aquafair_state_change')); } catch (e) {}
  },

  // ---------------- MUNICIPAL GRIEVANCES & COMPLAINTS DESK ---------------- //
  async getGrievances(wardId = null, filterStatus = 'all') {
    const isAll = !wardId || String(wardId).toLowerCase() === 'all' || String(wardId) === '0';
    try {
      const url = new URL(`${API_BASE}/grievances/`, window.location.origin);
      if (!isAll) url.searchParams.append('ward', wardId);
      if (filterStatus && filterStatus !== 'all') url.searchParams.append('status', filterStatus);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localState.grievances = data;
          return data;
        }
      }
    } catch {}

    let list = localState.grievances || [];
    if (!isAll) {
      const wid = Number(wardId);
      list = list.filter(g => g.ward_id === wid || g.ward_number === wid || (g.ward_name && g.ward_name.includes(`Ward ${wid}`)));
    }
    if (filterStatus && filterStatus !== 'all') {
      list = list.filter(g => g.status?.toLowerCase() === filterStatus.toLowerCase());
    }
    return list;
  },

  async dispatchGrievanceTeam(id, { technician, eta_minutes }) {
    try {
      const res = await fetch(`${API_BASE}/grievances/${id}/dispatch/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technician, eta_minutes })
      });
      if (res.ok) {
        const data = await res.json();
        const g = (localState.grievances || []).find(item => item.id === id);
        if (g) {
          Object.assign(g, data.grievance);
        }
        return data;
      }
    } catch {}

    const g = (localState.grievances || []).find(item => item.id === id);
    if (g) {
      g.status = 'Field Team Dispatched';
      g.assigned_technician = technician || 'Municipal Line Repair Crew #1';
      g.dispatched_at = new Date().toISOString();
      g.eta_minutes = Number(eta_minutes) || 30;
      try {
        window.dispatchEvent(new CustomEvent('aquafair_grievance_status_changed', { detail: g }));
        window.dispatchEvent(new CustomEvent('aquafair_state_change'));
      } catch (e) {}
      return { success: true, grievance: g };
    }
    return { success: false, error: 'Grievance ticket not found' };
  },

  async updateGrievanceStatus(id, { status: newStatus, resolution_notes, assigned_technician } = {}) {
    try {
      const res = await fetch(`${API_BASE}/grievances/${id}/status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, resolution_notes, assigned_technician })
      });
      if (res.ok) {
        const data = await res.json();
        const g = (localState.grievances || []).find(item => item.id === id);
        if (g) Object.assign(g, data.grievance);
        try {
          window.dispatchEvent(new CustomEvent('aquafair_grievance_status_changed', { detail: data.grievance }));
          window.dispatchEvent(new CustomEvent('aquafair_state_change'));
        } catch (e) {}
        return data;
      }
    } catch {}

    const g = (localState.grievances || []).find(item => item.id === id);
    if (g) {
      g.status = newStatus || 'In Progress';
      if (assigned_technician) g.assigned_technician = assigned_technician;
      if (resolution_notes) g.resolution_notes = resolution_notes;
      if (newStatus === 'Resolved') g.resolved_at = new Date().toISOString();
      try {
        window.dispatchEvent(new CustomEvent('aquafair_grievance_status_changed', { detail: g }));
        window.dispatchEvent(new CustomEvent('aquafair_state_change'));
      } catch (e) {}
      return { success: true, grievance: g };
    }
    return { success: false, error: 'Grievance ticket not found' };
  },

  async resolveGrievance(id, { resolution_notes, user_role } = {}) {
    let role = user_role;
    try {
      if (!role && typeof window !== 'undefined' && window.localStorage) {
        const s = JSON.parse(localStorage.getItem('aquafair_session') || '{}');
        role = s.role;
      }
    } catch {}

    if (role === 'Municipal Officer' || role === 'Administrator') {
      return {
        success: false,
        error: 'Permission Denied: Resolution authority is reserved strictly for Dispatch Team Leaders and on-site field technicians. Municipal Officers have read and audit visibility only.'
      };
    }

    try {
      const res = await fetch(`${API_BASE}/grievances/${id}/resolve/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution_notes, user_role: role })
      });
      if (res.ok) {
        const data = await res.json();
        const g = (localState.grievances || []).find(item => item.id === id);
        if (g) {
          Object.assign(g, data.grievance);
        }
        try {
          window.dispatchEvent(new CustomEvent('aquafair_grievance_resolved', { detail: data.grievance }));
          window.dispatchEvent(new CustomEvent('aquafair_state_change'));
        } catch (e) {}
        return data;
      }
    } catch {}

    const g = (localState.grievances || []).find(item => item.id === id);
    if (g) {
      g.status = 'Resolved';
      g.resolution_notes = resolution_notes || 'Maintenance completed by field technician. Line pressure normalized.';
      g.resolved_at = new Date().toISOString();
      try {
        window.dispatchEvent(new CustomEvent('aquafair_grievance_resolved', { detail: g }));
        window.dispatchEvent(new CustomEvent('aquafair_state_change'));
      } catch (e) {}
      return { success: true, grievance: g };
    }
    return { success: false, error: 'Grievance ticket not found' };
  },

  // ---------------- EMERGENCY MUNICIPAL WATER TANKER FLEET ---------------- //
  async getTankers(wardId = null) {
    const isAll = !wardId || String(wardId).toLowerCase() === 'all' || String(wardId) === '0';
    try {
      const url = new URL(`${API_BASE}/tankers/`, window.location.origin);
      if (!isAll) url.searchParams.append('ward', wardId);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          localState.tankers = data;
          return data;
        }
      }
    } catch {}

    let list = localState.tankers || [];
    if (!isAll) {
      const wid = Number(wardId);
      list = list.filter(t => t.target_ward_id === wid || t.target_ward_number === wid);
    }
    return list;
  },

  async dispatchTanker(data) {
    try {
      const res = await fetch(`${API_BASE}/tankers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const out = await res.json();
        if (!localState.tankers) localState.tankers = [];
        localState.tankers.unshift(out.tanker);

        // Update local fleet vehicle & driver status
        if (out.tanker.vehicle_no && localState.fleetTankers) {
          const ft = localState.fleetTankers.find(t => t.vehicle_no === out.tanker.vehicle_no);
          if (ft) ft.status = 'In Transit';
        }
        if (out.tanker.driver_name && localState.fleetDrivers) {
          const fd = localState.fleetDrivers.find(d => d.name === out.tanker.driver_name);
          if (fd) fd.status = 'On Route';
        }

        try {
          localStorage.setItem('aquafair_latest_dispatched_tanker', JSON.stringify(out.tanker));
          window.dispatchEvent(new CustomEvent('aquafair_tanker_dispatched', { detail: out.tanker }));
        } catch (e) {}
        return out;
      }
    } catch {}

    const teamString = Array.isArray(data.team_members) 
      ? data.team_members.filter(Boolean).join(', ')
      : (data.team_members || '');

    const newTanker = {
      id: Date.now(),
      dispatch_code: `TNK-MH12-${Math.floor(100 + Math.random() * 900)}`,
      fleet_tanker: data.fleet_tanker || null,
      fleet_driver: data.fleet_driver || null,
      vehicle_no: data.vehicle_no || 'MH-12-AQ-105',
      driver_name: data.driver_name || 'Municipal Driver',
      driver_phone: data.driver_phone || '9822001122',
      team_members: teamString,
      capacity_liters: Number(data.capacity_liters) || 5000,
      target_ward_id: data.target_ward_id || 1,
      target_ward_number: data.target_ward_number || 1,
      target_ward_name: data.target_ward_name || 'Ward 1 - Shivaji Nagar',
      destination_location: data.destination_location || 'Community Water Point',
      requester_name: data.requester_name || 'Nagar Parishad Administrative Desk',
      purpose: data.purpose || 'Emergency potable distribution',
      status: 'In Transit',
      departure_time: new Date().toISOString(),
      delivered_at: null,
      notes: data.notes || 'Emergency dispatch authorized by Nagar Parishad Municipal Officer.'
    };
    if (!localState.tankers) localState.tankers = [];
    localState.tankers.unshift(newTanker);

    // Update fallback fleet statuses
    if (localState.fleetTankers) {
      const ft = localState.fleetTankers.find(t => t.vehicle_no === newTanker.vehicle_no);
      if (ft) ft.status = 'In Transit';
    }
    if (localState.fleetDrivers) {
      const fd = localState.fleetDrivers.find(d => d.name === newTanker.driver_name);
      if (fd) fd.status = 'On Route';
    }

    try {
      localStorage.setItem('aquafair_latest_dispatched_tanker', JSON.stringify(newTanker));
      window.dispatchEvent(new CustomEvent('aquafair_tanker_dispatched', { detail: newTanker }));
    } catch (e) {}

    // SCADA alert
    const crewInfo = newTanker.team_members ? ` | Field Crew: ${newTanker.team_members}` : '';
    const alert = {
      id: Date.now(),
      level: 'critical',
      category: 'tanker',
      title: `Emergency Tanker Dispatched: ${newTanker.vehicle_no} to ${newTanker.target_ward_name}`,
      message: `${newTanker.capacity_liters.toLocaleString()} L tanker dispatched to ${newTanker.destination_location}. Driver: ${newTanker.driver_name} (${newTanker.driver_phone})${crewInfo}.`,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    if (localState.alerts) localState.alerts.unshift(alert);

    return { success: true, tanker: newTanker };
  },

  async updateTankerStatus(id, newStatus, options = {}) {
    let role = options.user_role;
    try {
      if (!role && typeof window !== 'undefined' && window.localStorage) {
        const s = JSON.parse(localStorage.getItem('aquafair_session') || '{}');
        role = s.role;
      }
    } catch {}

    if ((newStatus === 'Delivered' || newStatus === 'In Transit') && (role === 'Municipal Officer' || role === 'Administrator')) {
      return {
        success: false,
        error: 'Permission Denied: Tanker delivery confirmation is reserved exclusively for certified Tanker Drivers upon arrival. Municipal Officers have tracking and telemetry visibility only.'
      };
    }

    try {
      const res = await fetch(`${API_BASE}/tankers/${id}/status/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: options.notes, user_role: role })
      });
      if (res.ok) {
        const out = await res.json();
        const t = (localState.tankers || []).find(item => item.id === id);
        if (t) Object.assign(t, out.tanker);

        // If delivered, release local fleet status
        if (newStatus === 'Delivered' || newStatus === 'Cancelled') {
          if (t?.vehicle_no && localState.fleetTankers) {
            const ft = localState.fleetTankers.find(v => v.vehicle_no === t.vehicle_no);
            if (ft) ft.status = 'Available';
          }
          if (t?.driver_name && localState.fleetDrivers) {
            const fd = localState.fleetDrivers.find(d => d.name === t.driver_name);
            if (fd) fd.status = 'Available';
          }
        }

        try {
          window.dispatchEvent(new CustomEvent('aquafair_tanker_delivered', { detail: out.tanker }));
          window.dispatchEvent(new CustomEvent('aquafair_state_change'));
        } catch (e) {}

        return out;
      }
    } catch {}

    const t = (localState.tankers || []).find(item => item.id === id);
    if (t) {
      t.status = newStatus;
      if (options.notes) t.notes = `${t.notes || ''} | Delivery: ${options.notes}`.trim();
      if (newStatus === 'Delivered') {
        t.delivered_at = new Date().toISOString();
        if (t.vehicle_no && localState.fleetTankers) {
          const ft = localState.fleetTankers.find(v => v.vehicle_no === t.vehicle_no);
          if (ft) ft.status = 'Available';
        }
        if (t.driver_name && localState.fleetDrivers) {
          const fd = localState.fleetDrivers.find(d => d.name === t.driver_name);
          if (fd) fd.status = 'Available';
        }
      }
      try {
        window.dispatchEvent(new CustomEvent('aquafair_tanker_delivered', { detail: t }));
        window.dispatchEvent(new CustomEvent('aquafair_state_change'));
      } catch (e) {}
      return { success: true, tanker: t };
    }
    return { success: false, error: 'Tanker record not found' };
  },

  // ---------------- MUNICIPAL FLEET VEHICLE REGISTRY ---------------- //
  async getFleetTankers(statusFilter = null) {
    try {
      const url = new URL(`${API_BASE}/fleet/tankers/`, window.location.origin);
      if (statusFilter && statusFilter !== 'all') url.searchParams.append('status', statusFilter);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localState.fleetTankers = data;
          return data;
        }
      }
    } catch {}

    let list = localState.fleetTankers || [];
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter(t => t.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    return list;
  },

  async createFleetTanker(data) {
    try {
      const res = await fetch(`${API_BASE}/fleet/tankers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const out = await res.json();
        if (!localState.fleetTankers) localState.fleetTankers = [];
        const existingIdx = localState.fleetTankers.findIndex(t => t.vehicle_no === out.tanker.vehicle_no);
        if (existingIdx >= 0) {
          localState.fleetTankers[existingIdx] = out.tanker;
        } else {
          localState.fleetTankers.unshift(out.tanker);
        }
        return out;
      }
    } catch {}

    const newVehicle = {
      id: Date.now(),
      vehicle_no: (data.vehicle_no || '').toUpperCase().trim(),
      tanker_name: data.tanker_name || 'Aqua Tanker',
      capacity_liters: Number(data.capacity_liters) || 5000,
      model_make: data.model_make || 'Tata 1613 SE',
      ownership_type: data.ownership_type || 'Municipal Owned',
      status: data.status || 'Available',
      gps_tracking_id: data.gps_tracking_id || `GPS-${Date.now().toString().slice(-4)}`,
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };
    if (!localState.fleetTankers) localState.fleetTankers = [];
    localState.fleetTankers.unshift(newVehicle);
    return { success: true, tanker: newVehicle };
  },

  // ---------------- CERTIFIED DRIVER REGISTRY ---------------- //
  async getFleetDrivers(statusFilter = null) {
    try {
      const url = new URL(`${API_BASE}/fleet/drivers/`, window.location.origin);
      if (statusFilter && statusFilter !== 'all') url.searchParams.append('status', statusFilter);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localState.fleetDrivers = data;
          return data;
        }
      }
    } catch {}

    let list = localState.fleetDrivers || [];
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter(d => d.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    return list;
  },

  async createFleetDriver(data) {
    try {
      const res = await fetch(`${API_BASE}/fleet/drivers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const out = await res.json();
        if (!localState.fleetDrivers) localState.fleetDrivers = [];
        const existingIdx = localState.fleetDrivers.findIndex(d => d.license_number === out.driver.license_number);
        if (existingIdx >= 0) {
          localState.fleetDrivers[existingIdx] = out.driver;
        } else {
          localState.fleetDrivers.unshift(out.driver);
        }
        return out;
      }
    } catch {}

    const newDriver = {
      id: Date.now(),
      name: data.name.trim(),
      phone: data.phone.trim(),
      license_number: data.license_number || `MH12-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
      experience_years: Number(data.experience_years) || 5,
      emergency_contact: data.emergency_contact || '',
      status: data.status || 'Available',
      assigned_tanker_vehicle: data.assigned_tanker_vehicle || '',
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };
    if (!localState.fleetDrivers) localState.fleetDrivers = [];
    localState.fleetDrivers.unshift(newDriver);
    return { success: true, driver: newDriver };
  },

  // ---------------- DISPATCH TEAM CREW REGISTRY ---------------- //
  async getDispatchTeam(roleFilter = null, statusFilter = null) {
    try {
      const url = new URL(`${API_BASE}/fleet/team/`, window.location.origin);
      if (roleFilter && roleFilter !== 'all') url.searchParams.append('role', roleFilter);
      if (statusFilter && statusFilter !== 'all') url.searchParams.append('status', statusFilter);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localState.dispatchTeam = data;
          return data;
        }
      }
    } catch {}

    let list = localState.dispatchTeam || [];
    if (roleFilter && roleFilter !== 'all') {
      list = list.filter(m => m.role?.toLowerCase().includes(roleFilter.toLowerCase()));
    }
    if (statusFilter && statusFilter !== 'all') {
      list = list.filter(m => m.status?.toLowerCase() === statusFilter.toLowerCase());
    }
    return list;
  },

  async createDispatchTeamMember(data) {
    try {
      const res = await fetch(`${API_BASE}/fleet/team/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const out = await res.json();
        if (!localState.dispatchTeam) localState.dispatchTeam = [];
        localState.dispatchTeam.unshift(out.member);
        return out;
      }
    } catch {}

    const newMember = {
      id: Date.now(),
      name: data.name.trim(),
      role: data.role || 'Valve Technician',
      phone: data.phone.trim(),
      badge_id: data.badge_id || `NP-CREW-${Math.floor(10 + Math.random() * 90)}`,
      status: data.status || 'Active',
      ward_assignment: data.ward_assignment || 'All Wards',
      notes: data.notes || '',
      created_at: new Date().toISOString()
    };
    if (!localState.dispatchTeam) localState.dispatchTeam = [];
    localState.dispatchTeam.unshift(newMember);
    return { success: true, member: newMember };
  },

  // ---------------- NAGAR PARISHAD REAL DATA INGESTION & EXPORT ---------------- //
  async importNagarParishadData({ wards = [], households = [], replaceAll = false }) {
    // 1. Attempt REST API backend sync
    try {
      const res = await fetch(`${API_BASE}/import/nagarparishad/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          replace_all: replaceAll,
          wards,
          households
        })
      });
      if (res.ok) {
        const data = await res.json();
        this._syncLocalFromImport(wards, households, replaceAll);
        return data;
      }
    } catch {}

    // 2. Client-side localState fallback (if backend is offline)
    return this._syncLocalFromImport(wards, households, replaceAll);
  },

  _syncLocalFromImport(wards, households, replaceAll) {
    if (replaceAll) {
      localState.zones = [];
      localState.households = [];
    }

    const wardMap = new Map();
    // Ingest wards
    wards.forEach((w, idx) => {
      const wNum = Number(w.ward_number || w.ward_no || w.ward || (idx + 1));
      const rawName = w.name || w.ward_name || `Ward ${wNum}`;
      const name = rawName.toLowerCase().startsWith('ward') ? rawName : `Ward ${wNum} - ${rawName}`;
      const hhCount = Number(w.households_count || w.total_houses || 0);
      const targetL = Number(w.target_liters || (hhCount * 500) || 100000);

      const zoneObj = {
        id: wNum,
        ward_number: wNum,
        name,
        sector_type: w.sector_type || 'Residential Colony',
        elevation_tier: w.elevation_tier || 'Standard',
        supply_timing: w.supply_timing || '06:00 AM - 08:30 AM',
        households_count: hhCount,
        target_liters: targetL,
        delivered_liters: 0,
        flow_rate: 18.5,
        valve_percent: 90,
        status: 'Balanced',
        leak_detected: false,
        abnormal_usage_detected: false,
        equity_score: 99.2,
        progress_percent: 0,
        per_household_delivered: 0,
        per_household_target: 500
      };

      const existingIdx = localState.zones.findIndex(z => z.id === wNum || z.ward_number === wNum);
      if (existingIdx >= 0) {
        localState.zones[existingIdx] = { ...localState.zones[existingIdx], ...zoneObj };
      } else {
        localState.zones.push(zoneObj);
      }
      wardMap.set(wNum, zoneObj);
    });

    // Ingest households
    if (!localState.households) localState.households = [];
    const now = Date.now();
    households.forEach((h, idx) => {
      const wNum = Number(h.ward_number || h.ward_no || h.ward || 1);
      const targetZone = wardMap.get(wNum) || localState.zones.find(z => z.ward_number === wNum || z.id === wNum);
      const zoneId = targetZone ? targetZone.id : wNum;
      const zoneName = targetZone ? targetZone.name : `Ward ${wNum}`;

      const members = Number(h.members_count || h.members || 4);
      const quota = Number(h.daily_quota_liters || (members * 135));
      const usage = Number(h.current_usage_liters || Math.round(quota * 0.68));
      const hhId = String(h.household_id || h.consumer_id || h.property_id || `NP-W${wNum}-${1000 + idx}`);

      const hhObj = {
        id: now + idx,
        zone: zoneId,
        ward_number: wNum,
        zone_name: zoneName,
        household_id: hhId,
        owner_name: h.owner_name || h.resident_name || h.name || 'Nagar Parishad Resident',
        address_or_lane: h.address_or_lane || h.address || h.lane || 'Lane 1',
        phone: h.phone || h.mobile || '',
        members_count: members,
        daily_quota_liters: quota,
        current_usage_liters: usage,
        meter_status: h.meter_status || 'Active',
        abnormal_draw: Boolean(h.abnormal_draw),
        extra_water_granted: 0.0,
        usage_percent: Math.round((usage / quota) * 100),
        effective_quota: quota
      };

      const existingHhIdx = localState.households.findIndex(x => x.household_id?.toLowerCase() === hhId.toLowerCase());
      if (existingHhIdx >= 0) {
        localState.households[existingHhIdx] = { ...localState.households[existingHhIdx], ...hhObj };
      } else {
        localState.households.push(hhObj);
      }
    });

    // Update household counts on zones only if imported count exceeds current estimate or was 0
    localState.zones.forEach(z => {
      const count = localState.households.filter(h => h.zone === z.id || h.ward_number === z.ward_number).length;
      if (count > (z.households_count || 0) || !z.households_count) {
        z.households_count = count;
        z.target_liters = count * 500;
      }
    });

    // Sort zones by ward number
    localState.zones.sort((a, b) => (a.ward_number || a.id) - (b.ward_number || b.id));

    // Save to localStorage so persists across reloads
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('aquafair_custom_zones', JSON.stringify(localState.zones));
        window.localStorage.setItem('aquafair_custom_households', JSON.stringify(localState.households));
      }
    } catch {}

    // Add SCADA alert
    if (localState.alerts) {
      localState.alerts.unshift({
        id: Date.now(),
        level: 'info',
        category: 'equity',
        title: `Nagar Parishad Records Synchronized: ${wards.length} Wards, ${households.length} Households`,
        message: `Official municipal ledger imported. AquaFair SCADA monitoring ${localState.households.length} total connections.`,
        timestamp: new Date().toISOString(),
        resolved: false
      });
    }

    return {
      success: true,
      imported_wards_count: wards.length,
      imported_households_count: households.length,
      total_zones: localState.zones.length,
      total_households: localState.households.length
    };
  },

  async exportNagarParishadData(wardId = null) {
    try {
      const url = new URL(`${API_BASE}/export/nagarparishad/`, window.location.origin);
      if (wardId && String(wardId).toLowerCase() !== 'all') {
        url.searchParams.append('ward', wardId);
      }
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch {}

    // Fallback to localState
    let zones = localState.zones || [];
    let households = localState.households || [];

    if (wardId && String(wardId).toLowerCase() !== 'all') {
      const wid = Number(wardId);
      zones = zones.filter(z => z.id === wid || z.ward_number === wid);
      households = households.filter(h => h.zone === wid || h.ward_number === wid);
    }

    return {
      municipality: 'AquaFair Municipal Council (Nagar Parishad)',
      timestamp: new Date().toISOString(),
      total_wards: zones.length,
      total_households: households.length,
      wards: zones,
      households: households
    };
  },

  async sendHardwareTelemetry(payload) {
    try {
      const res = await fetch(`${API_BASE}/hardware/telemetry/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tank_capacity_liters) {
          localState.system.tank_capacity_liters = Number(data.tank_capacity_liters);
        }
        if (data.tank_level_liters) {
          localState.system.tank_level_liters = Number(data.tank_level_liters);
        }
        try { window.dispatchEvent(new CustomEvent('aquafair_state_change')); } catch (e) {}
        return data;
      }
    } catch {}

    if (payload.tank_capacity_liters) {
      localState.system.tank_capacity_liters = Number(payload.tank_capacity_liters);
    }
    if (payload.tank_level_liters) {
      localState.system.tank_level_liters = Number(payload.tank_level_liters);
    }
    try { window.dispatchEvent(new CustomEvent('aquafair_state_change')); } catch (e) {}
    return {
      status: 'success',
      tank_capacity_liters: localState.system.tank_capacity_liters,
      tank_level_liters: localState.system.tank_level_liters,
      pump_command: localState.system.pump_status,
      valves_command: [{ ward_number: payload.wards?.[0]?.ward_number || 5, valve_percent: 90 }]
    };
  }
};
