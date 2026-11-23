import React, { useEffect, useRef, useState } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  ChevronRight,
  Heart,
  Home,
  MapPin,
  Search,
} from 'lucide-react';
import {
  IMG_HERO,
  MARKET_HUBS,
  PROPERTIES,
} from '../data/properties';
import { AppSection, Property } from '../types/realEstate';
import { formatCurrency } from '../utils/propertyFilters';
import { PropertyCard } from './PropertyCard';
import { UtilityModalType } from './TopNav';

interface ZillowHomepageProps {
  savedIds: Set<string>;
  onSearchSubmit: (query: string) => void;
  onSelectCityHub: (hubId: string) => void;
  onPlaceViewportSelected: (
    location: { lat: number; lng: number },
    bounds: { north: number; south: number; east: number; west: number } | null,
    label: string
  ) => void;
  onSelectSection: (section: AppSection) => void;
  onExploreWithMaxPrice: (maxPrice: number) => void;
  onToggleSave: (id: string) => void;
  onHideProperty: (id: string) => void;
  onSelectProperty: (property: Property) => void;
  onOpenUtilityModal: (modal: UtilityModalType) => void;
  signedInEmail: string | null;
}

/* Custom Zillow-style spot illustrations for Buy / Rent / Sell cards */
const BuySpotIllustration = () => (
  <svg width="160" height="120" viewBox="0 0 160 120" fill="none" aria-hidden="true">
    <ellipse cx="80" cy="104" rx="58" ry="8" fill="#E8F1FF" />
    {/* House body */}
    <path d="M36 58L74 28L112 58V100H36V58Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.2" />
    <path d="M28 60L74 24L120 60" stroke="#006AFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Chimney */}
    <rect x="94" y="30" width="10" height="16" fill="#DBEAFE" stroke="#1E293B" strokeWidth="2" />
    {/* Door & windows */}
    <rect x="64" y="72" width="18" height="28" rx="2" fill="#006AFF" />
    <rect x="44" y="64" width="14" height="14" rx="1.5" fill="#DBEAFE" stroke="#1E293B" strokeWidth="1.8" />
    <rect x="88" y="64" width="14" height="14" rx="1.5" fill="#DBEAFE" stroke="#1E293B" strokeWidth="1.8" />
    {/* Warm sun / magnifying accent */}
    <circle cx="118" cy="40" r="14" fill="#FDE68A" stroke="#1E293B" strokeWidth="2" />
    <circle cx="118" cy="40" r="7" fill="#FFFFFF" stroke="#006AFF" strokeWidth="2" />
    <path d="M128 50L138 60" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

const RentSpotIllustration = () => (
  <svg width="160" height="120" viewBox="0 0 160 120" fill="none" aria-hidden="true">
    <ellipse cx="80" cy="104" rx="58" ry="8" fill="#E8F1FF" />
    {/* Apartment building */}
    <rect x="38" y="28" width="56" height="72" rx="3" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.2" />
    <rect x="38" y="28" width="56" height="12" rx="2" fill="#006AFF" />
    {/* Windows grid */}
    <rect x="46" y="48" width="12" height="12" rx="1.5" fill="#DBEAFE" stroke="#1E293B" strokeWidth="1.6" />
    <rect x="66" y="48" width="12" height="12" rx="1.5" fill="#DBEAFE" stroke="#1E293B" strokeWidth="1.6" />
    <rect x="46" y="66" width="12" height="12" rx="1.5" fill="#DBEAFE" stroke="#1E293B" strokeWidth="1.6" />
    <rect x="66" y="66" width="12" height="12" rx="1.5" fill="#DBEAFE" stroke="#1E293B" strokeWidth="1.6" />
    <rect x="56" y="84" width="16" height="16" fill="#006AFF" />
    {/* Key emblem */}
    <circle cx="114" cy="54" r="13" fill="#FDE68A" stroke="#1E293B" strokeWidth="2" />
    <circle cx="114" cy="54" r="4" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.8" />
    <path d="M114 67V95M114 84H123M114 91H121" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const SellSpotIllustration = () => (
  <svg width="160" height="120" viewBox="0 0 160 120" fill="none" aria-hidden="true">
    <ellipse cx="80" cy="104" rx="58" ry="8" fill="#E8F1FF" />
    {/* Residence */}
    <path d="M48 60L84 32L120 60V100H48V60Z" fill="#FFFFFF" stroke="#1E293B" strokeWidth="2.2" />
    <path d="M40 62L84 28L128 62" stroke="#1E293B" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="76" y="74" width="16" height="26" fill="#DBEAFE" stroke="#1E293B" strokeWidth="1.8" />
    <rect x="98" y="64" width="14" height="14" fill="#FDE68A" stroke="#1E293B" strokeWidth="1.8" />
    {/* Yard "For Sale" Sign */}
    <path d="M32 52V100" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M22 52H56" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="26" y="56" width="28" height="20" rx="2" fill="#006AFF" stroke="#1E293B" strokeWidth="1.8" />
    <path d="M31 64H49M31 69H44" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const ZillowHomepage: React.FC<ZillowHomepageProps> = ({
  savedIds,
  onSearchSubmit,
  onSelectCityHub,
  onPlaceViewportSelected,
  onSelectSection,
  onExploreWithMaxPrice,
  onToggleSave,
  onHideProperty,
  onSelectProperty,
  onOpenUtilityModal,
  signedInEmail,
}) => {
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const [heroInput, setHeroInput] = useState('');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Interactive BuyAbility Homepage Estimator State
  const [annualIncome, setAnnualIncome] = useState(165000);
  const [monthlyDebts, setMonthlyDebts] = useState(500);
  const [downPaymentCash, setDownPaymentCash] = useState(120000);

  const monthlyIncome = annualIncome / 12;
  const targetMonthlyPayment = Math.max(1200, Math.round(monthlyIncome * 0.34 - monthlyDebts));
  const suggestedTargetPrice = Math.round(
    (targetMonthlyPayment * 0.8) / 0.00627 + downPaymentCash
  );

  const forSaleListings = PROPERTIES.filter((p) => p.status === 'for_sale');
  const recommendedCardOne = forSaleListings[0] ?? PROPERTIES[0];
  const recommendedCardTwo = forSaleListings[2] ?? PROPERTIES[1];

  const buyAbilityHomes = forSaleListings
    .filter((p) => p.price <= suggestedTargetPrice)
    .slice(0, 3);

  const trendingHomes = forSaleListings.slice(0, 4);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (!placesLib || !showDropdown) return;
    const trimmed = heroInput.trim();
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
        if (!cancelled) setSuggestions([]);
      }
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [placesLib, heroInput, showDropdown]);

  const handleSelectPrediction = async (suggestion: google.maps.places.AutocompleteSuggestion) => {
    if (!placesLib || !suggestion.placePrediction) return;
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'location', 'viewport'],
      });
      const label = place.displayName || place.formattedAddress || suggestion.placePrediction.text.text;
      sessionTokenRef.current = null;
      setShowDropdown(false);

      const lower = label.toLowerCase();
      const matchedHub = MARKET_HUBS.find((h) => lower.includes(h.city.toLowerCase()));
      if (matchedHub) {
        onSelectCityHub(matchedHub.id);
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
      onSelectSection('buy');
    } catch (err) {
      const msg = String(err);
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    const trimmed = heroInput.trim();
    if (!trimmed) {
      onSelectSection('buy');
      return;
    }
    const lower = trimmed.toLowerCase();
    const matchedHub = MARKET_HUBS.find((h) => lower.includes(h.city.toLowerCase()));
    if (matchedHub) {
      onSelectCityHub(matchedHub.id);
      return;
    }
    onSearchSubmit(trimmed);
  };

  return (
    <div className="bg-white">
      {/* 1. Zillow.com Hero Banner (Left-aligned desktop composition) */}
      <section className="relative min-h-[420px] sm:min-h-[470px] lg:min-h-[500px] flex items-center overflow-hidden bg-slate-900">
        <img
          src={IMG_HERO}
          alt="Residential neighborhood architecture at sunset"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-black/15" />

        <div className="relative z-10 w-full max-w-[1200px] mx-auto px-4 lg:px-8 py-12">
          <div className="max-w-[580px] space-y-6">
            <h1
              className="text-4xl sm:text-[52px] font-extrabold text-white tracking-tight leading-[1.08] drop-shadow-sm"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Agents. Tours.
              <br />
              Loans. Homes.
            </h1>

            {/* Zillow Hero Search Input */}
            <div ref={searchBoxRef} className="relative">
              <form
                onSubmit={handleFormSubmit}
                className="flex items-center bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden h-[56px]"
              >
                <input
                  type="text"
                  value={heroInput}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setHeroInput(e.target.value);
                    setShowDropdown(true);
                  }}
                  placeholder="Enter an address, neighborhood, city, or ZIP code"
                  aria-label="Enter an address, neighborhood, city, or ZIP code"
                  className="flex-1 h-full px-4 sm:px-5 text-sm sm:text-[15px] text-[#2A2A33] placeholder:text-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="h-full px-4 sm:px-5 text-[#2A2A33] hover:text-[#006AFF] transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Search className="w-5 h-5" />
                </button>
              </form>

              {showDropdown && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden text-left z-30">
                  {suggestions.length > 0 && (
                    <div className="py-1.5 border-b border-slate-100">
                      <div className="px-4 py-1 text-[11px] font-semibold text-slate-500">
                        Locations
                      </div>
                      {suggestions.slice(0, 5).map((s, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectPrediction(s)}
                          className="w-full px-4 py-2.5 text-sm text-[#2A2A33] hover:bg-blue-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <MapPin className="w-4 h-4 text-[#006AFF] shrink-0" />
                          <span className="truncate">{s.placePrediction?.text.text}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="p-3">
                    <div className="px-1 pb-2 text-[11px] font-semibold text-slate-500">
                      Popular Markets
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {MARKET_HUBS.map((hub) => (
                        <button
                          key={hub.id}
                          type="button"
                          onClick={() => {
                            setShowDropdown(false);
                            onSelectCityHub(hub.id);
                          }}
                          className="px-3 py-2 text-left text-xs font-medium text-[#2A2A33] hover:bg-blue-50 hover:text-[#006AFF] rounded-lg flex items-center justify-between cursor-pointer"
                        >
                          <span>
                            {hub.city}, {hub.state}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Get home recommendations (Exact Zillow.com 2-Column Split with Overlapping Preview Cards) */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-3 text-center lg:text-left">
            <h2
              className="text-xl sm:text-[22px] font-bold text-[#2A2A33]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {signedInEmail ? 'Recommended homes for you' : 'Get home recommendations'}
            </h2>
            <p className="text-sm sm:text-[15px] text-[#596B82]">
              {signedInEmail
                ? `Signed in as ${signedInEmail}. Pick up right where you left off with saved listings and price updates.`
                : 'Sign in for a more personalized experience.'}
            </p>
            <div className="pt-2">
              {signedInEmail ? (
                <button
                  type="button"
                  onClick={() => onSelectSection('buy')}
                  className="px-5 py-2.5 text-sm font-bold text-[#006AFF] bg-white hover:bg-blue-50 border border-[#006AFF] rounded-lg cursor-pointer transition-colors"
                >
                  Browse recommended homes
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onOpenUtilityModal('signin')}
                  className="px-6 py-2.5 text-sm font-bold text-[#006AFF] bg-white hover:bg-blue-50 border border-[#006AFF] rounded-lg cursor-pointer transition-colors"
                >
                  Sign in
                </button>
              )}
            </div>
          </div>

          {/* Right Overlapping Listing Card Collage */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl bg-gradient-to-tr from-[#E6F0FF] via-[#F2F7FF] to-[#EEF2FF] px-6 py-8 sm:px-10 sm:py-10 overflow-hidden border border-blue-100/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center relative z-10">
                {[recommendedCardOne, recommendedCardTwo].map((home, idx) => (
                  <button
                    key={home.id}
                    type="button"
                    onClick={() => onSelectProperty(home)}
                    className={`text-left bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden hover:shadow-xl hover:border-[#006AFF] transition-all cursor-pointer ${
                      idx === 1 ? 'sm:translate-y-3' : 'sm:-translate-y-2'
                    }`}
                  >
                    <div className="relative aspect-[16/10] bg-slate-100">
                      <img
                        src={home.images[0]}
                        alt={home.street}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-white/95 text-[11px] font-bold text-[#2A2A33] shadow-xs">
                        {idx === 0 ? 'Recommended' : 'New listing'}
                      </span>
                      <span className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center">
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            savedIds.has(home.id) ? 'fill-rose-500 text-rose-500' : 'text-white'
                          }`}
                        />
                      </span>
                    </div>
                    <div className="p-3.5 space-y-0.5">
                      <div className="text-lg font-extrabold text-[#2A2A33] tabular-nums">
                        {formatCurrency(home.price)}
                      </div>
                      <div className="text-xs text-[#2A2A33] tabular-nums">
                        <strong>{home.beds}</strong> bds <span className="text-slate-300">|</span>{' '}
                        <strong>{home.baths}</strong> ba <span className="text-slate-300">|</span>{' '}
                        <strong>{home.sqft.toLocaleString()}</strong> sqft
                      </div>
                      <div className="text-xs text-[#596B82] truncate">
                        {home.street}, {home.city}, {home.state}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Find homes you can afford with BuyAbility (Zillow Dark Teal Module + Within BuyAbility Cards) */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-8 pb-14">
        <div className="mb-6">
          <h2
            className="text-xl sm:text-[22px] font-bold text-[#2A2A33]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Find homes you can afford with BuyAbility℠
          </h2>
          <p className="text-sm sm:text-[15px] text-[#596B82] mt-1">
            Answer a few questions. We’ll highlight homes you’re likely to qualify for.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Zillow Home Loans Deep Teal BuyAbility Card */}
          <div className="lg:col-span-4 rounded-2xl bg-[#064E4A] text-white p-6 flex flex-col justify-between space-y-5 shadow-md">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-tight text-emerald-100">
                <Home className="w-4 h-4 text-emerald-300" />
                <span>Zillow Home Loans</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-4 border-b border-white/15 tabular-nums">
                <div>
                  <div className="text-[11px] text-emerald-100/80">Suggested target price</div>
                  <div className="text-xl font-extrabold text-white mt-0.5">
                    {formatCurrency(suggestedTargetPrice)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-emerald-100/80">BuyAbility℠</div>
                  <div className="text-xl font-extrabold text-emerald-200 mt-0.5">
                    {formatCurrency(targetMonthlyPayment)}/mo
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs text-emerald-50 mb-1">
                    <span>Annual income</span>
                    <span className="font-bold tabular-nums">{formatCurrency(annualIncome)}</span>
                  </div>
                  <input
                    type="range"
                    min={60000}
                    max={500000}
                    step={5000}
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-emerald-50 mb-1">
                    <span>Down payment</span>
                    <span className="font-bold tabular-nums">{formatCurrency(downPaymentCash)}</span>
                  </div>
                  <input
                    type="range"
                    min={15000}
                    max={500000}
                    step={5000}
                    value={downPaymentCash}
                    onChange={(e) => setDownPaymentCash(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-emerald-50 mb-1">
                    <span>Monthly debt</span>
                    <span className="font-bold tabular-nums">{formatCurrency(monthlyDebts)}/mo</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={4000}
                    step={100}
                    value={monthlyDebts}
                    onChange={(e) => setMonthlyDebts(Number(e.target.value))}
                    className="w-full accent-white cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => onExploreWithMaxPrice(suggestedTargetPrice)}
                className="w-full py-2.5 px-4 text-sm font-bold text-[#064E4A] bg-white hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
              >
                Let’s get started
              </button>
              <button
                type="button"
                onClick={() => onSelectSection('loans')}
                className="w-full text-center text-xs font-semibold text-emerald-100 hover:underline cursor-pointer"
              >
                Open full Zillow Home Loans calculator
              </button>
            </div>
          </div>

          {/* Right: Matching Home Cards with "Within BuyAbility" green tag */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {buyAbilityHomes.length > 0 ? (
              buyAbilityHomes.map((home) => (
                <button
                  key={home.id}
                  type="button"
                  onClick={() => onSelectProperty(home)}
                  className="text-left rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-[#006AFF] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[4/3] bg-slate-100">
                      <img
                        src={home.images[0]}
                        alt={home.street}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-emerald-700 text-white text-[11px] font-bold shadow-xs">
                        Within BuyAbility
                      </span>
                    </div>
                    <div className="p-4 space-y-1">
                      <div className="text-lg font-extrabold text-[#2A2A33] tabular-nums">
                        {formatCurrency(home.price)}
                      </div>
                      <div className="text-xs text-[#2A2A33] tabular-nums">
                        <strong>{home.beds}</strong> bds <span className="text-slate-300">|</span>{' '}
                        <strong>{home.baths}</strong> ba <span className="text-slate-300">|</span>{' '}
                        <strong>{home.sqft.toLocaleString()}</strong> sqft
                      </div>
                      <div className="text-xs text-[#596B82] truncate pt-0.5">
                        {home.street}, {home.city}, {home.state}
                      </div>
                    </div>
                  </div>
                  <div className="px-4 pb-3 text-[11px] font-semibold text-[#006AFF]">
                    View listing details
                  </div>
                </button>
              ))
            ) : (
              <div className="sm:col-span-3 p-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-center text-sm text-[#596B82]">
                Adjust income or down payment sliders to view homes within your BuyAbility target
                price.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Zillow's Iconic 3-Card Row: Buy a home / Rent a home / Sell a home */}
      <section className="bg-[#F9F9FB] border-y border-slate-200/80 py-14">
        <div className="max-w-[1200px] mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-8 text-center flex flex-col items-center justify-between space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <BuySpotIllustration />
                <h2
                  className="text-2xl font-bold text-[#2A2A33]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Buy a home
                </h2>
                <p className="text-sm text-[#2A2A33] leading-relaxed">
                  Find your place with an immersive photo experience and the most listings,
                  including things you won’t find anywhere else.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection('buy')}
                className="px-5 py-2.5 text-sm font-bold text-[#006AFF] border border-[#006AFF] hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
              >
                Browse homes
              </button>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-8 text-center flex flex-col items-center justify-between space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <RentSpotIllustration />
                <h2
                  className="text-2xl font-bold text-[#2A2A33]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Rent a home
                </h2>
                <p className="text-sm text-[#2A2A33] leading-relaxed">
                  We’re creating a seamless online experience – from shopping on the largest rental
                  network, to applying, to paying rent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection('rent')}
                className="px-5 py-2.5 text-sm font-bold text-[#006AFF] border border-[#006AFF] hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
              >
                Find rentals
              </button>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200/90 shadow-[0_2px_12px_rgba(0,0,0,0.05)] p-8 text-center flex flex-col items-center justify-between space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <SellSpotIllustration />
                <h2
                  className="text-2xl font-bold text-[#2A2A33]"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Sell a home
                </h2>
                <p className="text-sm text-[#2A2A33] leading-relaxed">
                  No matter what path you take to sell your home, we can help you navigate a
                  successful sale.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onSelectSection('sell')}
                className="px-5 py-2.5 text-sm font-bold text-[#006AFF] border border-[#006AFF] hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
              >
                See your options
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Trending Homes on Zillow */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-8 py-12 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-xl sm:text-[22px] font-bold text-[#2A2A33]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Trending homes
            </h2>
            <p className="text-sm text-[#596B82] mt-0.5">
              Viewed and saved most often across featured U.S. markets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectSection('buy')}
            className="text-sm font-bold text-[#006AFF] hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Explore all homes on map</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {trendingHomes.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isSaved={savedIds.has(property.id)}
              isHovered={false}
              onToggleSave={onToggleSave}
              onHideProperty={onHideProperty}
              onHover={() => {}}
              onSelect={onSelectProperty}
            />
          ))}
        </div>
      </section>

      {/* 6. About Zillow's Recommendations Disclosure */}
      <section className="max-w-[1200px] mx-auto px-4 lg:px-8 pt-2 pb-10">
        <div className="pt-8 border-t border-slate-200 text-center max-w-3xl mx-auto space-y-2">
          <h3 className="text-sm font-bold text-[#2A2A33]">About Zillow’s Recommendations</h3>
          <p className="text-xs text-[#596B82] leading-relaxed">
            Recommendations are based on your location and search activity, such as the homes you’ve
            viewed and saved and the filters you’ve used. We use this information to bring similar
            homes to your attention, so you don’t miss out.
          </p>
        </div>
      </section>
    </div>
  );
};
