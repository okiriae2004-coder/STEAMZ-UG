import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { UserRole, SUPER_ADMIN_EMAIL } from '../../types';
import {
  X,
  User,
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
  KeyRound,
  Mail,
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
    loginWithPhoneAndPin,
    registerWithPhoneAndPin,
    loginWithEmail,
    signupWithEmail,
    signInWithGoogle,
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
  // Default to pure WhatsApp Number + PIN!
  const [authMethod, setAuthMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  
  // WhatsApp + PIN credentials
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [universityId, setUniversityId] = useState<string>(selectedUniversityId || 'kiu-western');
  const [preferredDropSpotId, setPreferredDropSpotId] = useState<string>('spot-kiu-eng');
  
  // Email credentials (optional fallback)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const handleSuperAdminLogin = () => {
    loginAsSuperAdmin();
    setUserRole('admin');
    setSelectedUniversityId('kiu-western');
    setSelectedDropSpotId('spot-kiu-eng');
    onClose();
  };

  // WhatsApp & PIN Submit Handler
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('Please enter a valid WhatsApp phone number (e.g. 0771234567 or 0700123456).');
      return;
    }

    const cleanPin = pin.trim();
    if (!cleanPin || cleanPin.length < 4) {
      setErrorMsg('Secret PIN must be at least 4 digits (e.g. 1234 or 9876).');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signin') {
        await loginWithPhoneAndPin(cleanPhone, cleanPin);
      } else {
        if (!displayName.trim()) {
          setErrorMsg('Please enter your name or nickname.');
          setSubmitting(false);
          return;
        }

        await registerWithPhoneAndPin({
          phone: cleanPhone,
          pin: cleanPin,
          displayName: displayName.trim(),
          universityId,
          preferredDropSpotId,
        });
        setSelectedUniversityId(universityId);
        setSelectedDropSpotId(preferredDropSpotId);
      }
      setUserRole('customer');
      onClose();
    } catch (err: any) {
      console.error('WhatsApp Auth Error:', err);
      setErrorMsg(err?.message || 'Failed to sign in. Please verify your number and PIN.');
    } finally {
      setSubmitting(false);
    }
  };

  // Email / Password Fallback Submit Handler
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      if (mode === 'signin') {
        await loginWithEmail(email, password);
      } else {
        if (!displayName.trim()) {
          setErrorMsg('Please enter your name.');
          setSubmitting(false);
          return;
        }
        await signupWithEmail(
          email,
          password,
          displayName,
          'customer',
          universityId,
          preferredDropSpotId,
          phone || ''
        );
        setSelectedUniversityId(universityId);
        setSelectedDropSpotId(preferredDropSpotId);
      }
      setUserRole('customer');
      onClose();
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setErrorMsg(err?.message || 'Authentication failed. Please check your details.');
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
              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-sm font-bold ml-1.5">
                WHATSAPP & PIN
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Title */}
          <div className="text-center pt-1">
            <h3 className="text-xl font-black text-stone-900">
              {mode === 'signin' ? 'Sign In with WhatsApp & PIN' : 'Quick Sign Up (Number & PIN)'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {mode === 'signin'
                ? 'Enter your WhatsApp phone number and your 4-digit secret PIN.'
                : 'Just your WhatsApp number, a 4-digit PIN you choose, and your pickup spot!'}
            </p>
          </div>

          {/* Mode Switcher (Sign In vs Register) */}
          <div className="flex rounded-xl bg-stone-100 p-1 border border-stone-200">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
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
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Register (New Account)
            </button>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* PRIMARY METHOD: WHATSAPP NUMBER & PIN */}
          {authMethod === 'whatsapp' ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-3.5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Your Full Name / Nickname
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Timothy Okiria or Alex"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* WhatsApp Phone Number */}
              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span>WhatsApp Phone Number</span>
                  </label>
                  <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
                    Uganda
                  </span>
                </div>
                <div className="relative">
                  <Phone className="h-4 w-4 text-emerald-600 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="0771 234 567 or 0700 123 456"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white font-medium border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-emerald-800 mt-1">
                  Used for order updates and locker delivery pickup alerts.
                </p>
              </div>

              {/* Secret 4-6 Digit PIN */}
              <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200/80">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <KeyRound className="h-4 w-4 text-amber-600" />
                    <span>{mode === 'signup' ? 'Create a Secret PIN' : 'Your Secret PIN'}</span>
                  </label>
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                    4 to 6 Digits
                  </span>
                </div>
                <div className="relative">
                  <KeyRound className="h-4 w-4 text-amber-500 absolute left-3 top-2.5" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={8}
                    required
                    placeholder="e.g. 1234 or 987654"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, ''))}
                    className="w-full pl-9 pr-9 py-2 text-xs bg-white font-mono font-bold tracking-widest border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-800 mt-1">
                  {mode === 'signup'
                    ? 'Pick any 4 to 6 numbers you will remember to sign in anytime instantly.'
                    : 'Enter the PIN you chose when registering.'}
                </p>
              </div>

              {/* Campus & Pickup Spot Selection (Only for Signup) */}
              {mode === 'signup' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-amber-600" />
                      <span>Select Your Campus</span>
                    </label>
                    <select
                      value={universityId}
                      onChange={(e) => handleUniversityChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    >
                      {universities.map((uni) => (
                        <option key={uni.id} value={uni.id}>
                          {uni.shortName} • {uni.name} ({uni.campus})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-amber-600" />
                      <span>Preferred Meal Pickup Spot</span>
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
                  </div>

                  <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600 flex items-start gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-800 block">Student & Eater Account</span>
                      <span className="text-stone-500 text-[10px] leading-tight block mt-0.5">
                        New accounts are registered as customers. Admin and Kitchen tags are strictly managed by <strong className="text-stone-700">okiriae2004@gmail.com</strong>.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>
                      {mode === 'signin' ? 'Sign In with WhatsApp & PIN' : 'Complete Registration with WhatsApp & PIN'}
                    </span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* EMAIL / PASSWORD FORM (OPTIONAL) */
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Full Name
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign In with Email' : 'Register with Email'}
              </button>
            </form>
          )}

          {/* Toggle between WhatsApp/PIN and Email */}
          <div className="pt-2 text-center">
            {authMethod === 'whatsapp' ? (
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setErrorMsg(null);
                }}
                className="text-[11px] text-stone-500 hover:text-stone-800 underline font-medium cursor-pointer"
              >
                Prefer email and password instead? Click here
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('whatsapp');
                  setErrorMsg(null);
                }}
                className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
              >
                ← Back to WhatsApp Number & PIN (Recommended)
              </button>
            )}
          </div>

          {/* Super Admin & Quick Demo Login */}
          <div className="pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={handleSuperAdminLogin}
              className="w-full px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-bold text-amber-900 border border-amber-300/70 flex items-center justify-center gap-1.5 transition text-center cursor-pointer mb-2"
            >
              <Crown className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>Sign In as Super Admin (okiriae2004@gmail.com)</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('customer')}
              className="w-full px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-700 flex items-center justify-center gap-1.5 transition text-center cursor-pointer"
            >
              <User className="h-3.5 w-3.5 text-stone-500 shrink-0" />
              <span>Explore as KIU Student Demo (1-Click)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
