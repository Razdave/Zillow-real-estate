import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APILoadingStatus,
  InfoWindow,
  Map as GoogleMap,
  MapCameraChangedEvent,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  useMap,
} from '@vis.gl/react-google-maps';
import { Compass, Layers, Train, X } from 'lucide-react';
import { StreetMap } from './StreetMap';
import { MARKET_HUBS } from '../data/properties';
import { MapBoundsLiteral, Property } from '../types/realEstate';
import { formatCompactPrice, formatCurrency } from '../utils/propertyFilters';

interface PropertyMapProps {
  properties: Property[];
  hoveredPropertyId: string | null;
  selectedPropertyId: string | null;
  cameraTarget: { center: { lat: number; lng: number }; zoom: number; nonce: number };
  searchInBounds: boolean;
  onToggleSearchInBounds: (enabled: boolean) => void;
  onBoundsChange: (bounds: MapBoundsLiteral) => void;
  onHoverProperty: (id: string | null) => void;
  onSelectProperty: (property: Property) => void;
  onResetNationalView: () => void;
  onSelectCityHub: (hubId: string) => void;
}

const Z_INDEX_SELECTED = 1000;
const Z_INDEX_HOVER = 999;

interface PricePinMarkerProps {
  property: Property;
  zIndex: number;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (id: string | null) => void;
  onMarkerClick: (
    property: Property,
    marker: google.maps.marker.AdvancedMarkerElement
  ) => void;
}

const PricePinMarker: React.FC<PricePinMarkerProps> = ({
  property,
  zIndex,
  isHovered,
  isSelected,
  onHover,
  onMarkerClick,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isRent = property.status === 'for_rent';
  const label = formatCompactPrice(property.price, isRent);

  const statusBg =
    property.status === 'for_rent'
      ? 'bg-violet-700 border-violet-900'
      : property.status === 'sold'
      ? 'bg-amber-600 border-amber-800'
      : 'bg-[#006AFF] border-[#0046AA]';

  const activeStyle =
    isSelected || isHovered
      ? 'bg-slate-900 text-white border-white scale-110 shadow-lg'
      : `${statusBg} text-white shadow-md`;

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: property.lat, lng: property.lng }}
      zIndex={zIndex}
      onMouseEnter={() => onHover(property.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => {
        if (marker) {
          onMarkerClick(property, marker);
        }
      }}
      title={`${formatCurrency(property.price)} - ${property.street}`}
    >
      <div
        className={`px-2 py-0.5 rounded-md border text-[11px] font-bold tabular-nums leading-tight transition-transform duration-150 cursor-pointer whitespace-nowrap ${activeStyle}`}
      >
        {label}
      </div>
    </AdvancedMarker>
  );
};

const MapCameraController: React.FC<{
  cameraTarget: { center: { lat: number; lng: number }; zoom: number; nonce: number };
  mapType: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
  showTransit: boolean;
  onBoundsChange: (bounds: MapBoundsLiteral) => void;
}> = ({ cameraTarget, mapType, showTransit, onBoundsChange }) => {
  const map = useMap();
  const transitLayerRef = useRef<google.maps.TransitLayer | null>(null);
  const lastNonceRef = useRef<number>(-1);

  useEffect(() => {
    if (!map) return;
    if (cameraTarget.nonce !== lastNonceRef.current) {
      lastNonceRef.current = cameraTarget.nonce;
      map.panTo(cameraTarget.center);
      map.setZoom(cameraTarget.zoom);
    }
  }, [map, cameraTarget]);

  useEffect(() => {
    if (!map) return;
    map.setMapTypeId(mapType);
  }, [map, mapType]);

  useEffect(() => {
    if (!map) return;
    if (showTransit) {
      if (!transitLayerRef.current) {
        transitLayerRef.current = new google.maps.TransitLayer();
      }
      transitLayerRef.current.setMap(map);
    } else if (transitLayerRef.current) {
      transitLayerRef.current.setMap(null);
    }
    return () => {
      transitLayerRef.current?.setMap(null);
    };
  }, [map, showTransit]);

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('idle', () => {
      const b = map.getBounds();
      if (!b) return;
      const ne = b.getNorthEast();
      const sw = b.getSouthWest();
      onBoundsChange({
        north: ne.lat(),
        east: ne.lng(),
        south: sw.lat(),
        west: sw.lng(),
      });
    });
    return () => listener.remove();
  }, [map, onBoundsChange]);

  return null;
};

