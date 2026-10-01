import React from 'react';
import PipelineSchematic from '../components/PipelineSchematic';
import { Activity, Gauge, Sliders, CheckCircle2, AlertCircle, Info, Home, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function LiveMonitoringView({
  system,
  zones,
  onToggleZone,
  onAdjustValve,
  onToggleMode,
  onTogglePump,
  onResetCycle,
  onResetSimulation
}) {
  const isAuto = system.system_mode === 'Auto';
  const totalDelivered = zones.reduce((sum, z) => sum + z.delivered_liters, 0);
  const totalTarget = zones.reduce((sum, z) => sum + z.target_liters, 0);
  const overallParity = totalTarget > 0 ? ((totalDelivered / totalTarget) * 100).toFixed(1) : 0;

  return (
    <div className="view-container">
      {/* Pipeline Schematic with Flow Sensors and Leak Watchdog */}
      <PipelineSchematic
        zones={zones}
        system={system}
        onToggleZone={onToggleZone}
        onAdjustValve={onAdjustValve}
      />

      {/* Real-time Balancer Diagnostics & Manual Sluice Controls */}
      <div className="monitoring-dual-grid">
        <section className="panel-container">
          <div className="panel-header">
            <div>
              <h3>Real-Time Water Flow Sensors & Valve Apertures</h3>
              <p>
                {isAuto
                  ? 'AquaFair algorithm continuously trims motorized valves to ensure equitable flow across all sectors'
                  : 'Manual operator mode enabled: adjust motorized sluice valves directly'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className={`pill-badge ${isAuto ? 'badge-auto' : 'badge-manual'}`}
                onClick={onToggleMode}
              >
                {isAuto ? 'Mode: Automated Equity' : 'Mode: Manual Sluice Trim'}
              </button>
              {onResetCycle && (
                <button
                  className="pill-badge"
                  onClick={onResetCycle}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                  title="Restart water supply shift from 0 Liters"
                >
                  Restart Shift (0 L)
                </button>
              )}
              {onResetSimulation && (
                <button
                  className="pill-badge"
                  onClick={onResetSimulation}
                  style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', cursor: 'pointer' }}
                  title="Reset to nominal ~98% balanced state"
                >
                  Standard Shift (~98%)
                </button>
              )}
            </div>
          </div>

          <div className="valves-control-list">
            {zones.map((zone) => {
              const perHousehold = zone.households_count > 0 ? Math.round(zone.delivered_liters / zone.households_count) : 0;
              const isThrottled = zone.status === 'Throttled';

              return (
                <div key={zone.id} className="valve-control-card">
                  <div className="valve-card-header">
                    <div>
                      <strong>{zone.name}</strong>
                      <span className="crop-sublabel">
                        <Home size={12} style={{ display: 'inline', marginRight: 3 }} />
                        {zone.households_count} Homes • {zone.elevation_tier}
                      </span>
                    </div>
                    <div className="valve-aperture-value">
                      <span>Valve Opening:</span>
                      <strong>{zone.valve_percent}%</strong>
                    </div>
                  </div>

                  <div className="valve-slider-row">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      disabled={isAuto}
                      value={zone.valve_percent}
                      onChange={(e) => onAdjustValve(zone.id, Number(e.target.value))}
                      className="valve-range-input"
                    />
                  </div>

                  <div className="valve-card-footer">
                    <span>Flow Sensor: <b>{zone.flow_rate} L/min</b></span>
                    <span>Delivered: <b>{perHousehold} L / family</b></span>
                    {zone.leak_detected ? (
                      <span className="parity-tag tag-ahead" style={{ background: '#fee2e2', color: '#b91c1c' }}>
                        <AlertTriangle size={10} style={{ display: 'inline', marginRight: 2 }} /> Leak Suspected
                      </span>
                    ) : zone.abnormal_usage_detected ? (
                      <span className="parity-tag tag-ahead">
                        Abnormal Draw Flagged
                      </span>
                    ) : (
                      <span className={`parity-tag ${isThrottled ? 'tag-ahead' : zone.status === 'Completed' ? 'tag-behind' : 'tag-equal'}`}>
                        {isThrottled ? 'Lowland Trimmed (Protecting Uphill)' : zone.status === 'Completed' ? 'Quota Fulfilled' : 'Fair Parity'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feeder Line Hydraulic Balance & Telemetry Diagnostics */}
        <section className="panel-container algorithm-insights-panel">
          <div className="panel-header">
            <div>
              <h3>Hydraulic Balance & Sector Telemetry</h3>
              <p>Real-time feeder line throughput, delivery progression, and network pressure</p>
            </div>
            <Activity size={18} className="info-icon-teal" />
          </div>

          <div className="monitoring-quick-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '10px 12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--slate-500)', display: 'block', fontWeight: 600 }}>HEADWORKS PRESSURE</span>
              <strong style={{ fontSize: '18px', color: 'var(--teal-800)' }}>{system.pressure_psi || 48.0} <small style={{ fontSize: '11px', fontWeight: 500 }}>PSI</small></strong>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '10px 12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--slate-500)', display: 'block', fontWeight: 600 }}>AGGREGATE FLOW</span>
              <strong style={{ fontSize: '18px', color: 'var(--teal-800)' }}>
                {Number(zones.reduce((acc, z) => acc + (Number(z.flow_rate) || 0), 0)).toFixed(1)} <small style={{ fontSize: '11px', fontWeight: 500 }}>L/min</small>
              </strong>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '10px 12px' }}>
              <span style={{ fontSize: '11px', color: 'var(--slate-500)', display: 'block', fontWeight: 600 }}>FEEDERS ACTIVE</span>
              <strong style={{ fontSize: '18px', color: '#059669' }}>
                {zones.filter(z => z.valve_percent > 0 && z.status !== 'Paused').length} / {zones.length}
              </strong>
            </div>
          </div>

          <div className="feeder-distribution-stack" style={{ display: 'grid', gap: '10px' }}>
            {zones.map((zone) => {
              const pct = zone.target_liters > 0 
                ? Math.min(100, Math.round((zone.delivered_liters / zone.target_liters) * 100)) 
                : 0;
              return (
                <div key={zone.id} style={{ background: '#ffffff', border: '1px solid var(--border-light)', borderRadius: '10px', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--slate-900)' }}>{zone.name}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--slate-500)', marginLeft: '8px' }}>
                        {zone.flow_rate} L/min • {zone.valve_percent}% Sluice
                      </span>
                    </div>
                    <span className={`parity-tag ${zone.status === 'Completed' ? 'tag-behind' : zone.status === 'Throttled' ? 'tag-ahead' : 'tag-equal'}`} style={{ fontSize: '10px' }}>
                      {pct}% ({Math.round(zone.delivered_liters / 1000)}kL / {Math.round(zone.target_liters / 1000)}kL)
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: zone.status === 'Completed' ? '#10b981' : 'linear-gradient(90deg, var(--teal-500), var(--teal-600))',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="parity-summary-banner" style={{ marginTop: '14px' }}>
            <CheckCircle2 size={18} />
            <div>
              <strong>Equitable Allocation: {overallParity}% Complete</strong>
              <span>Headworks Pressure: {system.pressure_psi} PSI • Zero tail-end dry taps</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
