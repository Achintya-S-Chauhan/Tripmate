import React from 'react';
import {
  Compass,
  Map,
  ShieldAlert,
  BarChart3,
  Bookmark,
  ShieldCheck,
  Navigation2,
  ArrowRight,
  Sparkles,
  Layers,
  Database,
  Lock,
  Leaf,
  CheckCircle2,
  ChevronRight,
  Radio,
  Footprints,
  Train,
  HeartPulse,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function LandingPage({ onOpenAuth, onEnterDemo }) {
  const { isBackendConnected, isAuthenticated, setActivePage, user } = useApp();

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-[#070b14]/85 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => isAuthenticated && setActivePage('overview')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <Compass className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-white block">
                Trip<span className="text-teal-400">Mate</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium block -mt-0.5">
                Full-Stack Mobility Companion
              </span>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <a href="#features" className="hover:text-teal-400 transition">Features</a>
            <a href="#how-it-works" className="hover:text-teal-400 transition">How It Works</a>
            <a href="#architecture" className="hover:text-teal-400 transition">Tech Stack</a>
            <a href="#privacy" className="hover:text-teal-400 transition">Safety & Ethics</a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <button
                onClick={() => setActivePage('overview')}
                className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-teal-500/20 transition flex items-center gap-1.5"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={onEnterDemo}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Explore Demo</span>
                </button>
                <button
                  onClick={() => onOpenAuth('login')}
                  className="hidden sm:inline-flex px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-bold transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold shadow-lg shadow-teal-500/20 transition flex items-center gap-1"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 px-4 sm:px-8">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-teal-500/30 text-teal-300 text-xs font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>MERN Full-Stack Major Project Architecture</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Node.js + Express + MongoDB Atlas</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Smart Travel, Multi-Modal Mobility &{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200">
              Emergency Safety Companion
            </span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-400 leading-relaxed">
            TripMate models realistic travel chains, computes live carbon offsets (DEFRA 2024 standards), manages geofenced safe havens, and provides an accidental-activation guarded emergency distress beacon.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            {isAuthenticated ? (
              <button
                onClick={() => setActivePage('overview')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-teal-500/20 transition flex items-center justify-center gap-2 group"
              >
                <span>Continue to Dashboard ({user?.name || 'Explorer'})</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onOpenAuth('register')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-extrabold text-sm shadow-xl shadow-teal-500/20 transition flex items-center justify-center gap-2 group"
                >
                  <span>Create Cloud Account</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </button>
                <button
                  onClick={onEnterDemo}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <span>Launch Interactive Demo Mode</span>
                </button>
              </>
            )}
          </div>

          {/* Live Status indicator */}
          <div className="pt-4 flex items-center justify-center gap-4 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {isBackendConnected ? 'Backend API: Online (Port 5000)' : 'Backend API: Standby (Seed Mode Ready)'}
            </span>
            <span>•</span>
            <span>JWT + Bcrypt Auth</span>
            <span>•</span>
            <span>Leaflet Mapping</span>
          </div>

          {/* Interactive Hero Visual Card */}
          <div className="pt-8">
            <div className="bg-[#0b1222] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl max-w-4xl mx-auto text-left relative overflow-hidden group">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <Navigation2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-white text-sm">Active Multi-Modal Trip Chain</h4>
                      <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30">
                        In Progress
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Home (Kitayama) → Bus #206 → Cafe Stop → Kyoto Yoshida Campus
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400">Distance: </span>
                    <span className="text-white font-bold">7.3 km</span>
                  </div>
                  <div className="bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="text-slate-400">CO₂ Saved: </span>
                    <span className="text-emerald-400 font-bold">-0.8 kg</span>
                  </div>
                </div>
              </div>

              {/* Segment chain preview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
                {[
                  { mode: 'Walking', from: 'Kitayama Home', to: 'Line 206 Stop', time: '8m', icon: Footprints, color: 'text-teal-400' },
                  { mode: 'City Bus #206', from: 'Kitayama Stn', to: 'Hyakumanben', time: '24m', icon: Train, color: 'text-sky-400' },
                  { mode: 'Cafe Stop', from: 'Ogawa Coffee', to: 'Espresso Break', time: '15m', icon: Sparkles, color: 'text-amber-400' },
                  { mode: 'Campus Walk', from: 'Hyakumanben', to: 'Yoshida Hall', time: '8m', icon: Footprints, color: 'text-emerald-400' },
                ].map((leg, idx) => {
                  const Icon = leg.icon;
                  return (
                    <div key={idx} className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <Icon className={`w-4 h-4 ${leg.color}`} />
                        <span className="text-[10px] font-mono text-slate-400">{leg.time}</span>
                      </div>
                      <div className="text-xs font-bold text-white truncate">{leg.mode}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{leg.from} → {leg.to}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-16 bg-[#0a0f1d] border-t border-b border-slate-800/80 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Architecture & Features</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Engineered as an Academic-Grade Full-Stack System
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              TripMate moves beyond typical mockups by implementing authentic REST architecture, database models, and client-side defensive caching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-[#0b1222] p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
                <Navigation2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Multi-Modal Trip Chains</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Represents realistic transit as ordered legs (walk, bus, rail, stops) rather than isolated GPS coordinates. Automatically aggregates totals and tracks active legs.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0b1222] p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Leaf className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Carbon & Eco Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Applies documented UK DEFRA 2024 emission coefficients across modes. Generates Recharts time-series, modal splits, and equivalent private vehicle comparisons.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0b1222] p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Bookmark className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Geofenced Safe Zones</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Defines perimeter safe havens with customizable radii (100m to 1500m). Features interactive Leaflet visual circles and simulated entry/exit triggers with event logging.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#0b1222] p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Guarded SOS & ICE Vault</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Features a 5-second cancelable confirmation window to prevent accidental triggers. Displays live elapsed emergency timer, mock dispatch manifests, and medical ICE card.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#0b1222] p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">MongoDB Atlas & Mongoose</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Structured schema for Users, Journeys, TripSegments, SavedPlaces, and TrustedContacts. Strict per-user isolation prevents unauthorized cross-user record access.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#0b1222] p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Map className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Offline Vector Fallback</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Leaflet OpenStreetMap integration with automatic tile error detection. Gracefully falls back to an offline SVG route diagram when network access is restricted.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 sm:px-8 max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Workflow Walkthrough</span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">How TripMate Operates</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0b1222] p-6 rounded-3xl border border-slate-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-300 font-extrabold flex items-center justify-center mx-auto text-sm border border-teal-500/40">
              1
            </div>
            <h3 className="font-bold text-white text-sm">Register & Plan Expeditions</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign up with JWT authentication. Plan custom multi-modal journeys, add transit legs, configure budgets, and view waypoint maps.
            </p>
          </div>

          <div className="bg-[#0b1222] p-6 rounded-3xl border border-slate-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-300 font-extrabold flex items-center justify-center mx-auto text-sm border border-teal-500/40">
              2
            </div>
            <h3 className="font-bold text-white text-sm">Track Progress & Geofences</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Start your journey lifecycle on the dashboard, advance active legs, test safe zone entry/exit simulations, and log safety check-ins.
            </p>
          </div>

          <div className="bg-[#0b1222] p-6 rounded-3xl border border-slate-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-300 font-extrabold flex items-center justify-center mx-auto text-sm border border-teal-500/40">
              3
            </div>
            <h3 className="font-bold text-white text-sm">Analyze & Export Data</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Review Recharts distance time-series and transport splits, customize DEFRA emission factors, and export all travel records as CSV.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture & Tech Stack Details */}
      <section id="architecture" className="py-16 bg-[#0a0f1d] border-t border-b border-slate-800/80 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-400">Under the Hood</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Full-Stack Technology Stack</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-[#0b1222] p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">Frontend</span>
              <p className="font-bold text-white text-sm">React 19 + Vite 8</p>
              <p className="text-[11px] text-slate-400">Tailwind CSS + Lucide</p>
            </div>
            <div className="bg-[#0b1222] p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Backend</span>
              <p className="font-bold text-white text-sm">Node.js + Express</p>
              <p className="text-[11px] text-slate-400">RESTful Architecture</p>
            </div>
            <div className="bg-[#0b1222] p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">Database</span>
              <p className="font-bold text-white text-sm">MongoDB Atlas</p>
              <p className="text-[11px] text-slate-400">Mongoose ODM</p>
            </div>
            <div className="bg-[#0b1222] p-4 rounded-2xl border border-slate-800 text-center space-y-1">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">Security</span>
              <p className="font-bold text-white text-sm">JWT + Bcrypt</p>
              <p className="text-[11px] text-slate-400">Protected Auth Routes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Safety Transparency */}
      <section id="privacy" className="py-12 px-4 sm:px-8 max-w-4xl mx-auto">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>Ethical Transparency & Safety Notice</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            TripMate was created as an educational student major project demonstrating modern travel-tech interface and cloud design. All emergency SOS broadcasts, GPS coordinates, and cellular SMS dispatches are client-side simulations. The application does not connect to live 911/110/112 emergency services, sell location data, or track device sensors without user consent.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-800/80 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-400" />
            <span className="text-slate-400 font-bold">TripMate Major Project</span>
            <span>— Smart Mobility & Safety Companion</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            {isAuthenticated ? (
              <button onClick={() => setActivePage('overview')} className="text-teal-400 font-bold hover:underline transition">
                Go to Dashboard ({user?.name || 'Explorer'})
              </button>
            ) : (
              <>
                <button onClick={onEnterDemo} className="hover:text-teal-400 transition">Interactive Demo</button>
                <button onClick={() => onOpenAuth('login')} className="hover:text-teal-400 transition">Sign In</button>
                <button onClick={() => onOpenAuth('register')} className="hover:text-teal-400 transition">Create Account</button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

