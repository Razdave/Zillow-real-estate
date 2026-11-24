import React, { useState } from 'react';
import { ArrowRight, Check, DollarSign, Home, TrendingUp } from 'lucide-react';
import { IMG_HERO } from '../data/properties';
import { formatCurrency } from '../utils/propertyFilters';

interface SellZestimateViewProps {
  onNavigateAgents: () => void;
}

export const SellZestimateView: React.FC<SellZestimateViewProps> = ({ onNavigateAgents }) => {
  const [address, setAddress] = useState('120 Sample Palmetto St, Charleston, SC 29401');
  const [sqft, setSqft] = useState(2450);
  const [beds, setBeds] = useState(4);
  const [baths, setBaths] = useState(3);
  const [condition, setCondition] = useState<'needs_work' | 'standard' | 'renovated'>('renovated');
  const [mortgageBalance, setMortgageBalance] = useState(420000);
  const [commissionPct, setCommissionPct] = useState(5.0);
  const [showcaseRequested, setShowcaseRequested] = useState(false);

  const basePerSqft = 495;
  const conditionMult =
    condition === 'needs_work' ? 0.88 : condition === 'renovated' ? 1.12 : 1.0;
  const bedBathBonus = (beds - 3) * 28000 + (baths - 2) * 18000;
  const estimatedZestimate = Math.max(
    180000,
    Math.round((sqft * basePerSqft + bedBathBonus) * conditionMult)
  );
  const zestimateLow = Math.round(estimatedZestimate * 0.94);
  const zestimateHigh = Math.round(estimatedZestimate * 1.06);

  const commissionCost = Math.round(estimatedZestimate * (commissionPct / 100));
  const closingCosts = Math.round(estimatedZestimate * 0.015);
  const estimatedNetProceeds = Math.max(
    0,
    estimatedZestimate - mortgageBalance - commissionCost - closingCosts
  );

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-10 space-y-12">
      {/* Hero Banner */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
          <p className="text-xs font-semibold text-[#006AFF]">Zillow Sell &amp; Zestimate®</p>
          <h1
            className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Sell your home with clarity on value and net proceeds
          </h1>
          <p className="text-base text-slate-600 max-w-xl leading-relaxed">
            Get an instant Zestimate® benchmark, model your closing costs, and compare selling with
            a Zillow Partner Agent, Zillow Showcase℠, or For Sale by Owner.
          </p>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Property street address
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="flex-1 h-11 px-3.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#006AFF]"
              />
              <button
                type="button"
                onClick={onNavigateAgents}
                className="px-5 h-11 text-sm font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>Connect with a local agent</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200 min-h-[280px]">
          <img
            src={IMG_HERO}
            alt="Modern residential exterior"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Interactive Zestimate & Seller Net Proceeds Modeler */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 p-6 rounded-2xl border border-slate-200 bg-white space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2
                className="text-xl font-bold text-slate-900"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Interactive Zestimate® &amp; Net Proceeds Calculator
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{address}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-[#006AFF] shrink-0" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Living area ({sqft.toLocaleString()} sqft)
              </label>
              <input
                type="range"
                min={800}
                max={6000}
                step={50}
                value={sqft}
                onChange={(e) => setSqft(Number(e.target.value))}
                className="w-full accent-[#006AFF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bedrooms</label>
              <select
                value={beds}
                onChange={(e) => setBeds(Number(e.target.value))}
                className="w-full h-9 px-2.5 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} bedrooms
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Bathrooms</label>
              <select
                value={baths}
                onChange={(e) => setBaths(Number(e.target.value))}
                className="w-full h-9 px-2.5 text-sm border border-slate-300 rounded-lg bg-white"
              >
                {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} bathrooms
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Home condition &amp; updates
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'needs_work', label: 'Needs Updates' },
                  { id: 'standard', label: 'Move-in Ready' },
                  { id: 'renovated', label: 'Fully Renovated' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCondition(c.id)}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border cursor-pointer ${
                    condition === c.id
                      ? 'bg-blue-50 border-[#006AFF] text-[#006AFF]'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Remaining mortgage payoff ($)
              </label>
              <input
                type="number"
                step={5000}
                value={mortgageBalance}
                onChange={(e) => setMortgageBalance(Math.max(0, Number(e.target.value)))}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Est. brokerage fee ({commissionPct.toFixed(1)}%)
              </label>
              <input
                type="range"
                min={0}
                max={6}
                step={0.5}
                value={commissionPct}
                onChange={(e) => setCommissionPct(Number(e.target.value))}
                className="w-full accent-[#006AFF] mt-2"
              />
            </div>
          </div>
        </div>

        {/* Live Zestimate Output Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl border border-slate-200 bg-slate-50 space-y-5">
          <div>
            <div className="text-xs font-semibold text-slate-500">Estimated Zestimate®</div>
            <div className="text-4xl font-bold text-slate-900 tabular-nums mt-1">
              {formatCurrency(estimatedZestimate)}
            </div>
            <div className="text-xs text-slate-600 mt-1 tabular-nums">
              Range: {formatCurrency(zestimateLow)} – {formatCurrency(zestimateHigh)}
            </div>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-200 text-sm tabular-nums">
            <div className="flex justify-between">
              <span className="text-slate-600">Estimated sale price</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(estimatedZestimate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Mortgage payoff</span>
              <span className="font-medium text-slate-700">
                −{formatCurrency(mortgageBalance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Brokerage commission ({commissionPct}%)</span>
              <span className="font-medium text-slate-700">−{formatCurrency(commissionCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Est. closing &amp; transfer taxes (1.5%)</span>
              <span className="font-medium text-slate-700">−{formatCurrency(closingCosts)}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-bold text-slate-900">Estimated net proceeds</span>
              <span className="text-2xl font-bold text-emerald-700">
                {formatCurrency(estimatedNetProceeds)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Selling Paths Comparison */}
      <section className="space-y-4">
        <h2
          className="text-2xl font-bold text-slate-900"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Ways to sell on Zillow
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <Home className="w-6 h-6 text-[#006AFF]" />
              <h3 className="text-lg font-bold text-slate-900">Zillow Showcase℠ Listing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Stand out with interactive 3D tours, high-resolution floor plans, priority placement
                in search results, and dedicated email alerts to active local buyers.
              </p>
            </div>
            {showcaseRequested ? (
              <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Showcase agent intro requested for {address}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowcaseRequested(true)}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg cursor-pointer"
              >
                Request Showcase℠ Agent
              </button>
            )}
          </div>

          <div className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <DollarSign className="w-6 h-6 text-[#006AFF]" />
              <h3 className="text-lg font-bold text-slate-900">Sell with a Partner Agent</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Work with a vetted local Premier Agent who brings comparative pricing data, staging
                guidance, and full negotiation management from listing to closing.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateAgents}
              className="w-full py-2.5 px-4 text-xs font-semibold text-[#006AFF] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
            >
              Compare local listing agents
            </button>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 bg-white flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <TrendingUp className="w-6 h-6 text-[#006AFF]" />
              <h3 className="text-lg font-bold text-slate-900">Sell For Sale By Owner</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Publish your FSBO listing directly to Zillow buyers, manage tour requests from your
                dashboard, and retain full control over showing schedules.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateAgents}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Review FSBO checklist
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
