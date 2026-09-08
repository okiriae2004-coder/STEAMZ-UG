import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { UserRole, SUPER_ADMIN_EMAIL } from '../../types';
import {
  X,
  User,
  Phone,
  MapPin,
  Camera,
  Upload,
  GraduationCap,
  Home,
  CheckCircle2,
  ShieldCheck,
  Store,
  Shield,
  LogOut,
  Sparkles,
  AlertCircle,
  Save,
  Plus,
  Lock,
  Crown,
  Trash2,
} from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdminSpots?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenAdminSpots,
}) => {
  const { userProfile, currentUser, logout, updateUserProfile, isDemoUser } = useAuth();
  const {
    universities,
    dropSpots,
    selectedUniversityId,
    setSelectedUniversityId,
    selectedDropSpotId,
    setSelectedDropSpotId,
    userRole,
    setUserRole,
    roleAssignments,
    grantPrivilege,
    revokePrivilege,
    isSuperAdmin,
    hasAdminPrivilege,
    hasOwnerPrivilege,
  } = useApp();

  const activeEmail = currentUser?.email || userProfile?.email;
  const isSuper = isSuperAdmin(activeEmail);
  const canAdmin = hasAdminPrivilege(activeEmail);
  const canOwner = hasOwnerPrivilege(activeEmail);

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [whatsapp, setWhatsapp] = useState(userProfile?.whatsapp || '');
  const [universityId, setUniversityId] = useState(
    userProfile?.universityId || selectedUniversityId || 'kiu-western'
  );
  const [residence, setResidence] = useState(
    userProfile?.residence || 'Main Hostel Block B, Room 14'
  );
  const [preferredDropSpotId, setPreferredDropSpotId] = useState(
    userProfile?.preferredDropSpotId || selectedDropSpotId || 'spot-kiu-eng'
  );
  const [recipientPhoto, setRecipientPhoto] = useState(
    userProfile?.recipientPhoto ||
      userProfile?.photoURL ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  );

  // Super Admin privilege assignment form state
  const [targetEmail, setTargetEmail] = useState('');
  const [targetRole, setTargetRole] = useState<'admin' | 'owner'>('owner');
  const [targetRestaurantName, setTargetRestaurantName] = useState('');
  const [privilegeMsg, setPrivilegeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState(false);
  const [roleErrorNotice, setRoleErrorNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'account_type' | 'admin'>('profile');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setWhatsapp(userProfile.whatsapp || '');
      if (userProfile.universityId) setUniversityId(userProfile.universityId);
      if (userProfile.residence) setResidence(userProfile.residence);
      if (userProfile.preferredDropSpotId) setPreferredDropSpotId(userProfile.preferredDropSpotId);
      if (userProfile.recipientPhoto) setRecipientPhoto(userProfile.recipientPhoto);
    }
  }, [userProfile]);

  if (!isOpen) return null;

  // Filter drop spots by selected university
  const availableSpots = dropSpots.filter((s) => s.universityId === universityId);

  const handleUniversityChange = (uniId: string) => {
    setUniversityId(uniId);
    setSelectedUniversityId(uniId);
    const spotsForUni = dropSpots.filter((s) => s.universityId === uniId);
    if (spotsForUni.length > 0) {
      setPreferredDropSpotId(spotsForUni[0].id);
      setSelectedDropSpotId(spotsForUni[0].id);
    }
  };

  const handleSpotChange = (spotId: string) => {
    setPreferredDropSpotId(spotId);
    setSelectedDropSpotId(spotId);
  };

  // Handle Photo Upload (converts file to base64 Data URL)
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setRecipientPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      displayName,
      whatsapp,
      universityId,
      residence,
      preferredDropSpotId,
      recipientPhoto,
      photoURL: recipientPhoto,
    });

    // Also persist in localStorage
    try {
      localStorage.setItem('steamz_saved_whatsapp', whatsapp);
      localStorage.setItem('steamz_saved_residence', residence);
      localStorage.setItem('steamz_saved_recipient_photo', recipientPhoto);
    } catch {
      // ignore
    }

    setSavedSuccessMsg(true);
    setTimeout(() => {
      setSavedSuccessMsg(false);
    }, 2500);
  };

  const handleRoleSwitch = async (newRole: UserRole) => {
    setRoleErrorNotice(null);
    if (newRole === 'admin' && !canAdmin) {
      setRoleErrorNotice('Access Restricted: Only okiriae2004@gmail.com has the authority to grant the Admin tag. You cannot self-assign this role.');
      return;
    }
    if (newRole === 'owner' && !canOwner) {
      setRoleErrorNotice('Access Restricted: Only okiriae2004@gmail.com has the authority to grant the Restaurant Owner tag. You cannot self-assign this role.');
      return;
    }
    setUserRole(newRole);
    await updateUserProfile({ role: newRole });
  };

  const handleGrantPrivilegeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrivilegeMsg(null);
    if (!targetEmail.trim()) return;

    const res = await grantPrivilege(
      targetEmail.trim(),
      targetRole,
      targetRole === 'owner' ? targetRestaurantName.trim() || undefined : undefined
    );

    if (!res.success) {
      setPrivilegeMsg({ type: 'error', text: res.error || 'Failed to grant privilege.' });
    } else {
      setPrivilegeMsg({
        type: 'success',
        text: `Granted ${targetRole === 'admin' ? 'Admin' : 'Restaurant Owner'} privileges to ${targetEmail.trim()}.`,
      });
      setTargetEmail('');
      setTargetRestaurantName('');
      setTimeout(() => setPrivilegeMsg(null), 4000);
    }
  };

  const handleRevokePrivilegeSubmit = async (email: string) => {
    setPrivilegeMsg(null);
    const res = await revokePrivilege(email);
    if (!res.success) {
      setPrivilegeMsg({ type: 'error', text: res.error || 'Failed to revoke privilege.' });
    } else {
      setPrivilegeMsg({
        type: 'success',
        text: `Revoked privileges for ${email}. Account reverted to Customer.`,
      });
      setTimeout(() => setPrivilegeMsg(null), 3000);
    }
  };

  const currentUni = universities.find((u) => u.id === universityId) || universities[0];
  const currentSpot = dropSpots.find((s) => s.id === preferredDropSpotId) || dropSpots[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/70">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={recipientPhoto}
                alt={displayName}
                className="h-12 w-12 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-stone-200"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                }}
              />
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white shadow-xs" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <span>{displayName || 'Campus Eater'}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-stone-900 text-white">
                  {userRole === 'admin' ? 'Admin' : userRole === 'owner' ? 'Kitchen Owner' : 'Customer'}
                </span>
              </h2>
              <p className="text-xs text-stone-500 truncate max-w-[240px] sm:max-w-xs">
                {userProfile?.email || currentUser?.email || 'Logged in account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 bg-stone-50/40 px-6 gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Profile & Delivery Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account_type')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'account_type'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Account Role (3 Types)</span>
          </button>

          {isSuper && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`pb-2.5 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'admin'
                  ? 'border-amber-500 text-amber-600'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              <Crown className="h-3.5 w-3.5 text-amber-500" />
              <span>Role Permissions Master</span>
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {savedSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Settings saved! Your WhatsApp and delivery details are permanently updated.</span>
            </div>
          )}

          {/* TAB 1: PROFILE & DELIVERY SETTINGS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Picture of Person Receiving Delivery */}
              <div className="rounded-2xl border border-stone-200 p-4 bg-stone-50/60 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  <img
                    src={recipientPhoto}
                    alt="Delivery Recipient"
                    className="h-24 w-24 rounded-2xl object-cover border-2 border-white shadow-md"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-2xl bg-stone-900/40 text-white opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-[10px] font-bold"
                  >
                    <Camera className="h-5 w-5 mb-0.5" />
                    <span>Change</span>
                  </button>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1.5">
                  <label className="block text-xs font-bold text-stone-900">
                    Picture of the Person Going to Receive Delivery
                  </label>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    Couriers at the campus pickup spot view this photo to immediately recognize you and hand over your meal securely without confusion.
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-50 text-stone-800 text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                    >
                      <Upload className="h-3.5 w-3.5 text-amber-600" />
                      <span>Upload Picture</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRecipientPhoto(
                          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=240&auto=format&fit=crop&q=80'
                        )
                      }
                      className="px-2.5 py-1.5 rounded-xl text-stone-500 hover:text-stone-800 text-[11px] font-medium"
                    >
                      Reset Default
                    </button>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Recipient Full Name
                </label>
                <div className="relative">
                  <User className="h-4 w-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Alex Atukwase"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* WhatsApp Number (One-time ask, used forever) */}
              <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200 space-y-1.5">
                <label className="block text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                  <Phone className="h-4 w-4 text-emerald-600" />
                  <span>WhatsApp Number (Permanent Delivery Contact)</span>
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+256 704 123456"
                  className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-bold text-stone-900"
                />
                <p className="text-[11px] text-emerald-800">
                  💬 Asked once and saved permanently for all future orders. All arrival alerts, timed batch pickup notifications, and collection PINs will be sent here until you change it.
                </p>
              </div>

              {/* University Campus */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <GraduationCap className="h-4 w-4 text-amber-600" />
                  <span>University Campus</span>
                </label>
                <select
                  value={universityId}
                  onChange={(e) => handleUniversityChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                >
                  {universities.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.campus})
                    </option>
                  ))}
                </select>
              </div>

              {/* Residence / Hall / Hostel */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <Home className="h-4 w-4 text-amber-600" />
                  <span>University Residence (Hostel, Hall, or Off-Campus Residence)</span>
                </label>
                <input
                  type="text"
                  required
                  value={residence}
                  onChange={(e) => setResidence(e.target.value)}
                  placeholder="e.g. Lagos Hostel, Room B12 or Katungu Staff Block"
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">
                  Helps match the closest delivery spot to your room or hostel block.
                </span>
              </div>

              {/* Default Designated Pickup Spot */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <span>Preferred Pickup Delivery Spot</span>
                </label>
                <select
                  value={preferredDropSpotId}
                  onChange={(e) => handleSpotChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden bg-white"
                >
                  {availableSpots.map((s) => (
                    <option key={s.id} value={s.id}>
                      [{s.shortCode}] {s.name} — {s.zone}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-[11px] text-stone-500">
                  Current spot instructions: <em>{currentSpot.instructions}</em>
                </div>
              </div>

              {/* Submit Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Save All Settings</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: THREE TYPES OF ACCOUNTS */}
          {activeTab === 'account_type' && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                <span className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="h-4 w-4 text-amber-600" />
                  <span>Strict Role-Based Access Control</span>
                </span>
                Users cannot self-assign Admin or Restaurant Owner roles. Only the designated platform authority (<strong className="text-stone-900">{SUPER_ADMIN_EMAIL}</strong>) possesses the privileges to grant or revoke Admin and Restaurant Owner tags.
              </div>

              {roleErrorNotice && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Privilege Escalation Blocked</span>
                    <span>{roleErrorNotice}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {/* 1. Customer Account */}
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('customer')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                    userRole === 'customer'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-stone-900 flex items-center gap-2">
                        <span>Customer Account</span>
                        {userRole === 'customer' && (
                          <span className="text-[10px] bg-amber-500 text-white px-2 py-0.2 rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">
                        Place timed batch orders, save WhatsApp number once, choose delivery spots, and rate dishes (1 to 5 stars). Available to all university members.
                      </p>
                    </div>
                  </div>
                  {userRole === 'customer' && <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0" />}
                </button>

                {/* 2. Restaurant Owner Account */}
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('owner')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                    !canOwner
                      ? 'border-stone-200 bg-stone-50/80 opacity-75 hover:opacity-100'
                      : userRole === 'owner'
                      ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-400'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      canOwner ? 'bg-orange-500 text-white' : 'bg-stone-200 text-stone-500'
                    }`}>
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-stone-900 flex items-center gap-2">
                        <span>Restaurant Owner Account</span>
                        {userRole === 'owner' && (
                          <span className="text-[10px] bg-orange-500 text-white px-2 py-0.2 rounded-full">
                            Active
                          </span>
                        )}
                        {!canOwner && (
                          <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md flex items-center gap-1 font-normal">
                            <Lock className="h-2.5 w-2.5" />
                            <span>Privilege Required</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">
                        Upload and update pictures of the restaurant place (cover banner & logo), manage live menu, and oversee restaurant batch orders.
                      </p>
                      {!canOwner && (
                        <span className="text-[10px] text-amber-700 font-medium block mt-1.5">
                          🔒 Cannot be activated without authorization granted by {SUPER_ADMIN_EMAIL}.
                        </span>
                      )}
                    </div>
                  </div>
                  {userRole === 'owner' ? (
                    <CheckCircle2 className="h-5 w-5 text-orange-600 shrink-0" />
                  ) : !canOwner ? (
                    <Lock className="h-4 w-4 text-stone-400 shrink-0 mt-1" />
                  ) : null}
                </button>

                {/* 3. Admin Account */}
                <button
                  type="button"
                  onClick={() => handleRoleSwitch('admin')}
                  className={`p-4 rounded-2xl border text-left transition flex items-start justify-between ${
                    !canAdmin
                      ? 'border-stone-200 bg-stone-50/80 opacity-75 hover:opacity-100'
                      : userRole === 'admin'
                      ? 'border-stone-900 bg-stone-100/80 ring-2 ring-stone-900'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      canAdmin ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-500'
                    }`}>
                      <Shield className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-stone-900 flex items-center gap-2">
                        <span>Application Admin Account</span>
                        {userRole === 'admin' && (
                          <span className="text-[10px] bg-stone-900 text-white px-2 py-0.2 rounded-full">
                            Active
                          </span>
                        )}
                        {!canAdmin && (
                          <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md flex items-center gap-1 font-normal">
                            <Lock className="h-2.5 w-2.5" />
                            <span>Privilege Required</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-1">
                        Full administrative access to manage delivery spots, audit orders, view platform-wide analytics, and oversee campus operations.
                      </p>
                      {!canAdmin && (
                        <span className="text-[10px] text-amber-700 font-medium block mt-1.5">
                          🔒 Cannot be activated without authorization granted by {SUPER_ADMIN_EMAIL}.
                        </span>
                      )}
                    </div>
                  </div>
                  {userRole === 'admin' ? (
                    <CheckCircle2 className="h-5 w-5 text-stone-900 shrink-0" />
                  ) : !canAdmin ? (
                    <Lock className="h-4 w-4 text-stone-400 shrink-0 mt-1" />
                  ) : null}
                </button>
              </div>

              {userRole === 'admin' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAdminSpots?.();
                    }}
                    className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-bold text-xs hover:bg-stone-800 transition flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MapPin className="h-4 w-4 text-amber-400" />
                    <span>Open Delivery Spots Picture & Admin Manager</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SUPER ADMIN ROLE PERMISSIONS MASTER (EXCLUSIVELY OKIRIAE2004@GMAIL.COM) */}
          {activeTab === 'admin' && isSuper && (
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
                <Crown className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-stone-900">Master Privilege Authority</span>
                  <span className="text-stone-600 text-[11px] leading-relaxed block mt-0.5">
                    As <strong className="text-stone-900">{SUPER_ADMIN_EMAIL}</strong>, you hold exclusive authority to designate Admin and Restaurant Owner privileges. No other account can elevate their role or distribute roles.
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 p-4 bg-stone-50/60">
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-amber-600" />
                  <span>Grant Role Tag to User</span>
                </h3>

                <form onSubmit={handleGrantPrivilegeSubmit} className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      User Email Address
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="user@kiu.ac.ug or chef@gmail.com"
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Privilege Tag
                      </label>
                      <select
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value as 'admin' | 'owner')}
                        className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      >
                        <option value="owner">Restaurant Owner</option>
                        <option value="admin">Platform Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Restaurant Name (for Owners)
                      </label>
                      <input
                        type="text"
                        disabled={targetRole !== 'owner'}
                        placeholder={targetRole === 'owner' ? "e.g. Mama Africa Kitchen" : "N/A for Admin"}
                        value={targetRestaurantName}
                        onChange={(e) => setTargetRestaurantName(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white disabled:bg-stone-100 disabled:text-stone-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-400" />
                    <span>Authorize & Grant Privilege Tag</span>
                  </button>
                </form>

                {privilegeMsg && (
                  <div
                    className={`mt-2.5 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      privilegeMsg.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {privilegeMsg.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                    )}
                    <span>{privilegeMsg.text}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-stone-700 mb-2 flex items-center justify-between">
                  <span>Authorized Role Directory ({roleAssignments.length + 1})</span>
                  <span className="text-[10px] text-stone-400 font-normal">Super Admin + Delegated</span>
                </h4>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {/* Super Admin Row */}
                  <div className="px-3 py-2.5 rounded-xl border border-amber-300 bg-amber-50/60 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-4 w-4 text-amber-600" />
                      <div>
                        <span className="font-mono font-bold text-stone-900 block">{SUPER_ADMIN_EMAIL}</span>
                        <span className="text-[10px] text-stone-500">Platform Sovereign • Root Super Admin</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                      Super Admin
                    </span>
                  </div>

                  {/* Delegated Role Assignments */}
                  {roleAssignments.map((assignment) => (
                    <div
                      key={assignment.email}
                      className="px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-xs flex items-center justify-between hover:border-stone-300 transition"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-stone-800 font-semibold">{assignment.email}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              assignment.role === 'admin'
                                ? 'bg-stone-900 text-white'
                                : 'bg-orange-100 text-orange-800 border border-orange-200'
                            }`}
                          >
                            {assignment.role === 'admin' ? 'Platform Admin' : 'Restaurant Owner'}
                          </span>
                        </div>
                        {assignment.restaurantName && (
                          <span className="text-[10px] text-stone-500 block mt-0.5">
                            Venue: <em>{assignment.restaurantName}</em>
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRevokePrivilegeSubmit(assignment.email)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Revoke privilege"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdminSpots?.();
                  }}
                  className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs"
                >
                  <MapPin className="h-4 w-4 text-amber-400" />
                  <span>Open Campus Delivery Spots Manager</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Sign Out */}
        <div className="px-6 py-3 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            {isDemoUser ? 'Active Session • Demo Mode' : 'Firebase Verified Session'}
          </span>
          <button
            type="button"
            onClick={async () => {
              onClose();
              await logout();
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
