import React from 'react';
import { useApp } from '../../context/AppContext';
import { DropSpot } from '../../types';
import {
  MapPin,
  X,
  Check,
  ShieldCheck,
  Thermometer,
  GraduationCap,
  Building,
  Navigation,
} from 'lucide-react';

interface SpotSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (spot: DropSpot) => void;
}

export const SpotSelectorModal: React.FC<SpotSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const {
    universities,
    selectedUniversityId,
    setSelectedUniversityId,
    dropSpots,
    selectedDropSpotId,
    setSelectedDropSpotId,
  } = useApp();

  if (!isOpen) return null;

  const currentUniversity =
    universities.find((u) => u.id === selectedUniversityId) || universities[0];

  // Filter spots by university
  const universitySpots = dropSpots.filter(
    (s) => s.universityId === (selectedUniversityId || 'kiu-western')
  );

  const campusCompoundSpots = universitySpots.filter((s) => s.isCampusCompound);
  const outsideCampusSpots = universitySpots.filter((s) => !s.isCampusCompound);

  const handleSelectSpot = (spot: DropSpot) => {
    setSelectedDropSpotId(spot.id);
    if (onSelect) onSelect(spot);
    onClose();
  };

  const renderSpotCard = (spot: DropSpot) => {
    const isSelected = selectedDropSpotId === spot.id;
    return (
      <div
        key={spot.id}
        onClick={() => handleSelectSpot(spot)}
        className={`group cursor-pointer rounded-2xl border p-3.5 sm:p-4 transition-all duration-200 ${
          isSelected
            ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-400 shadow-sm'
            : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <img
            src={spot.image}
            alt={spot.name}
            className="h-20 w-full sm:w-28 rounded-xl object-cover shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-stone-900 text-white">
                {spot.shortCode}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                {spot.zone}
              </span>
              {spot.isCampusCompound ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  <Building className="h-3 w-3" /> Campus Compound
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                  <Navigation className="h-3 w-3" /> Outside Campus
                </span>
              )}
              {spot.hasHeatedLocker && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  <Thermometer className="h-3 w-3" /> Heated Pods
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-stone-900 mt-1.5 group-hover:text-amber-700 transition">
              {spot.name}
            </h4>

            <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-stone-400 shrink-0" />
              {spot.address}
            </p>

            <p className="text-xs text-stone-600 mt-1.5 bg-stone-100/90 p-2 rounded-lg border border-stone-200/60 leading-relaxed">
              💡 <strong>Pickup:</strong> {spot.instructions}
            </p>
          </div>

          <div className="self-end sm:self-center shrink-0">
            <div
              className={`h-7 w-7 rounded-full flex items-center justify-center border transition ${
                isSelected
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-stone-300 group-hover:border-amber-400'
              }`}
            >
              {isSelected && <Check className="h-4 w-4 stroke-[3]" />}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white p-5 sm:p-6 shadow-2xl border border-stone-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm shrink-0">
              <MapPin className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                Designated Campus Drop Spots
              </h3>
              <p className="text-xs text-stone-500">
                Batch lockers with temperature control & SMS/WhatsApp PIN access
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

        {/* University Selector Bar */}
        <div className="py-3 shrink-0 bg-stone-50/80 px-3 rounded-2xl border border-stone-200/80 mt-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <GraduationCap className="h-4 w-4 text-amber-600" />
              <span>Current University Campus:</span>
            </label>
            <select
              value={selectedUniversityId}
              onChange={(e) => setSelectedUniversityId(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-stone-300 bg-white text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            >
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.name} ({uni.town})
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            📍 Showing designated pickup lockers & spots for{' '}
            <strong className="text-stone-800">{currentUniversity.name}</strong>
          </p>
        </div>

        {/* Scrollable Spots List */}
        <div className="flex-1 overflow-y-auto pr-1 mt-3 space-y-4">
          {/* Inside Campus Compound */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-700">
                Inside Campus Compound ({campusCompoundSpots.length} Spots)
              </h4>
            </div>
            <div className="space-y-2.5">
              {campusCompoundSpots.map(renderSpotCard)}
            </div>
          </div>

          {/* Outside Campus Spots */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-2 w-2 rounded-full bg-sky-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-700">
                Outside Campus Spots ({outsideCampusSpots.length} Spots)
              </h4>
            </div>
            <div className="space-y-2.5">
              {outsideCampusSpots.map(renderSpotCard)}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">
              Instant locker alerts & PIN sent to your WhatsApp on arrival.
            </span>
            <span className="sm:hidden">
              PIN sent to your WhatsApp.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition shadow-xs text-xs"
          >
            Confirm & Close
          </button>
        </div>
      </div>
    </div>
  );
};
