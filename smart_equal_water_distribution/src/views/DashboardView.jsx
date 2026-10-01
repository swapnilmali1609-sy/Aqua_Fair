import React from 'react';
import { Droplets, Gauge, Zap, Home, Play, Pause, RotateCcw, AlertTriangle, ArrowRight, ShieldCheck, CheckCircle2, ShieldAlert, Clock, XCircle, Plus, Users, Wrench, Truck } from 'lucide-react';
import TankVisualizer from '../components/TankVisualizer';

export default function DashboardView({
  system,
  zones,
  alerts,
  summary,
  demands = [],
  hourlyData = [],
  onToggleMode,
  onTogglePump,
  onResetCycle,
  onToggleZone,
  onResolveAlert,
  onApproveDemand,
  onRejectDemand,
  onNavigateTab,
  user
}) {
  const isAuto = system.system_mode === 'Auto';
  const isPumpOn = system.pump_status === 'Running';
  const pendingDemands = demands.filter(d => d.status === 'Pending');
  const isOfficer = user?.role === 'Municipal Officer' || user?.role === 'Administrator' || !user?.role || user?.role?.includes('Officer');

  // Hydrodynamic Water Supply Rate & Valve Closure Logic
  const currentTotalFlow = summary.total_supply_rate_lpm !== undefined
    ? summary.total_supply_rate_lpm
    : Number(zones.reduce((sum, z) => sum + (Number(z.flow_rate) || 0), 0).toFixed(1));

  const nominalRate = summary.nominal_supply_rate_lpm !== undefined
    ? summary.nominal_supply_rate_lpm
    : Number(((zones.length || 4) * 18.5).toFixed(1));

  const closedValvesCount = summary.closed_valves_count !== undefined
    ? summary.closed_valves_count
    : zones.filter(z => (z.status === 'Paused' || z.status === 'Emergency Isolated' || z.status === 'Closed' || (z.valve_percent === 0 && z.status !== 'Completed'))).length;

  const activeValvesCount = zones.length - closedValvesCount;

  const closedWardNames = summary.closed_ward_names && summary.closed_ward_names.length > 0
    ? summary.closed_ward_names
    : zones.filter(z => (z.status === 'Paused' || z.status === 'Emergency Isolated' || z.status === 'Closed' || (z.valve_percent === 0 && z.status !== 'Completed'))).map(z => z.name);

  const isThrottled = closedValvesCount > 0 && closedWardNames.length > 0;

  const supplyReductionPct = isThrottled
    ? (summary.supply_reduction_pct !== undefined && summary.supply_reduction_pct > 0
        ? summary.supply_reduction_pct
        : (nominalRate > 0 ? Math.min(100, Math.max(0, Number(((1 - (currentTotalFlow / nominalRate)) * 100).toFixed(1)))) : 0))
    : 0;

  const hardwareActiveZone = zones.find(z => z.is_hardware_active || (z.notes && z.notes.toLowerCase().includes('hardware')));

  return (
    <div className="dashboard-content">
      {/* Hero Control Banner */}
      <section className="hero-banner">
        <div className="hero-text">
          <div className="hero-status-pill">
            <span className="pulse-dot" />
            <span>REAL-TIME SCADA DISPATCH • ACTIVE</span>
          </div>
          <h1>Operations Control Center</h1>
          <p>
            Continuous IoT telemetry, automated equity balancing, and loss prevention across 1,010 connected households.
          </p>
        </div>

        <div className="hero-actions">
          <div className="control-group">
            <span className="control-label">Distribution Mode</span>
            <button
              className={`toggle-pill ${isAuto ? 'mode-auto' : 'mode-manual'}`}
              onClick={onToggleMode}
              title="Click to toggle Automatic Equity Mode / Manual Valve Trim"
            >
              <span className="pill-knob" />
              <span className="pill-text">{isAuto ? 'Auto Equity Mode' : 'Manual Sluice Trim'}</span>
            </button>
          </div>

          <div className="control-group">
            <span className="control-label">Pumping Station</span>
            <button
              className={`btn-action-pump ${isPumpOn ? 'pump-on' : 'pump-off'}`}
              onClick={onTogglePump}
            >
              {isPumpOn ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPumpOn ? 'Stop Pumping' : 'Start Pumping'}</span>
            </button>
          </div>

          <button className="btn-reset-cycle" onClick={onResetCycle} title="Restart daily fair water allocation schedule">
            <RotateCcw size={15} />
            <span>Reset Cycle</span>
          </button>
        </div>
      </section>

      {/* 4 Primary Metric Stat Cards */}
      <div className="stats-row">
        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap icon-water">
              <Droplets size={20} />
            </div>
            <span className="stat-trend trend-positive">Target: {summary.total_target_liters?.toLocaleString() || '505,000'} L</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Total Water Distributed</span>
            <div className="stat-number">
              {summary.total_delivered_liters?.toLocaleString() || 0}
              <small>L ({Math.round((summary.total_delivered_liters || 0) / 1000)} kL)</small>
            </div>
          </div>
          <div className="stat-progress-bar">
            <div
              style={{
                width: `${Math.min(100, Math.round(((summary.total_delivered_liters || 0) / Math.max(1, summary.total_target_liters || 505000)) * 100))}%`
              }}
            />
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap icon-balance">
              <Gauge size={20} />
            </div>
            <span className="stat-trend trend-optimal">
              {summary.equity_index >= 95 ? 'Optimal Parity' : 'Balancing Equity'}
            </span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Water Equity Index</span>
            <div className="stat-number">
              {summary.equity_index || 99.1}
              <small>% Parity</small>
            </div>
          </div>
          <p className="stat-subtext">Zero dry taps recorded across tail-end homes</p>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap icon-pump">
              <ShieldCheck size={20} />
            </div>
            <span className="stat-trend trend-positive">{system.leak_detection_status || 'Zero Active Leaks'}</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Wastage Prevented</span>
            <div className="stat-number">
              {Math.round(system.water_wastage_prevented_liters || 92500).toLocaleString()}
              <small>L Saved</small>
            </div>
          </div>
          <p className="stat-subtext">Automated leak watchdog & overflow guard active</p>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap icon-zones">
              <Home size={20} />
            </div>
            <span className="stat-trend trend-neutral">{zones?.length || 4} Sectors</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Connected Households</span>
            <div className="stat-number">
              {summary.total_households || 1010}
              <small>Families</small>
            </div>
          </div>
          <p className="stat-subtext">Transparent tracking: 500 L standard quota</p>
        </div>
      </div>

      {/* Logical Municipal Water Supply Outflow & Valve Status Banner */}
      <section className="supply-dynamics-banner">
        <div className="supply-dynamics-left">
          <div className="supply-flow-icon-wrap" style={{ background: supplyReductionPct > 0 ? '#fef3c7' : '#ecfdf5', color: supplyReductionPct > 0 ? '#d97706' : '#059669' }}>
            <Gauge size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="supply-dynamics-title-row">
              <h3>Municipal Mainline Outflow</h3>
              {hardwareActiveZone ? (
                <span className="supply-status-tag tag-nominal" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#7dd3fc' }}>
                  ⚡ Hardware Node Active: {hardwareActiveZone.name}
                </span>
              ) : isThrottled ? (
                <span className="supply-status-tag tag-reduced">
                  ⚠️ Supply Throttled (-{supplyReductionPct}% • {closedValvesCount} Valve{closedValvesCount > 1 ? 's' : ''} Closed)
                </span>
              ) : (
                <span className="supply-status-tag tag-nominal">
                  🟢 100% Full Supply Rate (All Feeders Active)
                </span>
              )}
            </div>
            <p className="supply-dynamics-desc">
              {hardwareActiveZone ? (
                <>
                  Live operations exclusively focused on <strong>{hardwareActiveZone.name}</strong> (Ward #{hardwareActiveZone.ward_number}). Hardware-in-the-Loop active with {hardwareActiveZone.households_count} households. Flow rate: <strong>{hardwareActiveZone.flow_rate} L/min</strong>. Standby set on other wards.
                </>
              ) : isThrottled ? (
                <>
                  Feeder valve closed for <em>{closedWardNames.join(', ')}</em> (0% aperture). Outflow throttled from {nominalRate} L/min to <strong>{currentTotalFlow} L/min</strong> to maintain pressure equilibrium and conserve reserve.
                </>
              ) : (
                <>
                  All {zones.length} municipal feeder lines pressurized and flowing normally at <strong>{currentTotalFlow} L/min</strong> (~{nominalRate} L/min maximum system capacity).
                </>
              )}
            </p>
          </div>
        </div>

        <div className="supply-dynamics-metrics">
          <div className="supply-metric-block">
            <span className="metric-lbl">Total Municipal Flow</span>
            <div className="metric-val">
              <strong style={{ color: supplyReductionPct > 0 ? '#b45309' : '#047857' }}>{currentTotalFlow}</strong> <small>L/min</small>
            </div>
            <span className="metric-sub">Nominal: {nominalRate} L/min</span>
          </div>

          <div className="supply-metric-block">
            <span className="metric-lbl">Ward Valves Open</span>
            <div className="metric-val">
              <strong style={{ color: closedValvesCount > 0 ? '#b45309' : '#047857' }}>
                {activeValvesCount} / {zones.length}
              </strong>
            </div>
            <span className="metric-sub">{closedValvesCount} Feeder Closed</span>
          </div>
        </div>
      </section>

      {/* Citizen Extra Water Demands - Municipal Officer Quick Review Section */}
      <section className="panel-container officer-demands-quick-panel">
        <div className="panel-header">
          <div className="demands-panel-title-group">
            <div className="demands-icon-badge">
              <Droplets size={20} />
            </div>
            <div>
              <h3>Water Demand Approvals</h3>
              <p>Review and authorize extra water quota requests from connected households</p>
            </div>
          </div>
          <div className="demands-header-actions">
            {pendingDemands.length > 0 ? (
              <span className="pending-counter-badge">
                <Clock size={13} className="spin-slow" />
                <span>{pendingDemands.length} Requests Pending</span>
              </span>
            ) : (
              <span className="all-reviewed-badge">
                <CheckCircle2 size={13} />
                <span>All Demands Resolved</span>
              </span>
            )}
            <button className="btn-secondary-link" onClick={() => onNavigateTab('demands')}>
              <span>Demand Desk</span>
              <ArrowRight size={14} />
            </button>
            <button className="btn-secondary-link" onClick={() => onNavigateTab('grievances')} style={{ background: '#f0fdfa', borderColor: '#ccfbf1', color: '#0f766e' }}>
              <Wrench size={13} />
              <span>Fleet Operations</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {pendingDemands.length === 0 ? (
          <div className="demands-empty-card">
            <CheckCircle2 size={24} className="text-emerald" />
            <div>
              <strong>Equitable Distribution in Equilibrium</strong>
              <p>No pending extra water requests. All connected sectors operating within standard daily quotas.</p>
            </div>
          </div>
        ) : (
          <div className="pending-demands-row-grid">
            {pendingDemands.slice(0, 3).map((demand) => (
              <div key={demand.id} className="quick-demand-card">
                <div className="quick-demand-top">
                  <div>
                    <strong className="quick-demand-name">{demand.requested_by || 'Citizen'}</strong>
                    <span className="quick-demand-hh">{demand.household_code || demand.zone_name}</span>
                  </div>
                  <span className={`urgency-badge urgency-${(demand.urgency || 'Normal').toLowerCase().replace(' ', '-')}`}>
                    {demand.urgency || 'Normal'}
                  </span>
                </div>

                <div className="quick-demand-liters">
                  <Droplets size={18} className="text-cyan" />
                  <span>+{Number(demand.extra_liters).toLocaleString()} Liters</span>
                </div>

                <p className="quick-demand-reason">{demand.reason}</p>

                <div className="quick-demand-actions">
                  {onRejectDemand && (
                    <button
                      className="btn-quick-reject"
                      onClick={() => onRejectDemand(demand.id, 'Shift quota allocated')}
                      title="Decline request"
                    >
                      <XCircle size={14} />
                      <span>Decline</span>
                    </button>
                  )}
                  <button
                    className="btn-quick-grant"
                    onClick={() => onApproveDemand && onApproveDemand(demand.id)}
                    title="Grant permission and dispatch extra quota"
                  >
                    <CheckCircle2 size={15} />
                    <span>Authorize</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Centralized Real-Time Water Quality & Contamination Sentinel */}
      <section className={`panel-container quality-sentinel-panel ${system.contamination_detected ? 'is-contaminated' : ''}`}>
        <div className="quality-sentinel-header">
          <div className="quality-header-title">
            <div className={`quality-icon-bubble ${system.contamination_detected ? 'alert-bubble' : 'pure-bubble'}`}>
              {system.contamination_detected ? <ShieldAlert size={24} /> : <Droplets size={24} />}
            </div>
            <div>
              <h3>Water Quality & Safety Sentinel</h3>
              <p>Continuous IoT probe telemetry and potable water compliance</p>
            </div>
          </div>

          <div className="quality-header-status">
            {system.contamination_detected ? (
              <div className="contamination-alert-badge">
                <span className="dot-pulse-red" />
                <strong>EMERGENCY: Contamination Detected! Valves Auto-Isolated</strong>
              </div>
            ) : (
              <div className="potable-status-badge">
                <CheckCircle2 size={16} className="text-emerald" />
                <strong>Potable (Safe Drinking Quality • WQI {system.water_quality_index || 96.5}%)</strong>
              </div>
            )}
          </div>
        </div>

        {/* 5 IoT Water Quality Sensor Cards */}
        <div className="quality-sensors-grid">
          {/* pH Sensor */}
          <div className={`quality-sensor-card ${system.ph_level < 6.5 || system.ph_level > 8.5 ? 'sensor-danger' : 'sensor-normal'}`}>
            <div className="sensor-card-top">
              <span className="sensor-name">pH Sensor</span>
              <span className={`sensor-tag ${system.ph_level < 6.5 || system.ph_level > 8.5 ? 'tag-danger' : 'tag-safe'}`}>
                {system.ph_level < 6.5 ? 'Acidic Breach' : system.ph_level > 8.5 ? 'Alkaline Breach' : 'Optimal'}
              </span>
            </div>
            <div className="sensor-value-row">
              <strong>{system.ph_level || 7.4}</strong>
              <small>pH (Standard 6.5 - 8.5)</small>
            </div>
            <div className="sensor-bar">
              <div
                className="sensor-bar-fill"
                style={{ width: `${Math.min(100, Math.round(((system.ph_level || 7.4) / 14.0) * 100))}%` }}
              />
            </div>
          </div>

          {/* TDS Sensor */}
          <div className={`quality-sensor-card ${system.tds_ppm > 500 ? 'sensor-danger' : 'sensor-normal'}`}>
            <div className="sensor-card-top">
              <span className="sensor-name">TDS Sensor</span>
              <span className={`sensor-tag ${system.tds_ppm > 500 ? 'tag-danger' : 'tag-safe'}`}>
                {system.tds_ppm > 500 ? 'High Solids' : 'Safe Potable'}
              </span>
            </div>
            <div className="sensor-value-row">
              <strong>{Math.round(system.tds_ppm || 185)}</strong>
              <small>ppm (&lt; 300 ppm Ideal)</small>
            </div>
            <div className="sensor-bar">
              <div
                className="sensor-bar-fill"
                style={{ width: `${Math.min(100, Math.round(((system.tds_ppm || 185) / 600.0) * 100))}%` }}
              />
            </div>
          </div>

          {/* Turbidity Sensor */}
          <div className={`quality-sensor-card ${system.turbidity_ntu > 5.0 ? 'sensor-danger' : 'sensor-normal'}`}>
            <div className="sensor-card-top">
              <span className="sensor-name">Turbidity Sensor</span>
              <span className={`sensor-tag ${system.turbidity_ntu > 5.0 ? 'tag-danger' : 'tag-safe'}`}>
                {system.turbidity_ntu > 5.0 ? 'Turbid' : 'Crystal Clear'}
              </span>
            </div>
            <div className="sensor-value-row">
              <strong>{system.turbidity_ntu || 1.2}</strong>
              <small>NTU (&lt; 5.0 NTU WHO)</small>
            </div>
            <div className="sensor-bar">
              <div
                className="sensor-bar-fill"
                style={{ width: `${Math.min(100, Math.round(((system.turbidity_ntu || 1.2) / 10.0) * 100))}%` }}
              />
            </div>
          </div>

          {/* Residual Chlorine Sensor */}
          <div className="quality-sensor-card sensor-normal">
            <div className="sensor-card-top">
              <span className="sensor-name">Residual Chlorine</span>
              <span className="sensor-tag tag-safe">Disinfected</span>
            </div>
            <div className="sensor-value-row">
              <strong>{system.chlorination_ppm || 0.8}</strong>
              <small>ppm (0.2 - 1.0 ppm)</small>
            </div>
            <div className="sensor-bar">
              <div
                className="sensor-bar-fill"
                style={{ width: `${Math.min(100, Math.round(((system.chlorination_ppm || 0.8) / 1.5) * 100))}%` }}
              />
            </div>
          </div>

          {/* Temperature Sensor */}
          <div className="quality-sensor-card sensor-normal">
            <div className="sensor-card-top">
              <span className="sensor-name">Water Temp</span>
              <span className="sensor-tag tag-safe">Nominal</span>
            </div>
            <div className="sensor-value-row">
              <strong>{system.water_temp_c || 24.2}</strong>
              <small>&deg;C (Ambient)</small>
            </div>
            <div className="sensor-bar">
              <div
                className="sensor-bar-fill"
                style={{ width: `${Math.min(100, Math.round(((system.water_temp_c || 24.2) / 40.0) * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {system.contamination_detected && (
          <div className="contamination-emergency-banner">
            <ShieldAlert size={20} />
            <div>
              <strong>AUTOMATED CONTAMINATION FAULT ISOLATION ENGAGED:</strong>
              <p>Motorized sluice valves across all distribution sectors have been closed to 0% to prevent contaminated supply from reaching citizen homes. Central treatment filtration cycle initiated.</p>
            </div>
          </div>
        )}
      </section>

      {/* Main Grid: Sectors & Households Table on Left + Storage Tank Visualizer on Right */}
      <div className="dashboard-grid">
        <section className="panel-container zones-table-panel">
          <div className="panel-header">
            <div>
              <h3>Distribution Sectors & Flow Rates</h3>
              <p>Active feeder lines, valve apertures, and real-time delivery</p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isOfficer && (
                <button
                  className="btn-primary-action-sm"
                  onClick={() => onNavigateTab('zones', { openAddWard: true })}
                  title="Add new municipal ward to grid"
                >
                  <Plus size={14} />
                  <span>Add Ward</span>
                </button>
              )}
              <button className="btn-secondary-link" onClick={() => onNavigateTab('monitoring')}>
                <span>View Telemetry</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Sector & Ward</th>
                  <th>Households</th>
                  <th>Per-Family Delivery</th>
                  <th>Total Water</th>
                  <th>Flow Sensor</th>
                  <th>Valve</th>
                  <th>Leak Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => {
                  const progress = zone.target_liters > 0
                    ? Math.min(100, Math.round((zone.delivered_liters / zone.target_liters) * 100))
                    : 0;

                  const perHousehold = zone.households_count > 0
                    ? Math.round(zone.delivered_liters / zone.households_count)
                    : 0;

                  return (
                    <tr key={zone.id}>
                      <td>
                        <div className="table-zone-title">
                          <strong>{zone.name}</strong>
                          <span className="crop-pill">{zone.sector_type}</span>
                          <span className="elevation-chip">{zone.elevation_tier || 'Standard'}</span>
                        </div>
                      </td>
                      <td>
                        <strong>{zone.households_count}</strong> <small style={{ color: '#64748b' }}>homes</small>
                      </td>
                      <td>
                        <div className="mini-progress-cell">
                          <span><b>{perHousehold} L</b> / 500 L</span>
                          <div className="mini-track">
                            <div
                              className={`mini-bar ${zone.status === 'Completed' ? 'bar-done' : ''}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{Math.round(zone.delivered_liters).toLocaleString()} L</strong>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Target: {Math.round(zone.target_liters).toLocaleString()} L</div>
                      </td>
                      <td>
                        <span className="flow-text">{zone.flow_rate} L/min</span>
                      </td>
                      <td>
                        <span className="valve-pill">{zone.valve_percent}% Sluice</span>
                      </td>
                      <td>
                        {zone.leak_detected ? (
                          <span className="leak-badge-warn"><AlertTriangle size={12} /> Leak</span>
                        ) : zone.abnormal_usage_detected ? (
                          <span className="abnormal-badge-warn"><Zap size={12} /> Surge</span>
                        ) : (
                          <span className={`status-badge status-${zone.status.toLowerCase()}`}>
                            {zone.status}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            className="btn-table-action action-view-hh"
                            onClick={() => onNavigateTab('zones', { wardId: zone.ward_number || zone.id })}
                            title={`View only the households of ${zone.name}`}
                          >
                            <Users size={12} />
                            <span>Households</span>
                          </button>
                          <button
                            className={`btn-table-action ${zone.status === 'Paused' ? 'action-resume' : 'action-pause'}`}
                            onClick={() => onToggleZone(zone.id)}
                            title={zone.status === 'Paused' ? 'Open feeder valve' : 'Throttle / close feeder valve'}
                          >
                            {zone.status === 'Paused' ? 'Open' : 'Close'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Central Storage Reservoir Card */}
        <section className="panel-container">
          <TankVisualizer
            level={system.tank_level_liters ?? 1950000}
            capacity={system.tank_capacity_liters ?? 2500000}
            pumpStatus={system.pump_status}
            chlorination={system.chlorination_ppm || 0.8}
            turbidity={system.turbidity_ntu || 1.2}
            overflowStatus={system.overflow_status || 'Safe (<90%)'}
            phLevel={system.ph_level || 7.3}
            tds={system.tds_ppm || 185}
            waterQualityIndex={system.water_quality_index || 96.5}
            contaminationDetected={Boolean(system.contamination_detected)}
          />

          <div className="system-health-box">
            <h4>Automated Safeguard Status</h4>
            <div className="health-row-item">
              <span><i className={`status-dot ${system.contamination_detected ? 'dot-critical' : 'dot-online'}`} /> Contamination Sentinel</span>
              <strong style={{ color: system.contamination_detected ? '#f43f5e' : '#10b981' }}>
                {system.contamination_status || (system.contamination_detected ? 'CONTAMINATION DETECTED' : 'Potable (Grade A)')}
              </strong>
            </div>
            <div className="health-row-item">
              <span><i className="status-dot dot-online" /> Strategic Reserve</span>
              <strong style={{ color: '#0d9488' }}>100,000 L (20% Reserve Guard)</strong>
            </div>
            <div className="health-row-item">
              <span><i className="status-dot dot-online" /> Quota Cutoff</span>
              <strong>Active (Auto-Shutoff on Target)</strong>
            </div>
            <div className="health-row-item">
              <span><i className="status-dot dot-online" /> Tank Overflow Guard</span>
              <strong>{system.overflow_status || 'Safe (<90%)'}</strong>
            </div>
            <div className="health-row-item">
              <span><i className="status-dot dot-online" /> Pump Dry-Run Protection</span>
              <strong>Armed (&gt;20% Reserve Threshold)</strong>
            </div>
            <div className="health-row-item">
              <span><i className="status-dot dot-online" /> Leak Watchdog</span>
              <strong>{system.leak_detection_status || 'Zero Active Leaks'}</strong>
            </div>
            <div className="health-row-item">
              <span><i className="status-dot dot-online" /> Pump Efficiency</span>
              <strong>{system.pump_efficiency}% @ {system.pressure_psi} PSI</strong>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom Grid: Hourly Consumption Profile & Alerts */}
      <div className="bottom-dashboard-grid">
        <section className="panel-container chart-card">
          <div className="panel-header">
            <div>
              <h3>Hourly Consumption Profile</h3>
              <p>Monitored volume delivered across 24-hour cycle</p>
            </div>
            <span className="total-chart-badge">{Math.round((summary.total_delivered_liters || 497500) / 1000)} kL Delivered</span>
          </div>

          <div className="hourly-bar-chart">
            {hourlyData.map((h, idx) => (
              <div key={idx} className="chart-col">
                <div className="chart-bar-container">
                  <div
                    className="chart-bar"
                    style={{ height: `${Math.min(100, Math.max(12, (h.liters / 90000) * 100))}%` }}
                    title={`${h.time}: ${h.liters?.toLocaleString()} L - ${h.label || ''}`}
                  >
                    <span className="bar-hover-val">{Math.round(h.liters / 1000)}kL</span>
                  </div>
                </div>
                <span className="chart-hour">{h.time}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-container alerts-card">
          <div className="panel-header">
            <div>
              <h3>System Alerts & Incidents</h3>
              <p>Live notifications for leaks, overflows, and quota thresholds</p>
            </div>
            <button className="btn-secondary-link" onClick={() => onNavigateTab('alerts')}>
              <span>View All</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="alerts-feed-mini">
            {alerts.slice(0, 3).map((a) => (
              <div key={a.id} className={`alert-bubble ${a.level}`}>
                <div className="alert-bubble-icon">
                  {a.level === 'critical' || a.level === 'warning' ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <Droplets size={16} />
                  )}
                </div>
                <div className="alert-bubble-content">
                  <strong>{a.title}</strong>
                  <p>{a.message}</p>
                </div>
                {!a.resolved && (
                  <button
                    className="btn-resolve-mini"
                    onClick={() => onResolveAlert(a.id)}
                    title="Acknowledge Notification"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
