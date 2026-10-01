import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Droplets, LogIn, UserPlus } from 'lucide-react';
import { api } from './services/api';

import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardView from './views/DashboardView';
import CitizenPortalView from './views/CitizenPortalView';
import DemandsManagementView from './views/DemandsManagementView';
import LiveMonitoringView from './views/LiveMonitoringView';
import AnalyticsView from './views/AnalyticsView';
import ZonesManagementView from './views/ZonesManagementView';
import GrievancesView from './views/GrievancesView';
import AlertsView from './views/AlertsView';
import SettingsView from './views/SettingsView';
import DriverPortalView from './views/DriverPortalView';
import TeamLeaderPortalView from './views/TeamLeaderPortalView';
import RegisterView from './views/RegisterView';

function AuthShell({ children, title, subtitle }) {
  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="logo-mark"><Droplets size={26} /></div>
        <div>
          <strong>AquaBalance</strong>
          <span>Smart Water Monitoring & Distribution</span>
        </div>
      </div>
      <div className="auth-card">
        <div className="auth-heading">
          <div className="eyebrow">INTELLIGENT WATER MANAGEMENT</div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {children}
      </div>
      <div className="auth-footer">
        © 2026 AquaBalance • Smart Equal Water Distribution System
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('samru');
  const [password, setPassword] = useState('samru123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await api.login({ username, password });
    setLoading(false);
    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.error || 'Invalid credentials. Please verify your username and password.');
    }
  }

  const fillOfficerDemo = () => {
    setUsername('samru');
    setPassword('samru123');
  };

  const fillCitizenRamesh = () => {
    setUsername('Ramesh Patil');
    setPassword('123456');
  };

  const fillDriverDemo = () => {
    setUsername('Suresh Pawar');
    setPassword('driver123');
  };

  const fillTeamLeaderDemo = () => {
    setUsername('Suresh More');
    setPassword('leader123');
  };

  return (
    <AuthShell title="Portal Sign In" subtitle="Sign in to access your operations console or resident smart meter.">
      <form className="form" onSubmit={submit}>
        {error && <div className="error-box">{error}</div>}
        <label>
          <span>Username or Full Name</span>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. samru or Ramesh Patil"
          />
        </label>
        <label>
          <span>Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </label>
        <button className="primary-btn" type="submit" disabled={loading}>
          <LogIn size={18} /> {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="demo-login-quick-options">
          <span className="demo-chips-label">Quick Sign In Options:</span>
          <div className="demo-chips-row" style={{ flexWrap: 'wrap' }}>
            <button type="button" className="btn-demo-chip chip-officer" onClick={fillOfficerDemo}>
              🏛️ Municipal Officer
            </button>
            <button type="button" className="btn-demo-chip chip-citizen" onClick={fillCitizenRamesh}>
              🏡 Resident (Ramesh Patil)
            </button>
            <button type="button" className="btn-demo-chip chip-driver" onClick={fillDriverDemo}>
              🚚 Tanker Driver
            </button>
            <button type="button" className="btn-demo-chip chip-leader" onClick={fillTeamLeaderDemo}>
              📋 Repair Squad
            </button>
          </div>
        </div>

        <div className="demo-login-quick-options" style={{ marginTop: '16px' }}>
          <span className="demo-chips-label">Need a new account? Register as:</span>
          <div className="demo-chips-row" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <button type="button" className="btn-demo-chip chip-officer" onClick={() => navigate('/register/officer')}>
              🏛️ Municipal Officer
            </button>
            <button type="button" className="btn-demo-chip chip-leader" onClick={() => navigate('/register/dispatch')}>
              📋 Dispatch Member
            </button>
            <button type="button" className="btn-demo-chip chip-driver" onClick={() => navigate('/register/driver')}>
              🚚 Tanker Driver
            </button>
            <button type="button" className="btn-demo-chip chip-citizen" onClick={() => navigate('/register/citizen')}>
              🏡 Citizen Resident
            </button>
          </div>
        </div>

        <div className="form-switch" style={{ marginTop: '14px' }}>
          New to AquaBalance?{' '}
          <button type="button" onClick={() => navigate('/register')}>Open Multi-Role Registration Portal</button>
        </div>
      </form>
    </AuthShell>
  );
}

