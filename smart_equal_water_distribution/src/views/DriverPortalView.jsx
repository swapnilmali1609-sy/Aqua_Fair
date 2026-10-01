import React, { useState, useEffect } from 'react';
import { 
  Truck, CheckCircle2, Clock, MapPin, AlertCircle, Phone, 
  ShieldCheck, Droplets, User, Navigation, FileText, Check, 
  RefreshCw, Fuel, Award, ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';

export default function DriverPortalView({ user }) {
  const [tankers, setTankers] = useState([]);
  const [filter, setFilter] = useState('active'); // 'active', 'delivered', 'all'
  const [loading, setLoading] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [deliveryNotes, setDeliveryNotes] = useState('Delivered full quota to community sump. Water distributed equally to all households.');
  const [submitting, setSubmitting] = useState(false);
  const [driverDutyStatus, setDriverDutyStatus] = useState('On Route');
  const [toastMessage, setToastMessage] = useState('');

  const driverName = user?.name?.replace(/\(.*\)/, '').trim() || 'Suresh Pawar';
  const vehicleNo = user?.vehicle_no || 'MH-12-AQ-204';
  const driverPhone = user?.phone || '9822334455';
  const licenseNo = user?.license_number || 'MH14-2018-009112';
  const isOfficer = !user || user?.role === 'Municipal Officer' || user?.role === 'Administrator' || user?.role?.includes('Officer');

  const loadData = async () => {
    setLoading(true);
    const data = await api.getTankers();
    if (data) {
      setTankers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleDispatched = () => loadData();
    window.addEventListener('aquafair_tanker_dispatched', handleDispatched);
    window.addEventListener('aquafair_tanker_delivered', handleDispatched);
    return () => {
      window.removeEventListener('aquafair_tanker_dispatched', handleDispatched);
      window.removeEventListener('aquafair_tanker_delivered', handleDispatched);
    };
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Filter trips: match this driver by name, or if unassigned / demo mode, show all relevant dispatches
  const driverTrips = tankers.filter(t => {
    const isAssigned = t.driver_name?.toLowerCase().includes(driverName.toLowerCase()) ||
                       driverName.toLowerCase().includes(t.driver_name?.toLowerCase()) ||
                       t.vehicle_no === vehicleNo;
    return isAssigned || tankers.length <= 4; // allow viewing all if filtered list is small
  });

  const activeTrips = driverTrips.filter(t => t.status === 'In Transit' || t.status === 'Scheduled');
  const deliveredTrips = driverTrips.filter(t => t.status === 'Delivered');

  const displayedTrips = filter === 'active' 
    ? activeTrips 
    : filter === 'delivered' 
      ? deliveredTrips 
      : driverTrips;

  const totalDeliveredLiters = deliveredTrips.reduce((acc, t) => acc + (t.capacity_liters || 0), 0);

  const handleOpenDeliveryModal = (trip) => {
    setSelectedTrip(trip);
    setDeliveryNotes(`Delivered full ${trip.capacity_liters?.toLocaleString() || 5000} L quota to ${trip.destination_location}. Sump filled to 100%, line pressure normal.`);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedTrip) return;
    setSubmitting(true);
    try {
      const res = await api.updateTankerStatus(selectedTrip.id, 'Delivered', { notes: deliveryNotes });
      if (res && (res.success || res.tanker)) {
        showToast(`✅ Trip ${selectedTrip.dispatch_code} marked as Delivered! Municipal Officer SCADA updated.`);
        setSelectedTrip(null);
        setDriverDutyStatus('Available');
        loadData();
      }
    } catch (err) {
      showToast('Error updating delivery status');
    }
    setSubmitting(false);
  };

  return (
    <div className="driver-portal-container">
      {/* Toast */}
      {toastMessage && (
        <div className="toast-notification" style={{ background: '#059669', color: '#fff' }}>
          {toastMessage}
        </div>
      )}

      {/* Driver Cockpit Header */}
      <section className="driver-cockpit-hero">
        <div className="driver-profile-info">
          <div className="driver-avatar-circle">
            <Truck size={32} />
          </div>
          <div>
            <div className="driver-badge-row">
              <span className="driver-duty-badge duty-on-route">
                <span className="live-dot" /> {driverDutyStatus}
              </span>
              <span className="driver-fleet-pill">
                🚛 Municipal Heavy Fleet: <strong>{vehicleNo}</strong>
              </span>
            </div>
            <h2>Fleet Driver: {driverName}</h2>
            <div className="driver-creds-meta">
              <span><strong>License:</strong> {licenseNo}</span>
              <span>•</span>
              <span><strong>Contact:</strong> {driverPhone}</span>
              <span>•</span>
              <span><strong>Depot:</strong> Central Fleet Depot Bay 3</span>
            </div>
          </div>
        </div>

        <div className="driver-actions-panel">
          <button 
            className="btn-status-toggle"
            onClick={() => setDriverDutyStatus(prev => prev === 'Available' ? 'On Route' : 'Available')}
            title="Toggle driver standby/route status"
          >
            <RefreshCw size={14} />
            <span>Set {driverDutyStatus === 'Available' ? 'On Route' : 'Available on Duty'}</span>
          </button>
          <a href="tel:02027451234" className="btn-call-desk">
            <Phone size={14} />
            <span>Call Municipal SCADA Desk</span>
          </a>
        </div>
      </section>

      {/* Key Metric KPI Cards */}
      <div className="stats-row" style={{ marginTop: '16px' }}>
        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
              <Navigation size={20} />
            </div>
            <span className="stat-trend trend-positive">Assigned Roster</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Active Water Dispatches</span>
            <div className="stat-number">{activeTrips.length} <small>Trips on Route</small></div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <CheckCircle2 size={20} />
            </div>
            <span className="stat-trend trend-positive">Target Complete</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Delivered & Sumps Filled</span>
            <div className="stat-number">{deliveredTrips.length} <small>Successful</small></div>
          </div>
        </div>

        <div className="stat-card-modern">
          <div className="stat-card-top">
            <div className="stat-icon-wrap" style={{ background: '#f0fdfa', color: '#0d9488' }}>
              <Droplets size={20} />
            </div>
            <span className="stat-trend trend-positive">Potable Supply</span>
          </div>
          <div className="stat-meta">
            <span className="stat-label">Emergency Potable Water Delivered</span>
            <div className="stat-number">{totalDeliveredLiters.toLocaleString()} <small>Liters</small></div>
          </div>
        </div>
      </div>

      {/* Main Trip Dispatches Console */}
      <div className="panel-container" style={{ marginTop: '20px' }}>
        <div className="panel-header">
          <div>
            <h3>Assigned Water Tanker Requests & Field Locations</h3>
            <p>Live navigation route, reported pressure deficits, and sump filling verification</p>
          </div>
          <div className="tab-filters-row">
            <button 
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active Trips ({activeTrips.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`}
              onClick={() => setFilter('delivered')}
            >
              Delivered ({deliveredTrips.length})
            </button>
            <button 
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All Requests ({driverTrips.length})
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto 8px' }} />
            <p>Loading assigned tanker dispatches...</p>
          </div>
        ) : displayedTrips.length === 0 ? (
          <div className="empty-trips-state">
            <CheckCircle2 size={40} style={{ color: '#059669', marginBottom: '8px' }} />
            <h4>No {filter === 'active' ? 'Active' : ''} Dispatches Pending</h4>
            <p>All scheduled water tanker deliveries for your vehicle have been fulfilled. Standby for new emergency requests from Municipal Officers.</p>
          </div>
        ) : (
          <div className="trips-cards-list">
            {displayedTrips.map(trip => {
              const isDelivered = trip.status === 'Delivered';
              return (
                <div key={trip.id} className={`trip-card-item ${isDelivered ? 'card-delivered' : 'card-in-transit'}`}>
                  <div className="trip-card-top">
                    <div className="trip-code-badge">
                      <Truck size={16} />
                      <strong>{trip.dispatch_code}</strong>
                      <span className="vehicle-pill">{trip.vehicle_no}</span>
                    </div>
                    <span className={`status-pill status-${trip.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {trip.status}
                    </span>
                  </div>

                  <div className="trip-grid-content">
                    {/* Location & Ward */}
                    <div className="trip-detail-col">
                      <span className="col-label"><MapPin size={13} /> Destination & Ward</span>
                      <strong className="trip-loc-title">{trip.destination_location}</strong>
                      <span className="trip-ward-tag">{trip.target_ward_name || `Ward ${trip.target_ward_number}`}</span>
                    </div>

                    {/* Problem / Purpose */}
                    <div className="trip-detail-col">
                      <span className="col-label"><AlertCircle size={13} /> Reported Problem & Purpose</span>
                      <p className="trip-purpose-text">{trip.purpose || 'Emergency potable distribution'}</p>
                      <span className="requester-text">Requested by: <strong>{trip.requester_name || 'Municipal Desk'}</strong></span>
                    </div>

                    {/* Capacity & Crew */}
                    <div className="trip-detail-col">
                      <span className="col-label"><Droplets size={13} /> Water Capacity & Accompanying Crew</span>
                      <strong className="trip-capacity-val">{trip.capacity_liters?.toLocaleString()} Liters</strong>
                      <span className="crew-members-tag">
                        Crew: {trip.team_members || 'Assigned Valve Attendant'}
                      </span>
                    </div>
                  </div>

                  {/* Trip Footer / Action Area */}
                  <div className="trip-card-footer">
                    <div className="trip-timestamps">
                      <Clock size={13} />
                      <span>
                        Departure: {new Date(trip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {trip.delivered_at && ` • Delivered: ${new Date(trip.delivered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    </div>

                    {isOfficer ? (
                      <div className="driver-supervisor-pill">
                        <Truck size={13} className={trip.status === 'In Transit' ? 'spin-slow' : ''} />
                        <span>{isDelivered ? 'Delivery Complete • Sump Filled' : trip.status === 'In Transit' ? 'Tanker In Transit (GPS Active)' : 'Scheduled at Central Station'}</span>
                      </div>
                    ) : !isDelivered ? (
                      <button 
                        className="btn-mark-delivered"
                        onClick={() => handleOpenDeliveryModal(trip)}
                      >
                        <Check size={16} />
                        <span>Mark Water Delivered & Sump Filled</span>
                      </button>
                    ) : (
                      <div className="delivery-confirmed-chip">
                        <CheckCircle2 size={16} />
                        <span>Water Delivered & Sump Filled (Directly Synced to Officer SCADA)</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delivery Confirmation Modal */}
      {selectedTrip && !isOfficer && (
        <div className="modal-backdrop" onClick={() => setSelectedTrip(null)}>
          <div className="modal-dialog-modern" onClick={e => e.stopPropagation()}>
            <div className="modal-header-modern">
              <div className="header-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h3>Confirm Water Delivery & Sump Fill</h3>
                <p>Trip [{selectedTrip.dispatch_code}] • {selectedTrip.vehicle_no}</p>
              </div>
            </div>

            <div className="modal-body-modern">
              <div className="summary-fill-box">
                <div className="fill-item">
                  <span>Destination:</span>
                  <strong>{selectedTrip.destination_location}</strong>
                </div>
                <div className="fill-item">
                  <span>Ward:</span>
                  <strong>{selectedTrip.target_ward_name}</strong>
                </div>
                <div className="fill-item">
                  <span>Volume Delivered:</span>
                  <strong style={{ color: '#059669' }}>{selectedTrip.capacity_liters?.toLocaleString()} Liters</strong>
                </div>
                <div className="fill-item">
                  <span>Accompanying Crew:</span>
                  <span>{selectedTrip.team_members || 'Field Crew'}</span>
                </div>
              </div>

              <label className="form-label" style={{ marginTop: '14px', display: 'block' }}>
                Delivery Remarks / Sump Status:
                <textarea
                  rows={3}
                  className="modern-textarea"
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Sump filled to 100% capacity. Water test normal. Resident receipt confirmed."
                />
              </label>

              <div className="officer-sync-notice">
                <ShieldCheck size={16} style={{ color: '#059669' }} />
                <span>
                  Marking this delivery will <strong>instantly update the Nagar Parishad Municipal Officer's Dashboard</strong>, release your tanker back to available status, and log the delivery for municipal audit.
                </span>
              </div>
            </div>

            <div className="modal-actions-modern">
              <button 
                type="button" 
                className="btn-modal-cancel" 
                onClick={() => setSelectedTrip(null)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-modal-confirm-green"
                onClick={handleConfirmDelivery}
                disabled={submitting}
              >
                {submitting ? 'Updating Officer SCADA...' : 'Confirm Sump Filled & Complete Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
