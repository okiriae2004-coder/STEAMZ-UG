import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { DropSpot, SUPER_ADMIN_EMAIL } from '../../types';
import {
  Shield,
  MapPin,
  Upload,
  Plus,
  CheckCircle2,
  Camera,
  Image,
  UserCheck,
  Building,
  Sparkles,
  ArrowLeft,
  X,
  Edit2,
  Save,
  Crown,
  Lock,
  Trash2,
  AlertCircle,
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToCustomer?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToCustomer }) => {
  const {
    dropSpots,
    updateDropSpotImage,
    updateDropSpot,
    roleAssignments,
    grantPrivilege,
    revokePrivilege,
    isSuperAdmin,
    admins,
    universities,
    setUserRole,
  } = useApp();

  const { currentUser, userProfile } = useAuth();
  const activeEmail = currentUser?.email || userProfile?.email;
  const isSuper = isSuperAdmin(activeEmail);

  const [selectedSpot, setSelectedSpot] = useState<DropSpot | null>(null);
  const [editingImageSpotId, setEditingImageSpotId] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  
  // Super Admin privilege assignment states
  const [targetEmail, setTargetEmail] = useState('');
  const [targetRole, setTargetRole] = useState<'admin' | 'owner'>('owner');
  const [targetRestaurantName, setTargetRestaurantName] = useState('');
  const [privilegeMsg, setPrivilegeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [spotSuccessMsg, setSpotSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSpotFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    spotId: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        updateDropSpotImage(spotId, reader.result);
        setSpotSuccessMsg(`Updated image for delivery spot!`);
        setTimeout(() => setSpotSuccessMsg(null), 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSpotUrl = (spotId: string) => {
    if (!newImageUrl.trim()) return;
    updateDropSpotImage(spotId, newImageUrl.trim());
    setEditingImageSpotId(null);
    setNewImageUrl('');
    setSpotSuccessMsg(`Updated image for delivery spot!`);
    setTimeout(() => setSpotSuccessMsg(null), 2500);
  };

  const handleGrantPrivilege = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuper) {
      setPrivilegeMsg({
        type: 'error',
        text: `Unauthorized: Only ${SUPER_ADMIN_EMAIL} has the privileges to grant roles.`,
      });
      return;
    }

    if (!targetEmail.trim()) return;
    const res = await grantPrivilege(
      targetEmail.trim(),
      targetRole,
      targetRole === 'owner' ? targetRestaurantName.trim() || undefined : undefined
    );

    if (!res.success) {
      setPrivilegeMsg({ type: 'error', text: res.error || 'Failed to grant privilege' });
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

  const handleRevokePrivilege = async (email: string) => {
    if (!isSuper) return;
    const res = await revokePrivilege(email);
    if (!res.success) {
      setPrivilegeMsg({ type: 'error', text: res.error || 'Failed to revoke privilege' });
    } else {
      setPrivilegeMsg({
        type: 'success',
        text: `Privileges revoked for ${email}.`,
      });
      setTimeout(() => setPrivilegeMsg(null), 3000);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Admin Top Banner */}
      <div className="rounded-3xl bg-stone-900 text-white p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-stone-900 flex items-center justify-center font-black shadow-md">
              <Shield className="h-6 w-6 fill-stone-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">
                  STEAMZ Administrator Control Hub
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-400 text-stone-900">
                  Master Admin
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1">
                Upload & change pictures of campus delivery spots • Manage authorized administrators
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setUserRole('customer');
                onBackToCustomer?.();
              }}
              className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Customer View</span>
            </button>
          </div>
        </div>
      </div>

      {/* Privilege & Role Management Section */}
      <div className="rounded-3xl bg-white p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-amber-600" />
              <span>Platform Role & Authority Management</span>
            </h2>
            <p className="text-xs text-stone-500">
              {isSuper
                ? `Exclusive Master Control: As ${SUPER_ADMIN_EMAIL}, you have exclusive privileges to grant Admin and Restaurant Owner tags.`
                : `Role tags are exclusively granted by ${SUPER_ADMIN_EMAIL}. Delegated administrators can manage spot pictures and dispatch.`}
            </p>
          </div>
          {isSuper ? (
            <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 flex items-center gap-1">
              <Crown className="h-3.5 w-3.5 text-amber-600" />
              <span>Super Admin Master</span>
            </span>
          ) : (
            <span className="text-[11px] font-bold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-xl flex items-center gap-1">
              <Lock className="h-3 w-3 text-stone-500" />
              <span>Delegated Admin (Read-Only)</span>
            </span>
          )}
        </div>

        {isSuper ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5 text-amber-600" />
                <span>Grant Admin or Restaurant Owner Tag</span>
              </label>

              <form onSubmit={handleGrantPrivilege} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="user@kiu.ac.ug or chef@gmail.com"
                  value={targetEmail}
                  onChange={(e) => setTargetEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
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
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Restaurant Name (if Owner)
                    </label>
                    <input
                      type="text"
                      disabled={targetRole !== 'owner'}
                      placeholder={targetRole === 'owner' ? "e.g. Mama Africa Kitchen" : "N/A"}
                      value={targetRestaurantName}
                      onChange={(e) => setTargetRestaurantName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl bg-white disabled:bg-stone-100 disabled:text-stone-400 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
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
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                <span>Active Authorized Directory ({roleAssignments.length + 1})</span>
                <span className="text-[10px] text-stone-400 font-normal">Super Admin + Delegated</span>
              </label>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {/* Super Admin */}
                <div className="px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/70 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-3.5 w-3.5 text-amber-600" />
                    <div>
                      <span className="font-mono font-bold text-stone-900 block">{SUPER_ADMIN_EMAIL}</span>
                      <span className="text-[10px] text-stone-500">Root Super Admin</span>
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
                    className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-stone-800 font-semibold">{assignment.email}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            assignment.role === 'admin'
                              ? 'bg-stone-900 text-white'
                              : 'bg-orange-100 text-orange-800 border border-orange-200'
                          }`}
                        >
                          {assignment.role === 'admin' ? 'Admin' : 'Owner'}
                        </span>
                      </div>
                      {assignment.restaurantName && (
                        <span className="text-[10px] text-stone-400 block">{assignment.restaurantName}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevokePrivilege(assignment.email)}
                      className="p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Revoke privilege"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-3">
            <div className="flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-stone-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-stone-800 block">Privilege Assignment Restraint Active</span>
                <span className="text-stone-600 leading-relaxed block mt-0.5">
                  Only <strong>{SUPER_ADMIN_EMAIL}</strong> has the authority to issue the Admin and Restaurant Owner tag to any user. No other account may distribute or modify user role tags.
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-200">
              <span className="text-[11px] font-bold text-stone-700 block mb-1">
                Active System Administrators ({admins.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {admins.map((email) => (
                  <span
                    key={email}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono ${
                      email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
                        ? 'bg-amber-100 text-amber-900 font-bold border border-amber-200'
                        : 'bg-white border border-stone-200 text-stone-700'
                    }`}
                  >
                    {email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && (
                      <Crown className="h-3 w-3 text-amber-600" />
                    )}
                    <span>{email}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delivery Spots Picture & Details Manager */}
      <div className="rounded-3xl bg-white p-6 border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-amber-600" />
              <span>Campus Delivery Spots & Photos</span>
            </h2>
            <p className="text-xs text-stone-500">
              Admins can change or upload pictures of each delivery spot so students and couriers recognize them easily.
            </p>
          </div>
          {spotSuccessMsg && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>{spotSuccessMsg}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dropSpots.map((spot) => (
            <div
              key={spot.id}
              className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50/50 flex flex-col hover:border-amber-400 transition shadow-2xs"
            >
              {/* Spot Image with Admin Overlay */}
              <div className="relative h-44 w-full bg-stone-200 overflow-hidden group">
                <img
                  src={spot.image}
                  alt={spot.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-stone-900/80 text-white text-[11px] font-black backdrop-blur-xs font-mono">
                  {spot.shortCode}
                </div>
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[10px] font-extrabold shadow-xs">
                  {spot.zone}
                </div>

                {/* Hover / Direct Upload Controls */}
                <div className="absolute inset-0 bg-stone-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-3">
                  <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-white text-stone-900 text-xs font-bold hover:bg-amber-500 hover:text-white transition flex items-center gap-1.5 shadow-md">
                    <Camera className="h-3.5 w-3.5" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSpotFileUpload(e, spot.id)}
                      className="hidden"
                    />
                  </label>
                  <button
                    onClick={() => {
                      setEditingImageSpotId(spot.id);
                      setNewImageUrl(spot.image);
                    }}
                    className="px-3 py-1 rounded-lg bg-stone-800/80 text-white text-[11px] font-semibold hover:bg-stone-800 transition"
                  >
                    Paste Image URL
                  </button>
                </div>
              </div>

              {/* Spot Body Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">{spot.name}</h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">{spot.instructions}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-200/80 flex items-center justify-between">
                  <label className="cursor-pointer text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Change Picture</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleSpotFileUpload(e, spot.id)}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] text-stone-400 font-medium">
                    {spot.isCampusCompound ? 'Inside Campus' : 'Off-Campus Hub'}
                  </span>
                </div>

                {/* Image URL editing popup within card */}
                {editingImageSpotId === spot.id && (
                  <div className="mt-3 p-2.5 rounded-xl bg-white border border-amber-300 shadow-sm space-y-2 animate-in fade-in">
                    <label className="block text-[10px] font-bold text-stone-700">
                      Enter Image URL for {spot.name}:
                    </label>
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-2 py-1 text-xs border border-stone-200 rounded-lg"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingImageSpotId(null)}
                        className="px-2 py-1 text-[11px] text-stone-500 hover:text-stone-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSaveSpotUrl(spot.id)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
