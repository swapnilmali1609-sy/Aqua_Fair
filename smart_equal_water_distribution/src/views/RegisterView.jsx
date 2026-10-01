import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Building2, Truck, Wrench, Home, Droplets, ShieldCheck, 
  User, CheckCircle2, AlertCircle, ArrowRight, Lock, 
  Mail, Phone, MapPin, Sparkles, LogIn, FileText, Check,
  BadgeCheck, Compass, Fuel, Gauge
} from 'lucide-react';
import { api } from '../services/api';

const ROLES = [
  {
    id: 'Municipal Officer',
    key: 'officer',
    title: 'Municipal Officer',
    marathi: 'नगर परिषद अधिकारी',
    badge: 'SCADA Command Authority',
    icon: Building2,
    color: '#0284c7', // Sky / Deep Blue
    bgGradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    accentClass: 'role-officer',
    desc: 'Supervise water works, control distribution valves, approve quotas, and authorize dispatches.'
  },
  {
    id: 'Dispatch Team Leader',
    key: 'dispatch',
    title: 'Dispatch Member',
    marathi: 'दुरुस्ती व नियंत्रण पथक',
    badge: 'Field Maintenance Crew',
    icon: Wrench,
    color: '#d97706', // Amber
    bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    accentClass: 'role-dispatch',
    desc: 'Inspect pipelines, operate hydrants, fix leakages, and resolve resident grievances on-site.'
  },
  {
    id: 'Tanker Driver',
    key: 'driver',
    title: 'Tanker Driver',
    marathi: 'पाणी टँकर चालक',
    badge: 'Heavy Fleet Logistics',
    icon: Truck,
    color: '#0d9488', // Teal / Cyan
    bgGradient: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
    accentClass: 'role-driver',
    desc: 'Transport potable water to deficit wards, refill community sumps, and confirm direct delivery.'
  },
  {
    id: 'Citizen / Household',
    key: 'citizen',
    title: 'Citizen Resident',
    marathi: 'कुटुंब / रहिवासी',
    badge: 'Smart Water Meter',
    icon: Home,
    color: '#16a34a', // Emerald
    bgGradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    accentClass: 'role-citizen',
    desc: 'Monitor daily household fair quota, check line pressure, request extra water, and log leaks.'
  }
];

