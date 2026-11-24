export type AppSection = 'home' | 'buy' | 'rent' | 'sell' | 'loans' | 'agents';

export type ListingStatus = 'for_sale' | 'for_rent' | 'sold';

export type SaleSubtype =
  | 'standard'
  | 'new_construction'
  | 'foreclosure'
  | 'auction'
  | 'fsbo'
  | 'coming_soon'
  | 'pending';

export type HomeType =
  | 'house'
  | 'townhome'
  | 'multi_family'
  | 'condo'
  | 'lot'
  | 'apartment'
  | 'manufactured';

export type SortOption =
  | 'recommended'
  | 'price_high'
  | 'price_low'
  | 'newest'
  | 'beds_high'
  | 'sqft_high'
  | 'price_sqft_low';

export interface SchoolInfo {
  name: string;
  grades: string;
  rating: number;
  distanceMi: number;
  type: 'Public' | 'Charter' | 'Private';
}

export interface PriceHistoryEvent {
  date: string;
  event: 'Listed for sale' | 'Price change' | 'Pending sale' | 'Sold' | 'Listed for rent';
  price: number;
  pricePerSqft?: number;
  source: string;
}

export interface TaxHistoryEntry {
  year: number;
  propertyTaxes: number;
  taxAssessment: number;
}

export interface ClimateRiskScores {
  flood: number;
  fire: number;
  wind: number;
  heat: number;
  air: number;
}

export interface Property {
  id: string;
  mlsId: string;
  status: ListingStatus;
  saleSubtype: SaleSubtype;
  homeType: HomeType;
  price: number;
  zestimate: number;
  rentZestimate: number;
  priceChange?: number;
  testPaidPct?: number;
  testBuyer?: string;
  beds: number;
  baths: number;
  sqft: number;
  lotSqft: number;
  yearBuilt: number;
  stories: number;
  garageSpaces: number;
  parkingSpaces: number;
  hoaFee: number;
  propertyTaxAnnual: number;
  taxAssessedValue: number;
  daysOnMarket: number;
  viewsCount: number;
  savesCount: number;
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
  neighborhood: string;
  county: string;
  lat: number;
  lng: number;
  images: string[];
  has3DTour: boolean;
  hasFloorPlan: boolean;
  openHouse?: string;
  headline: string;
  description: string;
  whatsSpecial: string[];
  architecturalStyle: string;
  parcelNumber: string;
  heating: string;
  cooling: string;
  appliances: string[];
  flooring: string[];
  basement: 'Finished' | 'Unfinished' | 'None';
  fireplaceCount: number;
  exteriorMaterials: string[];
  roofType: string;
  amenities: string[];
  petsAllowed?: {
    cats: boolean;
    dogs: boolean;
  };
  laundry?: string;
  walkScore: number;
  transitScore: number;
  bikeScore: number;
  climateRisks: ClimateRiskScores;
  schools: SchoolInfo[];
  priceHistory: PriceHistoryEvent[];
  taxHistory: TaxHistoryEntry[];
  agent: {
    name: string;
    brokerage: string;
    phone: string;
    license: string;
  };
}

export interface FilterState {
  status: ListingStatus;
  priceMin: number | null;
  priceMax: number | null;
  bedsMin: number | null;
  bedsExact: boolean;
  bathsMin: number | null;
  homeTypes: HomeType[];
  maxHoa: number | null;
  parkingMin: number | null;
  mustHaveGarage: boolean;
  sqftMin: number | null;
  sqftMax: number | null;
  lotMin: number | null;
  yearBuiltMin: number | null;
  yearBuiltMax: number | null;
  singleStoryOnly: boolean;
  basementTypes: ('Finished' | 'Unfinished')[];
  mustHaveOpenHouse: boolean;
  mustHave3DTour: boolean;
  daysOnMarketMax: number | null;
  amenities: string[];
  petsCats: boolean;
  petsDogs: boolean;
  inUnitLaundry: boolean;
  saleSubtypes: SaleSubtype[];
  keywords: string;
  sortBy: SortOption;
  searchInBounds: boolean;
}

export interface MapBoundsLiteral {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  locationLabel: string;
  filters: FilterState;
  frequency: 'Instant' | 'Daily' | 'Weekly';
  createdAt: string;
}

export interface TourRequest {
  id: string;
  propertyId: string;
  propertyAddress: string;
  propertyPrice: number;
  propertyImage: string;
  tourType: 'In-person' | 'Video chat';
  date: string;
  timeSlot: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  createdAt: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  brokerage: string;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  recentSales12Mo: number;
  totalSales: number;
  priceRange: string;
  specialties: string[];
  languages: string[];
  license: string;
  bio: string;
  recentSaleAddress: string;
  recentSalePrice: number;
}

export interface MarketMetric {
  id: string;
  city: string;
  state: string;
  center: { lat: number; lng: number };
  zoom: number;
  medianPrice: number;
  medianRent: number;
  yoyChangePct: number;
  medianDaysToPending: number;
  activeListings: number;
  marketHeat: 'Hot' | 'Balanced' | 'Competitive';
}

export interface MortgageRateQuote {
  product: string;
  rate: number;
  apr: number;
  points: number;
  monthlyPer100k: number;
  note: string;
}
