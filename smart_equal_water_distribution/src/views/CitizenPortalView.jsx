import React, { useState, useEffect } from 'react';
import {
  Droplet,
  Home,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Sparkles,
  Info,
  Activity,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  PlusCircle,
  Check,
  Truck,
  PhoneCall,
  Phone,
  MapPin,
  Bell
} from 'lucide-react';
import { api } from '../services/api';

export default function CitizenPortalView({
  user,
  zones = [],
  demands = [],
  onRefreshAlerts,
  onRefreshDemands,
  onCreateDemand
}) {
  const householdId = user?.household_id || 'AF-W1-1042';
  const residentName = user?.name || 'Ramesh Patil';
  const isCitizenResident = user?.role === 'Citizen / Household';

  // State for live household data from DB
  const [household, setHousehold] = useState(null);
  const [loadingHousehold, setLoadingHousehold] = useState(true);

  // Demand extra water modal state
  const [showDemandModal, setShowDemandModal] = useState(false);
  const [demandResult, setDemandResult] = useState(null);
  const [submittingDemand, setSubmittingDemand] = useState(false);
  const [demandForm, setDemandForm] = useState({
    extra_liters: 500,
    reason: 'Wedding / Social Ceremony',
    urgency: 'Normal',
    notes: ''
  });

  // Report grievance modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportResult, setReportResult] = useState(null);
  const [reportForm, setReportForm] = useState({
    citizen_name: residentName,
    phone: '9876543210',
    ward_name: 'Ward 1 - Shivaji Nagar',
    incident_type: 'Pipeline Leak / Burst',
    location: 'Near House ' + householdId + ', Shivaji Nagar Main Lane',
    description: 'Clear drinking water pipeline showing micro pressure drop.'
  });

  // Grievance tracking state
  const [grievances, setGrievances] = useState([]);

  // Ward identification for this logged-in citizen
  const userWardId = user?.ward_id || user?.profile?.assigned_zone_id || user?.profile?.assigned_zone || household?.zone || 1;
  const userWardNumber = user?.ward_number || user?.profile?.assigned_zone_number || household?.ward_number || 1;
  const userWardName = user?.ward_name || user?.profile?.assigned_zone_name || household?.zone_name || `Ward ${userWardNumber} - Shivaji Nagar`;

  // Ward Tankers & Pop-up Notification Alert state
  const [wardTankers, setWardTankers] = useState([]);
  const [activePopupTanker, setActivePopupTanker] = useState(null);
  const [acknowledgedTankerIds, setAcknowledgedTankerIds] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(`aquafair_seen_tankers_${householdId}`) || '[]');
    } catch {
      return [];
    }
  });

  // Sound Chime for Live Nagar Parishad Alert
  const playAlertChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15); // G5
      osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.7);
    } catch (e) {}
  };

  // Fetch tankers specifically sent to this citizen's ward
  const fetchWardTankers = async () => {
    try {
      const data = await api.getTankers(userWardId);
      if (Array.isArray(data)) {
        const forMyWard = data.filter(t => 
          Number(t.target_ward_id) === Number(userWardId) || 
          Number(t.target_ward) === Number(userWardId) ||
          Number(t.target_ward_number) === Number(userWardNumber) ||
          (t.target_ward_name && userWardName && t.target_ward_name.toLowerCase().includes(userWardName.toLowerCase()))
        );
        setWardTankers(forMyWard);

        // Check for latest active 'In Transit' tanker that hasn't been acknowledged
        const inTransit = forMyWard.filter(t => t.status === 'In Transit');
        if (inTransit.length > 0) {
          const latest = inTransit[0];
          const seen = JSON.parse(sessionStorage.getItem(`aquafair_seen_tankers_${householdId}`) || '[]');
          if (!seen.includes(latest.id) && !activePopupTanker) {
            setActivePopupTanker(latest);
            playAlertChime();
          }
        }
      }
    } catch (err) {
      console.error('Error fetching ward tankers:', err);
    }
  };

  const handleAcknowledgeTanker = (tankerId) => {
    const updated = [...acknowledgedTankerIds, tankerId];
    setAcknowledgedTankerIds(updated);
    try {
      sessionStorage.setItem(`aquafair_seen_tankers_${householdId}`, JSON.stringify(updated));
    } catch {}
    setActivePopupTanker(null);
  };

  // Fetch live household details
  const fetchHousehold = async () => {
    try {
      const data = await api.getHouseholdByCode(householdId);
      if (data) setHousehold(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHousehold(false);
    }
  };

  // Fetch citizen grievances
  const fetchGrievances = async () => {
    try {
      const data = await api.getGrievances();
      if (data) setGrievances(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHousehold();
    fetchGrievances();
    fetchWardTankers();

    // Listen for custom tanker dispatch event across components
    const handleTankerDispatched = (e) => {
      const tanker = e.detail;
      if (tanker) {
        const matchesWard = 
          Number(tanker.target_ward_id) === Number(userWardId) ||
          Number(tanker.target_ward) === Number(userWardId) ||
          Number(tanker.target_ward_number) === Number(userWardNumber) ||
          (tanker.target_ward_name && userWardName && tanker.target_ward_name.toLowerCase().includes(userWardName.toLowerCase()));

        if (matchesWard) {
          setActivePopupTanker(tanker);
          playAlertChime();
          fetchWardTankers();
        }
      }
    };

    window.addEventListener('aquafair_tanker_dispatched', handleTankerDispatched);
    const interval = setInterval(fetchWardTankers, 4000);

    return () => {
      window.removeEventListener('aquafair_tanker_dispatched', handleTankerDispatched);
      clearInterval(interval);
    };
  }, [householdId, userWardId, userWardNumber]);

  // Household quota calculations
  const baseQuota = household?.daily_quota_liters || 500;
  const extraGranted = household?.extra_water_granted || 0;
  const totalEffectiveQuota = baseQuota + extraGranted;
  const currentUsage = household?.current_usage_liters || 380;
  const usagePercent = Math.min(100, Math.round((currentUsage / Math.max(1, totalEffectiveQuota)) * 100));
  const remainingQuota = Math.max(0, Math.round(totalEffectiveQuota - currentUsage));

  // Find demands specific to this household or citizen
  const myDemands = demands.filter(d => {
    const hid = householdId.toLowerCase();
    const matchHh = d.household_code?.toLowerCase() === hid || String(d.household).toLowerCase() === hid;
    const matchName = d.requested_by?.toLowerCase() === residentName.toLowerCase();
    return matchHh || matchName;
  });

  // Find grievances reported by this resident or household
  const myGrievances = grievances.filter(g => {
    const hid = householdId.toLowerCase();
    const matchName = g.citizen_name?.toLowerCase().includes(residentName.toLowerCase()) || residentName.toLowerCase().includes(g.citizen_name?.toLowerCase());
    const matchHh = g.location?.toLowerCase().includes(hid);
    return matchName || matchHh;
  });

  // Handle submit extra demand
  const handleSubmitDemand = async (e) => {
    e.preventDefault();
    setSubmittingDemand(true);

    const zoneId = zones[0]?.id || 1;
    const zoneName = zones[0]?.name || 'Ward 1 - Shivaji Nagar';

    const payload = {
      requested_by: residentName,
      household_code: householdId,
      household: household?.id || null,
      zone: zoneId,
      zone_name: zoneName,
      extra_liters: Number(demandForm.extra_liters),
      reason: demandForm.reason,
      urgency: demandForm.urgency,
      notes: demandForm.notes
    };

    let res = null;
    if (onCreateDemand) {
      res = await onCreateDemand(payload);
    } else {
      res = await api.createDemand(payload);
      if (onRefreshDemands) onRefreshDemands();
    }

    setSubmittingDemand(false);

    if (res) {
      setDemandResult({
        success: true,
        extra_liters: demandForm.extra_liters,
        ticket_code: res.id ? `AF-DEMAND-${res.id}` : `AF-DEMAND-${Date.now().toString().slice(-4)}`
      });
      fetchHousehold();
      if (onRefreshAlerts) onRefreshAlerts();
      if (onRefreshDemands) onRefreshDemands();
    }
  };

  // Handle submit grievance
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setSubmittingReport(true);
    const res = await api.reportIncident(reportForm);
    setSubmittingReport(false);
    if (res.success) {
      setReportResult(res);
      fetchGrievances();
      if (onRefreshAlerts) onRefreshAlerts();
    }
  };

  return (
    <div className="view-container">
      {/* ================= TANKER DISPATCH POP-UP NOTIFICATION MODAL ================= */}
      {activePopupTanker && (
        <div className="tanker-popup-backdrop" onClick={() => handleAcknowledgeTanker(activePopupTanker.id)}>
          <div className="tanker-popup-card" onClick={(e) => e.stopPropagation()}>
            <div className="tanker-popup-header">
              <div className="tanker-pulse-badge">
                <span className="pulse-ping"></span>
                <span className="pulse-dot"></span>
                Municipal Water Tanker En Route
              </div>
              <button 
                className="btn-popup-close" 
                onClick={() => handleAcknowledgeTanker(activePopupTanker.id)}
                title="Dismiss Alert"
              >
                ✕
              </button>
            </div>

            <div className="tanker-popup-banner">
              <div className="tanker-popup-truck-icon">
                <Truck size={36} />
              </div>
              <div className="tanker-popup-headline">
                <h3>Potable Water Tanker Dispatched</h3>
                <p>Municipal water tanker dispatched to <strong>{activePopupTanker.target_ward_name || userWardName}</strong></p>
                <div className="marathi-alert-subtext">नगरपरिषद पाणी टँकर आपल्या प्रभागात रवाना झाला आहे</div>
              </div>
            </div>

            {/* Critical Highlight Cards: Driver Name, Vehicle No, Driver Mobile No */}
            <div className="tanker-details-grid">
              {/* Vehicle No */}
              <div className="tanker-detail-item vehicle-card">
                <span className="detail-label">VEHICLE NUMBER</span>
                <strong className="detail-value vehicle-plate">{activePopupTanker.vehicle_no}</strong>
                <span className="detail-sub">Potable Drinking Water</span>
              </div>

              {/* Driver Name */}
              <div className="tanker-detail-item driver-card">
                <span className="detail-label">DRIVER</span>
                <strong className="detail-value text-teal">{activePopupTanker.driver_name}</strong>
                <span className="detail-sub">Authorized Fleet Operator</span>
              </div>

              {/* Driver Mobile No */}
              <div className="tanker-detail-item phone-card">
                <span className="detail-label">DRIVER CONTACT</span>
                <strong className="detail-value phone-highlight">{activePopupTanker.driver_phone}</strong>
                <a href={`tel:${activePopupTanker.driver_phone}`} className="btn-call-inline">
                  <PhoneCall size={14} /> Call Driver
                </a>
              </div>

              {/* Capacity */}
              <div className="tanker-detail-item capacity-card">
                <span className="detail-label">CAPACITY</span>
                <strong className="detail-value text-cyan">{Number(activePopupTanker.capacity_liters).toLocaleString()} Liters</strong>
                <span className="detail-sub">Bulk Supply</span>
              </div>

              {/* Accompanying Dispatch Team Members */}
              {activePopupTanker.team_members && (
                <div className="tanker-detail-item team-card" style={{ gridColumn: 'span 2' }}>
                  <span className="detail-label">CREW & TECHNICIANS</span>
                  <strong className="detail-value text-indigo" style={{ color: '#4338ca', fontSize: '14px' }}>
                    👥 {activePopupTanker.team_members}
                  </strong>
                  <span className="detail-sub">Municipal Authorized Field Team</span>
                </div>
              )}
            </div>

            {/* Destination & Purpose */}
            <div className="tanker-route-info">
              <div className="route-row">
                <MapPin size={16} className="text-amber" />
                <span><strong>Destination Sump:</strong> {activePopupTanker.destination_location}</span>
              </div>
              <div className="route-row">
                <Info size={16} className="text-teal" />
                <span><strong>Purpose:</strong> {activePopupTanker.purpose || 'Potable water distribution'}</span>
              </div>
              <div className="route-row">
                <Clock size={16} className="text-blue" />
                <span><strong>Status:</strong> <span className="status-in-transit">⚡ En Route to your ward</span></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="tanker-popup-actions">
              <a 
                href={`tel:${activePopupTanker.driver_phone}`} 
                className="btn-popup-call"
              >
                <PhoneCall size={18} />
                <span>Call Driver ({activePopupTanker.driver_name})</span>
              </a>
              <button 
                type="button" 
                className="btn-popup-ack" 
                onClick={() => handleAcknowledgeTanker(activePopupTanker.id)}
              >
                <CheckCircle2 size={18} />
                <span>Acknowledge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Live Tanker Alert Banner for this Citizen's Ward */}
      {wardTankers.filter(t => t.status === 'In Transit').map(t => (
        <div key={t.id} className="live-ward-tanker-banner">
          <div className="live-tanker-badge">
            <Truck size={20} />
            <span>WARD {userWardNumber} TANKER EN ROUTE</span>
          </div>
          <div className="live-tanker-summary">
            <strong>Vehicle: <span className="plate-badge">{t.vehicle_no}</span></strong>
            <span className="sep">•</span>
            <span>Driver: <strong>{t.driver_name}</strong></span>
            <span className="sep">•</span>
            <span>Mobile: <a href={`tel:${t.driver_phone}`} className="tanker-phone-link"><strong>📞 {t.driver_phone}</strong></a></span>
            {t.team_members && (
              <>
                <span className="sep">•</span>
                <span>Field Crew: <strong style={{ color: '#4338ca' }}>👥 {t.team_members}</strong></span>
              </>
            )}
            <span className="sep">•</span>
            <span>Capacity: <strong>{Number(t.capacity_liters).toLocaleString()} L</strong></span>
            <span className="sep">•</span>
            <span>Sump: <strong>{t.destination_location}</strong></span>
          </div>
          <div className="live-tanker-actions">
            <a href={`tel:${t.driver_phone}`} className="btn-quick-call">
              <PhoneCall size={14} /> Call Driver
            </a>
            <button className="btn-reopen-popup" onClick={() => setActivePopupTanker(t)}>
              View Details
            </button>
          </div>
        </div>
      ))}

      {/* Resident Header Banner */}
      <div className="citizen-hero-card">
        <div className="citizen-hero-content">
          <div className="badge-household">
            <Home size={16} />
            <span>Connected Household: <strong>{householdId}</strong></span>
          </div>
          <h2>Household Smart Meter Portal</h2>
          <p>
            Welcome, <strong>{residentName}</strong> • Real-time tracking of family water consumption and daily fair quota.
          </p>
        </div>

        <div className="citizen-hero-meta">
          <div className="status-pill-online">
            <span className="dot-pulse" />
            <span>Smart Meter Online</span>
          </div>
          {isCitizenResident && (
            <button
              className="btn-demand-water"
              onClick={() => {
                setDemandResult(null);
                setShowDemandModal(true);
              }}
            >
              <Droplet size={17} />
              <span>Request Extra Water</span>
            </button>
          )}
          <button
            className="btn-report-incident"
            onClick={() => {
              setReportResult(null);
              setShowReportModal(true);
            }}
          >
            <AlertTriangle size={16} />
            <span>Report Street Leak</span>
          </button>
        </div>
      </div>

      {/* Extra Quota Approved Alert Banner */}
      {extraGranted > 0 && (
        <div className="extra-quota-granted-banner">
          <Sparkles size={22} className="text-emerald" />
          <div>
            <strong>Extra Quota Approved: +{extraGranted.toLocaleString()} Liters</strong>
            <p>
              Your extra water request was granted. Your daily quota is boosted to <strong>{totalEffectiveQuota.toLocaleString()} Liters</strong> today.
            </p>
          </div>
        </div>
      )}

      {/* Primary Resident Dashboard Grid */}
      <div className="citizen-grid">
        {/* Card 1: Today's Consumption vs Fair Quota */}
        <div className="panel-container citizen-meter-card">
          <div className="panel-header">
            <div>
              <h3>Today's Fair Water Allocation</h3>
              <p>Transparent smart meter consumption vs authorized daily limit</p>
            </div>
            <span className={`quota-tag ${extraGranted > 0 ? 'quota-boosted' : ''}`}>
              {totalEffectiveQuota} L {extraGranted > 0 ? '(Boosted Limit)' : 'Daily Quota'}
            </span>
          </div>

          <div className="meter-visualizer">
            <div className="meter-circle-wrap">
              <svg className="meter-svg" viewBox="0 0 160 160">
                <circle
                  className="meter-bg"
                  cx="80"
                  cy="80"
                  r="68"
                  strokeWidth="14"
                />
                <circle
                  className="meter-fill"
                  cx="80"
                  cy="80"
                  r="68"
                  strokeWidth="14"
                  strokeDasharray="427"
                  strokeDashoffset={427 - (427 * usagePercent) / 100}
                />
              </svg>
              <div className="meter-center-text">
                <strong className="meter-value">{currentUsage}</strong>
                <span className="meter-unit">Liters Consumed</span>
                <span className="meter-pct">{usagePercent}% of Quota</span>
              </div>
            </div>

            <div className="meter-breakdown-list">
              <div className="meter-stat-row">
                <span>Standard Daily Limit:</span>
                <strong>{baseQuota} Liters</strong>
              </div>
              {extraGranted > 0 && (
                <div className="meter-stat-row text-emerald">
                  <span>Extra Approved Quota:</span>
                  <strong>+{extraGranted} Liters</strong>
                </div>
              )}
              <div className="meter-stat-row">
                <span>Total Authorized Today:</span>
                <strong>{totalEffectiveQuota} Liters</strong>
              </div>
              <div className="meter-stat-row">
                <span>Remaining Available:</span>
                <strong className="text-emerald">{remainingQuota} Liters</strong>
              </div>
              <div className="meter-stat-row">
                <span>Household Tap Flow:</span>
                <strong>18.2 L/min (Equally Balanced)</strong>
              </div>
              <div className="meter-stat-row">
                <span>Line Pressure:</span>
                <strong>2.8 Bar (Nominal Head)</strong>
              </div>
            </div>
          </div>

          <div className="meter-footer-note">
            <CheckCircle2 size={16} className="text-emerald" />
            <span>
              {usagePercent < 90
                ? 'Your household is operating smoothly within the Nagar Parishad equitable quota.'
                : 'Quota limit approaching. Consider conserving water for the next scheduled shift.'}
            </span>
          </div>
        </div>

        {/* Card 2: Supply Shift Timing & Domestic Watchdogs */}
        <div className="panel-container citizen-shift-card">
          <div className="panel-header">
            <div>
              <h3>Municipal Supply Shift Window</h3>
              <p>Ward-level scheduled distribution hours</p>
            </div>
            <span className="badge-active-shift"><Clock size={14} /> Morning Shift Active</span>
          </div>

          <div className="shift-display">
            <div className="shift-time-block">
              <span className="shift-label">Active Morning Shift</span>
              <strong className="shift-hours">06:00 AM – 08:30 AM</strong>
              <span className="shift-countdown">Pressurized equitable flow running</span>
            </div>

            <div className="shift-next-block">
              <span className="shift-label">Upcoming Evening Shift</span>
              <strong>06:30 PM – 08:00 PM</strong>
              <p>Automated elevation head leveling ensures full pressure across top & tail-end lanes.</p>
            </div>
          </div>

          {/* Household Watchdog Indicators */}
          <div className="household-watchdog-box">
            <div className="watchdog-item">
              <ShieldCheck size={20} className="text-emerald" />
              <div>
                <strong>Domestic Leak Sentinel: Clean</strong>
                <p>No continuous pinhole leakage or dripping faucet detected on your meter.</p>
              </div>
            </div>
            <div className="watchdog-item">
              <CheckCircle2 size={20} className="text-emerald" />
              <div>
                <strong>Anti-Suction Motor Check: Compliant</strong>
                <p>Direct gravity tap draw verified. No illegal 1 HP suction pump detected.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: My Extra Water Requests & Status */}
      <div className="panel-container citizen-demands-panel">
        <div className="panel-header">
          <div>
            <h3>My Extra Water Requests & Municipal Approvals</h3>
            <p>Track the status of your additional water quota applications in real time</p>
          </div>
          {isCitizenResident && (
            <button
              className="btn-action-sm-primary"
              onClick={() => {
                setDemandResult(null);
                setShowDemandModal(true);
              }}
            >
              <PlusCircle size={15} />
              <span>New Request</span>
            </button>
          )}
        </div>

        {myDemands.length === 0 ? (
          <div className="demands-empty-box">
            <Droplet size={36} className="text-muted" />
            <p>You have not submitted any extra water requests yet.</p>
            <small>
              Planning a wedding, religious puja, sump refill, or family gathering? Request extra allocation above.
            </small>
          </div>
        ) : (
          <div className="citizen-demands-table-wrap">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Volume</th>
                  <th>Purpose / Reason</th>
                  <th>Urgency</th>
                  <th>Requested At</th>
                  <th>Municipal Status</th>
                </tr>
              </thead>
              <tbody>
                {myDemands.map((demand) => {
                  const isPending = demand.status === 'Pending';
                  const isApproved = demand.status === 'Approved';
                  const isRejected = demand.status === 'Rejected';

                  return (
                    <tr key={demand.id}>
                      <td>
                        <strong className="text-cyan">+{Number(demand.extra_liters).toLocaleString()} L</strong>
                      </td>
                      <td>
                        <strong>{demand.reason}</strong>
                        {demand.notes && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {demand.notes}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`urgency-badge urgency-${(demand.urgency || 'Normal').toLowerCase().replace(' ', '-')}`}>
                          {demand.urgency || 'Normal'}
                        </span>
                      </td>
                      <td>
                        <small style={{ color: '#64748b' }}>
                          {new Date(demand.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </small>
                      </td>
                      <td>
                        {isPending && (
                          <span className="status-pill-badge status-pending">
                            <Clock size={12} className="spin-slow" />
                            <span>Pending Officer Review</span>
                          </span>
                        )}
                        {isApproved && (
                          <span className="status-pill-badge status-approved">
                            <CheckCircle2 size={12} />
                            <span>Permission Granted! Quota Added</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="status-pill-badge status-rejected">
                            <XCircle size={12} />
                            <span>Declined (Shift Capacity Full)</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Card 4: My Reported Incidents & Grievance Tickets */}
      <div className="panel-container citizen-demands-panel" style={{ marginTop: '24px' }}>
        <div className="panel-header">
          <div>
            <h3>My Incident Reports & Municipal Field Dispatches</h3>
            <p>Track the real-time repair and investigation status of pipe leaks, pressure drops, or booster motors you reported</p>
          </div>
          <button
            className="btn-action-sm-primary"
            style={{ background: '#f59e0b', borderColor: '#d97706' }}
            onClick={() => {
              setReportResult(null);
              setShowReportModal(true);
            }}
          >
            <AlertTriangle size={15} />
            <span>Report Incident</span>
          </button>
        </div>

        {myGrievances.length === 0 ? (
          <div className="demands-empty-box">
            <CheckCircle2 size={36} className="text-emerald" />
            <p>No active incidents or grievances registered for your household.</p>
            <small>Notice a street leak, overflowing community tank, or abnormal pressure drop? Report it immediately above.</small>
          </div>
        ) : (
          <div className="citizen-demands-table-wrap">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Incident Type</th>
                  <th>Location</th>
                  <th>Technician & ETA</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myGrievances.map((g) => {
                  const isResolved = g.status === 'Resolved';
                  const isDispatched = g.status === 'Field Team Dispatched' || g.status === 'In Progress';

                  return (
                    <tr key={g.id}>
                      <td>
                        <strong className="text-cyan">#{g.ticket_code}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(g.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <strong>{g.incident_type}</strong>
                        {g.description && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {g.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span>{g.location}</span>
                      </td>
                      <td>
                        {g.assigned_technician && g.assigned_technician !== 'Unassigned' ? (
                          <div>
                            <strong style={{ fontSize: '12px', color: '#0f766e' }}>{g.assigned_technician}</strong>
                            {g.eta_minutes ? (
                              <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                                <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                                ETA: {g.eta_minutes} mins
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Awaiting technician assignment</span>
                        )}
                      </td>
                      <td>
                        {isResolved ? (
                          <span className="status-pill-badge status-approved">
                            <CheckCircle2 size={12} />
                            <span>Resolved</span>
                          </span>
                        ) : isDispatched ? (
                          <span className="status-pill-badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>
                            <Clock size={12} className="spin-slow" />
                            <span>{g.status}</span>
                          </span>
                        ) : (
                          <span className="status-pill-badge status-pending">
                            <Clock size={12} />
                            <span>Under Investigation</span>
                          </span>
                        )}
                        {g.resolution_notes && (
                          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '3px' }}>
                            {g.resolution_notes}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ward Emergency Tanker Deliveries Section */}
      <div className="panel-container ward-tankers-panel">
        <div className="panel-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={20} className="text-cyan" />
              <h3>Nagar Parishad Potable Water Tankers ({userWardName})</h3>
            </div>
            <p>Official municipal water tanker dispatches and community sump refill logistics for your ward</p>
          </div>
          <span className={`badge-active-shift ${wardTankers.some(t => t.status === 'In Transit') ? 'active' : ''}`}>
            {wardTankers.some(t => t.status === 'In Transit')
              ? `⚡ ${wardTankers.filter(t => t.status === 'In Transit').length} Tanker En Route` 
              : 'Fleet Standby'}
          </span>
        </div>

        {wardTankers.length === 0 ? (
          <div className="empty-table-state" style={{ padding: '24px', textAlign: 'center' }}>
            <Truck size={36} style={{ color: '#94a3b8', margin: '0 auto 8px' }} />
            <p style={{ color: '#64748b', margin: 0, fontWeight: 500 }}>
              No emergency tankers currently dispatched to {userWardName}. Central pipeline grid operating under equilibrium.
            </p>
          </div>
        ) : (
          <div className="citizen-demands-table-wrap">
            <table className="custom-table citizen-tankers-table">
              <thead>
                <tr>
                  <th style={{ width: '18%', minWidth: '140px' }}>Vehicle & Code</th>
                  <th style={{ width: '18%', minWidth: '150px' }}>Driver Details</th>
                  <th style={{ width: '14%', minWidth: '110px' }}>Capacity</th>
                  <th style={{ width: '22%', minWidth: '160px' }}>Delivery Location</th>
                  <th style={{ width: '18%', minWidth: '150px' }}>Purpose</th>
                  <th style={{ width: '10%', minWidth: '110px', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {wardTankers.map(tanker => {
                  const isInTransit = tanker.status === 'In Transit';
                  const isDelivered = tanker.status === 'Delivered';
                  return (
                    <tr key={tanker.id} className={isInTransit ? 'row-highlight-active' : ''}>
                      <td>
                        <strong className="vehicle-plate-pill">{tanker.vehicle_no}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                          Code: {tanker.dispatch_code}
                        </div>
                      </td>
                      <td>
                        <strong style={{ display: 'block', color: '#0f172a', fontSize: '13px' }}>{tanker.driver_name}</strong>
                        <a href={`tel:${tanker.driver_phone}`} className="tanker-phone-btn">
                          <PhoneCall size={12} />
                          <span>{tanker.driver_phone}</span>
                        </a>
                      </td>
                      <td>
                        <strong className="text-cyan" style={{ fontSize: '14px' }}>
                          {Number(tanker.capacity_liters).toLocaleString()} L
                        </strong>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Potable Water</div>
                      </td>
                      <td>
                        <strong style={{ color: '#0f172a', display: 'block' }}>{tanker.destination_location}</strong>
                        <div style={{ fontSize: '11px', color: '#0d9488', fontWeight: 500, marginTop: '2px' }}>
                          {tanker.target_ward_name || userWardName}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: '#475569', lineHeight: 1.4, display: 'inline-block' }}>
                          {tanker.purpose}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                          {isInTransit ? (
                            <>
                              <span className="status-pill-badge" style={{ background: '#ecfeff', color: '#0e7490', border: '1px solid #a5f3fc' }}>
                                <span className="pulse-dot-inline" /> In Transit
                              </span>
                              <button 
                                className="btn-quick-popup-open"
                                onClick={() => setActivePopupTanker(tanker)}
                              >
                                View Details
                              </button>
                            </>
                          ) : isDelivered ? (
                            <span className="status-pill-badge status-approved">
                              <CheckCircle2 size={12} /> Delivered
                            </span>
                          ) : (
                            <span className="status-pill-badge status-pending">
                              <Clock size={12} /> {tanker.status}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Secondary Citizen Row: Quality & Conservation Scorecard */}
      <div className="citizen-stats-row">
        {/* Drinking Water Quality */}
        <div className="citizen-info-card">
          <div className="citizen-info-top">
            <div className="citizen-icon-circle icon-quality">
              <Droplet size={20} />
            </div>
            <span className="badge-quality-safe">Safe to Drink</span>
          </div>
          <h4>Drinking Water Safety Index</h4>
          <div className="quality-readings">
            <div>
              <span>Residual Chlorine</span>
              <strong>0.8 ppm</strong>
              <small>Optimal: 0.2 - 1.0 ppm</small>
            </div>
            <div>
              <span>Turbidity Level</span>
              <strong>1.2 NTU</strong>
              <small>Standard: &lt; 5.0 NTU</small>
            </div>
            <div>
              <span>Water pH</span>
              <strong>7.4 Neutral</strong>
              <small>Safe: 6.5 - 8.5</small>
            </div>
          </div>
          <p className="card-micro-desc">Monitored 24/7 by AquaFair Central Filtration Headworks.</p>
        </div>

        {/* Conservation Scorecard */}
        <div className="citizen-info-card">
          <div className="citizen-info-top">
            <div className="citizen-icon-circle icon-conservation">
              <Sparkles size={20} />
            </div>
            <span className="badge-saver">Tier 1 AquaSaver</span>
          </div>
          <h4>Household Conservation Badge</h4>
          <div className="conservation-meta-box">
            <strong className="text-emerald">+80 Liters Conserved Today</strong>
            <p>Saved vs standard unmonitored municipal consumption ceiling.</p>
            <div className="monthly-savings">
              <span>This Month Conserved:</span>
              <strong>2,450 Liters</strong>
            </div>
          </div>
          <div className="conservation-tip">
            <Info size={14} />
            <span>Tip: Turning off tap while brushing saves 12 L/day per person.</span>
          </div>
        </div>
      </div>

      {/* Demand Extra Water Modal */}
      {showDemandModal && (
        <div className="modal-backdrop" onClick={() => setShowDemandModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <Droplet size={22} className="text-cyan" />
                <div>
                  <h3>Request Extra Water Quota</h3>
                  <p>Household Connection: <strong>{householdId}</strong> ({residentName})</p>
                </div>
              </div>
              <button className="btn-close" onClick={() => setShowDemandModal(false)}>×</button>
            </div>

            {demandResult ? (
              <div className="report-success-view">
                <CheckCircle2 size={54} className="text-emerald" />
                <h3>Extra Quota Request Registered!</h3>
                <div className="ticket-badge">
                  <strong>Ticket #{demandResult.ticket_code}</strong>
                </div>
                <p>
                  Your requirement for <strong>+{demandResult.extra_liters} Liters</strong> has been dispatched directly to the <strong>Municipal Officer's desk</strong> for review and permission.
                </p>
                <div className="sub-notice-pill">
                  <Clock size={14} />
                  <span>Once the Municipal Officer grants permission, your meter quota will automatically update.</span>
                </div>
                <button
                  className="primary-btn"
                  onClick={() => setShowDemandModal(false)}
                  style={{ marginTop: 16 }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitDemand} className="report-form">
                <label>
                  Select Extra Volume (Liters)
                  <div className="chips-row">
                    {[250, 500, 1000, 2000].map(vol => (
                      <button
                        type="button"
                        key={vol}
                        className={`volume-chip ${Number(demandForm.extra_liters) === vol ? 'active' : ''}`}
                        onClick={() => setDemandForm({ ...demandForm, extra_liters: vol })}
                      >
                        +{vol} L
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    required
                    min="50"
                    max="5000"
                    value={demandForm.extra_liters}
                    onChange={(e) => setDemandForm({ ...demandForm, extra_liters: Number(e.target.value) })}
                    placeholder="Enter custom volume in Liters"
                    style={{ marginTop: 8 }}
                  />
                </label>

                <div className="form-group-row">
                  <label>
                    Purpose / Reason
                    <select
                      value={demandForm.reason}
                      onChange={(e) => setDemandForm({ ...demandForm, reason: e.target.value })}
                    >
                      <option>Wedding / Social Ceremony</option>
                      <option>Religious Festival / Puja</option>
                      <option>Underground Sump Refill</option>
                      <option>Tanker Delivery Delay</option>
                      <option>Medical Emergency / Illness</option>
                      <option>Home Renovation / Painting</option>
                    </select>
                  </label>

                  <label>
                    Urgency Tier
                    <select
                      value={demandForm.urgency}
                      onChange={(e) => setDemandForm({ ...demandForm, urgency: e.target.value })}
                    >
                      <option>Normal (Event in 24-48 hrs)</option>
                      <option>High Priority (Same-day)</option>
                      <option>Emergency (Immediate health need)</option>
                    </select>
                  </label>
                </div>

                <label>
                  Delivery Notes for Municipal Officer
                  <textarea
                    rows={2}
                    placeholder="e.g. Need extra pressure in the afternoon shift between 2:00 PM and 4:00 PM for water sump filling."
                    value={demandForm.notes}
                    onChange={(e) => setDemandForm({ ...demandForm, notes: e.target.value })}
                  />
                </label>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowDemandModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn" disabled={submittingDemand}>
                    <Send size={15} />
                    <span>{submittingDemand ? 'Dispatching to Officer...' : 'Send Request to Municipal Officer'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Citizen Grievance / Leak Reporting Modal */}
      {showReportModal && (
        <div className="modal-backdrop" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Report Pipeline Leak / Water Anomaly</h3>
                <p>Submit direct alert to Nagar Parishad rapid response line team</p>
              </div>
              <button className="btn-close" onClick={() => setShowReportModal(false)}>×</button>
            </div>

            {reportResult ? (
              <div className="report-success-view">
                <CheckCircle2 size={54} className="text-emerald" />
                <h3>Grievance Ticket Generated!</h3>
                <div className="ticket-badge">
                  <strong>Ticket #{reportResult.ticket_code}</strong>
                </div>
                <p>{reportResult.message}</p>
                <button
                  className="primary-btn"
                  onClick={() => {
                    setReportResult(null);
                    setShowReportModal(false);
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form className="report-form" onSubmit={handleSubmitReport}>
                <div className="form-group-row">
                  <label>
                    Your Name
                    <input
                      required
                      value={reportForm.citizen_name}
                      onChange={(e) => setReportForm({ ...reportForm, citizen_name: e.target.value })}
                    />
                  </label>
                  <label>
                    Contact Phone
                    <input
                      required
                      value={reportForm.phone}
                      onChange={(e) => setReportForm({ ...reportForm, phone: e.target.value })}
                    />
                  </label>
                </div>

                <div className="form-group-row">
                  <label>
                    Ward / Community
                    <select
                      value={reportForm.ward_name}
                      onChange={(e) => setReportForm({ ...reportForm, ward_name: e.target.value })}
                    >
                      <option>Ward 1 - Shivaji Nagar</option>
                      <option>Ward 2 - Gandhi Ward</option>
                      <option>Ward 3 - Subhash Nagar</option>
                      <option>Ward 4 - Ambedkar Ward</option>
                    </select>
                  </label>
                  <label>
                    Incident Category
                    <select
                      value={reportForm.incident_type}
                      onChange={(e) => setReportForm({ ...reportForm, incident_type: e.target.value })}
                    >
                      <option>Pipeline Leak / Burst</option>
                      <option>Public Tank Overflow Spillage</option>
                      <option>Low Pressure / Dry Tap</option>
                      <option>Unauthorized Booster Suction Pump</option>
                    </select>
                  </label>
                </div>

                <label>
                  Exact Location / Landmark
                  <input
                    required
                    value={reportForm.location}
                    onChange={(e) => setReportForm({ ...reportForm, location: e.target.value })}
                    placeholder="e.g. Near Ganpati Mandir, Lane 2 road crossing"
                  />
                </label>

                <label>
                  Description of Issue
                  <textarea
                    rows={3}
                    required
                    value={reportForm.description}
                    onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                    placeholder="Describe how much water is leaking, bubbling, or overflowing..."
                  />
                </label>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowReportModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-btn" disabled={submittingReport}>
                    <Send size={16} />
                    <span>{submittingReport ? 'Submitting Ticket...' : 'Dispatch Report to Nagar Parishad'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
