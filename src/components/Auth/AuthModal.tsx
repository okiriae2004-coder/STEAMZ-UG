import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { UserRole, SUPER_ADMIN_EMAIL } from '../../types';
import {
  X,
  Lock,
  Mail,
  User,
  Store,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Flame,
  GraduationCap,
  MapPin,
  Phone,
  MessageSquare,
  ShieldCheck,
  Crown,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const {
    signInWithGoogle,
    loginWithEmail,
    signupWithEmail,
    loginAsDemoUser,
    loginAsSuperAdmin,
  } = useAuth();

  const {
    setUserRole,
    universities,
    selectedUniversityId,
    setSelectedUniversityId,
    dropSpots,
    setSelectedDropSpotId,
  } = useApp();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [universityId, setUniversityId] = useState<string>(selectedUniversityId || 'kiu-western');
  const [preferredDropSpotId, setPreferredDropSpotId] = useState<string>('spot-kiu-eng');
  const [whatsapp, setWhatsapp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname : 'steamz-ug.vercel.app';

  const handleCopyDomain = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleSuperAdminLogin = () => {
    loginAsSuperAdmin();
    setUserRole('admin');
    setSelectedUniversityId('kiu-western');
    setSelectedDropSpotId('spot-kiu-eng');
    onClose();
  };

  if (!isOpen) return null;

  // Filter spots by university
  const universitySpots = dropSpots.filter((s) => s.universityId === universityId);
  const campusCompoundSpots = universitySpots.filter((s) => s.isCampusCompound);
  const outsideCampusSpots = universitySpots.filter((s) => !s.isCampusCompound);

  const handleUniversityChange = (newUniId: string) => {
    setUniversityId(newUniId);
    const spotsForUni = dropSpots.filter((s) => s.universityId === newUniId);
    if (spotsForUni.length > 0) {
      setPreferredDropSpotId(spotsForUni[0].id);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign in popup was closed. Please try again.');
      } else if (code === 'auth/popup-blocked') {
        setErrorMsg('Popup was blocked by browser. Please allow popups or use email login.');
      } else if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setErrorMsg('auth/unauthorized-domain');
      } else {
        setErrorMsg(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        if (!displayName.trim()) {
          setErrorMsg('Please enter your full name or nickname.');
          setSubmitting(false);
          return;
        }

        if (!whatsapp.trim()) {
          setErrorMsg('Please enter your WhatsApp number to receive delivery alerts & locker PINs.');
          setSubmitting(false);
          return;
        }

        await signupWithEmail(
          email,
          password,
          displayName,
          role,
          universityId,
          preferredDropSpotId,
          whatsapp
        );
        setSelectedUniversityId(universityId);
        setSelectedDropSpotId(preferredDropSpotId);
        setUserRole(role);
      }
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      const code = err?.code || '';
      const msg = err?.message || '';
      if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setErrorMsg('auth/unauthorized-domain');
      } else if (code === 'auth/operation-not-allowed' || msg.includes('operation-not-allowed')) {
        setErrorMsg('auth/operation-not-allowed');
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setErrorMsg('Invalid email or password. Please check your credentials.');
      } else if (code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists. Try signing in.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password must be at least 6 characters.');
      } else {
        setErrorMsg(err?.message || 'Authentication failed. Please check your details.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = (selectedRole: UserRole) => {
    loginAsDemoUser(selectedRole);
    setUserRole(selectedRole);
    setSelectedUniversityId('kiu-western');
    setSelectedDropSpotId('spot-kiu-eng');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[92vh] flex flex-col rounded-3xl bg-white p-5 sm:p-7 shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Flame className="h-5 w-5 fill-white" />
            </div>
            <div>
              <span className="font-display font-black text-lg tracking-tight text-stone-900">
                STEAMZ
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-sm font-bold ml-1.5">
                CAMPUS SPOTS
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Title & Mode Switcher */}
          <div className="text-center pt-1">
            <h3 className="text-xl font-black text-stone-900">
              {mode === 'signin' ? 'Welcome Back' : 'Student & Kitchen Registration'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {mode === 'signin'
                ? 'Sign in to access your spot pickups and order tracking'
                : 'Select your university campus, pickup spot, and WhatsApp number'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                mode === 'signin'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                mode === 'signup'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Register (New Account)
            </button>
          </div>

          {/* Error Alert / Troubleshooting Guide */}
          {errorMsg && (
            <div>
              {errorMsg === 'auth/unauthorized-domain' ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-xs">
                        Authorize Vercel Domain in Firebase
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        Firebase blocks auth requests from new Vercel domains until added to your project's Authorized Domains list.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/95 p-2.5 rounded-xl border border-amber-200/80 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-stone-500 font-medium">Your current domain:</span>
                      <div className="flex items-center gap-1">
                        <code className="font-mono font-bold text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded text-[11px]">
                          {currentHostname}
                        </code>
                        <button
                          type="button"
                          onClick={handleCopyDomain}
                          className="px-2 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold text-[10px] flex items-center gap-1 transition cursor-pointer"
                        >
                          {copiedDomain ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="pt-1.5 border-t border-amber-100 text-[10px] text-stone-600 space-y-1">
                      <p className="font-semibold text-stone-800">Quick 2-Step Fix:</p>
                      <ol className="list-decimal pl-4 space-y-1 text-stone-700">
                        <li>
                          Open{' '}
                          <a
                            href="https://console.firebase.google.com/project/top-oxygen-4nm9t/authentication/settings"
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-amber-700 underline inline-flex items-center gap-0.5 hover:text-amber-900"
                          >
                            Firebase Auth Settings <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        </li>
                        <li>Under <strong>Authorized domains</strong>, click <strong>Add domain</strong> and paste <code>{currentHostname}</code> (and <code>vercel.app</code>).</li>
                      </ol>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-amber-700">Immediate access for owner:</span>
                    <button
                      type="button"
                      onClick={handleSuperAdminLogin}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] shadow-2xs transition flex items-center gap-1"
                    >
                      <Crown className="h-3 w-3" />
                      <span>Sign In as Super Admin</span>
                    </button>
                  </div>
                </div>
              ) : errorMsg === 'auth/operation-not-allowed' ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-xs">
                        Enable Email/Password in Firebase Console
                      </h4>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        The Email/Password sign-in method is currently disabled in your Firebase project.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/95 p-2.5 rounded-xl border border-amber-200/80 text-[10px] text-stone-700 space-y-1.5">
                    <p className="font-semibold text-stone-900">How to enable in 20 seconds:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>
                        Open{' '}
                        <a
                          href="https://console.firebase.google.com/project/top-oxygen-4nm9t/authentication/providers"
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-amber-700 underline inline-flex items-center gap-0.5 hover:text-amber-900"
                        >
                          Sign-in method in Firebase Console <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </li>
                      <li>Click on <strong>Email/Password</strong>.</li>
                      <li>Toggle <strong>Enable</strong> to ON and click <strong>Save</strong>.</li>
                    </ol>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-amber-700">Immediate access:</span>
                    <button
                      type="button"
                      onClick={handleSuperAdminLogin}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] shadow-2xs transition flex items-center gap-1"
                    >
                      <Crown className="h-3 w-3" />
                      <span>Sign In as Super Admin</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Social Sign In (Google) */}
          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-xs font-bold text-stone-800 shadow-2xs transition disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white px-2 text-stone-400 font-bold tracking-wider">
                  Or with email
                </span>
              </div>
            </div>
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Full Name / Student Name
                </label>
                <div className="relative">
                  <User className="h-4 w-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Atukwase"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="h-4 w-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="student@kiu.ac.ug or personal@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
                {email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
                  <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Crown className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="font-semibold">Super Admin Account</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSuperAdminLogin}
                      className="text-[10px] font-bold text-amber-800 bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded-md transition cursor-pointer"
                    >
                      1-Click Sign In ⚡
                    </button>
                  </div>
                )}
              </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="h-4 w-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* University & Delivery Spots Selection during registration */}
            {mode === 'signup' && (
              <div className="space-y-3 pt-1 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4 text-amber-600" />
                    <span>Your University / Campus</span>
                  </label>
                  <select
                    value={universityId}
                    onChange={(e) => handleUniversityChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold border border-stone-300 rounded-xl bg-amber-50/40 text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    {universities.map((uni) => (
                      <option key={uni.id} value={uni.id}>
                        {uni.name} ({uni.town})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Delivers to spots & kitchen partners attached to this campus
                  </p>
                </div>

                {/* Preferred Drop Spot */}
                <div>
                  <label className="block text-xs font-bold text-stone-900 mb-1 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-amber-600" />
                    <span>Preferred Delivery Pickup Spot</span>
                  </label>
                  <select
                    value={preferredDropSpotId}
                    onChange={(e) => setPreferredDropSpotId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  >
                    <optgroup label="🏫 Inside Campus Compound">
                      {campusCompoundSpots.map((spot) => (
                        <option key={spot.id} value={spot.id}>
                          {spot.shortCode} • {spot.name} ({spot.zone})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="📍 Outside Campus Spots">
                      {outsideCampusSpots.map((spot) => (
                        <option key={spot.id} value={spot.id}>
                          {spot.shortCode} • {spot.name} ({spot.zone})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                  <p className="text-[10px] text-stone-500 mt-1">
                    Lockers equipped with PIN access & thermal batch hold
                  </p>
                </div>

                {/* WhatsApp Phone Number for Delivery and Pickup Alerts */}
                <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/80">
                  <label className="block text-xs font-bold text-emerald-950 mb-1 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span>WhatsApp Number (Delivery & Pickup PIN)</span>
                  </label>
                  <div className="relative">
                    <Phone className="h-4 w-4 text-emerald-600 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      required
                      placeholder="+256 700 123456"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <p className="text-[10px] text-emerald-800 mt-1 leading-snug">
                    Asked at registration so you receive instant WhatsApp messages when your meal batch arrives at your locker with your 4-digit pickup PIN.
                  </p>
                </div>

                {/* Account Type Security Policy */}
                <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-800 block">Student & Eater Account</span>
                    <span className="text-stone-500 text-[10px] leading-tight block mt-0.5">
                      New accounts are registered as customers. Admin and Restaurant Owner tags are strictly assigned by <strong className="text-stone-700">okiriae2004@gmail.com</strong>.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <span>
                {submitting
                  ? 'Please wait...'
                  : mode === 'signin'
                  ? 'Sign In to STEAMZ'
                  : 'Complete Registration'}
              </span>
            </button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="pt-3 border-t border-stone-100">
            <div className="flex items-center justify-between text-[11px] text-stone-400 mb-2">
              <span>Instant KIU Western Demo:</span>
              <span className="text-stone-500 font-medium">1-Click Sign In</span>
            </div>
            <button
              type="button"
              onClick={() => handleDemoLogin('customer')}
              className="w-full px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 flex items-center justify-center gap-1.5 transition text-center cursor-pointer"
            >
              <User className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Continue with KIU Student Demo</span>
            </button>

            <button
              type="button"
              onClick={handleSuperAdminLogin}
              className="w-full mt-2 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-900 border border-amber-300/70 flex items-center justify-center gap-1.5 transition text-center cursor-pointer"
            >
              <Crown className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Sign In as Super Admin (okiriae2004@gmail.com)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
