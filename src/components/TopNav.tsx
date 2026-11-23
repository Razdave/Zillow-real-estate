import React, { useRef, useState } from 'react';
import { Heart, Menu, X } from 'lucide-react';
import { AppSection, FilterState } from '../types/realEstate';

export type UtilityModalType = 'rentals_manager' | 'advertise' | 'help' | 'signin' | null;

interface MegaMenuLink {
  label: string;
  section?: AppSection;
  filterPatch?: Partial<FilterState>;
  utilityModal?: UtilityModalType;
}

interface MegaMenuColumn {
  heading: string;
  links: MegaMenuLink[];
}

interface NavItemConfig {
  id: AppSection;
  label: string;
  columns: MegaMenuColumn[];
}

interface TopNavProps {
  activeSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  onNavigateWithFilters?: (section: AppSection, patch: Partial<FilterState>) => void;
  savedCount: number;
  toursCount: number;
  onOpenSavedDrawer: () => void;
  onOpenUtilityModal: (modal: UtilityModalType) => void;
  signedInEmail?: string | null;
}

const NAV_CONFIG: NavItemConfig[] = [
  {
    id: 'buy',
    label: 'Buy',
    columns: [
      {
        heading: 'Homes for sale',
        links: [
          {
            label: 'Homes for sale',
            section: 'buy',
            filterPatch: { status: 'for_sale', saleSubtypes: [], mustHaveOpenHouse: false },
          },
          {
            label: 'Foreclosures',
            section: 'buy',
            filterPatch: { status: 'for_sale', saleSubtypes: ['foreclosure'] },
          },
          {
            label: 'For sale by owner',
            section: 'buy',
            filterPatch: { status: 'for_sale', saleSubtypes: ['fsbo'] },
          },
          {
            label: 'Open houses',
            section: 'buy',
            filterPatch: { status: 'for_sale', mustHaveOpenHouse: true },
          },
        ],
      },
      {
        heading: 'New & Coming Soon',
        links: [
          {
            label: 'New construction',
            section: 'buy',
            filterPatch: { status: 'for_sale', saleSubtypes: ['new_construction'] },
          },
          {
            label: 'Coming soon',
            section: 'buy',
            filterPatch: { status: 'for_sale', saleSubtypes: ['coming_soon'] },
          },
          {
            label: 'Recent home sales',
            section: 'buy',
            filterPatch: { status: 'sold', saleSubtypes: [] },
          },
          {
            label: 'All homes',
            section: 'buy',
            filterPatch: { status: 'for_sale', saleSubtypes: [], searchInBounds: false },
          },
        ],
      },
      {
        heading: 'Resources',
        links: [
          { label: 'Home Buying Guide', section: 'loans' },
          { label: 'Foreclosure center', section: 'buy', filterPatch: { status: 'for_sale', saleSubtypes: ['foreclosure'] } },
          { label: 'Down payment assistance', section: 'loans' },
          { label: 'Real estate app', utilityModal: 'help' },
        ],
      },
    ],
  },
  {
    id: 'rent',
    label: 'Rent',
    columns: [
      {
        heading: 'Search for rentals',
        links: [
          {
            label: 'Rental buildings',
            section: 'rent',
            filterPatch: { status: 'for_rent', homeTypes: ['apartment'] },
          },
          {
            label: 'Apartments for rent',
            section: 'rent',
            filterPatch: { status: 'for_rent', homeTypes: ['apartment', 'condo'] },
          },
          {
            label: 'Houses for rent',
            section: 'rent',
            filterPatch: { status: 'for_rent', homeTypes: ['house', 'townhome'] },
          },
          {
            label: 'All rental listings',
            section: 'rent',
            filterPatch: { status: 'for_rent', homeTypes: [] },
          },
        ],
      },
      {
        heading: 'Renter tools',
        links: [
          { label: 'Pet-friendly rentals', section: 'rent', filterPatch: { status: 'for_rent', petsDogs: true } },
          { label: 'Affordability calculator', section: 'loans' },
          { label: 'Zillow Rental Manager', utilityModal: 'rentals_manager' },
          { label: 'Renters insurance guide', utilityModal: 'help' },
        ],
      },
    ],
  },
  {
    id: 'sell',
    label: 'Sell',
    columns: [
      {
        heading: 'Selling tools',
        links: [
          { label: 'Explore your options', section: 'sell' },
          { label: "See your home's Zestimate", section: 'sell' },
          { label: 'US housing market', section: 'sell' },
          { label: 'Sellers guide', section: 'sell' },
        ],
      },
      {
        heading: 'Selling options',
        links: [
          { label: 'Find a seller’s agent', section: 'agents' },
          { label: 'Post For Sale by Owner', section: 'sell' },
          { label: 'Recent home sales', section: 'buy', filterPatch: { status: 'sold' } },
        ],
      },
    ],
  },
  {
    id: 'loans',
    label: 'Get a mortgage',
    columns: [
      {
        heading: 'Your mortgage',
        links: [
          { label: 'Get pre-qualified', section: 'loans' },
          { label: 'Discover your BuyAbility', section: 'loans' },
          { label: 'Current mortgage rates', section: 'loans' },
          { label: 'Refinance your mortgage', section: 'loans' },
        ],
      },
      {
        heading: 'Calculators',
        links: [
          { label: 'Mortgage calculator', section: 'loans' },
          { label: 'Affordability calculator', section: 'loans' },
          { label: 'Debt-to-income calculator', section: 'loans' },
        ],
      },
    ],
  },
  {
    id: 'agents',
    label: 'Find an agent',
    columns: [
      {
        heading: 'Looking for pros?',
        links: [
          { label: 'Real estate agents', section: 'agents' },
          { label: 'Property managers', utilityModal: 'rentals_manager' },
          { label: 'Home builders', section: 'buy', filterPatch: { status: 'for_sale', saleSubtypes: ['new_construction'] } },
          { label: 'Premier Agent directory', section: 'agents' },
        ],
      },
    ],
  },
];

