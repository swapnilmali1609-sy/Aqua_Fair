import React, { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, ShieldCheck, ShieldAlert, Home, Activity, Droplets } from 'lucide-react';

export default function AlertsView({ alerts = [], onResolveAlert }) {
  const [filter, setFilter] = useState('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'unresolved') return !a.resolved;
    if (filter === 'resolved') return a.resolved;
    return a.category === filter || a.level === filter;
  });

  return (
    <div className="view-container">
      {/* Top Banner */}
      <div className="analytics-header-bar">
        <div>
          <h3>System Alerts & Anomaly Watchdog</h3>
          <p>Real-time notifications for contamination prevention, pipe leaks, reservoir levels, and consumption anomalies</p>
        </div>
        <div className="filter-pill-group">
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'contamination', label: '🚨 Contamination' },
            { id: 'leak', label: 'Pipe Leaks' },
            { id: 'overflow', label: 'Overflow Guard' },
            { id: 'low_water', label: 'Low Water' },
            { id: 'abnormal', label: 'Surge / Suction' },
            { id: 'equity', label: 'Equity Status' },
            { id: 'resolved', label: 'Resolved' },
          ].map((f) => (
            <button
              key={f.id}
              className={`filter-btn ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostics Grid */}
      <div className="diagnostics-grid diagnostics-grid-5">
        <div className="diagnostic-card">
          <div className="diag-icon danger"><ShieldAlert size={20} /></div>
          <div>
            <strong>Contamination Sentinel</strong>
            <p>pH (6.5–8.5), TDS (&le;300 ppm) & Turbidity (&le;5 NTU) multi-probe telemetry.</p>
          </div>
        </div>

        <div className="diagnostic-card">
          <div className="diag-icon success"><ShieldCheck size={20} /></div>
          <div>
            <strong>Pressure & Leak Watchdog</strong>
            <p>48.0 PSI nominal head. Differential pressure monitoring active across mainlines.</p>
          </div>
        </div>

        <div className="diagnostic-card">
          <div className="diag-icon success"><CheckCircle2 size={20} /></div>
          <div>
            <strong>Overflow Prevention</strong>
            <p>Automated 95% pump cutoff armed to eliminate reservoir spillage.</p>
          </div>
        </div>

        <div className="diagnostic-card">
          <div className="diag-icon info"><Droplets size={20} /></div>
          <div>
            <strong>Dry-Run Guard</strong>
            <p>Continuous ultrasonic level tracking with &le;12% cutoff protection.</p>
          </div>
        </div>

        <div className="diagnostic-card">
          <div className="diag-icon warning"><AlertTriangle size={20} /></div>
          <div>
            <strong>Anti-Suction Watchdog</strong>
            <p>Real-time telemetry identifying unauthorized booster suction pumps.</p>
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <section className="panel-container">
        <div className="panel-header">
          <div>
            <h3>Active Incident Stream ({filteredAlerts.length})</h3>
            <p>Real-time anomaly events captured by continuous network telemetry</p>
          </div>
        </div>

        <div className="alerts-full-list">
          {filteredAlerts.length === 0 ? (
            <div className="empty-alerts-state">
              <CheckCircle2 size={36} className="text-emerald" />
              <strong>No active notifications for this filter</strong>
              <p>Water distribution network is operating in complete equilibrium without detected leaks or contamination hazards.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div key={alert.id} className={`alert-card-row ${alert.level} ${alert.category === 'contamination' ? 'alert-contamination-row' : ''} ${alert.resolved ? 'is-resolved' : ''}`}>
                <div className="alert-row-icon">
                  {alert.category === 'contamination' ? (
                    <ShieldAlert size={20} className="text-rose" />
                  ) : alert.level === 'critical' ? (
                    <AlertCircle size={20} />
                  ) : alert.level === 'warning' ? (
                    <AlertTriangle size={20} />
                  ) : (
                    <Droplets size={20} />
                  )}
                </div>

                <div className="alert-row-content">
                  <div className="alert-row-top">
                    <strong>{alert.title}</strong>
                    <span className="alert-timestamp">
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                    </span>
                  </div>
                  <p>{alert.message}</p>
                </div>

                <div className="alert-row-action">
                  {alert.resolved ? (
                    <span className="badge-resolved"><CheckCircle2 size={14} /> Acknowledged</span>
                  ) : (
                    <button
                      className="btn-resolve"
                      onClick={() => onResolveAlert(alert.id)}
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
