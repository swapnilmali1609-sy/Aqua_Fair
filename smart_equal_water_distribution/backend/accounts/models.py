from django.db import models
from django.contrib.auth.models import User

class Zone(models.Model):
    """
    Represents a Municipal Ward, Apartment Cluster, or Household Community Sector
    monitored under AquaFair for equitable water allocation and leak detection.
    """
    STATUS_CHOICES = [
        ('Balanced', 'Balanced (Equitable Flow)'),
        ('Throttled', 'Throttled (Elevation/Equity Trim)'),
        ('Paused', 'Paused (Feeder Closed)'),
        ('Completed', 'Completed (Fair Quota Achieved)'),
    ]

    ELEVATION_CHOICES = [
        ('Lowland', 'Lowland (High Natural Pressure)'),
        ('Standard', 'Standard Elevation'),
        ('High-Altitude', 'High-Altitude Ridge (Low Natural Pressure)'),
        ('Tail-End', 'Tail-End Sector (Distance Loss)'),
    ]

    name = models.CharField(max_length=150)  # e.g. "Ward 1 - Shivaji Nagar"
    ward_number = models.IntegerField(default=1)
    sector_type = models.CharField(max_length=100, default='Residential')  # Residential, Apartments, Mixed
    households_count = models.IntegerField(default=250)  # Number of residential families / homes
    target_liters = models.FloatField(default=125000.0)  # Daily equitable quota
    delivered_liters = models.FloatField(default=122500.0)
    flow_rate = models.FloatField(default=18.5)  # Flow rate in L/min
    valve_percent = models.IntegerField(default=90)  # Sluice / solenoid valve aperture 0-100%
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Balanced')
    elevation_tier = models.CharField(max_length=50, choices=ELEVATION_CHOICES, default='Standard')
    supply_timing = models.CharField(max_length=100, default='06:00 AM - 08:30 AM')
    
    # AquaFair Smart Monitoring & Leak Detection additions
    leak_detected = models.BooleanField(default=False)
    abnormal_usage_detected = models.BooleanField(default=False)
    contamination_detected = models.BooleanField(default=False)
    ph_level = models.FloatField(default=7.4)
    equity_score = models.FloatField(default=99.2)  # Percentage fairness score
    is_hardware_active = models.BooleanField(default=False)  # Hardware-in-the-Loop live operations isolation
    
    order = models.IntegerField(default=1)
    notes = models.TextField(blank=True, default='')
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', 'ward_number', 'id']

    def __str__(self):
        return f"{self.name} ({self.households_count} Households)"

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('Municipal Officer', 'Municipal / Administrative Officer'),
        ('Field Technician', 'Field Technician / Ward Operator'),
        ('Citizen / Household', 'Citizen / Household Resident (कुटुंब)'),
        ('Tanker Driver', 'Municipal Water Tanker Driver'),
        ('Dispatch Team Leader', 'Field Dispatch & Maintenance Team Leader'),
        ('Administrator', 'Municipal / Administrative Officer'),
        ('Farmer', 'Citizen / Household'),
        ('Field Operator', 'Field Technician / Ward Operator'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='Municipal Officer')
    phone = models.CharField(max_length=30, blank=True, default='')
    address = models.CharField(max_length=255, blank=True, default='')
    household_id = models.CharField(max_length=50, blank=True, default='AF-W1-1042')
    household_name = models.CharField(max_length=100, blank=True, default='Patil Residence')
    assigned_zone = models.ForeignKey(Zone, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_residents')

    def __str__(self):
        return f"{self.user.username} ({self.role})"

class SystemState(models.Model):
    """AquaFair Central Storage Tank, Pumping Station, and Anomaly Detection Status."""
    tank_name = models.CharField(max_length=150, default='Municipal Elevated Storage Reservoir (ESR)')
    tank_capacity_liters = models.FloatField(default=2500000.0)  # 2,500,000 L (2.5 ML) Storage Tank
    tank_level_liters = models.FloatField(default=1950000.0)     # 1,950 kL (78% filled)
    pump_status = models.CharField(max_length=20, default='Running')  # Running, Stopped, Standby
    system_mode = models.CharField(max_length=20, default='Auto')      # Auto, Manual
    pump_efficiency = models.FloatField(default=95.4)                  # %
    pressure_psi = models.FloatField(default=48.0)                     # PSI
    pumping_station = models.CharField(max_length=150, default='AquaFair Central Pumping Station')
    
    # Real-Time Water Quality Monitoring & Contamination Detection (Objectives 1 & 3)
    chlorination_ppm = models.FloatField(default=0.8)                  # Residual Chlorine: Optimal 0.2 - 1.0 ppm
    turbidity_ntu = models.FloatField(default=1.2)                     # Turbidity: Safe < 5.0 NTU
    ph_level = models.FloatField(default=7.4)                          # pH: Optimal 6.5 - 8.5
    tds_ppm = models.FloatField(default=185.0)                         # Total Dissolved Solids: Optimal 50 - 300 ppm
    water_temp_c = models.FloatField(default=24.2)                     # Temperature in °C
    water_quality_index = models.FloatField(default=96.5)              # WQI Scale 0-100 (Grade A)
    contamination_detected = models.BooleanField(default=False)        # Emergency Contamination Flag
    contamination_status = models.CharField(max_length=100, default='Potable (Safe Drinking Quality)')

    # AquaFair Wastage & Protection Additions
    overflow_guard = models.BooleanField(default=True)
    overflow_status = models.CharField(max_length=50, default='Safe (<90%)')
    dry_run_protection = models.BooleanField(default=True)
    leak_detection_status = models.CharField(max_length=50, default='Normal (Zero Active Leaks)')
    abnormal_usage_alerts_count = models.IntegerField(default=0)
    water_wastage_prevented_liters = models.FloatField(default=92500.0)

    last_updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"AquaFair System ({self.system_mode}, Pump: {self.pump_status}, WQI: {self.water_quality_index})"

class TelemetryReading(models.Model):
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='telemetry')
    timestamp = models.DateTimeField(auto_now_add=True)
    flow_rate = models.FloatField()
    delivered_snapshot = models.FloatField()
    valve_percent = models.IntegerField()
    pressure_bar = models.FloatField(default=3.2)
    ph_level = models.FloatField(default=7.4)
    turbidity_ntu = models.FloatField(default=1.2)
    is_anomaly = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.zone.name} @ {self.timestamp}: {self.flow_rate} L/min"

