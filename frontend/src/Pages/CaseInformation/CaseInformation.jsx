import React, { useContext, useState, useEffect, useMemo } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import { SideBar } from '../../components/Sidebar/Sidebar';
import styles from './CaseInformation.module.css';
import { CaseContext } from '../CaseContext';
import { AlertModal } from '../../components/AlertModal/AlertModal';
import Filter from '../../components/Filter/Filter';
import PersonModal from '../../components/PersonModal/PersonModel';
import VehicleModal from '../../components/VehicleModal/VehicleModal';
import api from '../../api';

const upIcon = '/Materials/drop_up.png';
const downIcon = '/Materials/drop_down.png';


const fmt = (v) => (v ? new Date(v).toLocaleDateString() : '—');

export const CaseInformation = () => {
  const { selectedCase, setSelectedCase } = useContext(CaseContext);
  const caseNo = selectedCase?.caseNo;
  const caseName = selectedCase?.caseName;
  const role = selectedCase?.role || '';
  const isCMorDS = role === 'Case Manager' || role === 'Detective Supervisor';
  const systemRole = localStorage.getItem('role') || '';
  const isDS = role === 'Detective Supervisor' || systemRole === 'Admin';
  const signedInOfficer = localStorage.getItem('loggedInUser');
  const signedInUserId  = localStorage.getItem('userId');

  // ── Case edit state ──────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [editCaseNo, setEditCaseNo] = useState(caseNo || '');
  const [editCaseName, setEditCaseName] = useState(caseName || '');
  const [saving, setSaving] = useState(false);
  const [caseDoc, setCaseDoc] = useState(null);

  // ── Data state ───────────────────────────────────────────────────────────
  const [leads, setLeads] = useState([]);
  const [persons, setPersons] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [enclosures, setEnclosures] = useState([]);
  const [pictures, setPictures] = useState([]);
  const [audio, setAudio] = useState([]);
  const [videos, setVideos] = useState([]);

  // ── Loading flags ─────────────────────────────────────────────────────────
  const [loadingPersons, setLoadingPersons] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);

  // ── Section open/close ────────────────────────────────────────────────────
  const [openFiles, setOpenFiles] = useState(true);
  const [openPersons, setOpenPersons] = useState(true);
  const [openVehicles, setOpenVehicles] = useState(true);

  // ── Active file tab ───────────────────────────────────────────────────────
  const [fileTab, setFileTab] = useState('evidence');

  // ── Expanded rows (description toggle) ───────────────────────────────────
  const [expandedRows, setExpandedRows] = useState(new Set());
  const toggleRow = (id) => setExpandedRows(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  // ── Evidence filter / sort (CasePageManager style) ───────────────────────
  const [evAnchorRect, setEvAnchorRect] = useState(null);
  const [openEvFilter, setOpenEvFilter] = useState(null);
  const [evFilterConfig, setEvFilterConfig] = useState({ leadNo: [], enteredDate: [], enteredBy: [], type: [], evidenceDescription: [] });
  const [evFilterSearch, setEvFilterSearch] = useState({});
  const [tempEvSelections, setTempEvSelections] = useState({});
  const [evSortConfig, setEvSortConfig] = useState({ key: 'leadNo', direction: 'asc' });

  const handleEvFilterSearch = (k, txt) => setEvFilterSearch(fs => ({ ...fs, [k]: txt }));
  const evAllChecked = k => (tempEvSelections[k] || []).length === (distinctEv[k] || []).length;
  const toggleEvAll = k => {
    const all = distinctEv[k] || [];
    setTempEvSelections(ts => ({ ...ts, [k]: ts[k]?.length === all.length ? [] : [...all] }));
  };
  const toggleEvOne = (k, v) => setTempEvSelections(ts => {
    const sel = ts[k] || [];
    return { ...ts, [k]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] };
  });
  const applyEvFilter = k => setEvFilterConfig(cfg => ({ ...cfg, [k]: tempEvSelections[k] || [] }));
  const handleEvSort = (k, dir) => setEvSortConfig({ key: k, direction: dir });

  // ── Distinct values for evidence filter dropdowns ─────────────────────────
  const distinctEv = useMemo(() => {
    const map = { leadNo: new Set(), enteredDate: new Set(), enteredBy: new Set(), type: new Set(), evidenceDescription: new Set() };
    evidence.forEach(ev => {
      map.leadNo.add(String(ev.leadNo));
      map.enteredDate.add(fmt(ev.enteredDate));
      map.enteredBy.add(ev.enteredBy || '');
      map.type.add(ev.type || '');
      map.evidenceDescription.add(ev.evidenceDescription || '');
    });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s).filter(Boolean)]));
  }, [evidence]);

  // ── Enclosures filter / sort ──────────────────────────────────────────────
  const [encAnchorRect, setEncAnchorRect] = useState(null);
  const [openEncFilter, setOpenEncFilter] = useState(null);
  const [encFilterConfig, setEncFilterConfig] = useState({ leadNo: [], enteredDate: [], enteredBy: [], type: [], enclosureDescription: [] });
  const [encFilterSearch, setEncFilterSearch] = useState({});
  const [tempEncSelections, setTempEncSelections] = useState({});
  const [encSortConfig, setEncSortConfig] = useState({ key: 'leadNo', direction: 'asc' });
  const handleEncFilterSearch = (k, txt) => setEncFilterSearch(fs => ({ ...fs, [k]: txt }));
  const encAllChecked = k => (tempEncSelections[k] || []).length === (distinctEnc[k] || []).length;
  const toggleEncAll = k => { const all = distinctEnc[k] || []; setTempEncSelections(ts => ({ ...ts, [k]: ts[k]?.length === all.length ? [] : [...all] })); };
  const toggleEncOne = (k, v) => setTempEncSelections(ts => { const sel = ts[k] || []; return { ...ts, [k]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] }; });
  const applyEncFilter = k => setEncFilterConfig(cfg => ({ ...cfg, [k]: tempEncSelections[k] || [] }));
  const handleEncSort = (k, dir) => setEncSortConfig({ key: k, direction: dir });
  const distinctEnc = useMemo(() => {
    const map = { leadNo: new Set(), enteredDate: new Set(), enteredBy: new Set(), type: new Set(), enclosureDescription: new Set() };
    enclosures.forEach(r => { map.leadNo.add(String(r.leadNo)); map.enteredDate.add(fmt(r.enteredDate)); map.enteredBy.add(r.enteredBy || ''); map.type.add(r.type || ''); map.enclosureDescription.add(r.enclosureDescription || ''); });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s).filter(Boolean)]));
  }, [enclosures]);

  // ── Pictures filter / sort ────────────────────────────────────────────────
  const [picAnchorRect, setPicAnchorRect] = useState(null);
  const [openPicFilter, setOpenPicFilter] = useState(null);
  const [picFilterConfig, setPicFilterConfig] = useState({ leadNo: [], enteredDate: [], enteredBy: [], pictureDescription: [] });
  const [picFilterSearch, setPicFilterSearch] = useState({});
  const [tempPicSelections, setTempPicSelections] = useState({});
  const [picSortConfig, setPicSortConfig] = useState({ key: 'leadNo', direction: 'asc' });
  const handlePicFilterSearch = (k, txt) => setPicFilterSearch(fs => ({ ...fs, [k]: txt }));
  const picAllChecked = k => (tempPicSelections[k] || []).length === (distinctPic[k] || []).length;
  const togglePicAll = k => { const all = distinctPic[k] || []; setTempPicSelections(ts => ({ ...ts, [k]: ts[k]?.length === all.length ? [] : [...all] })); };
  const togglePicOne = (k, v) => setTempPicSelections(ts => { const sel = ts[k] || []; return { ...ts, [k]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] }; });
  const applyPicFilter = k => setPicFilterConfig(cfg => ({ ...cfg, [k]: tempPicSelections[k] || [] }));
  const handlePicSort = (k, dir) => setPicSortConfig({ key: k, direction: dir });
  const distinctPic = useMemo(() => {
    const map = { leadNo: new Set(), enteredDate: new Set(), enteredBy: new Set(), pictureDescription: new Set() };
    pictures.forEach(r => { map.leadNo.add(String(r.leadNo)); map.enteredDate.add(fmt(r.enteredDate)); map.enteredBy.add(r.enteredBy || ''); map.pictureDescription.add(r.pictureDescription || ''); });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s).filter(Boolean)]));
  }, [pictures]);

  // ── Audio filter / sort ───────────────────────────────────────────────────
  const [audAnchorRect, setAudAnchorRect] = useState(null);
  const [openAudFilter, setOpenAudFilter] = useState(null);
  const [audFilterConfig, setAudFilterConfig] = useState({ leadNo: [], enteredDate: [], enteredBy: [], audioDescription: [] });
  const [audFilterSearch, setAudFilterSearch] = useState({});
  const [tempAudSelections, setTempAudSelections] = useState({});
  const [audSortConfig, setAudSortConfig] = useState({ key: 'leadNo', direction: 'asc' });
  const handleAudFilterSearch = (k, txt) => setAudFilterSearch(fs => ({ ...fs, [k]: txt }));
  const audAllChecked = k => (tempAudSelections[k] || []).length === (distinctAud[k] || []).length;
  const toggleAudAll = k => { const all = distinctAud[k] || []; setTempAudSelections(ts => ({ ...ts, [k]: ts[k]?.length === all.length ? [] : [...all] })); };
  const toggleAudOne = (k, v) => setTempAudSelections(ts => { const sel = ts[k] || []; return { ...ts, [k]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] }; });
  const applyAudFilter = k => setAudFilterConfig(cfg => ({ ...cfg, [k]: tempAudSelections[k] || [] }));
  const handleAudSort = (k, dir) => setAudSortConfig({ key: k, direction: dir });
  const distinctAud = useMemo(() => {
    const map = { leadNo: new Set(), enteredDate: new Set(), enteredBy: new Set(), audioDescription: new Set() };
    audio.forEach(r => { map.leadNo.add(String(r.leadNo)); map.enteredDate.add(fmt(r.enteredDate)); map.enteredBy.add(r.enteredBy || ''); map.audioDescription.add(r.audioDescription || ''); });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s).filter(Boolean)]));
  }, [audio]);

  // ── Video filter / sort ───────────────────────────────────────────────────
  const [vidAnchorRect, setVidAnchorRect] = useState(null);
  const [openVidFilter, setOpenVidFilter] = useState(null);
  const [vidFilterConfig, setVidFilterConfig] = useState({ leadNo: [], enteredDate: [], enteredBy: [], videoDescription: [] });
  const [vidFilterSearch, setVidFilterSearch] = useState({});
  const [tempVidSelections, setTempVidSelections] = useState({});
  const [vidSortConfig, setVidSortConfig] = useState({ key: 'leadNo', direction: 'asc' });
  const handleVidFilterSearch = (k, txt) => setVidFilterSearch(fs => ({ ...fs, [k]: txt }));
  const vidAllChecked = k => (tempVidSelections[k] || []).length === (distinctVid[k] || []).length;
  const toggleVidAll = k => { const all = distinctVid[k] || []; setTempVidSelections(ts => ({ ...ts, [k]: ts[k]?.length === all.length ? [] : [...all] })); };
  const toggleVidOne = (k, v) => setTempVidSelections(ts => { const sel = ts[k] || []; return { ...ts, [k]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] }; });
  const applyVidFilter = k => setVidFilterConfig(cfg => ({ ...cfg, [k]: tempVidSelections[k] || [] }));
  const handleVidSort = (k, dir) => setVidSortConfig({ key: k, direction: dir });
  const distinctVid = useMemo(() => {
    const map = { leadNo: new Set(), enteredDate: new Set(), enteredBy: new Set(), videoDescription: new Set() };
    videos.forEach(r => { map.leadNo.add(String(r.leadNo)); map.enteredDate.add(fmt(r.enteredDate)); map.enteredBy.add(r.enteredBy || ''); map.videoDescription.add(r.videoDescription || ''); });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s).filter(Boolean)]));
  }, [videos]);

  // ── Persons filter / sort ─────────────────────────────────────────────────
  const [perAnchorRect, setPerAnchorRect] = useState(null);
  const [openPerFilter, setOpenPerFilter] = useState(null);
  const [perFilterConfig, setPerFilterConfig] = useState({ leadNo: [], enteredBy: [], fullName: [], dobFormatted: [], fullAddress: [], phone: [] });
  const [perFilterSearch, setPerFilterSearch] = useState({});
  const [tempPerSelections, setTempPerSelections] = useState({});
  const [perSortConfig, setPerSortConfig] = useState({ key: 'leadNo', direction: 'asc' });
  const [selectedPersonModal, setSelectedPersonModal] = useState(null);

  const handlePerFilterSearch = (k, txt) => setPerFilterSearch(fs => ({ ...fs, [k]: txt }));
  const perAllChecked = k => (tempPerSelections[k] || []).length === (distinctPer[k] || []).length;
  const togglePerAll = k => { const all = distinctPer[k] || []; setTempPerSelections(ts => ({ ...ts, [k]: ts[k]?.length === all.length ? [] : [...all] })); };
  const togglePerOne = (k, v) => setTempPerSelections(ts => { const sel = ts[k] || []; return { ...ts, [k]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] }; });
  const applyPerFilter = k => setPerFilterConfig(cfg => ({ ...cfg, [k]: tempPerSelections[k] || [] }));
  const handlePerSort = (k, dir) => setPerSortConfig({ key: k, direction: dir });

  // helpers to compute derived person fields
  const personFullName = (p) => [p.firstName, p.middleInitial, p.lastName, p.suffix].filter(Boolean).join(' ') || p.businessName || '';
  const personDob = (p) => p.dateOfBirth ? (() => { const d = new Date(p.dateOfBirth); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString(); })() : '';
  const personAddr = (p) => p.address ? [p.address.street1, p.address.city, p.address.state, p.address.zipCode].filter(Boolean).join(', ') : '';
  const personPhone = (p) => p.cellNumber || p.workNumber || p.homeNumber || '';

  const distinctPer = useMemo(() => {
    const map = { leadNo: new Set(), enteredBy: new Set(), fullName: new Set(), dobFormatted: new Set(), fullAddress: new Set(), phone: new Set() };
    persons.forEach(p => {
      map.leadNo.add(String(p.leadNo));
      map.enteredBy.add(p.enteredBy || '');
      map.fullName.add(personFullName(p));
      map.dobFormatted.add(personDob(p));
      map.fullAddress.add(personAddr(p));
      map.phone.add(personPhone(p));
    });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s).filter(Boolean)]));
  }, [persons]);

  // ── Vehicles filter / sort ────────────────────────────────────────────────
  const [vehAnchorRect, setVehAnchorRect] = useState(null);
  const [openVehFilter, setOpenVehFilter] = useState(null);
  const [vehFilterConfig, setVehFilterConfig] = useState({ leadNo: [], enteredBy: [], year: [], make: [], model: [], plate: [], color: [] });
  const [vehFilterSearch, setVehFilterSearch] = useState({});
  const [tempVehSelections, setTempVehSelections] = useState({});
  const [vehSortConfig, setVehSortConfig] = useState({ key: 'leadNo', direction: 'asc' });
  const [selectedVehicleModal, setSelectedVehicleModal] = useState(null);

  const handleVehFilterSearch = (k, txt) => setVehFilterSearch(fs => ({ ...fs, [k]: txt }));
  const vehAllChecked = k => (tempVehSelections[k] || []).length === (distinctVeh[k] || []).length;
  const toggleVehAll = k => { const all = distinctVeh[k] || []; setTempVehSelections(ts => ({ ...ts, [k]: ts[k]?.length === all.length ? [] : [...all] })); };
  const toggleVehOne = (k, v) => setTempVehSelections(ts => { const sel = ts[k] || []; return { ...ts, [k]: sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v] }; });
  const applyVehFilter = k => setVehFilterConfig(cfg => ({ ...cfg, [k]: tempVehSelections[k] || [] }));
  const handleVehSort = (k, dir) => setVehSortConfig({ key: k, direction: dir });

  const vehicleColor = (v) => [v.primaryColor, v.secondaryColor].filter(Boolean).join(' / ');

  const distinctVeh = useMemo(() => {
    const map = { leadNo: new Set(), enteredBy: new Set(), year: new Set(), make: new Set(), model: new Set(), plate: new Set(), color: new Set() };
    vehicles.forEach(v => {
      map.leadNo.add(String(v.leadNo));
      map.enteredBy.add(v.enteredBy || '');
      map.year.add(String(v.year || ''));
      map.make.add(v.make || '');
      map.model.add(v.model || '');
      map.plate.add(v.plate || '');
      map.color.add(vehicleColor(v));
    });
    return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, Array.from(s).filter(Boolean)]));
  }, [vehicles]);


  // ── Alert modal ───────────────────────────────────────────────────────────
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const showAlert = (msg) => { setAlertMessage(msg); setAlertOpen(true); };

  // ── Close case confirmation ───────────────────────────────────────────────
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [closingCase, setClosingCase] = useState(false);

  const handleCloseCase = async () => {
    setConfirmCloseOpen(false);
    setClosingCase(true);
    try {
      await api.put(`/api/cases/${caseNo}/close`);
      setSelectedCase((prev) => ({ ...prev, status: 'COMPLETED' }));
    } catch (err) {
      showAlert(err?.response?.data?.message || 'Failed to close case.');
    } finally {
      setClosingCase(false);
    }
  };

  // ── Fetch case document ───────────────────────────────────────────────────
  useEffect(() => {
    if (!caseNo) return;
    api.get(`/api/cases/${caseNo}`)
      .then((r) => {
        // try by caseNo (ID route may return by _id; fallback to team route for name)
        setCaseDoc(r.data);
      })
      .catch(() => {});
  }, [caseNo]);

  // ── Fetch all leads (needed for access level resolution) ──────────────────
  useEffect(() => {
    const caseId = selectedCase?._id || selectedCase?.id;
    if (!caseId) return;
    api.get(`/api/lead/case/${caseId}`)
      .then((r) => setLeads(Array.isArray(r.data) ? r.data : []))
      .catch(() => setLeads([]));
  }, [selectedCase?._id, selectedCase?.id]);

  // ── Helper: set of leadNos where current user is an assignee ─────────────
  const assignedLeadNos = useMemo(
    () => new Set(
      leads
        .filter((l) => l.assignedTo?.some((a) =>
          signedInUserId && a.userId
            ? String(a.userId) === signedInUserId
            : a.username === signedInOfficer
        ))
        .map((l) => l.leadNo)
    ),
    [leads, signedInOfficer, signedInUserId]
  );

  // ── Access level filter function ──────────────────────────────────────────
  const canView = (record) => {
    const al = record.accessLevel || 'Everyone';
    if (al === 'Everyone') return true;
    if (isCMorDS) return true;
    if (al === 'Case Manager and Assignees') return assignedLeadNos.has(record.leadNo);
    return false; // Case Manager Only
  };

  // ── Fetch persons ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!caseNo) return;
    setLoadingPersons(true);
    api.get(`/api/lrperson/case/${caseNo}`)
      .then((r) => setPersons(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPersons([]))
      .finally(() => setLoadingPersons(false));
  }, [caseNo]);

  // ── Fetch vehicles ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!caseNo) return;
    setLoadingVehicles(true);
    api.get(`/api/lrvehicle/case/${caseNo}`)
      .then((r) => setVehicles(Array.isArray(r.data) ? r.data : []))
      .catch(() => setVehicles([]))
      .finally(() => setLoadingVehicles(false));
  }, [caseNo]);

  // ── Fetch all file types ──────────────────────────────────────────────────
  useEffect(() => {
    if (!caseNo) return;
    setLoadingFiles(true);
    Promise.all([
      api.get(`/api/lrevidence/case/${caseNo}`).then((r) => r.data).catch(() => []),
      api.get(`/api/lrenclosure/case/${caseNo}`).then((r) => r.data).catch(() => []),
      api.get(`/api/lrpicture/case/${caseNo}`).then((r) => r.data).catch(() => []),
      api.get(`/api/lraudio/case/${caseNo}`).then((r) => r.data).catch(() => []),
      api.get(`/api/lrvideo/case/${caseNo}`).then((r) => r.data).catch(() => []),
    ]).then(([ev, en, pic, aud, vid]) => {
      setEvidence(Array.isArray(ev) ? ev : []);
      setEnclosures(Array.isArray(en) ? en : []);
      setPictures(Array.isArray(pic) ? pic : []);
      setAudio(Array.isArray(aud) ? aud : []);
      setVideos(Array.isArray(vid) ? vid : []);
    }).finally(() => setLoadingFiles(false));
  }, [caseNo]);

  // ── Save case edits ───────────────────────────────────────────────────────
  const handleSaveCase = async () => {
    if (!editCaseNo.trim() || !editCaseName.trim()) {
      showAlert('Case number and case name cannot be empty.');
      return;
    }
    if (!/^[A-Za-z0-9-]+$/.test(editCaseNo.trim())) {
      showAlert('Case number can only contain letters, digits, and hyphens (-).');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/api/cases/${selectedCase?._id || caseNo}`, {
        caseNo: editCaseNo.trim(),
        caseName: editCaseName.trim(),
      });
      showAlert('Case updated successfully. Please refresh to see changes reflected in the sidebar.');
      setEditing(false);
    } catch (err) {
      showAlert(err?.response?.data?.message || 'Failed to update case.');
    } finally {
      setSaving(false);
    }
  };

  // ── Filter helpers ────────────────────────────────────────────────────────
  const filterPersons = (list) => list.filter(canView);
  const filterVehicles = (list) => list.filter(canView);
  const filterFiles = (list) => list.filter(canView);

  // ── Counts for tabs ───────────────────────────────────────────────────────
  const evCount = filterFiles(evidence).length;
  const enCount = filterFiles(enclosures).length;
  const picCount = filterFiles(pictures).length;
  const audCount = filterFiles(audio).length;
  const vidCount = filterFiles(videos).length;
  const totalFiles = evCount + enCount + picCount + audCount + vidCount;
  const visiblePersons = filterPersons(persons);
  const visibleVehicles = filterVehicles(vehicles);

  // ── File link / download ──────────────────────────────────────────────────
  const FileCell = ({ record }) => {
    if (record.isLink && record.link) {
      return (
        <a href={record.link} target="_blank" rel="noopener noreferrer" className={styles['file-link']}>
          🔗 {record.link.length > 40 ? record.link.slice(0, 40) + '…' : record.link}
        </a>
      );
    }
    if (record.signedUrl) {
      return (
        <a href={record.signedUrl} target="_blank" rel="noopener noreferrer" className={styles['file-link']}>
          📎 {record.originalName || 'Download'}
        </a>
      );
    }
    return <span style={{ color: '#9ca3af' }}>No file</span>;
  };

  // ── Reusable filter/sort table renderer ──────────────────────────────────
  const renderFilterTable = ({ cols, data, descField, filterConfig, filterSearch, tempSelections, sortConfig, anchorRect, openFilter, setOpenFilter, setAnchorRect, distinct, onFilterSearch, onSort, allChecked, toggleAll, toggleOne, applyFilter, emptyLabel }) => {
    let rows = filterFiles(data).filter(r =>
      cols.filter(c => c.key).every(({ key }) => {
        const sel = filterConfig[key];
        if (!sel || !sel.length) return true;
        const val = key === 'enteredDate' ? fmt(r.enteredDate) : String(r[key] || '');
        return sel.includes(val);
      })
    );
    const { key: sk, direction: sd } = sortConfig;
    if (sk) {
      rows = rows.slice().sort((a, b) => {
        const aV = sk === 'leadNo' ? Number(a[sk]) : sk === 'enteredDate' ? new Date(a[sk]) : (a[sk] || '').toLowerCase();
        const bV = sk === 'leadNo' ? Number(b[sk]) : sk === 'enteredDate' ? new Date(b[sk]) : (b[sk] || '').toLowerCase();
        if (aV < bV) return sd === 'asc' ? -1 : 1;
        if (aV > bV) return sd === 'asc' ? 1 : -1;
        return 0;
      });
    }
    if (!rows.length) return <EmptyState label={emptyLabel} />;
    return (
      <div className={styles['table-wrapper']}>
        <table className={styles['data-table']}>
          <thead>
            <tr>
              {cols.map(({ label, key, width }) => (
                <th key={label} className={styles['column-header1']} style={{ width, position: 'relative' }}>
                  <div className={styles['header-title']}>
                    {label}
                    {key && (
                      <span>
                        <button
                          onClick={(e) => { setAnchorRect(e.currentTarget.getBoundingClientRect()); setOpenFilter(prev => prev === key ? null : key); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
                        >
                          <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className={styles['icon-image']} alt="" />
                        </button>
                        <Filter
                          dataKey={key}
                          distinctValues={distinct}
                          open={openFilter === key}
                          anchorRef={{ current: { getBoundingClientRect: () => anchorRect, contains: () => false } }}
                          searchValue={filterSearch[key] || ''}
                          selections={tempSelections[key] || []}
                          onSearch={onFilterSearch}
                          onSort={onSort}
                          allChecked={allChecked}
                          onToggleAll={toggleAll}
                          onToggleOne={toggleOne}
                          onApply={() => { applyFilter(key); setOpenFilter(null); }}
                          onCancel={() => setOpenFilter(null)}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.leadNo}</td>
                <td>{fmt(r.enteredDate)}</td>
                <td>{r.enteredBy}</td>
                {cols.some(c => c.key === 'type') && <td>{r.type || '—'}</td>}
                <td className={styles['description-cell']}>
                  <div className={expandedRows.has(r._id) ? styles['narrative-expanded'] : styles['narrative-collapsed']}>
                    {r[descField] || '—'}
                  </div>
                  {r[descField] && (
                    <button className={styles['view-toggle-btn']} onClick={() => toggleRow(r._id)}>
                      {expandedRows.has(r._id) ? 'View Less ▲' : 'View ▶'}
                    </button>
                  )}
                </td>
                <td><FileCell record={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ── Render file tab content ───────────────────────────────────────────────
  const renderFileTab = () => {
    if (loadingFiles) return <div className={styles.loading}>Loading files…</div>;

    if (fileTab === 'evidence') {
      const evCols = [
        { label: 'Lead',        key: 'leadNo',              width: '6%'  },
        { label: 'Date',        key: 'enteredDate',         width: '10%' },
        { label: 'Entered By',  key: 'enteredBy',           width: '14%' },
        { label: 'Type',        key: 'type',                width: '10%' },
        { label: 'Description', key: 'evidenceDescription', width: '32%' },
        { label: 'File / Link', key: null,                  width: '28%' },
      ];

      // apply filter then sort
      let rows = filterFiles(evidence).filter(ev =>
        evCols.filter(c => c.key).every(({ key }) => {
          const sel = evFilterConfig[key];
          if (!sel || !sel.length) return true;
          const val = key === 'collectionDate' ? fmt(ev.collectionDate)
                    : key === 'enteredDate'    ? fmt(ev.enteredDate)
                    : String(ev[key] || '');
          return sel.includes(val);
        })
      );
      const { key: sk, direction: sd } = evSortConfig;
      if (sk) {
        rows = rows.slice().sort((a, b) => {
          const aV = sk === 'leadNo' ? Number(a[sk]) : (sk === 'collectionDate' || sk === 'enteredDate') ? new Date(a[sk]) : (a[sk] || '').toLowerCase();
          const bV = sk === 'leadNo' ? Number(b[sk]) : (sk === 'collectionDate' || sk === 'enteredDate') ? new Date(b[sk]) : (b[sk] || '').toLowerCase();
          if (aV < bV) return sd === 'asc' ? -1 : 1;
          if (aV > bV) return sd === 'asc' ? 1 : -1;
          return 0;
        });
      }

      if (!rows.length) return <EmptyState label="evidence records" />;
      return (
        <div className={styles['table-wrapper']}>
          <table className={styles['data-table']}>
            <thead>
              <tr>
                {evCols.map(({ label, key, width }) => (
                  <th key={label} className={styles['column-header1']} style={{ width, position: 'relative' }}>
                    <div className={styles['header-title']}>
                      {label}
                      {key && (
                        <span>
                          <button
                            onClick={(e) => {
                              setEvAnchorRect(e.currentTarget.getBoundingClientRect());
                              setOpenEvFilter(prev => prev === key ? null : key);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
                          >
                            <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className={styles['icon-image']} alt="" />
                          </button>
                          <Filter
                            dataKey={key}
                            distinctValues={distinctEv}
                            open={openEvFilter === key}
                            anchorRef={{ current: { getBoundingClientRect: () => evAnchorRect, contains: () => false } }}
                            searchValue={evFilterSearch[key] || ''}
                            selections={tempEvSelections[key] || []}
                            onSearch={handleEvFilterSearch}
                            onSort={handleEvSort}
                            allChecked={evAllChecked}
                            onToggleAll={toggleEvAll}
                            onToggleOne={toggleEvOne}
                            onApply={() => { applyEvFilter(key); setOpenEvFilter(null); }}
                            onCancel={() => setOpenEvFilter(null)}
                          />
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((ev) => (
                <tr key={ev._id}>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{ev.leadNo}</td>
                  <td>{fmt(ev.enteredDate)}</td>
                  <td>{ev.enteredBy}</td>
                  <td>{ev.type || '—'}</td>
                  <td className={styles['description-cell']}>
                    <div className={expandedRows.has(ev._id) ? styles['narrative-expanded'] : styles['narrative-collapsed']}>
                      {ev.evidenceDescription || '—'}
                    </div>
                    {ev.evidenceDescription && (
                      <button className={styles['view-toggle-btn']} onClick={() => toggleRow(ev._id)}>
                        {expandedRows.has(ev._id) ? 'View Less ▲' : 'View ▶'}
                      </button>
                    )}
                  </td>
                  <td><FileCell record={ev} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (fileTab === 'enclosures') {
      const cols = [
        { label: 'Lead',        key: 'leadNo',                width: '6%'  },
        { label: 'Date',        key: 'enteredDate',           width: '10%' },
        { label: 'Entered By',  key: 'enteredBy',             width: '14%' },
        { label: 'Type',        key: 'type',                  width: '10%' },
        { label: 'Description', key: 'enclosureDescription',  width: '32%' },
        { label: 'File / Link', key: null,                    width: '28%' },
      ];
      return renderFilterTable({ cols, data: enclosures, descField: 'enclosureDescription', filterConfig: encFilterConfig, filterSearch: encFilterSearch, tempSelections: tempEncSelections, sortConfig: encSortConfig, anchorRect: encAnchorRect, openFilter: openEncFilter, setOpenFilter: setOpenEncFilter, setAnchorRect: setEncAnchorRect, distinct: distinctEnc, onFilterSearch: handleEncFilterSearch, onSort: handleEncSort, allChecked: encAllChecked, toggleAll: toggleEncAll, toggleOne: toggleEncOne, applyFilter: applyEncFilter, emptyLabel: 'enclosure records' });
    }

    if (fileTab === 'pictures') {
      const cols = [
        { label: 'Lead',        key: 'leadNo',              width: '6%'  },
        { label: 'Date',        key: 'enteredDate',         width: '10%' },
        { label: 'Entered By',  key: 'enteredBy',           width: '14%' },
        { label: 'Description', key: 'pictureDescription',  width: '42%' },
        { label: 'File / Link', key: null,                  width: '28%' },
      ];
      return renderFilterTable({ cols, data: pictures, descField: 'pictureDescription', filterConfig: picFilterConfig, filterSearch: picFilterSearch, tempSelections: tempPicSelections, sortConfig: picSortConfig, anchorRect: picAnchorRect, openFilter: openPicFilter, setOpenFilter: setOpenPicFilter, setAnchorRect: setPicAnchorRect, distinct: distinctPic, onFilterSearch: handlePicFilterSearch, onSort: handlePicSort, allChecked: picAllChecked, toggleAll: togglePicAll, toggleOne: togglePicOne, applyFilter: applyPicFilter, emptyLabel: 'picture records' });
    }

    if (fileTab === 'audio') {
      const cols = [
        { label: 'Lead',        key: 'leadNo',            width: '6%'  },
        { label: 'Date',        key: 'enteredDate',       width: '10%' },
        { label: 'Entered By',  key: 'enteredBy',         width: '14%' },
        { label: 'Description', key: 'audioDescription',  width: '42%' },
        { label: 'File / Link', key: null,                width: '28%' },
      ];
      return renderFilterTable({ cols, data: audio, descField: 'audioDescription', filterConfig: audFilterConfig, filterSearch: audFilterSearch, tempSelections: tempAudSelections, sortConfig: audSortConfig, anchorRect: audAnchorRect, openFilter: openAudFilter, setOpenFilter: setOpenAudFilter, setAnchorRect: setAudAnchorRect, distinct: distinctAud, onFilterSearch: handleAudFilterSearch, onSort: handleAudSort, allChecked: audAllChecked, toggleAll: toggleAudAll, toggleOne: toggleAudOne, applyFilter: applyAudFilter, emptyLabel: 'audio records' });
    }

    if (fileTab === 'video') {
      const cols = [
        { label: 'Lead',        key: 'leadNo',            width: '6%'  },
        { label: 'Date',        key: 'enteredDate',       width: '10%' },
        { label: 'Entered By',  key: 'enteredBy',         width: '14%' },
        { label: 'Description', key: 'videoDescription',  width: '42%' },
        { label: 'File / Link', key: null,                width: '28%' },
      ];
      return renderFilterTable({ cols, data: videos, descField: 'videoDescription', filterConfig: vidFilterConfig, filterSearch: vidFilterSearch, tempSelections: tempVidSelections, sortConfig: vidSortConfig, anchorRect: vidAnchorRect, openFilter: openVidFilter, setOpenFilter: setOpenVidFilter, setAnchorRect: setVidAnchorRect, distinct: distinctVid, onFilterSearch: handleVidFilterSearch, onSort: handleVidSort, allChecked: vidAllChecked, toggleAll: toggleVidAll, toggleOne: toggleVidOne, applyFilter: applyVidFilter, emptyLabel: 'video records' });
    }

    return null;
  };

  const EmptyState = ({ label }) => (
    <div className={styles['empty-state']}>
      <span>No {label} found for this case</span>
    </div>
  );

  const statusBadgeCls = (status) => {
    if (!status) return '';
    const s = status.toUpperCase();
    if (s === 'ARCHIVED') return styles.archived;
    if (s === 'COMPLETED') return styles.completed;
    return '';
  };

  return (
    <div className={styles['case-information']}>
      <Navbar />
      <div className={styles['main-container']}>
        <SideBar activePage="CaseInformation" />
        <div className={styles['left-content']}>

          {/* ── Case identity card (CoC-style) ──────────────── */}
          <div className={styles['ci-card']}>
            <div className={styles['ci-card-header']}>
              <h3>Case #{caseNo}: {caseName}</h3>
              <span className={`${styles.chip} ${styles['chip-status']} ${styles[(selectedCase?.status || 'ongoing').toLowerCase()]}`}>
                {selectedCase?.status || 'ONGOING'}
              </span>
            </div>
            <div className={styles['ci-card-counters']}>
              <span className={`${styles.counter} ${styles.base}`}>Leads {leads.length}</span>
              <span className={`${styles.counter} ${styles.base}`}>Files {totalFiles}</span>
              <span className={`${styles.counter} ${styles.base}`}>Persons {persons.filter(canView).length}</span>
              <span className={`${styles.counter} ${styles.base}`}>Vehicles {vehicles.filter(canView).length}</span>
              {isCMorDS && (
                <button
                  className={`${styles['edit-case-btn']} ${editing ? styles['edit-case-btn--active'] : ''}`}
                  onClick={() => {
                    if (!editing) {
                      setEditCaseNo(caseNo || '');
                      setEditCaseName(caseName || '');
                      setEditing(true);
                    }
                  }}
                >
                  Edit Case
                </button>
              )}
              {isDS && (selectedCase?.status || 'ONGOING') === 'ONGOING' && (
                <button
                  className={styles['close-case-btn']}
                  onClick={() => setConfirmCloseOpen(true)}
                  disabled={closingCase}
                >
                  {closingCase ? 'Closing…' : 'Close Case'}
                </button>
              )}
            </div>
          </div>

          {/* ── Edit form ────────────────────────────────────── */}
          {editing && (
            <div className={styles['edit-form']}>
              <div className={styles['edit-form-row']}>
                <div className={styles['edit-field']}>
                  <label>Case Number</label>
                  <input
                    value={editCaseNo}
                    onChange={(e) => setEditCaseNo(e.target.value)}
                    placeholder="e.g. 2024-001"
                  />
                </div>
                <div className={styles['edit-field']}>
                  <label>Case Name</label>
                  <input
                    value={editCaseName}
                    onChange={(e) => setEditCaseName(e.target.value)}
                    placeholder="Case name"
                  />
                </div>
              </div>
              <div className={styles['edit-form-actions']}>
                <button
                  className={styles['save-btn']}
                  onClick={handleSaveCase}
                  disabled={saving}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
                <button
                  className={styles['cancel-btn']}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Files section ─────────────────────────────────── */}
          <div className={styles['collapsible-section']}>
            <button
              className={styles['collapse-header']}
              onClick={() => setOpenFiles((p) => !p)}
            >
              <span className={styles['collapse-header-left']}>
                <span className={styles['collapse-title']}>Case Files</span>
                <span className={styles['section-count']}>{totalFiles}</span>
              </span>
              <img
                src={openFiles ? upIcon : downIcon}
                alt="toggle"
                className={styles['icon-image']}
              />
            </button>

            {openFiles && (
              <div className={styles['section-body']}>
                {/* Tab bar */}
                <div className={styles['tab-bar']}>
                  {[
                    { key: 'evidence', label: 'Evidence', count: evCount, icon: '' },
                    { key: 'enclosures', label: 'Enclosures', count: enCount, icon: '' },
                    { key: 'pictures', label: 'Pictures', count: picCount, icon: '' },
                    { key: 'audio', label: 'Audio', count: audCount, icon: '' },
                    { key: 'video', label: 'Video', count: vidCount, icon: '' },
                  ].map((t) => (
                    <button
                      key={t.key}
                      className={`${styles['tab-btn']} ${fileTab === t.key ? styles.active : ''}`}
                      onClick={() => setFileTab(t.key)}
                    >
                      {t.icon} {t.label}
                      <span className={styles['tab-count']}>{t.count}</span>
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {renderFileTab()}
              </div>
            )}
          </div>

          {/* ── Persons section ───────────────────────────────── */}
          <div className={styles['collapsible-section']}>
            <button
              className={styles['collapse-header']}
              onClick={() => setOpenPersons((p) => !p)}
            >
              <span className={styles['collapse-header-left']}>
                <span className={styles['collapse-title']}>Persons</span>
                <span className={styles['section-count']}>{visiblePersons.length}</span>
              </span>
              <img
                src={openPersons ? upIcon : downIcon}
                alt="toggle"
                className={styles['icon-image']}
              />
            </button>

            {openPersons && (
              <div className={styles['section-body']}>
                {loadingPersons ? (
                  <div className={styles.loading}>Loading persons…</div>
                ) : (() => {
                  // apply filter config
                  let personRows = filterPersons(persons).filter(p => {
                    const computed = {
                      leadNo: String(p.leadNo || ''),
                      enteredBy: p.enteredBy || '',
                      fullName: personFullName(p),
                      dobFormatted: personDob(p),
                      fullAddress: personAddr(p),
                      phone: personPhone(p),
                    };
                    return ['leadNo', 'enteredBy', 'fullName', 'dobFormatted', 'fullAddress', 'phone'].every(key => {
                      const sel = perFilterConfig[key];
                      if (!sel || !sel.length) return true;
                      return sel.includes(computed[key]);
                    });
                  });
                  // sort
                  const { key: psk, direction: psd } = perSortConfig;
                  if (psk) {
                    personRows = personRows.slice().sort((a, b) => {
                      let aV, bV;
                      if (psk === 'leadNo') { aV = Number(a.leadNo); bV = Number(b.leadNo); }
                      else if (psk === 'fullName') { aV = personFullName(a).toLowerCase(); bV = personFullName(b).toLowerCase(); }
                      else if (psk === 'dobFormatted') { aV = new Date(a.dateOfBirth || 0); bV = new Date(b.dateOfBirth || 0); }
                      else if (psk === 'fullAddress') { aV = personAddr(a).toLowerCase(); bV = personAddr(b).toLowerCase(); }
                      else if (psk === 'phone') { aV = personPhone(a).toLowerCase(); bV = personPhone(b).toLowerCase(); }
                      else { aV = (a[psk] || '').toLowerCase(); bV = (b[psk] || '').toLowerCase(); }
                      if (aV < bV) return psd === 'asc' ? -1 : 1;
                      if (aV > bV) return psd === 'asc' ? 1 : -1;
                      return 0;
                    });
                  }
                  if (!personRows.length) return (
                    <div className={styles['empty-state']}>
                      <span>No persons found for this case</span>
                    </div>
                  );
                  const perCols = [
                    { label: 'Lead',       key: 'leadNo',       width: '7%'  },
                    { label: 'Entered By', key: 'enteredBy',    width: '12%' },
                    { label: 'Name',       key: 'fullName',     width: '17%' },
                    { label: 'DOB',        key: 'dobFormatted', width: '10%' },
                    { label: 'Address',    key: 'fullAddress',  width: '26%' },
                    { label: 'Phone',      key: 'phone',        width: '13%' },
                    { label: 'More',       key: null,           width: '8%'  },
                  ];
                  return (
                    <div className={styles['table-wrapper']}>
                      <table className={styles['data-table']}>
                        <thead>
                          <tr>
                            {perCols.map(({ label, key, width }) => (
                              <th key={label} className={styles['column-header1']} style={{ width, position: 'relative' }}>
                                <div className={styles['header-title']}>
                                  {label}
                                  {key && (
                                    <span>
                                      <button
                                        onClick={(e) => { setPerAnchorRect(e.currentTarget.getBoundingClientRect()); setOpenPerFilter(prev => prev === key ? null : key); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
                                      >
                                        <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className={styles['icon-image']} alt="" />
                                      </button>
                                      <Filter
                                        dataKey={key}
                                        distinctValues={distinctPer}
                                        open={openPerFilter === key}
                                        anchorRef={{ current: { getBoundingClientRect: () => perAnchorRect, contains: () => false } }}
                                        searchValue={perFilterSearch[key] || ''}
                                        selections={tempPerSelections[key] || []}
                                        onSearch={handlePerFilterSearch}
                                        onSort={handlePerSort}
                                        allChecked={perAllChecked}
                                        onToggleAll={togglePerAll}
                                        onToggleOne={togglePerOne}
                                        onApply={() => { applyPerFilter(key); setOpenPerFilter(null); }}
                                        onCancel={() => setOpenPerFilter(null)}
                                      />
                                    </span>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {personRows.map((p) => {
                            return (
                              <tr key={p._id}>
                                <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.leadNo}</td>
                                <td>{p.enteredBy || '—'}</td>
                                <td style={{ fontWeight: 600 }}>{personFullName(p) || '—'}</td>
                                <td>{personDob(p) || '—'}</td>
                                <td style={{ wordBreak: 'break-word' }}>{personAddr(p) || '—'}</td>
                                <td>{personPhone(p) || '—'}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <button className={styles['more-btn']} onClick={() => setSelectedPersonModal(p)}>
                                    More
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* ── Vehicles section ──────────────────────────────── */}
          <div className={styles['collapsible-section']}>
            <button
              className={styles['collapse-header']}
              onClick={() => setOpenVehicles((p) => !p)}
            >
              <span className={styles['collapse-header-left']}>
                <span className={styles['collapse-title']}>Vehicles</span>
                <span className={styles['section-count']}>{visibleVehicles.length}</span>
              </span>
              <img
                src={openVehicles ? upIcon : downIcon}
                alt="toggle"
                className={styles['icon-image']}
              />
            </button>

            {openVehicles && (
              <div className={styles['section-body']}>
                {loadingVehicles ? (
                  <div className={styles.loading}>Loading vehicles…</div>
                ) : (() => {
                  let vehRows = filterVehicles(vehicles).filter(v => {
                    const computed = {
                      leadNo: String(v.leadNo || ''),
                      enteredBy: v.enteredBy || '',
                      year: String(v.year || ''),
                      make: v.make || '',
                      model: v.model || '',
                      plate: v.plate || '',
                      color: vehicleColor(v),
                    };
                    return ['leadNo', 'enteredBy', 'year', 'make', 'model', 'plate', 'color'].every(key => {
                      const sel = vehFilterConfig[key];
                      if (!sel || !sel.length) return true;
                      return sel.includes(computed[key]);
                    });
                  });
                  const { key: vsk, direction: vsd } = vehSortConfig;
                  if (vsk) {
                    vehRows = vehRows.slice().sort((a, b) => {
                      let aV, bV;
                      if (vsk === 'leadNo') { aV = Number(a.leadNo); bV = Number(b.leadNo); }
                      else if (vsk === 'year') { aV = Number(a.year || 0); bV = Number(b.year || 0); }
                      else if (vsk === 'color') { aV = vehicleColor(a).toLowerCase(); bV = vehicleColor(b).toLowerCase(); }
                      else { aV = (a[vsk] || '').toLowerCase(); bV = (b[vsk] || '').toLowerCase(); }
                      if (aV < bV) return vsd === 'asc' ? -1 : 1;
                      if (aV > bV) return vsd === 'asc' ? 1 : -1;
                      return 0;
                    });
                  }
                  if (!vehRows.length) return (
                    <div className={styles['empty-state']}>
                      <span>No vehicles found for this case</span>
                    </div>
                  );
                  const vehCols = [
                    { label: 'Lead',       key: 'leadNo',   width: '7%'  },
                    { label: 'Entered By', key: 'enteredBy',width: '12%' },
                    { label: 'Year',       key: 'year',     width: '7%'  },
                    { label: 'Make',       key: 'make',     width: '12%' },
                    { label: 'Model',      key: 'model',    width: '12%' },
                    { label: 'Plate',      key: 'plate',    width: '10%' },
                    { label: 'Color',      key: 'color',    width: '12%' },
                    { label: 'More',       key: null,       width: '8%'  },
                  ];
                  return (
                    <div className={styles['table-wrapper']}>
                      <table className={styles['data-table']}>
                        <thead>
                          <tr>
                            {vehCols.map(({ label, key, width }) => (
                              <th key={label} className={styles['column-header1']} style={{ width, position: 'relative' }}>
                                <div className={styles['header-title']}>
                                  {label}
                                  {key && (
                                    <span>
                                      <button
                                        onClick={(e) => { setVehAnchorRect(e.currentTarget.getBoundingClientRect()); setOpenVehFilter(prev => prev === key ? null : key); }}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
                                      >
                                        <img src={`${process.env.PUBLIC_URL}/Materials/fs.png`} className={styles['icon-image']} alt="" />
                                      </button>
                                      <Filter
                                        dataKey={key}
                                        distinctValues={distinctVeh}
                                        open={openVehFilter === key}
                                        anchorRef={{ current: { getBoundingClientRect: () => vehAnchorRect, contains: () => false } }}
                                        searchValue={vehFilterSearch[key] || ''}
                                        selections={tempVehSelections[key] || []}
                                        onSearch={handleVehFilterSearch}
                                        onSort={handleVehSort}
                                        allChecked={vehAllChecked}
                                        onToggleAll={toggleVehAll}
                                        onToggleOne={toggleVehOne}
                                        onApply={() => { applyVehFilter(key); setOpenVehFilter(null); }}
                                        onCancel={() => setOpenVehFilter(null)}
                                      />
                                    </span>
                                  )}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {vehRows.map((v) => (
                            <tr key={v._id}>
                              <td style={{ textAlign: 'center', fontWeight: 600 }}>{v.leadNo}</td>
                              <td>{v.enteredBy || '—'}</td>
                              <td>{v.year || '—'}</td>
                              <td style={{ fontWeight: 600 }}>{v.make || '—'}</td>
                              <td>{v.model || '—'}</td>
                              <td>{v.plate || '—'}</td>
                              <td>{vehicleColor(v) || '—'}</td>
                              <td style={{ textAlign: 'center' }}>
                                <button className={styles['more-btn']} onClick={() => setSelectedVehicleModal(v)}>
                                  More
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Person detail modal ─────────────────────── */}
      <PersonModal
        isOpen={!!selectedPersonModal}
        onClose={() => setSelectedPersonModal(null)}
        personData={selectedPersonModal}
        caseName={caseName}
        leadNo={selectedPersonModal?.leadNo}
      />

      {/* ── Vehicle detail modal ─────────────────────── */}
      <VehicleModal
        isOpen={!!selectedVehicleModal}
        onClose={() => setSelectedVehicleModal(null)}
        vehicleData={selectedVehicleModal}
        caseName={caseName}
        leadNo={selectedVehicleModal?.leadNo}
      />

      <AlertModal
        isOpen={alertOpen}
        title="Case Information"
        message={alertMessage}
        onConfirm={() => setAlertOpen(false)}
        onClose={() => setAlertOpen(false)}
      />
      <AlertModal
        isOpen={confirmCloseOpen}
        title="Close Case"
        message={`Are you sure you want to close case "${caseNo} — ${caseName}"? This will mark it as COMPLETED.`}
        onConfirm={handleCloseCase}
        onClose={() => setConfirmCloseOpen(false)}
      />
    </div>
  );
};
