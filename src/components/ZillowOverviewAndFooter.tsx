import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Home, Smartphone } from 'lucide-react';
import { MARKET_HUBS } from '../data/properties';
import { AppSection, FilterState } from '../types/realEstate';
import { formatCurrency } from '../utils/propertyFilters';
import { UtilityModalType } from './TopNav';

interface ZillowOverviewAndFooterProps {
  onSelectCityHub: (hubId: string) => void;
  onSelectSection: (section: AppSection) => void;
  onNavigateWithFilters?: (section: AppSection, patch: Partial<FilterState>) => void;
  onSwitchToRent: () => void;
  onOpenUtilityModal: (modal: UtilityModalType) => void;
}

interface DirectoryItem {
  label: string;
  sublabel?: string;
  hubId?: string;
  isRent?: boolean;
  section?: AppSection;
  filterPatch?: Partial<FilterState>;
}

interface DirectoryGroup {
  id: string;
  title: string;
  items: DirectoryItem[];
}

const FOOTER_DROPDOWNS: DirectoryGroup[] = [
  {
    id: 'real_estate',
    title: 'Real Estate',
    items: [
      ...MARKET_HUBS.map((hub) => ({
        label: `${hub.city} real estate`,
        sublabel: `${formatCurrency(hub.medianPrice)} median · ${hub.yoyChangePct >= 0 ? '+' : ''}${hub.yoyChangePct.toFixed(1)}% YoY`,
        hubId: hub.id,
      })),
      { label: 'Homes for sale near me', section: 'buy' },
      { label: 'New construction homes', section: 'buy', filterPatch: { status: 'for_sale', saleSubtypes: ['new_construction'] } },
      { label: 'Foreclosure homes', section: 'buy', filterPatch: { status: 'for_sale', saleSubtypes: ['foreclosure'] } },
      { label: 'Open houses', section: 'buy', filterPatch: { status: 'for_sale', mustHaveOpenHouse: true } },
    ],
  },
  {
    id: 'rentals',
    title: 'Rentals',
    items: [
      { label: 'Seattle apartments for rent', hubId: 'seattle', isRent: true },
      { label: 'San Francisco apartments for rent', hubId: 'san-francisco', isRent: true },
      { label: 'Austin homes for rent', hubId: 'austin', isRent: true },
      { label: 'New York apartments for rent', hubId: 'new-york', isRent: true },
      { label: 'Miami condos for rent', hubId: 'miami', isRent: true },
      { label: 'Chicago apartments for rent', hubId: 'chicago', isRent: true },
      { label: 'Pet-friendly rentals', section: 'rent', filterPatch: { status: 'for_rent', petsDogs: true } },
      { label: 'Houses for rent', section: 'rent', filterPatch: { status: 'for_rent', homeTypes: ['house'] } },
    ],
  },
  {
    id: 'mortgage_rates',
    title: 'Mortgage Rates',
    items: [
      { label: 'Current mortgage rates', section: 'loans' },
      { label: '30-year fixed mortgage rates', section: 'loans' },
      { label: '15-year fixed mortgage rates', section: 'loans' },
      { label: 'FHA & VA loan rates', section: 'loans' },
      { label: 'Refinance mortgage rates', section: 'loans' },
      { label: 'BuyAbility℠ affordability tool', section: 'loans' },
      { label: 'Monthly mortgage calculator', section: 'loans' },
      { label: 'Get pre-qualified', section: 'loans' },
    ],
  },
  {
    id: 'browse_homes',
    title: 'Browse Homes',
    items: [
      { label: 'Seattle homes for sale', hubId: 'seattle' },
      { label: 'San Francisco homes for sale', hubId: 'san-francisco' },
      { label: 'Austin homes for sale', hubId: 'austin' },
      { label: 'New York City homes for sale', hubId: 'new-york' },
      { label: 'Miami homes for sale', hubId: 'miami' },
      { label: 'Chicago homes for sale', hubId: 'chicago' },
      { label: 'Recently sold homes', section: 'buy', filterPatch: { status: 'sold' } },
      { label: 'Check your home Zestimate®', section: 'sell' },
      { label: 'Find a local Premier Agent', section: 'agents' },
    ],
  },
];

