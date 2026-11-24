import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { ArrowLeft, ArrowUpDown } from 'lucide-react';
import { AgentFinderView } from './components/AgentFinderView';
import { HomeLoansView } from './components/HomeLoansView';
import { PropertyCard } from './components/PropertyCard';
import { PropertyDetailModal } from './components/PropertyDetailModal';
import { SavedHomesDrawer } from './components/SavedHomesDrawer';
import { SearchFilterBar } from './components/SearchFilterBar';
import { SellZestimateView } from './components/SellZestimateView';
import { TopNav, UtilityModalType } from './components/TopNav';
import { ZillowHomepage } from './components/ZillowHomepage';
import { ZillowOverviewAndFooter } from './components/ZillowOverviewAndFooter';
import { ZillowUtilityModal } from './components/ZillowUtilityModal';
import { DEFAULT_FILTERS, MARKET_HUBS, PROPERTIES } from './data/properties';
import {
  AppSection,
  FilterState,
  Property,
  SavedSearch,
  SortOption,
  TourRequest,
} from './types/realEstate';
import { filterProperties } from './utils/propertyFilters';

export default function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [activeSection, setActiveSection] = useState<AppSection>('home');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [searchQuery, setSearchQuery] = useState('');
  const searchHub = MARKET_HUBS.find((h) => h.city.toLowerCase() === searchQuery.trim().toLowerCase());
  const locationLabel = searchHub
    ? `${searchHub.city}, ${searchHub.state}`
    : searchQuery.trim() || 'South Carolina';


  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Saved Homes, Hidden Homes, Saved Searches, Scheduled Tours, Account & Utility Modals
  const [savedIds, setSavedIds] = useState<string[]>(['prop-sea-1', 'prop-sf-1']);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    {
      id: 'ss-init-1',
      name: 'Charleston 3+ Bed Homes',
      locationLabel: 'Charleston, SC',
      filters: { ...DEFAULT_FILTERS, status: 'for_sale', bedsMin: 3 },
      frequency: 'Daily',
      createdAt: '2026-11-20',
    },
  ]);
  const [tourRequests, setTourRequests] = useState<TourRequest[]>([]);
  const [savedDrawerOpen, setSavedDrawerOpen] = useState(false);
  const [utilityModal, setUtilityModal] = useState<UtilityModalType>(null);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);

  // Listen for Google Maps Platform quota exhaustion events (Tier 1 & Tier 2)
  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  const hiddenSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);
  const savedSet = useMemo(() => new Set(savedIds), [savedIds]);

  const filteredProperties = useMemo(
    () => filterProperties(PROPERTIES, filters, searchQuery, null, hiddenSet),
    [filters, searchQuery, hiddenSet]
  );

  const savedProperties = useMemo(
    () => PROPERTIES.filter((p) => savedSet.has(p.id)),
    [savedSet]
  );

  const handleSelectSection = useCallback((section: AppSection) => {
    setActiveSection(section);
    if (section === 'buy') {
      setFilters((prev) => ({
        ...prev,
        status: 'for_sale',
        priceMin: null,
        priceMax: null,
      }));
    } else if (section === 'rent') {
      setFilters((prev) => ({
        ...prev,
        status: 'for_rent',
        priceMin: null,
        priceMax: null,
      }));
    }
  }, []);

  const handleNavigateWithFilters = useCallback(
    (section: AppSection, patch: Partial<FilterState>) => {
      setActiveSection(section);
      setFilters((prev) => ({
        ...DEFAULT_FILTERS,
        ...patch,
        searchInBounds: false,
      }));
      if (patch.status) {
        setSearchQuery('');
      }
    },
    []
  );

  const handleUpdateFilters = useCallback((patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setFilters((prev) => ({
      ...DEFAULT_FILTERS,
      status: prev.status,
    }));
  }, []);

  const handleSelectCityHub = useCallback((hubId: string) => {
    const hub = MARKET_HUBS.find((h) => h.id === hubId);
    if (!hub) return;
    setActiveSection((prev) => (prev === 'rent' ? 'rent' : 'buy'));
    setSearchQuery(hub.city);
  }, []);

  const handlePlaceViewportSelected = useCallback(
    (
      _location: { lat: number; lng: number },
      _bounds: { north: number; south: number; east: number; west: number } | null,
      label: string
    ) => {
      setSearchQuery(label.split(',')[0]);
      setActiveSection('buy');
    },
    []
  );

  const handleHeroSearchSubmit = useCallback((q: string) => {
    setSearchQuery(q);
    setFilters((prev) => ({
      ...prev,
      status: 'for_sale',
      searchInBounds: false,
    }));
    setActiveSection('buy');
  }, []);

  const handleExploreWithMaxPrice = useCallback((maxPrice: number) => {
    setFilters((prev) => ({
      ...prev,
      status: 'for_sale',
      priceMin: null,
      priceMax: maxPrice,
      searchInBounds: false,
    }));
    setSearchQuery('');
    setActiveSection('buy');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleToggleSave = useCallback((id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleHideProperty = useCallback((id: string) => {
    setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const handleSaveSearch = useCallback(
    (name: string, frequency: 'Instant' | 'Daily' | 'Weekly') => {
      const next: SavedSearch = {
        id: `ss-${Date.now()}`,
        name,
        locationLabel,
        filters: { ...filters },
        frequency,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setSavedSearches((prev) => [next, ...prev]);
    },
    [filters, locationLabel]
  );

  const handleApplySavedSearch = useCallback((search: SavedSearch) => {
    setFilters(search.filters);
    setActiveSection(search.filters.status === 'for_rent' ? 'rent' : 'buy');
    const matchedHub = MARKET_HUBS.find((h) =>
      search.locationLabel.toLowerCase().includes(h.city.toLowerCase())
    );
    setSearchQuery(
      matchedHub?.city ?? (search.locationLabel === 'South Carolina' ? '' : search.locationLabel)
    );
  }, []);

  const handleSubmitTour = useCallback((tour: Omit<TourRequest, 'id' | 'createdAt'>) => {
    const record: TourRequest = {
      ...tour,
      id: `tour-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTourRequests((prev) => [record, ...prev]);
  }, []);

  const isSearchActive = activeSection === 'buy' || activeSection === 'rent';

  return (
    <APIProvider
      apiKey={apiKey}
      libraries={['places', 'marker', 'routes']}
      language="en"
      region="US"
    >
      <div id="top" className="min-h-screen flex flex-col bg-white text-slate-900">
        {/* Google Maps Demo Key Quota Banner */}
        {apiKey && quotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
            <span>
              Google Maps Platform quota reached. If you are the app owner, visit{' '}
              <a
                href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-800"
              >
                maps developer site
              </a>{' '}
              for instructions to update your account.
            </span>
          </div>
        )}

        <TopNav
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          onNavigateWithFilters={handleNavigateWithFilters}
          savedCount={savedIds.length}
          toursCount={tourRequests.length}
          onOpenSavedDrawer={() => setSavedDrawerOpen(true)}
          onOpenUtilityModal={setUtilityModal}
          signedInEmail={signedInEmail}
        />

        {/* Zillow.com Start-to-Finish Homepage */}
        {activeSection === 'home' && (
          <main className="flex-1">
            <ZillowHomepage
              savedIds={savedSet}
              onSearchSubmit={handleHeroSearchSubmit}
              onSelectCityHub={handleSelectCityHub}
              onPlaceViewportSelected={handlePlaceViewportSelected}
              onSelectSection={handleSelectSection}
              onExploreWithMaxPrice={handleExploreWithMaxPrice}
              onToggleSave={handleToggleSave}
              onHideProperty={handleHideProperty}
              onSelectProperty={setSelectedProperty}
              onOpenUtilityModal={setUtilityModal}
              signedInEmail={signedInEmail}
            />
          </main>
        )}

        {/* Buy / Rent Search */}
        {isSearchActive && (
          <>
            <SearchFilterBar
              filters={filters}
              searchQuery={searchQuery}
              locationLabel={locationLabel}
              onSearchQueryChange={setSearchQuery}
              onSelectCityHub={handleSelectCityHub}
              onPlaceViewportSelected={handlePlaceViewportSelected}
              onUpdateFilters={handleUpdateFilters}
              onResetFilters={handleResetFilters}
              onSaveSearch={handleSaveSearch}
            />

            {/* Property Listings */}
            <main className="flex-1 border-b border-slate-200">
              <div className="max-w-[1400px] mx-auto bg-white">
                <div className="p-4 sm:p-5 space-y-4">
                  {/* Results Header & Sort */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <button
                        type="button"
                        onClick={() => handleSelectSection('home')}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#006AFF] hover:underline mb-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-3 h-3" />
                        <span>Zillow Home</span>
                      </button>
                      <h1 className="text-lg font-bold text-slate-900">
                        {locationLabel}{' '}
                        {filters.status === 'for_rent'
                          ? 'Rentals & Apartments'
                          : filters.status === 'sold'
                          ? 'Recently Sold Homes'
                          : 'Real Estate & Homes For Sale'}
                      </h1>
                      <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                        {filteredProperties.length}{' '}
                        {filteredProperties.length === 1 ? 'result' : 'results'}
                        {hiddenIds.length > 0 && (
                          <>
                            {' '}
                            ·{' '}
                            <button
                              type="button"
                              onClick={() => setHiddenIds([])}
                              className="text-[#006AFF] hover:underline cursor-pointer"
                            >
                              Restore {hiddenIds.length} hidden
                            </button>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      <select
                        value={filters.sortBy}
                        onChange={(e) =>
                          handleUpdateFilters({ sortBy: e.target.value as SortOption })
                        }
                        aria-label="Sort listings"
                        className="h-9 px-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#006AFF]"
                      >
                        <option value="recommended">Sort: Homes for You</option>
                        <option value="price_high">Price (High to Low)</option>
                        <option value="price_low">Price (Low to High)</option>
                        <option value="newest">Newest</option>
                        <option value="beds_high">Bedrooms</option>
                        <option value="sqft_high">Square Feet</option>
                        <option value="price_sqft_low">Price / Sq Ft</option>
                      </select>
                    </div>
                  </div>

                  {/* Property Cards Grid */}
                  {filteredProperties.length === 0 ? (
                    <div className="py-16 px-4 text-center space-y-3 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <p className="text-base font-bold text-slate-900">
                        No matching homes
                      </p>
                      <p className="text-xs text-slate-600 max-w-sm mx-auto">
                        Try another city or clear some active filters.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          Reset filters
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredProperties.map((property) => (
                        <PropertyCard
                          key={property.id}
                          property={property}
                          isSaved={savedSet.has(property.id)}
                          isHovered={hoveredPropertyId === property.id}
                          onToggleSave={handleToggleSave}
                          onHideProperty={handleHideProperty}
                          onHover={setHoveredPropertyId}
                          onSelect={setSelectedProperty}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </main>
          </>
        )}

        {/* Dedicated Zillow Sections */}
        {activeSection === 'sell' && (
          <main className="flex-1">
            <SellZestimateView onNavigateAgents={() => handleSelectSection('agents')} />
          </main>
        )}

        {activeSection === 'loans' && (
          <main className="flex-1">
            <HomeLoansView />
          </main>
        )}

        {activeSection === 'agents' && (
          <main className="flex-1">
            <AgentFinderView />
          </main>
        )}

        {/* Zillow.com 4 Horizontal Dropdowns & Full Directory Footer */}
        <ZillowOverviewAndFooter
          onSelectCityHub={handleSelectCityHub}
          onSelectSection={handleSelectSection}
          onNavigateWithFilters={handleNavigateWithFilters}
          onSwitchToRent={() => handleSelectSection('rent')}
          onOpenUtilityModal={setUtilityModal}
        />

        {/* Comprehensive Property Details Modal */}
        {selectedProperty && (
          <PropertyDetailModal
            property={selectedProperty}
            allProperties={PROPERTIES}
            isSaved={savedSet.has(selectedProperty.id)}
            onClose={() => setSelectedProperty(null)}
            onToggleSave={handleToggleSave}
            onHideProperty={handleHideProperty}
            onSelectProperty={setSelectedProperty}
            onSubmitTour={handleSubmitTour}
          />
        )}

        {/* Saved Homes, Saved Searches & Scheduled Tours Drawer */}
        <SavedHomesDrawer
          isOpen={savedDrawerOpen}
          onClose={() => setSavedDrawerOpen(false)}
          savedProperties={savedProperties}
          savedSearches={savedSearches}
          tourRequests={tourRequests}
          onRemoveSavedHome={handleToggleSave}
          onSelectProperty={setSelectedProperty}
          onApplySavedSearch={handleApplySavedSearch}
          onRemoveSavedSearch={(id) =>
            setSavedSearches((prev) => prev.filter((s) => s.id !== id))
          }
          onCancelTour={(id) =>
            setTourRequests((prev) => prev.filter((t) => t.id !== id))
          }
        />

        {/* Utility Modals for Manage Rentals, Advertise, Help, Sign In */}
        <ZillowUtilityModal
          modalType={utilityModal}
          signedInEmail={signedInEmail}
          onClose={() => setUtilityModal(null)}
          onSignIn={setSignedInEmail}
          onSignOut={() => setSignedInEmail(null)}
          onNavigateRentals={() => handleSelectSection('rent')}
          onNavigateAgents={() => handleSelectSection('agents')}
        />
      </div>
    </APIProvider>
  );
}
