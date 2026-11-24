import React, { useState } from 'react';
import { Bookmark, Calendar, Heart, Trash2, X } from 'lucide-react';
import { Property, SavedSearch, TourRequest } from '../types/realEstate';
import { formatCurrency } from '../utils/propertyFilters';

interface SavedHomesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedProperties: Property[];
  savedSearches: SavedSearch[];
  tourRequests: TourRequest[];
  onRemoveSavedHome: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onApplySavedSearch: (search: SavedSearch) => void;
  onRemoveSavedSearch: (id: string) => void;
  onCancelTour: (id: string) => void;
}

export const SavedHomesDrawer: React.FC<SavedHomesDrawerProps> = ({
  isOpen,
  onClose,
  savedProperties,
  savedSearches,
  tourRequests,
  onRemoveSavedHome,
  onSelectProperty,
  onApplySavedSearch,
  onRemoveSavedSearch,
  onCancelTour,
}) => {
  const [tab, setTab] = useState<'homes' | 'searches' | 'tours'>('homes');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[1px] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Saved homes, searches, and scheduled tours"
    >
      <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Your Zillow Activity</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-3 border-b border-slate-200 flex gap-5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('homes')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              tab === 'homes'
                ? 'border-[#006AFF] text-[#006AFF]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Saved Homes ({savedProperties.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('searches')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              tab === 'searches'
                ? 'border-[#006AFF] text-[#006AFF]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Searches ({savedSearches.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('tours')}
            className={`pb-3 border-b-2 transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
              tab === 'tours'
                ? 'border-[#006AFF] text-[#006AFF]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Tours ({tourRequests.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {tab === 'homes' && (
            <>
              {savedProperties.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Heart className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">No saved homes yet</p>
                  <p className="text-xs text-slate-500">
                    Click the heart icon on any property listing to bookmark and compare it here.
                  </p>
                </div>
              ) : (
                savedProperties.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white flex gap-3 hover:border-slate-300"
                  >
                    <img
                      src={p.images[0]}
                      alt={p.street}
                      referrerPolicy="no-referrer"
                      onClick={() => {
                        onSelectProperty(p);
                        onClose();
                      }}
                      className="w-24 h-20 rounded-lg object-cover shrink-0 cursor-pointer bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectProperty(p);
                            onClose();
                          }}
                          className="text-sm font-bold text-slate-900 tabular-nums hover:text-[#006AFF] cursor-pointer"
                        >
                          {formatCurrency(p.price)}
                          {p.status === 'for_rent' ? '/mo' : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => onRemoveSavedHome(p.id)}
                          aria-label={`Remove ${p.street}`}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 tabular-nums">
                        {p.beds} bd · {p.baths} ba · {p.sqft.toLocaleString()} sqft
                      </div>
                      <div className="text-xs font-medium text-slate-800 truncate mt-1">
                        {p.street}, {p.city}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'searches' && (
            <>
              {savedSearches.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Bookmark className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">No saved searches</p>
                  <p className="text-xs text-slate-500">
                    Use "Save search" in the filter bar to store your price, bed, and location criteria.
                  </p>
                </div>
              ) : (
                savedSearches.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-bold text-slate-900">{s.name}</div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {s.locationLabel} · {s.frequency} alerts
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveSavedSearch(s.id)}
                        aria-label={`Delete ${s.name}`}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onApplySavedSearch(s);
                        onClose();
                      }}
                      className="text-xs font-semibold text-[#006AFF] hover:underline cursor-pointer"
                    >
                      Apply saved filters
                    </button>
                  </div>
                ))
              )}
            </>
          )}

          {tab === 'tours' && (
            <>
              {tourRequests.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">No tours scheduled</p>
                  <p className="text-xs text-slate-500">
                    Open any listing and submit "Request a tour" to track your appointments here.
                  </p>
                </div>
              ) : (
                tourRequests.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-semibold text-[#006AFF]">
                          {t.tourType} Tour · {t.date} at {t.timeSlot}
                        </div>
                        <div className="text-sm font-bold text-slate-900 mt-0.5">
                          {t.propertyAddress}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onCancelTour(t.id)}
                        aria-label="Cancel tour"
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-xs text-slate-600">
                      Visitor: {t.name} ({t.email})
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