export const ZillowOverviewAndFooter: React.FC<ZillowOverviewAndFooterProps> = ({
  onSelectCityHub,
  onSelectSection,
  onNavigateWithFilters,
  onSwitchToRent,
  onOpenUtilityModal,
}) => {
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);

  const activeGroup = FOOTER_DROPDOWNS.find((g) => g.id === openCategoryId);

  const handleDirectoryClick = (item: DirectoryItem) => {
    if (item.isRent) {
      onSwitchToRent();
    }
    if (item.hubId) {
      onSelectCityHub(item.hubId);
    } else if (item.section && item.filterPatch && onNavigateWithFilters) {
      onNavigateWithFilters(item.section, item.filterPatch);
    } else if (item.section) {
      onSelectSection(item.section);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white">
      {/* 1. Zillow.com 4 Horizontal Dropdown Category Triggers */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 border-b border-slate-200">
          {FOOTER_DROPDOWNS.map((group) => {
            const isOpen = openCategoryId === group.id;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setOpenCategoryId(isOpen ? null : group.id)}
                aria-expanded={isOpen}
                className="py-4 px-4 flex items-center justify-center gap-2 text-sm font-bold text-[#2A2A33] hover:text-[#006AFF] transition-colors cursor-pointer"
              >
                <span>{group.title}</span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#006AFF]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#006AFF]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Expandable Directory Grid */}
        {activeGroup && (
          <div className="py-6 px-2 border-b border-slate-200 bg-slate-50/70">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {activeGroup.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleDirectoryClick(item)}
                  className="text-left px-3 py-2 rounded-lg hover:bg-white hover:shadow-xs transition-all cursor-pointer"
                >
                  <div className="text-xs font-semibold text-[#006AFF] hover:underline">
                    {item.label}
                  </div>
                  {item.sublabel && (
                    <div className="text-[11px] text-[#596B82] mt-0.5 tabular-nums">
                      {item.sublabel}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Corporate Links & Zillow Group Brands */}
      <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-6 space-y-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-xs text-[#2A2A33]">
          {[
            { label: 'About', action: () => onSelectSection('home') },
            { label: 'Zestimates', action: () => onSelectSection('sell') },
            { label: 'Research', action: () => onSelectSection('buy') },
            { label: 'Careers', action: () => onOpenUtilityModal('help') },
            { label: 'Careers - U.S. Privacy Notice', action: () => onOpenUtilityModal('help') },
            { label: 'Help', action: () => onOpenUtilityModal('help') },
            { label: 'Advertise', action: () => onOpenUtilityModal('advertise') },
            { label: 'Fair Housing Guide', action: () => onOpenUtilityModal('help') },
            { label: 'Advocacy', action: () => onSelectSection('home') },
            { label: 'Terms of use', action: () => onOpenUtilityModal('help') },
            { label: 'Privacy Notice', action: () => onOpenUtilityModal('help') },
            { label: 'Cookie Preference', action: () => onOpenUtilityModal('help') },
            { label: 'Learn', action: () => onSelectSection('loans') },
            { label: 'AI', action: () => onSelectSection('home') },
            { label: 'Mobile Apps', action: () => onSelectSection('home') },
          ].map((lnk) => (
            <button
              key={lnk.label}
              type="button"
              onClick={lnk.action}
              className="hover:text-[#006AFF] hover:underline cursor-pointer"
            >
              {lnk.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#2A2A33]">
          <button
            type="button"
            onClick={() => onSelectSection('buy')}
            className="hover:text-[#006AFF] hover:underline cursor-pointer"
          >
            Trulia
          </button>
          <button
            type="button"
            onClick={() => onSelectCityHub('new-york')}
            className="hover:text-[#006AFF] hover:underline cursor-pointer"
          >
            StreetEasy
          </button>
          <button
            type="button"
            onClick={() => onSwitchToRent()}
            className="hover:text-[#006AFF] hover:underline cursor-pointer"
          >
            HotPads
          </button>
          <button
            type="button"
            onClick={() => onSelectSection('buy')}
            className="hover:text-[#006AFF] hover:underline cursor-pointer"
          >
            Out East
          </button>
          <button
            type="button"
            onClick={() => onSelectSection('agents')}
            className="hover:text-[#006AFF] hover:underline cursor-pointer"
          >
            ShowingTime+
          </button>
        </div>

        <div>
          <button
            type="button"
            onClick={() => onOpenUtilityModal('help')}
            className="text-xs font-semibold text-[#006AFF] hover:underline cursor-pointer"
          >
            Do Not Sell or Share My Personal Information →
          </button>
        </div>

        <hr className="border-slate-200 max-w-4xl mx-auto" />

        {/* 3. Accessibility & Real Estate Licensing Disclosures */}
        <div className="max-w-3xl mx-auto space-y-2.5 text-[11px] text-[#596B82] leading-relaxed">
          <p>
            Zillow Group is committed to ensuring digital accessibility for individuals with
            disabilities. We are continuously working to improve the accessibility of our web
            experience for everyone, and we welcome feedback and accommodation requests. If you
            wish to report an issue or seek an accommodation, please{' '}
            <button
              type="button"
              onClick={() => onOpenUtilityModal('help')}
              className="text-[#006AFF] underline cursor-pointer"
            >
              let us know
            </button>
            .
          </p>
          <p>
            Zillow, Inc. holds real estate brokerage licenses in multiple states. Zillow (Canada),
            Inc. holds real estate brokerage licenses in multiple provinces. Interactive maps,
            address autocomplete, neighborhood places, and commute routing use Google Maps Platform
            services.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[#006AFF]">
            <button
              type="button"
              onClick={() => onOpenUtilityModal('help')}
              className="hover:underline cursor-pointer"
            >
              § 442-H New York Standard Operating Procedures
            </button>
            <button
              type="button"
              onClick={() => onOpenUtilityModal('help')}
              className="hover:underline cursor-pointer"
            >
              New York Fair Housing Notice
            </button>
            <button
              type="button"
              onClick={() => onOpenUtilityModal('help')}
              className="hover:underline cursor-pointer"
            >
              TREC: Information about brokerage services, Consumer protection notice
            </button>
          </div>
          <p>California DRE #1522444</p>
        </div>

        {/* 4. App Store Badges & Zillow Social Row */}
        <div className="pt-2 flex flex-col items-center gap-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onOpenUtilityModal('help')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111827] text-white text-left hover:bg-slate-800 cursor-pointer"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <div className="leading-tight">
                <div className="text-[9px] text-slate-300">Download on the</div>
                <div className="text-xs font-bold">App Store</div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => onOpenUtilityModal('help')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111827] text-white text-left hover:bg-slate-800 cursor-pointer"
            >
              <Smartphone className="w-4 h-4 shrink-0" />
              <div className="leading-tight">
                <div className="text-[9px] text-slate-300">GET IT ON</div>
                <div className="text-xs font-bold">Google Play</div>
              </div>
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-[#596B82]">
            <div
              className="inline-flex items-center gap-1.5 text-lg font-extrabold text-[#006AFF]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10.5Z"
                  fill="#006AFF"
                />
                <path
                  d="M8 16.5L16 11H9L15.6 16.5H8Z"
                  stroke="white"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Zillow</span>
            </div>

            <div className="flex items-center gap-2">
              <span>Follow us:</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#006AFF]">
                <button type="button" onClick={() => onOpenUtilityModal('help')} className="hover:underline cursor-pointer">
                  Facebook
                </button>
                <span className="text-slate-300">·</span>
                <button type="button" onClick={() => onOpenUtilityModal('help')} className="hover:underline cursor-pointer">
                  Instagram
                </button>
                <span className="text-slate-300">·</span>
                <button type="button" onClick={() => onOpenUtilityModal('help')} className="hover:underline cursor-pointer">
                  TikTok
                </button>
                <span className="text-slate-300">·</span>
                <button type="button" onClick={() => onOpenUtilityModal('help')} className="hover:underline cursor-pointer">
                  X
                </button>
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5">
              <span>© 2006–2026 Zillow</span>
              <Home className="w-3.5 h-3.5 text-[#2A2A33]" aria-hidden="true" />
              <span>Equal Housing Opportunity</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Iconic Colorful Zillow Architectural Footer Art Strip */}
      <div className="w-full overflow-hidden pt-2 bg-white">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="w-full h-20 sm:h-28"
          preserveAspectRatio="none"
        >
          {/* Soft ground hills */}
          <path d="M0 120V106C220 94 460 112 720 100C980 88 1220 110 1440 98V120H0Z" fill="#E8F1FF" />
          {/* Left cottages & trees */}
          <rect x="34" y="64" width="64" height="56" fill="#DBEAFE" />
          <path d="M26 64L66 36L106 64H26Z" fill="#006AFF" />
          <rect x="58" y="86" width="16" height="34" fill="#1E293B" />
          <circle cx="122" cy="86" r="16" fill="#A7F3D0" />
          <rect x="120" y="96" width="4" height="24" fill="#065F46" />
          {/* Tall townhouse row */}
          <rect x="158" y="42" width="54" height="78" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
          <rect x="170" y="54" width="10" height="12" fill="#006AFF" />
          <rect x="190" y="54" width="10" height="12" fill="#006AFF" />
          <rect x="170" y="76" width="10" height="12" fill="#006AFF" />
          <rect x="190" y="76" width="10" height="12" fill="#006AFF" />
          {/* Yellow accented suburban home */}
          <rect x="242" y="68" width="76" height="52" fill="#FEF3C7" />
          <path d="M234 68L280 38L326 68H234Z" fill="#064E4A" />
          <rect x="272" y="88" width="16" height="32" fill="#006AFF" />
          {/* Mid-block apartments */}
          <rect x="366" y="34" width="72" height="86" fill="#DBEAFE" />
          <rect x="366" y="34" width="72" height="10" fill="#006AFF" />
          <rect x="380" y="54" width="14" height="14" fill="#FFFFFF" />
          <rect x="408" y="54" width="14" height="14" fill="#FFFFFF" />
          <rect x="380" y="78" width="14" height="14" fill="#FFFFFF" />
          <rect x="408" y="78" width="14" height="14" fill="#FFFFFF" />
          {/* Trees */}
          <circle cx="476" cy="84" r="18" fill="#6EE7B7" />
          <circle cx="502" cy="90" r="14" fill="#34D399" />
          {/* Center Zillow craftsman */}
          <rect x="554" y="60" width="96" height="60" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          <path d="M542 60L602 24L662 60H542Z" fill="#006AFF" />
          <rect x="592" y="84" width="20" height="36" fill="#064E4A" />
          <rect x="566" y="74" width="16" height="16" fill="#DBEAFE" />
          <rect x="622" y="74" width="16" height="16" fill="#DBEAFE" />
          {/* Brownstone & condo cluster */}
          <rect x="698" y="48" width="66" height="72" fill="#E0E7FF" />
          <rect x="764" y="38" width="68" height="82" fill="#DBEAFE" />
          <rect x="764" y="38" width="68" height="8" fill="#006AFF" />
          {/* Warm gold gable home */}
          <rect x="876" y="66" width="82" height="54" fill="#FDE68A" />
          <path d="M866 66L917 34L968 66H866Z" fill="#1E293B" />
          <rect x="909" y="88" width="16" height="32" fill="#FFFFFF" />
          {/* Trees */}
          <circle cx="1008" cy="86" r="18" fill="#A7F3D0" />
          <circle cx="1038" cy="82" r="20" fill="#6EE7B7" />
          {/* Right modern condos */}
          <rect x="1088" y="32" width="84" height="88" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
          <rect x="1104" y="48" width="18" height="14" fill="#006AFF" />
          <rect x="1136" y="48" width="18" height="14" fill="#006AFF" />
          <rect x="1104" y="72" width="18" height="14" fill="#006AFF" />
          <rect x="1136" y="72" width="18" height="14" fill="#006AFF" />
          {/* Far right cottage */}
          <rect x="1220" y="64" width="86" height="56" fill="#DBEAFE" />
          <path d="M1210 64L1263 32L1316 64H1210Z" fill="#006AFF" />
          <rect x="1254" y="86" width="18" height="34" fill="#1E293B" />
          <circle cx="1364" cy="84" r="20" fill="#6EE7B7" />
          <rect x="1398" y="54" width="42" height="66" fill="#E0E7FF" />
        </svg>
      </div>
    </footer>
  );
};
