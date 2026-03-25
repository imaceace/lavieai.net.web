"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/stores/userStore";
import { authApi, userApi } from "@/lib/api-client";

type Tab = "overview" | "orders" | "history";

interface Order {
  id: string;
  type: string;
  points: number;
  amount: number;
  currency: string;
  status: string;
  created_at: number;
  paid_at: number | null;
}

interface Subscription {
  id: string;
  plan: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  started_at: number;
  expire_at: number;
  created_at: number;
}

interface Work {
  id: string;
  type: string;
  prompt: string;
  result_url: string;
  thumbnail_url?: string;
  status: string;
  created_at: number;
  points_cost: number;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  basic: "Basic",
  pro: "Pro",
  ultra: "Ultra",
};

const STATUS_COLORS: Record<string, string> = {
  paid: "text-green-600",
  pending: "text-yellow-600",
  failed: "text-red-600",
  refunded: "text-gray-500",
  active: "text-green-600",
  cancelled: "text-red-600",
  expired: "text-gray-500",
};

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}

export default function ProfilePage() {
  const { user, isLoggedIn: storeIsLoggedIn, isLoading: storeLoading, setUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const me = await authApi.getMe();
      if (me) {
        setUser({
          id: me.id,
          email: me.email,
          name: me.name,
          avatar: me.avatar || "",
          subscription_type: (me.tier || 'free') as any,
          credits: me.credits,
          subscription_expire: me.subscription_expire,
        });
      }
      setPageLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    if (activeTab === "orders" && orders.length === 0) {
      setLoadingOrders(true);
      userApi.getOrders().then((res) => {
        setOrders(res.data);
        setLoadingOrders(false);
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "overview" && subscriptions.length === 0) {
      setLoadingSubs(true);
      userApi.getSubscriptions().then((subs) => {
        setSubscriptions(subs);
        setLoadingSubs(false);
      });
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "history" && works.length === 0) {
      setLoadingWorks(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.lavieai.net'}/api/user/history`, {
        credentials: 'include',
      })
        .then((r) => r.json())
        .then((res) => {
          setWorks(res.data || []);
        })
        .catch(() => setWorks([]))
        .finally(() => setLoadingWorks(false));
    }
  }, [activeTab]);

  if (pageLoading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user && !pageLoading) {
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

  const activeSubscription = subscriptions.find((s) => s.status === "active");

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders" },
    { id: "history", label: "Gallery" },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-indigo-600">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.name || "User"}</h1>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-full">
                  {PLAN_LABELS[user?.subscription_type || 'free']} Plan
                </span>
                {activeSubscription && (
                  <span className="text-xs text-gray-500">
                    Expires {formatDate(activeSubscription.expire_at)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Credits</p>
            <p className="text-2xl font-bold text-indigo-600">{user?.credits ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Plan</p>
            <p className="text-2xl font-bold">{PLAN_LABELS[user?.subscription_type || 'free']}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="text-lg font-bold">{user?.created_at ? formatDate(user.created_at) : 'N/A'}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">Subscription</p>
            <p className="text-lg font-bold">
              {activeSubscription ? formatDate(activeSubscription.expire_at) : 'None'}
            </p>
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
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4">
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
                    Buy Credits
                  </Link>
                </div>

                {activeSubscription && (
                  <div>
                    <h3 className="font-semibold mb-3">Active Subscription</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <p className="font-medium">{PLAN_LABELS[activeSubscription.plan]} Plan ({activeSubscription.type})</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(activeSubscription.amount, activeSubscription.currency)}/month
                          </p>
                        </div>
                        <span className={`text-sm font-medium ${STATUS_COLORS[activeSubscription.status] || 'text-gray-600'}`}>
                          {activeSubscription.status.charAt(0).toUpperCase() + activeSubscription.status.slice(1)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        Started: {formatDate(activeSubscription.started_at)} &nbsp;|&nbsp; Expires: {formatDate(activeSubscription.expire_at)}
                      </div>
                    </div>
                  </div>
                )}

                {loadingSubs ? (
                  <div className="text-center py-8 text-gray-400">Loading subscriptions...</div>
                ) : subscriptions.length > 0 ? (
                  <div>
                    <h3 className="font-semibold mb-3">Subscription History</h3>
                    <div className="space-y-2">
                      {subscriptions.map((sub) => (
                        <div key={sub.id} className="flex justify-between items-center py-3 border-b last:border-0">
                          <div>
                            <p className="font-medium text-sm">{PLAN_LABELS[sub.plan]} ({sub.type})</p>
                            <p className="text-xs text-gray-500">{formatDate(sub.created_at)}</p>
                          </div>
                          <span className={`text-sm font-medium ${STATUS_COLORS[sub.status] || 'text-gray-600'}`}>
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : !activeSubscription && (
                  <div className="text-center py-8 text-gray-400">
                    No active subscription. <Link href="/pricing" className="text-indigo-600 hover:underline">Upgrade now</Link>
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div>
                <h3 className="font-semibold mb-4">Order History</h3>
                {loadingOrders ? (
                  <div className="text-center py-8 text-gray-400">Loading orders...</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No orders yet. <Link href="/pricing" className="text-indigo-600 hover:underline">Buy credits</Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-500">
                          <th className="pb-3 font-medium">Date</th>
                          <th className="pb-3 font-medium">Type</th>
                          <th className="pb-3 font-medium">Amount</th>
                          <th className="pb-3 font-medium">Credits</th>
                          <th className="pb-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map((order) => (
                          <tr key={order.id} className="border-b last:border-0">
                            <td className="py-3">{formatDateTime(order.created_at)}</td>
                            <td className="py-3 capitalize">{order.type}</td>
                            <td className="py-3">{formatCurrency(order.amount, order.currency)}</td>
                            <td className="py-3">{order.points > 0 ? `+${order.points}` : '-'}</td>
                            <td className={`py-3 font-medium ${STATUS_COLORS[order.status] || 'text-gray-600'}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div>
                <h3 className="font-semibold mb-4">Generation History</h3>
                {loadingWorks ? (
                  <div className="text-center py-8 text-gray-400">Loading...</div>
                ) : works.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No generations yet. <Link href="/" className="text-indigo-600 hover:underline">Start creating</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {works.map((work) => (
                      <div key={work.id} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {work.result_url ? (
                          <img
                            src={work.thumbnail_url || work.result_url}
                            alt={work.prompt}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl">🎨</div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                          <p className="text-white text-xs truncate">{work.prompt}</p>
                          <p className="text-white/70 text-xs">{work.points_cost} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
