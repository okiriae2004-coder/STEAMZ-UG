import React, { useState, useEffect, useCallback } from 'react';
import {
  KeyRound,
  Users,
  Copy,
  Check,
  RefreshCw,
  Search,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Send,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { normalizePhoneDigits, formatUgPhoneDisplay, UserProfile } from '../../context/AuthContext';
import { PhoneAccount } from '../../types';

interface MemberPinRecord {
  uid: string;
  email: string;
  displayName: string;
  phone: string;
  phoneDigits: string;
  pin: string;
  isExistingPin: boolean;
  docId: string;
  createdAt?: string;
  updatedAt?: string;
}

export const MemberPinManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<MemberPinRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'need_pin' | 'has_pin'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [customPinInput, setCustomPinInput] = useState<{ [key: string]: string }>({});
  const [customPhoneInput, setCustomPhoneInput] = useState<{ [key: string]: string }>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Generate a random secure 4-digit PIN (e.g. "4829")
  const generateRandom4DigitPin = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Load all registered users & phone accounts from Firestore
  const loadAllMembers = useCallback(async () => {
    setLoading(true);
    setStatusMsg(null);

    try {
      // 1. Fetch all documents from phoneAccounts
      const phoneAccountsMap = new Map<string, PhoneAccount>();
      try {
        const phoneSnap = await getDocs(collection(db, 'phoneAccounts'));
        phoneSnap.forEach((docSnap) => {
          const data = docSnap.data() as PhoneAccount;
          if (data) {
            // Index by docId, phoneDigits, and email
            if (data.docId) phoneAccountsMap.set(data.docId, data);
            if (data.phoneDigits) phoneAccountsMap.set(`phone_${data.phoneDigits}`, data);
            if (data.email) phoneAccountsMap.set(`email_${data.email.toLowerCase()}`, data);
            if (data.uid) phoneAccountsMap.set(`uid_${data.uid}`, data);
          }
        });
      } catch (err) {
        console.warn('Could not read phoneAccounts collection:', err);
      }

      // 2. Fetch all documents from users collection (where Google & email signups live)
      const usersList: UserProfile[] = [];
      const seenEmails = new Set<string>();
      const seenUids = new Set<string>();

      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        usersSnap.forEach((docSnap) => {
          const u = docSnap.data() as UserProfile;
          if (u && (u.email || u.uid)) {
            const uid = u.uid || docSnap.id;
            if (!seenUids.has(uid)) {
              seenUids.add(uid);
              if (u.email) seenEmails.add(u.email.toLowerCase());
              usersList.push({
                ...u,
                uid,
              });
            }
          }
        });
      } catch (err) {
        console.warn('Could not read users collection:', err);
      }

      // 3. Merge: Build the list of MemberPinRecord
      const combinedRecords: MemberPinRecord[] = [];
      const processedEmailsOrPhones = new Set<string>();

      // A) Process all registered users
      for (const u of usersList) {
        const emailLower = (u.email || '').trim().toLowerCase();
        const rawPhone = u.whatsapp || (u as any).phone || '';
        const phoneDigits = normalizePhoneDigits(rawPhone);

        // Find existing phoneAccount
        let matchedAccount: PhoneAccount | undefined = undefined;
        if (emailLower && phoneAccountsMap.has(`email_${emailLower}`)) {
          matchedAccount = phoneAccountsMap.get(`email_${emailLower}`);
        } else if (u.uid && phoneAccountsMap.has(`uid_${u.uid}`)) {
          matchedAccount = phoneAccountsMap.get(`uid_${u.uid}`);
        } else if (phoneDigits && phoneAccountsMap.has(`phone_${phoneDigits}`)) {
          matchedAccount = phoneAccountsMap.get(`phone_${phoneDigits}`);
        }

        const identifierKey = emailLower || phoneDigits || u.uid;
        if (processedEmailsOrPhones.has(identifierKey)) continue;
        processedEmailsOrPhones.add(identifierKey);

        const hasExisting = Boolean(matchedAccount?.pin);
        const pin = hasExisting
          ? String(matchedAccount!.pin)
          : generateRandom4DigitPin();

        // Effective phone
        const finalPhone =
          matchedAccount?.phone ||
          formatUgPhoneDisplay(rawPhone) ||
          rawPhone ||
          '';

        const finalPhoneDigits =
          matchedAccount?.phoneDigits ||
          phoneDigits ||
          (rawPhone ? normalizePhoneDigits(rawPhone) : '');

        const docId = finalPhoneDigits
          ? `phone_${finalPhoneDigits}`
          : `email_${emailLower.replace(/[^a-zA-Z0-9]/g, '_')}`;

        combinedRecords.push({
          uid: u.uid || matchedAccount?.uid || `user-${Date.now()}`,
          email: u.email || matchedAccount?.email || '',
          displayName: u.displayName || matchedAccount?.displayName || 'STEAMZ Member',
          phone: finalPhone,
          phoneDigits: finalPhoneDigits,
          pin,
          isExistingPin: hasExisting,
          docId,
          createdAt: u.createdAt || matchedAccount?.createdAt,
          updatedAt: matchedAccount?.updatedAt,
        });
      }

      // B) Also process any phoneAccounts that weren't in the users collection
      phoneAccountsMap.forEach((acc) => {
        const emailLower = (acc.email || '').trim().toLowerCase();
        const phoneDigits = acc.phoneDigits || normalizePhoneDigits(acc.phone);
        const identifierKey = emailLower || phoneDigits || acc.uid;

        if (!processedEmailsOrPhones.has(identifierKey)) {
          processedEmailsOrPhones.add(identifierKey);
          combinedRecords.push({
            uid: acc.uid || `user-phone-${phoneDigits}`,
            email: acc.email || '',
            displayName: acc.displayName || `Student (${phoneDigits.slice(-4)})`,
            phone: acc.phone || formatUgPhoneDisplay(phoneDigits),
            phoneDigits: phoneDigits,
            pin: acc.pin,
            isExistingPin: true,
            docId: acc.docId || `phone_${phoneDigits}`,
            createdAt: acc.createdAt,
            updatedAt: acc.updatedAt,
          });
        }
      });

      setRecords(combinedRecords);
    } catch (err: any) {
      console.error('Error in loadAllMembers:', err);
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to load member records. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllMembers();
  }, [loadAllMembers]);

  // Save / assign a 4-digit PIN to a member
  const handleSavePin = async (record: MemberPinRecord) => {
    const pinToSave = (customPinInput[record.uid] || record.pin || '').trim();
    const phoneInput = (customPhoneInput[record.uid] !== undefined
      ? customPhoneInput[record.uid]
      : record.phone
    ).trim();

    if (!pinToSave || pinToSave.length < 4) {
      setStatusMsg({
        type: 'error',
        text: 'PIN must be at least 4 digits.',
      });
      return;
    }

    setSavingKey(record.uid);
    setStatusMsg(null);

    try {
      const cleanPhoneDigits = normalizePhoneDigits(phoneInput);
      const emailLower = record.email.trim().toLowerCase();

      // We need at least phone digits or email
      if (!cleanPhoneDigits && !emailLower) {
        throw new Error('Please enter a WhatsApp phone number or email address for this member.');
      }

      const displayPhone = cleanPhoneDigits
        ? formatUgPhoneDisplay(cleanPhoneDigits)
        : phoneInput;

      // Primary docId: phone_{digits} if phone exists, else email_{clean}
      const primaryDocId = cleanPhoneDigits
        ? `phone_${cleanPhoneDigits}`
        : `email_${emailLower.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const phoneAccountPayload: PhoneAccount = {
        docId: primaryDocId,
        phone: displayPhone,
        phoneDigits: cleanPhoneDigits,
        pin: pinToSave,
        displayName: record.displayName || 'STEAMZ Member',
        uid: record.uid,
        email: emailLower || `phone_${cleanPhoneDigits}@steamz.ug`,
        role: 'customer',
        universityId: 'kiu-western',
        universityName: 'Kampala International University (KIU Western)',
        preferredDropSpotId: 'spot-kiu-eng',
        createdAt: record.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Save to phoneAccounts collection under primaryDocId
      await setDoc(doc(db, 'phoneAccounts', primaryDocId), phoneAccountPayload, { merge: true });

      // 2. Also save an email doc if email exists so they can log in via email or phone!
      if (emailLower) {
        const emailDocId = `email_${emailLower.replace(/[^a-zA-Z0-9]/g, '_')}`;
        await setDoc(doc(db, 'phoneAccounts', emailDocId), phoneAccountPayload, { merge: true });
      }

      // 3. Update the user's profile in the users collection
      if (record.uid) {
        await setDoc(
          doc(db, 'users', record.uid),
          {
            phone: displayPhone,
            whatsapp: displayPhone,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      // 4. Update local state
      setRecords((prev) =>
        prev.map((r) =>
          r.uid === record.uid
            ? {
                ...r,
                pin: pinToSave,
                phone: displayPhone,
                phoneDigits: cleanPhoneDigits,
                isExistingPin: true,
                docId: primaryDocId,
              }
            : r
        )
      );

      setStatusMsg({
        type: 'success',
        text: `PIN ${pinToSave} successfully assigned to ${record.displayName || record.email}! They can now log in using ${displayPhone || record.email}.`,
      });
    } catch (err: any) {
      console.error('Error saving PIN:', err);
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Failed to assign PIN. Check network and permissions.',
      });
    } finally {
      setSavingKey(null);
    }
  };

  // Generate & assign 4-digit PINs for all members without PINs in bulk
  const handleBulkAssignPins = async () => {
    const unassigned = records.filter((r) => !r.isExistingPin);
    if (unassigned.length === 0) {
      setStatusMsg({
        type: 'success',
        text: 'All members already have active PINs assigned!',
      });
      return;
    }

    setLoading(true);
    setStatusMsg(null);
    let successCount = 0;

    try {
      for (const record of unassigned) {
        const pinToSave = record.pin || generateRandom4DigitPin();
        const emailLower = record.email.trim().toLowerCase();
        const phoneDigits = record.phoneDigits || normalizePhoneDigits(record.phone);
        const displayPhone = phoneDigits ? formatUgPhoneDisplay(phoneDigits) : record.phone;

        const primaryDocId = phoneDigits
          ? `phone_${phoneDigits}`
          : `email_${emailLower.replace(/[^a-zA-Z0-9]/g, '_')}`;

        const payload: PhoneAccount = {
          docId: primaryDocId,
          phone: displayPhone,
          phoneDigits: phoneDigits,
          pin: pinToSave,
          displayName: record.displayName || 'STEAMZ Member',
          uid: record.uid,
          email: emailLower || `phone_${phoneDigits}@steamz.ug`,
          role: 'customer',
          universityId: 'kiu-western',
          universityName: 'Kampala International University (KIU Western)',
          preferredDropSpotId: 'spot-kiu-eng',
          createdAt: record.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Save to phoneAccounts
        await setDoc(doc(db, 'phoneAccounts', primaryDocId), payload, { merge: true });

        if (emailLower) {
          const emailDocId = `email_${emailLower.replace(/[^a-zA-Z0-9]/g, '_')}`;
          await setDoc(doc(db, 'phoneAccounts', emailDocId), payload, { merge: true });
        }

        successCount++;
      }

      await loadAllMembers();
      setStatusMsg({
        type: 'success',
        text: `Successfully generated and saved active 4-digit PINs for ${successCount} members!`,
      });
    } catch (err: any) {
      console.error('Bulk generation error:', err);
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Error during bulk PIN generation.',
      });
    } finally {
      setLoading(false);
    }
  };

  // WhatsApp share template for a user
  const generateWhatsAppShareLink = (record: MemberPinRecord): string => {
    const pin = record.pin;
    const identifier = record.phone || record.email;
    const text = encodeURIComponent(
      `Hello ${record.displayName}! 👋\n\nYour STEAMZ Food account has been updated with instant PIN sign-in. You can now access your account anytime:\n\n📱 Login ID: ${identifier}\n🔑 Your Secret PIN: ${pin}\n\n👉 Open STEAMZ to order your hot meals: ${window.location.origin}`
    );
    // If we have a phone number, format for direct wa.me link
    if (record.phoneDigits) {
      return `https://wa.me/${record.phoneDigits}?text=${text}`;
    }
    return `https://wa.me/?text=${text}`;
  };

  // Filter records
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.pin.includes(searchTerm);

    if (!matchesSearch) return false;

    if (filterType === 'need_pin') return !r.isExistingPin;
    if (filterType === 'has_pin') return r.isExistingPin;
    return true;
  });

  const unassignedCount = records.filter((r) => !r.isExistingPin).length;
  const assignedCount = records.filter((r) => r.isExistingPin).length;

  return (
    <div className="rounded-3xl bg-white p-6 border border-stone-200 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500 text-white">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <span>Existing Member 4-Digit PIN Generator</span>
                <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md">
                  Google & Phone Migration
                </span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Generate and send secret 4-digit PINs to members who signed up with Google so they can sign in anytime via WhatsApp or Email.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadAllMembers()}
            disabled={loading}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 flex items-center gap-1.5 transition cursor-pointer"
            title="Refresh member records from Cloud Firestore"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
            <span>Refresh</span>
          </button>

          {unassignedCount > 0 && (
            <button
              onClick={handleBulkAssignPins}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Bulk Generate ({unassignedCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Status banner */}
      {statusMsg && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Stats Summary Pills */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-center">
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
            Total Members
          </span>
          <span className="text-xl font-black text-stone-900 font-mono mt-0.5 block">
            {records.length}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Active PINs Assigned
          </span>
          <span className="text-xl font-black text-emerald-800 font-mono mt-0.5 block">
            {assignedCount}
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-center">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            Need PIN Generation
          </span>
          <span className="text-xl font-black text-amber-900 font-mono mt-0.5 block">
            {unassignedCount}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search member name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              filterType === 'all'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            All ({records.length})
          </button>
          <button
            onClick={() => setFilterType('need_pin')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              filterType === 'need_pin'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Pending ({unassignedCount})
          </button>
          <button
            onClick={() => setFilterType('has_pin')}
            className={`px-3 py-1 rounded-lg font-bold transition ${
              filterType === 'has_pin'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Ready ({assignedCount})
          </button>
        </div>
      </div>

      {/* Member Records Table */}
      <div className="border border-stone-200 rounded-2xl overflow-hidden">
        {loading && records.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 space-y-2">
            <RefreshCw className="h-6 w-6 text-amber-500 animate-spin mx-auto" />
            <p>Scanning Cloud Firestore member accounts...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500">
            <Users className="h-8 w-8 text-stone-300 mx-auto mb-2" />
            <p className="font-bold text-stone-700">No member accounts matched your filter.</p>
            <p className="text-[11px] text-stone-400 mt-1">Try clearing your search or clicking Refresh.</p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
            {filteredRecords.map((record) => {
              const currentPin = customPinInput[record.uid] ?? record.pin;
              const currentPhone = customPhoneInput[record.uid] ?? record.phone;
              const isSaving = savingKey === record.uid;

              return (
                <div
                  key={record.uid}
                  className="p-3.5 hover:bg-stone-50/80 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                >
                  {/* Member info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-900 truncate">
                        {record.displayName}
                      </span>
                      {record.isExistingPin ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          PIN Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          Needs PIN
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                      {record.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-stone-400" />
                          <span className="font-mono text-stone-600">{record.email}</span>
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-stone-400" />
                        <input
                          type="text"
                          placeholder="WhatsApp number (e.g. 0771234567)"
                          value={currentPhone}
                          onChange={(e) =>
                            setCustomPhoneInput((prev) => ({
                              ...prev,
                              [record.uid]: e.target.value,
                            }))
                          }
                          className="px-2 py-0.5 text-[11px] font-mono bg-white border border-stone-200 rounded-lg w-44 focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PIN Display & Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    {/* PIN input field */}
                    <div className="flex items-center gap-1 bg-amber-50/70 border border-amber-200 rounded-xl px-2 py-1">
                      <KeyRound className="h-3.5 w-3.5 text-amber-600" />
                      <input
                        type="text"
                        maxLength={6}
                        inputMode="numeric"
                        value={currentPin}
                        onChange={(e) =>
                          setCustomPinInput((prev) => ({
                            ...prev,
                            [record.uid]: e.target.value.replace(/[^\d]/g, ''),
                          }))
                        }
                        className="w-16 bg-transparent text-center font-mono font-black text-amber-900 text-xs focus:outline-hidden"
                        title="Click to change or customize this member's 4-digit PIN"
                      />
                    </div>

                    {/* Copy Credentials Button */}
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          `Login ID: ${record.phone || record.email}\nPIN: ${currentPin}`,
                          record.uid
                        )
                      }
                      className="p-2 rounded-xl border border-stone-200 hover:bg-white text-stone-600 transition cursor-pointer"
                      title="Copy Login & PIN to clipboard"
                    >
                      {copiedKey === record.uid ? (
                        <Check className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-stone-500" />
                      )}
                    </button>

                    {/* WhatsApp Send Button */}
                    <a
                      href={generateWhatsAppShareLink(record)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 transition"
                      title="Send credentials directly via WhatsApp"
                    >
                      <Send className="h-3 w-3" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Save / Update PIN Button */}
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSavePin(record)}
                      className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shadow-xs"
                    >
                      {isSaving ? (
                        <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                      ) : (
                        <Check className="h-3 w-3 text-amber-400" />
                      )}
                      <span>{record.isExistingPin ? 'Update PIN' : 'Assign PIN'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Helpful Instructions Footnote */}
      <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 text-xs space-y-1.5 text-amber-950">
        <span className="font-bold flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-amber-700" />
          <span>How Your Google Members Can Access Their Accounts Now:</span>
        </span>
        <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-900 leading-relaxed">
          <li>
            Click <strong>&quot;Bulk Generate&quot;</strong> or enter a 4-digit PIN for any member in the table above, then click <strong>Assign PIN</strong>.
          </li>
          <li>
            Click <strong>WhatsApp</strong> next to the member to instantly send their Login ID and secret 4-digit PIN directly to their WhatsApp chat!
          </li>
          <li>
            The member simply opens STEAMZ, taps <strong>Sign In</strong>, enters their phone or email, types the 4-digit PIN, and they are instantly logged into their account.
          </li>
        </ol>
      </div>
    </div>
  );
};
