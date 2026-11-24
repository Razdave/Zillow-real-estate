import { HomeType, ListingStatus, Property, SaleSubtype } from '../types/realEstate';

interface Seed {
  id: string;
  type: HomeType;
  status?: ListingStatus;
  subtype?: SaleSubtype;
  style: string;
  photo: string;
  price: number;
  rent: number;
  beds: number;
  baths: number;
  sqft: number;
  lot: number;
  year: number;
  stories: number;
  days: number;
  place: [street: string, city: string, state: string, zip: string, neighborhood: string, county: string, lat: number, lng: number];
  headline: string;
  description: string;
  special: string[];
  hoa?: number;
}

// Fictional sample homes. Photos are public-domain/CC0 and do not show the listed addresses.
const SEEDS: Seed[] = [
  { id: 'more-manufactured', type: 'manufactured', style: 'Manufactured Home', photo: 'manufactured', price: 98000, rent: 1000, beds: 3, baths: 2, sqft: 1380, lot: 4800, year: 2004, stories: 1, days: 5, hoa: 310,
    place: ['7101 Sample Creek Ln, Space 14', 'Columbia', 'SC', '29205', 'Forest Acres', 'Richland County', 33.9830, -81.0150],
    headline: 'Three-bedroom manufactured home with a front porch', description: 'One-level manufactured home with a split bedroom plan, covered porch and paved parking. Monthly site fee shown as HOA.', special: ['One level', 'Covered porch', 'Paved parking'] },
  { id: 'more-ranch', type: 'house', style: 'Ranch', photo: 'ranch', price: 289000, rent: 1550, beds: 3, baths: 2, sqft: 1720, lot: 10400, year: 1962, stories: 1, days: 9,
    place: ['5508 Sample Mesa Dr', 'Columbia', 'SC', '29205', 'Earlewood', 'Richland County', 34.0000, -80.9940],
    headline: 'Wide single-level ranch on a large lot', description: 'Long, low ranch home with three bedrooms along one hall, a family room at the back and a deep lawn.', special: ['Single level', 'Large lot', 'Attached garage'] },
  { id: 'more-bungalow', type: 'house', style: 'Bungalow', photo: 'bungalow', price: 264000, rent: 1500, beds: 3, baths: 1.5, sqft: 1460, lot: 4100, year: 1924, stories: 1, days: 3,
    place: ['3640 N Sample Ave', 'Spartanburg', 'SC', '29302', 'Converse Heights', 'Spartanburg County', 34.9620, -81.9460],
    headline: 'Gabled bungalow with a deep front porch', description: 'Compact three-bedroom bungalow with a broad porch, separate dining room and fenced back garden.', special: ['Front porch', 'Dining room', 'Fenced garden'] },
  { id: 'more-traditional', type: 'house', style: 'Colonial Revival', photo: 'colonial', price: 415000, rent: 2350, beds: 4, baths: 2.5, sqft: 2480, lot: 6200, year: 1908, stories: 3, days: 12,
    place: ['2219 W Sample St', 'Spartanburg', 'SC', '29302', 'Downtown', 'Spartanburg County', 34.9790, -81.9250],
    headline: 'Three-level traditional home with a wraparound porch', description: 'Older home with tall windows, four bedrooms upstairs, a finished top floor and generous porch space.', special: ['Wide porch', 'Finished top floor', 'Tall windows'] },
  { id: 'more-spanish', type: 'house', style: 'Spanish Mission', photo: 'spanish', price: 785000, rent: 2825, beds: 3, baths: 2, sqft: 1840, lot: 7000, year: 1931, stories: 1, days: 7,
    place: ['815 Sample Palm Ct', 'Hilton Head Island', 'SC', '29928', 'Palmetto Dunes', 'Beaufort County', 32.1510, -80.7140],
    headline: 'Arched Spanish-style home under the palms', description: 'One-level home with an arched porch, tiled roof, curved bay window and mature palms at the front.', special: ['Arched porch', 'Tiled roof', 'Mature palms'] },
  { id: 'more-duplex', type: 'multi_family', style: 'Side-by-side Duplex', photo: 'duplex', price: 449000, rent: 3250, beds: 5, baths: 3, sqft: 2360, lot: 2900, year: 1948, stories: 2, days: 10,
    place: ['1260 Sample Bay St', 'Greenville', 'SC', '29601', 'West End', 'Greenville County', 34.8350, -82.4150],
    headline: 'Two-unit home with separate entrances', description: 'Duplex with a three-bedroom unit and a two-bedroom unit, each with its own entrance and meter.', special: ['Two units', 'Separate meters', 'Own entrances'] },
  { id: 'more-new', type: 'multi_family', subtype: 'new_construction', style: 'Modern Duplex', photo: 'modern', price: 695000, rent: 4325, beds: 6, baths: 5, sqft: 3300, lot: 3100, year: 2026, stories: 3, days: 2,
    place: ['48 Sample Hill Ter', 'Greenville', 'SC', '29601', 'Augusta Road', 'Greenville County', 34.8520, -82.3940],
    headline: 'Newly built pair of modern homes with roof terraces', description: 'New two-unit building with large windows, garage parking and a terrace for each home.', special: ['New construction', 'Roof terraces', 'Garage parking'] },
  { id: 'more-townhome', type: 'townhome', style: 'Rowhouse', photo: 'townhome', price: 339000, rent: 2875, beds: 3, baths: 2.5, sqft: 1900, lot: 1500, year: 1905, stories: 3, days: 8,
    place: ['271 Sample Pl', 'Myrtle Beach', 'SC', '29577', 'Market Common', 'Horry County', 33.7120, -78.8740],
    headline: 'Three-level rowhouse on a quiet block', description: 'Attached home with a living level, garden access and three bedrooms over two upper floors.', special: ['Garden access', 'Three levels', 'Period front'] },
  { id: 'more-apartment', type: 'apartment', status: 'for_rent', style: 'Courtyard Apartments', photo: 'apartment', price: 1550, rent: 1550, beds: 1, baths: 1, sqft: 720, lot: 0, year: 1926, stories: 1, days: 4,
    place: ['940 Sample Blvd, Apt 3D', 'Charleston', 'SC', '29401', 'North Central', 'Charleston County', 32.8240, -79.9660],
    headline: 'One-bedroom apartment in a brick building', description: 'Bright one-bedroom with a separate kitchen, shared laundry and a planted courtyard.', special: ['Courtyard', 'Shared laundry', 'Separate kitchen'] },
  { id: 'more-land', type: 'lot', style: 'Residential Land', photo: 'land', price: 64000, rent: 0, beds: 0, baths: 0, sqft: 0, lot: 43560, year: 0, stories: 1, days: 14,
    place: ['Sample Prairie Rd, Lot 6', 'Columbia', 'SC', '29205', 'Shandon', 'Richland County', 33.9660, -81.0150],
    headline: 'One open acre ready for plans', description: 'Level open land of about one acre. Buyer to confirm utilities and building rules.', special: ['One acre', 'Level site', 'Open views'] },
];

