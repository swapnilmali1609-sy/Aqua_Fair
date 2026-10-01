import React, { useState, useEffect } from 'react';
import { 
  Wrench, CheckCircle2, AlertTriangle, Clock, MapPin, Phone, 
  ShieldCheck, Droplets, User, RefreshCw, Zap, Truck, Check, 
  FileText, ShieldAlert, ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function TeamLeaderPortalView({ user }) {
  const [grievances, setGrievances] = useState([]);
  const [tankers, setTankers] = useState([]);
  const [filter, setFilter] = useState('active'); // 'active', 'in_progress', 'resolved', 'all'
  const [loading, setLoading] = useState(false);
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('On-site inspection completed. Repaired line fault, restored pressure head to 48 PSI, equitable flow restored.');
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const leaderName = user?.name?.replace(/\(.*\)/, '').trim() || 'Suresh More';
  const badgeId = user?.household_id || user?.badge_id || 'NP-SUPV-04';
  const phone = user?.phone || '9890223344';
  const isOfficer = !user || user?.role === 'Municipal Officer' || user?.role === 'Administrator' || user?.role?.includes('Officer');

  const loadData = async () => {
    setLoading(true);
    const [grvData, tnkData] = await Promise.all([
      api.getGrievances(),
      api.getTankers()
    ]);
    if (grvData) setGrievances(grvData);
    if (tnkData) setTankers(tnkData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleDispatched = () => loadData();
    const handleResolved = () => loadData();
    window.addEventListener('aquafair_grievance_status_changed', handleResolved);
    window.addEventListener('aquafair_grievance_resolved', handleResolved);
    window.addEventListener('aquafair_tanker_dispatched', handleDispatched);
    window.addEventListener('aquafair_tanker_delivered', handleDispatched);
    return () => {
      window.removeEventListener('aquafair_grievance_status_changed', handleResolved);
      window.removeEventListener('aquafair_grievance_resolved', handleResolved);
      window.removeEventListener('aquafair_tanker_dispatched', handleDispatched);
      window.removeEventListener('aquafair_tanker_delivered', handleDispatched);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const activeGrievances = grievances.filter(g => g.status !== 'Resolved');
  const inProgressGrievances = grievances.filter(g => g.status === 'In Progress' || g.status === 'Field Team Dispatched');
  const resolvedGrievances = grievances.filter(g => g.status === 'Resolved');

  const displayedGrievances = filter === 'active'
    ? activeGrievances
    : filter === 'in_progress'
      ? inProgressGrievances
      : filter === 'resolved'
        ? resolvedGrievances
        : grievances;

  const handleStartWork = async (grievance) => {
    try {
      const res = await api.updateGrievanceStatus(grievance.id, {
        status: 'In Progress',
        assigned_technician: `${leaderName} Squad`
      });
      if (res && res.success) {
        showToast(`🛠️ Ticket #${grievance.ticket_code} marked as In Progress. Crew deployed.`);
        loadData();
      }
    } catch (e) {
      showToast('Error updating ticket status');
    }
  };

  const handleOpenResolveModal = (grievance) => {
    setSelectedGrievance(grievance);
    setResolutionNotes(`Maintenance inspection completed at ${grievance.location}. Repaired ${grievance.incident_type.toLowerCase()}, tightened feeder coupling, tested line pressure (48 PSI). Flow restored.`);
  };

  const handleConfirmResolve = async () => {
    if (!selectedGrievance) return;
    setSubmitting(true);
    try {
      const res = await api.resolveGrievance(selectedGrievance.id, { resolution_notes: resolutionNotes });
      if (res && res.success) {
        showToast(`✅ Ticket #${selectedGrievance.ticket_code} Resolved! Directly updated on Municipal Officer's Dashboard.`);
        setSelectedGrievance(null);
        loadData();
      }
    } catch (err) {
      showToast('Error resolving grievance');
    }
    setSubmitting(false);
  };

  return (
    <div className="leader-portal-container">
      {/* Toast */}
      {toastMessage && (
        <div className="toast-notification" style={{ background: '#0d9488', color: '#fff' }}>
          {toastMessage}
        </div>
      )}

      {/* Team Leader Cockpit Header */}
      <section className="leader-cockpit-hero">
        <div className="leader-profile-info">
          <div className="leader-avatar-circle">
            <Wrench size={32} />
          </div>
          <div>
            <div className="leader-badge-row">
              <span className="leader-badge-pill">
                🎖️ Badge: <strong>{badgeId}</strong>
              </span>
              <span className="leader-role-pill">
                Field Dispatch & Maintenance Team Leader
              </span>
            </div>
            <h2>Field Repair Squad: {leaderName}</h2>
            <div className="leader-creds-meta">
              <span><strong>Phone:</strong> {phone}</span>
              <span>•</span>
              <span><strong>Jurisdiction:</strong> All Municipal Wards (Wards 1 - 4)</span>
              <span>•</span>
              <span><strong>Station:</strong> Nagar Parishad Emergency Response Unit</span>
            </div>
          </div>
        </div>

        <div className="leader-actions-panel">
          <button className="btn-refresh-data" onClick={loadData}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh Tickets</span>
          </button>
          <a href="tel:02027451234" className="btn-call-desk">
            <Phone size={14} />
            <span>Call SCADA Control Room</span>
          </a>
        </div>
      </section>

      {/* KPI Stat Cards */}
      <div className="stats-row" style={{ marginTop: '16px' }}>
        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap" style={{ background: '#fef2f2', color: '#ef4444' }}>
              <AlertTriangle size={20} />
            </div>
            <span className="stat-trend trend-critical">Attention Needed</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Active Field Incidents</span>
            <div className="stat-number">{activeGrievances.length} <small>Open Tickets</small></div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap" style={{ background: '#fffbeb', color: '#f59e0b' }}>
              <Clock size={20} />
            </div>
            <span className="stat-trend" style={{ background: '#fef3c7', color: '#92400e' }}>Under Repair</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Repairs In Progress</span>
            <div className="stat-number">{inProgressGrievances.length} <small>Squad on Field</small></div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
              <CheckCircle2 size={20} />
            </div>
            <span className="stat-trend trend-positive">Parity Restored</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Resolved & Restored</span>
            <div className="stat-number">{resolvedGrievances.length} <small>Completed</small></div>
          </div>
        </div>
      </div>

      {/* Field Incidents & Grievance Tickets Console */}
      <div className="panel-container" style={{ marginTop: '20px' }}>
        <div className="panel-header">
          <div>
            <h3>Field Maintenance Complaints, Leaks & Problem Locations</h3>
            <p>Direct citizen grievance tickets, reported leak coordinates, and resolution workflow</p>
          </div>
          <div className="tab-filters-row">
            <button 
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active Incidents ({activeGrievances.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'in_progress' ? 'active' : ''}`}
              onClick={() => setFilter('in_progress')}
            >
              In Progress ({inProgressGrievances.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'resolved' ? 'active' : ''}`}
              onClick={() => setFilter('resolved')}
            >
              Resolved ({resolvedGrievances.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Records ({grievances.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
            <p>Loading field maintenance tickets...</p>
          </div>
        ) : displayedGrievances.length === 0 ? (
          <div className="empty-trips-state">
            <CheckCircle2 size={40} style={{ color: '#059669', marginBottom: '8px' }} />
            <h4>No {filter === 'active' ? 'Active' : ''} Complaints in this view</h4>
            <p>All pipeline leaks and pressure complaints have been resolved and verified by the squad.</p>
          </div>
        ) : (
          <div className="grievance-cards-list">
            {displayedGrievances.map(grv => {
              const isResolved = grv.status === 'Resolved';
              const isInProgress = grv.status === 'In Progress';
              const isCritical = grv.priority === 'Critical' || grv.priority === 'High';

              return (
                <div key={grv.id} className={`incident-card-item ${isResolved ? 'card-resolved' : isInProgress ? 'card-in-progress' : 'card-pending'}`}>
                  <div className="incident-card-top">
                    <div className="ticket-code-tag">
                      <strong>#{grv.ticket_code}</strong>
                      <span className={`priority-pill priority-${grv.priority?.toLowerCase()}`}>
                        {grv.priority} Priority
                      </span>
                    </div>
                    <span className={`status-pill status-${grv.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {grv.status}
                    </span>
                  </div>

                  <div className="incident-grid-content">
                    {/* Problem & Description */}
                    <div className="incident-detail-col col-main">
                      <span className="col-label"><AlertTriangle size={13} /> Reported Problem</span>
                      <strong className="problem-title">{grv.incident_type}</strong>
                      <p className="problem-desc">{grv.description || 'No additional description provided.'}</p>
                      {grv.resolution_notes && (
                        <div className="resolution-notes-preview">
                          <CheckCircle2 size={13} style={{ color: '#059669', flexShrink: 0 }} />
                          <span><strong>Resolution:</strong> {grv.resolution_notes}</span>
                        </div>
                      )}
                    </div>

                    {/* Exact Location & Ward */}
                    <div className="incident-detail-col">
                      <span className="col-label"><MapPin size={13} /> Exact Location & Ward</span>
                      <strong className="location-title">{grv.location}</strong>
                      <span className="ward-pill-label">{grv.ward_name || `Ward ${grv.ward_number}`}</span>
                    </div>

                    {/* Citizen & Contact */}
                    <div className="incident-detail-col">
                      <span className="col-label"><User size={13} /> Citizen Resident</span>
                      <strong className="citizen-name">{grv.citizen_name}</strong>
                      {grv.phone ? (
                        <a href={`tel:${grv.phone}`} className="citizen-call-chip">
                          <Phone size={12} />
                          <span>{grv.phone} (Call Citizen)</span>
                        </a>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>No phone logged</span>
                      )}
                      <span className="technician-tag">Squad: {grv.assigned_technician || 'Unassigned'}</span>
                    </div>
                  </div>

                  {/* Actions & Timestamps */}
                  <div className="incident-card-footer">
                    <div className="incident-timestamps">
                      <Clock size={13} />
                      <span>
                        Reported: {new Date(grv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {grv.resolved_at && ` • Resolved: ${new Date(grv.resolved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>

                    <div className="action-buttons-group">
                      {isOfficer ? (
                        <div className="squad-supervisor-pill">
                          <Wrench size={13} className={grv.status === 'In Progress' ? 'spin-slow' : ''} />
                          <span>{isResolved ? 'Resolved by Field Squad' : grv.status === 'In Progress' ? 'Squad Repairing On-Site' : 'Squad Assigned'}</span>
                        </div>
                      ) : (
                        <>
                          {!isResolved && grv.status !== 'In Progress' && (
                            <button 
                              className="btn-start-work"
                              onClick={() => handleStartWork(grv)}
                            >
                              <Wrench size={14} />
                              <span>Start On-Site Repair</span>
                            </button>
                          )}

                          {!isResolved ? (
                            <button 
                              className="btn-resolve-grievance"
                              onClick={() => handleOpenResolveModal(grv)}
                            >
                              <Check size={14} />
                              <span>Mark Problem Resolved</span>
                            </button>
                          ) : (
                            <div className="resolved-chip">
                              <CheckCircle2 size={15} />
                              <span>Resolved (Displayed on Officer SCADA)</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Tanker Fleet Operations Summary (For coordination with drivers) */}
      <div className="panel-container" style={{ marginTop: '20px' }}>
        <div className="panel-header">
          <div>
            <h3>Coordinated Emergency Tanker Fleet Operations</h3>
            <p>Live status of tankers and accompanying squad crew members deployed across wards</p>
          </div>
          <span className="fleet-active-badge">
            <Truck size={14} /> {tankers.filter(t => t.status === 'In Transit').length} Tankers in Transit
          </span>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Vehicle & Code</th>
                <th>Driver & Contact</th>
                <th>Destination & Ward</th>
                <th>Capacity</th>
                <th>Accompanying Squad</th>
                <th>Transit Status</th>
              </tr>
            </thead>
            <tbody>
              {tankers.map(t => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.vehicle_no}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{t.dispatch_code}</div>
                  </td>
                  <td>
                    <strong>{t.driver_name}</strong>
                    <div style={{ fontSize: '11px', color: '#0d9488' }}>
                      <Phone size={10} style={{ display: 'inline', marginRight: '3px' }} />
                      {t.driver_phone}
                    </div>
                  </td>
                  <td>
                    <strong>{t.destination_location}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{t.target_ward_name}</div>
                  </td>
                  <td><strong>{t.capacity_liters?.toLocaleString()} L</strong></td>
                  <td>
                    <span className="crew-members-tag">{t.team_members || 'Field Escort'}</span>
                  </td>
                  <td>
                    <span className={`status-pill status-${t.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedGrievance && !isOfficer && (
        <div className="modal-backdrop" onClick={() => setSelectedGrievance(null)}>
          <div className="modal-dialog-modern" onClick={e => e.stopPropagation()}>
            <div className="modal-header-modern">
              <div className="header-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3>Mark Problem Resolved & Normalized</h3>
                <p>Ticket #{selectedGrievance.ticket_code} • {selectedGrievance.incident_type}</p>
              </div>
            </div>

            <div className="modal-body-modern">
              <div className="summary-fill-box">
                <div className="fill-item">
                  <span>Incident Type:</span>
                  <strong>{selectedGrievance.incident_type}</strong>
                </div>
                <div className="fill-item">
                  <span>Exact Location:</span>
                  <strong>{selectedGrievance.location}</strong>
                </div>
                <div className="fill-item">
                  <span>Ward:</span>
                  <strong>{selectedGrievance.ward_name}</strong>
                </div>
                <div className="fill-item">
                  <span>Citizen Contact:</span>
                  <span>{selectedGrievance.citizen_name} ({selectedGrievance.phone || 'N/A'})</span>
                </div>
              </div>

              <label className="form-label" style={{ marginTop: '14px', display: 'block' }}>
                Field Maintenance / Resolution Report:
                <textarea
                  rows={3}
                  className="modern-textarea"
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  placeholder="Describe repair actions taken (e.g. replaced gasket, sealed collar, tested pressure, normalized flow rate)."
                />
              </label>

              <div className="officer-sync-notice">
                <ShieldCheck size={16} style={{ color: '#059669' }} />
                <span>
                  Marking this ticket as Resolved will <strong>directly display on the Municipal Officer's Dashboard</strong>, notify the citizen, and update municipal water equity audit records.
                </span>
              </div>
            </div>

            <div className="modal-actions-modern">
              <button 
                type="button" 
                className="btn-modal-cancel" 
                onClick={() => setSelectedGrievance(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-modal-confirm-green"
                onClick={handleConfirmResolve}
                disabled={submitting}
              >
                {submitting ? 'Updating Officer SCADA...' : 'Confirm Resolution & Sign Off'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
