from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.api_register, name='api_register'),
    path('auth/login/', views.api_login, name='api_login'),
    path('auth/me/', views.api_current_user, name='api_current_user'),

    # Dashboard & State
    path('dashboard/', views.api_dashboard, name='api_dashboard'),

    # Zones
    path('zones/', views.api_zones_list, name='api_zones_list'),
    path('zones/<int:pk>/', views.api_zone_detail, name='api_zone_detail'),

    # Controls & Simulation
    path('system/control/', views.api_system_control, name='api_system_control'),
    path('system/tick/', views.api_simulation_tick, name='api_simulation_tick'),
    path('system/simulate/', views.api_simulate_anomaly, name='api_simulate_anomaly'),

    # Telemetry & IoT Hardware Ingestion
    path('telemetry/', views.api_telemetry, name='api_telemetry'),
    path('hardware/telemetry/', views.api_hardware_telemetry, name='api_hardware_telemetry'),

    # Alerts & Incident Reporting
    path('alerts/', views.api_alerts, name='api_alerts'),
    path('alerts/<int:pk>/resolve/', views.api_resolve_alert, name='api_resolve_alert'),
    path('alerts/report/', views.api_report_incident, name='api_report_incident'),

    # Grievances & Field Technician Dispatch
    path('grievances/', views.api_grievances_list, name='api_grievances_list'),
    path('grievances/<int:pk>/status/', views.api_grievance_update_status, name='api_grievance_update_status'),
    path('grievances/<int:pk>/dispatch/', views.api_grievance_dispatch, name='api_grievance_dispatch'),
    path('grievances/<int:pk>/resolve/', views.api_grievance_resolve, name='api_grievance_resolve'),

    # Emergency Water Tanker Fleet
    path('tankers/', views.api_tankers_list, name='api_tankers_list'),
    path('tankers/<int:pk>/status/', views.api_tanker_status, name='api_tanker_status'),

    # Municipal Fleet & Crew Registry
    path('fleet/tankers/', views.api_fleet_tankers, name='api_fleet_tankers'),
    path('fleet/tankers/<int:pk>/', views.api_fleet_tanker_detail, name='api_fleet_tanker_detail'),
    path('fleet/drivers/', views.api_fleet_drivers, name='api_fleet_drivers'),
    path('fleet/drivers/<int:pk>/', views.api_fleet_driver_detail, name='api_fleet_driver_detail'),
    path('fleet/team/', views.api_dispatch_team, name='api_dispatch_team'),
    path('fleet/team/<int:pk>/', views.api_dispatch_team_detail, name='api_dispatch_team_detail'),

    # Households & Water Demands
    path('households/', views.api_households, name='api_households'),
    path('households/<int:pk>/', views.api_household_detail, name='api_household_detail'),
    path('demands/', views.api_demands, name='api_demands'),
    path('demands/<int:pk>/approve/', views.api_approve_demand, name='api_approve_demand'),
    path('demands/<int:pk>/reject/', views.api_reject_demand, name='api_reject_demand'),

    # Real Nagar Parishad Data Ingestion & Export
    path('import/nagarparishad/', views.api_import_nagarparishad, name='api_import_nagarparishad'),
    path('export/nagarparishad/', views.api_export_nagarparishad, name='api_export_nagarparishad'),
]

