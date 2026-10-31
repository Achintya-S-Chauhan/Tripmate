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
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Safety & Emergency Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
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

      {/* 1. SIMULATED EMERGENCY SESSION ACTIVE CONSOLE (Shown when SOS is active) */}
      {isEmergency && (
        <div className="rounded-3xl bg-gradient-to-r from-[#20080f] via-[#2f0c16] to-[#1a070c] border-2 border-rose-500 p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-fade-in">
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-gradient-to-l from-rose-600/15 to-transparent pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Top Bar: Beacon Status + End Session Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-rose-900/70 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-900/50">
                  <AlertOctagon className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-black uppercase tracking-wider">
                    <Radio className="w-3 h-3 text-rose-400 animate-spin" />
                    SIMULATED EMERGENCY SESSION ACTIVE
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    Distress Telemetry & Mock Alert Broadcast
                  </h3>
                </div>
              </div>

              {/* End Emergency Session Button */}
              <button
                type="button"
                onClick={endEmergencySession}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm tracking-wide shadow-xl shadow-rose-600/40 transition transform active:scale-95 flex items-center justify-center gap-2 shrink-0"
              >
                <StopCircle className="w-5 h-5" />
                <span>END EMERGENCY SESSION</span>
              </button>
            </div>

            {/* Session Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              {/* Elapsed Time Card */}
              <div className="bg-[#12080d] p-4 rounded-2xl border border-rose-900/60 space-y-1">
                <span className="text-[10px] text-rose-400 uppercase font-black tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Session Elapsed Time
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-black text-white tracking-tight">
                  {formatElapsed(emergencySession.elapsedSeconds)}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Started at {emergencySession.startedAt} JST
                </div>
              </div>

              {/* Sample Location Card */}
              <div className="bg-[#12080d] p-4 rounded-2xl border border-rose-900/60 space-y-1 sm:col-span-2">
                <span className="text-[10px] text-rose-400 uppercase font-black tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Sample Location (Simulated GPS)
                  </span>
                  <span className="font-mono text-emerald-400 font-semibold text-[10px]">
                    {emergencySession.sampleLocation?.accuracy}
                  </span>
                </span>
                <div className="text-white font-bold text-sm truncate">
                  {emergencySession.sampleLocation?.name}
                </div>
                <div className="text-slate-300 text-[11px] truncate">
                  {emergencySession.sampleLocation?.address}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Simulated Coords: {emergencySession.sampleLocation?.coords ? emergencySession.sampleLocation.coords.join(', ') : '35.0037, 135.7770'}
                </div>
              </div>
            </div>

            {/* Mock Alert Delivery Status Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 text-rose-400" />
                  Mock Alert Delivery Status ({emergencySession.mockAlertDeliveries?.length || 0} Contacts)
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  * All transmissions are client-side simulations.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {emergencySession.mockAlertDeliveries?.map((delivery, idx) => (
                  <div
                    key={idx}
                    className="bg-[#12080d]/90 rounded-2xl p-4 border border-rose-900/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-white text-xs">{delivery.name}</span>
                      <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold border border-emerald-500/30">
                        {delivery.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 font-mono">
                      {delivery.channel} • {delivery.phone}
                    </div>

                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 font-mono line-clamp-2 leading-relaxed">
                      "{delivery.payloadPreview}"
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      <span>Recipient Type: {delivery.relation || 'Emergency Contact'}</span>
                      <span className="text-emerald-400 font-mono">Simulated</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. EMERGENCY SOS CONTROL HERO (Idle State - Calm Slate/Navy Aesthetic) */}
      {!isEmergency && (
        <div className="rounded-3xl bg-gradient-to-r from-[#0d1726] via-[#0f213d] to-[#0b1628] border border-slate-700/80 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-slate-800 text-teal-300 border border-teal-500/30 text-[11px] font-bold uppercase tracking-wider">
                <Radio className="w-3.5 h-3.5 text-teal-400" />
                Standby Emergency Protocol
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white">
                Emergency SOS Simulator
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                Test TripMate's emergency broadcast routine. Protected by an accidental activation confirmation step before generating high-priority telemetry, medical ICE vault disclosures, and simulated contact alerts.
              </p>

              <div className="text-[11px] text-slate-400 font-mono pt-1">
                * Demonstration Sandbox: Real 911 / 112 / 110 emergency dispatch lines are NOT triggered.
              </div>
            </div>

            {/* Prominent SOS Trigger Control */}
            <button
              type="button"
              onClick={openSosConfirmation}
              className="px-6 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-black text-sm tracking-wide shadow-xl shadow-rose-600/30 transition transform active:scale-95 flex items-center justify-center gap-2.5 shrink-0"
            >
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <span>TRIGGER SOS SIMULATOR</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. TRUSTED CONTACTS MANAGEMENT (Full CRUD: Add, Edit, Remove) */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-400" />
              Trusted Emergency Contacts Management
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
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
            className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-lg shadow-teal-500/20 shrink-0 self-start sm:self-center"
          >
            <UserPlus className="w-4 h-4" />
            Add Trusted Contact
          </button>
        </div>

        {/* Contacts List Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trustedContacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 hover:border-slate-600 transition flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-extrabold text-white truncate" title={contact.name}>
                    {contact.name}
                  </h4>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ${
                      contact.notifyOnSos !== false
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-700 text-slate-400'
                    }`}
                  >
                    {contact.notifyOnSos !== false ? 'SOS Alert Recipient' : 'Excluded from SOS'}
                  </span>
                </div>

                <div className="text-xs text-slate-400 font-medium">
                  {contact.relation || 'Emergency Contact'}
                </div>

                <div className="font-mono text-teal-400 text-xs font-semibold pt-1">
                  {contact.phone}
                </div>

                {contact.email && (
                  <div className="text-[11px] text-slate-400 truncate font-mono">
                    {contact.email}
                  </div>
                )}
              </div>

              {/* Card Footer: Action Controls */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  Channel: Simulated SMS
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(contact)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                    title="Edit Contact"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingContact(contact)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition"
                    title="Remove Contact"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. DIGITAL ICE SAFETY VAULT & "I'M SAFE" CHECK-IN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2 Cols: Digital Medical & Identity ICE Vault */}
        <div className="lg:col-span-2 bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-400" />
                Digital ICE Safety Vault (In Case of Emergency)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Critical medical and insurance disclosures ready for first responders.
              </p>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-teal-400 font-mono bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
              <Lock className="w-3 h-3" />
              Client Encrypted
            </span>
          </div>

          {/* Medical Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Cardholder</span>
              <span className="font-bold text-white text-xs block mt-0.5">{SAFETY_ICE_VAULT.cardHolder}</span>
              <span className="text-[10px] text-slate-400 font-mono">DOB: {SAFETY_ICE_VAULT.dob}</span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Blood Group</span>
              <span className="font-mono font-black text-rose-400 text-base block mt-0.5">
                {SAFETY_ICE_VAULT.bloodType}
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold">Organ Donor: Yes</span>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Known Allergies</span>
              <div className="font-bold text-amber-300 text-xs mt-0.5">
                {SAFETY_ICE_VAULT.allergies.join(', ')}
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Passport Backup</span>
              <span className="font-mono text-slate-200 text-xs block mt-0.5">
                {SAFETY_ICE_VAULT.passportNumberMasked}
              </span>
              <span className="text-[10px] text-teal-400 font-mono">Exp: {SAFETY_ICE_VAULT.passportExpiry}</span>
            </div>
          </div>

          {/* Insurance Policy Banner */}
          <div className="bg-teal-950/20 border border-teal-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{SAFETY_ICE_VAULT.insuranceProvider}</span>
                <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2 py-0.2 rounded font-mono font-semibold">
                  Policy: {SAFETY_ICE_VAULT.insurancePolicyNumber}
                </span>
              </div>
              <div className="text-slate-400 text-[11px] mt-1">
                24/7 Global Medical Hotline: {SAFETY_ICE_VAULT.insuranceHotline}
              </div>
            </div>

            <button
              onClick={() => copyToClipboard(SAFETY_ICE_VAULT.insurancePolicyNumber, 'Policy Number')}
              className="px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-semibold text-xs transition flex items-center gap-1.5 self-start sm:self-center"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Policy #
            </button>
          </div>
        </div>

        {/* 1 Col: Simulated "I'm Safe" Check-In Ping Tool & Past Logs */}
        <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-400" />
                "I'm Safe" Check-In Ping
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate a one-tap safety reassurance check-in to your family and cloud itinerary.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Optional Status Note
              </label>
              <input
                type="text"
                value={customPingNote}
                onChange={(e) => setCustomPingNote(e.target.value)}
                placeholder="e.g. Arrived safely at hotel, battery 90%..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <button
              onClick={() => {
                sendSafetyCheckInPing(customPingNote);
                setCustomPingNote('');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Send Safe Ping Now
            </button>
          </div>

          {/* Past Check-ins Log */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Recent Ping Log
            </span>

            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {checkInLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs space-y-0.5"
                >
                  <div className="flex items-center justify-between text-slate-300 font-semibold">
                    <span className="truncate">{log.location}</span>
                    <span className="text-[10px] text-teal-400 font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">"{log.note}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 5. PRIVACY & SAFETY ARCHITECTURE EXPLANATION */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
          <Shield className="w-5 h-5 text-teal-400" />
          <div>
            <h3 className="text-base font-bold text-white">
              TripMate Safety & Privacy Architecture
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent safeguards designed to prevent false alarms, protect user privacy, and ensure local data control.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
            <div className="font-extrabold text-teal-300 text-xs">Zero Real Dispatch</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Real-world 911/112/110 emergency services are <strong>never contacted</strong>. Simulated broadcasts operate strictly inside your browser sandbox to verify payload readiness safely.
            </p>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
            <div className="font-extrabold text-teal-300 text-xs">Zero SMS Charges</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Emergency contacts will not receive unexpected carrier SMS messages or tolls. All dispatch cards show simulated payload previews.
            </p>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
            <div className="font-extrabold text-teal-300 text-xs">No Background Tracking</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              TripMate does <strong>not run continuous background GPS tracking</strong>. Mock location coordinates are strictly simulated demo records.
            </p>
          </div>

          <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
            <div className="font-extrabold text-teal-300 text-xs">Local Browser Storage</div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Your ICE vault disclosures, trusted contacts, and safe zones remain inside your private local storage. No unencrypted server transmission.
            </p>
          </div>
        </div>
      </div>

      {/* 6. EMBASSY & CONSULATE DIRECTORY */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-teal-400" />
              Consular & Diplomatic Missions Directory
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verified 24/7 citizen services hotlines and disaster assistance protocols.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              value={embassySearch}
              onChange={(e) => setEmbassySearch(e.target.value)}
              placeholder="Filter by country or city..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEmbassies.map((emb, idx) => (
            <div
              key={idx}
              className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/60 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">
                    {emb.country}
                  </span>
                  <h4 className="text-sm font-bold text-white">{emb.representation}</h4>
                  <span className="text-xs text-slate-400">{emb.city}</span>
                </div>

                <button
                  onClick={() => copyToClipboard(emb.hotline24h, `${emb.country} Hotline`)}
                  className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-teal-300 text-[11px] font-mono transition flex items-center gap-1 shrink-0"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">24/7 Emergency Line:</span>
                <span className="font-mono font-bold text-white text-xs">{emb.hotline24h}</span>
              </div>

              <div className="text-[11px] text-slate-400">
                <strong className="text-slate-300">Services:</strong> {emb.services.join(' • ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. OFFLINE CRISIS CHECKLISTS (Accordion) */}
      <div className="bg-[#0f172a] rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-400" />
            Offline Survival & Crisis Checklists
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Step-by-step procedures when offline, experiencing passport loss, sudden medical illness, or natural events.
          </p>
        </div>

        <div className="space-y-3">
          {SAFETY_CHECKLISTS.map((guide, idx) => {
            const isExpanded = expandedChecklist === idx;
            return (
              <div
                key={idx}
                className="bg-slate-800/40 rounded-xl border border-slate-700/60 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setExpandedChecklist(isExpanded ? null : idx)}
                  className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    {guide.category}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-slate-800 text-xs text-slate-300 space-y-2 bg-slate-900/60">
                    <ul className="list-decimal list-inside space-y-1.5 leading-relaxed">
                      {guide.tips.map((tip, tIdx) => (
                        <li key={tIdx} className="text-slate-300">
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
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="e.g. Morgan Sterling"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Relationship *
                </label>
                <input
                  type="text"
                  required
                  value={contactForm.relation}
                  onChange={(e) => setContactForm({ ...contactForm, relation: e.target.value })}
                  placeholder="e.g. Spouse / Brother / Friend"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={contactForm.phone}
                  onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="+1 (415) 555-0192"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="contact@example.com"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="notifyOnSosCheckbox"
                checked={contactForm.notifyOnSos}
                onChange={(e) => setContactForm({ ...contactForm, notifyOnSos: e.target.checked })}
                className="rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900 w-4 h-4"
              />
              <label htmlFor="notifyOnSosCheckbox" className="text-xs text-slate-300 font-medium cursor-pointer">
                Include in Simulated Emergency SOS Broadcasts
              </label>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsAddContactModalOpen(false);
                  setEditingContact(null);
                }}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition"
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
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong className="text-white">{deletingContact.name}</strong> ({deletingContact.phone}) from your emergency contacts? They will no longer receive simulated distress alerts.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingContact(null)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
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