class SystemAlert(models.Model):
    LEVEL_CHOICES = [
        ('critical', 'Critical (Pipe Burst / Contamination / Overflow Risk)'),
        ('warning', 'Warning (Abnormal Draw / Low Water / Quality Shift)'),
        ('info', 'Info (Fair Quota Achieved / Shift Start)'),
    ]

    CATEGORY_CHOICES = [
        ('contamination', 'Water Contamination Detection'),
        ('quality', 'Water Quality Monitoring'),
        ('leak', 'Leak Detection'),
        ('overflow', 'Overflow Prevention'),
        ('low_water', 'Low Water Levels'),
        ('abnormal', 'Abnormal Usage'),
        ('equity', 'Fair Distribution Equity'),
        ('system', 'System Telemetry'),
    ]

    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='warning')
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='equity')
    title = models.CharField(max_length=255)
    message = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"[{self.level.upper()}] {self.title}"


class Household(models.Model):
    """
    Individual residential home / family connection in a Municipal Ward.
    Monitors daily water quota consumption, abnormal suction pump draw, and extra demands.
    """
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='households')
    household_id = models.CharField(max_length=50, unique=True)  # e.g. "AF-W1-1042"
    owner_name = models.CharField(max_length=150)                # e.g. "Ramesh Patil"
    address_or_lane = models.CharField(max_length=200, default='Lane 1')
    phone = models.CharField(max_length=30, blank=True, default='')
    members_count = models.IntegerField(default=4)               # Family members count
    daily_quota_liters = models.FloatField(default=540.0)        # 135 L/person * members
    current_usage_liters = models.FloatField(default=380.0)      # Today's consumption
    meter_status = models.CharField(max_length=30, default='Active')  # Active, Standby, Flagged
    abnormal_draw = models.BooleanField(default=False)           # Flagged for 1 HP illegal suction pump
    extra_water_granted = models.FloatField(default=0.0)         # Approved extra quota in liters
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['zone', 'household_id']

    def __str__(self):
        return f"{self.household_id} - {self.owner_name} ({self.zone.name})"


