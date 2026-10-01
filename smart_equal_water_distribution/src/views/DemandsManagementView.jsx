import React, { useState } from 'react';
import {
  Droplet,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Users,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Send
} from 'lucide-react';

export default function DemandsManagementView({
  demands = [],
  zones = [],
  onApproveDemand,
  onRejectDemand
}) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterWard, setFilterWard] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('Elevated Reservoir capacity reserved for essential shift');
  const [processingId, setProcessingId] = useState(null);

  // Summary counts
  const pendingCount = demands.filter(d => d.status === 'Pending').length;
  const approvedCount = demands.filter(d => d.status === 'Approved').length;
  const rejectedCount = demands.filter(d => d.status === 'Rejected').length;
  const totalExtraLitersApproved = demands
    .filter(d => d.status === 'Approved')
    .reduce((sum, d) => sum + (Number(d.extra_liters) || 0), 0);

  // Filtered demands
  const filteredDemands = demands.filter(d => {
    if (filterStatus !== 'All' && d.status !== filterStatus) return false;
    if (filterWard !== 'All') {
      const targetZone = zones.find(z => String(z.id) === String(filterWard) || String(z.ward_number) === String(filterWard));
      const wNum = targetZone ? targetZone.ward_number : filterWard;
      const zId = targetZone ? targetZone.id : filterWard;
      const matchZone =
        String(d.zone) === String(zId) ||
        String(d.zone) === String(wNum) ||
        (d.zone_name && d.zone_name.toLowerCase().includes(`ward ${wNum}`));
      if (!matchZone) return false;
    }
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = d.requested_by?.toLowerCase().includes(q);
      const matchHh = d.household_code?.toLowerCase().includes(q) || String(d.household).toLowerCase().includes(q);
      const matchReason = d.reason?.toLowerCase().includes(q);
      const matchWard = d.zone_name?.toLowerCase().includes(q);
      if (!matchName && !matchHh && !matchReason && !matchWard) return false;
    }
    return true;
  });

  const handleGrant = async (demand) => {
    setProcessingId(demand.id);
    await onApproveDemand(demand.id);
    setProcessingId(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectModalItem) return;
    setProcessingId(rejectModalItem.id);
    await onRejectDemand(rejectModalItem.id, rejectReason);
    setProcessingId(null);
    setRejectModalItem(null);
  };

  return (
    <div className="view-container">
      {/* Officer Header Card */}
      <div className="demands-hero-card">
        <div className="demands-hero-content">
          <div className="badge-officer-desk">
            <Building2 size={16} />
            <span>Municipal Engineering Operations</span>
          </div>
          <h2>Water Demand Approvals</h2>
          <p>
            Review and grant permission for additional water quota requests while preserving community equity.
          </p>
        </div>

        <div className="demands-summary-counters">
          <div className={`counter-box ${pendingCount > 0 ? 'highlight-pending' : ''}`}>
            <span className="counter-label">Pending Approval</span>
            <strong className="counter-val">{pendingCount}</strong>
            <span className="counter-sub">Action required</span>
          </div>
          <div className="counter-box">
            <span className="counter-label">Granted Requests</span>
            <strong className="counter-val text-emerald">{approvedCount}</strong>
            <span className="counter-sub">Dispatched quotas</span>
          </div>
          <div className="counter-box">
            <span className="counter-label">Extra Volume Dispatched</span>
            <strong className="counter-val text-cyan">
              {totalExtraLitersApproved.toLocaleString()} <small>L</small>
            </strong>
            <span className="counter-sub">Added to daily supply</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="demands-toolbar">
        <div className="status-tabs-row">
          {[
            { id: 'All', label: 'All Requests', count: demands.length },
            { id: 'Pending', label: 'Pending', count: pendingCount, isAlert: pendingCount > 0 },
            { id: 'Approved', label: 'Approved', count: approvedCount },
            { id: 'Rejected', label: 'Rejected', count: rejectedCount }
          ].map(tab => (
            <button
              key={tab.id}
              className={`status-tab-btn ${filterStatus === tab.id ? 'active' : ''} ${tab.isAlert ? 'tab-alert' : ''}`}
              onClick={() => setFilterStatus(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="tab-badge">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="toolbar-controls-row">
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by resident name, household ID, or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-ward-select">
            <Filter size={15} />
            <select value={filterWard} onChange={(e) => setFilterWard(e.target.value)}>
              <option value="All">All Municipal Wards</option>
              {zones.map(z => (
                <option key={z.id} value={z.ward_number || z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Demands List */}
      <div className="demands-list-grid">
        {filteredDemands.length === 0 ? (
          <div className="empty-demands-state">
            <Droplet size={48} className="text-muted" />
            <h3>No Water Demand Requests Found</h3>
            <p>
              {filterStatus === 'Pending'
                ? 'All citizen extra water demands have been reviewed and resolved! Great job maintaining equitable distribution.'
                : 'No demand records match the selected filter criteria.'}
            </p>
          </div>
        ) : (
          filteredDemands.map((demand) => {
            const isPending = demand.status === 'Pending';
            const isApproved = demand.status === 'Approved';
            const isRejected = demand.status === 'Rejected';
            const isBusy = processingId === demand.id;

            return (
              <div
                key={demand.id}
                className={`demand-card ${isPending ? 'border-pending' : isApproved ? 'border-approved' : 'border-rejected'}`}
              >
                <div className="demand-card-header">
                  <div className="demand-user-identity">
                    <div className="demand-avatar">
                      {(demand.requested_by || 'C')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="demand-name-row">
                        <strong>{demand.requested_by || demand.household_owner || 'Citizen Resident'}</strong>
                        {demand.household_code && (
                          <span className="demand-hh-tag">{demand.household_code}</span>
                        )}
                      </div>
                      <span className="demand-ward-name">
                        <Building2 size={13} /> {demand.zone_name || `Ward ${demand.zone}`}
                      </span>
                    </div>
                  </div>

                  <div className="demand-badges-group">
                    <span className={`urgency-badge urgency-${(demand.urgency || 'Normal').toLowerCase().replace(' ', '-')}`}>
                      {demand.urgency || 'Normal'}
                    </span>
                    <span className={`status-pill-badge status-${demand.status?.toLowerCase()}`}>
                      {isPending && <Clock size={12} className="spin-slow" />}
                      {isApproved && <CheckCircle2 size={12} />}
                      {isRejected && <XCircle size={12} />}
                      <span>{demand.status}</span>
                    </span>
                  </div>
                </div>

                <div className="demand-card-body">
                  <div className="demand-volume-highlight">
                    <Droplet size={22} className="text-cyan" />
                    <div>
                      <span className="vol-sub">Requested Extra Volume</span>
                      <strong className="vol-main">+{Number(demand.extra_liters).toLocaleString()} Liters</strong>
                    </div>
                  </div>

                  <div className="demand-reason-box">
                    <span className="reason-label">Purpose / Reason:</span>
                    <p className="reason-text">{demand.reason || 'General domestic requirement'}</p>
                    {demand.notes && (
                      <p className="notes-text">
                        <small><strong>Resident note:</strong> {demand.notes}</small>
                      </p>
                    )}
                  </div>
                </div>

                <div className="demand-card-footer">
                  <span className="demand-time-meta">
                    <Calendar size={13} />
                    {new Date(demand.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>

                  <div className="demand-action-buttons">
                    {isPending ? (
                      <>
                        <button
                          className="btn-reject-demand"
                          disabled={isBusy}
                          onClick={() => {
                            setRejectModalItem(demand);
                            setRejectReason('Elevated reservoir quota fully committed for current shift');
                          }}
                          title="Reject extra water demand"
                        >
                          <XCircle size={15} />
                          <span>Reject</span>
                        </button>
                        <button
                          className="btn-grant-permission"
                          disabled={isBusy}
                          onClick={() => handleGrant(demand)}
                          title="Grant permission and dispatch extra water quota"
                        >
                          <CheckCircle2 size={16} />
                          <span>{isBusy ? 'Granting...' : 'Grant Permission'}</span>
                        </button>
                      </>
                    ) : isApproved ? (
                      <div className="granted-status-indicator">
                        <CheckCircle2 size={16} className="text-emerald" />
                        <span>Permission Granted • Quota Dispatched</span>
                      </div>
                    ) : (
                      <div className="rejected-status-indicator">
                        <XCircle size={16} className="text-rose" />
                        <span>Declined by Municipal Officer</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalItem && (
        <div className="modal-backdrop" onClick={() => setRejectModalItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Decline Extra Water Request</h3>
                <p>Household: <strong>{rejectModalItem.requested_by}</strong> ({rejectModalItem.household_code || rejectModalItem.zone_name})</p>
              </div>
              <button className="btn-close" onClick={() => setRejectModalItem(null)}>×</button>
            </div>

            <div className="modal-body-pad">
              <label>
                Reason for Declining (will be visible to resident):
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{ marginTop: 8 }}
                >
                  <option value="Elevated Reservoir capacity reserved for essential shift">
                    Elevated Reservoir capacity reserved for essential shift
                  </option>
                  <option value="Elevation head loss in sector limits additional pipe pressure">
                    Elevation head loss in sector limits additional pipe pressure
                  </option>
                  <option value="Ward daily target quota already exceeded nominal threshold">
                    Ward daily target quota already exceeded nominal threshold
                  </option>
                  <option value="Please coordinate with Ward Water Inspector for tanker deployment">
                    Please coordinate with Ward Water Inspector for tanker deployment
                  </option>
                </select>
              </label>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-cancel" onClick={() => setRejectModalItem(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger-action"
                  onClick={handleConfirmReject}
                  disabled={processingId === rejectModalItem.id}
                >
                  <XCircle size={16} />
                  <span>{processingId === rejectModalItem.id ? 'Processing...' : 'Confirm Decline'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
