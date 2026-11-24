import React, { useState } from 'react';
import { Building2, Check, HelpCircle, Megaphone, UserCheck, X } from 'lucide-react';
import { UtilityModalType } from './TopNav';

interface ZillowUtilityModalProps {
  modalType: UtilityModalType;
  signedInEmail: string | null;
  onClose: () => void;
  onSignIn: (email: string) => void;
  onSignOut: () => void;
  onNavigateRentals: () => void;
  onNavigateAgents: () => void;
}

export const ZillowUtilityModal: React.FC<ZillowUtilityModalProps> = ({
  modalType,
  signedInEmail,
  onClose,
  onSignIn,
  onSignOut,
  onNavigateRentals,
  onNavigateAgents,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [submittedNotice, setSubmittedNotice] = useState<string | null>(null);
  const [rentalAddress, setRentalAddress] = useState('');
  const [rentalPrice, setRentalPrice] = useState('2850');

  if (!modalType) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-[2px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">
            {modalType === 'rentals_manager' && 'Zillow Rental Manager'}
            {modalType === 'advertise' && 'Advertise on Zillow'}
            {modalType === 'help' && 'Zillow Help Center'}
            {modalType === 'signin' && (signedInEmail ? 'Your Zillow Account' : 'Sign in to Zillow')}
          </h2>
          <button
            type="button"
            onClick={() => {
              setSubmittedNotice(null);
              onClose();
            }}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {modalType === 'rentals_manager' && (
            <>
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 text-[#006AFF] shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 leading-relaxed">
                  List your rental property across Zillow, Trulia, and HotPads, screen tenants with
                  background and credit reports, create state-specific leases, and collect rent
                  online.
                </p>
              </div>

              {submittedNotice ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{submittedNotice}</span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSubmittedNotice(
                      `Draft rental listing created for ${rentalAddress || 'your property'} at $${Number(rentalPrice).toLocaleString()}/mo.`
                    );
                  }}
                  className="space-y-3 pt-2"
                >
                  <input
                    type="text"
                    required
                    placeholder="Rental property address"
                    value={rentalAddress}
                    onChange={(e) => setRentalAddress(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg"
                  />
                  <input
                    type="number"
                    required
                    placeholder="Monthly rent ($)"
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg tabular-nums"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 text-sm font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg cursor-pointer"
                    >
                      Post a rental listing
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateRentals();
                      }}
                      className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      Browse rentals
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {modalType === 'advertise' && (
            <>
              <div className="flex items-start gap-3">
                <Megaphone className="w-6 h-6 text-[#006AFF] shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 leading-relaxed">
                  Reach high-intent home buyers, renters, and borrowers across Zillow’s national
                  real estate marketplace.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="font-bold text-slate-900">Premier Agent®</div>
                  <p className="text-slate-600">
                    Connect directly with live buyers touring homes in your target ZIP codes.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                  <div className="font-bold text-slate-900">Multifamily &amp; Builders</div>
                  <p className="text-slate-600">
                    Syndicate apartment communities and new-construction inventory in real time.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateAgents();
                }}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg cursor-pointer"
              >
                Explore Premier Agent Directory
              </button>
            </>
          )}

          {modalType === 'help' && (
            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <HelpCircle className="w-5 h-5 text-[#006AFF]" />
                <span>Frequently Asked Questions</span>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">How is a Zestimate® calculated?</div>
                <p className="text-slate-600">
                  Zestimate incorporates public MLS data, tax assessments, home features, recent
                  comparable sales, and local market appreciation trends.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">
                  How do I narrow my search?
                </div>
                <p className="text-slate-600">
                  Type a city, street or ZIP in the search bar, then use Price, Beds &amp; Baths, Home Type
                  and More to filter the results.
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">
                  How do I schedule an in-person or video tour?
                </div>
                <p className="text-slate-600">
                  Open any listing card and submit the Request a Tour form to manage appointments in
                  your Saved Activity drawer.
                </p>
              </div>
            </div>
          )}

          {modalType === 'signin' && (
            <>
              {signedInEmail ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-[#006AFF]" />
                    <div className="text-sm">
                      <div className="font-semibold text-slate-900">Signed in</div>
                      <div className="text-slate-600">{signedInEmail}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSignOut();
                      onClose();
                    }}
                    className="w-full py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (emailInput.trim()) {
                      onSignIn(emailInput.trim());
                      onClose();
                    }
                  }}
                  className="space-y-3"
                >
                  <p className="text-sm text-slate-600">
                    Sign in with your email to personalize home recommendations, saved searches, and
                    tour alerts.
                  </p>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full h-11 px-3.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#006AFF]"
                  />
                  <button
                    type="submit"
                    className="w-full py-2.5 text-sm font-semibold text-white bg-[#006AFF] hover:bg-[#0051C3] rounded-lg cursor-pointer"
                  >
                    Continue
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