class WaterDemandRequest(models.Model):
    """
    Formal request submitted by a household or ward community for extra water allocation
    (e.g., weddings, religious festivals, medical emergency, underground sump refill).
    """
    URGENCY_CHOICES = [
        ('Normal', 'Normal (Event in 24-48 hrs)'),
        ('High', 'High Priority (Same-day requirement)'),
        ('Emergency', 'Emergency (Critical / Health need)'),
    ]

    STATUS_CHOICES = [
        ('Pending', 'Pending Review'),
        ('Approved', 'Approved (Extra Quota Dispatched)'),
        ('Fulfilled', 'Fulfilled & Delivered'),
        ('Rejected', 'Rejected (Exceeds Head Capacity)'),
    ]

    household = models.ForeignKey(Household, null=True, blank=True, on_delete=models.CASCADE, related_name='demand_requests')
    zone = models.ForeignKey(Zone, on_delete=models.CASCADE, related_name='demand_requests')
    requested_by = models.CharField(max_length=150)
    household_code = models.CharField(max_length=50, blank=True, default='')
    extra_liters = models.FloatField(default=500.0)
    reason = models.CharField(max_length=255)
    urgency = models.CharField(max_length=30, choices=URGENCY_CHOICES, default='Normal')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='Pending')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Demand [{self.status}]: {self.requested_by} ({self.extra_liters} L - {self.zone.name})"


class Grievance(models.Model):
    """
    Municipal Citizen Incident Grievance & Maintenance Dispatch Ticket.
    Enables citizens and field workers to report leaks, overflows, pump suction,
    or valve malfunctions and track municipal dispatch and resolution.
    """
    PRIORITY_CHOICES = [
        ('Normal', 'Normal Priority'),
        ('High', 'High Priority (Major Loss)'),
        ('Emergency', 'Emergency / Health Hazard'),
    ]

    STATUS_CHOICES = [
        ('Pending Investigation', 'Pending Investigation'),
        ('Field Team Dispatched', 'Field Team Dispatched'),
        ('In Progress', 'In Progress'),
        ('Resolved', 'Resolved & Pressure Normalized'),
        ('Closed', 'Closed'),
    ]

    ticket_code = models.CharField(max_length=50, unique=True)
    citizen_name = models.CharField(max_length=150, default='Citizen Resident')
    phone = models.CharField(max_length=30, blank=True, default='')
    ward = models.ForeignKey(Zone, null=True, blank=True, on_delete=models.SET_NULL, related_name='grievances')
    ward_name = models.CharField(max_length=150, blank=True, default='')
    ward_number = models.IntegerField(default=1)
    location = models.CharField(max_length=255, default='Municipal Sector')
    incident_type = models.CharField(max_length=150, default='Pipeline Leak / Burst')
    priority = models.CharField(max_length=30, choices=PRIORITY_CHOICES, default='Normal')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Pending Investigation')
    assigned_technician = models.CharField(max_length=150, blank=True, default='Unassigned')
    dispatched_at = models.DateTimeField(null=True, blank=True)
    eta_minutes = models.IntegerField(null=True, blank=True)
    description = models.TextField(blank=True, default='')
    resolution_notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.ticket_code}] {self.incident_type} - {self.status}"


class FleetTanker(models.Model):
    """
    Municipal Water Tanker Fleet Vehicle Registry.
    Tracks vehicle registration, water capacity, make/model, and operational status.
    """
    STATUS_CHOICES = [
        ('Available', 'Available / Standby'),
        ('In Transit', 'In Transit / Dispatched'),
        ('Under Maintenance', 'Under Maintenance / Service'),
    ]
    OWNERSHIP_CHOICES = [
        ('Municipal Owned', 'Nagar Parishad Owned'),
        ('Contractor Leased', 'Contractor Leased'),
    ]

    vehicle_no = models.CharField(max_length=50, unique=True)
    tanker_name = models.CharField(max_length=150, default='Aqua Tanker')
    capacity_liters = models.FloatField(default=5000.0)
    model_make = models.CharField(max_length=100, blank=True, default='Tata 1613 SE')
    ownership_type = models.CharField(max_length=50, choices=OWNERSHIP_CHOICES, default='Municipal Owned')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Available')
    fitness_expiry = models.DateField(null=True, blank=True)
    gps_tracking_id = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['vehicle_no']

    def __str__(self):
        return f"{self.vehicle_no} - {self.tanker_name} ({int(self.capacity_liters)} L) [{self.status}]"


