import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Building2,
  Phone,
  MapPin,
  Send,
  UserCheck,
  Plus,
  X,
  Droplet,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  Users,
  UserPlus,
  Shield,
  Award,
  Fuel,
  Check,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import { api } from '../services/api';

export default function GrievancesView({ zones = [], user }) {
  const [activeTab, setActiveTab] = useState('grievances'); // 'grievances' | 'tankers'
  const [tankerSubTab, setTankerSubTab] = useState('dispatches'); // 'dispatches' | 'fleet' | 'drivers' | 'team'
  const [grievances, setGrievances] = useState([]);
  const [tankers, setTankers] = useState([]);
  const [fleetTankers, setFleetTankers] = useState([]);
  const [fleetDrivers, setFleetDrivers] = useState([]);
  const [dispatchTeam, setDispatchTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const isOfficer = !user || user?.role === 'Municipal Officer' || user?.role === 'Administrator' || user?.role?.includes('Officer');

  // Grievance filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [dispatchModalItem, setDispatchModalItem] = useState(null);
  const [dispatchForm, setDispatchForm] = useState({
    technician: 'Rajesh Shinde (Lead Line Inspector)',
    eta_minutes: 30
  });


  // Tanker Dispatch Form
  const [showTankerModal, setShowTankerModal] = useState(false);
  const [tankerForm, setTankerForm] = useState({
    target_ward_id: zones[0]?.id || 1,
    destination_location: '',
    requester_name: '',
    capacity_liters: 5000,
    vehicle_no: 'MH-12-AQ-105',
    driver_name: 'Suresh Pawar',
    driver_phone: '9822334455',
    fleet_tanker: null,
    fleet_driver: null,
    purpose: 'Pipeline maintenance shutdown emergency reserve',
    team_members: ['Ganesh Shinde (Valve Technician)'],
    custom_crew_notes: ''
  });

  // Modal 4: Add New Fleet Tanker
  const [showAddTankerModal, setShowAddTankerModal] = useState(false);
  const [addTankerForm, setAddTankerForm] = useState({
    vehicle_no: '',
    tanker_name: '',
    capacity_liters: 5000,
    model_make: 'Tata 1613 SE',
    ownership_type: 'Municipal Owned',
    status: 'Available',
    gps_tracking_id: '',
    notes: ''
  });

  // Modal 5: Add New Driver
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [addDriverForm, setAddDriverForm] = useState({
    name: '',
    phone: '',
    license_number: '',
    experience_years: 5,
    emergency_contact: '',
    status: 'Available',
    notes: ''
  });

  // Modal 6: Add New Dispatch Team Member
  const [showAddCrewModal, setShowAddCrewModal] = useState(false);
  const [addCrewForm, setAddCrewForm] = useState({
    name: '',
    role: 'Valve Technician',
    phone: '',
    badge_id: '',
    ward_assignment: 'All Wards',
    status: 'Active',
    notes: ''
  });

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [grvData, tnkData, ftData, fdData, dtData] = await Promise.all([
        api.getGrievances(),
        api.getTankers(),
        api.getFleetTankers(),
        api.getFleetDrivers(),
        api.getDispatchTeam()
      ]);
      setGrievances(grvData || []);
      setTankers(tnkData || []);
      setFleetTankers(ftData || []);
      setFleetDrivers(fdData || []);
      setDispatchTeam(dtData || []);
    } catch {
      setGrievances([]);
      setTankers([]);
      setFleetTankers([]);
      setFleetDrivers([]);
      setDispatchTeam([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showFeedback = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  // Filtered grievances
  const filteredGrievances = grievances.filter(g => {
    if (statusFilter !== 'all' && g.status?.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (wardFilter !== 'all') {
      const targetZone = zones.find(z => String(z.id) === String(wardFilter) || String(z.ward_number) === String(wardFilter));
      const wNum = targetZone ? targetZone.ward_number : wardFilter;
      const zId = targetZone ? targetZone.id : wardFilter;
      const match =
        String(g.ward_id) === String(zId) ||
        String(g.ward_number) === String(wNum) ||
        (g.ward_name && g.ward_name.toLowerCase().includes(`ward ${wNum}`));
      if (!match) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = g.citizen_name?.toLowerCase().includes(q);
      const matchCode = g.ticket_code?.toLowerCase().includes(q);
      const matchType = g.incident_type?.toLowerCase().includes(q);
      const matchLoc = g.location?.toLowerCase().includes(q);
      const matchPhone = g.phone?.includes(q);
      if (!matchName && !matchCode && !matchType && !matchLoc && !matchPhone) return false;
    }
    return true;
  });

  // Action: Dispatch Field Crew
  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchModalItem) return;
    const res = await api.dispatchGrievanceTeam(dispatchModalItem.id, dispatchForm);
    if (res.success) {
      showFeedback(`Repair Crew "${dispatchForm.technician}" dispatched to Ticket #${dispatchModalItem.ticket_code}! ETA: ${dispatchForm.eta_minutes} mins.`);
      setDispatchModalItem(null);
      loadData();
    }
  };


  // Authority Selection Helpers
  const handleSelectFleetTanker = (val) => {
    if (val === 'custom') {
      setTankerForm(prev => ({ ...prev, fleet_tanker: null }));
    } else {
      const t = fleetTankers.find(item => String(item.id) === String(val) || item.vehicle_no === val);
      if (t) {
        setTankerForm(prev => ({
          ...prev,
          fleet_tanker: t.id,
          vehicle_no: t.vehicle_no,
          capacity_liters: Number(t.capacity_liters) || 5000
        }));
      }
    }
  };

  const handleSelectFleetDriver = (val) => {
    if (val === 'custom') {
      setTankerForm(prev => ({ ...prev, fleet_driver: null }));
    } else {
      const d = fleetDrivers.find(item => String(item.id) === String(val) || item.name === val);
      if (d) {
        setTankerForm(prev => ({
          ...prev,
          fleet_driver: d.id,
          driver_name: d.name,
          driver_phone: d.phone
        }));
      }
    }
  };

  const handleToggleCrewMember = (memberString) => {
    setTankerForm(prev => {
      const current = prev.team_members || [];
      const exists = current.includes(memberString);
      const updated = exists 
        ? current.filter(m => m !== memberString) 
        : [...current, memberString];
      return { ...prev, team_members: updated };
    });
  };

  // Quick Dispatch Helpers from Registry Tabs
  const handleQuickDispatchTanker = (tanker) => {
    setTankerForm(prev => ({
      ...prev,
      fleet_tanker: tanker.id,
      vehicle_no: tanker.vehicle_no,
      capacity_liters: tanker.capacity_liters
    }));
    setShowTankerModal(true);
  };

  const handleQuickDispatchDriver = (driver) => {
    setTankerForm(prev => ({
      ...prev,
      fleet_driver: driver.id,
      driver_name: driver.name,
      driver_phone: driver.phone
    }));
    setShowTankerModal(true);
  };

  // Action: Dispatch Tanker
  const handleCreateTankerDispatch = async (e) => {
    e.preventDefault();
    const targetWard = zones.find(z => String(z.id) === String(tankerForm.target_ward_id)) || zones[0] || { id: 1, ward_number: 1, name: 'Ward 1 - Shivaji Nagar' };

    // Combine structured crew tags and custom notes
    const crewList = [...(tankerForm.team_members || [])];
    if (tankerForm.custom_crew_notes?.trim()) {
      crewList.push(tankerForm.custom_crew_notes.trim());
    }
    const finalCrewString = crewList.filter(Boolean).join(', ');

    const payload = {
      ...tankerForm,
      team_members: finalCrewString,
      target_ward_id: targetWard.id,
      target_ward_number: targetWard.ward_number || 1,
      target_ward_name: targetWard.name
    };

    const res = await api.dispatchTanker(payload);
    if (res.success) {
      showFeedback(`🚚 Tanker ${res.tanker.vehicle_no} dispatched to ${targetWard.name}! Driver: ${res.tanker.driver_name} (${res.tanker.driver_phone}). Crew: ${finalCrewString || 'Standard Municipal Team'}. Live alert broadcast to all households of ${targetWard.name}.`);
      setShowTankerModal(false);
      loadData();
    }
  };

  // Action: Add New Fleet Tanker
  const handleCreateFleetTanker = async (e) => {
    e.preventDefault();
    if (!addTankerForm.vehicle_no) return;
    const res = await api.createFleetTanker(addTankerForm);
    if (res.success) {
      showFeedback(`Tanker ${res.tanker.vehicle_no} (${res.tanker.tanker_name}) added to Municipal Fleet!`);
      setShowAddTankerModal(false);
      setAddTankerForm({
        vehicle_no: '',
        tanker_name: '',
        capacity_liters: 5000,
        model_make: 'Tata 1613 SE',
        ownership_type: 'Municipal Owned',
        status: 'Available',
        gps_tracking_id: '',
        notes: ''
      });
      loadData();
    }
  };

  // Action: Add New Certified Driver
  const handleCreateFleetDriver = async (e) => {
    e.preventDefault();
    if (!addDriverForm.name || !addDriverForm.phone) return;
    const res = await api.createFleetDriver(addDriverForm);
    if (res.success) {
      showFeedback(`Driver ${res.driver.name} (Lic: ${res.driver.license_number}) certified and registered!`);
      setShowAddDriverModal(false);
      setAddDriverForm({
        name: '',
        phone: '',
        license_number: '',
        experience_years: 5,
        emergency_contact: '',
        status: 'Available',
        notes: ''
      });
      loadData();
    }
  };

  // Action: Add New Crew Member
  const handleCreateCrewMember = async (e) => {
    e.preventDefault();
    if (!addCrewForm.name || !addCrewForm.phone) return;
    const res = await api.createDispatchTeamMember(addCrewForm);
    if (res.success) {
      showFeedback(`Field Crew Member ${res.member.name} (${res.member.role}) registered!`);
      setShowAddCrewModal(false);
      setAddCrewForm({
        name: '',
        role: 'Valve Technician',
        phone: '',
        badge_id: '',
        ward_assignment: 'All Wards',
        status: 'Active',
        notes: ''
      });
      loadData();
    }
  };

  // Action: Update Tanker Status
  const handleUpdateTankerStatus = async (id, status) => {
    const res = await api.updateTankerStatus(id, status);
    if (res.success) {
      showFeedback(`Tanker status updated to "${status}". Fleet asset released back to available standby.`);
      loadData();
    }
  };

  // Summary counts
  const pendingGrievances = grievances.filter(g => g.status === 'Pending Investigation').length;
  const dispatchedGrievances = grievances.filter(g => g.status === 'Field Team Dispatched' || g.status === 'In Progress').length;
  const resolvedGrievances = grievances.filter(g => g.status === 'Resolved').length;

  const activeTankers = tankers.filter(t => t.status === 'In Transit').length;
  const deliveredTankers = tankers.filter(t => t.status === 'Delivered').length;
  const totalLitersTankered = tankers
    .filter(t => t.status === 'Delivered' || t.status === 'In Transit')
    .reduce((sum, t) => sum + (Number(t.capacity_liters) || 0), 0);

  return (
    <div className="view-container">
      {/* Officer Header Card */}
      <div className="demands-hero-card">
        <div className="demands-hero-content">
          <div className="badge-officer-desk">
            <Building2 size={16} />
            <span>Municipal Field Operations & Logistics</span>
          </div>
          <h2>Grievances & Fleet Operations</h2>
          <p>
            Field dispatch operations, citizen grievance redressal, and emergency potable tanker logistics.
          </p>
        </div>

        <div className="demands-summary-counters">
          <div className={`counter-box ${pendingGrievances > 0 ? 'highlight-pending' : ''}`}>
            <span className="counter-label">Pending Complaints</span>
            <strong className="counter-val">{pendingGrievances}</strong>
            <span className="counter-sub">Action required</span>
          </div>
          <div className="counter-box">
            <span className="counter-label">Crews Dispatched</span>
            <strong className="counter-val text-amber">{dispatchedGrievances}</strong>
            <span className="counter-sub">Active repairs</span>
          </div>
          <div className="counter-box">
            <span className="counter-label">Active Tankers</span>
            <strong className="counter-val text-cyan">{activeTankers}</strong>
            <span className="counter-sub">{totalLitersTankered.toLocaleString()} L en route</span>
          </div>
          <div className="counter-box">
            <span className="counter-label">Resolved</span>
            <strong className="counter-val text-emerald">{resolvedGrievances}</strong>
            <span className="counter-sub">45 min avg turnaround</span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="grievance-tabs-bar">
        <button
          className={`grievance-tab-btn ${activeTab === 'grievances' ? 'active' : ''}`}
          onClick={() => setActiveTab('grievances')}
        >
          <Wrench size={16} />
          <span>Citizen Grievance Desk</span>
          <span className="tab-pill-badge">{grievances.length}</span>
        </button>

        <button
          className={`grievance-tab-btn ${activeTab === 'tankers' ? 'active' : ''}`}
          onClick={() => setActiveTab('tankers')}
        >
          <Truck size={16} />
          <span>Emergency Tanker Fleet</span>
          <span className="tab-pill-badge">{tankers.length}</span>
        </button>
      </div>

      {/* ================= TAB 1: CITIZEN GRIEVANCE REDRESSAL DESK ================= */}
      {activeTab === 'grievances' && (
        <div className="grievances-section">
          {/* Operational Telemetry Banner */}
          <div className="telemetry-desk-banner">
            <ShieldCheck size={18} className="text-teal" style={{ flexShrink: 0 }} />
            <div>
              <strong>Municipal Grievance Telemetry Desk</strong>
              <span>Citizen incident reporting, automated priority tracking, and line repair crew deployment.</span>
            </div>
          </div>

          {/* Toolbar */}
          <div className="demands-toolbar">
            <div className="status-tabs-row">
              {[
                { id: 'all', label: 'All Complaints', count: grievances.length },
                { id: 'Pending Investigation', label: 'Pending Action', count: pendingGrievances, isAlert: pendingGrievances > 0 },
                { id: 'Field Team Dispatched', label: 'Crews Dispatched', count: grievances.filter(g => g.status === 'Field Team Dispatched').length },
                { id: 'In Progress', label: 'In Progress', count: grievances.filter(g => g.status === 'In Progress').length },
                { id: 'Resolved', label: 'Resolved', count: resolvedGrievances }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`status-tab-btn ${statusFilter === tab.id ? 'active' : ''} ${tab.isAlert ? 'tab-alert' : ''}`}
                  onClick={() => setStatusFilter(tab.id)}
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
                  placeholder="Search by resident, ticket #, phone, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-ward-select">
                <Filter size={15} />
                <select value={wardFilter} onChange={(e) => setWardFilter(e.target.value)}>
                  <option value="all">All Municipal Wards</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.ward_number || z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grievances List */}
          <div className="grievance-cards-grid">
            {filteredGrievances.length === 0 ? (
              <div className="empty-demands-state">
                <CheckCircle2 size={48} className="text-emerald" />
                <h3>No Complaints in Queue</h3>
                <p>
                  {statusFilter === 'Pending Investigation'
                    ? 'All registered citizen grievances have been reviewed and dispatched. Excellent municipal turnaround!'
                    : 'No grievance records match the selected filter criteria.'}
                </p>
              </div>
            ) : (
              filteredGrievances.map((g) => {
                const isPending = g.status === 'Pending Investigation';
                const isDispatched = g.status === 'Field Team Dispatched';
                const isInProgress = g.status === 'In Progress';
                const isResolved = g.status === 'Resolved';

                return (
                  <div
                    key={g.id}
                    className={`grievance-card ${isPending ? 'border-pending' : isResolved ? 'border-approved' : 'border-dispatched'}`}
                  >
                    <div className="grievance-card-header">
                      <div className="grievance-user-identity">
                        <div className="grievance-ticket-badge">
                          {g.ticket_code}
                        </div>
                        <div>
                          <div className="grievance-name-row">
                            <strong>{g.citizen_name}</strong>
                            {g.phone && (
                              <span className="grievance-phone-tag">
                                <Phone size={11} style={{ display: 'inline', marginRight: 3 }} />
                                {g.phone}
                              </span>
                            )}
                          </div>
                          <span className="grievance-ward-name">
                            <Building2 size={13} /> {g.ward_name || `Ward ${g.ward_id}`}
                          </span>
                        </div>
                      </div>

                      <div className="grievance-badges-group">
                        <span className={`urgency-badge urgency-${(g.priority || 'Normal').toLowerCase()}`}>
                          {g.priority || 'Normal'}
                        </span>
                        <span className={`status-pill-badge status-${(g.status || '').toLowerCase().replace(/\s+/g, '-')}`}>
                          {isPending && <Clock size={12} className="spin-slow" />}
                          {isDispatched && <Wrench size={12} />}
                          {isInProgress && <UserCheck size={12} />}
                          {isResolved && <CheckCircle2 size={12} />}
                          <span>{g.status}</span>
                        </span>
                      </div>
                    </div>

                    <div className="grievance-card-body">
                      <div className="grievance-type-row">
                        <AlertTriangle size={16} className="text-amber" />
                        <strong>{g.incident_type}</strong>
                      </div>

                      <div className="grievance-location-box">
                        <MapPin size={13} className="text-teal" />
                        <span>{g.location}</span>
                      </div>

                      <p className="grievance-desc-text">{g.description}</p>

                      {g.assigned_technician && g.assigned_technician !== 'Unassigned' && (
                        <div className="grievance-assigned-box">
                          <UserCheck size={14} className="text-teal" />
                          <span>
                            <strong>Assigned:</strong> {g.assigned_technician}
                            {g.eta_minutes ? ` (ETA: ~${g.eta_minutes} mins)` : ''}
                          </span>
                        </div>
                      )}

                      {g.resolution_notes && (
                        <div className="grievance-resolution-box">
                          <CheckCircle2 size={14} className="text-emerald" />
                          <div>
                            <strong>Official Closure Note:</strong>
                            <p>{g.resolution_notes}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grievance-card-footer">
                      <span className="grievance-time-meta">
                        <Calendar size={13} />
                        {new Date(g.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>

                      <div className="grievance-actions">
                        {isPending && (
                          <button
                            className="btn-dispatch-team"
                            onClick={() => {
                              setDispatchModalItem(g);
                              setDispatchForm({
                                technician: 'Rajesh Shinde (Lead Line Inspector)',
                                eta_minutes: 30
                              });
                            }}
                          >
                            <Wrench size={14} />
                            <span>Dispatch Line Team</span>
                          </button>
                        )}

                        {(isDispatched || isInProgress) && (
                          <div className="telemetry-badge-active" title={`Field squad deployed: ${g.assigned_technician || 'Line Crew'}`}>
                            <Wrench size={13} className="spin-slow" />
                            <span>Field Squad Active • {g.assigned_technician || 'Technician Squad'}</span>
                          </div>
                        )}

                        {isResolved && (
                          <div className="telemetry-badge-resolved">
                            <CheckCircle2 size={13} />
                            <span>Resolved & Restored ({g.assigned_technician || 'Field Squad'})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: EMERGENCY MUNICIPAL WATER TANKER LOGISTICS ================= */}
      {activeTab === 'tankers' && (
        <div className="tankers-section">
          {/* Operational Telemetry Banner */}
          <div className="telemetry-desk-banner tanker-banner">
            <Truck size={18} className="text-cyan" style={{ flexShrink: 0 }} />
            <div>
              <strong>Municipal Emergency Potable Tanker Logistics</strong>
              <span>Officer Authority Console: Authorize emergency dispatches, assign registered fleet bowsers & certified drivers, and track real-time delivery telemetry.</span>
            </div>
          </div>

          {/* Subtab Navigation Bar */}
          <div className="fleet-subtabs-bar">
            <button 
              className={`fleet-subtab-btn ${tankerSubTab === 'dispatches' ? 'active' : ''}`}
              onClick={() => setTankerSubTab('dispatches')}
            >
              <Truck size={16} />
              <span>Active Dispatches & Trips</span>
              <span className="fleet-subtab-badge">{tankers.length}</span>
            </button>
            <button 
              className={`fleet-subtab-btn ${tankerSubTab === 'tankers' ? 'active' : ''}`}
              onClick={() => setTankerSubTab('tankers')}
            >
              <Fuel size={16} />
              <span>Municipal Tankers Fleet</span>
              <span className="fleet-subtab-badge">{fleetTankers.length}</span>
            </button>
            <button 
              className={`fleet-subtab-btn ${tankerSubTab === 'drivers' ? 'active' : ''}`}
              onClick={() => setTankerSubTab('drivers')}
            >
              <UserCheck size={16} />
              <span>Certified Drivers Registry</span>
              <span className="fleet-subtab-badge">{fleetDrivers.length}</span>
            </button>
            <button 
              className={`fleet-subtab-btn ${tankerSubTab === 'team' ? 'active' : ''}`}
              onClick={() => setTankerSubTab('team')}
            >
              <Users size={16} />
              <span>Dispatch Field Crew</span>
              <span className="fleet-subtab-badge">{dispatchTeam.length}</span>
            </button>
          </div>

          {/* SUBTAB 1: ACTIVE DISPATCHES & TRIPS */}
          {tankerSubTab === 'dispatches' && (
            <div>
              <div className="tankers-action-bar">
                <div>
                  <h3>Municipal Emergency Tanker Fleet Operations</h3>
                  <p>Officer Authority Console: Select registered fleet tanker, assign authorized driver, and dispatch accompanying crew</p>
                </div>
                <button className="btn-dispatch-tanker-primary" onClick={() => setShowTankerModal(true)}>
                  <Plus size={16} />
                  <span>+ Dispatch Emergency Tanker</span>
                </button>
              </div>

              <div className="panel-container">
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Dispatch Code</th>
                        <th>Tanker Vehicle</th>
                        <th>Driver & Mobile</th>
                        <th>Accompanying Field Crew</th>
                        <th>Target Ward & Destination</th>
                        <th>Capacity</th>
                        <th>Status</th>
                        <th>Live Delivery Tracking</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tankers.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                            No emergency tankers currently deployed. Central pipeline grid operating under equilibrium.
                          </td>
                        </tr>
                      ) : (
                        tankers.map(tanker => {
                          const isInTransit = tanker.status === 'In Transit';
                          const isDelivered = tanker.status === 'Delivered';
                          const isScheduled = tanker.status === 'Scheduled';

                          return (
                            <tr key={tanker.id}>
                              <td>
                                <strong className="text-teal">{tanker.dispatch_code}</strong>
                              </td>
                              <td>
                                <span className="vehicle-plate-pill">{tanker.vehicle_no}</span>
                              </td>
                              <td>
                                <div>
                                  <strong>{tanker.driver_name}</strong>
                                  <br />
                                  <a href={`tel:${tanker.driver_phone}`} className="tanker-phone-btn">
                                    <PhoneCall size={11} /> {tanker.driver_phone}
                                  </a>
                                </div>
                              </td>
                              <td>
                                {tanker.team_members ? (
                                  <span style={{ fontSize: '12px', color: '#4338ca', fontWeight: 600 }}>
                                    👥 {tanker.team_members}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Municipal Standby Crew</span>
                                )}
                              </td>
                              <td>
                                <div className="tanker-dest-cell">
                                  <strong>{tanker.target_ward_name}</strong>
                                  <small style={{ color: '#0f766e', display: 'block' }}>
                                    <MapPin size={11} style={{ display: 'inline', marginRight: 2 }} />
                                    {tanker.destination_location}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <strong className="text-cyan">
                                  {Number(tanker.capacity_liters).toLocaleString()} <small>L</small>
                                </strong>
                              </td>
                              <td>
                                <span className={`status-pill-badge status-${tanker.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                                  {isInTransit && <Truck size={12} className="spin-slow" />}
                                  {isDelivered && <CheckCircle2 size={12} />}
                                  {isScheduled && <Clock size={12} />}
                                  <span>{tanker.status}</span>
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                  {isInTransit && (
                                    <span className="telemetry-tracking-pill transit" title="Tanker is en route with live GPS telemetry">
                                      <Truck size={12} className="spin-slow" />
                                      <span>En Route • GPS Active</span>
                                    </span>
                                  )}
                                  {isScheduled && (
                                    <span className="telemetry-tracking-pill scheduled" title="Tanker is staged at central reservoir">
                                      <Clock size={12} />
                                      <span>Scheduled at Headworks</span>
                                    </span>
                                  )}
                                  {isDelivered && (
                                    <span className="telemetry-tracking-pill delivered" title="Delivered and verified by driver">
                                      <CheckCircle2 size={13} />
                                      <span>Delivered by Driver ({tanker.driver_name})</span>
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 2: MUNICIPAL TANKERS FLEET REGISTRY */}
          {tankerSubTab === 'tankers' && (
            <div>
              <div className="tankers-action-bar">
                <div>
                  <h3>Municipal Water Tankers Fleet Registry</h3>
                  <p>Register and manage municipal owned and contractor leased water tankers, capacities, and GPS tracking</p>
                </div>
                <button className="btn-dispatch-tanker-primary" onClick={() => setShowAddTankerModal(true)}>
                  <Plus size={16} />
                  <span>+ Register New Fleet Tanker</span>
                </button>
              </div>

              <div className="panel-container">
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Vehicle Number</th>
                        <th>Tanker Name & Model</th>
                        <th>Volume Capacity</th>
                        <th>Ownership Type</th>
                        <th>GPS Device ID</th>
                        <th>Current Status</th>
                        <th>Authority Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fleetTankers.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                            No fleet tankers registered in municipal fleet yet.
                          </td>
                        </tr>
                      ) : (
                        fleetTankers.map(tanker => {
                          const isAvailable = tanker.status === 'Available';
                          const isInTransit = tanker.status === 'In Transit';

                          return (
                            <tr key={tanker.id}>
                              <td>
                                <strong className="vehicle-plate-pill">{tanker.vehicle_no}</strong>
                              </td>
                              <td>
                                <div>
                                  <strong>{tanker.tanker_name}</strong>
                                  <small style={{ color: '#64748b', display: 'block' }}>{tanker.model_make}</small>
                                </div>
                              </td>
                              <td>
                                <strong className="text-cyan">{Number(tanker.capacity_liters).toLocaleString()} L</strong>
                              </td>
                              <td>
                                <span className={tanker.ownership_type === 'Municipal Owned' ? 'badge-ownership-municipal' : 'badge-ownership-leased'}>
                                  {tanker.ownership_type}
                                </span>
                              </td>
                              <td>
                                <span className="badge-badge-id">{tanker.gps_tracking_id || 'GPS-N/A'}</span>
                              </td>
                              <td>
                                <span className={
                                  isAvailable ? 'badge-status-available' :
                                  isInTransit ? 'badge-status-intransit' : 'badge-status-maintenance'
                                }>
                                  {isAvailable && <CheckCircle2 size={12} />}
                                  {isInTransit && <Truck size={12} className="spin-slow" />}
                                  <span>{tanker.status}</span>
                                </span>
                              </td>
                              <td>
                                {isAvailable ? (
                                  <button 
                                    className="btn-quick-dispatch-sm"
                                    onClick={() => handleQuickDispatchTanker(tanker)}
                                  >
                                    <Send size={12} /> Dispatch This Tanker
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>Currently Active</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: CERTIFIED DRIVERS REGISTRY */}
          {tankerSubTab === 'drivers' && (
            <div>
              <div className="tankers-action-bar">
                <div>
                  <h3>Certified Water Tanker Drivers Registry</h3>
                  <p>Certified municipal and emergency relief heavy-duty vehicle drivers roster</p>
                </div>
                <button className="btn-dispatch-tanker-primary" onClick={() => setShowAddDriverModal(true)}>
                  <Plus size={16} />
                  <span>+ Register Certified Driver</span>
                </button>
              </div>

              <div className="panel-container">
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Driver Full Name</th>
                        <th>Mobile Contact</th>
                        <th>Commercial License Number</th>
                        <th>Experience</th>
                        <th>Emergency Contact</th>
                        <th>Duty Status</th>
                        <th>Authority Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fleetDrivers.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                            No certified drivers registered yet.
                          </td>
                        </tr>
                      ) : (
                        fleetDrivers.map(driver => {
                          const isAvailable = driver.status === 'Available';
                          const isOnRoute = driver.status === 'On Route';

                          return (
                            <tr key={driver.id}>
                              <td>
                                <strong>{driver.name}</strong>
                              </td>
                              <td>
                                <a href={`tel:${driver.phone}`} className="tanker-phone-btn">
                                  <PhoneCall size={12} /> {driver.phone}
                                </a>
                              </td>
                              <td>
                                <span className="badge-badge-id">{driver.license_number}</span>
                              </td>
                              <td>
                                <span>{driver.experience_years} Years</span>
                              </td>
                              <td>
                                <small style={{ color: '#64748b' }}>{driver.emergency_contact || 'None Logged'}</small>
                              </td>
                              <td>
                                <span className={
                                  isAvailable ? 'badge-status-available' :
                                  isOnRoute ? 'badge-status-intransit' : 'badge-status-maintenance'
                                }>
                                  {isAvailable && <CheckCircle2 size={12} />}
                                  {isOnRoute && <Truck size={12} className="spin-slow" />}
                                  <span>{driver.status}</span>
                                </span>
                              </td>
                              <td>
                                {isAvailable ? (
                                  <button 
                                    className="btn-quick-dispatch-sm"
                                    onClick={() => handleQuickDispatchDriver(driver)}
                                  >
                                    <Send size={12} /> Assign & Dispatch
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#64748b' }}>On Active Trip</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 4: DISPATCH FIELD CREW */}
          {tankerSubTab === 'team' && (
            <div>
              <div className="tankers-action-bar">
                <div>
                  <h3>Municipal Dispatch Field Crew & Valve Technicians</h3>
                  <p>Escort personnel, valve technicians, inspectors, and chlorination staff accompanying tanker distributions</p>
                </div>
                <button className="btn-dispatch-tanker-primary" onClick={() => setShowAddCrewModal(true)}>
                  <Plus size={16} />
                  <span>+ Add Field Crew Member</span>
                </button>
              </div>

              <div className="panel-container">
                <div className="table-responsive">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Staff Full Name</th>
                        <th>Designation / Role</th>
                        <th>Mobile Contact</th>
                        <th>Municipal Badge ID</th>
                        <th>Ward Allocation</th>
                        <th>Duty Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dispatchTeam.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                            No dispatch team members registered yet.
                          </td>
                        </tr>
                      ) : (
                        dispatchTeam.map(member => {
                          const isActive = member.status === 'Active';
                          const isAssigned = member.status === 'Assigned';

                          return (
                            <tr key={member.id}>
                              <td>
                                <strong>{member.name}</strong>
                              </td>
                              <td>
                                <span className="badge-crew-role">
                                  <Wrench size={11} /> {member.role}
                                </span>
                              </td>
                              <td>
                                <a href={`tel:${member.phone}`} className="tanker-phone-btn">
                                  <PhoneCall size={12} /> {member.phone}
                                </a>
                              </td>
                              <td>
                                <span className="badge-badge-id">{member.badge_id || 'NP-STAFF'}</span>
                              </td>
                              <td>
                                <small style={{ color: '#0f766e', fontWeight: 600 }}>{member.ward_assignment || 'All Wards'}</small>
                              </td>
                              <td>
                                <span className={
                                  isActive ? 'badge-status-available' :
                                  isAssigned ? 'badge-status-intransit' : 'badge-status-maintenance'
                                }>
                                  {isActive && <CheckCircle2 size={12} />}
                                  {isAssigned && <Users size={12} />}
                                  <span>{member.status}</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL 1: DISPATCH LINE TEAM ================= */}
      {dispatchModalItem && (
        <div className="modal-backdrop" onClick={() => setDispatchModalItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Dispatch Municipal Repair Crew</h3>
                <p>Ticket: <strong>{dispatchModalItem.ticket_code}</strong> ({dispatchModalItem.incident_type})</p>
              </div>
              <button className="btn-close" onClick={() => setDispatchModalItem(null)}>×</button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="modal-body-pad">
              <div className="modal-info-banner">
                <strong>Citizen:</strong> {dispatchModalItem.citizen_name} ({dispatchModalItem.phone})<br />
                <strong>Location:</strong> {dispatchModalItem.location} ({dispatchModalItem.ward_name})
              </div>

              <label style={{ display: 'block', marginTop: 12 }}>
                Assign Municipal Technician / Crew:
                <select
                  value={dispatchForm.technician}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, technician: e.target.value })}
                  style={{ width: '100%', marginTop: 6 }}
                >
                  <option value="Rajesh Shinde (Lead Line Inspector)">Rajesh Shinde (Lead Line Inspector - Van #1)</option>
                  <option value="Suresh Mane (Enforcement & Anti-Suction Team)">Suresh Mane (Enforcement & Anti-Suction Team)</option>
                  <option value="Amol Raut (Sluice Valve Maintenance)">Amol Raut (Sluice Valve Maintenance)</option>
                  <option value="Dhananjay Patil (Emergency Burst Crew)">Dhananjay Patil (Emergency Burst Crew - Heavy Van #4)</option>
                </select>
              </label>

              <label style={{ display: 'block', marginTop: 12 }}>
                Estimated Response / Arrival Time (Minutes):
                <input
                  type="number"
                  min="5"
                  max="120"
                  required
                  value={dispatchForm.eta_minutes}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, eta_minutes: e.target.value })}
                  style={{ width: '100%', marginTop: 6 }}
                />
              </label>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-cancel" onClick={() => setDispatchModalItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  <Send size={15} />
                  <span>Dispatch Line Crew</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ================= MODAL 3: DISPATCH EMERGENCY TANKER (OFFICER AUTHORITY) ================= */}
      {showTankerModal && (
        <div className="modal-backdrop" onClick={() => setShowTankerModal(false)}>
          <div className="modal-content modal-dialog-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Authorize Municipal Potable Water Tanker Dispatch</h3>
                <p>Officer Authority Console: Select Tanker, Driver & Accompanying Crew</p>
              </div>
              <button className="btn-close" onClick={() => setShowTankerModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateTankerDispatch} className="modal-body-pad">
              {/* SECTION 1: AUTHORITY SELECTORS FOR TANKER & DRIVER */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                <h4 style={{ fontSize: '13px', color: '#0f766e', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} />
                  <span>Officer Authority: Fleet Asset & Driver Assignment</span>
                </h4>

                <div className="form-row-2">
                  <label>
                    Select Fleet Tanker Vehicle *
                    <select
                      value={tankerForm.fleet_tanker || (fleetTankers.find(t => t.vehicle_no === tankerForm.vehicle_no)?.id || 'custom')}
                      onChange={(e) => handleSelectFleetTanker(e.target.value)}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="" disabled>-- Choose Registered Tanker --</option>
                      {fleetTankers.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.vehicle_no} • {t.tanker_name} ({Number(t.capacity_liters).toLocaleString()} L) [{t.status}]
                        </option>
                      ))}
                      <option value="custom">+ Custom / External Leased Tanker</option>
                    </select>
                  </label>

                  <label>
                    Select Certified Driver *
                    <select
                      value={tankerForm.fleet_driver || (fleetDrivers.find(d => d.name === tankerForm.driver_name)?.id || 'custom')}
                      onChange={(e) => handleSelectFleetDriver(e.target.value)}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="" disabled>-- Choose Authorized Driver --</option>
                      {fleetDrivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} • 📞 {d.phone} (Lic: {d.license_number}) [{d.status}]
                        </option>
                      ))}
                      <option value="custom">+ Custom / Relief Driver</option>
                    </select>
                  </label>
                </div>

                <div className="form-row-2" style={{ marginTop: 8 }}>
                  <label>
                    Vehicle Plate Number *
                    <input
                      type="text"
                      required
                      value={tankerForm.vehicle_no}
                      onChange={(e) => setTankerForm({ ...tankerForm, vehicle_no: e.target.value })}
                      placeholder="e.g. MH-12-AQ-105"
                    />
                  </label>

                  <label>
                    Driver Name & Contact *
                    <input
                      type="text"
                      required
                      value={tankerForm.driver_name}
                      onChange={(e) => setTankerForm({ ...tankerForm, driver_name: e.target.value })}
                      placeholder="e.g. Suresh Pawar"
                    />
                  </label>
                </div>

                <div className="form-row-2" style={{ marginTop: 8 }}>
                  <label>
                    Driver Mobile Phone Number *
                    <input
                      type="tel"
                      required
                      value={tankerForm.driver_phone}
                      onChange={(e) => setTankerForm({ ...tankerForm, driver_phone: e.target.value })}
                      placeholder="e.g. 9822334455"
                    />
                  </label>

                  <label>
                    Tanker Capacity (Liters) *
                    <input
                      type="number"
                      required
                      min="1000"
                      max="30000"
                      step="500"
                      value={tankerForm.capacity_liters}
                      onChange={(e) => setTankerForm({ ...tankerForm, capacity_liters: Number(e.target.value) })}
                    />
                  </label>
                </div>
              </div>

              {/* SECTION 2: ACCOMPANYING DISPATCH TEAM CREW */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '13px', color: '#4338ca', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} />
                    <span>Assign Accompanying Dispatch Team Crew (Field Staff & Valve Techs)</span>
                  </h4>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {tankerForm.team_members?.length || 0} crew selected
                  </span>
                </div>

                <div className="crew-select-grid">
                  {dispatchTeam.map(member => {
                    const tag = `${member.name} (${member.role})`;
                    const isSelected = (tankerForm.team_members || []).includes(tag);

                    return (
                      <div 
                        key={member.id}
                        className={`crew-select-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleCrewMember(tag)}
                      >
                        <div className="crew-chip-checkbox">
                          {isSelected ? '✓' : ''}
                        </div>
                        <div className="crew-chip-info">
                          <span className="crew-chip-name">{member.name}</span>
                          <span className="crew-chip-role">{member.role} • 📞 {member.phone}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <label style={{ display: 'block', marginTop: 10 }}>
                  Additional Crew Members / Custom Escort Notes:
                  <input
                    type="text"
                    value={tankerForm.custom_crew_notes || ''}
                    onChange={(e) => setTankerForm({ ...tankerForm, custom_crew_notes: e.target.value })}
                    placeholder="e.g. Santosh Gaikwad (Chlorination Staff), Ward Escort Van #2"
                    style={{ width: '100%', marginTop: 4 }}
                  />
                </label>
              </div>

              {/* SECTION 3: DESTINATION & PURPOSE */}
              <div className="form-row-2">
                <label>
                  Destination Municipal Ward *
                  <select
                    value={tankerForm.target_ward_id}
                    onChange={(e) => setTankerForm({ ...tankerForm, target_ward_id: e.target.value })}
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.households_count} Homes)
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Exact Destination / Chowk / Sump *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Shivaji Chowk Community Sump, Lane 2"
                    value={tankerForm.destination_location}
                    onChange={(e) => setTankerForm({ ...tankerForm, destination_location: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-row-2" style={{ marginTop: 10 }}>
                <label>
                  Requester / Community Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mohalla Committee / Marriage Hall"
                    value={tankerForm.requester_name}
                    onChange={(e) => setTankerForm({ ...tankerForm, requester_name: e.target.value })}
                  />
                </label>

                <label>
                  Purpose / Administrative Justification *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Emergency water supply for elevation pressure deficit"
                    value={tankerForm.purpose}
                    onChange={(e) => setTankerForm({ ...tankerForm, purpose: e.target.value })}
                  />
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-cancel" onClick={() => setShowTankerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  <Truck size={16} />
                  <span>Authorize & Dispatch Tanker</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: ADD NEW FLEET TANKER ================= */}
      {showAddTankerModal && (
        <div className="modal-backdrop" onClick={() => setShowAddTankerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Register Tanker to Municipal Fleet</h3>
                <p>Add a new potable water tanker vehicle to the Nagar Parishad fleet registry</p>
              </div>
              <button className="btn-close" onClick={() => setShowAddTankerModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateFleetTanker} className="modal-body-pad">
              <div className="form-row-2">
                <label>
                  Vehicle Registration Number *
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH-12-AQ-303"
                    value={addTankerForm.vehicle_no}
                    onChange={(e) => setAddTankerForm({ ...addTankerForm, vehicle_no: e.target.value.toUpperCase() })}
                  />
                </label>

                <label>
                  Tanker Operational Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aqua Express 5"
                    value={addTankerForm.tanker_name}
                    onChange={(e) => setAddTankerForm({ ...addTankerForm, tanker_name: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-row-2" style={{ marginTop: 10 }}>
                <label>
                  Water Capacity (Liters) *
                  <select
                    value={addTankerForm.capacity_liters}
                    onChange={(e) => setAddTankerForm({ ...addTankerForm, capacity_liters: Number(e.target.value) })}
                  >
                    <option value={5000}>5,000 Liters (Standard Nagar Parishad Tanker)</option>
                    <option value={8000}>8,000 Liters (Medium Distribution Tanker)</option>
                    <option value={10000}>10,000 Liters (Heavy Sector Tanker)</option>
                    <option value={12000}>12,000 Liters (Max Capacity Relief Tanker)</option>
                  </select>
                </label>

                <label>
                  Chassis Make & Model *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata 1613 SE / BharatBenz 1217C"
                    value={addTankerForm.model_make}
                    onChange={(e) => setAddTankerForm({ ...addTankerForm, model_make: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-row-2" style={{ marginTop: 10 }}>
                <label>
                  Ownership Type *
                  <select
                    value={addTankerForm.ownership_type}
                    onChange={(e) => setAddTankerForm({ ...addTankerForm, ownership_type: e.target.value })}
                  >
                    <option value="Municipal Owned">Nagar Parishad Municipal Owned</option>
                    <option value="Contractor Leased">Contractor Leased Relief Vehicle</option>
                  </select>
                </label>

                <label>
                  GPS Device Tracking ID
                  <input
                    type="text"
                    placeholder="e.g. GPS-MH12-303"
                    value={addTankerForm.gps_tracking_id}
                    onChange={(e) => setAddTankerForm({ ...addTankerForm, gps_tracking_id: e.target.value })}
                  />
                </label>
              </div>

              <label style={{ display: 'block', marginTop: 10 }}>
                Maintenance & Operational Notes:
                <textarea
                  rows="2"
                  value={addTankerForm.notes}
                  onChange={(e) => setAddTankerForm({ ...addTankerForm, notes: e.target.value })}
                  placeholder="e.g. Food-grade epoxy coated potable water tank, inspected June 2026."
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-cancel" onClick={() => setShowAddTankerModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  <Check size={16} />
                  <span>Register Tanker Vehicle</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 5: ADD NEW CERTIFIED DRIVER ================= */}
      {showAddDriverModal && (
        <div className="modal-backdrop" onClick={() => setShowAddDriverModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Register Certified Municipal Tanker Driver</h3>
                <p>Register heavy commercial vehicle certified driver credentials</p>
              </div>
              <button className="btn-close" onClick={() => setShowAddDriverModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateFleetDriver} className="modal-body-pad">
              <div className="form-row-2">
                <label>
                  Driver Full Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Patil"
                    value={addDriverForm.name}
                    onChange={(e) => setAddDriverForm({ ...addDriverForm, name: e.target.value })}
                  />
                </label>

                <label>
                  Primary Mobile Phone *
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9822998877"
                    value={addDriverForm.phone}
                    onChange={(e) => setAddDriverForm({ ...addDriverForm, phone: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-row-2" style={{ marginTop: 10 }}>
                <label>
                  Driving License Number (Commercial Heavy) *
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH12-2018-008741"
                    value={addDriverForm.license_number}
                    onChange={(e) => setAddDriverForm({ ...addDriverForm, license_number: e.target.value })}
                  />
                </label>

                <label>
                  Experience (Years) *
                  <input
                    type="number"
                    min="1"
                    max="40"
                    required
                    value={addDriverForm.experience_years}
                    onChange={(e) => setAddDriverForm({ ...addDriverForm, experience_years: Number(e.target.value) })}
                  />
                </label>
              </div>

              <div className="form-row-2" style={{ marginTop: 10 }}>
                <label>
                  Emergency Contact Phone
                  <input
                    type="tel"
                    placeholder="e.g. 9822001199"
                    value={addDriverForm.emergency_contact}
                    onChange={(e) => setAddDriverForm({ ...addDriverForm, emergency_contact: e.target.value })}
                  />
                </label>

                <label>
                  Duty Availability Status *
                  <select
                    value={addDriverForm.status}
                    onChange={(e) => setAddDriverForm({ ...addDriverForm, status: e.target.value })}
                  >
                    <option value="Available">Available on Duty</option>
                    <option value="Off Duty">Off Duty / Rest</option>
                  </select>
                </label>
              </div>

              <label style={{ display: 'block', marginTop: 10 }}>
                Driver Certifications & Roster Notes:
                <textarea
                  rows="2"
                  value={addDriverForm.notes}
                  onChange={(e) => setAddDriverForm({ ...addDriverForm, notes: e.target.value })}
                  placeholder="e.g. Day shift roster. Valid hazardous material / clean liquid transport badge."
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-cancel" onClick={() => setShowAddDriverModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  <UserPlus size={16} />
                  <span>Register Driver</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 6: ADD NEW DISPATCH TEAM MEMBER ================= */}
      {showAddCrewModal && (
        <div className="modal-backdrop" onClick={() => setShowAddCrewModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Register Dispatch Field Crew Member</h3>
                <p>Add valve technician, field inspector, crowd escort or chlorination staff</p>
              </div>
              <button className="btn-close" onClick={() => setShowAddCrewModal(false)}>×</button>
            </div>

            <form onSubmit={handleCreateCrewMember} className="modal-body-pad">
              <div className="form-row-2">
                <label>
                  Staff Full Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vijay Shinde"
                    value={addCrewForm.name}
                    onChange={(e) => setAddCrewForm({ ...addCrewForm, name: e.target.value })}
                  />
                </label>

                <label>
                  Designation / Role *
                  <select
                    value={addCrewForm.role}
                    onChange={(e) => setAddCrewForm({ ...addCrewForm, role: e.target.value })}
                  >
                    <option value="Valve Technician">Valve Technician & Flow Attendant</option>
                    <option value="Field Supervisor">Field Supervisor / Nagar Parishad Inspector</option>
                    <option value="Security & Queue Escort">Security & Crowd Attendant</option>
                    <option value="Sanitation & Chlorination Crew">Sanitation & Chlorination Crew</option>
                  </select>
                </label>
              </div>

              <div className="form-row-2" style={{ marginTop: 10 }}>
                <label>
                  Mobile Contact Number *
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9890123456"
                    value={addCrewForm.phone}
                    onChange={(e) => setAddCrewForm({ ...addCrewForm, phone: e.target.value })}
                  />
                </label>

                <label>
                  Municipal Employee / Badge ID
                  <input
                    type="text"
                    placeholder="e.g. NP-VALVE-05"
                    value={addCrewForm.badge_id}
                    onChange={(e) => setAddCrewForm({ ...addCrewForm, badge_id: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-row-2" style={{ marginTop: 10 }}>
                <label>
                  Assigned Ward / Sector
                  <select
                    value={addCrewForm.ward_assignment}
                    onChange={(e) => setAddCrewForm({ ...addCrewForm, ward_assignment: e.target.value })}
                  >
                    <option value="All Wards">All Wards (Municipal Mobile Unit)</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.name}>{z.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Duty Status *
                  <select
                    value={addCrewForm.status}
                    onChange={(e) => setAddCrewForm({ ...addCrewForm, status: e.target.value })}
                  >
                    <option value="Active">Active on Duty</option>
                    <option value="Off Duty">Off Duty / Standby</option>
                  </select>
                </label>
              </div>

              <label style={{ display: 'block', marginTop: 10 }}>
                Notes / Special Skills:
                <textarea
                  rows="2"
                  value={addCrewForm.notes}
                  onChange={(e) => setAddCrewForm({ ...addCrewForm, notes: e.target.value })}
                  placeholder="e.g. Certified in fast hydrant coupling, chlorination titration testing."
                  style={{ width: '100%', marginTop: 4 }}
                />
              </label>

              <div className="modal-actions" style={{ marginTop: 20 }}>
                <button type="button" className="btn-cancel" onClick={() => setShowAddCrewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-action">
                  <UserPlus size={16} />
                  <span>Register Crew Member</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}
