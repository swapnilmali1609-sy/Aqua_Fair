import { Home, Activity, BarChart3, Users, Bell, Settings, LogOut, Droplets, ShieldAlert, Cpu, FileText, Wrench, Truck, Navigation, UserPlus } from 'lucide-react';

export default function Sidebar({
  open,
  setOpen,
  activeTab,
  setActiveTab,
  alertCount = 0,
  pendingDemandsCount = 0,
  grievanceCount = 0,
  user,
  onLogout
}) {
  const isCitizen = user?.role === 'Citizen / Household';
  const isDriver = user?.role === 'Tanker Driver';
  const isTeamLeader = user?.role === 'Dispatch Team Leader';

  const driverNavItems = [
    { id: 'driver', label: 'Driver Operations', icon: Truck },
  ];

  const teamLeaderNavItems = [
    { id: 'teamleader', label: 'Field Squad & Repairs', icon: Wrench, badge: grievanceCount },
  ];

  const citizenNavItems = [
    { id: 'citizen', label: 'My Smart Meter', icon: Home },
  ];

  const officerNavItems = [
    { id: 'dashboard', label: 'Operations Console', icon: Home },
    { id: 'zones', label: 'Wards & Households', icon: Users },
    { id: 'demands', label: 'Demand Requests', icon: FileText, badge: pendingDemandsCount },
    { id: 'grievances', label: 'Grievance & Fleet', icon: Wrench, badge: grievanceCount },
    { id: 'monitoring', label: 'Flow & Telemetry', icon: Activity },
    { id: 'driver', label: 'Driver Telemetry (Audit)', icon: Truck },
    { id: 'teamleader', label: 'Field Squad (Audit)', icon: Wrench },
    { id: 'analytics', label: 'Analytics & Audit', icon: BarChart3 },
    { id: 'alerts', label: 'System Alerts', icon: Bell, badge: alertCount },
    { id: 'settings', label: 'System Settings', icon: Cpu },
  ];

  const navItems = isCitizen 
    ? citizenNavItems 
    : isDriver 
    ? driverNavItems 
    : isTeamLeader 
      ? teamLeaderNavItems 
      : officerNavItems;

  return (
    <>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="logo-mark">
            <Droplets size={24} />
          </div>
          <div>
            <strong>AquaBalance</strong>
            <span>{isCitizen ? 'Citizen Smart Meter' : 'Smart Water Distribution'}</span>
          </div>
        </div>

        <div className="system-status-indicator">
          <span className="live-dot" />
          <span>{isCitizen ? 'METER TELEMETRY ONLINE' : 'GRID TELEMETRY ONLINE'}</span>
        </div>

        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.badge > 0 && <b className="nav-badge-pill">{item.badge}</b>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="avatar">
              {user?.name?.[0]?.toUpperCase() || (isCitizen ? 'C' : 'A')}
            </div>
            <div className="user-details">
              <strong>{user?.name || (isCitizen ? 'Citizen Resident' : 'Administrator')}</strong>
              <span className="role-tag">{user?.role || 'Municipal Officer'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button 
              className="btn-sidebar-reg" 
              onClick={() => { setOpen(false); window.location.href = '/register'; }}
              title="Register Municipal Officer, Dispatch Member, or Tanker Driver"
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '7px 10px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <UserPlus size={14} color="#0d9488" /> Member Portal
            </button>
            <button className="logout" onClick={onLogout} style={{ marginTop: 0 }}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
