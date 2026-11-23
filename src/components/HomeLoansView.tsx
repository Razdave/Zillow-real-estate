import React, { useState } from 'react';
import { Calculator, Check, Percent, ShieldCheck } from 'lucide-react';
import { MORTGAGE_RATES } from '../data/properties';
import { calculateMonthlyMortgage, formatCurrency } from '../utils/propertyFilters';

export const HomeLoansView: React.FC = () => {
  // Mortgage Payment Calculator
  const [homePrice, setHomePrice] = useState(850000);
  const [downPct, setDownPct] = useState(20);
  const [ratePct, setRatePct] = useState(6.42);
  const [termYears, setTermYears] = useState(30);
  const [hoaMonthly, setHoaMonthly] = useState(120);

  // BuyAbility Affordability Calculator
  const [annualIncome, setAnnualIncome] = useState(195000);
  const [monthlyDebts, setMonthlyDebts] = useState(650);
  const [cashDown, setCashDown] = useState(150000);
  const [creditScore, setCreditScore] = useState('760+');

  // Pre-qualification Form
  const [preQualName, setPreQualName] = useState('');
  const [preQualEmail, setPreQualEmail] = useState('');
  const [preQualSubmitted, setPreQualSubmitted] = useState(false);

  const calc = calculateMonthlyMortgage({
    homePrice,
    downPaymentPct: downPct,
    interestRatePct: ratePct,
    termYears,
    propertyTaxAnnual: Math.round(homePrice * 0.0115),
    hoaMonthly,
  });

  // 36% Back-end DTI Affordability Formula
  const monthlyIncome = annualIncome / 12;
  const maxMonthlyHousing = Math.max(0, monthlyIncome * 0.36 - monthlyDebts);
  const creditAdjRate =
    creditScore === '760+' ? 6.35 : creditScore === '720-759' ? 6.55 : 6.95;
  const monthlyRate = creditAdjRate / 100 / 12;
  const nPayments = 360;
  const piFactor =
    (monthlyRate * Math.pow(1 + monthlyRate, nPayments)) /
    (Math.pow(1 + monthlyRate, nPayments) - 1);
  // Approximate tax+ins = 1.45% / 12 of price
  const maxLoanEstimate = Math.round(
    (maxMonthlyHousing * 0.82) / piFactor
  );
  const comfortableHomeBudget = Math.max(cashDown, maxLoanEstimate + cashDown);

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-10 space-y-12">
      {/* Header */}
      <section className="max-w-3xl space-y-3">
        <p className="text-xs font-semibold text-[#006AFF]">Zillow Home Loans &amp; BuyAbility℠</p>
        <h1
          className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Finance your next home with transparent rates and buying power
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Compare today’s benchmark mortgage rates, calculate monthly principal and escrow costs, and
          discover your personalized BuyAbility℠ price target.
        </p>
      </section>

      {/* Today's Mortgage Rates Table */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2
            className="text-xl font-bold text-slate-900"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Today’s national mortgage rate benchmarks
          </h2>
          <span className="text-xs text-slate-500">Click any rate to load into calculator</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
              <tr>
                <th className="py-3 px-4 font-semibold">Loan product</th>
                <th className="py-3 px-4 font-semibold">Interest rate</th>
                <th className="py-3 px-4 font-semibold">APR</th>
                <th className="py-3 px-4 font-semibold">Points</th>
                <th className="py-3 px-4 font-semibold">Est. payment / $100K</th>
                <th className="py-3 px-4 font-semibold">Program notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {MORTGAGE_RATES.map((q) => (
                <tr
                  key={q.product}
                  onClick={() => {
                    setRatePct(q.rate);
                    if (q.product.includes('15-Year')) setTermYears(15);
                    else setTermYears(30);
                  }}
                  className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{q.product}</td>
                  <td className="py-3.5 px-4 font-bold text-[#006AFF]">{q.rate.toFixed(2)}%</td>
                  <td className="py-3.5 px-4 text-slate-700">{q.apr.toFixed(2)}%</td>
                  <td className="py-3.5 px-4 text-slate-700">{q.points.toFixed(2)}</td>
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    ${q.monthlyPer100k}/mo
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{q.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Two Calculators Side by Side */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Mortgage Calculator */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Calculator className="w-5 h-5 text-[#006AFF]" />
            <h2 className="text-lg font-bold text-slate-900">Monthly Payment Calculator</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Home price ($)</label>
              <input
                type="number"
                step={10000}
                value={homePrice}
                onChange={(e) => setHomePrice(Math.max(50000, Number(e.target.value)))}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Down payment ({downPct}% · {formatCurrency(calc.downPaymentDollar)})
              </label>
              <input
                type="range"
                min={3}
                max={50}
                value={downPct}
                onChange={(e) => setDownPct(Number(e.target.value))}
                className="w-full accent-[#006AFF] mt-2"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Interest rate (%)
              </label>
              <input
                type="number"
                step="0.05"
                value={ratePct}
                onChange={(e) => setRatePct(Number(e.target.value) || 0)}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Loan term</label>
              <select
                value={termYears}
                onChange={(e) => setTermYears(Number(e.target.value))}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value={30}>30-year fixed</option>
                <option value={20}>20-year fixed</option>
                <option value={15}>15-year fixed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Monthly HOA fee ($)
              </label>
              <input
                type="number"
                step={25}
                value={hoaMonthly}
                onChange={(e) => setHoaMonthly(Math.max(0, Number(e.target.value)))}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Estimated monthly payment
              </span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {formatCurrency(calc.totalMonthly)}/mo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs tabular-nums text-slate-700 pt-2 border-t border-slate-200">
              <div>Principal &amp; interest: {formatCurrency(calc.principalAndInterest)}</div>
              <div>Property taxes: {formatCurrency(calc.propertyTax)}</div>
              <div>Homeowners insurance: {formatCurrency(calc.homeInsurance)}</div>
              <div>HOA &amp; PMI: {formatCurrency(calc.hoa + calc.pmi)}</div>
            </div>
          </div>
        </div>

        {/* BuyAbility Affordability Calculator */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Percent className="w-5 h-5 text-[#006AFF]" />
            <h2 className="text-lg font-bold text-slate-900">
              BuyAbility℠ Home Affordability Estimator
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Annual household income ($)
              </label>
              <input
                type="number"
                step={5000}
                value={annualIncome}
                onChange={(e) => setAnnualIncome(Math.max(20000, Number(e.target.value)))}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Monthly debt payments ($)
              </label>
              <input
                type="number"
                step={50}
                value={monthlyDebts}
                onChange={(e) => setMonthlyDebts(Math.max(0, Number(e.target.value)))}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Available down payment ($)
              </label>
              <input
                type="number"
                step={5000}
                value={cashDown}
                onChange={(e) => setCashDown(Math.max(0, Number(e.target.value)))}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Credit score tier
              </label>
              <select
                value={creditScore}
                onChange={(e) => setCreditScore(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="760+">Excellent (760+)</option>
                <option value="720-759">Good (720–759)</option>
                <option value="660-719">Fair (660–719)</option>
              </select>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-2">
            <div className="text-xs font-semibold text-[#006AFF]">
              Estimated target home price
            </div>
            <div className="text-3xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(comfortableHomeBudget)}
            </div>
            <div className="text-xs text-slate-700 tabular-nums">
              Based on a comfortable monthly housing budget of{' '}
              <strong>{formatCurrency(Math.round(maxMonthlyHousing))}/mo</strong> at ~
              {creditAdjRate}% APR.
            </div>
          </div>

          {preQualSubmitted ? (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Pre-qualification estimate ({formatCurrency(comfortableHomeBudget)}) prepared for{' '}
                {preQualName}.
              </span>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (preQualName.trim() && preQualEmail.trim()) setPreQualSubmitted(true);
              }}
              className="flex flex-col sm:flex-row gap-2 pt-2"
            >
              <input
                type="text"
                required
                placeholder="Full name"
                value={preQualName}
                onChange={(e) => setPreQualName(e.target.value)}
                className="flex-1 h-10 px-3 text-xs border border-slate-300 rounded-lg"
              />
              <input
                type="email"
                required
                placeholder="Email for pre-qual letter"
                value={preQualEmail}
                onChange={(e) => setPreQualEmail(e.target.value)}
                className="flex-1 h-10 px-3 text-xs border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="px-4 h-10 text-xs font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Get pre-qualified</span>
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};