export const PropertyMap: React.FC<PropertyMapProps> = ({
  properties,
  hoveredPropertyId,
  selectedPropertyId,
  cameraTarget,
  searchInBounds,
  onToggleSearchInBounds,
  onBoundsChange,
  onHoverProperty,
  onSelectProperty,
  onResetNationalView,
  onSelectCityHub,
}) => {
  const loadingStatus = useApiLoadingStatus();
  const useStreetMap =
    !import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    loadingStatus === APILoadingStatus.FAILED ||
    loadingStatus === APILoadingStatus.AUTH_FAILURE;
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [showTransit, setShowTransit] = useState(false);
  const [showLayersMenu, setShowLayersMenu] = useState(false);

  const [activeInfoProperty, setActiveInfoProperty] = useState<Property | null>(null);
  const [activeMarker, setActiveMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);

  const handleMarkerClick = useCallback(
    (property: Property, marker: google.maps.marker.AdvancedMarkerElement) => {
      setActiveInfoProperty(property);
      setActiveMarker(marker);
      onHoverProperty(property.id);
    },
    [onHoverProperty]
  );

  const handleCameraChanged = useCallback(
    (ev: MapCameraChangedEvent) => {
      const b = ev.detail.bounds;
      if (b) {
        onBoundsChange({
          north: b.north,
          south: b.south,
          east: b.east,
          west: b.west,
        });
      }
    },
    [onBoundsChange]
  );

  // Sort markers descending by lat so southern markers naturally sit on top
  const sortedProperties = [...properties]
    .sort((a, b) => b.lat - a.lat)
    .map((p, idx) => ({ property: p, baseZ: idx + 1 }));

  return (
    <div className="relative w-full h-full bg-slate-100">
      {useStreetMap ? (
        <StreetMap
          properties={properties}
          hoveredId={hoveredPropertyId}
          cameraTarget={cameraTarget}
          onBoundsChange={onBoundsChange}
          onHover={onHoverProperty}
          onSelect={onSelectProperty}
        />
      ) : (
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={cameraTarget.center}
          defaultZoom={cameraTarget.zoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          streetViewControl={true}
          fullscreenControl={false}
          mapTypeControl={false}
          onCameraChanged={handleCameraChanged}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          <MapCameraController
            cameraTarget={cameraTarget}
            mapType={mapType}
            showTransit={showTransit}
            onBoundsChange={onBoundsChange}
          />

          {sortedProperties.map(({ property, baseZ }) => {
            const isSelected =
              selectedPropertyId === property.id || activeInfoProperty?.id === property.id;
            const isHovered = hoveredPropertyId === property.id;
            const zIndex = isSelected
              ? Z_INDEX_SELECTED
              : isHovered
              ? Z_INDEX_HOVER
              : baseZ;

            return (
              <PricePinMarker
                key={property.id}
                property={property}
                zIndex={zIndex}
                isHovered={isHovered}
                isSelected={isSelected}
                onHover={onHoverProperty}
                onMarkerClick={handleMarkerClick}
              />
            );
          })}

          {activeInfoProperty && activeMarker && (
            <InfoWindow
              anchor={activeMarker}
              onCloseClick={() => {
                setActiveInfoProperty(null);
                setActiveMarker(null);
              }}
              maxWidth={270}
            >
              <div className="w-60 font-sans text-slate-900">
                <div className="relative aspect-[4/3] w-full rounded-md overflow-hidden bg-slate-100 mb-2">
                  <img
                    src={activeInfoProperty.images[0]}
                    alt={activeInfoProperty.street}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-base font-bold tabular-nums">
                  {formatCurrency(activeInfoProperty.price)}
                  {activeInfoProperty.status === 'for_rent' ? '/mo' : ''}
                </div>
                <div className="text-xs text-slate-600 mt-0.5 tabular-nums">
                  {activeInfoProperty.beds} bd · {activeInfoProperty.baths} ba ·{' '}
                  {activeInfoProperty.sqft > 0
                    ? `${activeInfoProperty.sqft.toLocaleString()} sqft`
                    : `${activeInfoProperty.lotSqft.toLocaleString()} sqft lot`}
                </div>
                <div className="text-xs text-slate-800 font-medium mt-1 truncate">
                  {activeInfoProperty.street}, {activeInfoProperty.city}
                </div>
                <button
                  type="button"
                  onClick={() => onSelectProperty(activeInfoProperty)}
                  className="mt-2.5 w-full py-1.5 px-3 text-xs font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-md cursor-pointer"
                >
                  View full property details
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      )}

      {/* Top-Left Metro Quick Jump & Bounds Filter */}
      <div className="absolute top-3 left-3 right-14 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm p-1">
          <button
            type="button"
            onClick={onResetNationalView}
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded cursor-pointer flex items-center gap-1"
            title="View all South Carolina markets"
          >
            <Compass className="w-3.5 h-3.5 text-[#006AFF]" />
            <span>All SC</span>
          </button>
          <span className="h-4 w-px bg-slate-200" />
          {MARKET_HUBS.slice(0, 5).map((hub) => (
            <button
              key={hub.id}
              type="button"
              onClick={() => onSelectCityHub(hub.id)}
              className="hidden sm:inline-flex px-2 py-1 text-xs font-medium text-slate-700 hover:text-[#006AFF] hover:bg-blue-50 rounded cursor-pointer"
            >
              {hub.city}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onToggleSearchInBounds(!searchInBounds)}
          className={`pointer-events-auto px-3 py-1.5 text-xs font-semibold rounded-lg border shadow-sm cursor-pointer transition-colors ${
            searchInBounds
              ? 'bg-[#006AFF] text-white border-[#0051C3]'
              : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {searchInBounds ? 'Filtering by map area' : 'Showing all areas'}
        </button>
      </div>

      {/* Bottom-Left Map Layers Control */}
      <div className={`absolute bottom-4 left-3 z-10 ${useStreetMap ? 'hidden' : ''}`}>
        {showLayersMenu && (
          <div className="mb-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">Map Layers</span>
              <button
                type="button"
                onClick={() => setShowLayersMenu(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Close map layers"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(['roadmap', 'satellite', 'hybrid', 'terrain'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMapType(type)}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md capitalize border cursor-pointer ${
                    mapType === type
                      ? 'bg-blue-50 text-[#006AFF] border-[#006AFF]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTransit}
                  onChange={(e) => setShowTransit(e.target.checked)}
                  className="rounded border-slate-300 text-[#006AFF]"
                />
                <Train className="w-3.5 h-3.5 text-slate-500" />
                <span>Public transit lines</span>
              </label>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowLayersMenu(!showLayersMenu)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg shadow-md text-xs font-semibold text-slate-800 hover:bg-slate-50 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <Layers className="w-4 h-4 text-[#006AFF]" />
          <span>Map layers</span>
        </button>
      </div>
    </div>
  );
};
