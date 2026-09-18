import React from 'react';
import { useApp } from '../../context/AppContext';
import { DropSpot } from '../../types';
import { MapPin, X } from 'lucide-react';

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
    dropSpots,
    selectedDropSpotId,
    setSelectedDropSpotId,
  } = useApp();

  if (!isOpen) return null;

  const currentUniversity =
    universities.find((u) => u.id === selectedUniversityId) || universities[0];

  // Filter spots by the campus already chosen in the user's profile
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

  const renderSpotRow = (spot: DropSpot) => {
    const isSelected = selectedDropSpotId === spot.id;
    return (
      <button
        key={spot.id}
        onClick={() => handleSelectSpot(spot)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition ${
          isSelected
            ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400'
            : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-stone-50'
        }`}
      >
        {/* Radio indicator */}
        <div
          className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition ${
            isSelected
              ? 'border-amber-600 bg-amber-600'
              : 'border-stone-300 bg-white'
          }`}
        >
          {isSelected && (
            <div className="h-2 w-2 rounded-full bg-white" />
          )}
        </div>

        {/* Name + short context */}
        <div className="min-w-0 flex-1">
          <div
            className={`text-sm font-bold truncate ${
              isSelected ? 'text-amber-900' : 'text-stone-900'
            }`}
          >
            {spot.name}
          </div>
          <div className="text-[11px] text-stone-500 truncate">
            {spot.shortCode} · {spot.address || spot.zone}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shrink-0">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <h3 className="text-base font-black text-stone-900">
              Pick your spot
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Spots list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {campusCompoundSpots.length > 0 && (
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-500 mb-1.5 px-1">
                On campus ({campusCompoundSpots.length})
              </h4>
              <div className="space-y-1.5">
                {campusCompoundSpots.map(renderSpotRow)}
              </div>
            </div>
          )}

          {outsideCampusSpots.length > 0 && (
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-stone-500 mb-1.5 px-1">
                Off campus ({outsideCampusSpots.length})
              </h4>
              <div className="space-y-1.5">
                {outsideCampusSpots.map(renderSpotRow)}
              </div>
            </div>
          )}

          {universitySpots.length === 0 && (
            <div className="text-center py-8 text-sm text-stone-500">
              No spots available for {currentUniversity?.name || 'this campus'} yet.
            </div>
          )}
        </div>

        {/* Footer — small profile link only */}
        <div className="px-3 py-2.5 border-t border-stone-100 shrink-0">
          <p className="text-[11px] text-stone-500 text-center">
            Need a different campus? Change it in your{' '}
            <span className="font-bold text-amber-700">Profile</span>.
          </p>
        </div>
      </div>
    </div>
  );
};