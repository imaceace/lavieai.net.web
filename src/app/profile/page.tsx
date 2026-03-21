"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/stores/userStore";

type Tab = "overview" | "points" | "history" | "subscription";

export default function ProfilePage() {
  const { user, isLoggedIn } = useUserStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch user data and history
    setIsLoading(false);
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to view your profile</h1>
          <Link href="/login" className="text-indigo-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "points", label: "Points History" },
    { id: "history", label: "Generation History" },
    { id: "subscription", label: "Subscription" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full rounded-full" />
              ) : (
                <span className="text-2xl font-bold text-indigo-600">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              <p className="text-gray-600">{user?.email}</p>
              <span className="inline-block mt-1 px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                {user?.subscription?.toUpperCase()} Plan
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Current Points</p>
            <p className="text-2xl font-bold text-indigo-600">{user?.points || 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Daily Limit</p>
            <p className="text-2xl font-bold">100</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">This Month</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Generated</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm">
          <div className="border-b">
            <nav className="flex gap-6 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Link
                    href="/pricing"
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                  >
                    Upgrade Plan
                  </Link>
                  <Link
                    href="/pricing"
                    className="px-6 py-3 border rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Buy Points
                  </Link>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Your Subscription</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{user?.subscription?.toUpperCase()} Plan</p>
                        <p className="text-sm text-gray-600">$0.00/month</p>
                      </div>
                      <span className="text-sm text-green-600">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "points" && (
              <div>
                <h3 className="font-semibold mb-4">Points History</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b">
                    <div>
                      <p className="font-medium">Daily Bonus</p>
                      <p className="text-sm text-gray-500">2026-03-21</p>
                    </div>
                    <span className="text-green-600 font-medium">+100</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <div>
                      <p className="font-medium">Image Generation</p>
                      <p className="text-sm text-gray-500">2026-03-21</p>
                    </div>
                    <span className="text-red-600 font-medium">-30</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b">
                    <div>
                      <p className="font-medium">First Login Bonus</p>
                      <p className="text-sm text-gray-500">2026-03-20</p>
                    </div>
                    <span className="text-green-600 font-medium">+100</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <h3 className="font-semibold mb-4">Generation History</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center"
                    >
                      <span className="text-4xl">🎨</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-gray-500 mt-4">No more items</p>
              </div>
            )}

            {activeTab === "subscription" && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Current Plan</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Free Plan</p>
                        <p className="text-sm text-gray-600">$0/month</p>
                      </div>
                      <span className="text-sm text-green-600">Active</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Available Plans</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">Basic</h4>
                      <p className="text-2xl font-bold my-2">$9.9<span className="text-sm font-normal">/mo</span></p>
                      <p className="text-sm text-gray-600 mb-4">300 points/day</p>
                      <button className="w-full py-2 border rounded-lg hover:bg-gray-50">
                        Subscribe
                      </button>
                    </div>
                    <div className="border-2 border-indigo-600 rounded-lg p-4 relative">
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded">
                        Popular
                      </span>
                      <h4 className="font-medium">Pro</h4>
                      <p className="text-2xl font-bold my-2">$19.9<span className="text-sm font-normal">/mo</span></p>
                      <p className="text-sm text-gray-600 mb-4">800 points/day</p>
                      <button className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Subscribe
                      </button>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium">Ultra</h4>
                      <p className="text-2xl font-bold my-2">$39.9<span className="text-sm font-normal">/mo</span></p>
                      <p className="text-sm text-gray-600 mb-4">3500 points/day</p>
                      <button className="w-full py-2 border rounded-lg hover:bg-gray-50">
                        Subscribe
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
