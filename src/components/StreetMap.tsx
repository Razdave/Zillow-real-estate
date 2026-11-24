import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapBoundsLiteral, Property } from '../types/realEstate';
import { formatCompactPrice, formatCurrency } from '../utils/propertyFilters';

interface Props {
  properties: Property[];
  hoveredId: string | null;
  cameraTarget: { center: { lat: number; lng: number }; zoom: number; nonce: number };
  onBoundsChange: (b: MapBoundsLiteral) => void;
  onHover: (id: string | null) => void;
  onSelect: (p: Property) => void;
}

/** OpenStreetMap view used when Google Maps has no key or fails to load. */
export const StreetMap: React.FC<Props> = (props) => {
  const { properties, hoveredId, cameraTarget } = props;
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef(new Map<string, L.Marker>());
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    if (!box.current) return;
    const { center, zoom } = latest.current.cameraTarget;
    const m = L.map(box.current, { zoomControl: false }).setView([center.lat, center.lng], zoom);
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(m);
    const report = () => {
      const b = m.getBounds();
      latest.current.onBoundsChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    };
    m.on('moveend', report);
    report();
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(box.current);
    map.current = m;
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
      markers.current.clear();
    };
  }, []);

  useEffect(() => {
    map.current?.setView([cameraTarget.center.lat, cameraTarget.center.lng], cameraTarget.zoom);
  }, [cameraTarget]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const keep = new Set(properties.map((p) => p.id));
    markers.current.forEach((marker, id) => {
      if (!keep.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    });
    for (const p of properties) {
      if (markers.current.has(p.id)) continue;
      const pin = document.createElement('span');
      pin.className = 'street-pin';
      pin.textContent = formatCompactPrice(p.price, p.status === 'for_rent');
      const marker = L.marker([p.lat, p.lng], {
        icon: L.divIcon({ html: pin, className: '', iconSize: [0, 0] }),
        title: `${formatCurrency(p.price)} - ${p.street}`,
        riseOnHover: true,
      })
        .on('mouseover', () => latest.current.onHover(p.id))
        .on('mouseout', () => latest.current.onHover(null))
        .on('click', () => latest.current.onSelect(p))
        .addTo(m);
      markers.current.set(p.id, marker);
    }
  }, [properties]);

  useEffect(() => {
    markers.current.forEach((marker, id) => {
      marker.getElement()?.querySelector('.street-pin')?.classList.toggle('is-active', id === hoveredId);
      marker.setZIndexOffset(id === hoveredId ? 1000 : 0);
    });
  }, [hoveredId, properties]);

  return <div ref={box} className="isolate w-full h-full" />;
};