export const TopNav: React.FC<TopNavProps> = ({
  activeSection,
  onSelectSection,
  onNavigateWithFilters,
  savedCount,
  toursCount,
  onOpenSavedDrawer,
  onOpenUtilityModal,
  signedInEmail,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState<AppSection | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const totalSavedBadge = savedCount + toursCount;

  const openMenu = (id: AppSection) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setHoveredMenu(id);
  };

  const scheduleClose = () => {
    closeTimerRef.current = window.setTimeout(() => {
      setHoveredMenu(null);
    }, 120);
  };

  const handleMegaLinkClick = (link: MegaMenuLink) => {
    setHoveredMenu(null);
    if (link.utilityModal) {
      onOpenUtilityModal(link.utilityModal);
      return;
    }
    if (link.section && link.filterPatch && onNavigateWithFilters) {
      onNavigateWithFilters(link.section, link.filterPatch);
      return;
    }
    if (link.section) {
      onSelectSection(link.section);
    }
  };

  const activeMegaMenu = NAV_CONFIG.find((n) => n.id === hoveredMenu);

  return (
    <header
      className="sticky top-0 z-40 bg-white border-b border-slate-200"
      onMouseLeave={scheduleClose}
    >
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 h-16 lg:h-[72px] flex items-center justify-between gap-4 relative">
        {/* Left Primary Navigation (Zillow.com exact labels) */}
        <nav className="hidden lg:flex items-center gap-6 flex-1" aria-label="Primary navigation">
          {NAV_CONFIG.map((item) => {
            const isActive = activeSection === item.id;
            const isHovered = hoveredMenu === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => openMenu(item.id)}
                className="relative h-full flex items-center"
              >
                <button
                  type="button"
                  onClick={() => {
                    setHoveredMenu(null);
                    onSelectSection(item.id);
                  }}
                  className={`py-5 text-[14px] font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006AFF] ${
                    isActive || isHovered
                      ? 'text-[#006AFF]'
                      : 'text-[#2A2A33] hover:text-[#006AFF]'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[#006AFF]" />
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Center Zillow Wordmark */}
        <div className="flex items-center lg:justify-center">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setHoveredMenu(null);
              onSelectSection('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-1.5 text-[26px] font-extrabold tracking-tight text-[#006AFF] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#006AFF] rounded"
            style={{ fontFamily: 'var(--font-display)' }}
            aria-label="Zillow Home"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
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
          </a>
        </div>

        {/* Right Utility Navigation (Zillow.com exact layout) */}
        <div className="flex items-center justify-end gap-5 flex-1 shrink-0">
          <div className="hidden xl:flex items-center gap-6 text-[14px] font-medium text-[#2A2A33]">
            <button
              type="button"
              onClick={() => onOpenUtilityModal('rentals_manager')}
              className="hover:text-[#006AFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Manage rentals
            </button>
            <button
              type="button"
              onClick={() => onOpenUtilityModal('advertise')}
              className="hover:text-[#006AFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Advertise
            </button>
            <button
              type="button"
              onClick={() => onOpenUtilityModal('help')}
              className="hover:text-[#006AFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Get help
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenSavedDrawer}
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#2A2A33] hover:text-[#006AFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            aria-label="Saved homes and tours"
          >
            <Heart
              className={`w-4 h-4 ${
                totalSavedBadge > 0 ? 'text-[#006AFF]' : 'text-slate-600'
              }`}
            />
            <span className="hidden sm:inline">
              Saved{totalSavedBadge > 0 ? ` (${totalSavedBadge})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onOpenUtilityModal('signin')}
            className="hidden sm:inline-flex text-[14px] font-medium text-[#2A2A33] hover:text-[#006AFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {signedInEmail ? 'Account' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-[#2A2A33] hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Hover Mega-Menu Dropdown (Authentic Zillow.com Behavior) */}
      {activeMegaMenu && (
        <div
          onMouseEnter={() => openMenu(activeMegaMenu.id)}
          onMouseLeave={scheduleClose}
          className="hidden lg:block absolute left-0 right-0 top-full bg-white border-b border-slate-200 shadow-lg z-50"
        >
          <div className="max-w-[1440px] mx-auto px-8 py-6 flex flex-wrap gap-12">
            {activeMegaMenu.columns.map((col) => (
              <div key={col.heading} className="min-w-[180px] space-y-2.5">
                <div className="text-xs font-bold text-[#2A2A33]">{col.heading}</div>
                <ul className="space-y-1.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <button
                        type="button"
                        onClick={() => handleMegaLinkClick(link)}
                        className="text-sm text-[#006AFF] hover:underline text-left cursor-pointer"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {NAV_CONFIG.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectSection(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-[#006AFF] font-semibold'
                    : 'text-[#2A2A33] hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2 mt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenUtilityModal('rentals_manager');
                setMobileOpen(false);
              }}
              className="px-2 py-2 text-xs font-medium text-[#2A2A33] bg-slate-50 rounded-lg"
            >
              Manage rentals
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenUtilityModal('advertise');
                setMobileOpen(false);
              }}
              className="px-2 py-2 text-xs font-medium text-[#2A2A33] bg-slate-50 rounded-lg"
            >
              Advertise
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenUtilityModal('help');
                setMobileOpen(false);
              }}
              className="px-2 py-2 text-xs font-medium text-[#2A2A33] bg-slate-50 rounded-lg"
            >
              Get help
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              onOpenUtilityModal('signin');
              setMobileOpen(false);
            }}
            className="w-full mt-2 py-2.5 text-sm font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg"
          >
            {signedInEmail ? `Account (${signedInEmail})` : 'Sign in'}
          </button>
        </div>
      )}
    </header>
  );
};
