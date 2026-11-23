import React, { useEffect, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import {
  ArrowLeft,
  Calendar,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Compass,
  Droplets,
  EyeOff,
  Flame,
  GraduationCap,
  Heart,
  Home,
  MapPin,
  Navigation,
  Share2,
  ShieldAlert,
  Sun,
  Wind,
  X,
} from 'lucide-react';
import { Property, TourRequest } from '../types/realEstate';
import {
  calculateMonthlyMortgage,
  formatCurrency,
  HOME_TYPE_LABELS,
} from '../utils/propertyFilters';

interface PropertyDetailModalProps {
  property: Property;
  allProperties: Property[];
  isSaved: boolean;
  onClose: () => void;
  onToggleSave: (id: string) => void;
  onHideProperty: (id: string) => void;
  onSelectProperty: (p: Property) => void;
  onSubmitTour: (tour: Omit<TourRequest, 'id' | 'createdAt'>) => void;
}

interface NearbyPlaceItem {
  name: string;
  address: string;
  rating?: number;
}

export const PropertyDetailModal: React.FC<PropertyDetailModalProps> = ({
  property,
  allProperties,
  isSaved,
  onClose,
  onToggleSave,
  onHideProperty,
  onSelectProperty,
  onSubmitTour,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const placesLib = useMapsLibrary('places');

  const [mediaTab, setMediaTab] = useState<'photos' | '3d' | 'floorplan'>('photos');
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [historyTab, setHistoryTab] = useState<'price' | 'tax'>('price');
  const [shareCopied, setShareCopied] = useState(false);

  // Embedded Mortgage Calculator State
  const [downPct, setDownPct] = useState(20);
  const [interestRate, setInterestRate] = useState(6.42);
  const [termYears, setTermYears] = useState(30);

  // Tour Request Form State
  const [tourType, setTourType] = useState<'In-person' | 'Video chat'>('In-person');
  const [tourDate, setTourDate] = useState('2026-11-28');
  const [tourTime, setTourTime] = useState('11:00 AM');
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [tourSubmitted, setTourSubmitted] = useState(false);
  const [agentContacted, setAgentContacted] = useState(false);

  // Google Maps Routes Commute Calculator
  const [commuteDest, setCommuteDest] = useState(
    property.city === 'Seattle'
      ? 'Downtown Seattle, WA'
      : property.city === 'San Francisco'
      ? 'Financial District, San Francisco, CA'
      : property.city === 'Austin'
      ? 'Downtown Austin, TX'
      : property.city === 'New York'
      ? 'Midtown Manhattan, NY'
      : property.city === 'Miami'
      ? 'Brickell City Centre, Miami, FL'
      : 'Chicago Loop, Chicago, IL'
  );
  const [commuteResult, setCommuteResult] = useState<{
    durationText: string;
    distanceText: string;
    source: string;
  } | null>(null);
  const [commuteLoading, setCommuteLoading] = useState(false);
  const [commuteError, setCommuteError] = useState<string | null>(null);

  // Nearby Places via Places Library
  const [nearbyCategory, setNearbyCategory] = useState<'school' | 'supermarket' | 'park' | 'transit_station'>('supermarket');
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceItem[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  useEffect(() => {
    setActivePhotoIdx(0);
    setMediaTab('photos');
    setTourSubmitted(false);
    setAgentContacted(false);
    setCommuteResult(null);
    setCommuteError(null);
  }, [property.id]);

  // Fetch nearby amenities using Google Places API (New) `Place.searchNearby`
  useEffect(() => {
    if (!placesLib) return;
    let cancelled = false;
    setNearbyLoading(true);

    const fetchNearby = async () => {
      try {
        const { Place } = placesLib;
        const { places } = await Place.searchNearby({
          fields: ['displayName', 'formattedAddress', 'rating'],
          locationRestriction: {
            center: { lat: property.lat, lng: property.lng },
            radius: 1600,
          },
          includedPrimaryTypes: [nearbyCategory],
          maxResultCount: 4,
        });
        if (!cancelled) {
          setNearbyPlaces(
            (places ?? []).map((pl: google.maps.places.Place) => ({
              name: pl.displayName || 'Local Place',
              address: pl.formattedAddress || '',
              rating: pl.rating ?? undefined,
            }))
          );
        }
      } catch (err) {
        const msg = String(err);
        if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT') || msg.includes('429')) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        if (!cancelled) setNearbyPlaces([]);
      } finally {
        if (!cancelled) setNearbyLoading(false);
      }
    };

    void fetchNearby();
    return () => {
      cancelled = true;
    };
  }, [placesLib, property.lat, property.lng, nearbyCategory]);

  const handleComputeCommute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commuteDest.trim()) return;
    setCommuteLoading(true);
    setCommuteError(null);

    try {
      if (!routesLib || !placesLib) {
        throw new Error('Maps services are still loading.');
      }
      // First resolve destination text query using Place.searchByText
      const { Place } = placesLib;
      const searchRes = await Place.searchByText({
        textQuery: commuteDest.trim(),
        fields: ['location', 'displayName'],
        maxResultCount: 1,
      });

      const targetPlace = searchRes.places?.[0];
      if (!targetPlace?.location) {
        setCommuteError('Destination not found. Try a neighborhood, landmark, or full address.');
        setCommuteLoading(false);
        return;
      }

      if (map && routesLib.Route) {
        // Use modern Route.computeRoutes (never legacy DirectionsService)
        const routeLibAny = routesLib as unknown as {
          Route: {
            computeRoutes: (req: unknown) => Promise<{
              routes?: Array<{
                localizedValues?: {
                  distance?: { text?: string };
                  duration?: { text?: string };
                };
                durationMillis?: number;
                distanceMeters?: number;
              }>;
            }>;
          };
        };

        const response = await routeLibAny.Route.computeRoutes({
          origin: { lat: property.lat, lng: property.lng },
          destination: {
            lat: targetPlace.location.lat(),
            lng: targetPlace.location.lng(),
          },
          travelMode: 'DRIVING',
          fields: ['durationMillis', 'distanceMeters', 'localizedValues'],
        });

        const firstRoute = response?.routes?.[0];
        if (firstRoute) {
          const durationText =
            firstRoute.localizedValues?.duration?.text ||
            (firstRoute.durationMillis
              ? `${Math.max(1, Math.round(firstRoute.durationMillis / 60000))} mins`
              : '18 mins');
          const distanceText =
            firstRoute.localizedValues?.distance?.text ||
            (firstRoute.distanceMeters
              ? `${(firstRoute.distanceMeters / 1609.34).toFixed(1)} mi`
              : '4.2 mi');
          setCommuteResult({
            durationText,
            distanceText,
            source: `Via Google Maps Routes to ${targetPlace.displayName || commuteDest}`,
          });
          setCommuteLoading(false);
          return;
        }
      }

      setCommuteError('Unable to calculate route right now.');
    } catch (err) {
      const msg = String(err);
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('OVER_QUERY_LIMIT') || msg.includes('429')) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      setCommuteError('Unable to load route data. Please check your destination or API quota.');
    } finally {
      setCommuteLoading(false);
    }
  };

  const mortgage = calculateMonthlyMortgage({
    homePrice: property.status === 'for_rent' ? property.zestimate || 650000 : property.price,
    downPaymentPct: downPct,
    interestRatePct: interestRate,
    termYears,
    propertyTaxAnnual: property.propertyTaxAnnual || Math.round(property.price * 0.011),
    hoaMonthly: property.hoaFee,
  });

  const comparableHomes = allProperties
    .filter((p) => p.id !== property.id && p.city === property.city)
    .slice(0, 3);

  const handleTourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorEmail.trim()) return;
    onSubmitTour({
      propertyId: property.id,
      propertyAddress: `${property.street}, ${property.city}, ${property.state} ${property.zip}`,
      propertyPrice: property.price,
      propertyImage: property.images[0] || '',
      tourType,
      date: tourDate,
      timeSlot: tourTime,
      name: visitorName.trim(),
      email: visitorEmail.trim(),
      phone: visitorPhone.trim(),
    });
    setTourSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Property details for ${property.street}`}
    >
      <div className="bg-white w-full max-w-6xl h-full sm:h-[92vh] sm:rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Sticky Modal Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-[#006AFF] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to search</span>
          </button>

          <div className="hidden md:block text-xs font-medium text-slate-600 truncate">
            {property.street}
            {property.unit ? ` ${property.unit}` : ''}, {property.city}, {property.state}{' '}
            {property.zip}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleSave(property.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border inline-flex items-center gap-1.5 cursor-pointer ${
                isSaved
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (navigator.clipboard) {
                  void navigator.clipboard.writeText(window.location.href);
                }
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2000);
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer"
            >
              {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{shareCopied ? 'Link copied' : 'Share'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onHideProperty(property.id);
                onClose();
              }}
              className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 items-center gap-1.5 cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Hide</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close property details"
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Media Showcase + Mode Tabs */}
          <div className="bg-slate-950 text-white">
            <div className="px-4 sm:px-6 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="inline-flex items-center gap-1 bg-slate-900 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setMediaTab('photos')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                    mediaTab === 'photos' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Photos ({property.images.length})
                </button>
                {property.has3DTour && (
                  <button
                    type="button"
                    onClick={() => setMediaTab('3d')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                      mediaTab === '3d' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    3D Home Tour
                  </button>
                )}
                {property.hasFloorPlan && (
                  <button
                    type="button"
                    onClick={() => setMediaTab('floorplan')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                      mediaTab === 'floorplan'
                        ? 'bg-white text-slate-900'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Interactive Floor Plan
                  </button>
                )}
              </div>
              <span className="text-xs text-slate-400 tabular-nums">
                MLS #{property.mlsId}
              </span>
            </div>

            {mediaTab === 'photos' && (
              <div className="relative h-64 sm:h-96 bg-slate-900 flex items-center justify-center overflow-hidden">
                <img
                  src={property.images[activePhotoIdx] || property.images[0]}
                  alt={`${property.street} view ${activePhotoIdx + 1}`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                {property.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePhotoIdx(
                          (prev) => (prev - 1 + property.images.length) % property.images.length
                        )
                      }
                      aria-label="Previous property image"
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePhotoIdx((prev) => (prev + 1) % property.images.length)
                      }
                      aria-label="Next property image"
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 px-3 py-1.5 rounded-lg">
                      {property.images.map((img, i) => (
                        <button
                          key={`${img}-${i}`}
                          type="button"
                          onClick={() => setActivePhotoIdx(i)}
                          aria-label={`View photo ${i + 1}`}
                          className={`w-12 h-8 rounded overflow-hidden border-2 cursor-pointer ${
                            i === activePhotoIdx ? 'border-white' : 'border-transparent opacity-60'
                          }`}
                        >
                          <img
                            src={img}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {mediaTab === '3d' && (
              <div className="h-72 sm:h-96 bg-slate-900 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                <img
                  src={property.images[1] || property.images[0]}
                  alt="3D Virtual Walkthrough"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover opacity-35"
                />
                <div className="relative z-10 max-w-md bg-slate-950/85 border border-slate-700 rounded-xl p-6">
                  <Compass className="w-8 h-8 text-[#006AFF] mx-auto mb-2" />
                  <h3 className="text-base font-bold text-white">
                    Zillow 3D Home® Interactive Walkthrough
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5">
                    Explore {property.sqft.toLocaleString()} sq ft across {property.stories} level
                    {property.stories > 1 ? 's' : ''} with room-by-room panoramic captures.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {['Living Area', 'Chef’s Kitchen', 'Primary Suite', 'Exterior Patio'].map(
                      (room, idx) => (
                        <button
                          key={room}
                          type="button"
                          onClick={() => {
                            setActivePhotoIdx(idx % property.images.length);
                            setMediaTab('photos');
                          }}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-[#006AFF] text-white rounded-md cursor-pointer transition-colors"
                        >
                          Jump to {room}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {mediaTab === 'floorplan' && (
              <div className="h-72 sm:h-96 bg-slate-900 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-xl bg-slate-950 border border-slate-700 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">
                      Architectural Floor Plan Summary
                    </span>
                    <span className="text-xs text-slate-400 tabular-nums">
                      {property.sqft.toLocaleString()} total sq ft
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Main Level</div>
                      <div className="font-semibold text-white mt-0.5">
                        Great Room, Kitchen &amp; Dining
                      </div>
                      <div className="text-slate-400 mt-1 tabular-nums">
                        ~{Math.round(property.sqft * 0.52).toLocaleString()} sq ft
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Upper / Bedroom Wing</div>
                      <div className="font-semibold text-white mt-0.5">
                        {property.beds} Bedrooms · {property.baths} Baths
                      </div>
                      <div className="text-slate-400 mt-1 tabular-nums">
                        ~{Math.round(property.sqft * 0.48).toLocaleString()} sq ft
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="text-slate-400">Parking &amp; Lot</div>
                      <div className="font-semibold text-white mt-0.5">
                        {property.garageSpaces > 0
                          ? `${property.garageSpaces}-Car Garage`
                          : `${property.parkingSpaces} Parking`}
                      </div>
                      <div className="text-slate-400 mt-1 tabular-nums">
                        {property.lotSqft > 0
                          ? `${property.lotSqft.toLocaleString()} sq ft lot`
                          : 'Condo / Shared Lot'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Two-Column Detail Grid */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Main Column */}
            <div className="lg:col-span-8 space-y-8">
              {/* Primary Price & Address Header */}
              <section className="pb-6 border-b border-slate-200">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div>
                    <div className="text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums">
                      {formatCurrency(property.price)}
                      {property.status === 'for_rent' && (
                        <span className="text-xl font-medium text-slate-600">/mo</span>
                      )}
                    </div>
                    <p className="text-base font-medium text-slate-800 mt-1.5">
                      {property.street}
                      {property.unit ? ` ${property.unit}` : ''}, {property.city},{' '}
                      {property.state} {property.zip}
                    </p>
                  </div>

                  {property.homeType !== 'lot' && (
                    <div className="flex items-center gap-6 tabular-nums">
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{property.beds}</div>
                        <div className="text-xs text-slate-500">beds</div>
                      </div>
                      <div className="h-8 w-px bg-slate-200" />
                      <div>
                        <div className="text-2xl font-bold text-slate-900">{property.baths}</div>
                        <div className="text-xs text-slate-500">baths</div>
                      </div>
                      <div className="h-8 w-px bg-slate-200" />
                      <div>
                        <div className="text-2xl font-bold text-slate-900">
                          {property.sqft.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">sqft</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Unboxed Key Metadata Strip */}
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 tabular-nums">
                  <span className="font-semibold text-[#006AFF]">
                    {property.status === 'for_rent'
                      ? 'For Rent'
                      : property.status === 'sold'
                      ? 'Sold'
                      : 'For Sale'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Est. {formatCurrency(mortgage.totalMonthly)}/mo</span>
                  {property.zestimate > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>Zestimate®: {formatCurrency(property.zestimate)}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span>{property.daysOnMarket} days on Zillow</span>
                  <span aria-hidden="true">·</span>
                  <span>{property.viewsCount.toLocaleString()} views</span>
                  <span aria-hidden="true">·</span>
                  <span>{property.savesCount} saves</span>
                </div>

                {property.openHouse && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-semibold text-slate-900">
                      <Calendar className="w-4 h-4 text-[#006AFF]" />
                      <span>Open House: {property.openHouse}</span>
                    </div>
                    <span className="text-[#006AFF] font-semibold">Add to schedule</span>
                  </div>
                )}
              </section>

              {/* Overview & What's Special */}
              <section className="pb-6 border-b border-slate-200 space-y-4">
                <h2
                  className="text-xl font-bold text-slate-900"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Overview
                </h2>
                <h3 className="text-base font-semibold text-slate-900">{property.headline}</h3>
                <p className="text-sm leading-relaxed text-slate-700">{property.description}</p>

                {property.whatsSpecial.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-500 mb-2">
                      What’s special
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-medium text-slate-800">
                      {property.whatsSpecial.map((item) => (
                        <span key={item} className="inline-flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#006AFF]" />
                          <span>{item}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Facts and Features */}
              <section className="pb-6 border-b border-slate-200">
                <h2
                  className="text-xl font-bold text-slate-900 mb-4"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Facts &amp; features
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900 pb-1.5 border-b border-slate-100">
                      Interior
                    </h3>
                    <dl className="space-y-2 text-xs">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Heating</dt>
                        <dd className="font-medium text-slate-900 text-right">{property.heating}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Cooling</dt>
                        <dd className="font-medium text-slate-900 text-right">{property.cooling}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Flooring</dt>
                        <dd className="font-medium text-slate-900 text-right">
                          {property.flooring.join(', ') || 'N/A'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Basement</dt>
                        <dd className="font-medium text-slate-900">{property.basement}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Fireplaces</dt>
                        <dd className="font-medium text-slate-900 tabular-nums">
                          {property.fireplaceCount}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Appliances</dt>
                        <dd className="font-medium text-slate-900 text-right">
                          {property.appliances.join(', ') || 'None included'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-slate-900 pb-1.5 border-b border-slate-100">
                      Property &amp; Construction
                    </h3>
                    <dl className="space-y-2 text-xs">
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Home type</dt>
                        <dd className="font-medium text-slate-900">
                          {HOME_TYPE_LABELS[property.homeType]}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Architectural style</dt>
                        <dd className="font-medium text-slate-900">{property.architecturalStyle}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Year built</dt>
                        <dd className="font-medium text-slate-900 tabular-nums">
                          {property.yearBuilt}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Lot size</dt>
                        <dd className="font-medium text-slate-900 tabular-nums">
                          {property.lotSqft > 0
                            ? `${property.lotSqft.toLocaleString()} sq ft`
                            : 'Shared / Condo'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Parking &amp; Garage</dt>
                        <dd className="font-medium text-slate-900 tabular-nums">
                          {property.parkingSpaces} spaces ({property.garageSpaces} garage)
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">HOA fee</dt>
                        <dd className="font-medium text-slate-900 tabular-nums">
                          {property.hoaFee > 0 ? `${formatCurrency(property.hoaFee)}/mo` : 'None'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Price / sq ft</dt>
                        <dd className="font-medium text-slate-900 tabular-nums">
                          {property.sqft > 0 && property.status !== 'for_rent'
                            ? `${formatCurrency(Math.round(property.price / property.sqft))}/sqft`
                            : '—'}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Parcel number</dt>
                        <dd className="font-mono text-slate-900">{property.parcelNumber}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </section>

              {/* Estimated Market Value / Zestimate */}
              {property.zestimate > 0 && (
                <section className="pb-6 border-b border-slate-200">
                  <h2
                    className="text-xl font-bold text-slate-900 mb-3"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Home value &amp; Zestimate®
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div>
                      <div className="text-xs text-slate-500">Zestimate®</div>
                      <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                        {formatCurrency(property.zestimate)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-medium mt-0.5 tabular-nums">
                        +4.1% 1-year forecast
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Estimated sales range</div>
                      <div className="text-base font-semibold text-slate-900 tabular-nums mt-1">
                        {formatCurrency(Math.round(property.zestimate * 0.94))} –{' '}
                        {formatCurrency(Math.round(property.zestimate * 1.06))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Rent Zestimate®</div>
                      <div className="text-base font-semibold text-slate-900 tabular-nums mt-1">
                        {property.rentZestimate > 0
                          ? `${formatCurrency(property.rentZestimate)}/mo`
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Embedded Monthly Payment Calculator */}
              {property.status !== 'for_rent' && (
                <section className="pb-6 border-b border-slate-200">
                  <h2
                    className="text-xl font-bold text-slate-900 mb-4"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Monthly cost &amp; mortgage breakdown
                  </h2>
                  <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <span className="text-xs text-slate-500">Estimated monthly payment</span>
                        <div className="text-2xl font-bold text-slate-900 tabular-nums">
                          {formatCurrency(mortgage.totalMonthly)}/mo
                        </div>
                      </div>
                      <div className="text-xs text-slate-600 tabular-nums">
                        Loan amount: {formatCurrency(mortgage.loanAmount)}
                      </div>
                    </div>

                    {/* Visual Cost Proportion Bar */}
                    <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100">
                      <div
                        style={{
                          width: `${(mortgage.principalAndInterest / mortgage.totalMonthly) * 100}%`,
                        }}
                        className="bg-[#006AFF]"
                        title="Principal & interest"
                      />
                      <div
                        style={{
                          width: `${(mortgage.propertyTax / mortgage.totalMonthly) * 100}%`,
                        }}
                        className="bg-emerald-500"
                        title="Property taxes"
                      />
                      <div
                        style={{
                          width: `${(mortgage.homeInsurance / mortgage.totalMonthly) * 100}%`,
                        }}
                        className="bg-amber-500"
                        title="Home insurance"
                      />
                      {mortgage.hoa > 0 && (
                        <div
                          style={{
                            width: `${(mortgage.hoa / mortgage.totalMonthly) * 100}%`,
                          }}
                          className="bg-violet-500"
                          title="HOA fees"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-xs bg-[#006AFF] shrink-0" />
                        <div>
                          <div className="text-slate-500">Principal &amp; interest</div>
                          <div className="font-semibold text-slate-900">
                            {formatCurrency(mortgage.principalAndInterest)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 shrink-0" />
                        <div>
                          <div className="text-slate-500">Property taxes</div>
                          <div className="font-semibold text-slate-900">
                            {formatCurrency(mortgage.propertyTax)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 shrink-0" />
                        <div>
                          <div className="text-slate-500">Home insurance</div>
                          <div className="font-semibold text-slate-900">
                            {formatCurrency(mortgage.homeInsurance)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-xs bg-violet-500 shrink-0" />
                        <div>
                          <div className="text-slate-500">HOA &amp; PMI</div>
                          <div className="font-semibold text-slate-900">
                            {formatCurrency(mortgage.hoa + mortgage.pmi)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Down payment ({downPct}% · {formatCurrency(mortgage.downPaymentDollar)})
                        </label>
                        <input
                          type="range"
                          min={3}
                          max={50}
                          value={downPct}
                          onChange={(e) => setDownPct(Number(e.target.value))}
                          className="w-full accent-[#006AFF]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Interest rate (%)
                        </label>
                        <input
                          type="number"
                          step="0.05"
                          value={interestRate}
                          onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                          className="w-full h-9 px-3 text-sm border border-slate-300 rounded-lg tabular-nums"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          Loan program
                        </label>
                        <select
                          value={termYears}
                          onChange={(e) => setTermYears(Number(e.target.value))}
                          className="w-full h-9 px-2.5 text-sm border border-slate-300 rounded-lg bg-white"
                        >
                          <option value={30}>30-year fixed</option>
                          <option value={15}>15-year fixed</option>
                          <option value={20}>20-year fixed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Climate Risks */}
              <section className="pb-6 border-b border-slate-200">
                <h2
                  className="text-xl font-bold text-slate-900 mb-3"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Climate risks
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { label: 'Flood Factor', score: property.climateRisks.flood, icon: Droplets },
                    { label: 'Fire Factor', score: property.climateRisks.fire, icon: Flame },
                    { label: 'Wind Factor', score: property.climateRisks.wind, icon: Wind },
                    { label: 'Heat Factor', score: property.climateRisks.heat, icon: Sun },
                    { label: 'Air Factor', score: property.climateRisks.air, icon: ShieldAlert },
                  ].map((risk) => {
                    const Icon = risk.icon;
                    const level =
                      risk.score <= 2 ? 'Minimal' : risk.score <= 5 ? 'Moderate' : 'Major';
                    return (
                      <div
                        key={risk.label}
                        className="p-3 rounded-lg border border-slate-200 bg-slate-50"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                          <Icon className="w-3.5 h-3.5 text-slate-500" />
                          <span>{risk.label}</span>
                        </div>
                        <div className="mt-1.5 text-base font-bold text-slate-900 tabular-nums">
                          {risk.score}/10
                        </div>
                        <div className="text-[11px] font-medium text-slate-600">{level}</div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Price and Tax History */}
              <section className="pb-6 border-b border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Price &amp; tax history
                  </h2>
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setHistoryTab('price')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                        historyTab === 'price' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Price history
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistoryTab('tax')}
                      className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                        historyTab === 'tax' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Tax history
                    </button>
                  </div>
                </div>

                {historyTab === 'price' ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Date</th>
                          <th className="py-2.5 px-3 font-semibold">Event</th>
                          <th className="py-2.5 px-3 font-semibold">Price</th>
                          <th className="py-2.5 px-3 font-semibold">Source</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 tabular-nums">
                        {property.priceHistory.map((row, idx) => (
                          <tr key={idx}>
                            <td className="py-2.5 px-3 text-slate-700">{row.date}</td>
                            <td className="py-2.5 px-3 font-medium text-slate-900">{row.event}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-900">
                              {formatCurrency(row.price)}
                              {row.pricePerSqft ? ` ($${row.pricePerSqft}/sqft)` : ''}
                            </td>
                            <td className="py-2.5 px-3 text-slate-500">{row.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    {property.taxHistory.length > 0 ? (
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                          <tr>
                            <th className="py-2.5 px-3 font-semibold">Year</th>
                            <th className="py-2.5 px-3 font-semibold">Property Taxes</th>
                            <th className="py-2.5 px-3 font-semibold">Tax Assessment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 tabular-nums">
                          {property.taxHistory.map((row) => (
                            <tr key={row.year}>
                              <td className="py-2.5 px-3 font-medium text-slate-900">{row.year}</td>
                              <td className="py-2.5 px-3 text-slate-700">
                                {formatCurrency(row.propertyTaxes)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                {formatCurrency(row.taxAssessment)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="p-4 text-xs text-slate-500">
                        Tax assessment history is not applicable for this rental unit.
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* Schools, Walk/Transit/Bike Scores, Commute & Nearby Places */}
              <section className="pb-6 border-b border-slate-200 space-y-6">
                <h2
                  className="text-xl font-bold text-slate-900"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  Neighborhood, schools &amp; commute
                </h2>

                {/* Walk/Transit/Bike Scores */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="text-xs text-slate-500">Walk Score®</div>
                    <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                      {property.walkScore} / 100
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="text-xs text-slate-500">Transit Score®</div>
                    <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                      {property.transitScore} / 100
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="text-xs text-slate-500">Bike Score®</div>
                    <div className="text-xl font-bold text-slate-900 tabular-nums mt-0.5">
                      {property.bikeScore} / 100
                    </div>
                  </div>
                </div>

                {/* GreatSchools */}
                {property.schools.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-2.5">
                      <GraduationCap className="w-4 h-4 text-[#006AFF]" />
                      <span>Assigned &amp; Nearby GreatSchools®</span>
                    </div>
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                      {property.schools.map((sc) => (
                        <div
                          key={sc.name}
                          className="px-4 py-3 flex items-center justify-between text-xs bg-white"
                        >
                          <div>
                            <div className="font-semibold text-slate-900">{sc.name}</div>
                            <div className="text-slate-500 mt-0.5">
                              {sc.type} · Grades {sc.grades} · {sc.distanceMi} mi away
                            </div>
                          </div>
                          <div className="text-right tabular-nums">
                            <span className="font-bold text-sm text-[#006AFF]">{sc.rating}/10</span>
                            <div className="text-[11px] text-slate-500">Rating</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Real Google Maps Commute Calculator */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Car className="w-4 h-4 text-[#006AFF]" />
                    <span>Commute Time Calculator</span>
                  </div>
                  <form onSubmit={handleComputeCommute} className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={commuteDest}
                      onChange={(e) => setCommuteDest(e.target.value)}
                      placeholder="Enter work address or landmark"
                      className="flex-1 h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#006AFF]"
                    />
                    <button
                      type="submit"
                      disabled={commuteLoading}
                      className="px-4 h-10 text-xs font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shrink-0"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{commuteLoading ? 'Calculating...' : 'Calculate commute'}</span>
                    </button>
                  </form>
                  {commuteResult && (
                    <div className="p-3 rounded-lg bg-white border border-slate-200 flex items-center justify-between text-xs">
                      <span className="text-slate-600">{commuteResult.source}</span>
                      <span className="font-bold text-slate-900 tabular-nums">
                        {commuteResult.durationText} ({commuteResult.distanceText})
                      </span>
                    </div>
                  )}
                  {commuteError && <p className="text-xs text-rose-600">{commuteError}</p>}
                </div>

                {/* Real Google Maps Nearby Places */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      <MapPin className="w-4 h-4 text-[#006AFF]" />
                      <span>Explore nearby places</span>
                    </div>
                    <div className="inline-flex gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      {(
                        [
                          { id: 'supermarket', label: 'Grocery' },
                          { id: 'school', label: 'Schools' },
                          { id: 'park', label: 'Parks' },
                          { id: 'transit_station', label: 'Transit' },
                        ] as const
                      ).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setNearbyCategory(cat.id)}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer ${
                            nearbyCategory === cat.id
                              ? 'bg-white text-[#006AFF] shadow-xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {nearbyLoading ? (
                    <div className="text-xs text-slate-500 py-3">Loading nearby places...</div>
                  ) : nearbyPlaces.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {nearbyPlaces.map((pl, idx) => (
                        <div
                          key={`${pl.name}-${idx}`}
                          className="p-3 rounded-lg border border-slate-200 bg-white text-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900 truncate">{pl.name}</span>
                            {pl.rating && (
                              <span className="font-semibold text-amber-600 tabular-nums shrink-0">
                                {pl.rating.toFixed(1)} ★
                              </span>
                            )}
                          </div>
                          {pl.address && (
                            <div className="text-slate-500 mt-0.5 truncate">{pl.address}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      Select a category above to view nearby neighborhood amenities.
                    </div>
                  )}
                </div>
              </section>

              {/* Comparable Homes Nearby */}
              {comparableHomes.length > 0 && (
                <section>
                  <h2
                    className="text-xl font-bold text-slate-900 mb-3"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Similar homes in {property.city}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {comparableHomes.map((comp) => (
                      <button
                        key={comp.id}
                        type="button"
                        onClick={() => onSelectProperty(comp)}
                        className="text-left rounded-xl border border-slate-200 overflow-hidden hover:border-[#006AFF] transition-colors cursor-pointer bg-white"
                      >
                        <div className="aspect-[4/3] bg-slate-100">
                          {comp.images[0] ? (
                            <img
                              src={comp.images[0]}
                              alt={comp.street}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Home className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <div className="text-sm font-bold text-slate-900 tabular-nums">
                            {formatCurrency(comp.price)}
                            {comp.status === 'for_rent' ? '/mo' : ''}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5 tabular-nums">
                            {comp.beds} bd · {comp.baths} ba · {comp.sqft.toLocaleString()} sqft
                          </div>
                          <div className="text-xs font-medium text-slate-800 truncate mt-1">
                            {comp.street}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Right Sticky Sidebar: Tour & Contact Agent */}
            <aside className="lg:col-span-4 space-y-5">
              <div className="sticky top-4 space-y-5">
                {/* Request a Tour Card */}
                <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-3">Request a tour</h3>
                  {tourSubmitted ? (
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                      <div className="font-bold flex items-center gap-1.5">
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span>Tour request confirmed</span>
                      </div>
                      <p>
                        {tourType} tour for {property.street} on {tourDate} at {tourTime}. Added to
                        your Saved Homes &amp; Tours panel.
                      </p>
                      <button
                        type="button"
                        onClick={() => setTourSubmitted(false)}
                        className="text-emerald-800 font-semibold underline cursor-pointer pt-1"
                      >
                        Schedule another time
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleTourSubmit} className="space-y-3">
                      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                        {(['In-person', 'Video chat'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setTourType(t)}
                            className={`py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                              tourType === t ? 'bg-white text-[#006AFF] shadow-xs' : 'text-slate-600'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Preferred date
                          </label>
                          <input
                            type="date"
                            required
                            value={tourDate}
                            onChange={(e) => setTourDate(e.target.value)}
                            className="w-full h-9 px-2.5 text-xs border border-slate-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-600 mb-1">
                            Time slot
                          </label>
                          <select
                            value={tourTime}
                            onChange={(e) => setTourTime(e.target.value)}
                            className="w-full h-9 px-2 text-xs border border-slate-300 rounded-lg bg-white"
                          >
                            <option>9:30 AM</option>
                            <option>11:00 AM</option>
                            <option>1:30 PM</option>
                            <option>3:00 PM</option>
                            <option>5:00 PM</option>
                          </select>
                        </div>
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Full name"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg"
                      />
                      <input
                        type="email"
                        required
                        placeholder="Email address"
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                        className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg"
                      />
                      <input
                        type="tel"
                        placeholder="Phone number (optional)"
                        value={visitorPhone}
                        onChange={(e) => setVisitorPhone(e.target.value)}
                        className="w-full h-9 px-3 text-xs border border-slate-300 rounded-lg"
                      />

                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg cursor-pointer transition-colors"
                      >
                        Request a tour
                      </button>
                    </form>
                  )}
                </div>

                {/* Listing Agent Attribution & Contact */}
                <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="text-xs font-semibold text-slate-500">Listed by</div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{property.agent.name}</div>
                    <div className="text-xs text-slate-600">{property.agent.brokerage}</div>
                    <div className="text-xs text-slate-500 mt-1 tabular-nums">
                      {property.agent.phone} · {property.agent.license}
                    </div>
                  </div>
                  {agentContacted ? (
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-emerald-700 font-medium">
                      Message sent to {property.agent.name}. Expect a reply shortly.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAgentContacted(true)}
                      className="w-full py-2 px-4 text-xs font-semibold text-[#006AFF] bg-white hover:bg-blue-50 border border-[#006AFF] rounded-lg cursor-pointer transition-colors"
                    >
                      Contact agent
                    </button>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};
