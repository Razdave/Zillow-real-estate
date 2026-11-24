import React from 'react';
import { Property } from '../types/realEstate';
import { formatCurrency } from '../utils/propertyFilters';

/** Development-only mock of a reservation. Never rendered in production builds. */
export const TestReservation: React.FC<{ property: Property }> = ({ property }) => {
  const pct = property.testPaidPct;
  if (!import.meta.env.DEV || !pct) return null;
  const paid = (property.price * pct) / 100;
  return (
    <div role="note" className="my-2 p-3 rounded-lg border-2 border-dashed border-amber-600 bg-amber-50 text-xs text-amber-950">
      <strong className="block">TEST DATA: no real payment</strong>
      {property.testBuyer && <span className="block mt-1">Reserved for {property.testBuyer} (test buyer)</span>}
      <span className="block mt-1">Reserved, {pct}% paid: {formatCurrency(paid)} of {formatCurrency(property.price)}</span>
      <span className="block mt-2 h-2 rounded bg-amber-200 overflow-hidden">
        <span className="block h-full bg-amber-600" style={{ width: `${pct}%` }} />
      </span>
      <span className="block mt-1">Test balance: {formatCurrency(property.price - paid)}</span>
    </div>
  );
};
