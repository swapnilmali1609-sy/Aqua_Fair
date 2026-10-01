import React from 'react';
import { Droplets, Activity, Gauge, CheckCircle2, PauseCircle, Home, AlertTriangle, ShieldCheck, ShieldAlert, Radio } from 'lucide-react';

export default function PipelineSchematic({ zones = [], system = {}, onToggleZone, onAdjustValve }) {
  const isPumpRunning = system.pump_status === 'Running' && !system.contamination_detected;
  const isAuto = system.system_mode === 'Auto';

  return (
    <div className={`pipeline-schematic-card ${system.contamination_detected ? 'schematic-contaminated' : ''}`}>
      <div className="schematic-top">
        <div>
          <h3>AquaFair Smart Monitoring & Distribution Network</h3>
          <p>Real-time IoT telemetry from water flow sensors, pressure transmitters, storage tank, and motorized sluice valves</p>
        </div>
        <div className="schematic-legend">
          {system.contamination_detected ? (
            <span className="legend-item" style={{ color: '#e11d48', fontWeight: 800 }}>
              <i className="legend-dot" style={{ background: '#f43f5e' }} /> Contamination Isolated (0%)
            </span>
          ) : (
            <span className="legend-item">
              <i className="legend-dot" style={{ background: '#10b981' }} /> Water Grade A Potable
            </span>
          )}
          <span className="legend-item"><i className="legend-dot balanced" /> Fair Equitable Flow</span>
          <span className="legend-item"><i className="legend-dot throttled" /> Lowland Sluice Trim</span>
          <span className="legend-item"><i className="legend-dot completed" /> Quota Fulfilled</span>
          <span className="legend-item"><i className="legend-dot paused" /> Valve Closed</span>
        </div>
      </div>

      <div className="schematic-canvas">
        {/* Step 1: Storage Tank (ESR) with Ultrasonic Sensor */}
        <div className={`network-node reservoir-node ${system.contamination_detected ? 'node-contaminated' : ''}`}>
          <div className="node-icon reservoir-icon"><Droplets size={24} /></div>
          <strong>Storage Tank</strong>
          <span>{Math.round((system.tank_level_liters ?? 1950000) / 1000)} kL Level</span>
          <div className="water-level-mini-bar">
            <div style={{ width: `${Math.min(100, Math.round(((system.tank_level_liters ?? 1950000) / (system.tank_capacity_liters ?? 2500000)) * 100))}%` }} />
          </div>
          <div className={`schematic-quality-pill ${system.contamination_detected ? 'quality-bad' : 'quality-good'}`}>
            {system.contamination_detected ? '⚠️ Contaminated' : `WQI: ${system.water_quality_index || 96.5}%`}
          </div>
          <small className="iot-tag"><Radio size={10} style={{ display: 'inline', marginRight: 2 }} /> Ultrasonic & Quality</small>
        </div>

        {/* Pipe: Reservoir to Pump */}
        <div className="pipe-segment pipe-h">
          <div className={`pipe-core ${isPumpRunning ? 'flow-active' : ''}`}>
            {isPumpRunning && <span className="flow-pulse flow-fast" />}
          </div>
        </div>

        {/* Step 2: Main Distribution Pump */}
        <div className={`network-node pump-node ${isPumpRunning ? 'pump-active' : ''}`}>
          <div className="node-icon pump-icon"><Activity size={22} /></div>
          <strong>Distribution Pump</strong>
          <span className="node-status">{isPumpRunning ? 'Active (Running)' : 'Standby'}</span>
          <small>{system.pressure_psi || 48.0} PSI Line Head</small>
        </div>

        {/* Pipe: Pump to Equalizer Manifold */}
        <div className="pipe-segment pipe-h">
          <div className={`pipe-core ${isPumpRunning ? 'flow-active' : ''}`}>
            {isPumpRunning && <span className="flow-pulse flow-fast" />}
          </div>
        </div>

        {/* Step 3: Distribution Feeder Manifold with Pulse Flow Meter */}
        <div className="network-node manifold-node">
          <div className="node-icon manifold-icon"><Gauge size={22} /></div>
          <strong>Feeder Manifold</strong>
          <span className="node-tag">{isAuto ? 'Fair Equity Balancer' : 'Manual Trim'}</span>
          <small>{zones.length} Metered Feeders</small>
        </div>

        {/* Pipe: Manifold to 4 Distribution Branches */}
        <div className="pipe-branches-container">
          {zones.map((zone) => {
            const isZoneFlowing = isPumpRunning && zone.status !== 'Paused' && zone.status !== 'Completed';
            const progress = zone.target_liters > 0
              ? Math.min(100, Math.round((zone.delivered_liters / zone.target_liters) * 100))
              : 0;

            const perHouseholdDelivered = zone.households_count > 0
              ? Math.round(zone.delivered_liters / zone.households_count)
              : 0;

            const isContaminated = Boolean(zone.contamination_detected || system.contamination_detected);
            const statusClass = zone.status ? zone.status.toLowerCase().replace(/\s+/g, '-') : 'active';

            return (
              <div key={zone.id} className={`branch-row status-${statusClass} ${isContaminated ? 'branch-contaminated' : ''}`}>
                {/* Branch Pipe with animated water particles */}
                <div className="branch-pipe">
                  <div className={`pipe-core ${isZoneFlowing && !isContaminated ? 'flow-active' : ''}`}>
                    {isZoneFlowing && !isContaminated && (
                      <span className={`flow-pulse ${zone.status === 'Throttled' ? 'flow-throttled' : 'flow-normal'}`} />
                    )}
                  </div>
                </div>

                {/* Sluice Valve Control Node */}
                <div className="valve-node">
                  <div className="valve-badge">
                    <span>Sluice {zone.ward_number || zone.id}</span>
                    <strong style={{ color: isContaminated ? '#e11d48' : undefined }}>
                      {isContaminated ? '0% (Isolated)' : `${zone.valve_percent}%`}
                    </strong>
                  </div>
                  {!isAuto && !isContaminated && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={zone.valve_percent}
                      onChange={(e) => onAdjustValve && onAdjustValve(zone.id, Number(e.target.value))}
                      className="valve-slider"
                      title="Manual Sluice Trim"
                    />
                  )}
                </div>

                {/* Sector & Household Destination Endpoint */}
                <div className="zone-node">
                  <div className="zone-info">
                    <div className="zone-title-bar">
                      <strong>{zone.name}</strong>
                      <span className="crop-tag">{zone.sector_type || 'Residential'}</span>
                      <span className="elevation-chip">{zone.elevation_tier || 'Standard'}</span>
                      {isContaminated && (
                        <span className="leak-badge-warn" style={{ background: '#ffe4e6', color: '#e11d48' }}>
                          <ShieldAlert size={12} /> Contamination Isolated
                        </span>
                      )}
                      {zone.leak_detected && !isContaminated && (
                        <span className="leak-badge-warn">
                          <AlertTriangle size={12} /> Leak Detected
                        </span>
                      )}
                      {zone.abnormal_usage_detected && !isContaminated && (
                        <span className="abnormal-badge-warn">
                          <Activity size={12} /> Abnormal Draw
                        </span>
                      )}
                    </div>
                    <div className="zone-telemetry">
                      <span><Home size={12} style={{ display: 'inline', marginRight: 3 }} /> <b>{zone.households_count} Households</b></span>
                      <span>Flow: <b>{zone.flow_rate} L/min</b></span>
                      <span>Delivered: <b>{perHouseholdDelivered} L / family</b></span>
                      <span>Fairness: <b>{zone.equity_score || 99.2}%</b></span>
                    </div>
                    <div className="zone-progress-track">
                      <div
                        className={`zone-progress-fill ${zone.status === 'Completed' ? 'fill-completed' : ''}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="zone-actions">
                    <button
                      className={`action-btn-mini ${isContaminated ? 'btn-isolated' : zone.status === 'Paused' ? 'btn-resume' : 'btn-pause'}`}
                      onClick={() => !isContaminated && onToggleZone && onToggleZone(zone.id)}
                      disabled={isContaminated}
                      title={isContaminated ? 'Safety Interlock: Contamination Detected' : zone.status === 'Paused' ? 'Resume Water Release' : 'Close Feeder'}
                    >
                      {isContaminated ? <ShieldAlert size={15} /> : zone.status === 'Paused' ? <PauseCircle size={15} /> : <CheckCircle2 size={15} />}
                      <span>{isContaminated ? 'Isolated' : zone.status === 'Paused' ? 'Closed' : 'Active'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