function MainAppShell() {
  const navigate = useNavigate();
  const curUser = api.getCurrentUser();
  const isCitizen = curUser?.role === 'Citizen / Household';
  const isDriver = curUser?.role === 'Tanker Driver';
  const isTeamLeader = curUser?.role === 'Dispatch Team Leader';

  const defaultTab = isCitizen ? 'citizen' : isDriver ? 'driver' : isTeamLeader ? 'teamleader' : 'dashboard';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1000);
  const [toast, setToast] = useState('');
  const [openAddWardRequested, setOpenAddWardRequested] = useState(false);
  const [selectedWardParam, setSelectedWardParam] = useState(null);
  const [grievances, setGrievances] = useState([]);

  const [system, setSystem] = useState({
    tank_name: 'AquaFair Municipal Storage Reservoir (ESR)',
    tank_capacity_liters: 2500000,
    tank_level_liters: 1950000,
    pump_status: 'Running',
    system_mode: 'Auto',
    pump_efficiency: 95.4,
    pressure_psi: 48.0,
    overflow_guard: true,
    overflow_status: 'Safe (78% Capacity)',
    dry_run_protection: true,
    leak_detection_status: 'Normal (Zero Active Leaks)',
    water_wastage_prevented_liters: 92500
  });

  const [zones, setZones] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState({});
  const [hourlyData, setHourlyData] = useState([]);
  const [demands, setDemands] = useState([]);
  const [user, setUser] = useState(curUser);

  // Load initial data
  useEffect(() => {
    const cur = api.getCurrentUser();
    setUser(cur);
    if (cur?.role === 'Citizen / Household') {
      setActiveTab('citizen');
    } else if (cur?.role === 'Tanker Driver') {
      setActiveTab('driver');
    } else if (cur?.role === 'Dispatch Team Leader') {
      setActiveTab('teamleader');
    }

    api.getDashboard().then((data) => {
      if (data) {
        setSystem(data.system || {});
        setZones(data.zones || []);
        setAlerts(data.alerts || []);
        setSummary(data.summary || {});
        setHourlyData(data.hourly_distribution || []);
      }
    });

    api.getDemands().then((data) => {
      if (data) setDemands(data);
    });

    api.getGrievances().then((data) => {
      if (data) setGrievances(data);
    });
  }, []);

  // Real-Time SCADA Event Synchronization for Driver deliveries and Team Leader resolutions
  useEffect(() => {
    const handleTankerDelivered = (e) => {
      showToast(`🚚 Officer SCADA: Tanker ${e.detail?.vehicle_no || ''} marked as Delivered by Driver!`);
      api.getDashboard().then(d => {
        if (d) {
          setSystem(d.system || {});
          setZones(d.zones || []);
          setSummary(d.summary || {});
        }
      });
      api.getGrievances().then(g => { if (g) setGrievances(g); });
    };

    const handleGrievanceResolved = (e) => {
      showToast(`🛠️ Officer SCADA: Grievance #${e.detail?.ticket_code || ''} marked Resolved by Field Squad!`);
      api.getDashboard().then(d => {
        if (d) {
          setSystem(d.system || {});
          setZones(d.zones || []);
          setSummary(d.summary || {});
        }
      });
      api.getGrievances().then(g => { if (g) setGrievances(g); });
    };

    const handleStateChange = () => {
      api.getDashboard().then(d => {
        if (d) {
          setSystem(d.system || {});
          setZones(d.zones || []);
          setSummary(d.summary || {});
        }
      });
    };

    window.addEventListener('aquafair_tanker_delivered', handleTankerDelivered);
    window.addEventListener('aquafair_grievance_resolved', handleGrievanceResolved);
    window.addEventListener('aquafair_state_change', handleStateChange);

    return () => {
      window.removeEventListener('aquafair_tanker_delivered', handleTankerDelivered);
      window.removeEventListener('aquafair_grievance_resolved', handleGrievanceResolved);
      window.removeEventListener('aquafair_state_change', handleStateChange);
    };
  }, []);

  // AquaFair continuous simulation tick loop
  useEffect(() => {
    if (simSpeed === 0) return;

    const interval = setInterval(async () => {
      const res = await api.tick();
      if (res && res.zones) {
        setSystem(res.system);
        setZones(res.zones);
        if (res.summary) setSummary(res.summary);
      }
    }, simSpeed);

    return () => clearInterval(interval);
  }, [simSpeed]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleRefreshDemands = async () => {
    const data = await api.getDemands();
    if (data) setDemands(data);
  };

  const handleApproveDemand = async (id) => {
    const res = await api.approveDemand(id);
    if (res) {
      await handleRefreshDemands();
      showToast('Permission granted! Extra water quota dispatched to household.');
    }
  };

  const handleRejectDemand = async (id, reason) => {
    const res = await api.rejectDemand(id, reason);
    if (res) {
      await handleRefreshDemands();
      showToast('Water demand request declined.');
    }
  };

  const handleCreateDemand = async (demandData) => {
    const res = await api.createDemand(demandData);
    if (res) {
      await handleRefreshDemands();
      showToast('Extra water demand registered! Sent to Municipal Officer for approval.');
    }
    return res;
  };

  // Actions
  const handleToggleMode = async () => {
    const res = await api.controlSystem('toggle_mode');
    if (res && res.system) {
      setSystem(res.system);
      showToast(`Distribution Mode switched to ${res.system.system_mode}`);
    }
  };

  const handleTogglePump = async () => {
    const res = await api.controlSystem('toggle_pump');
    if (res && res.system) {
      setSystem(res.system);
      showToast(`Pumping Station ${res.system.pump_status}`);
    }
  };

  const handleResetCycle = async () => {
    await api.controlSystem('reset_cycle');
    const data = await api.getDashboard();
    setSystem(data.system);
    setZones(data.zones);
    setSummary(data.summary);
    showToast('AquaFair fair allocation schedule restarted');
  };

  const handleToggleZone = async (id) => {
    const zone = zones.find((z) => z.id === id);
    if (!zone) return;
    const newStatus = zone.status === 'Paused' ? 'Balanced' : 'Paused';
    const updated = await api.updateZone(id, { status: newStatus });
    setZones(zones.map((z) => (z.id === id ? { ...z, ...updated } : z)));
    showToast(`${zone.name} feeder line is now ${newStatus === 'Paused' ? 'Closed' : 'Supplying'}`);
  };

  const handleAdjustValve = async (id, valvePercent) => {
    const updated = await api.updateZone(id, { valve_percent: valvePercent });
    setZones(zones.map((z) => (z.id === id ? { ...z, ...updated } : z)));
  };

  const handleUpdateZone = async (id, fields) => {
    const updated = await api.updateZone(id, fields);
    setZones(zones.map((z) => (z.id === id ? { ...z, ...updated } : z)));
  };

  const handleAddZone = async (zoneData) => {
    const created = await api.createZone(zoneData);
    if (created) {
      const data = await api.getDashboard();
      if (data) {
        if (data.zones) setZones(data.zones);
        if (data.summary) setSummary(data.summary);
        if (data.system) setSystem(data.system);
      } else {
        setZones((prev) => [...prev.filter((z) => z.id !== created.id), created]);
      }
      const updatedAlerts = await api.getAlerts();
      if (updatedAlerts) setAlerts(updatedAlerts);
      showToast(`Ward "${created.name}" (Ward #${created.ward_number}) created successfully!`);
    }
    return created;
  };

  const handleDeleteZone = async (id, name) => {
    const res = await api.deleteZone(id);
    if (res && res.success) {
      setZones((prev) => prev.filter((z) => z.id !== id));
      const updatedAlerts = await api.getAlerts();
      if (updatedAlerts) setAlerts(updatedAlerts);
      showToast(`Ward ${name || ''} decommissioned from municipal grid.`);
    }
  };

  const handleResolveAlert = async (id) => {
    await api.resolveAlert(id);
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, resolved: true } : a)));
    showToast('Notification acknowledged');
  };

  const handleSimulateAnomaly = async (action) => {
    const res = await api.simulateAnomaly(action);
    if (res && res.system) {
      setSystem(res.system);
      if (res.zones) setZones(res.zones);
      const updatedAlerts = await api.getAlerts();
      if (updatedAlerts) setAlerts(updatedAlerts);
      const actionLabels = {
        trigger_leak: 'Simulated micro-leak in Ward 3 feeder line',
        simulate_overflow: 'Simulated tank overflow (>95%) - Automated cutoff engaged',
        simulate_low_water: 'Simulated low water reserve (19%) warning',
        simulate_abnormal_usage: 'Simulated unauthorized booster suction draw in Ward 1',
        simulate_contamination: 'EMERGENCY: Simulated chemical contamination detected! Sluice valves automatically isolated.',
        reset_simulation: 'AquaFair grid restored to nominal balanced state'
      };
      showToast(actionLabels[action] || 'Simulation event processed');
    }
  };

  const handleRefreshAlerts = async () => {
    const updatedAlerts = await api.getAlerts();
    if (updatedAlerts) setAlerts(updatedAlerts);
  };

  const handleRefreshAll = async () => {
    const data = await api.getDashboard();
    if (data) {
      if (data.system) setSystem(data.system);
      if (data.zones) setZones(data.zones);
      if (data.alerts) setAlerts(data.alerts);
      if (data.summary) setSummary(data.summary);
      if (data.hourly_distribution) setHourlyData(data.hourly_distribution);
    }
    const demandsData = await api.getDemands();
    if (demandsData) setDemands(demandsData);
    const grvData = await api.getGrievances();
    if (grvData) setGrievances(grvData);
  };

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  const unreadAlerts = alerts.filter((a) => !a.resolved).length;
  const pendingDemandsCount = demands.filter((d) => d.status === 'Pending').length;

  return (
    <div className="app-shell">
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        alertCount={unreadAlerts}
        pendingDemandsCount={pendingDemandsCount}
        grievanceCount={grievances.filter(g => g.status !== 'Resolved').length}
        user={user}
        onLogout={handleLogout}
      />

      <main className="main-content-area">
        <Topbar
          user={user}
          onOpenSidebar={() => setSidebarOpen(true)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          alertCount={unreadAlerts}
          pendingDemandsCount={pendingDemandsCount}
          onAlertClick={() => setActiveTab('alerts')}
          onSimulateAnomaly={handleSimulateAnomaly}
        />

        <div className="view-wrapper">
          {/* Strict Role Separation: */}
          {isCitizen ? (
            <CitizenPortalView
              user={user}
              zones={zones}
              demands={demands}
              alerts={alerts}
              onRefreshAlerts={handleRefreshAlerts}
              onRefreshDemands={handleRefreshDemands}
              onCreateDemand={handleCreateDemand}
            />
          ) : isDriver ? (
            <DriverPortalView user={user} />
          ) : isTeamLeader ? (
            <TeamLeaderPortalView user={user} />
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  system={system}
                  zones={zones}
                  alerts={alerts}
                  summary={summary}
                  demands={demands}
                  hourlyData={hourlyData}
                  onToggleMode={handleToggleMode}
                  onTogglePump={handleTogglePump}
                  onResetCycle={handleResetCycle}
                  onToggleZone={handleToggleZone}
                  onResolveAlert={handleResolveAlert}
                  onApproveDemand={handleApproveDemand}
                  onRejectDemand={handleRejectDemand}
                  onNavigateTab={(tab, opts) => {
                    setActiveTab(tab);
                    if (opts?.openAddWard) {
                      setOpenAddWardRequested(true);
                    }
                    if (opts?.wardId) {
                      setSelectedWardParam(opts.wardId);
                    }
                  }}
                  user={user}
                />
              )}

              {activeTab === 'driver' && (
                <DriverPortalView user={user} />
              )}

              {activeTab === 'teamleader' && (
                <TeamLeaderPortalView user={user} />
              )}

              {activeTab === 'demands' && (
                <DemandsManagementView
                  demands={demands}
                  zones={zones}
                  onApproveDemand={handleApproveDemand}
                  onRejectDemand={handleRejectDemand}
                />
              )}

              {activeTab === 'grievances' && (
                <GrievancesView
                  zones={zones}
                  user={user}
                />
              )}

              {activeTab === 'citizen' && (
                <CitizenPortalView
                  user={user}
                  zones={zones}
                  demands={demands}
                  onRefreshAlerts={handleRefreshAlerts}
                  onRefreshDemands={handleRefreshDemands}
                  onCreateDemand={handleCreateDemand}
                />
              )}

              {activeTab === 'monitoring' && (
                <LiveMonitoringView
                  system={system}
                  zones={zones}
                  onToggleZone={handleToggleZone}
                  onAdjustValve={handleAdjustValve}
                  onToggleMode={handleToggleMode}
                  onTogglePump={handleTogglePump}
                  onResetCycle={handleResetCycle}
                  onResetSimulation={() => handleSimulateAnomaly('reset_simulation')}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView
                  zones={zones}
                  summary={summary}
                  system={system}
                />
              )}

              {activeTab === 'zones' && (
                <ZonesManagementView
                  zones={zones}
                  onUpdateZone={handleUpdateZone}
                  onAddZone={handleAddZone}
                  onDeleteZone={handleDeleteZone}
                  user={user}
                  openAddWardRequested={openAddWardRequested}
                  onClearAddWardRequest={() => setOpenAddWardRequested(false)}
                  initialWardId={selectedWardParam}
                  onClearInitialWardId={() => setSelectedWardParam(null)}
                  onRefreshAll={handleRefreshAll}
                />
              )}

              {activeTab === 'alerts' && (
                <AlertsView
                  alerts={alerts}
                  onResolveAlert={handleResolveAlert}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsView
                  user={user}
                  simSpeed={simSpeed}
                  setSimSpeed={setSimSpeed}
                  system={system}
                  onUpdateSystem={(updated) => {
                    setSystem(prev => ({ ...prev, ...updated }));
                    showToast('Municipal Storage Reservoir (ESR) updated!');
                  }}
                />
              )}
            </>
          )}
        </div>

        <footer className="footer-bar">
          <span>
            {isCitizen
              ? `AquaFair Citizen Portal • Household Connection ${user?.household_id || 'AF-W1-1042'} • Municipal Water Distribution`
              : isDriver
                ? `AquaFair Heavy Fleet Depot • Driver Cockpit (${user?.name || 'Suresh Pawar'}) • Vehicle ${user?.vehicle_no || 'MH-12-AQ-204'}`
                : isTeamLeader
                  ? `AquaFair Field Response • Squad Leader Cockpit (${user?.name || 'Suresh More'}) • Badge ${user?.household_id || 'NP-SUPV-04'}`
                  : 'AquaFair – Smart Water Monitoring and Equity System • 1,010 Households Grid'}
          </span>
          <span>IoT Telemetry: {simSpeed === 0 ? 'Paused' : `${simSpeed}ms`}</span>
        </footer>

        {toast && <div className="toast-notification">{toast}</div>}
      </main>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const user = api.getCurrentUser();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={api.getCurrentUser() ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<RegisterView />} />
      <Route path="/register/officer" element={<RegisterView initialRole="Municipal Officer" />} />
      <Route path="/register/dispatch" element={<RegisterView initialRole="Dispatch Team Leader" />} />
      <Route path="/register/driver" element={<RegisterView initialRole="Tanker Driver" />} />
      <Route path="/register/citizen" element={<RegisterView initialRole="Citizen / Household" />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainAppShell />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
