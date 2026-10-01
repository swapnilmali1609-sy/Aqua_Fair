import React, { useState } from 'react';
import { BarChart3, TrendingUp, Award, Droplet, Download, Home, ShieldCheck, CheckCircle2, PieChart } from 'lucide-react';

export default function AnalyticsView({ zones = [], summary = {}, system = {} }) {
  const [timeframe, setTimeframe] = useState('This Week');
  const [toast, setToast] = useState('');

  // 7-day historical water distribution dataset
  const sevenDayTrends = [
    { day: 'Wed (Today)', date: 'Sep 23', target: 505, delivered: 498, saved: 18.4, equity: 99.3 },
    { day: 'Tue', date: 'Sep 22', target: 505, delivered: 501, saved: 19.1, equity: 99.1 },
    { day: 'Mon', date: 'Sep 21', target: 505, delivered: 499, saved: 17.8, equity: 98.9 },
    { day: 'Sun', date: 'Sep 20', target: 505, delivered: 503, saved: 20.2, equity: 99.4 },
    { day: 'Sat', date: 'Sep 19', target: 505, delivered: 497, saved: 18.9, equity: 98.8 },
    { day: 'Fri', date: 'Sep 18', target: 505, delivered: 500, saved: 19.5, equity: 99.2 },
    { day: 'Thu', date: 'Sep 17', target: 505, delivered: 496, saved: 18.2, equity: 99.0 },
  ];

  const triggerExport = () => {
    const csvRows = [
      ['AquaFair Smart Water Monitoring and Equity System - Municipal Audit Report'],
      ['Generated At', new Date().toISOString()],
      ['Total Households Connected', summary.total_households || 1010],
      ['City-Wide Equity Index', `${summary.equity_index || 99.3}%`],
      ['Total Water Conserved (L)', system.water_wastage_prevented_liters || 93400],
      [],
      ['Ward / Sector Name', 'Households', 'Target Quota (L)', 'Delivered (L)', 'Per-Household (L)', 'Equity Score (%)', 'Status'],
      ...zones.map((z) => [
        z.name,
        z.households_count,
        z.target_liters,
        z.delivered_liters,
        z.households_count > 0 ? (z.delivered_liters / z.households_count).toFixed(1) : 0,
        z.equity_score,
        z.status
      ])
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aquafair_water_equity_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setToast('AquaFair Water Conservation & Equity Audit (.CSV) generated and downloaded.');
    setTimeout(() => setToast(''), 3000);
  };

  const waterSavedLiters = Math.round(system.water_wastage_prevented_liters || 93400);

  return (
    <div className="view-container">
      {/* Top Banner with Timeframe & Export */}
      <div className="analytics-header-bar">
        <div>
          <h3>Consumption & Equity Analytics</h3>
          <p>Volumetric consumption trends, leak reduction metrics, and fairness parity scores</p>
        </div>
        <div className="analytics-toolbar">
          <div className="timeframe-picker">
            {['Today', 'This Week', 'This Month'].map((tf) => (
              <button
                key={tf}
                className={`tf-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
          <button className="btn-export" onClick={triggerExport}>
            <Download size={15} />
            <span>Export Audit (.CSV)</span>
          </button>
        </div>
      </div>

      {/* High-Impact Conservation & Equity KPI Cards */}
      <div className="stats-row">
        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap icon-water">
              <Droplet size={20} />
            </div>
            <span className="stat-trend trend-optimal">+22.8% Wastage Reduced</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Wastage Prevented</span>
            <div className="stat-number">
              {waterSavedLiters.toLocaleString()}
              <small>L Conserved</small>
            </div>
          </div>
          <p className="stat-subtext">Prevented tank overflow & eliminated pinhole leaks</p>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap icon-balance">
              <Award size={20} />
            </div>
            <span className="stat-trend trend-optimal">Parity: &plusmn;1.8%</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Water Equity Score</span>
            <div className="stat-number">
              {summary.equity_index || 99.3}
              <small>% Parity</small>
            </div>
          </div>
          <p className="stat-subtext">Zero dry taps recorded across high-altitude and tail-end homes</p>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap icon-pump">
              <ShieldCheck size={20} />
            </div>
            <span className="stat-trend trend-positive">Zero Overflows</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Overflow Safety Guard</span>
            <div className="stat-number">
              100%
              <small>Protection Uptime</small>
            </div>
          </div>
          <p className="stat-subtext">Automated high-level pump shut-off verified at 95% mark</p>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap icon-zones">
              <Home size={20} />
            </div>
            <span className="stat-trend trend-neutral">1,010 Households</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Mean Family Daily Quota</span>
            <div className="stat-number">
              {summary.total_households > 0 ? Math.round((summary.total_delivered_liters || 498000) / summary.total_households) : 493}
              <small>L / Family</small>
            </div>
          </div>
          <p className="stat-subtext">Transparent tracking ensuring fair access for every family</p>
        </div>
      </div>

      {/* 7-Day Graphical Consumption & Parity Trends Chart */}
      <section className="panel-container">
        <div className="panel-header">
          <div>
            <h3>7-Day Water Consumption & Equity Parity Trends</h3>
            <p>Daily volume delivered (kL) vs target quota and municipal fairness index</p>
          </div>
          <div className="legend-items">
            <span className="legend-pill delivered"><span className="legend-box delivered" /> Delivered Volume</span>
            <span className="legend-pill target"><span className="legend-box target" /> Target Quota</span>
            <span className="legend-pill equity"><span className="legend-box equity" /> Equity Parity (&gt;98%)</span>
          </div>
        </div>

        <div className="trend-chart-container">
          <div className="trend-bars-grid">
            {sevenDayTrends.map((t, idx) => {
              const heightPct = Math.round((t.delivered / 520) * 100);
              return (
                <div key={idx} className="trend-col">
                  <div className="trend-col-bar-wrap">
                    <span className="trend-col-value">{t.delivered} kL</span>
                    <div className="trend-col-track">
                      <div
                        className="trend-col-fill"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="trend-col-info">
                    <strong>{t.day}</strong>
                    <small>{t.equity}% Parity</small>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Water Conservation Impact Breakdown */}
      <div className="conservation-breakdown-row">
        <div className="breakdown-card">
          <div className="breakdown-icon overflow-bg"><ShieldCheck size={22} /></div>
          <div className="breakdown-text">
            <span>Overflow Guard Savings</span>
            <strong>45,200 Liters (48.4%)</strong>
            <p>Automated 95% ESR high-level cutoff stopping reservoir spillage</p>
          </div>
        </div>

        <div className="breakdown-card">
          <div className="breakdown-icon leak-bg"><Droplet size={22} /></div>
          <div className="breakdown-text">
            <span>Pinhole Leak & Burst Averted</span>
            <strong>32,100 Liters (34.3%)</strong>
            <p>Differential pressure & flow deficit rapid isolation</p>
          </div>
        </div>

        <div className="breakdown-card">
          <div className="breakdown-icon quota-bg"><Award size={22} /></div>
          <div className="breakdown-text">
            <span>Fair Quota Non-Monopolization</span>
            <strong>16,100 Liters (17.3%)</strong>
            <p>Throttled upstream lowlands to eliminate tail-end deprivation</p>
          </div>
        </div>
      </div>

      {/* Community Sector Allocation Comparison Panel */}
      <section className="panel-container">
        <div className="panel-header">
          <div>
            <h3>Sector-by-Sector Tap Water Equity & Delivery Parity</h3>
            <p>Target fair allocation vs actual delivered water volume per household</p>
          </div>
        </div>

        <div className="zone-bars-comparison">
          {zones.map((zone) => {
            const delivered = Math.round(zone.delivered_liters);
            const target = Math.round(zone.target_liters);
            const percent = Math.min(100, Math.round((delivered / Math.max(1, target)) * 100));
            const perHousehold = zone.households_count > 0 ? Math.round(delivered / zone.households_count) : 0;

            return (
              <div key={zone.id} className="comparison-row">
                <div className="comparison-meta">
                  <div className="comparison-title">
                    <strong>{zone.name}</strong>
                    <span>({zone.households_count} Homes • {zone.elevation_tier})</span>
                  </div>
                  <div className="comparison-values">
                    <span>Delivered: <b>{delivered.toLocaleString()} L</b> (<b>{perHousehold} L/home</b>)</span>
                    <span>Target: <b>{target.toLocaleString()} L</b></span>
                    <span className="comparison-pct">{percent}%</span>
                  </div>
                </div>

                <div className="comparison-bar-track">
                  <div
                    className="comparison-bar-fill"
                    style={{ width: `${percent}%` }}
                  />
                  <div className="target-marker" style={{ left: '100%' }} title="Target Fair Quota (100%)" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Historical Water Conservation & Shift Audit Log Table */}
      <section className="panel-container">
        <div className="panel-header">
          <div>
            <h3>AquaFair Sustainable Conservation & Equity Audit Log</h3>
            <p>Verification records of automated fair water allocation and wastage prevention compliance</p>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Supply Shift</th>
                <th>Community Quota</th>
                <th>Delivered Volume</th>
                <th>Wastage Prevented</th>
                <th>Equity Score</th>
                <th>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>#AF-LOG-2026-0923</strong></td>
                <td>Today, 06:00 - 08:30 AM</td>
                <td>5,05,000 L (505 kL)</td>
                <td><strong>4,97,500 L</strong></td>
                <td>18,400 L (Leaks/Overflow Saved)</td>
                <td>99.1% Parity</td>
                <td><span className="status-badge status-balanced">Fully Equitable</span></td>
              </tr>
              <tr>
                <td><strong>#AF-LOG-2026-0922</strong></td>
                <td>Yesterday, 06:00 - 08:30 AM</td>
                <td>5,05,000 L (505 kL)</td>
                <td><strong>5,01,200 L</strong></td>
                <td>19,100 L (Leaks/Overflow Saved)</td>
                <td>99.3% Parity</td>
                <td><span className="status-badge status-balanced">Fully Equitable</span></td>
              </tr>
              <tr>
                <td><strong>#AF-LOG-2026-0921</strong></td>
                <td>Sep 21, 06:00 - 08:30 AM</td>
                <td>5,05,000 L (505 kL)</td>
                <td><strong>4,98,900 L</strong></td>
                <td>17,800 L (Leaks/Overflow Saved)</td>
                <td>98.9% Parity</td>
                <td><span className="status-badge status-balanced">Fully Equitable</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}

