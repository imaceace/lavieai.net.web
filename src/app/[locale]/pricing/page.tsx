"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X, Zap, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useUserStore } from "@/stores/userStore";
import { whitelistApi } from "@/lib/api-client";
import { useToast } from "@/hooks/useToast";

const plans = [
  {
    name: "Free",
    tier: "free",
    price: 0,
    yearlyPrice: 0,
    pointsDesc: "10 credits daily login bonus",
    features: [
      { text: "10 credits daily login bonus", included: true },
      { text: "Unlimited Basic Slow Mode", included: true },
      { text: "Standard Resolution", included: true },
      { text: "Community Support", included: true },
      { text: "Access to Creator Use Cases", included: false },
      { text: "Access to Pro & Max models", included: false },
      { text: "Commercial License", included: false },
      { text: "Private Generations", included: false },
    ],
    popular: false,
  },
  {
    name: "Creator",
    tier: "creator",
    price: 19.9,
    yearlyPrice: 15.9,
    pointsDesc: "1,200 credits monthly",
    features: [
      { text: "1,200 subscription credits/mo", included: true },
      { text: "+ 20 daily login bonus credits", included: true },
      { text: "~300 Fast Mode images", included: true },
      { text: "Access to Creator Use Cases", included: true },
      { text: "Access to Pro & Max models", included: true },
      { text: "Commercial License", included: true },
      { text: "Private Generations", included: true },
      { text: "Standard Priority Queue", included: true },
      { text: "Access to Pro Use Cases", included: false },
      { text: "Access to Ultra models", included: false },
      { text: "Early access to new models", included: false },
    ],
    popular: false,
  },
  {
    name: "Plus",
    tier: "plus",
    price: 49.9,
    yearlyPrice: 39.9,
    pointsDesc: "3,000 credits monthly",
    features: [
      { text: "3,000 subscription credits/mo", included: true },
      { text: "+ 50 daily login bonus credits", included: true },
      { text: "~750 Fast Mode images", included: true },
      { text: "Access to Plus Use Cases", included: true },
      { text: "Access to Max & Ultra models", included: true },
      { text: "Commercial License", included: true },
      { text: "Private Generations", included: true },
      { text: "Priority Fast Queue", included: true },
      { text: "Early access to new models", included: true },
      { text: "Priority Support", included: true },
      { text: "Access to Studio Use Cases", included: false },
      { text: "Highest Priority Queue", included: false },
      { text: "API Access", included: false },
    ],
    popular: true,
  },
  {
    name: "Studio",
    tier: "studio",
    price: 99.9,
    yearlyPrice: 79.9,
    pointsDesc: "6,000 credits monthly",
    features: [
      { text: "6,000 subscription credits/mo", included: true },
      { text: "+ 100 daily login bonus credits", included: true },
      { text: "~1,500 Fast Mode images", included: true },
      { text: "Access to All Premium Use Cases", included: true },
      { text: "Access to Max & Ultra models", included: true },
      { text: "Commercial License", included: true },
      { text: "Private Generations", included: true },
      { text: "Highest Priority Queue", included: true },
      { text: "Early access to new models", included: true },
      { text: "Priority Support", included: true },
      { text: "API Access (Coming Soon)", included: true },
    ],
    popular: false,
  },
];

const TIER_WEIGHT: Record<string, number> = {
  free: 0,
  creator: 1,
  studio: 4,
  plus: 2,
};