const toProperty = (s: Seed, i: number): Property => {
  const [street, city, state, zip, neighborhood, county, lat, lng] = s.place;
  const isRent = s.status === 'for_rent';
  const isLot = s.type === 'lot';
  const isApartment = s.type === 'apartment';
  const tax = isRent ? 0 : Math.round(s.price * 0.012);
  const perSqft = s.sqft && !isRent ? Math.round(s.price / s.sqft) : undefined;
  return {
    id: s.id, mlsId: `SAMPLE-${1001 + i}`, status: s.status ?? 'for_sale', saleSubtype: s.subtype ?? 'standard', homeType: s.type,
    price: s.price, zestimate: 0, rentZestimate: s.rent, beds: s.beds, baths: s.baths, sqft: s.sqft, lotSqft: s.lot, yearBuilt: s.year,
    stories: s.stories, garageSpaces: isLot || isApartment ? 0 : 1, parkingSpaces: isLot ? 0 : 1, hoaFee: s.hoa ?? 0,
    propertyTaxAnnual: tax, taxAssessedValue: isRent ? 0 : Math.round(s.price * 0.92), daysOnMarket: s.days,
    viewsCount: 180 + i * 37, savesCount: 12 + i * 3,
    street, city, state, zip, neighborhood, county, lat, lng,
    images: [`/src/assets/images/sample_${s.photo}.jpg`], has3DTour: false, hasFloorPlan: false,
    headline: s.headline, description: s.description, whatsSpecial: s.special, architecturalStyle: s.style,
    parcelNumber: `SAMPLE-${i + 1}`, heating: isLot ? 'None' : 'Forced air', cooling: isLot ? 'None' : 'Central A/C',
    appliances: isLot ? [] : ['Range', 'Refrigerator', 'Dishwasher'], flooring: isLot ? [] : ['Wood', 'Tile'], basement: 'None',
    fireplaceCount: 0, exteriorMaterials: [], roofType: isLot ? 'None' : 'Standard', amenities: isLot ? [] : ['Air Conditioning'],
    petsAllowed: isRent ? { cats: true, dogs: true } : undefined, laundry: isRent ? 'Shared' : undefined,
    walkScore: isLot ? 8 : 72, transitScore: isLot ? 0 : 55, bikeScore: isLot ? 15 : 62,
    climateRisks: { flood: 2, fire: 2, wind: 2, heat: 3, air: 2 }, schools: [],
    priceHistory: [{ date: '11/10/2026', event: isRent ? 'Listed for rent' : 'Listed for sale', price: s.price, pricePerSqft: perSqft, source: 'Sample data' }],
    taxHistory: isRent ? [] : [{ year: 2025, propertyTaxes: tax, taxAssessment: Math.round(s.price * 0.92) }],
    agent: { name: 'Sample Agent', brokerage: 'Sample Realty', phone: '(555) 555-0100', license: 'Sample license' },
  };
};

export const MORE_HOMES: Property[] = SEEDS.map(toProperty);
