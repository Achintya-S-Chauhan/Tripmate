import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  HeartPulse,
  PhoneCall,
  MapPin,
  AlertOctagon,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Lock,
  Radio,
  Clock,
  UserCheck,
  FileText,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  StopCircle,
  UserPlus,
  Shield,
  X,
  Share2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Modal from '../components/common/Modal';
import {
  SAFETY_ICE_VAULT,
  EMBASSIES_DIRECTORY,
  TRAVEL_ADVISORIES,
  SAFETY_CHECKLISTS,
} from '../data/mockData';

export default function SafetyCenterPage() {
  const {
    user,
    openSosConfirmation,
    startEmergencySession,
    endEmergencySession,
    emergencySession,
    trustedContacts,
    addTrustedContact,
    editTrustedContact,
    removeTrustedContact,
    sendSafetyCheckInPing,
    checkInLogs,
    sosLogs,
    activeJourney,
    addToast,
    isDemoMode,
  } = useApp();

  const [expandedChecklist, setExpandedChecklist] = useState(0);
  const [embassySearch, setEmbassySearch] = useState('');
  const [customPingNote, setCustomPingNote] = useState('');

  // Trusted Contact Modal States
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deletingContact, setDeletingContact] = useState(null);

  // Form states for Add / Edit contact
  const [contactForm, setContactForm] = useState({
    name: '',
    relation: 'Family / Emergency Contact',
    phone: '',
    email: '',
    notifyOnSos: true,
  });

  const [formError, setFormError] = useState('');

  const isEmergency = emergencySession?.isActive;

  const copyToClipboard = (text, label) => {
    navigator.clipboard?.writeText(text);
    addToast('Copied to Clipboard', `${label}: ${text}`, 'info');
  };

  const formatElapsed = (sec = 0) => {
    const mins = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const secs = (sec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const filteredEmbassies = EMBASSIES_DIRECTORY.filter(
    (e) =>
      e.country.toLowerCase().includes(embassySearch.toLowerCase()) ||
      e.city.toLowerCase().includes(embassySearch.toLowerCase()) ||
      e.representation.toLowerCase().includes(embassySearch.toLowerCase())
  );

  // Contact form submission
  const handleContactSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!contactForm.name.trim()) {
      setFormError('Please enter a contact name.');
      return;
    }
    if (!contactForm.phone.trim() || contactForm.phone.trim().length < 7) {
      setFormError('Please provide a valid international or local phone number (e.g. +1 415 555-0192).');
      return;
    }

    if (editingContact) {
      editTrustedContact(editingContact.id, contactForm);
      setEditingContact(null);
    } else {
      addTrustedContact(contactForm);
      setIsAddContactModalOpen(false);
    }

    setContactForm({
      name: '',
      relation: 'Family / Emergency Contact',
      phone: '',
      email: '',
      notifyOnSos: true,
    });
  };

  const openEditModal = (contact) => {
    setEditingContact(contact);
    setContactForm({
      name: contact.name,
      relation: contact.relation || '',
      phone: contact.phone,
      email: contact.email || '',
      notifyOnSos: contact.notifyOnSos !== false,
    });
    setFormError('');
  };

  return (
    <div className="space-y-6">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-travel-primary tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Safety & Emergency Center
          </h2>
          <p className="text-xs text-travel-muted mt-1">
            Simulated emergency distress beacon, verified trusted contacts, and ICE medical vault disclosures.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isEmergency ? (
            <span className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-mono text-xs font-black flex items-center gap-2 animate-pulse shadow-lg shadow-rose-900/50">
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              SIMULATED SESSION ACTIVE: {formatElapsed(emergencySession.elapsedSeconds)}
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Standby Guard Active
            </span>
          )}
        </div>
      </div>

      {/* 1. SIMULATED EMERGENCY SESSION ACTIVE CONSOLE */}
      {isEmergency && (
        <div className="bg-travel-card rounded-2xl border-2 border-red-500/50 p-6 shadow-md space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-travel pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <AlertOctagon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider">
                  <Radio className="w-3 h-3 animate-spin" />
                  Simulated Session Active
                </div>
                <h3 className="text-lg font-bold text-travel-primary mt-0.5">
                  Distress Telemetry & Mock Alert Broadcast
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={endEmergencySession}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0"
            >
              <StopCircle className="w-4 h-4" />
              <span>End Emergency Session</span>
            </button>
          </div>

          {/* Session Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-travel-subtle p-4 rounded-xl border border-travel space-y-1">
              <span className="text-[10px] text-travel-muted uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-travel-accent" /> Elapsed Time
              </span>
              <div className="text-2xl font-mono font-bold text-travel-primary tracking-tight">
                {formatElapsed(emergencySession.elapsedSeconds)}
              </div>
              <div className="text-[10px] text-travel-muted font-mono">
                Started at {emergencySession.startedAt}
              </div>
            </div>

            <div className="bg-travel-subtle p-4 rounded-xl border border-travel space-y-1 sm:col-span-2">
              <span className="text-[10px] text-travel-muted uppercase font-bold tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-travel-accent" /> Sample Telemetry Location
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                  {emergencySession.sampleLocation?.accuracy}
                </span>
              </span>
              <div className="text-travel-primary font-bold text-sm truncate">
                {emergencySession.sampleLocation?.name}
              </div>
              <div className="text-travel-secondary text-[11px] truncate">
                {emergencySession.sampleLocation?.address}
              </div>
              <div className="text-[10px] text-travel-muted font-mono">
                Simulated Coords: {emergencySession.sampleLocation?.coords ? emergencySession.sampleLocation.coords.join(', ') : '35.0037, 135.7770'}
              </div>
            </div>
          </div>

          {/* Alert Delivery Status Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-travel-primary uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-travel-accent" />
                Emergency Alert Delivery Status ({emergencySession.mockAlertDeliveries?.length || 0} Contacts)
              </h4>
              <span className="text-[10px] text-travel-muted font-mono">
                {isDemoMode ? 'Client simulated dispatches' : 'Local alert logs • External gateway unavailable'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {emergencySession.mockAlertDeliveries?.map((delivery, idx) => (
                <div
                  key={idx}
                  className="bg-travel-subtle rounded-xl p-3.5 border border-travel space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-travel-primary text-xs">{delivery.name}</span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold border ${
                        delivery.status.includes('Not sent')
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      }`}
                    >
                      {delivery.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-travel-secondary font-mono">
                    {delivery.channel} • {delivery.phone}
                  </div>

                  <div className="bg-travel-card p-2.5 rounded-lg border border-travel text-[11px] text-travel-secondary font-mono line-clamp-2 leading-relaxed">
                    "{delivery.payloadPreview}"
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-travel-muted pt-1">
                    <span>{delivery.relation || 'Emergency Contact'}</span>
                    <span className="font-mono text-[10px] text-travel-muted">
                      {delivery.status.includes('Not sent') ? 'Local Log Only' : 'Simulated'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. EMERGENCY SOS CONTROL PANEL (Idle State) */}
      {!isEmergency && (
        <div className="bg-travel-card rounded-2xl border border-travel p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Emergency Safety Console
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-travel-subtle text-travel-muted border border-travel text-[10px] font-mono">
                  Sandbox Simulator
                </span>
              </div>

              <h3 className="text-lg font-bold text-travel-primary tracking-tight">
                Simulated Emergency SOS Routine
              </h3>

              <p className="text-xs text-travel-secondary leading-relaxed">
                Test and verify emergency broadcast workflows, distress telemetry dispatches, and medical ICE disclosure logs. Accidental triggers are protected by a confirmation step.
              </p>

              <p className="text-[11px] text-travel-muted">
                <strong>Demonstration Sandbox Notice:</strong> Real emergency services (112 / 911 / 110) and live telecom SMS dispatches are not contacted.
              </p>
            </div>

            {/* Appropriately Sized, Restrained Emergency Button */}
            <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
              <button
                type="button"
                onClick={openSosConfirmation}
                className="btn-travel-emergency px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
              >
                <Radio className="w-4 h-4" />
                <span>Test Emergency SOS</span>
              </button>
              <span className="text-[10px] text-travel-muted font-mono">
                Requires confirmation
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2B. INDIA EMERGENCY HELPLINES & CRISIS RESPONSE SERVICES */}
      <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-travel pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-rose-500" />
                India Emergency Helplines & First Response Services
              </h3>
              <span className="text-[10px] font-mono font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">
                Nationwide 24/7
              </span>
            </div>
            <p className="text-xs text-travel-secondary mt-0.5">
              Official Indian government emergency services and crisis dispatch hotlines. Tap to copy dial codes immediately.
            </p>
          </div>
          <span className="text-[11px] font-mono text-travel-muted">
            Standard: Bureau of Police Research & Development (BPR&D)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[
            {
              code: '112',
              title: 'National Emergency (ERSS)',
              desc: 'Unified Emergency Response Support System (Police, Medical, Fire & Rescue).',
              tag: 'Primary All-In-One',
              highlight: true,
            },
            {
              code: '1091',
              title: 'Women Helpline in Distress',
              desc: 'Dedicated 24/7 crisis intervention, transit safety, and women rescue response.',
              tag: 'Women Safety',
            },
            {
              code: '100',
              title: 'Police Assistance Control',
              desc: 'State and city police quick dispatch control rooms.',
              tag: 'Law Enforcement',
            },
            {
              code: '108',
              title: 'Emergency Medical & Ambulance',
              desc: 'Toll-free emergency medical transit, trauma care, and hospital triage (or dial 102).',
              tag: 'Medical Relief',
            },
            {
              code: '101',
              title: 'Fire & Rescue Services',
              desc: 'Emergency fire stations, structural rescue, and hazmat response.',
              tag: 'Fire Rescue',
            },
            {
              code: '1078',
              title: 'National Disaster Response (NDRF)',
              desc: 'Specialized response for severe flood, cyclonic hazard, earthquake, or landslide crisis.',
              tag: 'Disaster Relief',
            },
            {
              code: '139',
              title: 'RailMadad & IRCTC Security',
              desc: '24/7 Indian Railways security assistance, medical relief on trains, and passenger inquiry.',
              tag: 'Rail Security',
            },
          ].map((helpline) => (
            <div
              key={helpline.code}
              className={`p-4 rounded-xl border flex flex-col justify-between gap-2.5 transition ${
                helpline.highlight
                  ? 'bg-rose-500/5 border-rose-500/30 ring-1 ring-rose-500/20'
                  : 'bg-travel-subtle border-travel hover:bg-travel-card'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-mono font-black text-rose-500">
                    {helpline.code}
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-travel-card text-travel-secondary border border-travel">
                    {helpline.tag}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-travel-primary mt-1">{helpline.title}</h4>
                <p className="text-[11px] text-travel-secondary leading-relaxed mt-1">
                  {helpline.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-travel flex items-center justify-between">
                <a
                  href={`tel:${helpline.code}`}
                  className="text-[11px] font-bold text-travel-accent hover:underline flex items-center gap-1"
                >
                  <PhoneCall className="w-3 h-3" />
                  <span>Call {helpline.code}</span>
                </a>
                <button
                  type="button"
                  onClick={() => copyToClipboard(helpline.code, helpline.title)}
                  className="px-2.5 py-1 rounded-lg bg-travel-card hover:bg-travel-accent-soft text-travel-secondary hover:text-travel-accent border border-travel text-[11px] font-semibold transition flex items-center gap-1 active:scale-95"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. TRUSTED CONTACTS MANAGEMENT (Full CRUD: Add, Edit, Remove) */}
      <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-travel pb-4">
          <div>
            <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-travel-accent" />
              Trusted Emergency Contacts Management
            </h3>
            <p className="text-xs text-travel-muted mt-0.5">
              Manage verified family, traveling companions, and concierges who receive simulated distress alerts.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingContact(null);
              setContactForm({
                name: '',
                relation: 'Family / Emergency Contact',
                phone: '',
                email: '',
                notifyOnSos: true,
              });
              setFormError('');
              setIsAddContactModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl btn-travel-primary font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-sm shrink-0 self-start sm:self-center"
          >
            <UserPlus className="w-4 h-4" />
            Add Trusted Contact
          </button>
        </div>

        {/* Contacts List Grid */}
        {trustedContacts.length === 0 ? (
          <div className="text-center py-8 bg-travel-subtle/40 rounded-xl border border-travel/80 p-6 space-y-2">
            <UserCheck className="w-8 h-8 text-travel-accent/50 mx-auto" />
            <h4 className="text-sm font-bold text-travel-primary">No Emergency Contacts Registered</h4>
            <p className="text-xs text-travel-muted max-w-sm mx-auto">
              Add trusted friends, family, or travel partners to receive simulated distress telemetry if you trigger an SOS.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trustedContacts.map((contact) => (
              <div
                key={contact.id || contact._id}
                className="bg-travel-subtle/40 rounded-xl p-4 border border-travel/60 hover:border-slate-600 transition flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-extrabold text-travel-primary truncate" title={contact.name}>
                      {contact.name}
                    </h4>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                        contact.notifyOnSos !== false
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-travel-subtle text-travel-muted'
                      }`}
                    >
                      {contact.notifyOnSos !== false ? 'SOS Alert Recipient' : 'Excluded from SOS'}
                    </span>
                  </div>

                  <div className="text-xs text-travel-muted font-medium">
                    {contact.relation || 'Emergency Contact'}
                  </div>

                  <div className="font-mono text-travel-accent text-xs font-semibold pt-1">
                    {contact.phone}
                  </div>

                  {contact.email && (
                    <div className="text-[11px] text-travel-muted truncate font-mono">
                      {contact.email}
                    </div>
                  )}
                </div>

                {/* Card Footer: Action Controls */}
                <div className="pt-2 border-t border-travel/80 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-travel-muted font-mono">
                    Channel: Simulated SMS
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(contact)}
                      className="p-1.5 rounded-lg text-travel-muted hover:text-travel-primary hover:bg-travel-subtle transition"
                      title="Edit Contact"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingContact(contact)}
                      className="p-1.5 rounded-lg text-travel-muted hover:text-rose-400 hover:bg-travel-subtle transition"
                      title="Remove Contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. DIGITAL ICE SAFETY VAULT & "I'M SAFE" CHECK-IN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2 Cols: Digital Medical & Identity ICE Vault */}
        <div className="lg:col-span-2 bg-travel-card rounded-2xl p-6 border border-travel shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-travel pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-rose-400" />
                  Digital ICE Safety Vault (In Case of Emergency)
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold border border-amber-500/30">
                  DEMONSTRATION SAMPLE RECORD
                </span>
              </div>
              <p className="text-xs text-travel-muted mt-1">
                Emergency identity, blood type, and insurance telemetry disclosures prepared for first responders.
              </p>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-travel-accent font-mono bg-travel-accent-soft px-2 py-0.5 rounded border border-travel self-start sm:self-center">
              <Lock className="w-3 h-3" />
              Client Encrypted
            </span>
          </div>

          {/* Demonstration Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Sample Data Notice:</strong> All displayed identity details, blood groups, allergies, and policy numbers are synthetic demonstration test records. Real user identity is never transmitted without explicit authorization.
            </span>
          </div>

          {/* Medical Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-travel-subtle p-3 rounded-xl border border-travel/50">
              <span className="text-[10px] text-travel-muted uppercase font-semibold block">Cardholder</span>
              <span className="font-bold text-travel-primary text-xs block mt-0.5">{user?.name || SAFETY_ICE_VAULT.cardHolder}</span>
              <span className="text-[10px] text-travel-muted font-mono">DOB: {SAFETY_ICE_VAULT.dob}</span>
            </div>

            <div className="bg-travel-subtle p-3 rounded-xl border border-travel/50">
              <span className="text-[10px] text-travel-muted uppercase font-semibold block">Blood Group</span>
              <span className="font-mono font-black text-rose-400 text-base block mt-0.5">
                {SAFETY_ICE_VAULT.bloodType}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">Organ Donor: Yes</span>
            </div>

            <div className="bg-travel-subtle p-3 rounded-xl border border-travel/50">
              <span className="text-[10px] text-travel-muted uppercase font-semibold block">Known Allergies</span>
              <div className="font-bold text-amber-300 text-xs mt-0.5">
                {SAFETY_ICE_VAULT.allergies.join(', ')}
              </div>
            </div>

            <div className="bg-travel-subtle p-3 rounded-xl border border-travel/50">
              <span className="text-[10px] text-travel-muted uppercase font-semibold block">Passport Backup</span>
              <span className="font-mono text-travel-secondary text-xs block mt-0.5">
                {SAFETY_ICE_VAULT.passportNumberMasked}
              </span>
              <span className="text-[10px] text-travel-accent font-mono">Exp: {SAFETY_ICE_VAULT.passportExpiry}</span>
            </div>
          </div>

          {/* Insurance Policy Banner */}
          <div className="bg-travel-subtle/20 border border-travel rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-travel-primary">{SAFETY_ICE_VAULT.insuranceProvider}</span>
                <span className="text-[10px] bg-travel-accent-soft text-travel-accent px-2 py-0.2 rounded font-mono font-semibold">
                  Policy: {SAFETY_ICE_VAULT.insurancePolicyNumber}
                </span>
              </div>
              <div className="text-travel-muted text-[11px] mt-1">
                24/7 Global Medical Hotline: {SAFETY_ICE_VAULT.insuranceHotline}
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(SAFETY_ICE_VAULT.insurancePolicyNumber, 'Policy Number')}
              className="px-3 py-1.5 rounded-lg btn-travel-secondary font-semibold text-xs transition flex items-center gap-1.5 self-start sm:self-center"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Policy #
            </button>
          </div>
        </div>

        {/* 1 Col: Simulated "I'm Safe" Check-In Ping Tool & Past Logs */}
        <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-travel pb-3">
              <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-travel-accent" />
                "I'm Safe" Check-In Ping
              </h3>
              <p className="text-xs text-travel-muted mt-0.5">
                Simulate a one-tap safety reassurance check-in to your family and cloud itinerary.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-travel-secondary mb-1">
                Optional Status Note
              </label>
              <input
                type="text"
                value={customPingNote}
                onChange={(e) => setCustomPingNote(e.target.value)}
                placeholder="e.g. Arrived safely at hotel, battery 90%..."
                className="w-full bg-travel-subtle border border-travel rounded-xl px-3 py-2 text-xs text-travel-primary placeholder:text-travel-muted focus:outline-none focus:border-travel-accent"
              />
            </div>

            <button
              onClick={() => {
                sendSafetyCheckInPing(customPingNote);
                setCustomPingNote('');
              }}
              className="w-full py-2.5 px-4 rounded-xl btn-travel-primary font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sm active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Send Safe Ping Now
            </button>
          </div>

          {/* Past Check-ins Log */}
          <div className="space-y-2 pt-2 border-t border-travel">
            <span className="text-[11px] font-bold text-travel-muted uppercase tracking-wider block">
              Recent Ping Log
            </span>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {checkInLogs.length === 0 ? (
                <p className="text-travel-muted text-xs italic py-2">No safety pings broadcast yet. Use the button above to test a ping.</p>
              ) : (
                checkInLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-xl bg-travel-subtle/40 border border-travel/40 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between text-travel-secondary font-semibold">
                      <span className="truncate">{log.location}</span>
                      <span className="text-[10px] text-travel-accent font-mono">{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-travel-muted italic">"{log.note}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 5. PRIVACY & SAFETY ARCHITECTURE EXPLANATION */}
      <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-travel pb-3">
          <Shield className="w-5 h-5 text-travel-accent" />
          <div>
            <h3 className="text-base font-bold text-travel-primary">
              TripMate Safety & Privacy Architecture
            </h3>
            <p className="text-xs text-travel-muted mt-0.5">
              Transparent safeguards designed to prevent false alarms, protect user privacy, and ensure local data control.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-travel-subtle/40 p-4 rounded-xl border border-travel/60 space-y-1.5">
            <div className="font-extrabold text-travel-accent text-xs">Zero Real Dispatch</div>
            <p className="text-travel-secondary text-[11px] leading-relaxed">
              Real-world 911/112/110 emergency services are <strong>never contacted</strong>. Simulated broadcasts operate strictly inside your browser sandbox to verify payload readiness safely.
            </p>
          </div>

          <div className="bg-travel-subtle/40 p-4 rounded-xl border border-travel/60 space-y-1.5">
            <div className="font-extrabold text-travel-accent text-xs">Zero SMS Charges</div>
            <p className="text-travel-secondary text-[11px] leading-relaxed">
              Emergency contacts will not receive unexpected carrier SMS messages or tolls. All dispatch cards show simulated payload previews.
            </p>
          </div>

          <div className="bg-travel-subtle/40 p-4 rounded-xl border border-travel/60 space-y-1.5">
            <div className="font-extrabold text-travel-accent text-xs">No Background Tracking</div>
            <p className="text-travel-secondary text-[11px] leading-relaxed">
              TripMate does <strong>not run continuous background GPS tracking</strong>. Mock location coordinates are strictly simulated demo records.
            </p>
          </div>

          <div className="bg-travel-subtle/40 p-4 rounded-xl border border-travel/60 space-y-1.5">
            <div className="font-extrabold text-travel-accent text-xs">Local Browser Storage</div>
            <p className="text-travel-secondary text-[11px] leading-relaxed">
              Your ICE vault disclosures, trusted contacts, and safe zones remain inside your private local storage. No unencrypted server transmission.
            </p>
          </div>
        </div>
      </div>

      {/* 6. EMBASSY & CONSULATE DIRECTORY */}
      <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-travel pb-3">
          <div>
            <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-travel-accent" />
              Consular & Diplomatic Missions Directory
            </h3>
            <p className="text-xs text-travel-muted mt-0.5">
              Verified 24/7 citizen services hotlines and disaster assistance protocols.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={embassySearch}
              onChange={(e) => setEmbassySearch(e.target.value)}
              placeholder="Filter by country or city..."
              className="w-full bg-travel-subtle border border-travel rounded-xl px-3 py-1.5 text-xs text-travel-primary placeholder:text-travel-muted focus:outline-none focus:border-travel-accent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEmbassies.map((emb, idx) => (
            <div
              key={idx}
              className="bg-travel-subtle/40 rounded-xl p-4 border border-travel/60 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] text-travel-accent font-bold uppercase tracking-wider block">
                    {emb.country}
                  </span>
                  <h4 className="text-sm font-bold text-travel-primary">{emb.representation}</h4>
                  <span className="text-xs text-travel-muted">{emb.city}</span>
                </div>

                <button
                  onClick={() => copyToClipboard(emb.hotline24h, `${emb.country} Hotline`)}
                  className="px-2.5 py-1 rounded-lg bg-travel-subtle hover:bg-travel-card text-travel-accent text-[11px] font-mono transition flex items-center gap-1 shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>

              <div className="bg-travel-subtle p-2.5 rounded-lg border border-travel flex items-center justify-between text-xs">
                <span className="text-travel-muted">24/7 Emergency Line:</span>
                <span className="font-mono font-bold text-travel-primary text-xs">{emb.hotline24h}</span>
              </div>

              <div className="text-[11px] text-travel-muted">
                <strong className="text-travel-secondary">Services:</strong> {emb.services.join(' • ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. OFFLINE CRISIS CHECKLISTS (Accordion) */}
      <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-xl space-y-4">
        <div className="border-b border-travel pb-3">
          <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
            <FileText className="w-4 h-4 text-travel-accent" />
            Offline Survival & Crisis Checklists
          </h3>
          <p className="text-xs text-travel-muted mt-0.5">
            Step-by-step procedures when offline, experiencing passport loss, sudden medical illness, or natural events.
          </p>
        </div>

        <div className="space-y-3">
          {SAFETY_CHECKLISTS.map((guide, idx) => {
            const isExpanded = expandedChecklist === idx;
            return (
              <div
                key={idx}
                className="bg-travel-subtle/40 rounded-xl border border-travel/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedChecklist(isExpanded ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-travel-primary hover:bg-travel-subtle transition"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    {guide.category}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-travel-muted" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-travel-muted" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-travel text-xs text-travel-secondary space-y-2 bg-travel-subtle/60">
                    <ul className="list-decimal list-inside space-y-1.5 leading-relaxed">
                      {guide.tips.map((tip, tIdx) => (
                        <li key={tIdx} className="text-travel-secondary">
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: ADD / EDIT TRUSTED CONTACT */}
      {(isAddContactModalOpen || editingContact) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsAddContactModalOpen(false);
            setEditingContact(null);
          }}
          title={editingContact ? 'Edit Trusted Emergency Contact' : 'Add New Emergency Contact'}
          subtitle="Designate a contact who receives simulated distress alerts during emergency sessions."
        >
          <form onSubmit={handleContactSubmit} className="space-y-4">
            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-travel-secondary mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="e.g. Morgan Sterling"
                className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary focus:outline-none focus:border-travel-accent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-travel-secondary mb-1">
                  Relationship *
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.relation}
                  onChange={(e) => setContactForm({ ...contactForm, relation: e.target.value })}
                  placeholder="e.g. Spouse / Brother / Friend"
                  className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary focus:outline-none focus:border-travel-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-travel-secondary mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="+1 (415) 555-0192"
                  className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary font-mono focus:outline-none focus:border-travel-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-travel-secondary mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="contact@example.com"
                className="w-full bg-travel-subtle border border-travel rounded-xl px-3.5 py-2 text-xs text-travel-primary focus:outline-none focus:border-travel-accent"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="notifyOnSosCheckbox"
                checked={contactForm.notifyOnSos}
                onChange={(e) => setContactForm({ ...contactForm, notifyOnSos: e.target.checked })}
                className="rounded border-travel text-travel-accent focus:ring-[var(--accent-primary)] bg-travel-subtle w-4 h-4"
              />
              <label htmlFor="notifyOnSosCheckbox" className="text-xs text-travel-secondary font-medium cursor-pointer">
                Include in Simulated Emergency SOS Broadcasts
              </label>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-travel">
              <button
                type="button"
                onClick={() => {
                  setIsAddContactModalOpen(false);
                  setEditingContact(null);
                }}
                className="px-4 py-2 rounded-xl text-xs text-travel-muted hover:text-travel-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl btn-travel-primary font-bold text-xs transition"
              >
                {editingContact ? 'Save Changes' : 'Add Contact'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: DELETE CONTACT CONFIRMATION */}
      {deletingContact && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingContact(null)}
          title="Remove Trusted Contact"
          subtitle="Accidental removal protection."
        >
          <div className="space-y-4">
            <p className="text-xs text-travel-secondary leading-relaxed">
              Are you sure you want to remove <strong className="text-travel-primary">{deletingContact.name}</strong> ({deletingContact.phone}) from your emergency contacts? They will no longer receive simulated distress alerts.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-travel">
              <button
                type="button"
                onClick={() => setDeletingContact(null)}
                className="px-4 py-2 rounded-xl text-xs text-travel-muted hover:text-travel-primary"
              >
                Keep Contact
              </button>
              <button
                type="button"
                onClick={() => {
                  removeTrustedContact(deletingContact.id);
                  setDeletingContact(null);
                }}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition"
              >
                Yes, Remove Contact
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}