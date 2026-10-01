from rest_framework import serializers
from django.db import models
from django.db.models import Q
from django.contrib.auth.models import User
from .models import (
    Zone, UserProfile, SystemState, TelemetryReading, SystemAlert, Household,
    WaterDemandRequest, Grievance, WaterTanker, FleetTanker, FleetDriver, DispatchTeamMember
)

class ZoneSerializer(serializers.ModelSerializer):
    progress_percent = serializers.SerializerMethodField()
    per_household_delivered = serializers.SerializerMethodField()
    per_household_target = serializers.SerializerMethodField()

    class Meta:
        model = Zone
        fields = [
            'id', 'name', 'ward_number', 'sector_type', 'households_count',
            'target_liters', 'delivered_liters', 'flow_rate', 'valve_percent',
            'status', 'elevation_tier', 'supply_timing', 'leak_detected',
            'abnormal_usage_detected', 'contamination_detected', 'ph_level',
            'equity_score', 'is_hardware_active', 'order', 'notes',
            'updated_at', 'progress_percent', 'per_household_delivered', 'per_household_target'
        ]

    def get_progress_percent(self, obj):
        if obj.target_liters <= 0:
            return 0.0
        return round(min(100.0, (obj.delivered_liters / obj.target_liters) * 100.0), 1)

    def get_per_household_delivered(self, obj):
        if obj.households_count <= 0:
            return 0.0
        return round(obj.delivered_liters / obj.households_count, 1)

    def get_per_household_target(self, obj):
        if obj.households_count <= 0:
            return 0.0
        return round(obj.target_liters / obj.households_count, 1)

class SystemStateSerializer(serializers.ModelSerializer):
    tank_percentage = serializers.SerializerMethodField()

    class Meta:
        model = SystemState
        fields = [
            'id', 'tank_name', 'tank_capacity_liters', 'tank_level_liters',
            'pump_status', 'system_mode', 'pump_efficiency', 'pressure_psi',
            'pumping_station', 'chlorination_ppm', 'turbidity_ntu',
            'ph_level', 'tds_ppm', 'water_temp_c', 'water_quality_index',
            'contamination_detected', 'contamination_status',
            'overflow_guard', 'overflow_status', 'dry_run_protection',
            'leak_detection_status', 'abnormal_usage_alerts_count',
            'water_wastage_prevented_liters', 'last_updated', 'tank_percentage'
        ]

    def get_tank_percentage(self, obj):
        if obj.tank_capacity_liters <= 0:
            return 0.0
        return round((obj.tank_level_liters / obj.tank_capacity_liters) * 100.0, 1)

class SystemAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemAlert
        fields = ['id', 'level', 'category', 'title', 'message', 'timestamp', 'resolved']

class TelemetryReadingSerializer(serializers.ModelSerializer):
    zone_name = serializers.ReadOnlyField(source='zone.name')

    class Meta:
        model = TelemetryReading
        fields = ['id', 'zone', 'zone_name', 'timestamp', 'flow_rate', 'delivered_snapshot', 'valve_percent', 'pressure_bar', 'ph_level', 'turbidity_ntu', 'is_anomaly']