class FleetDriver(models.Model):
    """
    Certified Municipal Water Tanker Driver Registry.
    Tracks driver license credentials, contact info, experience, and duty status.
    """
    STATUS_CHOICES = [
        ('Available', 'Available on Duty'),
        ('On Route', 'On Route / Driving'),
        ('Off Duty', 'Off Duty / Rest'),
    ]

    name = models.CharField(max_length=150)
    phone = models.CharField(max_length=30)
    license_number = models.CharField(max_length=50, unique=True)
    experience_years = models.IntegerField(default=5)
    emergency_contact = models.CharField(max_length=30, blank=True, default='')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Available')
    assigned_tanker = models.ForeignKey(FleetTanker, null=True, blank=True, on_delete=models.SET_NULL, related_name='primary_drivers')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.phone}) - {self.license_number} [{self.status}]"


class DispatchTeamMember(models.Model):
    """
    Field Crew / Valve Technicians / Escort Attendants for Municipal Tanker Dispatches.
    Accompanies tankers to ensure equitable distribution, queue control, and valve management.
    """
    ROLE_CHOICES = [
        ('Valve Technician', 'Valve Technician & Flow Attendant'),
        ('Field Supervisor', 'Field Supervisor / Nagar Parishad Inspector'),
        ('Security & Queue Escort', 'Security & Crowd Attendant'),
        ('Sanitation & Chlorination Crew', 'Sanitation & Chlorination Crew'),
    ]
    STATUS_CHOICES = [
        ('Active', 'Active on Duty'),
        ('Assigned', 'Assigned to Dispatch'),
        ('Off Duty', 'Off Duty / Standby'),
    ]

    name = models.CharField(max_length=150)
    role = models.CharField(max_length=100, choices=ROLE_CHOICES, default='Valve Technician')
    phone = models.CharField(max_length=30)
    badge_id = models.CharField(max_length=50, blank=True, default='')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='Active')
    ward_assignment = models.CharField(max_length=100, blank=True, default='All Wards')
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.role}) - {self.phone} [{self.status}]"


class WaterTanker(models.Model):
    """
    Emergency Municipal Water Tanker Fleet Dispatch Record.
    Dispatched during peak shortages, scheduled main repairs, or emergency demand.
    """
    STATUS_CHOICES = [
        ('Scheduled', 'Scheduled'),
        ('In Transit', 'In Transit'),
        ('Delivered', 'Delivered & Filled'),
        ('Cancelled', 'Cancelled'),
    ]

    dispatch_code = models.CharField(max_length=50, unique=True)
    fleet_tanker = models.ForeignKey(FleetTanker, null=True, blank=True, on_delete=models.SET_NULL, related_name='dispatches')
    fleet_driver = models.ForeignKey(FleetDriver, null=True, blank=True, on_delete=models.SET_NULL, related_name='dispatches')
    vehicle_no = models.CharField(max_length=50, default='MH-12-AQ-101')
    driver_name = models.CharField(max_length=150, default='Municipal Driver')
    driver_phone = models.CharField(max_length=30, blank=True, default='')
    team_members = models.CharField(max_length=255, blank=True, default='')  # e.g. "Ganesh Shinde (Valve Tech), Suresh More (Supervisor)"
    capacity_liters = models.FloatField(default=5000.0)
    target_ward = models.ForeignKey(Zone, null=True, blank=True, on_delete=models.SET_NULL, related_name='tankers')
    target_ward_name = models.CharField(max_length=150, blank=True, default='')
    target_ward_number = models.IntegerField(default=1)
    destination_location = models.CharField(max_length=255, default='Community Water Point')
    requester_name = models.CharField(max_length=150, default='Municipal Desk')
    purpose = models.CharField(max_length=255, default='Emergency potable distribution')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='In Transit')
    departure_time = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-departure_time']

    def __str__(self):
        return f"[{self.dispatch_code}] {self.vehicle_no} -> {self.destination_location} ({self.status})"



