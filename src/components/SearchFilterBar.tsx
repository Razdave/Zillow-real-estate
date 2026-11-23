import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  Bookmark,
  Check,
  ChevronDown,
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { MARKET_HUBS } from '../data/properties';
import { FilterState, HomeType, ListingStatus, SaleSubtype } from '../types/realEstate';
import {
  countActiveMoreFilters,
  HOME_TYPE_LABELS,
  SALE_SUBTYPE_LABELS,
} from '../utils/propertyFilters';

interface SearchFilterBarProps {
  filters: FilterState;
  searchQuery: string;
  locationLabel: string;
  onSearchQueryChange: (q: string) => void;
  onSelectCityHub: (hubId: string) => void;
  onPlaceViewportSelected: (
    location: { lat: number; lng: number },
    bounds: { north: number; south: number; east: number; west: number } | null,
    label: string
  ) => void;
  onUpdateFilters: (patch: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onSaveSearch: (name: string, frequency: 'Instant' | 'Daily' | 'Weekly') => void;
}

const SALE_PRICE_OPTIONS = [
  { label: 'No Min/Max', value: null },
  { label: '$300,000', value: 300000 },
  { label: '$500,000', value: 500000 },
  { label: '$750,000', value: 750000 },
  { label: '$1,000,000', value: 1000000 },
  { label: '$1,500,000', value: 1500000 },
  { label: '$2,000,000', value: 2000000 },
  { label: '$3,000,000', value: 3000000 },
  { label: '$5,000,000', value: 5000000 },
];

const RENT_PRICE_OPTIONS = [
  { label: 'No Min/Max', value: null },
  { label: '$1,500/mo', value: 1500 },
  { label: '$2,000/mo', value: 2000 },
  { label: '$2,500/mo', value: 2500 },
  { label: '$3,000/mo', value: 3000 },
  { label: '$3,500/mo', value: 3500 },
  { label: '$4,000/mo', value: 4000 },
  { label: '$5,000/mo', value: 5000 },
  { label: '$7,500/mo', value: 7500 },
];

const AMENITY_OPTIONS = [
  'Air Conditioning',
  'Pool',
  'Waterfront',
  'View',
  'Fireplace',
  'Hardwood Floors',
  'EV Charger',
  'Solar Panels',
];

type OpenPopover = 'price' | 'beds' | 'type' | 'save' | null;

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filters,
  searchQuery,
  locationLabel,
  onSearchQueryChange,
  onSelectCityHub,
  onPlaceViewportSelected,
  onUpdateFilters,
  onResetFilters,
  onSaveSearch,
}) => {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [inputVal, setInputVal] = useState(searchQuery);
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [openPopover, setOpenPopover] = useState<OpenPopover>(null);
  const [moreModalOpen, setMoreModalOpen] = useState(false);

  const [saveName, setSaveName] = useState('');
  const [saveFrequency, setSaveFrequency] = useState<'Instant' | 'Daily' | 'Weekly'>('Daily');
  const [savedToast, setSavedToast] = useState(false);

  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputVal(searchQuery);
  }, [searchQuery]);

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenPopover(null);
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch Places Autocomplete predictions using modern promise-based API
  useEffect(() => {
    if (!placesLib || !showDropdown) return;
    const trimmed = inputVal.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { AutocompleteSessionToken, AutocompleteSuggestion } = placesLib;
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new AutocompleteSessionToken();
        }
        const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: trimmed,
          sessionToken: sessionTokenRef.current,
          includedRegionCodes: ['us'],
        });
        if (!cancelled) {
          setSuggestions(res.suggestions ?? []);
        }
      } catch (err) {
        const msg = String(err);
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT') || msg.includes('429')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (!cancelled) {
          setSuggestions([]);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placesLib, inputVal, showDropdown]);

  const handleSelectSuggestion = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!placesLib || !suggestion.placePrediction) return;
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
      });

      const label = place.displayName || place.formattedAddress || suggestion.placePrediction.text.text;
      setInputVal(label);
      setShowDropdown(false);
      sessionTokenRef.current = null;

      // Also check if it matches one of our metro hubs cleanly
      const lowerLabel = label.toLowerCase();
      const matchedHub = MARKET_HUBS.find((h) => lowerLabel.includes(h.city.toLowerCase()));
      if (matchedHub) {
        onSelectCityHub(matchedHub.id);
        onSearchQueryChange('');
        return;
      }

      if (place.location) {
        const vp = place.viewport;
        const bounds = vp
          ? {
              north: vp.getNorthEast().lat(),
              east: vp.getNorthEast().lng(),
              south: vp.getSouthWest().lat(),
              west: vp.getSouthWest().lng(),
            }
          : null;
        onPlaceViewportSelected(
          { lat: place.location.lat(), lng: place.location.lng() },
          bounds,
          label
        );
      }
      onSearchQueryChange(label);
    } catch (err) {
      const msg = String(err);
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    setShowDropdown(false);

    if (!trimmed) {
      onSearchQueryChange('');
      return;
    }

    const lower = trimmed.toLowerCase();
    const hub = MARKET_HUBS.find(
      (h) =>
        lower.includes(h.city.toLowerCase()) ||
        lower === `${h.city.toLowerCase()}, ${h.state.toLowerCase()}`
    );
    if (hub) {
      onSelectCityHub(hub.id);
      onSearchQueryChange('');
      return;
    }

    onSearchQueryChange(trimmed);
  };

  const priceOptions = filters.status === 'for_rent' ? RENT_PRICE_OPTIONS : SALE_PRICE_OPTIONS;
  const moreCount = countActiveMoreFilters(filters);

  const toggleHomeType = (type: HomeType) => {
    const exists = filters.homeTypes.includes(type);
    const next = exists
      ? filters.homeTypes.filter((t) => t !== type)
      : [...filters.homeTypes, type];
    onUpdateFilters({ homeTypes: next });
  };

  const toggleAmenity = (amenity: string) => {
    const exists = filters.amenities.includes(amenity);
    const next = exists
      ? filters.amenities.filter((a) => a !== amenity)
      : [...filters.amenities, amenity];
    onUpdateFilters({ amenities: next });
  };

  const toggleSaleSubtype = (subtype: SaleSubtype) => {
    const exists = filters.saleSubtypes.includes(subtype);
    const next = exists
      ? filters.saleSubtypes.filter((s) => s !== subtype)
      : [...filters.saleSubtypes, subtype];
    onUpdateFilters({ saleSubtypes: next });
  };

  const priceButtonLabel = (() => {
    if (filters.priceMin === null && filters.priceMax === null) return 'Price';
    const fmt = (v: number) =>
      filters.status === 'for_rent'
        ? `$${v.toLocaleString()}`
        : v >= 1_000_000
        ? `$${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
        : `$${Math.round(v / 1000)}K`;
    if (filters.priceMin !== null && filters.priceMax !== null) {
      return `${fmt(filters.priceMin)}–${fmt(filters.priceMax)}`;
    }
    if (filters.priceMin !== null) return `${fmt(filters.priceMin)}+`;
    return `Up to ${fmt(filters.priceMax!)}`;
  })();

  const bedsButtonLabel = (() => {
    if (filters.bedsMin === null && filters.bathsMin === null) return 'Beds & Baths';
    const bText = filters.bedsMin !== null ? `${filters.bedsMin}${filters.bedsExact ? '' : '+'} bd` : 'Any bd';
    const baText = filters.bathsMin !== null ? `${filters.bathsMin}+ ba` : 'Any ba';
    return `${bText}, ${baText}`;
  })();

  const hasAnyActiveFilter =
    filters.priceMin !== null ||
    filters.priceMax !== null ||
    filters.bedsMin !== null ||
    filters.bathsMin !== null ||
    filters.homeTypes.length > 0 ||
    moreCount > 0 ||
    searchQuery.trim().length > 0;

  return (
    <div ref={barRef} className="bg-white border-b border-slate-200 relative z-30">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-6 py-2.5 flex flex-wrap items-center gap-2.5">
        {/* Search Input with Google Places Autocomplete */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={inputVal}
            onFocus={() => setShowDropdown(true)}
            onChange={(e) => {
              setInputVal(e.target.value);
              setShowDropdown(true);
              if (e.target.value === '') {
                onSearchQueryChange('');
              }
            }}
            placeholder="Address, neighborhood, city, or ZIP"
            aria-label="Search real estate by address, neighborhood, city, or ZIP"
            className="w-full h-10 pl-9 pr-9 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-500 focus:bg-white focus:border-[#006AFF] focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
          {inputVal && (
            <button
              type="button"
              onClick={() => {
                setInputVal('');
                onSearchQueryChange('');
                setSuggestions([]);
              }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Autocomplete + Quick Metro Markets Dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden z-50">
              {suggestions.length > 0 && (
                <div className="py-1 border-b border-slate-100">
                  <div className="px-3 py-1 text-[11px] font-medium text-slate-500">
                    Suggested Locations
                  </div>
                  {suggestions.slice(0, 5).map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-blue-50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-[#006AFF] shrink-0" />
                      <span className="truncate">{s.placePrediction?.text.text}</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="py-1.5">
                <div className="px-3 py-1 text-[11px] font-medium text-slate-500">
                  Featured Housing Markets
                </div>
                <div className="grid grid-cols-2 gap-1 px-2 pb-1">
                  {MARKET_HUBS.map((hub) => (
                    <button
                      key={hub.id}
                      type="button"
                      onClick={() => {
                        onSelectCityHub(hub.id);
                        setInputVal(`${hub.city}, ${hub.state}`);
                        onSearchQueryChange('');
                        setShowDropdown(false);
                      }}
                      className="px-2.5 py-1.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 rounded flex items-center justify-between cursor-pointer"
                    >
                      <span>
                        {hub.city}, {hub.state}
                      </span>
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {hub.activeListings.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Listing Status Segmented Control */}
        <div className="inline-flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg shrink-0">
          {(
            [
              { id: 'for_sale', label: 'For Sale' },
              { id: 'for_rent', label: 'For Rent' },
              { id: 'sold', label: 'Sold' },
            ] as { id: ListingStatus; label: string }[]
          ).map((st) => {
            const active = filters.status === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() =>
                  onUpdateFilters({
                    status: st.id,
                    priceMin: null,
                    priceMax: null,
                  })
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-white text-[#006AFF] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Price Filter Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopover(openPopover === 'price' ? null : 'price')}
            className={`h-10 px-3.5 text-xs font-semibold border rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              filters.priceMin !== null || filters.priceMax !== null
                ? 'border-[#006AFF] bg-blue-50 text-[#006AFF]'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            <span>{priceButtonLabel}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {openPopover === 'price' && (
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50">
              <div className="text-sm font-semibold text-slate-900 mb-3">Price Range</div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Minimum</label>
                  <select
                    value={filters.priceMin ?? ''}
                    onChange={(e) =>
                      onUpdateFilters({
                        priceMin: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
                  >
                    {priceOptions.map((opt) => (
                      <option key={`min-${opt.label}`} value={opt.value ?? ''}>
                        {opt.value === null ? 'No Min' : opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Maximum</label>
                  <select
                    value={filters.priceMax ?? ''}
                    onChange={(e) =>
                      onUpdateFilters({
                        priceMax: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
                  >
                    {priceOptions.map((opt) => (
                      <option key={`max-${opt.label}`} value={opt.value ?? ''}>
                        {opt.value === null ? 'No Max' : opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpenPopover(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Beds & Baths Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopover(openPopover === 'beds' ? null : 'beds')}
            className={`h-10 px-3.5 text-xs font-semibold border rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              filters.bedsMin !== null || filters.bathsMin !== null
                ? 'border-[#006AFF] bg-blue-50 text-[#006AFF]'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            <span>{bedsButtonLabel}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {openPopover === 'beds' && (
            <div className="absolute left-0 top-full mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-900">Bedrooms</span>
                  <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.bedsExact}
                      onChange={(e) => onUpdateFilters({ bedsExact: e.target.checked })}
                      className="rounded border-slate-300 text-[#006AFF]"
                    />
                    <span>Use exact match</span>
                  </label>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {[null, 1, 2, 3, 4, 5].map((num) => {
                    const active = filters.bedsMin === num;
                    return (
                      <button
                        key={`bed-${num ?? 'any'}`}
                        type="button"
                        onClick={() => onUpdateFilters({ bedsMin: num })}
                        className={`h-9 text-xs font-semibold rounded-md border cursor-pointer ${
                          active
                            ? 'bg-[#006AFF] text-white border-[#006AFF]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {num === null ? 'Any' : filters.bedsExact ? `${num}` : `${num}+`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-900 mb-2">Bathrooms</div>
                <div className="grid grid-cols-6 gap-1">
                  {[null, 1, 1.5, 2, 3, 4].map((num) => {
                    const active = filters.bathsMin === num;
                    return (
                      <button
                        key={`bath-${num ?? 'any'}`}
                        type="button"
                        onClick={() => onUpdateFilters({ bathsMin: num })}
                        className={`h-9 text-xs font-semibold rounded-md border cursor-pointer ${
                          active
                            ? 'bg-[#006AFF] text-white border-[#006AFF]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {num === null ? 'Any' : `${num}+`}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpenPopover(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Home Type Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpenPopover(openPopover === 'type' ? null : 'type')}
            className={`h-10 px-3.5 text-xs font-semibold border rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
              filters.homeTypes.length > 0
                ? 'border-[#006AFF] bg-blue-50 text-[#006AFF]'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            <span>
              {filters.homeTypes.length > 0
                ? `Home Type (${filters.homeTypes.length})`
                : 'Home Type'}
            </span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {openPopover === 'type' && (
            <div className="absolute left-0 top-full mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-sm font-semibold text-slate-900">Home Type</span>
                {filters.homeTypes.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onUpdateFilters({ homeTypes: [] })}
                    className="text-xs font-medium text-[#006AFF] hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {(Object.keys(HOME_TYPE_LABELS) as HomeType[]).map((type) => {
                  const checked = filters.homeTypes.includes(type);
                  return (
                    <label
                      key={type}
                      className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-slate-900"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleHomeType(type)}
                        className="w-4 h-4 rounded border-slate-300 text-[#006AFF]"
                      />
                      <span>{HOME_TYPE_LABELS[type]}</span>
                    </label>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setOpenPopover(null)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* More Filters Trigger */}
        <button
          type="button"
          onClick={() => {
            setOpenPopover(null);
            setMoreModalOpen(true);
          }}
          className={`h-10 px-3.5 text-xs font-semibold border rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
            moreCount > 0
              ? 'border-[#006AFF] bg-blue-50 text-[#006AFF]'
              : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>More{moreCount > 0 ? ` (${moreCount})` : ''}</span>
        </button>

        {/* Save Search Action */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setSaveName(`${locationLabel} Homes`);
              setOpenPopover(openPopover === 'save' ? null : 'save');
            }}
            className="h-10 px-3.5 text-xs font-semibold text-[#006AFF] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          >
            {savedToast ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            <span>{savedToast ? 'Search saved' : 'Save search'}</span>
          </button>

          {openPopover === 'save' && (
            <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 space-y-3">
              <div className="text-sm font-semibold text-slate-900">Save this search</div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Search name
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#006AFF]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Email alert frequency
                </label>
                <select
                  value={saveFrequency}
                  onChange={(e) =>
                    setSaveFrequency(e.target.value as 'Instant' | 'Daily' | 'Weekly')
                  }
                  className="w-full h-9 px-2.5 text-sm border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Instant">Instant alerts</option>
                  <option value="Daily">Daily digest</option>
                  <option value="Weekly">Weekly summary</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpenPopover(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSaveSearch(saveName.trim() || `${locationLabel} Search`, saveFrequency);
                    setOpenPopover(null);
                    setSavedToast(true);
                    setTimeout(() => setSavedToast(false), 2400);
                  }}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg cursor-pointer"
                >
                  Save search
                </button>
              </div>
            </div>
          )}
        </div>

        {hasAnyActiveFilter && (
          <button
            type="button"
            onClick={() => {
              setInputVal('');
              onResetFilters();
            }}
            className="h-10 px-3 text-xs font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Advanced "More Filters" Modal */}
      {moreModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="More property filters"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">More Filters</h2>
              <button
                type="button"
                onClick={() => setMoreModalOpen(false)}
                className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Listing Type Subtypes */}
              {filters.status === 'for_sale' && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2.5">
                    Listing Type &amp; Status
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {(Object.keys(SALE_SUBTYPE_LABELS) as SaleSubtype[]).map((sub) => (
                      <label
                        key={sub}
                        className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.saleSubtypes.includes(sub)}
                          onChange={() => toggleSaleSubtype(sub)}
                          className="w-4 h-4 rounded border-slate-300 text-[#006AFF]"
                        />
                        <span>{SALE_SUBTYPE_LABELS[sub]}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* HOA & Parking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Max HOA
                  </label>
                  <select
                    value={filters.maxHoa ?? ''}
                    onChange={(e) =>
                      onUpdateFilters({
                        maxHoa: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Any HOA fee</option>
                    <option value="0">No HOA fee ($0)</option>
                    <option value="150">Up to $150/month</option>
                    <option value="300">Up to $300/month</option>
                    <option value="650">Up to $650/month</option>
                    <option value="1000">Up to $1,000/month</option>
                    <option value="1500">Up to $1,500/month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Parking Spots
                  </label>
                  <div className="flex items-center gap-3">
                    <select
                      value={filters.parkingMin ?? ''}
                      onChange={(e) =>
                        onUpdateFilters({
                          parkingMin: e.target.value === '' ? null : Number(e.target.value),
                        })
                      }
                      className="flex-1 h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">Any</option>
                      <option value="1">1+ spaces</option>
                      <option value="2">2+ spaces</option>
                      <option value="3">3+ spaces</option>
                      <option value="4">4+ spaces</option>
                    </select>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={filters.mustHaveGarage}
                        onChange={(e) => onUpdateFilters({ mustHaveGarage: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-[#006AFF]"
                      />
                      <span>Must have garage</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Square Feet & Lot Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Square Feet
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={filters.sqftMin ?? ''}
                      onChange={(e) =>
                        onUpdateFilters({
                          sqftMin: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-10 px-2.5 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">No Min</option>
                      <option value="750">750 sqft</option>
                      <option value="1000">1,000 sqft</option>
                      <option value="1500">1,500 sqft</option>
                      <option value="2000">2,000 sqft</option>
                      <option value="2500">2,500 sqft</option>
                      <option value="3000">3,000 sqft</option>
                    </select>
                    <select
                      value={filters.sqftMax ?? ''}
                      onChange={(e) =>
                        onUpdateFilters({
                          sqftMax: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-10 px-2.5 text-sm border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">No Max</option>
                      <option value="1500">1,500 sqft</option>
                      <option value="2000">2,000 sqft</option>
                      <option value="2500">2,500 sqft</option>
                      <option value="3500">3,500 sqft</option>
                      <option value="5000">5,000 sqft</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Minimum Lot Size
                  </label>
                  <select
                    value={filters.lotMin ?? ''}
                    onChange={(e) =>
                      onUpdateFilters({
                        lotMin: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Any lot size</option>
                    <option value="2000">2,000+ sqft</option>
                    <option value="4000">4,000+ sqft</option>
                    <option value="6000">6,000+ sqft</option>
                    <option value="10000">10,000+ sqft</option>
                    <option value="21780">0.5+ acre</option>
                  </select>
                </div>
              </div>

              {/* Year Built & Days on Zillow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Year Built
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Min (e.g. 1990)"
                      value={filters.yearBuiltMin ?? ''}
                      onChange={(e) =>
                        onUpdateFilters({
                          yearBuiltMin: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-10 px-3 text-sm border border-slate-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="Max (e.g. 2026)"
                      value={filters.yearBuiltMax ?? ''}
                      onChange={(e) =>
                        onUpdateFilters({
                          yearBuiltMax: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                      className="h-10 px-3 text-sm border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                    Days on Zillow
                  </label>
                  <select
                    value={filters.daysOnMarketMax ?? ''}
                    onChange={(e) =>
                      onUpdateFilters({
                        daysOnMarketMax: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="">Any</option>
                    <option value="1">1 day</option>
                    <option value="7">7 days</option>
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              </div>

              {/* Structure & Tours */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-2.5">
                  Tours, Stories &amp; Basement
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.mustHaveOpenHouse}
                      onChange={(e) => onUpdateFilters({ mustHaveOpenHouse: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-[#006AFF]"
                    />
                    <span>Open house scheduled</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.mustHave3DTour}
                      onChange={(e) => onUpdateFilters({ mustHave3DTour: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-[#006AFF]"
                    />
                    <span>Must have 3D Tour</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.singleStoryOnly}
                      onChange={(e) => onUpdateFilters({ singleStoryOnly: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-[#006AFF]"
                    />
                    <span>Single-story only</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.basementTypes.includes('Finished')}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...filters.basementTypes, 'Finished' as const]
                          : filters.basementTypes.filter((b) => b !== 'Finished');
                        onUpdateFilters({ basementTypes: next });
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-[#006AFF]"
                    />
                    <span>Finished basement</span>
                  </label>
                </div>
              </div>

              {/* Rental Specific */}
              {filters.status === 'for_rent' && (
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2.5">
                    Rental Requirements
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.petsDogs}
                        onChange={(e) => onUpdateFilters({ petsDogs: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-[#006AFF]"
                      />
                      <span>Dogs allowed</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.petsCats}
                        onChange={(e) => onUpdateFilters({ petsCats: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-[#006AFF]"
                      />
                      <span>Cats allowed</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.inUnitLaundry}
                        onChange={(e) => onUpdateFilters({ inUnitLaundry: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-[#006AFF]"
                      />
                      <span>In-unit laundry</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-2.5">
                  Amenities &amp; Features
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <label
                      key={amenity}
                      className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-4 h-4 rounded border-slate-300 text-[#006AFF]"
                      />
                      <span>{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Keywords */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-900 mb-1.5">
                  Keywords
                </label>
                <input
                  type="text"
                  value={filters.keywords}
                  onChange={(e) => onUpdateFilters({ keywords: e.target.value })}
                  placeholder="e.g. rooftop, chef's kitchen, Wolf, garden, solar"
                  className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#006AFF]"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={onResetFilters}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Reset all filters
              </button>
              <button
                type="button"
                onClick={() => setMoreModalOpen(false)}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg cursor-pointer"
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