class UserProfileSerializer(serializers.ModelSerializer):
    assigned_zone_id = serializers.SerializerMethodField()
    assigned_zone_name = serializers.SerializerMethodField()
    assigned_zone_number = serializers.SerializerMethodField()
    vehicle_no = serializers.SerializerMethodField()
    license_number = serializers.SerializerMethodField()
    badge_id = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = [
            'role', 'phone', 'address', 'household_id', 'household_name',
            'assigned_zone', 'assigned_zone_id', 'assigned_zone_name', 'assigned_zone_number',
            'vehicle_no', 'license_number', 'badge_id'
        ]

    def get_assigned_zone_id(self, obj):
        if obj.assigned_zone:
            return obj.assigned_zone.id
        if obj.household_id:
            hh = Household.objects.filter(household_id=obj.household_id).first()
            if hh and hh.zone:
                return hh.zone.id
        return 1

    def get_assigned_zone_name(self, obj):
        if obj.assigned_zone:
            return obj.assigned_zone.name
        if obj.household_id:
            hh = Household.objects.filter(household_id=obj.household_id).first()
            if hh and hh.zone:
                return hh.zone.name
        return "Ward 1 - Shivaji Nagar"

    def get_assigned_zone_number(self, obj):
        if obj.assigned_zone:
            return obj.assigned_zone.ward_number
        if obj.household_id:
            hh = Household.objects.filter(household_id=obj.household_id).first()
            if hh and hh.zone:
                return hh.zone.ward_number
        return 1

    def get_vehicle_no(self, obj):
        name = f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.household_name or obj.user.username
        fd = FleetDriver.objects.filter(models.Q(name__iexact=name) | models.Q(phone=obj.phone)).first()
        if fd and fd.assigned_tanker:
            return fd.assigned_tanker.vehicle_no
        return ""

    def get_license_number(self, obj):
        name = f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.household_name or obj.user.username
        fd = FleetDriver.objects.filter(models.Q(name__iexact=name) | models.Q(phone=obj.phone)).first()
        if fd:
            return fd.license_number
        if obj.household_id and obj.household_id.startswith('DRV-'):
            return obj.household_id.replace('DRV-', '')
        return ""

    def get_badge_id(self, obj):
        name = f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.household_name or obj.user.username
        tm = DispatchTeamMember.objects.filter(models.Q(name__iexact=name) | models.Q(phone=obj.phone)).first()
        if tm:
            return tm.badge_id
        return obj.household_id or ""

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'profile']

    def get_full_name(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        return name or obj.username


class HouseholdSerializer(serializers.ModelSerializer):
    zone_name = serializers.ReadOnlyField(source='zone.name')
    ward_number = serializers.ReadOnlyField(source='zone.ward_number')
    usage_percent = serializers.SerializerMethodField()
    effective_quota = serializers.SerializerMethodField()

    class Meta:
        model = Household
        fields = [
            'id', 'zone', 'ward_number', 'zone_name', 'household_id', 'owner_name',
            'address_or_lane', 'phone', 'members_count', 'daily_quota_liters',
            'current_usage_liters', 'meter_status', 'abnormal_draw',
            'extra_water_granted', 'usage_percent', 'effective_quota',
            'created_at', 'updated_at'
        ]

    def get_usage_percent(self, obj):
        total_quota = (obj.daily_quota_liters or 0.0) + (obj.extra_water_granted or 0.0)
        if total_quota <= 0:
            return 0.0
        return round(min(200.0, ((obj.current_usage_liters or 0.0) / total_quota) * 100.0), 1)

    def get_effective_quota(self, obj):
        return round((obj.daily_quota_liters or 0.0) + (obj.extra_water_granted or 0.0), 1)


class WaterDemandRequestSerializer(serializers.ModelSerializer):
    zone_name = serializers.ReadOnlyField(source='zone.name')
    ward_number = serializers.ReadOnlyField(source='zone.ward_number')
    household_owner = serializers.ReadOnlyField(source='household.owner_name')

    class Meta:
        model = WaterDemandRequest
        fields = [
            'id', 'household', 'household_owner', 'household_code',
            'zone', 'ward_number', 'zone_name', 'requested_by', 'extra_liters',
            'reason', 'urgency', 'status', 'notes',
            'created_at', 'updated_at'
        ]


class GrievanceSerializer(serializers.ModelSerializer):
    ward_id = serializers.ReadOnlyField(source='ward.id')
    ward_name = serializers.SerializerMethodField()
    ward_number = serializers.SerializerMethodField()

    class Meta:
        model = Grievance
        fields = [
            'id', 'ticket_code', 'citizen_name', 'phone', 'ward', 'ward_id',
            'ward_name', 'ward_number', 'location', 'incident_type', 'priority',
            'status', 'assigned_technician', 'dispatched_at', 'eta_minutes',
            'description', 'resolution_notes', 'created_at', 'resolved_at'
        ]

    def get_ward_name(self, obj):
        if obj.ward:
            return obj.ward.name
        return obj.ward_name or (f"Ward {obj.ward_number}" if obj.ward_number else "Municipal Sector")

    def get_ward_number(self, obj):
        if obj.ward:
            return obj.ward.ward_number
        return obj.ward_number or 1


class WaterTankerSerializer(serializers.ModelSerializer):
    target_ward_id = serializers.ReadOnlyField(source='target_ward.id')
    target_ward_name = serializers.SerializerMethodField()
    target_ward_number = serializers.SerializerMethodField()
    fleet_tanker_no = serializers.ReadOnlyField(source='fleet_tanker.vehicle_no')
    fleet_driver_name = serializers.ReadOnlyField(source='fleet_driver.name')

    class Meta:
        model = WaterTanker
        fields = [
            'id', 'dispatch_code', 'fleet_tanker', 'fleet_tanker_no',
            'fleet_driver', 'fleet_driver_name', 'vehicle_no', 'driver_name',
            'driver_phone', 'team_members', 'capacity_liters', 'target_ward',
            'target_ward_id', 'target_ward_name', 'target_ward_number',
            'destination_location', 'requester_name', 'purpose',
            'status', 'departure_time', 'delivered_at', 'notes'
        ]

    def get_target_ward_name(self, obj):
        if obj.target_ward:
            return obj.target_ward.name
        return obj.target_ward_name or (f"Ward {obj.target_ward_number}" if obj.target_ward_number else "Municipal Ward")

    def get_target_ward_number(self, obj):
        if obj.target_ward:
            return obj.target_ward.ward_number
        return obj.target_ward_number or 1


class FleetTankerSerializer(serializers.ModelSerializer):
    class Meta:
        model = FleetTanker
        fields = [
            'id', 'vehicle_no', 'tanker_name', 'capacity_liters', 'model_make',
            'ownership_type', 'status', 'fitness_expiry', 'gps_tracking_id',
            'notes', 'created_at', 'updated_at'
        ]


class FleetDriverSerializer(serializers.ModelSerializer):
    assigned_tanker_vehicle = serializers.ReadOnlyField(source='assigned_tanker.vehicle_no')

    class Meta:
        model = FleetDriver
        fields = [
            'id', 'name', 'phone', 'license_number', 'experience_years',
            'emergency_contact', 'status', 'assigned_tanker',
            'assigned_tanker_vehicle', 'notes', 'created_at', 'updated_at'
        ]


class DispatchTeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = DispatchTeamMember
        fields = [
            'id', 'name', 'role', 'phone', 'badge_id', 'status',
            'ward_assignment', 'notes', 'created_at', 'updated_at'
        ]



