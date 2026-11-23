import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, EyeOff, Heart, Home } from 'lucide-react';
import { Property } from '../types/realEstate';
import { formatCurrency, HOME_TYPE_LABELS } from '../utils/propertyFilters';

interface PropertyCardProps {
  property: Property;
  isSaved: boolean;
  isHovered: boolean;
  onToggleSave: (id: string) => void;
  onHideProperty: (id: string) => void;
  onHover: (id: string | null) => void;
  onSelect: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isSaved,
  isHovered,
  onToggleSave,
  onHideProperty,
  onHover,
  onSelect,
}) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [imgFailed, setImgFailed] = useState(false);

  const images = property.images.length > 0 ? property.images : [];
  const currentImg = images[imgIdx];

  const statusText =
    property.status === 'for_rent'
      ? 'For Rent'
      : property.status === 'sold'
      ? 'Sold'
      : property.saleSubtype === 'coming_soon'
      ? 'Coming Soon'
      : property.saleSubtype === 'pending'
      ? 'Pending'
      : property.saleSubtype === 'new_construction'
      ? 'New Construction'
      : property.saleSubtype === 'foreclosure'
      ? 'Foreclosure'
      : property.saleSubtype === 'fsbo'
      ? 'For Sale by Owner'
      : `${HOME_TYPE_LABELS[property.homeType].replace(/s$/, '')} for sale`;

  return (
    <article
      onMouseEnter={() => onHover(property.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(property)}
      className={`group bg-white rounded-xl border transition-all duration-150 overflow-hidden cursor-pointer flex flex-col ${
        isHovered
          ? 'border-[#006AFF] shadow-md -translate-y-0.5'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* 4:3 Image Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        {!imgFailed && currentImg ? (
          <img
            src={currentImg}
            alt={`${property.street}, ${property.city}`}
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center p-4 text-center">
            <Home className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-xs font-medium text-slate-500">{property.street}</span>
          </div>
        )}

        {/* Measured subtle scrim for readability */}
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/45 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />

        {/* Top-left clean text status indicator */}
        <div className="absolute top-2.5 left-3 text-[11px] font-semibold text-white tracking-tight drop-shadow-sm">
          {property.openHouse
            ? `Open House · ${property.openHouse}`
            : property.daysOnMarket <= 7
            ? `${property.daysOnMarket} days on Zillow`
            : statusText}
        </div>

        {/* Top-right Save & Hide actions */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onHideProperty(property.id);
            }}
            title="Hide home"
            aria-label={`Hide ${property.street}`}
            className="p-1.5 rounded-md bg-black/35 hover:bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(property.id);
            }}
            title={isSaved ? 'Remove from saved homes' : 'Save home'}
            aria-label={isSaved ? `Unsave ${property.street}` : `Save ${property.street}`}
            className="p-1.5 rounded-md bg-black/35 hover:bg-black/60 text-white transition-colors cursor-pointer"
          >
            <Heart
              className={`w-4 h-4 ${
                isSaved ? 'fill-rose-500 text-rose-500' : 'text-white'
              }`}
            />
          </button>
        </div>

        {/* Carousel arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setImgIdx((prev) => (prev - 1 + images.length) % images.length);
              }}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setImgIdx((prev) => (prev + 1) % images.length);
              }}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/45 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Bottom-left media capability indicator */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-medium text-white/95">
          <span>
            {property.has3DTour ? '3D Tour' : property.hasFloorPlan ? 'Floor Plan' : ''}
          </span>
          {images.length > 1 && (
            <span className="tabular-nums">
              {imgIdx + 1}/{images.length}
            </span>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-lg font-bold text-slate-900 tabular-nums">
              {formatCurrency(property.price)}
              {property.status === 'for_rent' && (
                <span className="text-sm font-medium text-slate-600">/mo</span>
              )}
            </span>
            {property.priceChange && property.priceChange < 0 ? (
              <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                Price cut: {formatCurrency(Math.abs(property.priceChange))}
              </span>
            ) : property.status === 'for_sale' && property.zestimate > 0 ? (
              <span className="text-xs text-slate-500 tabular-nums">
                Zestimate: {formatCurrency(property.zestimate)}
              </span>
            ) : null}
          </div>

          {/* Unboxed clean metadata with middot separators */}
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-700 tabular-nums">
            {property.homeType !== 'lot' ? (
              <>
                <span>
                  <strong className="font-semibold text-slate-900">{property.beds}</strong> bds
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span>
                  <strong className="font-semibold text-slate-900">{property.baths}</strong> ba
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span>
                  <strong className="font-semibold text-slate-900">
                    {property.sqft.toLocaleString()}
                  </strong>{' '}
                  sqft
                </span>
              </>
            ) : (
              <span>
                <strong className="font-semibold text-slate-900">
                  {property.lotSqft.toLocaleString()}
                </strong>{' '}
                sqft lot
              </span>
            )}
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="text-slate-600">{statusText}</span>
          </div>

          <address className="not-italic mt-1.5 text-sm font-medium text-slate-900 truncate">
            {property.street}
            {property.unit ? ` ${property.unit}` : ''}, {property.city}, {property.state}{' '}
            {property.zip}
          </address>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="truncate">{property.agent.brokerage}</span>
          <span className="shrink-0 ml-2 tabular-nums">{property.neighborhood}</span>
        </div>
      </div>
    </article>
  );
};
