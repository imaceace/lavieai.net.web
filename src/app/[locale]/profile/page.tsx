"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Loader2 } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { authApi, userApi } from "@/lib/api-client";
import { useToast } from "@/hooks/useToast";
import { UpgradeModal } from "@/components/auth/UpgradeModal";

type Tab = "overview" | "orders" | "history" | "admin";

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
  is_recommended?: number;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  basic: "Creator",
  pro: "Pro",
  max: "Max",
  ultra: "Studio",
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
  const { addToast } = useToast();
  const { user, isLoggedIn: storeIsLoggedIn, isLoading: storeLoading, setUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedWorks, setSelectedWorks] = useState<Set<string>>(new Set());
  const [updatingWorks, setUpdatingWorks] = useState(false);
  const [updatingDefault, setUpdatingDefault] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'public' | 'private'>('all');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [loadingWhitelist, setLoadingWhitelist] = useState(false);
  const [adminSearchEmail, setAdminSearchEmail] = useState("");
  const [adminSearchLoading, setAdminSearchLoading] = useState(false);
  const [adminSearchResult, setAdminSearchResult] = useState<any>(null);

  // Admin details tabs and pagination
  const [activeAdminTab, setActiveAdminTab] = useState<"transactions" | "orders" | "works">("transactions");
  const [adminTransactions, setAdminTransactions] = useState<any[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminWorks, setAdminWorks] = useState<Work[]>([]);
  const [loadingAdminDetails, setLoadingAdminDetails] = useState(false);
  const [adminPage, setAdminPage] = useState(1);
  const [adminHasMore, setAdminHasMore] = useState(false);
  const [adminSelectedWorks, setAdminSelectedWorks] = useState<Set<string>>(new Set());
  const [adminExtendingWorks, setAdminExtendingWorks] = useState(false);

  const [grantAmount, setGrantAmount] = useState(100);
  const [grantReason, setGrantReason] = useState("");
  const [grantDays, setGrantDays] = useState(30);
  const [granting, setGranting] = useState(false);

  const isMember = user?.subscription_type && user.subscription_type !== 'free';

  useEffect(() => {
    // Rely on Header's getMe call to populate user store
    // Just stop loading after a short delay if user is not loaded
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);
    return () => clearTimeout(timer);
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

  useEffect(() => {
    if (activeTab === "admin" && user?.is_admin && whitelist.length === 0) {
      setLoadingWhitelist(true);
      import("@/lib/api-client").then(({ whitelistApi }) => {
        whitelistApi.getList().then((res: any) => {
          setWhitelist(res.data || []);
          setLoadingWhitelist(false);
        }).catch(() => setLoadingWhitelist(false));
      });
    }
  }, [activeTab, user?.is_admin]);

  const handleUpdateWhitelist = async (email: string, status: "pending" | "approved" | "rejected") => {
    try {
      const { whitelistApi } = await import("@/lib/api-client");
      const res = await whitelistApi.updateStatus(email, status);
      if (res.success) {
        addToast("Status updated successfully", "success");
        setWhitelist(whitelist.map(w => w.email === email ? { ...w, status } : w));
      } else {
        addToast(res.error?.message || "Update failed", "error");
      }
    } catch (e: any) {
      addToast(e.message || "Update failed", "error");
    }
  };

  const handleAdminSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSearchEmail) return;
    setAdminSearchLoading(true);
    try {
      const { adminApi } = await import("@/lib/api-client");
      const data = await adminApi.getUserInfo(adminSearchEmail);
      if (data.success) {
        setAdminSearchResult(data.data);
        setActiveAdminTab("transactions");
        setAdminPage(1);
      } else {
        addToast(data.error?.message || "Search failed", "error");
        setAdminSearchResult(null);
      }
    } catch (e: any) {
      addToast("Search failed", "error");
      setAdminSearchResult(null);
    } finally {
      setAdminSearchLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "admin" && adminSearchResult?.user?.id) {
      const fetchAdminDetails = async () => {
        setLoadingAdminDetails(true);
        try {
          const { adminApi } = await import("@/lib/api-client");
          const userId = adminSearchResult.user.id;
          let data;
          if (activeAdminTab === "transactions") {
            data = await adminApi.getTransactions(userId, adminPage, 20);
            if (data.success) setAdminTransactions(data.data);
          } else if (activeAdminTab === "orders") {
            data = await adminApi.getOrders(userId, adminPage, 20);
            if (data.success) setAdminOrders(data.data);
          } else if (activeAdminTab === "works") {
            data = await adminApi.getWorks(userId, adminPage, 20);
            if (data.success) setAdminWorks(data.data);
          }
          if (data?.success) {
            setAdminHasMore(data.data.length === 20);
          }
        } catch (e: any) {
          addToast("Failed to fetch details", "error");
        } finally {
          setLoadingAdminDetails(false);
        }
      };
      fetchAdminDetails();
    }
  }, [activeTab, activeAdminTab, adminPage, adminSearchResult?.user?.id]);

  const handleGrantCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSearchResult?.user?.id) return;
    
    if (grantAmount <= 0) {
      addToast("Amount must be greater than 0", "error");
      return;
    }
    
    setGranting(true);
    try {
      const { adminApi } = await import("@/lib/api-client");
      const res = await adminApi.grantCredits(adminSearchResult.user.id, grantAmount, grantReason || "Admin manual grant", grantDays);
      
      if (res.success && res.data) {
        addToast(`Successfully granted ${grantAmount} credits`, "success");
        // Update local state
        setAdminSearchResult({
          ...adminSearchResult,
          user: {
            ...adminSearchResult.user,
            credits: res.data.newBalance
          }
        });
        setGrantAmount(100);
        setGrantReason("");
      } else {
        addToast(res.error?.message || "Failed to grant credits", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Failed to grant credits", "error");
    } finally {
      setGranting(false);
    }
  };

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

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "orders", label: "Orders" },
    { id: "history", label: "Gallery" },
  ];

  if (user?.is_admin) {
    tabs.push({ id: "admin", label: "Admin" });
  }

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
                <div 
                  className={`bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between ${!isMember ? 'opacity-75' : ''}`}
                  onClick={(e) => {
                    if (!isMember) {
                      e.preventDefault();
                      setIsUpgradeModalOpen(true);
                    }
                  }}
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Public Gallery by Default
                      {!isMember && <span className="ml-2 inline-block px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">Premium Feature</span>}
                    </h3>
                    <p className="text-sm text-gray-500">Automatically publish your generated images to the public gallery.</p>
                  </div>
                  <label className={`relative inline-flex items-center ${isMember ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={user?.is_public_default === 1}
                      disabled={updatingDefault || !isMember}
                      onChange={async (e) => {
                        if (!isMember) return;
                        const newValue = e.target.checked ? 1 : 0;
                        setUpdatingDefault(true);
                        const success = await userApi.updatePublicDefault(newValue);
                        if (success && user) {
                          setUser({ ...user, is_public_default: newValue });
                        } else {
                          addToast("Failed to update setting", "error");
                        }
                        setUpdatingDefault(false);
                      }}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <h3 className="font-semibold">Generation History</h3>
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                      {(['all', 'public', 'private'] as const).map(f => (
                        <button
                          key={f}
                          onClick={() => {
                            setGalleryFilter(f);
                            setSelectedWorks(new Set());
                          }}
                          className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                            galleryFilter === f ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  {isMember && works.length > 0 && (() => {
                    const filteredWorks = works.filter(w => galleryFilter === 'all' || (galleryFilter === 'public' ? w.is_recommended === 1 : w.is_recommended === 0));
                    const isAllSelected = filteredWorks.length > 0 && selectedWorks.size === filteredWorks.length;
                    return (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (isAllSelected) {
                            setSelectedWorks(new Set());
                          } else {
                            setSelectedWorks(new Set(filteredWorks.map(w => w.id)));
                          }
                        }}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        {isAllSelected ? 'Deselect All' : 'Select All'}
                      </button>
                      <span className="text-sm text-gray-500 px-2">{selectedWorks.size} selected</span>
                      <button 
                        disabled={selectedWorks.size === 0 || updatingWorks}
                        onClick={async () => {
                          setUpdatingWorks(true);
                          const success = await userApi.updateWorksRecommended(Array.from(selectedWorks), 1);
                          if (success) {
                            setWorks(works.map(w => selectedWorks.has(w.id) ? { ...w, is_recommended: 1 } : w));
                            setSelectedWorks(new Set());
                          } else {
                            addToast("Failed to update", "error");
                          }
                          setUpdatingWorks(false);
                        }}
                        className="px-3 py-1.5 text-sm bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 disabled:opacity-50"
                      >
                        Set Public
                      </button>
                      <button 
                        disabled={selectedWorks.size === 0 || updatingWorks}
                        onClick={async () => {
                          setUpdatingWorks(true);
                          const success = await userApi.updateWorksRecommended(Array.from(selectedWorks), 0);
                          if (success) {
                            setWorks(works.map(w => selectedWorks.has(w.id) ? { ...w, is_recommended: 0 } : w));
                            setSelectedWorks(new Set());
                          } else {
                            addToast("Failed to update", "error");
                          }
                          setUpdatingWorks(false);
                        }}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        Set Private
                      </button>
                    </div>
                  )})()}
                </div>
                {loadingWorks ? (
                  <div className="text-center py-8 text-gray-400">Loading...</div>
                ) : works.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No generations yet. <Link href="/" className="text-indigo-600 hover:underline">Start creating</Link>
                  </div>
                ) : (() => {
                  const filteredWorks = works.filter(w => galleryFilter === 'all' || (galleryFilter === 'public' ? w.is_recommended === 1 : w.is_recommended === 0));
                  if (filteredWorks.length === 0) {
                     return <div className="text-center py-8 text-gray-400">No {galleryFilter} generations found.</div>;
                  }
                  return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {filteredWorks.map((work) => (
                      <div 
                        key={work.id} 
                        className={`group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedWorks.has(work.id) ? 'border-indigo-500' : 'border-transparent'}`}
                        onClick={() => {
                          if (!isMember) return;
                          const newSelected = new Set(selectedWorks);
                          if (newSelected.has(work.id)) newSelected.delete(work.id);
                          else newSelected.add(work.id);
                          setSelectedWorks(newSelected);
                        }}
                      >
                        {isMember && (
                          <div className="absolute top-2 left-2 z-10">
                            <input 
                              type="checkbox" 
                              checked={selectedWorks.has(work.id)} 
                              readOnly 
                              className="w-4 h-4 text-indigo-600 rounded border-gray-300 pointer-events-none"
                            />
                          </div>
                        )}
                        {work.is_recommended === 1 && (
                          <div className="absolute top-2 right-2 z-10 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                            Public
                          </div>
                        )}
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
                  );
                })()}
              </div>
            )}
            {/* Admin Tab */}
            {activeTab === "admin" && user?.is_admin && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-bold mb-4">Beta Waitlist</h2>
                  {loadingWhitelist ? (
                    <p className="text-gray-500">Loading...</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 rounded-tl-lg">Email</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3 rounded-tr-lg">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {whitelist.map((w, idx) => (
                            <tr key={idx} className="border-b last:border-0">
                              <td className="px-4 py-3">{w.email}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${w.status === 'approved' ? 'bg-green-100 text-green-700' : w.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                  {w.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-500">{formatDate(w.created_at)}</td>
                              <td className="px-4 py-3 flex gap-2">
                                {w.status !== 'approved' && (
                                  <button onClick={() => handleUpdateWhitelist(w.email, 'approved')} className="text-green-600 hover:text-green-800 text-xs font-medium">Approve</button>
                                )}
                                {w.status !== 'rejected' && (
                                  <button onClick={() => handleUpdateWhitelist(w.email, 'rejected')} className="text-red-600 hover:text-red-800 text-xs font-medium">Reject</button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {whitelist.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No waitlist entries found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-bold mb-4">User Search (Subscriptions & Credits)</h2>
                  <form onSubmit={handleAdminSearch} className="flex gap-3 mb-6">
                    <input 
                      type="email" 
                      value={adminSearchEmail} 
                      onChange={e => setAdminSearchEmail(e.target.value)} 
                      placeholder="Enter user email" 
                      className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button 
                      type="submit" 
                      disabled={adminSearchLoading}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {adminSearchLoading ? "Searching..." : "Search"}
                    </button>
                  </form>

                  {adminSearchResult && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Name / Email</p>
                          <p className="font-medium">{adminSearchResult.user.name} ({adminSearchResult.user.email})</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Credits Balance</p>
                          <p className="font-medium text-indigo-600">{adminSearchResult.user.credits ?? adminSearchResult.user.points}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Current Plan</p>
                          <p className="font-medium capitalize">{adminSearchResult.user.subscription_type || 'free'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Member Since</p>
                          <p className="font-medium">{formatDate(adminSearchResult.user.created_at)}</p>
                        </div>
                      </div>

                      {/* Grant Credits Form */}
                      <div className="mt-6 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-3 flex items-center gap-2">
                          <Zap size={16} className="text-indigo-600" />
                          Manual Credit Grant
                        </h3>
                        <form onSubmit={handleGrantCredits} className="flex flex-col sm:flex-row gap-3 items-end">
                          <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                            <input 
                              type="number" 
                              min="1" 
                              required
                              value={grantAmount}
                              onChange={e => setGrantAmount(parseInt(e.target.value))}
                              className="w-full sm:w-24 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div className="w-full sm:w-auto flex-1">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Reason</label>
                            <input 
                              type="text" 
                              required
                              placeholder="e.g. Compensation for bug"
                              value={grantReason}
                              onChange={e => setGrantReason(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Valid Days</label>
                            <input 
                              type="number" 
                              min="1" 
                              required
                              value={grantDays}
                              onChange={e => setGrantDays(parseInt(e.target.value))}
                              className="w-full sm:w-24 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <button 
                            type="submit" 
                            disabled={granting}
                            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
                          >
                            {granting ? <Loader2 size={16} className="animate-spin" /> : "Grant"}
                          </button>
                        </form>
                      </div>

                      <div className="mt-6">
                        <div className="border-b mb-4">
                          <nav className="flex gap-4">
                            {[
                              { id: 'transactions', label: 'Transactions', count: adminSearchResult.stats?.transactions },
                              { id: 'orders', label: 'Orders', count: adminSearchResult.stats?.orders },
                              { id: 'works', label: 'Works', count: adminSearchResult.stats?.works },
                            ].map(tab => (
                              <button
                                key={tab.id}
                                onClick={() => {
                                  setActiveAdminTab(tab.id as any);
                                  setAdminPage(1);
                                  setAdminSelectedWorks(new Set());
                                }}
                                className={`pb-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                                  activeAdminTab === tab.id
                                    ? "border-indigo-600 text-indigo-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                              >
                                {tab.label}
                                {tab.count !== undefined && (
                                  <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
                                    {tab.count}
                                  </span>
                                )}
                              </button>
                            ))}
                          </nav>
                        </div>

                        <div className="min-h-[200px]">
                          {loadingAdminDetails ? (
                            <div className="flex items-center justify-center py-10">
                              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (
                            <>
                              {activeAdminTab === 'transactions' && (
                                <div className="space-y-2">
                                  {adminTransactions.length > 0 ? adminTransactions.map((tx, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm bg-white p-3 rounded-lg border shadow-sm">
                                      <div>
                                        <p className="font-medium capitalize">{tx.action_type?.replace(/_/g, ' ')}</p>
                                        <p className="text-gray-400 text-xs">{tx.created_at}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className={`font-bold ${tx.change_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {tx.change_amount > 0 ? '+' : ''}{tx.change_amount}
                                        </p>
                                        <p className="text-gray-400 text-xs">Bal: {tx.balance_after}</p>
                                      </div>
                                    </div>
                                  )) : <p className="text-center py-10 text-gray-400">No transactions found.</p>}
                                </div>
                              )}

                              {activeAdminTab === 'orders' && (
                                <div className="overflow-x-auto">
                                  {adminOrders.length > 0 ? (
                                    <table className="w-full text-sm text-left bg-white rounded-lg border">
                                      <thead className="bg-gray-50 border-b">
                                        <tr>
                                          <th className="px-4 py-2">ID</th>
                                          <th className="px-4 py-2">Type</th>
                                          <th className="px-4 py-2">Amount</th>
                                          <th className="px-4 py-2">Status</th>
                                          <th className="px-4 py-2">Date</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {adminOrders.map((order, idx) => (
                                          <tr key={idx} className="border-b last:border-0">
                                            <td className="px-4 py-2 text-xs font-mono">{order.id.slice(0, 8)}...</td>
                                            <td className="px-4 py-2 capitalize">{order.type}</td>
                                            <td className="px-4 py-2">{formatCurrency(order.amount, order.currency)}</td>
                                            <td className={`px-4 py-2 font-medium ${STATUS_COLORS[order.status] || 'text-gray-600'}`}>{order.status}</td>
                                            <td className="px-4 py-2 text-gray-500">{formatDate(order.created_at)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : <p className="text-center py-10 text-gray-400">No orders found.</p>}
                                </div>
                              )}

                              {activeAdminTab === 'works' && (
                                <div>
                                  {adminWorks.length > 0 && (
                                    <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-lg border shadow-sm">
                                      <button
                                        onClick={() => {
                                          if (adminSelectedWorks.size === adminWorks.length) {
                                            setAdminSelectedWorks(new Set());
                                          } else {
                                            setAdminSelectedWorks(new Set(adminWorks.map(w => w.id)));
                                          }
                                        }}
                                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                      >
                                        {adminSelectedWorks.size === adminWorks.length ? 'Deselect All' : 'Select All'}
                                      </button>
                                      <span className="text-sm text-gray-500 px-2">{adminSelectedWorks.size} selected</span>
                                      
                                      <button 
                                        disabled={adminSelectedWorks.size === 0 || adminExtendingWorks}
                                        onClick={async () => {
                                          const days = parseInt(window.prompt("Enter days to extend:", "30") || "0");
                                          if (!days || days <= 0) return;
                                          
                                          setAdminExtendingWorks(true);
                                          try {
                                            const { adminApi } = await import("@/lib/api-client");
                                            const res = await adminApi.extendWorks(Array.from(adminSelectedWorks), days);
                                            if (res.success) {
                                              addToast(res.message || "Success", "success");
                                              // Refresh current page
                                              const userId = adminSearchResult.user.id;
                                              const data = await adminApi.getWorks(userId, adminPage, 20);
                                              if (data.success) setAdminWorks(data.data);
                                              setAdminSelectedWorks(new Set());
                                            } else {
                                              addToast((res as any).error?.message || res.message || "Failed to extend", "error");
                                            }
                                          } catch (e) {
                                            addToast("Failed to extend", "error");
                                          } finally {
                                            setAdminExtendingWorks(false);
                                          }
                                        }}
                                        className="px-3 py-1.5 text-sm bg-green-50 text-green-600 rounded hover:bg-green-100 disabled:opacity-50 ml-auto"
                                      >
                                        {adminExtendingWorks ? 'Extending...' : 'Extend Expiration'}
                                      </button>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {adminWorks.length > 0 ? adminWorks.map((work, idx) => {
                                      const isExpired = (work as any).expire_at ? ((work as any).expire_at * 1000 < Date.now()) : false;
                                      return (
                                      <div 
                                        key={idx} 
                                        onClick={() => {
                                          const newSet = new Set(adminSelectedWorks);
                                          if (newSet.has(work.id)) newSet.delete(work.id);
                                          else newSet.add(work.id);
                                          setAdminSelectedWorks(newSet);
                                        }}
                                        className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${adminSelectedWorks.has(work.id) ? 'border-indigo-500' : 'border-transparent'}`}
                                      >
                                        <div className="absolute top-2 left-2 z-10">
                                          <input 
                                            type="checkbox" 
                                            checked={adminSelectedWorks.has(work.id)} 
                                            readOnly 
                                            className="w-4 h-4 text-indigo-600 rounded border-gray-300 pointer-events-none"
                                          />
                                        </div>
                                        <div className="aspect-square bg-gray-100">
                                          {work.result_url ? (
                                            <img src={work.thumbnail_url || work.result_url} alt="" className={`w-full h-full object-cover ${isExpired ? 'opacity-50 grayscale' : ''}`} />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center">🎨</div>
                                          )}
                                        </div>
                                        <div className="p-2 bg-white text-xs space-y-1">
                                          <p className="truncate font-medium" title={work.prompt}>{work.prompt}</p>
                                          <p className="text-gray-500 flex justify-between">
                                            <span>{formatDate(work.created_at)}</span>
                                            <span className={isExpired ? 'text-red-500' : 'text-green-500'}>
                                              {((work as any).expire_at) ? formatDate((work as any).expire_at) : 'Never'}
                                            </span>
                                          </p>
                                          <p className="text-[10px] text-gray-400 truncate" title={work.result_url}>URL: {work.result_url}</p>
                                        </div>
                                      </div>
                                    )}) : <p className="col-span-full text-center py-10 text-gray-400">No works found.</p>}
                                  </div>
                                </div>
                              )}

                              {/* Pagination Controls */}
                              {(adminPage > 1 || adminHasMore) && (
                                <div className="flex justify-center items-center gap-4 mt-6 pt-4 border-t">
                                  <button
                                    disabled={adminPage === 1 || loadingAdminDetails}
                                    onClick={() => setAdminPage(p => p - 1)}
                                    className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Previous
                                  </button>
                                  <span className="text-sm text-gray-600">Page {adminPage}</span>
                                  <button
                                    disabled={!adminHasMore || loadingAdminDetails}
                                    onClick={() => setAdminPage(p => p + 1)}
                                    className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                                  >
                                    Next
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
        title="Premium Feature"
        subtitle="Upgrade to a paid plan to use the 'Public Gallery by Default' feature and keep your generations private."
      />
    </div>
  );
}
