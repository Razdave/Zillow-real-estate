import React, { useState } from 'react';
import { Award, Check, MapPin, Search, Star, X } from 'lucide-react';
import { PREMIER_AGENTS } from '../data/properties';
import { AgentProfile } from '../types/realEstate';
import { formatCurrency } from '../utils/propertyFilters';

export const AgentFinderView: React.FC = () => {
  const [cityFilter, setCityFilter] = useState('All');
  const [specialtyFilter, setSpecialtyFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<AgentProfile | null>(null);
  const [messageSent, setMessageSent] = useState(false);

  const cities = ['All', ...Array.from(new Set(PREMIER_AGENTS.map((a) => a.city)))];
  const specialties = [
    'All',
    "Buyer's Agent",
    'Listing Agent',
    'Luxury',
    'New Construction',
    'First-Time Buyers',
    'Waterfront',
  ];

  const filteredAgents = PREMIER_AGENTS.filter((agent) => {
    if (cityFilter !== 'All' && agent.city !== cityFilter) return false;
    if (specialtyFilter !== 'All' && !agent.specialties.includes(specialtyFilter)) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const hay = `${agent.name} ${agent.brokerage} ${agent.city} ${agent.state} ${agent.specialties.join(' ')}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-10 space-y-8">
      <section className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold text-[#006AFF]">Zillow Premier Agent® Directory</p>
        <h1
          className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Find a top-rated real estate agent in your market
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Browse verified transaction histories, neighborhood specialties, and client reviews to
          connect directly with an experienced buyer’s or listing agent.
        </p>
      </section>

      {/* Filters */}
      <section className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agent name, brokerage, or city"
            className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#006AFF]"
          />
        </div>

        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg"
          aria-label="Filter by city"
        >
          {cities.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All markets' : c}
            </option>
          ))}
        </select>

        <select
          value={specialtyFilter}
          onChange={(e) => setSpecialtyFilter(e.target.value)}
          className="h-10 px-3 text-sm bg-white border border-slate-300 rounded-lg"
          aria-label="Filter by specialty"
        >
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s === 'All' ? 'All specialties' : s}
            </option>
          ))}
        </select>
      </section>

      {/* Agent Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <article
            key={agent.id}
            className="p-5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {agent.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{agent.name}</h2>
                    <p className="text-xs text-slate-600">{agent.brokerage}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 tabular-nums">
                  <div className="inline-flex items-center gap-1 text-sm font-bold text-slate-900">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{agent.rating.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">{agent.reviewCount} reviews</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-medium text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-[#006AFF]" />
                  {agent.city}, {agent.state}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{agent.recentSales12Mo} sales last 12 mos</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{agent.priceRange}</span>
              </div>

              <p className="text-xs leading-relaxed text-slate-700">{agent.bio}</p>

              <div className="text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Specialties:</span>{' '}
                {agent.specialties.join(' · ')}
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Award className="w-3.5 h-3.5 text-[#006AFF]" />
                  <span>Recent verified closing</span>
                </div>
                <div className="mt-1 text-slate-600 flex justify-between gap-2 tabular-nums">
                  <span className="truncate">{agent.recentSaleAddress}</span>
                  <span className="font-semibold text-slate-900 shrink-0">
                    {formatCurrency(agent.recentSalePrice)}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedAgent(agent);
                setMessageSent(false);
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg cursor-pointer transition-colors"
            >
              Contact {agent.name.split(' ')[0]}
            </button>
          </article>
        ))}
      </section>

      {/* Contact Agent Modal */}
      {selectedAgent && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Contact {selectedAgent.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedAgent.brokerage} · {selectedAgent.license}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Close contact dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {messageSent ? (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Inquiry sent to {selectedAgent.name}</span>
                </div>
                <p>They typically respond within 15 minutes during business hours.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setMessageSent(true);
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  required
                  placeholder="Your full name"
                  className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                />
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                />
                <textarea
                  rows={3}
                  defaultValue={`Hi ${selectedAgent.name.split(' ')[0]}, I'm looking to buy or sell in ${selectedAgent.city} and would love to connect.`}
                  className="w-full p-3 text-sm border border-slate-300 rounded-lg"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 text-sm font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg cursor-pointer"
                >
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