const defaultPointPackages = [
  { id: "500", points: 500, price: 9.9, perPoint: 0.0198 },
  { id: "1000", points: 1000, price: 18.9, perPoint: 0.0189, popular: true },
  { id: "3000", points: 3000, price: 49.9, perPoint: 0.0166 },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutCooldownUntil, setCheckoutCooldownUntil] = useState(0);
  const [checkoutNow, setCheckoutNow] = useState(Date.now());
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistStatus, setWaitlistStatus] = useState<"idle" | "success" | "error">("idle");
  const [waitlistMsg, setWaitlistMsg] = useState("");
  
  const t = useTranslations("pricing");
  const { addToast } = useToast();
  const { isLoggedIn, openLoginModal, user } = useUserStore();
  const isWhitelisted = user?.isWhitelisted;
  const canBuyPoints = user?.canBuyPoints;
  
  const pointPackages = canBuyPoints 
    ? [{ points: 1, price: 0.02, perPoint: 0.02, id: "1" }, ...defaultPointPackages]
    : defaultPointPackages;

  const currentTier = (user?.subscription_type || 'free').toLowerCase();
  const currentWeight = TIER_WEIGHT[currentTier] ?? 0;
  const purchasePaused = Boolean(user?.purchase_paused);
  const purchasePausedUntil = user?.purchase_paused_until || null;
  const targetInterval: "monthly" | "yearly" = isYearly ? "yearly" : "monthly";
  const currentInterval: "monthly" | "yearly" = (user?.subscription_interval === "yearly" ? "yearly" : "monthly");
  const isSameTierCycleSwitchPlan = (plan: typeof plans[0]) =>
    (TIER_WEIGHT[plan.tier] ?? 0) === currentWeight &&
    currentWeight > 0 &&
    targetInterval !== currentInterval;
  const checkoutCooldownSeconds = Math.max(0, Math.ceil((checkoutCooldownUntil - checkoutNow) / 1000));
  const isCheckoutCooldown = checkoutCooldownUntil > checkoutNow;

  useEffect(() => {
    if (!isCheckoutCooldown) return;
    const timer = setInterval(() => setCheckoutNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [isCheckoutCooldown]);

  const startCheckoutCooldown = () => {
    const now = Date.now();
    setCheckoutNow(now);
    setCheckoutCooldownUntil(now + 15000);
  };

  const isCurrentPlan = (plan: typeof plans[0]) => {
    if (TIER_WEIGHT[plan.tier] !== currentWeight || currentWeight === 0) return false;
    const userInterval = user?.subscription_interval;
    if (!userInterval) return true; // Fallback
    return (userInterval === 'yearly') === isYearly;
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setWaitlistLoading(true);
    setWaitlistStatus("idle");
    setWaitlistMsg("");
    try {
      const res = await whitelistApi.join(waitlistEmail);
      if (res.success) {
        setWaitlistStatus("success");
        setWaitlistMsg("Successfully joined the waitlist!");
        setWaitlistEmail("");
      } else {
        setWaitlistStatus("error");
        setWaitlistMsg(res.error?.message || "Failed to join waitlist");
      }
    } catch (err: any) {
      setWaitlistStatus("error");
      setWaitlistMsg(err.message || "Failed to join waitlist");
    } finally {
      setWaitlistLoading(false);
    }
  };

  const getPrice = (plan: typeof plans[0]) => {
    if (plan.price === 0) return 0;
    return isYearly ? plan.yearlyPrice : plan.price;
  };

  const createSubscriptionCheckout = async (planTier: "creator" | "plus" | "studio") => {
    const checkoutRes = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/subscription/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        plan: planTier,
        type: isYearly ? 'yearly' : 'monthly',
      }),
    });
    const checkoutData = await checkoutRes.json();
    if (!checkoutRes.ok || !checkoutData?.success || !checkoutData?.data?.checkoutUrl) {
      throw new Error(checkoutData?.error?.message || 'Failed to create checkout');
    }
    return checkoutData.data.checkoutUrl as string;
  };

  const handlePlanClick = async (plan: typeof plans[0]) => {
    if (!isLoggedIn) {
      openLoginModal();
      return;
    }
    if (purchasePaused && plan.price > 0) {
      addToast("For account safety, purchases are temporarily paused on this account.", "info");
      return;
    }
    
    if (!isWhitelisted && plan.price > 0) {
      return; // Internal testing restriction
    }
    
    const planWeight = TIER_WEIGHT[plan.tier] ?? 0;
    
    if (planWeight === currentWeight) {
      // Same tier, different billing period switch (e.g. plus monthly -> plus yearly)
      if (!isCurrentPlan(plan) && currentWeight > 0) {
        setSelectedPlan(plan);
        setIsUpgradeModalOpen(true);
        return;
      }
      window.location.href = "/profile"; // Manage current plan
      return;
    }
    
    if (planWeight > currentWeight && currentWeight > 0) {
      // Upgrading from an existing paid plan
      setSelectedPlan(plan);
      setIsUpgradeModalOpen(true);
      return;
    }
    
    if (planWeight < currentWeight && planWeight > 0) {
      // Downgrades are currently not allowed directly via UI to prevent abuse
      addToast("Direct downgrades are currently not supported. Please contact support@lavieai.net to request a downgrade.", "info");
      return;
    }
    
    // Normal subscribe (free -> paid)
    if (isCheckoutCooldown) {
      addToast(`Please wait ${checkoutCooldownSeconds}s before trying again.`, "info");
      return;
    }
    try {
      startCheckoutCooldown();
      const checkoutUrl = await createSubscriptionCheckout(plan.tier as "creator" | "plus" | "studio");
      addToast('Redirecting to checkout...', 'success');
      window.location.href = checkoutUrl;
    } catch (e) {
      addToast('Failed to create checkout. Please try again.', 'error');
    }
  };

  const confirmUpgrade = async () => {
    if (!selectedPlan || !user) return;
    if (purchasePaused) {
      addToast("For account safety, purchases are temporarily paused on this account.", "info");
      return;
    }
    if (isCheckoutCooldown) {
      addToast(`Please wait ${checkoutCooldownSeconds}s before trying again.`, "info");
      return;
    }
    setIsProcessing(true);
    
    try {
      const isSameTierCycleSwitch = isSameTierCycleSwitchPlan(selectedPlan);
      const consentText = isSameTierCycleSwitch
        ? `I agree to switch my billing cycle from ${selectedPlan.name} (${currentInterval}) to ${selectedPlan.name} (${targetInterval}). I understand this switch is effective today, and my previous subscription will be settled based on remaining refundable credits under current refund policy. Refund arrival depends on payment channel processing time (typically 3-7 business days). I acknowledge the 24-hour priority review policy.`
        : `I agree to upgrade to ${selectedPlan.name}. I understand my current subscription will be replaced by the new plan effective today, and no extra reward/bonus credits are issued outside normal subscription credit allocation. Refund arrival depends on payment channel processing time (typically 3-7 business days). I acknowledge the 24-hour priority review policy.`;
      
      const res = await fetch(process.env.NEXT_PUBLIC_API_URL + '/api/subscription/upgrade-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          old_plan: currentTier,
          new_plan: selectedPlan.tier,
          consent_text: consentText,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to record consent');
      
      startCheckoutCooldown();
      const checkoutUrl = await createSubscriptionCheckout(selectedPlan.tier as "creator" | "plus" | "studio");
      addToast('Consent recorded! Redirecting to checkout...', 'success');
      setIsUpgradeModalOpen(false);
      window.location.href = checkoutUrl;
    } catch (e) {
      addToast('Something went wrong. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const faqs = [
    {
      q: t('faq.q1.q'),
      a: t('faq.q1.a'),
    },
    {
      q: t('faq.q2.q'),
      a: t('faq.q2.a'),
    },
    {
      q: t('faq.q3.q'),
      a: t('faq.q3.a'),
    },
    {
      q: t('faq.q4.q'),
      a: t('faq.q4.a'),
    },
    {
      q: t('faq.q5.q'),
      a: t('faq.q5.a'),
    },
    {
      q: t('faq.q6.q'),
      a: t('faq.q6.a'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('title')}</h1>
          <p className="text-gray-600 mb-6">
            {t('subtitle')}
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                !isYearly ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t('monthly')}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                isYearly ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t('yearly')}
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                {t('save')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Beta Waitlist Banner */}
      {!isWhitelisted && (
        <div className="bg-indigo-50 border-y border-indigo-100 py-8 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-indigo-900 mb-2">Join our Closed Beta Waitlist</h2>
            <p className="text-indigo-700 mb-6">Currently, premium plans are only available to whitelisted users. Submit your email to get notified when we open up!</p>
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                required
                className="flex-1 px-4 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                type="submit" 
                disabled={waitlistLoading}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-70 flex items-center justify-center min-w-[120px]"
              >
                {waitlistLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join Waitlist"}
              </button>
            </form>
            {waitlistStatus === 'success' && <p className="text-green-600 mt-3 text-sm font-medium">{waitlistMsg}</p>}
            {waitlistStatus === 'error' && <p className="text-red-500 mt-3 text-sm">{waitlistMsg}</p>}
          </div>
        </div>
      )}

      {/* Plans */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                  key={plan.name}
                  className={`bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    isCurrentPlan(plan)
                      ? "ring-2 ring-green-500 relative hover:ring-green-400"
                      : plan.popular
                      ? "ring-2 ring-indigo-600 relative hover:ring-indigo-500"
                      : "hover:ring-1 hover:ring-gray-300"
                  }`}
                >
                {isCurrentPlan(plan) ? (
                  <div className="bg-green-500 text-white text-center py-2 text-sm font-medium">
                    Current Plan
                  </div>
                ) : plan.popular ? (
                  <div className="bg-indigo-600 text-white text-center py-2 text-sm font-medium">
                    {t('mostPopular')}
                  </div>
                ) : null}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">${getPrice(plan)}</span>
                    {plan.price > 0 && (
                      <span className="text-gray-500">/monthly</span>
                    )}
                    {plan.price > 0 && isYearly && (
                      <div className="text-xs text-gray-500 mt-1 font-medium">
                        Billed ${(plan.yearlyPrice * 12).toFixed(1)} annually
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    {plan.pointsDesc}
                  </p>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className={`flex items-start gap-2 text-sm ${feature.included ? 'text-gray-700' : 'text-gray-400'}`}>
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                        )}
                        {feature.text}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePlanClick(plan)}
                    disabled={
                      isCheckoutCooldown ||
                      (purchasePaused && plan.price > 0) ||
                      (isLoggedIn && !isWhitelisted && plan.price > 0) || 
                      (TIER_WEIGHT[plan.tier] < currentWeight && currentWeight > 0 && plan.price > 0)
                    }
                    className={`block w-full text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                      isCheckoutCooldown
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : isLoggedIn && !isWhitelisted && plan.price > 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : TIER_WEIGHT[plan.tier] < currentWeight && currentWeight > 0 && plan.price > 0
                        ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200"
                        : isCurrentPlan(plan)
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300"
                        : plan.popular
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {plan.price === 0 
                      ? t('getStarted') 
                      : (purchasePaused && plan.price > 0 ? "Temporarily Paused" :
                         isCheckoutCooldown ? `Please wait (${checkoutCooldownSeconds}s)` :
                         isLoggedIn && !isWhitelisted ? 'Internal Testing' : 
                          isCurrentPlan(plan) ? 'Current Plan' :
                          TIER_WEIGHT[plan.tier] > currentWeight && currentWeight > 0 ? 'Upgrade' :
                          TIER_WEIGHT[plan.tier] < currentWeight && currentWeight > 0 ? 'Unavailable' :
                          t('subscribe')
                        )
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Buy Points */}
      {canBuyPoints && (
        <section className="py-12 px-4 bg-white">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-4">{t('buyPoints')}</h2>
            <p className="text-gray-600 text-center mb-8">
              {t('buyPointsDesc')}
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {pointPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`bg-gray-50 rounded-2xl p-6 text-center ${
                    pkg.popular ? "ring-2 ring-indigo-600" : ""
                  }`}
                >
                  {pkg.popular && (
                    <span className="inline-block px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full mb-2">
                      {t('bestValue')}
                    </span>
                  )}
                  <div className="text-4xl font-bold mb-2">{pkg.points}</div>
                  <div className="text-2xl font-bold text-indigo-600 mb-2">${pkg.price}</div>
                  <p className="text-sm text-gray-500 mb-4">
                    {t('perPoint', { price: pkg.perPoint.toFixed(3) })}
                  </p>
                  <button 
                    onClick={() => {
                      if (!isLoggedIn) {
                        openLoginModal();
                      } else if (!isWhitelisted) {
                        // Do nothing, disabled
                      } else {
                        // TODO: Implement points purchase flow
                      }
                    }}
                    disabled={isLoggedIn && !isWhitelisted}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      isLoggedIn && !isWhitelisted
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50"
                    }`}
                  >
                    {isLoggedIn && !isWhitelisted ? 'Internal Testing' : t('buyBtn', { points: pkg.points })}
                  </button>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-lg flex items-start gap-3">
              <div className="mt-0.5">ℹ️</div>
              <div>
                <p className="font-medium mb-1">About Credit Packages</p>
                <p>Credit packages add non-expiring credits to your account. <strong>Note:</strong> They do not unlock premium features like Private Generations, Commercial Licenses, or access to Ultra models. An active Subscription is required for these features.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-8">{t('faqTitle')}</h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden p-4">
                <h3 className="font-medium mb-2 flex items-start gap-2 text-gray-900">
                  <span className="text-indigo-600">{i + 1}.</span>
                  <span>{faq.q}</span>
                </h3>
                <div className="text-gray-600 pl-5 text-sm">
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 bg-indigo-600 text-white">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">{t('readyToCreate')}</h2>
          <p className="text-indigo-100 mb-6">
            {t('readyDesc')}
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            {t('getStarted')}
          </Link>
        </div>
      </section>

      {/* Upgrade Consent Modal */}
      {isUpgradeModalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-5 border-b bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Upgrade Subscription</h3>
              <button 
                onClick={() => setIsUpgradeModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 shadow-sm">
                <p className="text-amber-900 font-semibold mb-3 flex items-center gap-2">
                  <span className="text-xl">⚠️</span> Important Notice Regarding Upgrades
                </p>
                <p className="text-amber-800 text-sm mb-4 leading-relaxed">
                  You are about to upgrade from your current plan to <strong className="bg-amber-100 px-1 rounded">{selectedPlan.name}</strong>. Please read carefully:
                </p>
                <ul className="list-disc pl-5 text-amber-800 text-sm space-y-2 marker:text-amber-400">
                  <li>Your new billing cycle will start <strong>immediately today</strong>.</li>
                  <li>Your old subscription will be canceled automatically.</li>
                  <li>Your previous subscription will be settled automatically based on remaining refundable credits under our current refund policy.</li>
                  <li>Credit allocation and any related refund settlement follow our current subscription policy.</li>
                  <li>Refund arrival depends on your payment channel processing time and is typically completed within 3-7 business days.</li>
                  {isSameTierCycleSwitchPlan(selectedPlan) && (
                    <li>For same-tier billing-cycle switches, the new subscription is effective today and the previous one is settled based on remaining refundable credits.</li>
                  )}
                </ul>
              </div>

              {purchasePaused && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-800">
                  <p className="font-medium mb-1">Purchases Temporarily Paused</p>
                  <p>
                    For account safety, purchases are temporarily paused on this account.
                    {purchasePausedUntil ? ` You can try again after ${new Date(purchasePausedUntil * 1000).toLocaleString()}.` : " Please contact support for review."}
                  </p>
                </div>
              )}
              
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm text-blue-800">
                <p className="font-medium mb-1">24-Hour Priority Review</p>
                <p className="text-blue-700 opacity-90">Upgraded by mistake? Contact <a href="mailto:support@lavieai.net" className="underline font-medium hover:text-blue-900">support@lavieai.net</a> within 24 hours for priority review. Refund arrival time depends on your payment channel (typically 3-7 business days).</p>
              </div>

              <p className="text-sm text-gray-500 mb-6 text-center">
                By clicking "Confirm Upgrade", you agree to these terms. This agreement will be recorded in your receipt.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmUpgrade}
                  disabled={isProcessing || isCheckoutCooldown}
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 disabled:opacity-50 flex justify-center items-center"
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : isCheckoutCooldown ? (
                    `Please wait (${checkoutCooldownSeconds}s)`
                  ) : (
                    "Confirm Upgrade"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
