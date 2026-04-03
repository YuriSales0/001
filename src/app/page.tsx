"use client";

import Link from "next/link";
import {
  Building2,
  Shield,
  BarChart3,
  Calendar,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    title: "Property Management",
    description:
      "Full visibility into your property's performance with real-time dashboards.",
  },
  {
    icon: Calendar,
    title: "Booking Calendar",
    description:
      "Track reservations, block personal dates, and never miss a checkout.",
  },
  {
    icon: BarChart3,
    title: "Financial Reports",
    description:
      "Monthly statements with itemized breakdowns, downloadable as PDF.",
  },
  {
    icon: Shield,
    title: "Trusted Management",
    description:
      "Transparent commission structure with detailed expense tracking.",
  },
];

const plans = [
  {
    name: "Basic",
    price: "€89",
    period: "/month",
    features: [
      "Property dashboard",
      "Monthly reports",
      "Email notifications",
      "Calendar view",
    ],
  },
  {
    name: "Premium",
    price: "€149",
    period: "/month",
    popular: true,
    features: [
      "Everything in Basic",
      "Priority support",
      "Advanced analytics",
      "Multi-language support",
      "Custom branding",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-navy-900" />
            <span className="text-xl font-bold text-navy-900">
              UnlockCosta
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-navy-700 hover:text-navy-900"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-sm bg-navy-900 text-white px-4 py-2 rounded-lg hover:bg-navy-800 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-navy-900 tracking-tight">
            Your Property in
            <span className="text-gold-400"> Coastal Spain</span>,
            <br />
            Managed with Care
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            UnlockCosta is the premium property management platform for
            short-term rental owners. Track earnings, view bookings, and
            download reports — all in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-navy-900 text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-navy-800 transition-colors"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-gray-300 text-navy-900 px-6 py-3 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors"
            >
              Owner Login
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy-900 text-center mb-12">
            Everything You Need
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <feature.icon className="h-10 w-10 text-gold-400 mb-4" />
                <h3 className="text-lg font-semibold text-navy-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy-900 text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-600 text-center mb-12">
            Choose the plan that fits your needs
          </p>
          <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-8 border-2 ${
                  plan.popular
                    ? "border-gold-400 bg-navy-900 text-white"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.popular && (
                  <span className="text-xs font-semibold bg-gold-400 text-navy-900 px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <h3
                  className={`text-2xl font-bold mt-4 ${
                    plan.popular ? "text-white" : "text-navy-900"
                  }`}
                >
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span
                    className={`text-4xl font-bold ${
                      plan.popular ? "text-white" : "text-navy-900"
                    }`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={
                      plan.popular ? "text-gray-300" : "text-gray-500"
                    }
                  >
                    {plan.period}
                  </span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <CheckCircle2
                        className={`h-4 w-4 ${
                          plan.popular ? "text-gold-400" : "text-green-500"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          plan.popular ? "text-gray-200" : "text-gray-600"
                        }`}
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={`mt-8 block text-center py-3 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? "bg-gold-400 text-navy-900 hover:bg-gold-300"
                      : "bg-navy-900 text-white hover:bg-navy-800"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-navy-900" />
            <span className="font-semibold text-navy-900">UnlockCosta</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; 2026 UnlockCosta. Property management for coastal Spain.
          </p>
        </div>
      </footer>
    </div>
  );
}
