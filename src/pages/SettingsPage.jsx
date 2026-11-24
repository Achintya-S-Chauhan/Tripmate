import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Globe,
  ShieldCheck,
  Download,
  RotateCcw,
  Sliders,
  Bell,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Info,
  Database,
  LogIn,
  LogOut,
  User as UserIcon,
  Sparkles,
  Clock,
  Compass,
  Footprints,
  Eye,
  Save,
  Sun,
  Moon,
  Monitor,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SUPPORTED_CURRENCIES } from '../services/currency';
import api from '../services/api';

export default function SettingsPage() {
  const {
    settings,
    updateUserSettings,
    setThemeFamily,
    setAppearance,
    resetAllDemoData,
    exportJourneyData,
    user,
    setUser,
    isAuthenticated,
    isBackendConnected,
    openAuthModal,
    logoutUser,
    addToast,
  } = useApp();

  const fileInputRef = useRef(null);

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState(user?.avatarUrl || '');
  const [homeCityInput, setHomeCityInput] = useState(user?.homeCity || 'Vidisha, Madhya Pradesh');
  const [homeCountryInput, setHomeCountryInput] = useState(user?.homeCountry || settings?.homeCountry || 'India');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync inputs when user object changes
  useEffect(() => {
    if (user) {
      if (user.name) setNameInput(user.name);
      if (user.avatarUrl) setAvatarUrlInput(user.avatarUrl);
      if (user.homeCity) setHomeCityInput(user.homeCity);
      if (user.homeCountry) setHomeCountryInput(user.homeCountry);
    }
  }, [user]);

  const activeFamily = settings?.themeFamily || 'forest';
  const activeAppearance = settings?.appearance || (settings?.theme === 'light' ? 'light' : 'dark');

  const themeFamilies = [
    {
      id: 'forest',
      name: 'Forest',
      tagline: 'Natural travel aesthetic',
      description: 'Warm ivory, rich forest green, and soft sage.',
      swatches: ['#244C3A', '#8FB99A', '#F6F4EE', '#C7795B'],
    },
    {
      id: 'ocean',
      name: 'Ocean',
      tagline: 'Coastal maritime aesthetic',
      description: 'Soft coastal sea blue, maritime slate, and clean neutral tones.',
      swatches: ['#1E5B82', '#68B0D8', '#F0F4F8', '#D97757'],
    },
    {
      id: 'sand',
      name: 'Sand',
      tagline: 'Warm desert sandstone',
      description: 'Desert cream, sandstone terracotta, and muted olive foliage.',
      swatches: ['#8C5338', '#D99477', '#F8F5EE', '#5C6B46'],
    },
    {
      id: 'slate',
      name: 'Slate',
      tagline: 'Clean architectural gray',
      description: 'Neutral gray, charcoal surfaces, and balanced steel blue.',
      swatches: ['#2B5876', '#7FA8C9', '#F1F3F5', '#A0522D'],
    },
  ];

  const handleSettingChange = (key, value) => {
    updateUserSettings({ [key]: value }, { silent: true });
  };

  const handleTravelPrefChange = (prefKey, value) => {
    const currentPrefs = settings?.travelPreferences || {};
    updateUserSettings({
      travelPreferences: {
        ...currentPrefs,
        [prefKey]: value,
      },
    }, { silent: true });
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileError('Please select a valid image file (PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setProfileError('Image file is too large (max 5MB). Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        // Compress and resize client-side to max 256x256 to ensure lightweight data URL (< 100KB)
        const canvas = document.createElement('canvas');
        const MAX_DIM = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatarUrlInput(compressedDataUrl);
        setProfileError('');
      };
      img.src = loadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrlInput('');
    setProfileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');

    const trimmedName = nameInput.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setProfileError('Full Name must be between 2 and 50 characters.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updatedProfile = {
        name: trimmedName,
        avatarUrl: avatarUrlInput || '',
        homeCity: homeCityInput.trim() || 'Vidisha, Madhya Pradesh',
        homeCountry: homeCountryInput.trim() || 'India',
      };

      setUser((prev) => ({
        ...prev,
        ...updatedProfile,
      }));

      updateUserSettings({
        homeCountry: updatedProfile.homeCountry,
      }, { silent: true });

      if (isAuthenticated && isBackendConnected) {
        await api.auth.updateProfile(updatedProfile);
      }

      addToast('Profile Updated', 'Name, avatar, and home location successfully saved.', 'success');
    } catch (err) {
      console.warn('Failed to update profile:', err);
      addToast('Profile Saved Locally', 'Changes saved in local session.', 'info');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const travelPrefs = settings?.travelPreferences || {
    preferFewerTransfers: false,
    preferDirect: false,
    maxWalkingMinutes: 20,
  };

  const isLight = settings?.theme === 'light';

  return (
    <div className="space-y-6 max-w-4xl pb-12 text-travel-primary">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-black text-travel-primary tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-travel-accent" />
          Settings & Travel Preferences
        </h2>
        <p className="text-xs text-travel-secondary mt-1">
          Personalize your appearance, currency, routing preferences, display units, accessibility, and emergency settings.
        </p>
      </div>

      {/* Section 0: Edit Profile & Cloud Session */}
      <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-travel pb-4">
          <div>
            <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-travel-accent" />
              Edit Traveler Profile
            </h3>
            <p className="text-xs text-travel-secondary mt-0.5">
              Update your personal display name, profile avatar, and default departure hub.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={logoutUser}
                className="px-4 py-2 rounded-xl bg-travel-subtle hover:bg-rose-500/10 text-rose-400 border border-travel text-xs font-semibold transition flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="px-4 py-2 rounded-xl btn-travel-primary text-xs font-bold transition flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In to Cloud</span>
              </button>
            )}
          </div>
        </div>

        {/* Profile Avatar & Details Form */}
        <form onSubmit={handleSaveProfile} className="space-y-5">
          {profileError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar Preview */}
            <div className="relative group shrink-0">
              <img
                src={
                  avatarUrlInput ||
                  user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'
                }
                alt={nameInput || 'User Avatar'}
                className="w-20 h-20 rounded-2xl object-cover border-2 border-travel shadow-md"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition text-[10px] font-bold gap-1"
                title="Change Photo"
              >
                <Camera className="w-4 h-4" />
                <span>Change</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarFileChange}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-travel-subtle hover:bg-travel-card text-travel-primary border border-travel text-xs font-semibold transition flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-travel-accent" />
                  <span>Upload Photo</span>
                </button>
                {(avatarUrlInput || user?.avatarUrl) && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3 py-1.5 rounded-xl bg-travel-subtle hover:bg-rose-500/10 text-rose-400 border border-travel text-xs font-semibold transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-travel-secondary">
                Square JPG, PNG, or WebP. Automatically optimized and compressed under 100KB for instant storage.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-travel-primary mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (profileError) setProfileError('');
                }}
                maxLength={50}
                required
                placeholder="e.g. Achintya Sharma"
                className="w-full bg-travel-subtle border border-travel rounded-xl px-3 py-2 text-xs text-travel-primary placeholder:text-travel-muted focus:outline-none focus:border-travel-accent"
              />
              <span className="text-[10px] text-travel-muted mt-0.5 block">
                Must be between 2 and 50 characters.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-travel-primary mb-1">
                Account Email
              </label>
              <input
                type="email"
                value={user?.email || 'guest@tripmate.local'}
                disabled
                className="w-full bg-travel-subtle/50 border border-travel rounded-xl px-3 py-2 text-xs text-travel-muted cursor-not-allowed font-mono"
              />
              <span className="text-[10px] text-travel-muted mt-0.5 block">
                {isAuthenticated ? 'Associated with your authenticated cloud identity.' : 'Guest session mode.'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-travel-primary mb-1">
                Home City (Default Departure Hub)
              </label>
              <input
                type="text"
                value={homeCityInput}
                onChange={(e) => setHomeCityInput(e.target.value)}
                placeholder="e.g. Vidisha, Madhya Pradesh"
                className="w-full bg-travel-subtle border border-travel rounded-xl px-3 py-2 text-xs text-travel-primary placeholder:text-travel-muted focus:outline-none focus:border-travel-accent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-travel-primary mb-1">
                Home Country
              </label>
              <input
                type="text"
                value={homeCountryInput}
                onChange={(e) => setHomeCountryInput(e.target.value)}
                placeholder="e.g. India"
                className="w-full bg-travel-subtle border border-travel rounded-xl px-3 py-2 text-xs text-travel-primary placeholder:text-travel-muted focus:outline-none focus:border-travel-accent"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-travel">
            <span className="text-xs text-travel-secondary flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-travel-accent" />
              {isAuthenticated ? 'Synced to Local MongoDB' : 'Persisted in Browser LocalStorage'}
            </span>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-4 py-2 rounded-xl btn-travel-primary text-xs font-bold transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 1: Appearance & Theme System */}
      <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-sm space-y-6">
        <div className="border-b border-travel pb-3">
          <h3 className="text-base font-bold text-travel-primary flex items-center gap-2">
            <Sun className="w-5 h-5 text-travel-accent" />
            Theme System & Appearance
          </h3>
          <p className="text-xs text-travel-secondary mt-0.5">
            Select a travel-inspired theme family and choose your preferred light, dark, or system appearance.
          </p>
        </div>

        {/* 1A. Appearance Mode Selector (Light / Dark / System) */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-travel-primary uppercase tracking-wider block">
            Appearance Mode
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light', icon: Sun, desc: 'Crisp bright surfaces' },
              { id: 'dark', label: 'Dark', icon: Moon, desc: 'Deep night contrast' },
              { id: 'system', label: 'System', icon: Monitor, desc: 'Follow device settings' },
            ].map((mode) => {
              const Icon = mode.icon;
              const isSelected = activeAppearance === mode.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    setAppearance(mode.id);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition flex flex-col gap-1.5 ${isSelected
                      ? 'bg-travel-accent-soft border-travel-accent ring-1 ring-[var(--accent-primary)] shadow-sm'
                      : 'bg-travel-subtle border-travel hover:bg-travel-card'
                    }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-travel-accent' : 'text-travel-secondary'}`} />
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
                    )}
                  </div>
                  <span className="font-bold text-xs text-travel-primary">{mode.label}</span>
                  <span className="text-[10px] text-travel-secondary leading-tight hidden sm:block">{mode.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 1B. Theme Family Selector (Forest / Ocean / Sand / Slate) */}
        <div className="space-y-2.5 pt-2">
          <label className="text-xs font-bold text-travel-primary uppercase tracking-wider block">
            Theme Palette Family
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {themeFamilies.map((fam) => {
              const isSelected = activeFamily === fam.id;
              return (
                <button
                  key={fam.id}
                  type="button"
                  onClick={() => {
                    setThemeFamily(fam.id);
                  }}
                  className={`p-4 rounded-xl border text-left transition flex flex-col justify-between gap-3 ${isSelected
                      ? 'bg-travel-accent-soft border-travel-accent ring-1 ring-[var(--accent-primary)] shadow-sm'
                      : 'bg-travel-subtle border-travel hover:bg-travel-card'
                    }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-travel-primary">{fam.name}</span>
                        {isSelected && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold bg-travel-card text-travel-accent border border-travel">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-travel-secondary font-medium block mt-0.5">
                        {fam.tagline}
                      </span>
                    </div>

                    {/* Color Swatch Preview Chips */}
                    <div className="flex items-center gap-1 bg-travel-card p-1 rounded-lg border border-travel shrink-0">
                      {fam.swatches.map((color, idx) => (
                        <span
                          key={idx}
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-travel-secondary leading-relaxed">
                    {fam.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Currency & Regional Formatting */}
      <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-sm space-y-5">
        <div className="border-b border-travel pb-3">
          <h3 className="text-sm font-bold text-travel-primary flex items-center gap-2">
            <Globe className="w-4 h-4 text-travel-accent" />
            Currency & Regional Formatting
          </h3>
          <p className="text-xs text-travel-secondary mt-0.5">
            Set your preferred currency and formatting conventions for expenses, dates, and transit distances.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Preferred Currency */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs font-semibold text-travel-primary mb-1.5">
              Preferred Currency
            </label>
            <select
              value={settings?.currency || 'USD'}
              onChange={(e) => handleSettingChange('currency', e.target.value)}
              className="w-full bg-travel-subtle border border-travel rounded-xl px-3 py-2 text-xs font-bold text-travel-primary focus:outline-none focus:border-travel-accent"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} ({curr.symbol}) — {curr.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-travel-muted mt-1 block">
              Used across budgets, expense breakdowns, and stays.
            </span>
          </div>

          {/* Distance Units */}
          <div>
            <label className="block text-xs font-semibold text-travel-primary mb-1.5">
              Distance Units
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSettingChange('distanceUnit', 'km')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${settings?.distanceUnit === 'km'
                    ? 'btn-travel-primary'
                    : 'bg-travel-subtle text-travel-secondary border-travel hover:text-travel-primary'
                  }`}
              >
                Kilometers (km)
              </button>
              <button
                type="button"
                onClick={() => handleSettingChange('distanceUnit', 'mi')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${settings?.distanceUnit === 'mi'
                    ? 'btn-travel-primary'
                    : 'bg-travel-subtle text-travel-secondary border-travel hover:text-travel-primary'
                  }`}
              >
                Miles (mi)
              </button>
            </div>
          </div>

          {/* Temperature Units */}
          <div>
            <label className="block text-xs font-semibold text-travel-primary mb-1.5">
              Temperature
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSettingChange('tempUnit', 'C')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${settings?.tempUnit === 'C'
                    ? 'btn-travel-primary'
                    : 'bg-travel-subtle text-travel-secondary border-travel hover:text-travel-primary'
                  }`}
              >
                Celsius (°C)
              </button>
              <button
                type="button"
                onClick={() => handleSettingChange('tempUnit', 'F')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${settings?.tempUnit === 'F'
                    ? 'btn-travel-primary'
                    : 'bg-travel-subtle text-travel-secondary border-travel hover:text-travel-primary'
                  }`}
              >
                Fahrenheit (°F)
              </button>
            </div>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-xs font-semibold text-travel-primary mb-1.5">
              Date Format
            </label>
            <select
              value={settings?.dateFormat || 'YYYY-MM-DD'}
              onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
              className="w-full bg-travel-subtle border border-travel rounded-xl px-3 py-2 text-xs font-bold text-travel-primary focus:outline-none focus:border-travel-accent"
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (UK / Europe / India)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (United States)</option>
            </select>
          </div>

          {/* Time Format */}
          <div>
            <label className="block text-xs font-semibold text-travel-primary mb-1.5">
              Time Format
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleSettingChange('timeFormat', '12h')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${settings?.timeFormat !== '24h'
                    ? 'btn-travel-primary'
                    : 'bg-travel-subtle text-travel-secondary border-travel hover:text-travel-primary'
                  }`}
              >
                12-Hour (2:30 PM)
              </button>
              <button
                type="button"
                onClick={() => handleSettingChange('timeFormat', '24h')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition border ${settings?.timeFormat === '24h'
                    ? 'btn-travel-primary'
                    : 'bg-travel-subtle text-travel-secondary border-travel hover:text-travel-primary'
                  }`}
              >
                24-Hour (14:30)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Travel & Routing Preferences */}
      <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-sm space-y-5">
        <div className="border-b border-travel pb-3">
          <h3 className="text-sm font-bold text-travel-primary flex items-center gap-2">
            <Compass className="w-4 h-4 text-travel-accent" />
            Travel & Routing Preferences
          </h3>
          <p className="text-xs text-travel-secondary mt-0.5">
            Configure how transport discovery prioritizes connections and walking thresholds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Transfer Optimization */}
          <div className="bg-travel-subtle p-4 rounded-xl border border-travel flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-travel-primary block">Connection Preference</span>
              <p className="text-[11px] text-travel-secondary mt-1">
                Prioritize routes with fewer transfers between train and bus links.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTravelPrefChange('preferFewerTransfers', !travelPrefs.preferFewerTransfers)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 ${travelPrefs.preferFewerTransfers
                  ? 'bg-travel-accent-soft text-travel-accent border-travel'
                  : 'bg-travel-card text-travel-secondary border-travel hover:text-travel-primary'
                }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${travelPrefs.preferFewerTransfers ? 'text-travel-accent' : 'text-travel-muted'}`} />
              <span>{travelPrefs.preferFewerTransfers ? 'Fewer Transfers On' : 'Standard Routing'}</span>
            </button>
          </div>

          {/* Direct Route Preference */}
          <div className="bg-travel-subtle p-4 rounded-xl border border-travel flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-travel-primary block">Direct Travel Priority</span>
              <p className="text-[11px] text-travel-secondary mt-1">
                Prefer direct trains and non-stop road corridors when available.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleTravelPrefChange('preferDirect', !travelPrefs.preferDirect)}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition border flex items-center justify-center gap-1.5 ${travelPrefs.preferDirect
                  ? 'bg-travel-accent-soft text-travel-accent border-travel'
                  : 'bg-travel-card text-travel-secondary border-travel hover:text-travel-primary'
                }`}
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${travelPrefs.preferDirect ? 'text-travel-accent' : 'text-travel-muted'}`} />
              <span>{travelPrefs.preferDirect ? 'Direct Preferred' : 'Balanced Routing'}</span>
            </button>
          </div>

          {/* Maximum Walking Minutes */}
          <div className="bg-travel-subtle p-4 rounded-xl border border-travel flex flex-col justify-between space-y-3">
            <div>
              <span className="text-xs font-bold text-travel-primary block">Max Walking Segment</span>
              <p className="text-[11px] text-travel-secondary mt-1">
                Upper limit for walking between stations or transit connections.
              </p>
            </div>
            <select
              value={travelPrefs.maxWalkingMinutes || 20}
              onChange={(e) => handleTravelPrefChange('maxWalkingMinutes', parseInt(e.target.value, 10))}
              className="w-full bg-travel-card border border-travel rounded-xl px-3 py-2 text-xs font-bold text-travel-primary focus:outline-none focus:border-travel-accent"
            >
              <option value="10">10 minutes (~0.8 km)</option>
              <option value="15">15 minutes (~1.2 km)</option>
              <option value="20">20 minutes (~1.6 km)</option>
              <option value="30">30 minutes (~2.4 km)</option>
              <option value="45">45 minutes (~3.6 km)</option>
            </select>
          </div>
        </div>

        {/* Accessibility & Reduced Motion */}
        <div className="border-t border-travel pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-travel-primary flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-travel-accent" />
              Reduced Motion & Battery Optimization
            </span>
            <p className="text-[11px] text-travel-secondary mt-0.5">
              Disable animated pulse effects and complex map transition loops for sensitive eyes or low-power mode.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSettingChange('reducedMotion', !settings?.reducedMotion)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border shrink-0 ${settings?.reducedMotion
                ? 'btn-travel-primary'
                : 'bg-travel-subtle text-travel-secondary border-travel hover:text-travel-primary'
              }`}
          >
            {settings?.reducedMotion ? 'Reduced Motion: Active' : 'Reduced Motion: Off'}
          </button>
        </div>

        {/* Action Button: Save Regional & Travel Preferences */}
        <div className="border-t border-travel pt-4 flex items-center justify-between">
          <span className="text-xs text-travel-secondary">
            Settings apply instantly to all routing calculators and itinerary budgets.
          </span>
          <button
            type="button"
            onClick={() => {
              addToast('Preferences Saved', 'Regional settings and travel routing preferences updated.', 'success');
            }}
            className="px-4 py-2 rounded-xl btn-travel-primary text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>

      {/* Section 4: Safety & Emergency Protocol Controls */}
      <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-sm space-y-5">
        <div className="border-b border-travel pb-3">
          <h3 className="text-sm font-bold text-travel-primary flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-travel-accent" />
            Safety & Emergency Readiness Parameters
          </h3>
          <p className="text-xs text-travel-secondary mt-0.5">
            Configure simulated beacon timings, cancel grace windows, and automated check-in reminder intervals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-travel-primary mb-1.5">
              Distress Beacon Sensitivity
            </label>
            <select
              value={settings?.safetySensitivity || 'Standard'}
              onChange={(e) => handleSettingChange('safetySensitivity', e.target.value)}
              className="w-full bg-travel-subtle border border-travel rounded-xl px-3 py-2 text-xs font-bold text-travel-primary focus:outline-none focus:border-travel-accent"
            >
              <option value="Standard">Standard (5s Cancel Window)</option>
              <option value="High Alert">High Alert (3s Cancel Window)</option>
              <option value="Discreet">Discreet (Silent Visual Relay)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-travel-primary mb-1.5">
              Scheduled Safety Check-In Prompt
            </label>
            <select
              value={settings?.autoCheckinInterval || '8h'}
              onChange={(e) => handleSettingChange('autoCheckinInterval', e.target.value)}
              className="w-full bg-travel-subtle border border-travel rounded-xl px-3 py-2 text-xs font-bold text-travel-primary focus:outline-none focus:border-travel-accent"
            >
              <option value="Off">Disabled (Manual Only)</option>
              <option value="4h">Every 4 Hours</option>
              <option value="8h">Every 8 Hours (Recommended)</option>
              <option value="24h">Daily Morning Check-in</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 5: Data Management & Backup Portability */}
      <div className="bg-travel-card rounded-2xl p-6 border border-travel shadow-sm space-y-5">
        <div className="border-b border-travel pb-3">
          <h3 className="text-sm font-bold text-travel-primary flex items-center gap-2">
            <Download className="w-4 h-4 text-travel-accent" />
            Data Management & Portability
          </h3>
          <p className="text-xs text-travel-secondary mt-0.5">
            Export your planned expeditions, stays, and budget archives or reset demonstration state anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Export JSON */}
          <div className="bg-travel-subtle p-4 rounded-xl border border-travel flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-travel-primary">Export Traveler Data</h4>
              <p className="text-[11px] text-travel-secondary mt-1">
                Download a clean JSON archive containing all journeys, transport legs, stays, places, and expenses.
              </p>
            </div>
            <button
              type="button"
              onClick={exportJourneyData}
              className="w-full py-2 px-3 rounded-xl btn-travel-primary text-xs transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Reset Demo Data */}
          <div className="bg-travel-subtle p-4 rounded-xl border border-travel flex flex-col justify-between space-y-3">
            <div>
              <h4 className="text-xs font-bold text-rose-400">Reset Demo Seed Data</h4>
              <p className="text-[11px] text-travel-secondary mt-1">
                Restore initial demonstration trips (Kyoto, Swiss Alps, Amalfi Coast) and clear custom modifications.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmResetOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset All Demo Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Demo Data Reset */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-travel-card border border-rose-500/50 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-elevated">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Reset Demo Records?</span>
            </div>
            <p className="text-xs text-travel-secondary leading-relaxed">
              This will restore initial demonstration journeys, saved places, and reset local changes.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-travel">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-travel-secondary hover:text-travel-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllDemoData();
                  setConfirmResetOpen(false);
                }}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transparent Disclaimer & Safety Notice */}
      <div className="p-4 rounded-2xl bg-travel-subtle border border-travel text-xs text-travel-secondary space-y-2">
        <div className="flex items-center gap-2 text-travel-primary font-bold">
          <Info className="w-4 h-4 text-travel-accent shrink-0" />
          <span>Product Transparency & Compliance Disclaimer</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          TripMate is a personal travel planner, mobility itinerary builder, and emergency readiness hub. All road and pedestrian routing is calculated using live OpenStreetMap OSRM geometry. When third-party public transit or airline booking APIs are not linked, TripMate indicates provider status honestly and allows custom booked legs. Simulated emergency features do not connect to live 911/112 police dispatch.
        </p>
      </div>
    </div>
  );
}
