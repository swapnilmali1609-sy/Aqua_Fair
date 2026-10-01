import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Edit2, Check, X, Home, Clock, Sparkles, ShieldCheck,
  Plus, Trash2, Droplets, AlertTriangle, Search, ArrowLeft,
  CheckCircle2, Phone, MapPin, Send, Activity, UserPlus,
  Info, FileText, ChevronRight, ChevronLeft, ChevronsLeft, ChevronsRight, Filter, Download,
  UploadCloud, FileSpreadsheet, Building2, HelpCircle, Layers, Database, RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

export default function ZonesManagementView({
  zones = [],
  onUpdateZone,
  onAddZone,
  onDeleteZone,
  user,
  openAddWardRequested,
  onClearAddWardRequest,
  initialWardId,
  onClearInitialWardId,
  onRefreshAll
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ households_count: 250, target_liters: 125000, supply_timing: '', sector_type: '' });
  const [toast, setToast] = useState('');

  // Ward selection state - default to first ward on mount
  const [selectedWard, setSelectedWard] = useState(zones && zones.length > 0 ? zones[0] : null);
  const [hasInitializedWard, setHasInitializedWard] = useState(false);

  // Household data & filter states
  const [households, setHouseholds] = useState([]);
  const [loadingHouseholds, setLoadingHouseholds] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, high, abnormal, extra
  const [selectedLane, setSelectedLane] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25); // 25, 50, 100, 250, 'all'

  // Modals & drawers
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDemandsList, setShowDemandsList] = useState(false);
  const [demands, setDemands] = useState([]);
  const [loadingDemands, setLoadingDemands] = useState(false);

  // Form states for new household registration
  const [newHouseholdForm, setNewHouseholdForm] = useState({
    ward_id: 1,
    owner_name: '',
    household_id: '',
    address_or_lane: 'Lane 1',
    phone: '',
    members_count: 4,
    daily_quota_liters: 540,
    meter_status: 'Active'
  });

  // Add Ward Modal State & Form
  const [showAddWardModal, setShowAddWardModal] = useState(false);
  const [isSubmittingWard, setIsSubmittingWard] = useState(false);
  const [newWardForm, setNewWardForm] = useState({
    name: '',
    ward_number: 5,
    sector_type: 'Standard Residential Colony',
    elevation_tier: 'Standard',
    households_count: 200,
    per_family_liters: 500,
    target_liters: 100000,
    supply_timing: '06:00 AM - 08:30 AM',
    valve_percent: 90,
    flow_rate: 18.5,
    auto_seed_households: true,
    is_hardware_active: true,
    notes: ''
  });

  const isAdmin = user?.role === 'Municipal Officer' || user?.role === 'Administrator' || user?.role === 'Field Technician';
  const isOfficer = user?.role === 'Municipal Officer' || user?.role === 'Administrator' || !user?.role || user?.role?.includes('Officer');

  // Nagar Parishad (Municipal Council) Ingestion & Export Suite state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTab, setImportTab] = useState('upload'); // 'upload' | 'sample' | 'paste' | 'guide'
  const [wardsFileName, setWardsFileName] = useState('');
  const [householdsFileName, setHouseholdsFileName] = useState('');
  const [parsedWards, setParsedWards] = useState([]);
  const [parsedHouseholds, setParsedHouseholds] = useState([]);
  const [replaceMode, setReplaceMode] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [pasteType, setPasteType] = useState('households');

  // Trigger Add Ward modal if requested externally
  useEffect(() => {
    if (openAddWardRequested) {
      handleOpenAddWardModal();
      if (onClearAddWardRequest) onClearAddWardRequest();
    }
  }, [openAddWardRequested]);

  // Handle initialWardId passed from other views (e.g. Dashboard)
  useEffect(() => {
    if (initialWardId && zones && zones.length > 0) {
      const match = zones.find(z => z.id === initialWardId || z.ward_number === initialWardId || z.id === Number(initialWardId) || z.ward_number === Number(initialWardId));
      if (match) {
        setSelectedWard(match);
        setHasInitializedWard(true);
        if (onClearInitialWardId) onClearInitialWardId();
      }
    }
  }, [initialWardId, zones]);

  // Automatically default to the first ward on initial load and keep live telemetry synchronized
  useEffect(() => {
    if (zones && zones.length > 0) {
      if (!hasInitializedWard && !initialWardId) {
        setSelectedWard(zones[0]);
        setHasInitializedWard(true);
      } else if (selectedWard) {
        const liveZone = zones.find(z => z.id === selectedWard.id || z.ward_number === selectedWard.ward_number);
        if (liveZone && (
          liveZone.delivered_liters !== selectedWard.delivered_liters ||
          liveZone.valve_percent !== selectedWard.valve_percent ||
          liveZone.households_count !== selectedWard.households_count
        )) {
          setSelectedWard(prev => ({ ...prev, ...liveZone }));
        }
      }
    }
  }, [zones, hasInitializedWard, initialWardId]);

  // Load households whenever active ward changes (or load all 1,010 if selectedWard is null)
  useEffect(() => {
    if (selectedWard) {
      // Immediately clear households to prevent any stale cross-ward leakage while loading
      setHouseholds([]);
      const wardNum = selectedWard.ward_number ?? selectedWard.id;
      loadWardHouseholds(wardNum);
      loadWardDemands(wardNum);
    } else {
      // When in 'All Wards Quota Grid', load all municipal households city-wide
      loadWardHouseholds('all');
      loadWardDemands('all');
    }
    setPage(1);
    setSelectedLane('all');
  }, [selectedWard?.id, selectedWard?.ward_number]);

  const loadWardHouseholds = async (zoneId) => {
    setLoadingHouseholds(true);
    try {
      const data = await api.getHouseholds(zoneId);
      setHouseholds(data || []);
    } catch {
      setHouseholds([]);
    } finally {
      setLoadingHouseholds(false);
    }
  };

  const loadWardDemands = async (zoneId) => {
    setLoadingDemands(true);
    try {
      const data = await api.getDemands(zoneId);
      setDemands(data || []);
    } catch {
      setDemands([]);
    } finally {
      setLoadingDemands(false);
    }
  };

  const startEdit = (zone) => {
    setEditingId(zone.id);
    setEditForm({
      households_count: zone.households_count,
      target_liters: zone.target_liters,
      supply_timing: zone.supply_timing || '06:00 AM - 08:30 AM',
      sector_type: zone.sector_type || 'Residential'
    });
  };

  const saveEdit = (id) => {
    onUpdateZone(id, {
      households_count: Number(editForm.households_count),
      target_liters: Number(editForm.target_liters),
      supply_timing: editForm.supply_timing,
      sector_type: editForm.sector_type
    });
    setEditingId(null);
    setToast('Community fair quota parameters updated successfully.');
    setTimeout(() => setToast(''), 3000);
  };

  const purgeZone = (name) => {
    setToast(`Feeder pressure test initiated for ${name} (testing line integrity for 10 seconds).`);
    setTimeout(() => setToast(''), 3500);
  };

  // Open Add Ward Modal Setup
  const handleOpenAddWardModal = () => {
    const nextWardNum = zones && zones.length > 0 
      ? Math.max(...zones.map(z => Number(z.ward_number || z.id) || 0)) + 1 
      : 1;
    const defaultHH = 200;
    const defaultPerFamily = 500;
    setNewWardForm({
      name: `Ward ${nextWardNum} - `,
      ward_number: nextWardNum,
      sector_type: 'Standard Residential Colony',
      elevation_tier: 'Standard',
      households_count: defaultHH,
      per_family_liters: defaultPerFamily,
      target_liters: defaultHH * defaultPerFamily,
      supply_timing: '06:00 AM - 08:30 AM',
      valve_percent: 90,
      flow_rate: 18.5,
      auto_seed_households: true,
      is_hardware_active: true,
      notes: ''
    });
    setShowAddWardModal(true);
  };

  const handleToggleHardwareActive = async (zone) => {
    try {
      await api.updateZone(zone.id, { is_hardware_active: true });
      setToast(`Operations focused exclusively on ${zone.name} (Ward #${zone.ward_number}). Previous wards set to Standby/Completed.`);
      if (onRefreshAll) onRefreshAll();
      setTimeout(() => setToast(''), 4000);
    } catch {
      setToast('Failed to switch hardware focus.');
      setTimeout(() => setToast(''), 3000);
    }
  };

  const handleWardHHChange = (hh) => {
    const count = Math.max(1, Number(hh) || 1);
    setNewWardForm(prev => ({
      ...prev,
      households_count: count,
      target_liters: count * prev.per_family_liters
    }));
  };

  const handleWardPerFamilyChange = (liters) => {
    const quota = Math.max(100, Number(liters) || 100);
    setNewWardForm(prev => ({
      ...prev,
      per_family_liters: quota,
      target_liters: prev.households_count * quota
    }));
  };

  const handleCreateWardSubmit = async (e) => {
    e.preventDefault();
    if (!newWardForm.name.trim()) {
      setToast('Please enter a valid Ward and Sector name.');
      return;
    }

    setIsSubmittingWard(true);
    try {
      const payload = {
        name: newWardForm.name.trim(),
        ward_number: Number(newWardForm.ward_number) || (zones.length + 1),
        sector_type: newWardForm.sector_type,
        elevation_tier: newWardForm.elevation_tier,
        households_count: Number(newWardForm.households_count) || 200,
        target_liters: Number(newWardForm.target_liters) || (Number(newWardForm.households_count) * Number(newWardForm.per_family_liters)),
        delivered_liters: 0,
        flow_rate: Number(newWardForm.flow_rate) || 18.5,
        valve_percent: Number(newWardForm.valve_percent) || 90,
        status: 'Balanced',
        supply_timing: newWardForm.supply_timing || '06:00 AM - 08:30 AM',
        order: Number(newWardForm.ward_number) || (zones.length + 1),
        notes: newWardForm.notes || '',
        auto_seed_households: Boolean(newWardForm.auto_seed_households),
        is_hardware_active: Boolean(newWardForm.is_hardware_active)
      };

      let created = null;
      if (onAddZone) {
        created = await onAddZone(payload);
      } else {
        created = await api.createZone(payload);
      }

      if (created) {
        setShowAddWardModal(false);
        setSelectedWard(created);
        if (onRefreshAll) onRefreshAll();
        setToast(newWardForm.is_hardware_active
          ? `Ward "${created.name}" (Ward #${created.ward_number}) registered! SCADA operations isolated exclusively to this new ward.`
          : `Ward "${created.name}" (Ward #${created.ward_number}) registered successfully with ${created.households_count} households!`
        );
        setTimeout(() => setToast(''), 4000);
      }
    } catch {
      setToast('Failed to register ward. Please verify inputs and try again.');
      setTimeout(() => setToast(''), 4000);
    } finally {
      setIsSubmittingWard(false);
    }
  };

  const handleDeleteWard = async (zoneToDelete) => {
    if (!window.confirm(`Are you sure you want to decommission "${zoneToDelete.name}" (Ward #${zoneToDelete.ward_number})? All associated household telemetry will be removed from the SCADA monitoring grid.`)) {
      return;
    }

    try {
      if (onDeleteZone) {
        await onDeleteZone(zoneToDelete.id, zoneToDelete.name);
      } else {
        await api.deleteZone(zoneToDelete.id);
      }
      if (selectedWard?.id === zoneToDelete.id) {
        const remaining = zones.filter(z => z.id !== zoneToDelete.id);
        setSelectedWard(remaining.length > 0 ? remaining[0] : null);
      }
      setToast(`Ward "${zoneToDelete.name}" decommissioned successfully.`);
      setTimeout(() => setToast(''), 3500);
    } catch {
      setToast('Failed to delete ward.');
      setTimeout(() => setToast(''), 3500);
    }
  };

  // Open Ward Households View
  const handleOpenWard = (zone) => {
    setSelectedWard(zone);
    setSearchQuery('');
    setFilterType('all');
    setSelectedLane('all');
    setPage(1);
  };

  // Add Household Connection Modal Setup
  const handleOpenAddModal = () => {
    const wardNum = selectedWard ? (selectedWard.ward_number || selectedWard.id) : 1;
    const randomId = `AF-W${wardNum}-${Math.floor(1000 + Math.random() * 9000)}`;
    setNewHouseholdForm({
      ward_id: selectedWard ? selectedWard.id : (zones[0]?.id || 1),
      owner_name: '',
      household_id: randomId,
      address_or_lane: 'Lane 1',
      phone: '',
      members_count: 4,
      daily_quota_liters: 540, // 4 * 135 L
      meter_status: 'Active'
    });
    setShowAddModal(true);
  };

  const handleMembersChange = (count) => {
    const num = Math.max(1, Number(count) || 1);
    setNewHouseholdForm(prev => ({
      ...prev,
      members_count: num,
      daily_quota_liters: num * 135
    }));
  };

  const handleCreateHousehold = async (e) => {
    e.preventDefault();
    if (!newHouseholdForm.owner_name.trim()) {
      setToast('Please enter the resident or family owner name');
      return;
    }

    const targetWard = selectedWard || zones.find(z => z.id === Number(newHouseholdForm.ward_id)) || zones[0] || { id: 1, ward_number: 1, name: 'Ward 1 - Shivaji Nagar' };

    try {
      const payload = {
        ...newHouseholdForm,
        zone: targetWard.id,
        zone_id: targetWard.id,
        current_usage_liters: Math.round(Number(newHouseholdForm.daily_quota_liters) * 0.65)
      };

      const created = await api.createHousehold(payload);
      setHouseholds(prev => [created, ...prev]);

      // Update ward households count
      if (selectedWard && (selectedWard.id === targetWard.id || selectedWard.ward_number === targetWard.ward_number)) {
        const newCount = (selectedWard.households_count || households.length) + 1;
        setSelectedWard(prev => ({ ...prev, households_count: newCount }));
        if (onUpdateZone) {
          onUpdateZone(selectedWard.id, { households_count: newCount });
        }
      }

      setShowAddModal(false);
      setToast(`Household ${created.household_id} (${created.owner_name}) registered successfully!`);
      setTimeout(() => setToast(''), 3500);
    } catch {
      setToast('Failed to register household. Please try again.');
      setTimeout(() => setToast(''), 3500);
    }
  };

  // Delete Household
  const handleDeleteHousehold = async (household) => {
    if (!window.confirm(`Are you sure you want to remove connection ${household.household_id} (${household.owner_name}) from the municipal ledger?`)) {
      return;
    }

    try {
      await api.deleteHousehold(household.id);
      setHouseholds(prev => prev.filter(h => h.id !== household.id));

      if (selectedWard) {
        const newCount = Math.max(0, (selectedWard.households_count || households.length) - 1);
        setSelectedWard(prev => ({ ...prev, households_count: newCount }));
        if (onUpdateZone) {
          onUpdateZone(selectedWard.id, { households_count: newCount });
        }
      }

      setToast(`Household ${household.household_id} successfully deleted from ledger.`);
      setTimeout(() => setToast(''), 3500);
    } catch {
      setToast('Failed to delete household.');
      setTimeout(() => setToast(''), 3500);
    }
  };

  const handleApproveDemand = async (demandId) => {
    try {
      await api.approveDemand(demandId);
      const wardId = selectedWard ? (selectedWard.id ?? selectedWard.ward_number ?? 1) : 'all';
      loadWardHouseholds(wardId);
      loadWardDemands(wardId);
      setToast('Water demand approved! Extra quota dispatched to household tap.');
      setTimeout(() => setToast(''), 3500);
    } catch {
      setToast('Failed to approve demand.');
      setTimeout(() => setToast(''), 3500);
    }
  };

  // ================= NAGAR PARISHAD DATA INGESTION & EXPORT UTILITIES ================= //

  const downloadBlob = (content, filename, mimeType = 'text/csv;charset=utf-8;') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export current ward's household roster to CSV
  const handleExportWardCSV = () => {
    const targetList = filteredHouseholds.length > 0 ? filteredHouseholds : households;
    if (!targetList || targetList.length === 0) {
      setToast('No household records found in current view to export.');
      setTimeout(() => setToast(''), 3000);
      return;
    }

    const wardTitle = selectedWard ? (selectedWard.name || `Ward_${selectedWard.ward_number}`).replace(/[^a-zA-Z0-9]/g, '_') : 'All_Wards_City_Wide';
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `AquaFair_${wardTitle}_Households_${dateStr}.csv`;

    const headers = [
      'Ward Number',
      'Ward Name',
      'Consumer Household ID',
      'Owner / Resident Name',
      'Address / Lane',
      'Phone / Mobile',
      'Family Members',
      'Daily Quota Liters',
      'Current Usage Liters',
      'Usage Percentage',
      'Meter Status',
      'Suction Pump Flagged',
      'Extra Water Granted Liters'
    ];

    const rows = targetList.map(h => [
      h.ward_number || (selectedWard ? selectedWard.ward_number : 1),
      `"${(h.zone_name || (selectedWard ? selectedWard.name : `Ward ${h.ward_number || 1}`)).replace(/"/g, '""')}"`,
      `"${h.household_id}"`,
      `"${(h.owner_name || '').replace(/"/g, '""')}"`,
      `"${(h.address_or_lane || '').replace(/"/g, '""')}"`,
      `"${h.phone || ''}"`,
      h.members_count || 4,
      h.daily_quota_liters || 540,
      h.current_usage_liters || 0,
      `${Math.round(((h.current_usage_liters || 0) / (h.daily_quota_liters || 540)) * 100)}%`,
      h.meter_status || 'Active',
      h.abnormal_draw ? 'Yes (Suction Motor Flagged)' : 'No',
      h.extra_water_granted || 0
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    downloadBlob(csvContent, filename);
    setToast(`Exported ${targetList.length} household records to ${filename}`);
    setTimeout(() => setToast(''), 3500);
  };

  // Export full municipal backup
  const handleExportAllNagarParishadBackup = async () => {
    try {
      const data = await api.exportNagarParishadData('all');
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `AquaFair_NagarParishad_Master_Backup_${dateStr}.json`;
      downloadBlob(JSON.stringify(data, null, 2), filename, 'application/json');
      setToast(`Downloaded complete Nagar Parishad backup (${data.total_wards || 0} Wards, ${data.total_households || 0} Households)`);
      setTimeout(() => setToast(''), 3500);
    } catch {
      setToast('Failed to export Nagar Parishad backup.');
      setTimeout(() => setToast(''), 3500);
    }
  };

  // Download official CSV templates
  const handleDownloadWardsTemplate = () => {
    const content = '\uFEFF' + [
      'ward_number,ward_name,sector_type,elevation_tier,supply_timing,households_count,target_liters',
      '1,Ward 1 - Shivaji Nagar,Residential Lowland,Lowland,06:00 AM - 08:30 AM,250,125000',
      '2,Ward 2 - Gandhi Chowk,Market & Residential,Standard,06:00 AM - 08:30 AM,280,140000',
      '3,Ward 3 - Subhash Tekdi,Elevated Ridge Mohalla,High-Altitude,06:00 AM - 08:30 AM,220,110000',
      '4,Ward 4 - Dr. Ambedkar Nagar,Tail-End Colony,Tail-End,06:00 AM - 08:30 AM,260,130000',
      '5,Ward 5 - Shahu Maharaj Colony,Standard Residential Colony,Standard,06:00 AM - 08:30 AM,200,100000'
    ].join('\r\n');
    downloadBlob(content, 'NagarParishad_Wards_Template.csv');
    setToast('Downloaded Wards CSV Template (Excel ready)');
    setTimeout(() => setToast(''), 3000);
  };

  const handleDownloadHouseholdsTemplate = () => {
    const content = '\uFEFF' + [
      'ward_number,household_id,owner_name,address_or_lane,phone,members_count,daily_quota_liters,meter_status',
      '1,NP-W1-1001,Ramesh Patil,House #1, Shivaji Main Road,9822011001,4,540,Active',
      '1,NP-W1-1002,Sunita Deshmukh,House #2, Shivaji Chowk Lane 1,9822011002,5,675,Active',
      '1,NP-W1-1003,Ganesh Jadhav,House #3, Near Maruti Mandir,9822011003,3,405,Active',
      '2,NP-W2-2001,Prakash Shinde,House #1, Gandhi Chowk Road,9822022001,4,540,Active',
      '2,NP-W2-2002,Meena Kadam,House #2, Mandi Bazar Lane,9822022002,6,810,Active',
      '3,NP-W3-3001,Deepak Bhosale,House #1, Upper Ridge Road,9822033001,4,540,Active',
      '3,NP-W3-3002,Kavita Pawar,House #2, High-Tank Slope Path,9822033002,4,540,Active',
      '4,NP-W4-4001,Sachin Chavan,House #1, Ambedkar Chowk Main,9822044001,5,675,Active',
      '4,NP-W4-4002,Sneha Gaikwad,House #2, Samata Nagar Lane 1,9822044002,4,540,Active',
      '5,NP-W5-5001,Amol More,House #1, Shahu Colony Main,9822055001,4,540,Active',
      '5,NP-W5-5002,Priyanka Kulkarni,House #2, Shahu Maharaj Lane 2,9822055002,3,405,Active'
    ].join('\r\n');
    downloadBlob(content, 'NagarParishad_Households_Template.csv');
    setToast('Downloaded Households CSV Template (Excel ready)');
    setTimeout(() => setToast(''), 3000);
  };

  // Robust CSV / TSV text parser
  const parseCSVText = (text) => {
    if (!text) return [];
    const clean = text.replace(/^\uFEFF/, '').trim();
    const lines = clean.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const parseLine = (line) => {
      const isTab = line.indexOf('\t') !== -1 && line.indexOf(',') === -1;
      const delimiter = isTab ? '\t' : ',';
      const cells = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          cells.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      cells.push(current.trim());
      return cells;
    };

    const rawHeaders = parseLine(lines[0]);
    const headers = rawHeaders.map(h => h.toLowerCase().trim().replace(/[^a-z0-9_]/g, '_'));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
      const item = {};
      headers.forEach((key, idx) => {
        item[key] = values[idx] !== undefined ? values[idx] : '';
      });
      rows.push(item);
    }
    return rows;
  };

  const handleWardsFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWardsFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseCSVText(event.target.result);
        setParsedWards(parsed);
        setToast(`Parsed ${parsed.length} Wards from ${file.name}`);
        setTimeout(() => setToast(''), 3000);
      } catch {
        setToast('Failed to parse Wards CSV file. Please check format.');
        setTimeout(() => setToast(''), 3500);
      }
    };
    reader.readAsText(file);
  };

  const handleHouseholdsFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHouseholdsFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseCSVText(event.target.result);
        setParsedHouseholds(parsed);
        setToast(`Parsed ${parsed.length} Households from ${file.name}`);
        setTimeout(() => setToast(''), 3000);
      } catch {
        setToast('Failed to parse Households CSV file. Please check format.');
        setTimeout(() => setToast(''), 3500);
      }
    };
    reader.readAsText(file);
  };

  const handleParsePastedText = () => {
    if (!pasteText.trim()) {
      setToast('Please paste CSV or tabular rows first.');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    try {
      const records = parseCSVText(pasteText);
      if (records.length === 0) {
        setToast('No valid rows detected. Ensure header row is present.');
        setTimeout(() => setToast(''), 3000);
        return;
      }
      if (pasteType === 'wards') {
        setParsedWards(records);
        setWardsFileName(`Pasted Wards (${records.length} rows)`);
        setToast(`Parsed ${records.length} Wards successfully!`);
      } else {
        setParsedHouseholds(records);
        setHouseholdsFileName(`Pasted Households (${records.length} rows)`);
        setToast(`Parsed ${records.length} Households successfully!`);
      }
      setImportTab('upload');
      setTimeout(() => setToast(''), 3500);
    } catch {
      setToast('Failed to parse pasted text. Please verify columns.');
      setTimeout(() => setToast(''), 3500);
    }
  };

  const handleLoadSampleShirpur = () => {
    const sampleWards = [
      { ward_number: 1, name: 'Ward 1 - Shivaji Nagar', sector_type: 'Residential Lowland', elevation_tier: 'Lowland', supply_timing: '06:00 AM - 08:30 AM', households_count: 250, target_liters: 125000 },
      { ward_number: 2, name: 'Ward 2 - Gandhi Chowk', sector_type: 'Market & Residential', elevation_tier: 'Standard', supply_timing: '06:00 AM - 08:30 AM', households_count: 280, target_liters: 140000 },
      { ward_number: 3, name: 'Ward 3 - Subhash Tekdi', sector_type: 'Elevated Ridge Mohalla', elevation_tier: 'High-Altitude', supply_timing: '06:00 AM - 08:30 AM', households_count: 220, target_liters: 110000 },
      { ward_number: 4, name: 'Ward 4 - Dr. Ambedkar Nagar', sector_type: 'Tail-End Colony', elevation_tier: 'Tail-End', supply_timing: '06:00 AM - 08:30 AM', households_count: 260, target_liters: 130000 },
      { ward_number: 5, name: 'Ward 5 - Shahu Maharaj Colony', sector_type: 'Standard Residential Colony', elevation_tier: 'Standard', supply_timing: '06:00 AM - 08:30 AM', households_count: 200, target_liters: 100000 }
    ];

    const sampleHouseholds = [
      { ward_number: 1, household_id: 'NP-W1-1001', owner_name: 'Ramesh Patil', address_or_lane: 'House #1, Shivaji Main Road', phone: '9822011001', members_count: 4, daily_quota_liters: 540, meter_status: 'Active' },
      { ward_number: 1, household_id: 'NP-W1-1002', owner_name: 'Sunita Deshmukh', address_or_lane: 'House #2, Shivaji Chowk Lane 1', phone: '9822011002', members_count: 5, daily_quota_liters: 675, meter_status: 'Active' },
      { ward_number: 1, household_id: 'NP-W1-1003', owner_name: 'Ganesh Jadhav', address_or_lane: 'House #3, Near Maruti Mandir', phone: '9822011003', members_count: 3, daily_quota_liters: 405, meter_status: 'Active' },
      { ward_number: 2, household_id: 'NP-W2-2001', owner_name: 'Prakash Shinde', address_or_lane: 'House #1, Gandhi Chowk Road', phone: '9822022001', members_count: 4, daily_quota_liters: 540, meter_status: 'Active' },
      { ward_number: 2, household_id: 'NP-W2-2002', owner_name: 'Meena Kadam', address_or_lane: 'House #2, Mandi Bazar Lane', phone: '9822022002', members_count: 6, daily_quota_liters: 810, meter_status: 'Active' },
      { ward_number: 3, household_id: 'NP-W3-3001', owner_name: 'Deepak Bhosale', address_or_lane: 'House #1, Upper Ridge Road', phone: '9822033001', members_count: 4, daily_quota_liters: 540, meter_status: 'Active' },
      { ward_number: 3, household_id: 'NP-W3-3002', owner_name: 'Kavita Pawar', address_or_lane: 'House #2, High-Tank Slope Path', phone: '9822033002', members_count: 4, daily_quota_liters: 540, meter_status: 'Active' },
      { ward_number: 4, household_id: 'NP-W4-4001', owner_name: 'Sachin Chavan', address_or_lane: 'House #1, Ambedkar Chowk Main', phone: '9822044001', members_count: 5, daily_quota_liters: 675, meter_status: 'Active' },
      { ward_number: 4, household_id: 'NP-W4-4002', owner_name: 'Sneha Gaikwad', address_or_lane: 'House #2, Samata Nagar Lane 1', phone: '9822044002', members_count: 4, daily_quota_liters: 540, meter_status: 'Active' },
      { ward_number: 5, household_id: 'NP-W5-5001', owner_name: 'Amol More', address_or_lane: 'House #1, Shahu Colony Main', phone: '9822055001', members_count: 4, daily_quota_liters: 540, meter_status: 'Active' },
      { ward_number: 5, household_id: 'NP-W5-5002', owner_name: 'Priyanka Kulkarni', address_or_lane: 'House #2, Shahu Maharaj Lane 2', phone: '9822055002', members_count: 3, daily_quota_liters: 405, meter_status: 'Active' }
    ];

    setParsedWards(sampleWards);
    setParsedHouseholds(sampleHouseholds);
    setWardsFileName('Sample_NagarParishad_Wards.csv (5 Wards Loaded)');
    setHouseholdsFileName('Sample_NagarParishad_Households.csv (11 Sample Connections Loaded)');
    setImportTab('upload');
    setToast('Sample Nagar Parishad dataset loaded into preview!');
    setTimeout(() => setToast(''), 3000);
  };

  const handleExecuteImport = async () => {
    if (parsedWards.length === 0 && parsedHouseholds.length === 0) {
      setToast('Please upload or paste at least one Wards or Households dataset.');
      setTimeout(() => setToast(''), 3500);
      return;
    }

    setIsImporting(true);
    try {
      const result = await api.importNagarParishadData({
        wards: parsedWards,
        households: parsedHouseholds,
        replaceAll: replaceMode
      });

      if (result && result.success !== false) {
        setShowImportModal(false);
        setToast(`Nagar Parishad Data Ingested! (${result.imported_wards_count || parsedWards.length} Wards, ${result.imported_households_count || parsedHouseholds.length} Households)`);
        setTimeout(() => setToast(''), 4500);

        if (onRefreshAll) {
          await onRefreshAll();
        }

        // If replace mode, set selected ward to the first imported ward
        if (parsedWards.length > 0) {
          const firstW = parsedWards[0];
          setSelectedWard({
            id: Number(firstW.ward_number || 1),
            ward_number: Number(firstW.ward_number || 1),
            name: firstW.name || `Ward ${firstW.ward_number || 1}`
          });
        }

        const wardId = selectedWard ? (selectedWard.ward_number ?? selectedWard.id) : (parsedWards[0]?.ward_number || 1);
        loadWardHouseholds(wardId);
        loadWardDemands(wardId);
      } else {
        setToast(result?.error || 'Failed to import Nagar Parishad data.');
        setTimeout(() => setToast(''), 4000);
      }
    } catch (err) {
      setToast('Error importing Nagar Parishad records: ' + (err.message || 'Network/Server error'));
      setTimeout(() => setToast(''), 4000);
    } finally {
      setIsImporting(false);
    }
  };

  // Extract unique available lanes for filtering
  const availableLanes = useMemo(() => {
    const laneSet = new Set();
    households.forEach(h => {
      if (h.address_or_lane) {
        const parts = h.address_or_lane.split(',');
        const laneStr = parts.length > 1 ? parts[1].trim() : parts[0].trim();
        if (laneStr) laneSet.add(laneStr);
      }
    });
    return Array.from(laneSet).sort();
  }, [households]);

  // Filter households by search, lane, and meter status - WITH ABSOLUTE WARD ISOLATION
  const filteredHouseholds = useMemo(() => {
    return households.filter(h => {
      // 1. STRICT WARD ISOLATION: When a ward is selected, show ONLY houses from that ward
      if (selectedWard) {
        const wNum = Number(selectedWard.ward_number ?? selectedWard.id);
        const wId = Number(selectedWard.id);
        const belongsToWard =
          Number(h.zone) === wId ||
          Number(h.ward_number) === wNum ||
          Number(h.zone) === wNum ||
          (h.zone_name && h.zone_name.toLowerCase().includes(`ward ${wNum}`));
        if (!belongsToWard) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        h.owner_name?.toLowerCase().includes(q) ||
        h.household_id?.toLowerCase().includes(q) ||
        (h.address_or_lane && h.address_or_lane.toLowerCase().includes(q)) ||
        (h.phone && h.phone.includes(q));

      if (!matchesSearch) return false;

      if (selectedLane !== 'all' && h.address_or_lane) {
        if (!h.address_or_lane.toLowerCase().includes(selectedLane.toLowerCase())) {
          return false;
        }
      }

      if (filterType === 'all') return true;
      if (filterType === 'high') {
        const quota = (h.daily_quota_liters || 540) + (h.extra_water_granted || 0);
        const percent = quota > 0 ? (h.current_usage_liters / quota) * 100 : 0;
        return percent >= 85;
      }
      if (filterType === 'abnormal') return Boolean(h.abnormal_draw);
      if (filterType === 'extra') return (h.extra_water_granted || 0) > 0;
      return true;
    });
  }, [households, selectedWard, searchQuery, selectedLane, filterType]);

  // Pagination calculation
  const isAllPages = pageSize === 'all';
  const numPageSize = isAllPages ? Math.max(1, filteredHouseholds.length) : Number(pageSize);
  const totalPages = isAllPages ? 1 : Math.max(1, Math.ceil(filteredHouseholds.length / numPageSize));
  const validPage = Math.min(Math.max(1, page), totalPages);

  const paginatedHouseholds = useMemo(() => {
    if (isAllPages) return filteredHouseholds;
    const start = (validPage - 1) * numPageSize;
    return filteredHouseholds.slice(start, start + numPageSize);
  }, [filteredHouseholds, isAllPages, validPage, numPageSize]);

  const startRecord = filteredHouseholds.length === 0 ? 0 : (validPage - 1) * numPageSize + 1;
  const endRecord = isAllPages ? filteredHouseholds.length : Math.min(validPage * numPageSize, filteredHouseholds.length);

  // Render Households Ledger (Reused for both selected ward and city-wide overview)
  const renderHouseholdsLedger = (isCityWide = false) => {
    return (
      <div className="households-table-card">
        {/* Table Header Bar */}
        <div className="households-table-card-header">
          <div className="table-header-title">
            <Users size={16} className="text-teal" />
            <h4>
              {isCityWide 
                ? 'City-Wide Municipal Distribution Ledger (All Wards)' 
                : `All Connected Households in ${selectedWard.name}`}
            </h4>
            <span className="table-count-badge">
              {isCityWide 
                ? `${households.length} Connected Families Municipal-Wide` 
                : `${selectedWard.households_count || households.length} Homes in Ward`}
            </span>
            {(filterType !== 'all' || searchQuery || selectedLane !== 'all') && (
              <button
                className="btn-reset-filters-link"
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('all');
                  setSelectedLane('all');
                  setPage(1);
                }}
              >
                (Show All {households.length} Households)
              </button>
            )}
          </div>
          <span className="fairness-index-badge">
            {isCityWide 
              ? 'City-Wide Quota: 5,05,000 L / day' 
              : `AquaFair Equity Index: ${selectedWard.equity_score || 99.1}%`}
          </span>
        </div>

        {/* Action & Filter Bar */}
        <div className="households-toolbar">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={isCityWide ? "Search all 1,010 houses by resident name, lane, ID, or phone..." : `Search all houses in ${selectedWard?.name} by resident name, lane, ID, or phone...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
            {searchQuery && (
              <button className="btn-clear-search" onClick={() => { setSearchQuery(''); setPage(1); }}>
                <X size={14} />
              </button>
            )}
          </div>

          {availableLanes.length > 0 && (
            <div className="lane-select-box">
              <MapPin size={14} className="lane-select-icon" />
              <select
                value={selectedLane}
                onChange={(e) => {
                  setSelectedLane(e.target.value);
                  setPage(1);
                }}
                className="lane-dropdown"
              >
                <option value="all">All Lanes & Gallis ({availableLanes.length})</option>
                {availableLanes.map(lane => (
                  <option key={lane} value={lane}>{lane}</option>
                ))}
              </select>
            </div>
          )}

          <div className="filter-pill-group-mini">
            {[
              { id: 'all', label: `All (${households.length})` },
              { id: 'high', label: 'High Usage (>85%)' },
              { id: 'abnormal', label: 'Suction Pump Flagged' },
              { id: 'extra', label: 'Extra Water Granted' },
            ].map(f => (
              <button
                key={f.id}
                className={`filter-btn-mini ${filterType === f.id ? 'active' : ''}`}
                onClick={() => {
                  setFilterType(f.id);
                  setPage(1);
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="toolbar-actions">
            <button className="btn-export-ward-mini" onClick={handleExportWardCSV} title="Export Household Ledger to CSV">
              <Download size={15} />
              <span>Export CSV</span>
            </button>
            <button className="btn-add-household" onClick={handleOpenAddModal}>
              <Plus size={16} /> Add Household
            </button>
            <button
              className={`btn-demands-toggle ${showDemandsList ? 'active' : ''}`}
              onClick={() => setShowDemandsList(!showDemandsList)}
              title="View Extra Water Requests"
            >
              <FileText size={16} />
              <span>Demands ({demands.length})</span>
            </button>
          </div>
        </div>

        {/* ACTIVE DEMANDS ACCORDION / DRAWER */}
        {showDemandsList && (
          <div className="demands-accordion-card">
            <div className="demands-header">
              <div>
                <h4>Water Demand Requests {isCityWide ? '(City-Wide)' : `for ${selectedWard?.name}`}</h4>
                <p>Household requests requiring municipal authorization</p>
              </div>
              <button className="btn-icon-subtle" onClick={() => setShowDemandsList(false)}><X size={16} /></button>
            </div>

            {demands.length === 0 ? (
              <div className="empty-demands-box">
                <CheckCircle2 size={32} className="text-emerald" />
                <p>No active extra water requests. All households operating within standard daily quotas.</p>
              </div>
            ) : (
              <div className="demands-table-wrapper">
                <table className="demands-table">
                  <thead>
                    <tr>
                      <th>Requester / Household</th>
                      {isCityWide && <th>Ward</th>}
                      <th>Extra Volume</th>
                      <th>Reason</th>
                      <th>Urgency</th>
                      <th>Requested At</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demands.map(demand => (
                      <tr key={demand.id}>
                        <td>
                          <strong>{demand.requested_by}</strong>
                          {demand.household_code && (
                            <span className="code-subtext">{demand.household_code}</span>
                          )}
                        </td>
                        {isCityWide && (
                          <td>
                            <span className="ward-pill-badge">{demand.zone_name || `Ward ${demand.zone}`}</span>
                          </td>
                        )}
                        <td>
                          <strong className="text-teal">+{demand.extra_liters} Liters</strong>
                        </td>
                        <td>{demand.reason}</td>
                        <td>
                          <span className={`urgency-pill ${demand.urgency ? demand.urgency.toLowerCase() : 'normal'}`}>
                            {demand.urgency || 'Normal'}
                          </span>
                        </td>
                        <td>
                          <span className="timestamp-text">
                            {demand.created_at ? new Date(demand.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </span>
                        </td>
                        <td>
                          <span className={`demand-status-pill ${demand.status === 'Approved' ? 'status-approved' : 'status-pending'}`}>
                            {demand.status === 'Approved' ? <Check size={12} /> : <Clock size={12} />}
                            <span>{demand.status}</span>
                          </span>
                        </td>
                        <td>
                          {demand.status === 'Pending' ? (
                            <button
                              className="btn-approve-demand"
                              onClick={() => handleApproveDemand(demand.id)}
                            >
                              Approve & Dispatch
                            </button>
                          ) : (
                            <span className="text-emerald font-bold text-xs">Quota Dispatched</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* LOADING & EMPTY STATES */}
        {loadingHouseholds ? (
          <div className="loading-households-state">
            <Clock className="animate-spin text-teal" size={32} />
            <p>Loading {isCityWide ? 'all municipal' : selectedWard?.name} household meters...</p>
          </div>
        ) : filteredHouseholds.length === 0 ? (
          <div className="empty-households-state">
            <Home size={40} className="text-slate-300" />
            <h4>No households found matching your search</h4>
            <p>Try resetting search filters or register a new household connection below.</p>
            <button className="btn-primary-action" onClick={handleOpenAddModal} style={{ marginTop: 12 }}>
              <Plus size={16} /> Register First Household
            </button>
          </div>
        ) : (
          <>
            <div className="households-table-responsive">
              <table className="households-table">
                <thead>
                  <tr>
                    <th>Connection ID</th>
                    <th>Resident & Family Name</th>
                    {isCityWide && <th>Municipal Ward</th>}
                    <th>Address / Lane</th>
                    <th>Family Size</th>
                    <th>Daily Water Consumption vs Quota</th>
                    <th>Smart Meter Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedHouseholds.map(h => {
                    const totalQuota = (h.daily_quota_liters || 540) + (h.extra_water_granted || 0);
                    const usage = h.current_usage_liters || 0;
                    const percent = totalQuota > 0 ? Math.round((usage / totalQuota) * 100) : 0;
                    const isHigh = percent >= 85 && percent <= 100;
                    const isExcess = percent > 100 || h.abnormal_draw;

                    return (
                      <tr key={h.id} className={h.abnormal_draw ? 'row-abnormal-draw' : ''}>
                        {/* Connection ID */}
                        <td>
                          <div className="household-id-badge">
                            <Home size={13} />
                            <strong>{h.household_id}</strong>
                          </div>
                        </td>

                        {/* Owner Name */}
                        <td>
                          <div className="resident-info-cell">
                            <strong>{h.owner_name}</strong>
                            {h.phone && <small className="phone-subtext"><Phone size={10} style={{ display: 'inline', marginRight: 2 }} /> {h.phone}</small>}
                          </div>
                        </td>

                        {/* Ward Column in City-Wide View */}
                        {isCityWide && (
                          <td>
                            <span className="ward-pill-badge">
                              {h.zone_name || `Ward ${h.ward_number || h.zone}`}
                            </span>
                          </td>
                        )}

                        {/* Address / Lane */}
                        <td>
                          <span className="lane-text">
                            <MapPin size={12} style={{ display: 'inline', marginRight: 3, color: '#0d9488' }} />
                            {h.address_or_lane || 'Lane 1'}
                          </span>
                        </td>

                        {/* Family Size */}
                        <td>
                          <span className="members-badge">
                            <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
                            {h.members_count || 4} Members
                          </span>
                        </td>

                        {/* Consumption Progress */}
                        <td style={{ minWidth: 220 }}>
                          <div className="household-usage-cell">
                            <div className="usage-numbers">
                              <strong>{Math.round(usage)} <small>L</small></strong>
                              <span className="quota-denom">/ {Math.round(totalQuota)} L ({percent}%)</span>
                              {h.extra_water_granted > 0 && (
                                <span className="badge-extra-granted">+{Math.round(h.extra_water_granted)}L Extra</span>
                              )}
                            </div>
                            <div className="household-progress-bar">
                              <div
                                className={`household-progress-fill ${isExcess ? 'fill-excess' : isHigh ? 'fill-high' : 'fill-good'}`}
                                style={{ width: `${Math.min(100, percent)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Meter Status */}
                        <td>
                          {h.abnormal_draw ? (
                            <span className="meter-badge-flagged">
                              <AlertTriangle size={12} /> Suction Motor Flagged
                            </span>
                          ) : (
                            <span className="meter-badge-active">
                              <CheckCircle2 size={12} /> Active ({h.meter_status || 'Active'})
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="household-actions-row">
                            <button
                              className="btn-action-delete-mini"
                              onClick={() => handleDeleteHousehold(h)}
                              title={`Delete Household Connection ${h.household_id}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS BAR */}
            <div className="table-pagination-bar">
              <div className="pagination-info">
                Showing <strong>{startRecord}</strong> to <strong>{endRecord}</strong> of <strong>{filteredHouseholds.length}</strong> households
                {households.length > filteredHouseholds.length && (
                  <span className="pagination-filtered-note"> (filtered from {households.length} total)</span>
                )}
              </div>

              <div className="pagination-controls">
                <div className="page-size-select-wrap">
                  <label htmlFor="page-size-select">Show:</label>
                  <select
                    id="page-size-select"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value));
                      setPage(1);
                    }}
                    className="pagination-select"
                  >
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                    <option value={250}>250 per page</option>
                    <option value="all">Show All ({filteredHouseholds.length})</option>
                  </select>
                </div>

                {!isAllPages && totalPages > 1 && (
                  <div className="pagination-nav-buttons">
                    <button
                      className="btn-page-nav"
                      disabled={validPage === 1}
                      onClick={() => setPage(1)}
                      title="First Page"
                    >
                      <ChevronsLeft size={14} style={{ display: 'inline' }} /> First
                    </button>
                    <button
                      className="btn-page-nav"
                      disabled={validPage === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      title="Previous Page"
                    >
                      <ChevronLeft size={14} style={{ display: 'inline' }} /> Prev
                    </button>
                    <span className="page-indicator">
                      Page <strong>{validPage}</strong> of <strong>{totalPages}</strong>
                    </span>
                    <button
                      className="btn-page-nav"
                      disabled={validPage === totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      title="Next Page"
                    >
                      Next <ChevronRight size={14} style={{ display: 'inline' }} />
                    </button>
                    <button
                      className="btn-page-nav"
                      disabled={validPage === totalPages}
                      onClick={() => setPage(totalPages)}
                      title="Last Page"
                    >
                      Last <ChevronsRight size={14} style={{ display: 'inline' }} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="view-container">
      {/* Top Banner */}
      <div className="analytics-header-bar">
        <div>
          <h3>Community Quota Allocation & Transparent Household Tracking</h3>
          <p>Configure household counts, daily equitable quotas (135 L/person CPHEEO standard), monitor individual house usage, and process extra water demands</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isOfficer && (
            <>
              <button
                className="btn-import-np-primary"
                onClick={() => setShowImportModal(true)}
                title="Import Real Nagar Parishad Wards & Household Registers (e-Nagarpalika / CSV)"
              >
                <Building2 size={16} />
                <span>Import Nagar Parishad Data</span>
              </button>
              <button
                className="btn-export-backup-subtle"
                onClick={handleExportAllNagarParishadBackup}
                title="Export complete municipal data backup to JSON"
              >
                <Download size={15} />
                <span>Export Municipal Backup</span>
              </button>
              <button
                className="btn-add-ward-primary"
                onClick={handleOpenAddWardModal}
                title="Add New Municipal Ward to AquaFair Grid"
              >
                <Plus size={16} />
                <span>Add Ward</span>
              </button>
            </>
          )}
          {isAdmin && (
            <div className="role-pill-indicator">
              <Sparkles size={14} />
              <span>AquaFair Administration: Active</span>
            </div>
          )}
        </div>
      </div>

      {/* MUNICIPAL WARD SELECTOR TABS - Direct 1-click access to all households in any ward */}
      <div className="ward-selection-tabs-bar">
        <div className="ward-tabs-header-label">
          <MapPin size={16} className="text-teal" />
          <span>Municipal Wards:</span>
        </div>
        <div className="ward-tabs-list">
          {zones.map((zone) => {
            const isSelected = selectedWard && (selectedWard.id === zone.id || selectedWard.ward_number === zone.ward_number);
            return (
              <button
                key={zone.id}
                className={`ward-nav-tab-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleOpenWard(zone)}
              >
                <Home size={15} />
                <span className="tab-ward-title">{zone.name}</span>
                <span className="tab-homes-badge">
                  {zone.households_count || 0} Homes
                </span>
              </button>
            );
          })}
          <button
            className={`ward-nav-tab-btn overview-tab ${selectedWard === null ? 'active' : ''}`}
            onClick={() => {
              setSelectedWard(null);
              setSearchQuery('');
              setFilterType('all');
              setSelectedLane('all');
              setPage(1);
            }}
          >
            <Activity size={15} />
            <span>All Wards Quota Grid ({zones.reduce((s, z) => s + (z.households_count || 0), 0).toLocaleString()} Homes)</span>
          </button>
          {isOfficer && (
            <>
              <button
                className="ward-nav-tab-btn import-np-tab-btn"
                onClick={() => setShowImportModal(true)}
                title="Import Real Nagar Parishad Wards & Household Registers"
              >
                <Building2 size={15} />
                <span>Import Nagar Parishad</span>
              </button>
              <button
                className="ward-nav-tab-btn add-ward-tab-btn"
                onClick={handleOpenAddWardModal}
                title="Register new municipal ward sector"
              >
                <Plus size={15} />
                <span>+ Add Ward</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW 1: SELECTED WARD HOUSEHOLDS VIEW */}
      {selectedWard ? (
        <div className="ward-households-view">
          {/* Back & Ward Header Bar */}
          <div className="ward-nav-bar">
            <button className="btn-back-wards" onClick={() => setSelectedWard(null)}>
              <ArrowLeft size={16} /> All Wards Grid
            </button>
            <div className="ward-header-info">
              <h2>{selectedWard.name} – Connected Households Ledger</h2>
              <span className="elevation-chip">{selectedWard.elevation_tier || 'Standard Elevation'}</span>
              <span className="timing-chip"><Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> {selectedWard.supply_timing || '06:00 AM - 08:30 AM'}</span>
            </div>

            <div className="ward-quick-switch-wrap">
              <label htmlFor="ward-quick-select">Select Ward:</label>
              <select
                id="ward-quick-select"
                className="ward-select-dropdown"
                value={selectedWard.id}
                onChange={(e) => {
                  const z = zones.find(item => item.id === Number(e.target.value));
                  if (z) handleOpenWard(z);
                }}
              >
                {zones.map(z => (
                  <option key={z.id} value={z.id}>{z.name} ({z.households_count || 0} Homes)</option>
                ))}
              </select>
            </div>

            {isOfficer && (
              <div className="ward-nav-bar-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  className="btn-add-ward-secondary"
                  onClick={handleOpenAddWardModal}
                  title="Add another municipal ward"
                >
                  <Plus size={14} />
                  <span>Add Ward</span>
                </button>
                {zones.length > 1 && (
                  <button
                    className="btn-delete-ward-subtle"
                    onClick={() => handleDeleteWard(selectedWard)}
                    title={`Decommission ${selectedWard.name}`}
                  >
                    <Trash2 size={14} />
                    <span>Decommission</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Ward Summary Telemetry Metrics */}
          <div className="ward-kpi-bar">
            <div className="ward-kpi-card">
              <span>Connected Families</span>
              <strong>{selectedWard.households_count || households.length} <small>Homes</small></strong>
            </div>
            <div className="ward-kpi-card">
              <span>Equitable Target / Home</span>
              <strong>{Math.round(selectedWard.target_liters / Math.max(1, selectedWard.households_count || 1))} <small>L / day</small></strong>
            </div>
            <div className="ward-kpi-card">
              <span>Avg Consumption Today</span>
              <strong>{Math.round(selectedWard.delivered_liters / Math.max(1, selectedWard.households_count || 1))} <small>L / family</small></strong>
            </div>
            <div className="ward-kpi-card">
              <span>Pending Water Demands</span>
              <strong className={demands.filter(d => d.status === 'Pending').length > 0 ? 'text-amber' : 'text-emerald'}>
                {demands.filter(d => d.status === 'Pending').length} <small>Requests</small>
              </strong>
            </div>
          </div>

          {/* Render Scoped Households Table */}
          {renderHouseholdsLedger(false)}
        </div>
      ) : (
        /* VIEW 2: ALL WARDS OVERVIEW / QUOTA MANAGEMENT GRID */
        <div className="all-wards-overview-grid">
          <div className="zones-card-grid">
            {zones.map((zone) => {
              const isEditing = editingId === zone.id;
              const perHousehold = zone.households_count > 0 ? Math.round(zone.delivered_liters / zone.households_count) : 0;
              const targetPerHousehold = zone.households_count > 0 ? Math.round(zone.target_liters / zone.households_count) : 500;

              return (
                <div key={zone.id} className="zone-admin-card">
                  <div className="zone-card-top-bar">
                    <div>
                      <span className="zone-badge-tag">Sector {zone.ward_number || zone.id}</span>
                      {zone.is_hardware_active && (
                        <span style={{ marginLeft: 6, fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: '#ecfdf5', color: '#047857', border: '1px solid #6ee7b7' }}>
                          ⚡ Hardware Active
                        </span>
                      )}
                      <h4>{zone.name}</h4>
                      <span className="elevation-chip" style={{ marginTop: 4 }}>{zone.elevation_tier || 'Standard Elevation'}</span>
                    </div>
                    {isAdmin && !isEditing && (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button className="btn-icon-subtle" onClick={() => startEdit(zone)} title="Edit Allocation Parameters">
                          <Edit2 size={16} />
                        </button>
                        {isOfficer && zones.length > 1 && (
                          <button
                            className="btn-icon-subtle btn-delete-ward-icon"
                            onClick={() => handleDeleteWard(zone)}
                            title={`Decommission ${zone.name}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="zone-edit-form">
                      <label>
                        Connected Households (कुटुंब संख्या)
                        <input
                          type="number"
                          value={editForm.households_count}
                          onChange={(e) => setEditForm({ ...editForm, households_count: e.target.value })}
                        />
                      </label>
                      <label>
                        Total Equitable Quota Target (Liters)
                        <input
                          type="number"
                          value={editForm.target_liters}
                          onChange={(e) => setEditForm({ ...editForm, target_liters: e.target.value })}
                        />
                      </label>
                      <label>
                        Supply Shift Window
                        <input
                          type="text"
                          value={editForm.supply_timing}
                          onChange={(e) => setEditForm({ ...editForm, supply_timing: e.target.value })}
                          placeholder="e.g. 06:00 AM - 08:30 AM"
                        />
                      </label>
                      <label>
                        Sector Classification
                        <input
                          type="text"
                          value={editForm.sector_type}
                          onChange={(e) => setEditForm({ ...editForm, sector_type: e.target.value })}
                          placeholder="e.g. Residential Lowland / Elevated Ridge"
                        />
                      </label>
                      <div className="edit-buttons-row">
                        <button className="btn-save-edit" onClick={() => saveEdit(zone.id)}>
                          <Check size={14} /> Save Allocation
                        </button>
                        <button className="btn-cancel-edit" onClick={() => setEditingId(null)}>
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="zone-card-body">
                      <div className="zone-quota-display">
                        <div className="quota-box">
                          <span>Equitable Target</span>
                          <strong>{targetPerHousehold} <small>L / family</small></strong>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>({Math.round(zone.target_liters).toLocaleString()} L total)</span>
                        </div>
                        <div className="quota-box">
                          <span>Delivered Today</span>
                          <strong>{perHousehold} <small>L / family</small></strong>
                          <span style={{ fontSize: '10px', color: '#16a34a' }}>({Math.round(zone.delivered_liters).toLocaleString()} L total)</span>
                        </div>
                      </div>

                      <div className="zone-status-details">
                        <div className="detail-line">
                          <span>Connected Homes:</span>
                          <strong><Home size={12} style={{ display: 'inline', marginRight: 3 }} /> {zone.households_count} Families</strong>
                        </div>
                        <div className="detail-line">
                          <span>Supply Window:</span>
                          <strong><Clock size={12} style={{ display: 'inline', marginRight: 3 }} /> {zone.supply_timing || '06:00 AM - 08:30 AM'}</strong>
                        </div>
                        <div className="detail-line">
                          <span>Motorized Sluice Valve:</span>
                          <strong>{zone.valve_percent}%</strong>
                        </div>
                        <div className="detail-line">
                          <span>Fairness Index:</span>
                          <strong>{zone.equity_score || 99.2}%</strong>
                        </div>
                      </div>

                      {/* Ward Action Buttons - Officer water demand button permanently removed */}
                      <div className="ward-action-buttons">
                        <button
                          className="btn-view-households"
                          onClick={() => handleOpenWard(zone)}
                        >
                          <Users size={15} />
                          <span>View Households ({zone.households_count || 0} Homes)</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      <div className="zone-card-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button className="btn-outline-action" onClick={() => purgeZone(zone.name)}>
                          Test Line Integrity
                        </button>
                        <button
                          className={`btn-outline-action ${zone.is_hardware_active ? 'btn-active-hw' : ''}`}
                          style={{
                            background: zone.is_hardware_active ? '#047857' : '#f8fafc',
                            color: zone.is_hardware_active ? '#ffffff' : '#0f766e',
                            borderColor: zone.is_hardware_active ? '#047857' : '#99f6e4',
                            fontWeight: 600
                          }}
                          onClick={() => handleToggleHardwareActive(zone)}
                          title="Focus live SCADA operations exclusively on this ward"
                        >
                          {zone.is_hardware_active ? '⚡ Active Hardware Node' : 'Focus Hardware Here'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isOfficer && (
              <div className="zone-admin-card add-zone-card-placeholder" onClick={handleOpenAddWardModal}>
                <div className="add-zone-card-content">
                  <div className="add-zone-icon-circle">
                    <Plus size={28} />
                  </div>
                  <h4>Add Municipal Ward</h4>
                  <p>Register a new municipal ward, mohalla sector, or apartment cluster for fair water allocation and IoT monitoring</p>
                  <button type="button" className="btn-add-zone-card" onClick={(e) => { e.stopPropagation(); handleOpenAddWardModal(); }}>
                    <Plus size={15} /> Register Ward
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* City-Wide Municipal Households Ledger - ALWAYS VISIBLE */}
          <div className="city-wide-ledger-section">
            <div className="city-wide-ledger-title-bar">
              <h3>
                <Users size={18} className="text-teal" />
                <span>Municipal Master Household Ledger (1,010 Homes Across All Wards)</span>
              </h3>
            </div>
            {renderHouseholdsLedger(true)}
          </div>
        </div>
      )}

      {/* ================= MODAL 1: ADD NEW HOUSEHOLD ================= */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-dialog">
            <div className="modal-header">
              <div className="modal-title-group">
                <UserPlus size={22} className="text-teal" />
                <div>
                  <h3>Register New Household Connection</h3>
                  <p>Ward: <strong>{selectedWard ? selectedWard.name : 'Municipal Wide'}</strong></p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowAddModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateHousehold} className="modal-form">
              {!selectedWard && (
                <label>
                  Select Municipal Ward *
                  <select
                    value={newHouseholdForm.ward_id}
                    onChange={(e) => {
                      const wid = Number(e.target.value);
                      const z = zones.find(item => item.id === wid);
                      const wNum = z ? (z.ward_number || z.id) : wid;
                      setNewHouseholdForm(prev => ({
                        ...prev,
                        ward_id: wid,
                        household_id: `AF-W${wNum}-${Math.floor(1000 + Math.random() * 9000)}`
                      }));
                    }}
                  >
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name} ({z.households_count || 0} Homes)</option>
                    ))}
                  </select>
                </label>
              )}

              <div className="form-row-2">
                <label>
                  Resident / Family Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patil / Deshmukh Residence"
                    value={newHouseholdForm.owner_name}
                    onChange={(e) => setNewHouseholdForm({ ...newHouseholdForm, owner_name: e.target.value })}
                  />
                </label>
                <label>
                  Household Connection ID *
                  <input
                    type="text"
                    required
                    value={newHouseholdForm.household_id}
                    onChange={(e) => setNewHouseholdForm({ ...newHouseholdForm, household_id: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-row-2">
                <label>
                  Lane / Address *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lane 2, Near Hanuman Mandir"
                    value={newHouseholdForm.address_or_lane}
                    onChange={(e) => setNewHouseholdForm({ ...newHouseholdForm, address_or_lane: e.target.value })}
                  />
                </label>
                <label>
                  Contact Phone Number
                  <input
                    type="tel"
                    placeholder="e.g. 9822014589"
                    value={newHouseholdForm.phone}
                    onChange={(e) => setNewHouseholdForm({ ...newHouseholdForm, phone: e.target.value })}
                  />
                </label>
              </div>

              <div className="form-row-2">
                <label>
                  Family Members Count *
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    value={newHouseholdForm.members_count}
                    onChange={(e) => handleMembersChange(e.target.value)}
                  />
                  <small className="help-text">135 L/person standard per CPHEEO</small>
                </label>
                <label>
                  Calculated Daily Quota (Liters) *
                  <input
                    type="number"
                    required
                    value={newHouseholdForm.daily_quota_liters}
                    onChange={(e) => setNewHouseholdForm({ ...newHouseholdForm, daily_quota_liters: Number(e.target.value) })}
                  />
                  <small className="help-text">{newHouseholdForm.members_count} × 135 = {newHouseholdForm.members_count * 135} L/day</small>
                </label>
              </div>

              <div className="modal-actions-bar">
                <button type="button" className="btn-cancel-modal" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit-modal">
                  <Check size={16} /> Register Connection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ADD NEW MUNICIPAL WARD (FOR MUNICIPAL OFFICER) ================= */}
      {showAddWardModal && (
        <div className="modal-backdrop" onClick={() => setShowAddWardModal(false)}>
          <div className="modal-dialog modal-dialog-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge">
                  <Home size={22} className="text-teal" />
                </div>
                <div>
                  <h3>Register New Municipal Ward</h3>
                  <p>Municipal Water Distribution Grid • Smart Equity SCADA Node</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowAddWardModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateWardSubmit} className="modal-form">
              {/* Row 1: Name and Ward Number */}
              <div className="form-row-2">
                <label>
                  Municipal Ward & Sector Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ward 5 - Indira Nagar"
                    value={newWardForm.name}
                    onChange={(e) => setNewWardForm({ ...newWardForm, name: e.target.value })}
                  />
                  <small className="help-text">Descriptive name for Nagar Parishad SCADA</small>
                </label>
                <label>
                  Ward Number (प्रभाग क्रमांक) *
                  <input
                    type="number"
                    min="1"
                    required
                    value={newWardForm.ward_number}
                    onChange={(e) => setNewWardForm({ ...newWardForm, ward_number: Number(e.target.value) })}
                  />
                  <small className="help-text">Numerical sector identifier</small>
                </label>
              </div>

              {/* Row 2: Sector Type and Elevation */}
              <div className="form-row-2">
                <label>
                  Sector Classification *
                  <select
                    value={newWardForm.sector_type}
                    onChange={(e) => setNewWardForm({ ...newWardForm, sector_type: e.target.value })}
                  >
                    <option value="Standard Residential Colony">Standard Residential Colony</option>
                    <option value="Residential Lowland">Residential Lowland</option>
                    <option value="Market & Mixed Commercial/Residential">Market & Mixed Commercial/Residential</option>
                    <option value="Elevated Ridge Mohalla">Elevated Ridge Mohalla</option>
                    <option value="Tail-End Sector">Tail-End Sector</option>
                    <option value="Apartments & High-Rise Cluster">Apartments & High-Rise Cluster</option>
                    <option value="Slum Rehabilitation Mohalla">Slum Rehabilitation Mohalla</option>
                  </select>
                </label>
                <label>
                  Elevation & Pressure Tier *
                  <select
                    value={newWardForm.elevation_tier}
                    onChange={(e) => setNewWardForm({ ...newWardForm, elevation_tier: e.target.value })}
                  >
                    <option value="Standard">Standard Elevation</option>
                    <option value="Lowland">Lowland (High Natural Pressure)</option>
                    <option value="High-Altitude">High-Altitude Ridge (Low Natural Pressure)</option>
                    <option value="Tail-End">Tail-End Sector (Distance Loss)</option>
                  </select>
                </label>
              </div>

              {/* Row 3: Household Count and Per-Family Quota */}
              <div className="form-row-2">
                <label>
                  Connected Families / Households *
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    required
                    value={newWardForm.households_count}
                    onChange={(e) => handleWardHHChange(e.target.value)}
                  />
                  <small className="help-text">Number of residential family connections</small>
                </label>
                <label>
                  Daily Equitable Target per Family (Liters) *
                  <div className="chips-row" style={{ marginTop: '4px', marginBottom: '6px' }}>
                    {[400, 500, 540, 600].map((l) => (
                      <button
                        type="button"
                        key={l}
                        className={`volume-chip ${newWardForm.per_family_liters === l ? 'active' : ''}`}
                        onClick={() => handleWardPerFamilyChange(l)}
                      >
                        {l} L
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="50"
                    max="2000"
                    required
                    value={newWardForm.per_family_liters}
                    onChange={(e) => handleWardPerFamilyChange(e.target.value)}
                  />
                  <small className="help-text">Standard CPHEEO: 135 L/person (540 L for 4 members)</small>
                </label>
              </div>

              {/* Total Target Preview Banner */}
              <div className="target-household-banner">
                <Droplets size={20} className="text-teal" />
                <div>
                  <strong>
                    Total Ward Daily Equitable Allocation: {newWardForm.target_liters.toLocaleString()} Liters ({Math.round(newWardForm.target_liters / 1000)} kL)
                  </strong>
                  <span>
                    Calculated as {newWardForm.households_count} households × {newWardForm.per_family_liters} L/family per day
                  </span>
                </div>
              </div>

              {/* Row 4: Supply Window & Feeder Valve */}
              <div className="form-row-2">
                <label>
                  Supply Shift Timing Window *
                  <input
                    type="text"
                    required
                    placeholder="e.g. 06:00 AM - 08:30 AM"
                    value={newWardForm.supply_timing}
                    onChange={(e) => setNewWardForm({ ...newWardForm, supply_timing: e.target.value })}
                  />
                </label>
                <label>
                  Motorized Sluice Valve Opening (%) *
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={newWardForm.valve_percent}
                      onChange={(e) => setNewWardForm({ ...newWardForm, valve_percent: Number(e.target.value) })}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontWeight: 700, minWidth: '40px' }}>{newWardForm.valve_percent}%</span>
                  </div>
                </label>
              </div>

              {/* Hardware-in-the-Loop Integration Section */}
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '10px',
                padding: '12px 14px',
                margin: '10px 0 12px 0'
              }}>
                <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={newWardForm.is_hardware_active}
                    onChange={(e) => setNewWardForm({ ...newWardForm, is_hardware_active: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px', accentColor: '#16a34a' }}
                  />
                  <div>
                    <strong style={{ color: '#15803d', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ⚡ Dedicated Hardware Integration Ward (Focus Operations Exclusively Here)
                    </strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '11.5px', color: '#166534', lineHeight: 1.4 }}>
                      AquaBalance will isolate SCADA operations and live water distribution exclusively to this new ward. Previous wards will be placed on Completed/Standby (0% valve aperture) to eliminate background flow simulation interference while bench-testing your ESP32/IoT hardware.
                    </p>
                  </div>
                </label>
              </div>

              {/* Checkbox: Auto-seed Starter Households */}
              <label style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 0' }}>
                <input
                  type="checkbox"
                  checked={newWardForm.auto_seed_households}
                  onChange={(e) => setNewWardForm({ ...newWardForm, auto_seed_households: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-700)' }}>
                  Automatically provision 5 starter residential household meters in this ward with active telemetry
                </span>
              </label>

              {/* Notes */}
              <label>
                Infrastructure Notes / Remarks (Optional)
                <input
                  type="text"
                  placeholder="e.g. Fed by 200mm East pipeline from ESR Reservoir"
                  value={newWardForm.notes}
                  onChange={(e) => setNewWardForm({ ...newWardForm, notes: e.target.value })}
                />
              </label>

              <div className="modal-actions-bar">
                <button
                  type="button"
                  className="btn-cancel-modal"
                  onClick={() => setShowAddWardModal(false)}
                  disabled={isSubmittingWard}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit-modal"
                  disabled={isSubmittingWard}
                >
                  <Check size={16} />
                  <span>{isSubmittingWard ? 'Registering Ward...' : 'Register Municipal Ward'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: NAGAR PARISHAD REAL DATA INGESTION SUITE ================= */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal-dialog modal-dialog-lg np-import-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-icon-badge np-badge">
                  <Building2 size={24} className="text-teal" />
                </div>
                <div>
                  <h3>Nagar Parishad (Municipal Council) Data Ingestion Suite</h3>
                  <p>Synchronize official municipal ward rosters & water tax household connections (e-Nagarpalika / Aaple Sarkar / घरपट्टी नोंदवही)</p>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setShowImportModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="np-modal-nav-tabs">
              <button
                type="button"
                className={`np-tab-btn ${importTab === 'upload' ? 'active' : ''}`}
                onClick={() => setImportTab('upload')}
              >
                <FileSpreadsheet size={15} />
                <span>Upload CSV / Excel</span>
              </button>
              <button
                type="button"
                className={`np-tab-btn ${importTab === 'paste' ? 'active' : ''}`}
                onClick={() => setImportTab('paste')}
              >
                <Layers size={15} />
                <span>Copy-Paste Rows</span>
              </button>
              <button
                type="button"
                className={`np-tab-btn ${importTab === 'sample' ? 'active' : ''}`}
                onClick={() => setImportTab('sample')}
              >
                <Sparkles size={15} />
                <span>Load Sample Dataset</span>
              </button>
              <button
                type="button"
                className={`np-tab-btn ${importTab === 'guide' ? 'active' : ''}`}
                onClick={() => setImportTab('guide')}
              >
                <HelpCircle size={15} />
                <span>Officer Handbook & Guide</span>
              </button>
            </div>

            <div className="np-modal-body">
              {/* TAB 1: CSV / EXCEL UPLOAD */}
              {importTab === 'upload' && (
                <div className="np-upload-section">
                  {/* Step 1: Templates Download Bar */}
                  <div className="np-template-download-box">
                    <div className="template-desc">
                      <FileSpreadsheet size={20} className="text-teal" />
                      <div>
                        <strong>1. Download Official CSV Templates for Microsoft Excel</strong>
                        <p>Fill with your real Nagar Parishad records or export directly from your municipal software:</p>
                      </div>
                    </div>
                    <div className="template-action-buttons">
                      <button type="button" className="btn-dl-template" onClick={handleDownloadWardsTemplate}>
                        <Download size={14} /> Wards Template (.csv)
                      </button>
                      <button type="button" className="btn-dl-template" onClick={handleDownloadHouseholdsTemplate}>
                        <Download size={14} /> Households Template (.csv)
                      </button>
                      <button type="button" className="btn-dl-template highlight" onClick={handleLoadSampleShirpur}>
                        <Sparkles size={14} /> Load Shirpur Demo (5 Wards)
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Upload inputs */}
                  <div className="np-file-pickers-grid">
                    {/* Wards File Picker */}
                    <div className={`np-file-card ${parsedWards.length > 0 ? 'file-loaded' : ''}`}>
                      <div className="np-file-card-header">
                        <Home size={18} className="text-teal" />
                        <div>
                          <strong>Step 2A: Wards CSV File</strong>
                          <small>List of municipal wards, names, & supply hours</small>
                        </div>
                      </div>
                      <label className="np-drop-zone">
                        <UploadCloud size={28} className="drop-icon" />
                        <span className="drop-title">
                          {wardsFileName ? wardsFileName : 'Click to select Wards CSV file'}
                        </span>
                        <span className="drop-sub">Supported formats: .csv, .txt</span>
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleWardsFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {parsedWards.length > 0 && (
                        <div className="file-status-badge success">
                          <CheckCircle2 size={13} /> {parsedWards.length} Wards Ready
                        </div>
                      )}
                    </div>

                    {/* Households File Picker */}
                    <div className={`np-file-card ${parsedHouseholds.length > 0 ? 'file-loaded' : ''}`}>
                      <div className="np-file-card-header">
                        <Users size={18} className="text-teal" />
                        <div>
                          <strong>Step 2B: Households / Consumer File</strong>
                          <small>Consumer IDs, names, lanes, and family members</small>
                        </div>
                      </div>
                      <label className="np-drop-zone">
                        <UploadCloud size={28} className="drop-icon" />
                        <span className="drop-title">
                          {householdsFileName ? householdsFileName : 'Click to select Households CSV file'}
                        </span>
                        <span className="drop-sub">Supported formats: .csv, .txt</span>
                        <input
                          type="file"
                          accept=".csv,.txt"
                          onChange={handleHouseholdsFileChange}
                          style={{ display: 'none' }}
                        />
                      </label>
                      {parsedHouseholds.length > 0 && (
                        <div className="file-status-badge success">
                          <CheckCircle2 size={13} /> {parsedHouseholds.length} Households Ready
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Ingestion Mode Strategy */}
                  <div className="np-mode-selection-box">
                    <label className="np-mode-label">
                      <strong>Step 3: SCADA Ingestion Strategy:</strong>
                    </label>
                    <div className="np-mode-radios">
                      <label className={`np-mode-option ${!replaceMode ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="np_mode"
                          checked={!replaceMode}
                          onChange={() => setReplaceMode(false)}
                        />
                        <div>
                          <div className="mode-title">
                            <span className="dot dot-green"></span>
                            <strong>Append & Merge Mode (Safe)</strong>
                          </div>
                          <span className="mode-sub">Add new Nagar Parishad wards & households to existing grid. Existing wards remain intact.</span>
                        </div>
                      </label>

                      <label className={`np-mode-option ${replaceMode ? 'active' : ''}`}>
                        <input
                          type="radio"
                          name="np_mode"
                          checked={replaceMode}
                          onChange={() => setReplaceMode(true)}
                        />
                        <div>
                          <div className="mode-title">
                            <span className="dot dot-red"></span>
                            <strong>Clean Municipal Initialization (Replace All)</strong>
                          </div>
                          <span className="mode-sub">Wipes default demo records and initializes AquaFair grid solely with your real Nagar Parishad records.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Step 4: Preview Table */}
                  {(parsedWards.length > 0 || parsedHouseholds.length > 0) && (
                    <div className="np-parsed-preview-box">
                      <div className="preview-header-bar">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Database size={16} className="text-teal" />
                          <strong>Live Ingestion Staging Preview</strong>
                        </div>
                        <div className="preview-counts-wrap">
                          {parsedWards.length > 0 && <span className="preview-badge">{parsedWards.length} Wards Staged</span>}
                          {parsedHouseholds.length > 0 && <span className="preview-badge">{parsedHouseholds.length} Homes Staged</span>}
                        </div>
                      </div>

                      {parsedWards.length > 0 && (
                        <div className="preview-table-wrapper">
                          <div className="preview-sub-title">Detected Municipal Wards ({parsedWards.length}):</div>
                          <table className="mini-preview-table">
                            <thead>
                              <tr>
                                <th>Ward No.</th>
                                <th>Ward / Sector Name</th>
                                <th>Sector Type</th>
                                <th>Elevation Tier</th>
                                <th>Timing</th>
                                <th>Expected Homes</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedWards.slice(0, 5).map((w, idx) => (
                                <tr key={idx}>
                                  <td><strong>#{w.ward_number || idx + 1}</strong></td>
                                  <td>{w.name || w.ward_name || `Ward ${w.ward_number || idx + 1}`}</td>
                                  <td>{w.sector_type || 'Residential'}</td>
                                  <td><span className="elevation-chip-mini">{w.elevation_tier || 'Standard'}</span></td>
                                  <td>{w.supply_timing || '06:00 AM - 08:30 AM'}</td>
                                  <td>{w.households_count || w.total_houses || 200} Homes</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {parsedWards.length > 5 && (
                            <div className="preview-more-note">+ {parsedWards.length - 5} more wards will be registered...</div>
                          )}
                        </div>
                      )}

                      {parsedHouseholds.length > 0 && (
                        <div className="preview-table-wrapper" style={{ marginTop: '12px' }}>
                          <div className="preview-sub-title">Detected Household Connections ({parsedHouseholds.length}):</div>
                          <table className="mini-preview-table">
                            <thead>
                              <tr>
                                <th>Ward</th>
                                <th>Consumer / Tap ID</th>
                                <th>Resident Name</th>
                                <th>Address / Lane</th>
                                <th>Members</th>
                                <th>Daily Quota</th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedHouseholds.slice(0, 5).map((h, idx) => (
                                <tr key={idx}>
                                  <td>Ward #{h.ward_number || 1}</td>
                                  <td><code className="hh-id-chip">{h.household_id || `NP-W${h.ward_number || 1}-${1001 + idx}`}</code></td>
                                  <td><strong>{h.owner_name || h.resident_name || 'Resident'}</strong></td>
                                  <td>{h.address_or_lane || 'Lane 1'}</td>
                                  <td>{h.members_count || 4} Members</td>
                                  <td>{h.daily_quota_liters || (Number(h.members_count || 4) * 135)} L/day</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {parsedHouseholds.length > 5 && (
                            <div className="preview-more-note">+ {parsedHouseholds.length - 5} more households will be registered...</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PASTE ROWS FROM EXCEL */}
              {importTab === 'paste' && (
                <div className="np-paste-section">
                  <div className="paste-header-info">
                    <Layers size={18} className="text-teal" />
                    <div>
                      <strong>Copy & Paste Directly from Microsoft Excel or Google Sheets</strong>
                      <p>Select rows in Excel including column header, press Ctrl+C, and paste below. Tab-separated and comma-separated rows are automatically detected.</p>
                    </div>
                  </div>

                  <div className="paste-type-selector">
                    <label>Data Type:</label>
                    <label className="radio-inline">
                      <input
                        type="radio"
                        name="paste_type"
                        checked={pasteType === 'households'}
                        onChange={() => setPasteType('households')}
                      />
                      <span>Household Water Connections (Consumer Register)</span>
                    </label>
                    <label className="radio-inline">
                      <input
                        type="radio"
                        name="paste_type"
                        checked={pasteType === 'wards'}
                        onChange={() => setPasteType('wards')}
                      />
                      <span>Municipal Wards (प्रभाग यादी)</span>
                    </label>
                  </div>

                  <textarea
                    className="paste-textarea"
                    rows={8}
                    placeholder={
                      pasteType === 'households'
                        ? "ward_number\thousehold_id\towner_name\taddress_or_lane\tphone\tmembers_count\tdaily_quota_liters\n1\tNP-W1-1001\tRamesh Patil\tHouse #1, Shivaji Road\t9822011001\t4\t540\n1\tNP-W1-1002\tSunita Deshmukh\tHouse #2, Lane 1\t9822011002\t5\t675"
                        : "ward_number\tward_name\tsector_type\televation_tier\tsupply_timing\thouseholds_count\ttarget_liters\n1\tWard 1 - Shivaji Nagar\tResidential\tLowland\t06:00 AM - 08:30 AM\t250\t125000\n2\tWard 2 - Gandhi Chowk\tMixed\tStandard\t06:00 AM - 08:30 AM\t280\t140000"
                    }
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                  />

                  <div className="paste-actions">
                    <button type="button" className="btn-parse-paste" onClick={handleParsePastedText}>
                      <Check size={15} /> Parse Pasted Rows into Preview
                    </button>
                    {pasteText && (
                      <button type="button" className="btn-clear-paste" onClick={() => setPasteText('')}>
                        Clear Text
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SAMPLE DATASET (SHIRPUR / MAHARASHTRA DEMO) */}
              {importTab === 'sample' && (
                <div className="np-sample-section">
                  <div className="sample-card-main">
                    <div className="sample-card-icon">
                      <Building2 size={36} className="text-teal" />
                    </div>
                    <div className="sample-card-details">
                      <h4>Authentic Nagar Parishad Water Grid Dataset (5 Wards)</h4>
                      <p>
                        Modeled after real municipal councils in Maharashtra & India (CPHEEO 135 L/person standard). Includes authentic Marathi family consumer records, street addresses, elevation tier classifications, and supply schedules:
                      </p>
                      <ul className="sample-specs-list">
                        <li><strong>Ward 1 - Shivaji Nagar:</strong> Lowland Residential Colony (250 Homes, 1,25,000 L/day)</li>
                        <li><strong>Ward 2 - Gandhi Chowk:</strong> Commercial Market & Residential (280 Homes, 1,40,000 L/day)</li>
                        <li><strong>Ward 3 - Subhash Tekdi:</strong> High-Altitude Ridge Mohalla (220 Homes, 1,10,000 L/day)</li>
                        <li><strong>Ward 4 - Dr. Ambedkar Nagar:</strong> Tail-End Feeder Sector (260 Homes, 1,30,000 L/day)</li>
                        <li><strong>Ward 5 - Shahu Maharaj Colony:</strong> Standard Residential Sector (200 Homes, 1,00,000 L/day)</li>
                      </ul>
                      <div className="sample-actions-row">
                        <button type="button" className="btn-load-sample-primary" onClick={handleLoadSampleShirpur}>
                          <Sparkles size={16} /> Load 5-Ward Sample Dataset into Ingestion Staging
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: MUNICIPAL INTEGRATION GUIDE */}
              {importTab === 'guide' && (
                <div className="np-guide-section">
                  <div className="guide-card">
                    <h4>Municipal Officer's Step-by-Step Data Export Guide</h4>
                    <div className="guide-steps-list">
                      <div className="guide-step">
                        <span className="step-num">1</span>
                        <div>
                          <strong>Export from Municipal ERP / e-Governance Portal:</strong>
                          <p>
                            Log in to your Nagar Parishad's water tax software (e.g. <em>e-Nagarpalika</em>, <em>MahaIT / Aaple Sarkar</em>, or local property tax billing system). Navigate to <strong>Reports &rarr; Water Connection Register (पाणीपट्टी नोंदवही)</strong> or <strong>Property Assessment (घरपट्टी)</strong> and choose <strong>Export to Excel / CSV</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="guide-step">
                        <span className="step-num">2</span>
                        <div>
                          <strong>Check the Required Columns:</strong>
                          <p>Ensure the CSV headers match or resemble the following:</p>
                          <ul className="guide-col-list">
                            <li><code>ward_number</code>: Integer ward number (e.g. 1, 2, 3)</li>
                            <li><code>household_id</code>: Unique consumer number or property assessment code (e.g. NP-W1-1042)</li>
                            <li><code>owner_name</code>: Citizen / Consumer head name</li>
                            <li><code>address_or_lane</code>: House number and street / galli</li>
                            <li><code>members_count</code>: Family member count (default: 4)</li>
                            <li><code>daily_quota_liters</code>: Quota in liters (calculated as <code>members × 135 L</code>)</li>
                          </ul>
                        </div>
                      </div>

                      <div className="guide-step">
                        <span className="step-num">3</span>
                        <div>
                          <strong>CPHEEO Water Supply Standard:</strong>
                          <p>
                            AquaFair strictly follows the Central Public Health and Environmental Engineering Organisation (CPHEEO) national standard: <strong>135 Liters Per Capita per Day (LPCD)</strong> for towns with piped water supply. A 4-member family receives an equitable daily quota of <strong>540 Liters</strong>.
                          </p>
                        </div>
                      </div>

                      <div className="guide-step">
                        <span className="step-num">4</span>
                        <div>
                          <strong>CLI Command for Terminal Server Administrators:</strong>
                          <p>If you prefer uploading via terminal or cron job, run this Django management command:</p>
                          <pre className="code-snippet-box">python manage.py import_nagarparishad --wards data/wards.csv --households data/households.csv --replace</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="modal-actions-bar">
              <button
                type="button"
                className="btn-cancel-modal"
                onClick={() => setShowImportModal(false)}
                disabled={isImporting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-submit-modal btn-commit-import"
                onClick={handleExecuteImport}
                disabled={isImporting || (parsedWards.length === 0 && parsedHouseholds.length === 0)}
              >
                {isImporting ? (
                  <>
                    <RefreshCw size={16} className="spin-icon" />
                    <span>Synchronizing SCADA Grid...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>
                      {parsedWards.length === 0 && parsedHouseholds.length === 0
                        ? 'Select or Load Files to Ingest'
                        : `Commit ${parsedWards.length} Wards & ${parsedHouseholds.length} Homes to Grid`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast-notification">{toast}</div>}
    </div>
  );
}
