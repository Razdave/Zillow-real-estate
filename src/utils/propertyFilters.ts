import { FilterState, HomeType, MapBoundsLiteral, Property, SaleSubtype } from '../types/realEstate';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCompactPrice(amount: number, isRent: boolean): string {
  if (isRent) {
    return `$${(amount / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `$${m >= 10 ? m.toFixed(1) : m.toFixed(2).replace(/0$/, '')}M`;
  }
  if (amount >= 1_000) {
    return `$${Math.round(amount / 1_000)}K`;
  }
  return `$${amount}`;
}

export const HOME_TYPE_LABELS: Record<HomeType, string> = {
  house: 'Houses',
  townhome: 'Townhomes',
  multi_family: 'Multi-family',
  condo: 'Condos/Co-ops',
  lot: 'Lots/Land',
  apartment: 'Apartments',
  manufactured: 'Manufactured',
};

export const SALE_SUBTYPE_LABELS: Record<SaleSubtype, string> = {
  standard: 'Resale',
  new_construction: 'New construction',
  foreclosure: 'Foreclosure',
  auction: 'Auction',
  fsbo: 'For sale by owner',
  coming_soon: 'Coming soon',
  pending: 'Pending / Backup offers',
};

export function calculateMonthlyMortgage(params: {
  homePrice: number;
  downPaymentPct: number;
  interestRatePct: number;
  termYears: number;
  propertyTaxAnnual: number;
  hoaMonthly: number;
  homeInsuranceAnnual?: number;
}): {
  principalAndInterest: number;
  propertyTax: number;
  homeInsurance: number;
  hoa: number;
  pmi: number;
  totalMonthly: number;
  loanAmount: number;
  downPaymentDollar: number;
} {
  const {
    homePrice,
    downPaymentPct,
    interestRatePct,
    termYears,
    propertyTaxAnnual,
    hoaMonthly,
    homeInsuranceAnnual = Math.round(homePrice * 0.0035),
  } = params;

  const downPaymentDollar = Math.round(homePrice * (downPaymentPct / 100));
  const loanAmount = Math.max(0, homePrice - downPaymentDollar);
  const monthlyRate = interestRatePct / 100 / 12;
  const totalPayments = termYears * 12;

  let principalAndInterest = 0;
  if (loanAmount > 0 && monthlyRate > 0) {
    const factor = Math.pow(1 + monthlyRate, totalPayments);
    principalAndInterest = Math.round((loanAmount * (monthlyRate * factor)) / (factor - 1));
  } else if (loanAmount > 0) {
    principalAndInterest = Math.round(loanAmount / totalPayments);
  }

  const propertyTax = Math.round(propertyTaxAnnual / 12);
  const homeInsurance = Math.round(homeInsuranceAnnual / 12);
  const pmi = downPaymentPct < 20 ? Math.round((loanAmount * 0.0055) / 12) : 0;

  return {
    principalAndInterest,
    propertyTax,
    homeInsurance,
    hoa: Math.round(hoaMonthly),
    pmi,
    totalMonthly: principalAndInterest + propertyTax + homeInsurance + Math.round(hoaMonthly) + pmi,
    loanAmount,
    downPaymentDollar,
  };
}

export function isPointInBounds(lat: number, lng: number, bounds: MapBoundsLiteral): boolean {
  const latOk = lat <= bounds.north && lat >= bounds.south;
  const lngOk =
    bounds.west <= bounds.east
      ? lng >= bounds.west && lng <= bounds.east
      : lng >= bounds.west || lng <= bounds.east;
  return latOk && lngOk;
}

export function filterProperties(
  properties: Property[],
  filters: FilterState,
  searchQuery: string,
  mapBounds: MapBoundsLiteral | null,
  hiddenIds: Set<string>
): Property[] {
  const q = searchQuery.trim().toLowerCase();
  const kw = filters.keywords.trim().toLowerCase();

  const filtered = properties.filter((p) => {
    if (hiddenIds.has(p.id)) return false;
    if (p.status !== filters.status) return false;

    if (filters.searchInBounds && mapBounds && !isPointInBounds(p.lat, p.lng, mapBounds)) {
      return false;
    }

    if (q) {
      const searchable = `${p.street} ${p.unit || ''} ${p.city} ${p.state} ${p.zip} ${p.neighborhood} ${p.mlsId}`.toLowerCase();
      // If query includes city/state comma e.g. "Seattle, WA", check tokens
      const tokens = q.split(/[\s,]+/).filter(Boolean);
      const allMatch = tokens.every((t) => searchable.includes(t));
      if (!allMatch) return false;
    }

    if (filters.priceMin !== null && p.price < filters.priceMin) return false;
    if (filters.priceMax !== null && p.price > filters.priceMax) return false;

    if (filters.bedsMin !== null) {
      if (filters.bedsExact) {
        if (p.beds !== filters.bedsMin) return false;
      } else {
        if (p.beds < filters.bedsMin) return false;
      }
    }

    if (filters.bathsMin !== null && p.baths < filters.bathsMin) return false;

    if (filters.homeTypes.length > 0 && !filters.homeTypes.includes(p.homeType)) {
      return false;
    }

    if (filters.maxHoa !== null) {
      if (filters.maxHoa === 0 && p.hoaFee > 0) return false;
      if (filters.maxHoa > 0 && p.hoaFee > filters.maxHoa) return false;
    }

    if (filters.parkingMin !== null && p.parkingSpaces < filters.parkingMin) return false;
    if (filters.mustHaveGarage && p.garageSpaces < 1) return false;

    if (filters.sqftMin !== null && p.sqft < filters.sqftMin) return false;
    if (filters.sqftMax !== null && p.sqft > filters.sqftMax) return false;

    if (filters.lotMin !== null && p.lotSqft < filters.lotMin) return false;

    if (filters.yearBuiltMin !== null && p.yearBuilt < filters.yearBuiltMin) return false;
    if (filters.yearBuiltMax !== null && p.yearBuilt > filters.yearBuiltMax) return false;

    if (filters.singleStoryOnly && p.stories !== 1) return false;

    if (filters.basementTypes.length > 0) {
      if (p.basement === 'None' || !filters.basementTypes.includes(p.basement)) return false;
    }

    if (filters.mustHaveOpenHouse && !p.openHouse) return false;
    if (filters.mustHave3DTour && !p.has3DTour) return false;

    if (filters.daysOnMarketMax !== null && p.daysOnMarket > filters.daysOnMarketMax) {
      return false;
    }

    if (filters.amenities.length > 0) {
      const hasAll = filters.amenities.every((a) => p.amenities.includes(a));
      if (!hasAll) return false;
    }

    if (filters.status === 'for_rent') {
      if (filters.petsCats && !p.petsAllowed?.cats) return false;
      if (filters.petsDogs && !p.petsAllowed?.dogs) return false;
      if (filters.inUnitLaundry && !p.laundry?.toLowerCase().includes('in-unit')) return false;
    }

    if (filters.saleSubtypes.length > 0 && !filters.saleSubtypes.includes(p.saleSubtype)) {
      return false;
    }

    if (kw) {
      const haystack = `${p.headline} ${p.description} ${p.whatsSpecial.join(' ')} ${p.amenities.join(' ')} ${p.architecturalStyle}`.toLowerCase();
      if (!haystack.includes(kw)) return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (filters.sortBy) {
      case 'price_high':
        return b.price - a.price;
      case 'price_low':
        return a.price - b.price;
      case 'newest':
        return a.daysOnMarket - b.daysOnMarket;
      case 'beds_high':
        return b.beds - a.beds;
      case 'sqft_high':
        return b.sqft - a.sqft;
      case 'price_sqft_low': {
        const aRatio = a.sqft > 0 ? a.price / a.sqft : Number.MAX_SAFE_INTEGER;
        const bRatio = b.sqft > 0 ? b.price / b.sqft : Number.MAX_SAFE_INTEGER;
        return aRatio - bRatio;
      }
      case 'recommended':
      default:
        return b.viewsCount + b.savesCount * 4 - (a.viewsCount + a.savesCount * 4);
    }
  });
}

export function countActiveMoreFilters(filters: FilterState): number {
  let count = 0;
  if (filters.maxHoa !== null) count++;
  if (filters.parkingMin !== null) count++;
  if (filters.mustHaveGarage) count++;
  if (filters.sqftMin !== null || filters.sqftMax !== null) count++;
  if (filters.lotMin !== null) count++;
  if (filters.yearBuiltMin !== null || filters.yearBuiltMax !== null) count++;
  if (filters.singleStoryOnly) count++;
  if (filters.basementTypes.length > 0) count++;
  if (filters.mustHaveOpenHouse) count++;
  if (filters.mustHave3DTour) count++;
  if (filters.daysOnMarketMax !== null) count++;
  if (filters.amenities.length > 0) count += filters.amenities.length;
  if (filters.petsCats || filters.petsDogs || filters.inUnitLaundry) count++;
  if (filters.saleSubtypes.length > 0) count += filters.saleSubtypes.length;
  if (filters.keywords.trim()) count++;
  return count;
}
