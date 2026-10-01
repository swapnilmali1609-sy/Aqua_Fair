import React, { useState } from 'react';
import { Menu, Bell, Radio, Zap, RotateCcw, Home, Building2, AlertTriangle, FileText } from 'lucide-react';

export default function Topbar({
  user,
  onOpenSidebar,
  activeTab,
  setActiveTab,
  alertCount = 0,
  pendingDemandsCount = 0,
  onAlertClick,
  onSimulateAnomaly
}) {
  const [showSimMenu, setShowSimMenu] = useState(false);
  const isCitizen = user?.role === 'Citizen / Household';

  const titles = {
    dashboard: 'Municipal Operations Console',
    demands: 'Water Demand Approvals',
    grievances: 'Grievance & Fleet Operations',
    citizen: 'Household Smart Meter',
    monitoring: 'Telemetry & Actuator Controls',
    analytics: 'Consumption & Equity Analytics',
    zones: 'Wards & Household Management',
    alerts: 'System Alerts & Incidents',
    settings: 'System & Hardware Settings',
    driver: 'Fleet Driver Console',
    teamleader: 'Field Repair Operations'
  };

  const isCitizenMode = activeTab === 'citizen';

  const handleSimTrigger = (action) => {
    if (onSimulateAnomaly) onSimulateAnomaly(action);
    setShowSimMenu(false);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu" onClick={onOpenSidebar} aria-label="Toggle menu">
          <Menu size={20} />
        </button>
        <div>
          <div className="eyebrow-chip">
            <Radio size={12} className="pulse-icon" />
            <span>
              {isCitizen
                ? `Connection: ${user?.household_id || 'AF-W1-1042'} • Active Smart Meter`
                : 'AquaBalance Telemetry Grid • SCADA Active'}
            </span>
          </div>
          <h2>{titles[activeTab] || 'Operations Console'}</h2>
        </div>
      </div>

      <div className="top-actions">
        {/* Officer-Only: Perspective / Role Switcher & Anomaly Simulator */}
        {!isCitizen && (
          <>
            <button
              className="btn-perspective-switch"
              onClick={() => setActiveTab(isCitizenMode ? 'dashboard' : 'citizen')}
              title="Switch between Municipal SCADA view and Resident Household view"
            >
              {isCitizenMode ? (
                <>
                  <Building2 size={15} />
                  <span>Return to Municipal SCADA</span>
                </>
              ) : (
                <>
                  <Home size={15} />
                  <span>Preview Resident View</span>
                </>
              )}
            </button>

            {/* Quick Demands Badge Button for Officer */}
            {pendingDemandsCount > 0 && (
              <button
                className="btn-top-demands"
                onClick={() => setActiveTab('demands')}
                title={`${pendingDemandsCount} extra water demands pending approval`}
              >
                <FileText size={15} />
                <span>{pendingDemandsCount} Demands Pending</span>
              </button>
            )}

            {/* Anomaly Simulator Quick Trigger */}
            <div className="sim-dropdown-wrap">
              <button
                className="btn-sim-trigger"
                onClick={() => setShowSimMenu(!showSimMenu)}
                title="Trigger simulated live anomalies for testing"
              >
                <Zap size={15} />
                <span>⚡ Anomaly Simulator</span>
              </button>

              {showSimMenu && (
                <div className="sim-dropdown-menu">
                  <div className="sim-menu-header">Live Anomaly Triggers</div>
                  <button onClick={() => handleSimTrigger('trigger_leak')}>
                    <AlertTriangle size={14} className="text-amber" />
                    <span>Simulate Pipe Leak (Ward 3)</span>
                  </button>
                  <button onClick={() => handleSimTrigger('simulate_overflow')}>
                    <AlertTriangle size={14} className="text-sky" />
                    <span>Simulate Tank Overflow (&ge;95%)</span>
                  </button>
                  <button onClick={() => handleSimTrigger('simulate_low_water')}>
                    <AlertTriangle size={14} className="text-amber" />
                    <span>Simulate Low Water Level (&le;20%)</span>
                  </button>
                  <button onClick={() => handleSimTrigger('simulate_abnormal_usage')}>
                    <AlertTriangle size={14} className="text-amber" />
                    <span>Simulate Booster Suction / Surge</span>
                  </button>
                  <button onClick={() => handleSimTrigger('simulate_contamination')}>
                    <AlertTriangle size={14} className="text-rose" />
                    <span>Simulate Water Contamination (Early Detection)</span>
                  </button>
                  <div className="dropdown-divider" />
                  <button className="reset-item" onClick={() => handleSimTrigger('reset_simulation')}>
                    <RotateCcw size={14} />
                    <span>Reset to Nominal Equilibrium</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Alerts Bell */}
        <button
          className={`icon-btn ${alertCount > 0 ? 'has-alerts' : ''}`}
          onClick={onAlertClick}
          title={`${alertCount} active AquaFair alerts`}
        >
          <Bell size={18} />
          {alertCount > 0 && <span className="alert-badge-count">{alertCount}</span>}
        </button>

        {/* Profile Badge */}
        <div className="user-profile-badge">
          <div className="top-avatar">
            {user?.name?.[0]?.toUpperCase() || (isCitizen ? 'C' : 'A')}
          </div>
          <div className="top-user-text">
            <strong>{user?.name?.split(' ')[0] || 'User'}</strong>
            <small>{isCitizen ? `Resident (${user?.household_id || 'AF-W1-1042'})` : (user?.role || 'Municipal Officer')}</small>
          </div>
        </div>
      </div>
    </header>
  );
}
