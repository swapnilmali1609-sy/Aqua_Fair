import React from 'react';
import { Droplet, AlertTriangle, ArrowDown, ShieldCheck, Activity, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function TankVisualizer({
  level = 1950000,
  capacity = 2500000,
  pumpStatus = 'Running',
  chlorination = 0.8,
  turbidity = 1.2,
  phLevel = 7.4,
  tds = 185,
  waterQualityIndex = 96.5,
  contaminationDetected = false,
  overflowStatus = 'Safe (<90%)'
}) {
  const percentage = Math.max(0, Math.min(100, Math.round((level / Math.max(1, capacity)) * 100)));
  const isLow = percentage < 15;
  const isNearOverflow = percentage >= 90;
  const minReserveLiters = Math.round(capacity * 0.20);
  const minReserveKL = Math.round(minReserveLiters / 1000);
  const capacityKL = Math.round(capacity / 1000);

  return (
    <div className={`tank-visualizer-card ${contaminationDetected ? 'tank-card-contaminated' : ''}`}>
      <div className="tank-header">
        <div className="tank-title-group">
          <Droplet className={`tank-icon ${contaminationDetected ? 'icon-contaminated' : ''}`} size={22} />
          <div>
            <h4>Central Storage Reservoir (ESR)</h4>
            <span className="tank-subtitle">AquaFair IoT Ultrasonic Level & Quality Telemetry</span>
          </div>
        </div>
        <div className="tank-header-badges">
          <div className={`tank-badge ${isLow ? 'low' : isNearOverflow ? 'overflow-warn' : ''}`}>
            {percentage}% Full ({Math.round(level / 1000)} kL)
          </div>
          <div className={`purity-badge ${contaminationDetected ? 'purity-alert' : 'purity-good'}`}>
            {contaminationDetected ? '🚨 Contaminated' : `WQI: ${waterQualityIndex}% (Grade A)`}
          </div>
        </div>
      </div>

      <div className="tank-illustration-wrapper">
        <div className="tank-cylinder">
          {/* Tank Level Fill */}
          <div
            className={`tank-liquid ${contaminationDetected ? 'liquid-contaminated' : isLow ? 'liquid-low' : isNearOverflow ? 'liquid-overflow' : ''}`}
            style={{ height: `${percentage}%` }}
          >
            {/* Animated SVG Surface Waves */}
            <svg className="wave-svg" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0,10 C30,18 70,2 100,10 L100,20 L0,20 Z" fill="currentColor" opacity="0.6"/>
              <path d="M0,12 C40,4 60,18 100,12 L100,20 L0,20 Z" fill="currentColor"/>
            </svg>
          </div>

          {/* Mandatory Strategic Emergency Reserve Line (20% Protected Floor) */}
          <div className="tank-reserve-line" style={{ bottom: '20%' }} title="Mandatory 20% Strategic Reserve: Preserved for fire hydrants & emergency lifelines. Tank will never empty.">
            <span className="reserve-tag">🛡️ 20% Strategic Reserve ({minReserveKL} kL Protected • Cannot Empty)</span>
          </div>

          {/* Dynamic depth markings based on reservoir capacity */}
          <div className="tank-grid-lines">
            <span>{capacityKL} kL (Max)</span>
            <span>{Math.round(capacityKL * 0.75)} kL</span>
            <span>{Math.round(capacityKL * 0.50)} kL</span>
            <span style={{ color: '#0d9488', fontWeight: 700 }}>{minReserveKL} kL (Protected Floor)</span>
            <span>0 kL (Unreachable)</span>
          </div>
        </div>

        {/* Discharge pipe & pump connection visual */}
        <div className="tank-pipe-out">
          <div className={`flow-stream ${pumpStatus === 'Running' && !contaminationDetected ? 'streaming' : ''}`}></div>
          <div className="pipe-label">
            <ArrowDown size={14} />
            <span>Community Feeder</span>
          </div>
        </div>
      </div>

      <div className="tank-reserve-guard-badge" style={{ margin: '10px 0 6px 0', padding: '8px 12px', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#0f766e' }}>
        <ShieldCheck size={16} className="text-emerald" style={{ flexShrink: 0 }} />
        <span><strong>Mandatory Reserve Guard Active:</strong> {minReserveLiters.toLocaleString()} L (20%) strictly retained in ESR. Supplies only required ward quotas and automatically cuts off when targets are reached. Tank never empties.</span>
      </div>

      {contaminationDetected && (
        <div className="tank-alert-strip contamination-strip">
          <ShieldAlert size={15} />
          <span>Contamination Breach Detected! Distribution valves isolated.</span>
        </div>
      )}

      {isNearOverflow && !contaminationDetected && (
        <div className="tank-alert-strip warning-strip">
          <AlertTriangle size={15} />
          <span>Storage Tank Near Capacity: Automated 95% Overflow Cutoff Armed.</span>
        </div>
      )}

      {isLow && !contaminationDetected && (
        <div className="tank-alert-strip">
          <AlertTriangle size={15} />
          <span>Low Water Reserve: Dry-Run Pump Protection prevents cavitation burn.</span>
        </div>
      )}

      {/* Real-time Water Quality Sensors Strip */}
      <div className="tank-quality-sensor-grid">
        <div className="tank-q-pill">
          <span>pH Sensor</span>
          <strong className={phLevel < 6.5 || phLevel > 8.5 ? 'text-rose' : ''}>{phLevel}</strong>
        </div>
        <div className="tank-q-pill">
          <span>TDS Sensor</span>
          <strong className={tds > 500 ? 'text-rose' : ''}>{Math.round(tds)} <small>ppm</small></strong>
        </div>
        <div className="tank-q-pill">
          <span>Turbidity</span>
          <strong className={turbidity > 5.0 ? 'text-rose' : ''}>{turbidity} <small>NTU</small></strong>
        </div>
        <div className="tank-q-pill">
          <span>Chlorine</span>
          <strong>{chlorination} <small>ppm</small></strong>
        </div>
      </div>

      {/* AquaFair Protection & Quality Badges */}
      <div className="esr-quality-strip">
        <div className="quality-pill">
          <ShieldCheck size={14} className="text-emerald" />
          <span>Overflow Guard: <b>{overflowStatus}</b></span>
        </div>
        <div className="quality-pill">
          <CheckCircle2 size={14} className="text-cyan" />
          <span>Dry-Run Guard: <b>Active (&gt;12%)</b></span>
        </div>
      </div>

      <div className="tank-footer-metrics">
        <div className="tank-metric">
          <span>Available Reserve</span>
          <strong>{level.toLocaleString()} <small>Liters</small></strong>
        </div>
        <div className="tank-metric">
          <span>Total Storage</span>
          <strong>{capacity.toLocaleString()} <small>L ({capacityKL} kL)</small></strong>
        </div>
        <div className="tank-metric">
          <span>Supply Status</span>
          <span className={`status-pill-small ${pumpStatus === 'Running' && !contaminationDetected ? 'active' : ''}`}>
            {contaminationDetected ? 'Isolated' : pumpStatus === 'Running' ? 'Pumping Active' : 'Standby'}
          </span>
        </div>
      </div>
    </div>
  );
}

