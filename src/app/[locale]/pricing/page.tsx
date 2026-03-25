"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Zap } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: 0,
    dailyPoints: 100,
    resolution: "1024×1024",
    watermark: true,
    styles: "Basic",
    features: [
      "100 points daily",
      "1024×1024 resolution",
      "Basic styles",
      "Community support",
    ],
    popular: false,
  },
  {
    name: "Basic",
    price: 9.9,
    dailyPoints: 300,
    resolution: "1024×1024",
    watermark: false,
    styles: "All",
    features: [
      "300 points daily",
      "1024×1024 resolution",
      "All styles",
      "No watermark",
      "Priority generation",
      "Email support",
    ],
    popular: true,
  },
  {
    name: "Pro",
    price: 19.9,
    dailyPoints: 800,
    resolution: "1536×1536",
    watermark: false,
    styles: "All",
    features: [
      "800 points daily",
      "1536×1536 resolution",
      "All styles",
      "No watermark",
      "Fast priority generation",
      "Early access to new features",
      "Priority support",
    ],
    popular: false,
  },
  {
    name: "Ultra",
    price: 39.9,
    dailyPoints: 3500,
    resolution: "Unlimited",
    watermark: false,
    styles: "All",
    features: [
      "3500 points daily",
      "Unlimited resolution",
      "All styles",
      "No watermark",
      "Fastest generation",
      "All new features",
      "Dedicated support",
      "API access (coming soon)",
    ],
    popular: false,
  },
];

const pointPackages = [
  { points: 100, price: 2.9, perPoint: 0.029 },
  { points: 500, price: 12.9, perPoint: 0.026, popular: true },
  { points: 1000, price: 24.9, perPoint: 0.025 },
];

const faqs = [
  {
    q: "What are points?",
    a: "Points are credits you use to generate images. Different image sizes and quality levels consume different amounts of points.",
  },
  {
    q: "Do unused points roll over?",
    a: "No, daily points reset at midnight UTC. Purchased points are valid for 30 days from the date of purchase.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We currently accept PayPal. More payment methods coming soon.",
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const getPrice = (monthlyPrice: number) => {
    if (monthlyPrice === 0) return 0;
    return isYearly ? Math.round(monthlyPrice * 0.6 * 10) / 10 : monthlyPrice;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-gray-600 mb-6">
            Start free, upgrade when you need more
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
                !isYearly ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                isYearly ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Yearly
              <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                Save 40%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Plans */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden ${
                  plan.popular ? "ring-2 ring-indigo-600 relative" : ""
                }`}
              >
                {plan.popular && (
                  <div className="bg-indigo-600 text-white text-center py-2 text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">${getPrice(plan.price)}</span>
                    {plan.price > 0 && (
                      <span className="text-gray-500">/{isYearly ? "year" : "month"}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-6">
                    {plan.dailyPoints} points daily
                  </p>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/login"
                    className={`block text-center px-6 py-3 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {plan.price === 0 ? "Get Started" : "Subscribe"}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Buy Points */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-center mb-4">Or Buy Points</h2>
          <p className="text-gray-600 text-center mb-8">
            One-time purchase, no subscription needed
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {pointPackages.map((pkg) => (
              <div
                key={pkg.points}
                className={`bg-gray-50 rounded-2xl p-6 text-center ${
                  pkg.popular ? "ring-2 ring-indigo-600" : ""
                }`}
              >
                {pkg.popular && (
                  <span className="inline-block px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full mb-2">
                    Best Value
                  </span>
                )}
                <div className="text-4xl font-bold mb-2">{pkg.points}</div>
                <div className="text-2xl font-bold text-indigo-600 mb-2">${pkg.price}</div>
                <p className="text-sm text-gray-500 mb-4">
                  ${pkg.perPoint.toFixed(3)} per point
                </p>
                <button className="w-full py-3 border-2 border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
                  Buy {pkg.points} Points
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium">{faq.q}</span>
                  <span className={`text-gray-500 transition-transform ${openFaq === i ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-gray-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 px-4 bg-indigo-600 text-white">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Create?</h2>
          <p className="text-indigo-100 mb-6">
            Start generating amazing images with AI today. No credit card required.
          </p>
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            Start Free
          </Link>
        </div>
      </section>
    </div>
  );
}