export default function RegisterView({ initialRole = null }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect role from URL query param or props (e.g. /register?role=driver or /register/officer)
  const queryParams = new URLSearchParams(location.search);
  const paramRoleKey = queryParams.get('role') || queryParams.get('type') || '';
  
  const getInitialRole = () => {
    if (initialRole) return initialRole;
    if (location.pathname.includes('/officer') || paramRoleKey === 'officer' || paramRoleKey === 'municipal') return 'Municipal Officer';
    if (location.pathname.includes('/dispatch') || paramRoleKey === 'dispatch' || paramRoleKey === 'crew' || paramRoleKey === 'leader') return 'Dispatch Team Leader';
    if (location.pathname.includes('/driver') || paramRoleKey === 'driver' || paramRoleKey === 'tanker') return 'Tanker Driver';
    if (location.pathname.includes('/citizen') || paramRoleKey === 'citizen' || paramRoleKey === 'household') return 'Citizen / Household';
    return 'Municipal Officer'; // Default to prominent officer registration
  };

  const [activeRole, setActiveRole] = useState(getInitialRole());
  const [availableZones, setAvailableZones] = useState([]);
  const [availableFleet, setAvailableFleet] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields
  const [form, setForm] = useState({
    // Common fields
    name: '',
    email: '',
    phone: '',
    password: '',
    confirm: '',

    // Municipal Officer specific
    officer_id: 'NP-OFF-104',
    designation: 'Executive Engineer (Water Works & Headworks)',
    officer_passcode: 'AQUA-NP-2026',
    officer_jurisdiction: 'Central Headworks ESR & All Wards',

    // Dispatch Member specific
    dispatch_role: 'Field Supervisor / Inspector',
    badge_id: 'NP-SUPV-08',
    emergency_contact: '9822001122',
    ward_assignment: 'All Wards (Rapid Dispatch Unit)',
    depot_location: 'Central Municipal Maintenance Depot',

    // Tanker Driver specific
    license_number: 'MH14-2023-009112',
    experience_years: 6,
    vehicle_no: 'MH-12-AQ-204',
    driver_depot: 'Central Headworks ESR Pumping Station',

    // Citizen specific
    ward: '1',
    address: 'House #42, Lane 2, Shivaji Chowk',
    members_count: 4,
    household_id: 'AF-W1-1042'
  });

  // Fetch available zones and tankers on mount
  useEffect(() => {
    api.getZones().then(z => {
      if (z && z.length > 0) {
        setAvailableZones(z);
        setForm(prev => ({ ...prev, ward: prev.ward || String(z[0].id) }));
      }
    });

    api.getFleetTankers().then(t => {
      if (t && t.length > 0) {
        setAvailableFleet(t);
        setForm(prev => ({ ...prev, vehicle_no: prev.vehicle_no || t[0].vehicle_no }));
      }
    });
  }, []);

  // Update role if query parameter changes
  useEffect(() => {
    const qRole = queryParams.get('role');
    if (qRole === 'officer') setActiveRole('Municipal Officer');
    else if (qRole === 'dispatch') setActiveRole('Dispatch Team Leader');
    else if (qRole === 'driver') setActiveRole('Tanker Driver');
    else if (qRole === 'citizen') setActiveRole('Citizen / Household');
  }, [location.search]);

  const defaultWards = [
    { id: 1, ward_number: 1, name: 'Ward 1 - Shivaji Nagar (Lowland Sector)' },
    { id: 2, ward_number: 2, name: 'Ward 2 - Gandhi Ward (Market & Mixed Sector)' },
    { id: 3, ward_number: 3, name: 'Ward 3 - Subhash Nagar (Elevated Ridge Mohalla)' },
    { id: 4, ward_number: 4, name: 'Ward 4 - Ambedkar Ward (Tail-End Sector)' }
  ];

  const wardList = availableZones.length > 0 ? availableZones : defaultWards;

  const defaultFleet = [
    { vehicle_no: 'MH-12-AQ-204', tanker_name: 'Aqua Tanker #1', capacity_liters: 5000, model_make: 'Tata 1613 SE' },
    { vehicle_no: 'MH-12-AQ-105', tanker_name: 'Aqua Tanker #2', capacity_liters: 6000, model_make: 'BharatBenz 1617' },
    { vehicle_no: 'MH-14-BT-302', tanker_name: 'High Capacity Bowser', capacity_liters: 10000, model_make: 'Ashok Leyland 2820' },
    { vehicle_no: 'MH-12-EQ-881', tanker_name: 'Rapid Slum Feeder', capacity_liters: 4000, model_make: 'Eicher Pro 3015' }
  ];

  const fleetList = availableFleet.length > 0 ? availableFleet : defaultFleet;

  const update = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Quick Auto-Generators for credentials
  const generateOfficerId = () => {
    const rand = Math.floor(100 + Math.random() * 900);
    setForm(prev => ({ ...prev, officer_id: `NP-OFF-${rand}` }));
  };

  const generateCrewBadge = () => {
    const prefix = form.dispatch_role.includes('Valve') ? 'VALVE' :
                   form.dispatch_role.includes('Supervisor') ? 'SUPV' :
                   form.dispatch_role.includes('Chlor') ? 'CHLOR' : 'CREW';
    const rand = Math.floor(10 + Math.random() * 90);
    setForm(prev => ({ ...prev, badge_id: `NP-${prefix}-${rand}` }));
  };

  const generateLicenseNo = () => {
    const year = new Date().getFullYear() - Math.floor(2 + Math.random() * 5);
    const rand = Math.floor(10000 + Math.random() * 90000);
    setForm(prev => ({ ...prev, license_number: `MH14-${year}-${rand}` }));
  };

  const generateHouseholdId = () => {
    const wardNum = form.ward || '1';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setForm(prev => ({ ...prev, household_id: `AF-W${wardNum}-${rand}` }));
  };

  const computedQuota = (Number(form.members_count) || 4) * 135;

  const currentRoleConfig = ROLES.find(r => r.id === activeRole) || ROLES[0];

  async function submit(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Validation
    if (!form.name.trim()) return setError('Please enter full legal or official name.');
    if (!form.password) return setError('Password is required.');
    if (form.password.length < 6) return setError('Password must contain at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');

    // Role-specific validation
    if (activeRole === 'Citizen / Household') {
      if (!form.address.trim()) return setError('Residential address (House number, lane, or colony) is required.');
      if (!form.ward) return setError('Please select your municipal ward.');
    } else if (activeRole === 'Tanker Driver') {
      if (!form.license_number.trim()) return setError('Commercial Heavy Transport Driving License number is required.');
      if (!form.phone.trim()) return setError('Driver contact phone number is required.');
    } else if (activeRole === 'Dispatch Team Leader') {
      if (!form.badge_id.trim()) return setError('Official Field Crew Badge ID is required.');
      if (!form.phone.trim()) return setError('Dispatch contact phone number is required.');
    } else if (activeRole === 'Municipal Officer') {
      if (!form.officer_id.trim()) return setError('Officer Employee / Service ID is required.');
      if (!form.email.trim()) return setError('Official municipal government email is required.');
    }

    setLoading(true);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || `${form.name.trim().toLowerCase().replace(/\s+/g, '_')}@aquafair.local`,
      username: form.name.trim().toLowerCase().replace(/\s+/g, '_'),
      password: form.password,
      role: activeRole,
      phone: form.phone.trim(),
      address: activeRole === 'Citizen / Household' ? form.address.trim() : (form.depot_location || form.officer_jurisdiction || ''),
      ward: form.ward,
      zone_id: form.ward,
      members_count: Number(form.members_count || 4),
      household_id: activeRole === 'Citizen / Household' ? form.household_id : (form.badge_id || form.officer_id || `DRV-${form.license_number.slice(0, 8)}`),
      
      // Officer fields
      designation: form.designation,
      badge_id: activeRole === 'Municipal Officer' ? form.officer_id : form.badge_id,
      officer_passcode: form.officer_passcode,
      officer_jurisdiction: form.officer_jurisdiction,

      // Driver fields
      license_number: form.license_number.trim(),
      experience_years: Number(form.experience_years || 5),
      vehicle_no: form.vehicle_no,
      emergency_contact: form.emergency_contact,

      // Dispatch fields
      dispatch_role: form.dispatch_role,
      ward_assignment: form.ward_assignment
    };

    const res = await api.register(payload);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(`Registration Successful! Welcome to AquaFair as ${activeRole}. Redirecting to your console...`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
    } else {
      setError(res.error || 'Failed to register account. Please check all details and try again.');
    }
  }

  return (
    <div className="auth-page register-page-wrap">
      {/* Brand Header */}
      <div className="auth-brand">
        <div className="logo-mark" style={{ background: currentRoleConfig.bgGradient }}>
          <Droplets size={26} />
        </div>
        <div>
          <strong style={{ fontSize: '24px' }}>AquaBalance</strong>
          <span>Smart Equal Water Distribution & Municipal SCADA Grid</span>
        </div>
      </div>

      <div className="auth-card register-card-wide">
        {/* Header with Title and Eyebrow */}
        <div className="auth-heading text-center" style={{ marginBottom: '20px' }}>
          <div className="eyebrow" style={{ color: currentRoleConfig.color }}>
            OFFICIAL MUNICIPAL CREDENTIAL REGISTRATION
          </div>
          <h1 style={{ fontSize: '26px', marginTop: '6px', marginBottom: '6px' }}>
            Account Registration
          </h1>
          <p style={{ margin: '0 auto', maxWidth: '540px', fontSize: '13px', color: '#64748b' }}>
            Select your municipal jurisdiction role below to generate official system access credentials.
          </p>
        </div>

        {/* 4 Interactive Role Selector Cards */}
        <div className="registration-role-grid" role="tablist">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const isSelected = activeRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                className={`role-select-card ${isSelected ? 'active ' + r.accentClass : ''}`}
                onClick={() => {
                  setActiveRole(r.id);
                  setError('');
                }}
              >
                <div className="role-icon-box" style={{ background: isSelected ? r.bgGradient : '#f1f5f9', color: isSelected ? '#fff' : '#475569' }}>
                  <Icon size={20} />
                </div>
                <div className="role-card-info">
                  <div className="role-card-title">{r.title}</div>
                  <div className="role-card-marathi">{r.marathi}</div>
                  <div className="role-card-badge-pill">{r.badge}</div>
                </div>
                {isSelected && (
                  <div className="role-check-mark">
                    <CheckCircle2 size={16} color={r.color} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Authority / Role Description Card */}
        <div className={`role-preview-banner role-banner-${currentRoleConfig.key}`}>
          <div className="role-preview-icon">
            {React.createElement(currentRoleConfig.icon, { size: 22 })}
          </div>
          <div className="role-preview-content">
            <div className="role-preview-title">
              <strong>{currentRoleConfig.title} Authority</strong>
              <span className="badge-jurisdiction">{currentRoleConfig.badge}</span>
            </div>
            <p>{currentRoleConfig.desc}</p>
          </div>
        </div>

        {/* Registration Form */}
        <form className="form register-form-body" onSubmit={submit}>
          {error && (
            <div className="error-box" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="success-box" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '12px 14px', borderRadius: '10px', fontSize: '13px' }}>
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section: Basic Identity */}
          <div className="form-section-title">
            <span>👤 Personal & Contact Credentials</span>
          </div>

          <div className="form-row-2col">
            <label>
              <span>Full Legal / Official Name *</span>
              <div className="input-with-icon">
                <User size={16} className="input-field-icon" />
                <input
                  name="name"
                  required
                  value={form.name}
                  onChange={update}
                  placeholder={
                    activeRole === 'Municipal Officer' ? 'e.g. Er. Swapnil Mali' :
                    activeRole === 'Tanker Driver' ? 'e.g. Suresh Pawar' :
                    activeRole === 'Dispatch Team Leader' ? 'e.g. Suresh More' :
                    'e.g. Ramesh Patil'
                  }
                />
              </div>
            </label>

            <label>
              <span>Contact Mobile Phone *</span>
              <div className="input-with-icon">
                <Phone size={16} className="input-field-icon" />
                <input
                  name="phone"
                  type="tel"
                  required
                  value={form.phone}
                  onChange={update}
                  placeholder="e.g. 9822334455"
                />
              </div>
            </label>
          </div>

          <div className="form-row-2col">
            <label>
              <span>Official / Contact Email Address *</span>
              <div className="input-with-icon">
                <Mail size={16} className="input-field-icon" />
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={update}
                  placeholder={
                    activeRole === 'Municipal Officer' ? 'officer@nagarparishad.gov.in' :
                    activeRole === 'Tanker Driver' ? 'driver.fleet@aquafair.org' :
                    activeRole === 'Dispatch Team Leader' ? 'dispatch.repair@aquafair.org' :
                    'resident@aquafair.org'
                  }
                />
              </div>
            </label>

            {/* Role-specific second column field */}
            {activeRole === 'Municipal Officer' && (
              <label>
                <span>Officer Service / Badge ID *</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    name="officer_id"
                    required
                    value={form.officer_id}
                    onChange={update}
                    placeholder="e.g. NP-OFF-104"
                  />
                  <button type="button" className="btn-auto-gen" onClick={generateOfficerId} title="Generate official Officer ID">
                    🎲 Auto
                  </button>
                </div>
              </label>
            )}

            {activeRole === 'Tanker Driver' && (
              <label>
                <span>Commercial Heavy DL License *</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    name="license_number"
                    required
                    value={form.license_number}
                    onChange={update}
                    placeholder="e.g. MH14-2023-009112"
                  />
                  <button type="button" className="btn-auto-gen" onClick={generateLicenseNo} title="Generate valid test DL number">
                    🎲 Auto
                  </button>
                </div>
              </label>
            )}

            {activeRole === 'Dispatch Team Leader' && (
              <label>
                <span>Field Crew Badge ID *</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    name="badge_id"
                    required
                    value={form.badge_id}
                    onChange={update}
                    placeholder="e.g. NP-SUPV-08"
                  />
                  <button type="button" className="btn-auto-gen" onClick={generateCrewBadge} title="Generate official Crew Badge">
                    🎲 Auto
                  </button>
                </div>
              </label>
            )}

            {activeRole === 'Citizen / Household' && (
              <label>
                <span>Household Smart Meter ID</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    name="household_id"
                    value={form.household_id}
                    onChange={update}
                    placeholder="e.g. AF-W1-1042"
                  />
                  <button type="button" className="btn-auto-gen" onClick={generateHouseholdId} title="Generate unique household connection ID">
                    🎲 Auto
                  </button>
                </div>
              </label>
            )}
          </div>

          {/* ================= ROLE-SPECIFIC FIELD SECTIONS ================= */}

          {/* 1. MUNICIPAL OFFICER FIELDS */}
          {activeRole === 'Municipal Officer' && (
            <div className="role-fields-container role-fields-officer">
              <div className="form-section-title">
                <span>🏛️ Municipal Command & SCADA Jurisdiction</span>
              </div>

              <div className="form-row-2col">
                <label>
                  <span>Official Designation / Cadre *</span>
                  <select name="designation" value={form.designation} onChange={update}>
                    <option>Executive Engineer (Water Works & Headworks)</option>
                    <option>Municipal Water Supply Superintendent</option>
                    <option>Junior Engineer (Public Health Engineering)</option>
                    <option>Chief Officer (CO / Administrative Head)</option>
                    <option>Water Audit & Equity Verification Inspector</option>
                  </select>
                </label>

                <label>
                  <span>Headworks & Zone Jurisdiction *</span>
                  <select name="officer_jurisdiction" value={form.officer_jurisdiction} onChange={update}>
                    <option>Central Headworks ESR & All Wards</option>
                    {wardList.map(w => (
                      <option key={w.id} value={w.name}>
                        {w.name} (Direct Ward Oversight)
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                <span>Administrative Security Clearance Passcode *</span>
                <input
                  name="officer_passcode"
                  required
                  value={form.officer_passcode}
                  onChange={update}
                  placeholder="e.g. AQUA-NP-2026"
                />
                <small style={{ color: '#0284c7', fontSize: '11px', marginTop: '3px' }}>
                  Official municipal authorization key ensures privileged access to SCADA valve throttling and audit ledgers.
                </small>
              </label>
            </div>
          )}

          {/* 2. DISPATCH MEMBER FIELDS */}
          {activeRole === 'Dispatch Team Leader' && (
            <div className="role-fields-container role-fields-dispatch">
              <div className="form-section-title">
                <span>🔧 Squad Role & Operational Assignment</span>
              </div>

              <div className="form-row-2col">
                <label>
                  <span>Dispatch Squad Specialization *</span>
                  <select name="dispatch_role" value={form.dispatch_role} onChange={update}>
                    <option>Field Supervisor / Inspector</option>
                    <option>Valve Technician & Flow Attendant</option>
                    <option>Sanitation & Chlorination Crew</option>
                    <option>Security & Crowd Escort</option>
                    <option>Lead Pipeline Leak Inspector</option>
                  </select>
                </label>

                <label>
                  <span>Primary Ward Operations Area *</span>
                  <select name="ward_assignment" value={form.ward_assignment} onChange={update}>
                    <option>All Wards (Rapid Dispatch Unit)</option>
                    {wardList.map(w => (
                      <option key={w.id} value={w.name}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-row-2col">
                <label>
                  <span>Base Maintenance Depot / Workshop</span>
                  <input
                    name="depot_location"
                    value={form.depot_location}
                    onChange={update}
                    placeholder="e.g. Central Municipal Maintenance Depot"
                  />
                </label>

                <label>
                  <span>Emergency / Alternate Contact Phone</span>
                  <input
                    name="emergency_contact"
                    value={form.emergency_contact}
                    onChange={update}
                    placeholder="e.g. 9890112233"
                  />
                </label>
              </div>
            </div>
          )}

          {/* 3. TANKER DRIVER FIELDS */}
          {activeRole === 'Tanker Driver' && (
            <div className="role-fields-container role-fields-driver">
              <div className="form-section-title">
                <span>🚚 Fleet Assignment & Heavy Logistics</span>
              </div>

              <div className="form-row-2col">
                <label>
                  <span>Assigned Water Tanker Vehicle *</span>
                  <select name="vehicle_no" value={form.vehicle_no} onChange={update}>
                    {fleetList.map(t => (
                      <option key={t.vehicle_no} value={t.vehicle_no}>
                        {t.vehicle_no} — {t.tanker_name} ({Number(t.capacity_liters).toLocaleString()} L {t.model_make || ''})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Commercial Driving Experience (Years) *</span>
                  <input
                    name="experience_years"
                    type="number"
                    min="1"
                    max="40"
                    required
                    value={form.experience_years}
                    onChange={update}
                    placeholder="Years driving heavy commercial vehicles"
                  />
                </label>
              </div>

              <div className="form-row-2col">
                <label>
                  <span>Base Pumping Station Depot</span>
                  <input
                    name="driver_depot"
                    value={form.driver_depot}
                    onChange={update}
                    placeholder="e.g. Central Headworks ESR Pumping Station"
                  />
                </label>

                <label>
                  <span>Emergency Contact Phone</span>
                  <input
                    name="emergency_contact"
                    value={form.emergency_contact}
                    onChange={update}
                    placeholder="e.g. 9822001122"
                  />
                </label>
              </div>
            </div>
          )}

          {/* 4. CITIZEN / HOUSEHOLD FIELDS */}
          {activeRole === 'Citizen / Household' && (
            <div className="role-fields-container role-fields-citizen">
              <div className="form-section-title">
                <span>🏡 Household Connection & Fair Quota</span>
              </div>

              <div className="form-row-2col">
                <label>
                  <span>Municipal Ward / Sector (प्रभाग) *</span>
                  <select name="ward" required value={form.ward} onChange={update}>
                    {wardList.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Family Members Count (कुटुंबातील सदस्य) *</span>
                  <input
                    name="members_count"
                    type="number"
                    min="1"
                    max="25"
                    required
                    value={form.members_count}
                    onChange={update}
                  />
                </label>
              </div>

              <label>
                <span>Residential Address (घर क्रमांक, लेन / रस्ता) *</span>
                <input
                  name="address"
                  required
                  value={form.address}
                  onChange={update}
                  placeholder="e.g. House #42, Shivaji Chowk, Lane 2"
                />
              </label>

              <div className="quota-preview-card">
                <div className="quota-icon-wrap">
                  <Droplets size={20} color="#059669" />
                </div>
                <div>
                  <div className="quota-preview-text">
                    <strong>Assigned Equitable Daily Quota: {computedQuota} Liters / day</strong>
                  </div>
                  <div className="quota-subtext">
                    Calculated based on CPHEEO standard of 135 L/person/day for {form.members_count || 4} residents.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Security Passwords */}
          <div className="form-section-title">
            <span>🔒 Account Security</span>
          </div>

          <div className="form-row-2col">
            <label>
              <span>Password *</span>
              <div className="input-with-icon">
                <Lock size={16} className="input-field-icon" />
                <input
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={update}
                  placeholder="Min. 6 characters"
                />
              </div>
            </label>

            <label>
              <span>Confirm Password *</span>
              <div className="input-with-icon">
                <Lock size={16} className="input-field-icon" />
                <input
                  name="confirm"
                  type="password"
                  required
                  value={form.confirm}
                  onChange={update}
                  placeholder="Re-enter password"
                />
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <button 
            className="primary-btn submit-registration-btn" 
            type="submit" 
            disabled={loading}
            style={{ background: currentRoleConfig.bgGradient, marginTop: '8px', padding: '14px 20px', fontSize: '14px' }}
          >
            {loading ? (
              <span>Registering Official Credentials...</span>
            ) : (
              <>
                <BadgeCheck size={20} />
                <span>Register as {currentRoleConfig.title}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>

          <div className="form-switch text-center" style={{ marginTop: '16px' }}>
            Already have an active municipal credential?{' '}
            <button type="button" onClick={() => navigate('/login')} style={{ fontWeight: 700, color: currentRoleConfig.color }}>
              Sign In to Console
            </button>
          </div>
        </form>
      </div>

      <div className="auth-footer" style={{ marginTop: '24px', color: '#64748b', fontSize: '12px' }}>
        © 2026 AquaBalance • Official Municipal Water Distribution Grid
      </div>
    </div>
  );
}
