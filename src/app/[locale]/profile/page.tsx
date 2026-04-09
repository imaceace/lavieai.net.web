"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Loader2 } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { authApi, userApi } from "@/lib/api-client";
import { useToast } from "@/hooks/useToast";
import { UpgradeModal } from "@/components/auth/UpgradeModal";

type Tab = "overview" | "orders" | "history" | "admin";
type AdminPanelTab = "whitelist" | "routing" | "pricing" | "cache" | "users";

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

interface RoutingModel {
  id: string;
  task_type: string;
  provider: string;
  model_name: string;
  display_name: string;
  allowed_tiers: string;
  is_active: number;
}

interface RoutingPolicy {
  id: string;
  use_case: string;
  task_type: string;
  tier: "basic" | "pro" | "max" | "ultra";
  primary_model: string;
  fallback_models: string;
  strength_min: number | null;
  strength_max: number | null;
  weight_quality: number;
  weight_cost: number;
  weight_speed: number;
  is_active: number;
  created_at: number;
}

interface PricingPolicy {
  id: string;
  use_case: string;
  task_type: string;
  tier: "basic" | "pro" | "max" | "ultra" | null;
  resolution_tier: "auto" | "1k" | "2k" | "4k";
  base_points: number;
  override_points: number | null;
  tier_multiplier: number;
  resolution_multiplier: number;
  fast_mode_surcharge: number;
  priority_surcharge: number;
  min_points: number;
  max_points: number;
  retry_budget: number;
  max_attempts_included: number;
  overage_points_per_retry: number;
  display_label: string | null;
  sort_order: number;
  is_active: number;
  effective_from: number;
  effective_to: number | null;
}

interface RoutingPreviewResult {
  resolved?: {
    task_type?: string | null;
    model_id?: string | null;
    model_name?: string | null;
    provider?: string | null;
    template_task_type?: string | null;
    policy_task_type?: string | null;
  };
}

interface CacheGroupMap {
  [group: string]: string[];
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  basic: "Creator",
  plus: "Plus",
  pro: "Plus", // legacy alias
  max: "Max",
  ultra: "Studio",
};

const ROUTING_TAG_LABELS: Record<"basic" | "pro" | "max" | "ultra", string> = {
  basic: "Creator (basic)",
  pro: "Creator+ (pro)",
  max: "Plus (max)",
  ultra: "Studio (ultra)",
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
  const [activeAdminPanel, setActiveAdminPanel] = useState<AdminPanelTab>("whitelist");
  const [routingPolicies, setRoutingPolicies] = useState<RoutingPolicy[]>([]);
  const [routingModels, setRoutingModels] = useState<RoutingModel[]>([]);
  const [loadingRouting, setLoadingRouting] = useState(false);
  const [policyUseCaseFilter, setPolicyUseCaseFilter] = useState("");
  const [policyTierFilter, setPolicyTierFilter] = useState<"" | "basic" | "pro" | "max" | "ultra">("");
  const [policyModelFilter, setPolicyModelFilter] = useState("");
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [policyDraft, setPolicyDraft] = useState<any | null>(null);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [previewUseCase, setPreviewUseCase] = useState("turnIntoProfessionalPhoto");
  const [previewTier, setPreviewTier] = useState<"basic" | "pro" | "max" | "ultra">("pro");
  const [previewWidth, setPreviewWidth] = useState(1024);
  const [previewHeight, setPreviewHeight] = useState(1024);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<RoutingPreviewResult | null>(null);
  const [pricingPolicies, setPricingPolicies] = useState<PricingPolicy[]>([]);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [pricingUseCaseFilter, setPricingUseCaseFilter] = useState("");
  const [pricingTierFilter, setPricingTierFilter] = useState<"" | "basic" | "pro" | "max" | "ultra">("");
  const [editingPricingId, setEditingPricingId] = useState<string | null>(null);
  const [pricingDraft, setPricingDraft] = useState<any | null>(null);
  const [savingPricing, setSavingPricing] = useState(false);
  const [cacheScope, setCacheScope] = useState<"all" | "smart-routing" | "keys">("smart-routing");
  const [cacheCustomKeysText, setCacheCustomKeysText] = useState("");
  const [knownCacheGroups, setKnownCacheGroups] = useState<CacheGroupMap>({});
  const [loadingCacheMeta, setLoadingCacheMeta] = useState(false);
  const [purgingCache, setPurgingCache] = useState(false);

  const [grantAmount, setGrantAmount] = useState(100);
  const [grantReason, setGrantReason] = useState("");
  const [grantDays, setGrantDays] = useState(30);
  const [granting, setGranting] = useState(false);
  const [pendingGrant, setPendingGrant] = useState<{ amount: number; reason: string; days: number } | null>(null);

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

  useEffect(() => {
    if (activeTab !== "admin" || !user?.is_admin || activeAdminPanel !== "cache") return;
    const fetchCacheMeta = async () => {
      setLoadingCacheMeta(true);
      try {
        const { adminApi } = await import("@/lib/api-client");
        const res = await adminApi.getCacheKeys();
        if (res?.success) {
          setKnownCacheGroups(res.data?.groups || {});
        } else {
          addToast(res?.error?.message || "Failed to load cache metadata", "error");
        }
      } catch {
        addToast("Failed to load cache metadata", "error");
      } finally {
        setLoadingCacheMeta(false);
      }
    };
    fetchCacheMeta();
  }, [activeTab, activeAdminPanel, user?.is_admin]);

  const fetchRoutingPolicies = async (params?: { use_case?: string; tier?: string; model?: string }) => {
    const { adminApi } = await import("@/lib/api-client");
    const res = await adminApi.getRoutingPolicies({
      include_inactive: true,
      use_case: params?.use_case,
      tier: params?.tier,
      model: params?.model,
    });
    if (res?.success) {
      setRoutingPolicies(res.data || []);
    } else {
      throw new Error(res?.error?.message || "Failed to load routing policies");
    }
  };

  const fetchPricingPolicies = async (params?: { use_case?: string; tier?: string }) => {
    const { adminApi } = await import("@/lib/api-client");
    const res = await adminApi.getPricingPolicies({
      include_inactive: true,
      use_case: params?.use_case,
      tier: params?.tier,
    });
    if (res?.success) {
      setPricingPolicies(res.data || []);
    } else {
      throw new Error(res?.error?.message || "Failed to load pricing policies");
    }
  };

  useEffect(() => {
    if (activeTab === "admin" && user?.is_admin) {
      const fetchRoutingData = async () => {
        setLoadingRouting(true);
        try {
          const { adminApi } = await import("@/lib/api-client");
          const [modelsRes] = await Promise.all([
            adminApi.getRoutingModels(),
          ]);
          await fetchRoutingPolicies();
          await fetchPricingPolicies();
          if (modelsRes?.success) setRoutingModels(modelsRes.data || []);
        } catch {
          addToast("Failed to load routing policies", "error");
        } finally {
          setLoadingRouting(false);
        }
      };
      fetchRoutingData();
    }
  }, [activeTab, user?.is_admin]);

  const openEditPricing = (policy: PricingPolicy) => {
    setEditingPricingId(policy.id);
    setPricingDraft({ ...policy });
  };

  const cancelEditPricing = () => {
    setEditingPricingId(null);
    setPricingDraft(null);
  };

  const savePricing = async () => {
    if (!pricingDraft) return;
    setSavingPricing(true);
    try {
      const payload = {
        ...pricingDraft,
        base_points: Number(pricingDraft.base_points),
        override_points: pricingDraft.override_points === "" ? null : Number(pricingDraft.override_points),
        tier_multiplier: Number(pricingDraft.tier_multiplier),
        resolution_multiplier: Number(pricingDraft.resolution_multiplier),
        fast_mode_surcharge: Number(pricingDraft.fast_mode_surcharge),
        priority_surcharge: Number(pricingDraft.priority_surcharge),
        min_points: Number(pricingDraft.min_points),
        max_points: Number(pricingDraft.max_points),
        retry_budget: Number(pricingDraft.retry_budget),
        max_attempts_included: Number(pricingDraft.max_attempts_included),
        overage_points_per_retry: Number(pricingDraft.overage_points_per_retry),
        sort_order: Number(pricingDraft.sort_order),
        effective_from: Number(pricingDraft.effective_from),
        effective_to: pricingDraft.effective_to === "" ? null : Number(pricingDraft.effective_to),
        is_active: Number(pricingDraft.is_active),
        tags: [],
        metadata_json: { source: "admin-ui" },
        currency_unit: "points",
        version: 1,
        updated_by: user?.email || "admin",
      };
      const { adminApi } = await import("@/lib/api-client");
      const res = await adminApi.upsertPricingPolicy(payload);
      if (!res?.success) {
        addToast(res?.error?.message || "Save failed", "error");
        return;
      }
      addToast("Pricing saved", "success");
      setPricingPolicies((prev) =>
        prev.map((p) => (p.id === pricingDraft.id ? { ...p, ...payload } : p))
      );
      cancelEditPricing();
    } catch {
      addToast("Save failed", "error");
    } finally {
      setSavingPricing(false);
    }
  };

  const togglePricing = async (policy: PricingPolicy) => {
    try {
      const target = policy.is_active === 1 ? 0 : 1;
      const { adminApi } = await import("@/lib/api-client");
      const res = await adminApi.togglePricingPolicy(policy.id, target as 0 | 1);
      if (!res?.success) {
        addToast(res?.error?.message || "Toggle failed", "error");
        return;
      }
      setPricingPolicies((prev) => prev.map((p) => (p.id === policy.id ? { ...p, is_active: target } : p)));
      addToast(`Pricing ${target ? "enabled" : "disabled"}`, "success");
    } catch {
      addToast("Toggle failed", "error");
    }
  };

  const openEditPolicy = (policy: RoutingPolicy) => {
    setEditingPolicyId(policy.id);
    setPolicyDraft({
      ...policy,
      fallback_models: (() => {
        try {
          const parsed = JSON.parse(policy.fallback_models || "[]");
          return Array.isArray(parsed) ? parsed.join(", ") : "";
        } catch {
          return "";
        }
      })(),
    });
  };

  const cancelEditPolicy = () => {
    setEditingPolicyId(null);
    setPolicyDraft(null);
  };

  const savePolicy = async () => {
    if (!policyDraft) return;
    setSavingPolicy(true);
    try {
      const fallbackModels = String(policyDraft.fallback_models || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        id: policyDraft.id,
        use_case: policyDraft.use_case,
        task_type: policyDraft.task_type,
        tier: policyDraft.tier,
        primary_model: policyDraft.primary_model,
        fallback_models: fallbackModels,
        strength_min: policyDraft.strength_min === "" ? null : Number(policyDraft.strength_min),
        strength_max: policyDraft.strength_max === "" ? null : Number(policyDraft.strength_max),
        weight_quality: Number(policyDraft.weight_quality),
        weight_cost: Number(policyDraft.weight_cost),
        weight_speed: Number(policyDraft.weight_speed),
        is_active: Number(policyDraft.is_active) as 0 | 1,
      };
      const weightSum = payload.weight_quality + payload.weight_cost + payload.weight_speed;
      if (Math.abs(weightSum - 1) > 0.0001) {
        addToast("Weights must sum to 1", "error");
        return;
      }

      const { adminApi } = await import("@/lib/api-client");
      const res = await adminApi.upsertRoutingPolicy(payload as any);
      if (!res?.success) {
        addToast(res?.error?.message || "Save failed", "error");
        return;
      }
      addToast("Policy saved", "success");
      setRoutingPolicies((prev) =>
        prev.map((p) =>
          p.id === policyDraft.id
            ? {
                ...p,
                ...payload,
                fallback_models: JSON.stringify(fallbackModels),
              }
            : p
        )
      );
      cancelEditPolicy();
    } catch {
      addToast("Save failed", "error");
    } finally {
      setSavingPolicy(false);
    }
  };

  const togglePolicy = async (policy: RoutingPolicy) => {
    try {
      const target = policy.is_active === 1 ? 0 : 1;
      const { adminApi } = await import("@/lib/api-client");
      const res = await adminApi.toggleRoutingPolicy(policy.id, target as 0 | 1);
      if (!res?.success) {
        addToast(res?.error?.message || "Toggle failed", "error");
        return;
      }
      setRoutingPolicies((prev) => prev.map((p) => (p.id === policy.id ? { ...p, is_active: target } : p)));
      addToast(`Policy ${target ? "enabled" : "disabled"}`, "success");
    } catch {
      addToast("Toggle failed", "error");
    }
  };

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
    setAdminSearchResult(null);
    setAdminTransactions([]);
    setAdminOrders([]);
    setAdminWorks([]);
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

    setPendingGrant({ amount: grantAmount, reason: grantReason || "Admin manual grant", days: grantDays });
  };

  const confirmGrant = async () => {
    if (!pendingGrant || !adminSearchResult?.user?.id) return;
    
    setGranting(true);
    try {
      const { adminApi } = await import("@/lib/api-client");
      const res = await adminApi.grantCredits(adminSearchResult.user.id, pendingGrant.amount, pendingGrant.reason, pendingGrant.days);
      
      if (res.success && res.data) {
        addToast(`Successfully granted ${pendingGrant.amount} credits`, "success");
        setAdminSearchResult({
          ...adminSearchResult,
          user: {
            ...adminSearchResult.user,
            credits: res.data.newBalance
          }
        });
        setAdminPage(1);
        const txData = await adminApi.getTransactions(adminSearchResult.user.id, 1, 20);
        if (txData.success) {
          setAdminTransactions(txData.data);
          setAdminHasMore(txData.data.length === 20);
        }
        setGrantAmount(100);
        setGrantReason("");
      } else {
        addToast(res.error?.message || "Failed to grant credits", "error");
      }
    } catch (err: any) {
      addToast(err.message || "Failed to grant credits", "error");
    } finally {
      setGranting(false);
      setPendingGrant(null);
    }
  };

  const cancelGrant = () => {
    setPendingGrant(null);
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
                <div className="bg-white rounded-xl shadow-sm border p-4">
                  <nav className="flex flex-wrap gap-2">
                    {[
                      { id: "whitelist", label: "Beta Waitlist" },
                      { id: "routing", label: "Use Case Routing" },
                      { id: "pricing", label: "Use Case Pricing" },
                      { id: "cache", label: "Cache Manager" },
                      { id: "users", label: "User Search" },
                    ].map((panel) => (
                      <button
                        key={panel.id}
                        onClick={() => setActiveAdminPanel(panel.id as AdminPanelTab)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                          activeAdminPanel === panel.id
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {panel.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {activeAdminPanel === "whitelist" && (
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
                )}

                {activeAdminPanel === "routing" && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-bold mb-4">Use Case Routing Policies</h2>
                  <div className="mb-4 p-3 border rounded-lg bg-indigo-50/40">
                    <p className="text-sm font-semibold mb-2">Routing Preview (useCase + planTag to taskType + model)</p>
                    <div className="flex flex-wrap items-end gap-2">
                      <input
                        value={previewUseCase}
                        onChange={(e) => setPreviewUseCase(e.target.value)}
                        placeholder="useCase, e.g. turnIntoProfessionalPhoto"
                        className="px-3 py-2 border rounded-lg text-sm min-w-[240px]"
                      />
                      <select
                        value={previewTier}
                        onChange={(e) => setPreviewTier(e.target.value as any)}
                        className="px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="basic">{ROUTING_TAG_LABELS.basic}</option>
                        <option value="pro">{ROUTING_TAG_LABELS.pro}</option>
                        <option value="max">{ROUTING_TAG_LABELS.max}</option>
                        <option value="ultra">{ROUTING_TAG_LABELS.ultra}</option>
                      </select>
                      <input
                        type="number"
                        value={previewWidth}
                        onChange={(e) => setPreviewWidth(Number(e.target.value) || 1024)}
                        className="w-24 px-2 py-2 border rounded-lg text-sm"
                      />
                      <input
                        type="number"
                        value={previewHeight}
                        onChange={(e) => setPreviewHeight(Number(e.target.value) || 1024)}
                        className="w-24 px-2 py-2 border rounded-lg text-sm"
                      />
                      <button
                        onClick={async () => {
                          if (!previewUseCase.trim()) {
                            addToast("useCase is required", "error");
                            return;
                          }
                          setPreviewLoading(true);
                          try {
                            const { adminApi } = await import("@/lib/api-client");
                            const res = await adminApi.previewRouting({
                              use_case: previewUseCase.trim(),
                              tier: previewTier,
                              width: previewWidth,
                              height: previewHeight,
                            });
                            if (res?.success) {
                              setPreviewResult(res.data || null);
                              addToast("Preview loaded", "success");
                            } else {
                              setPreviewResult(null);
                              addToast(res?.error?.message || "Preview failed", "error");
                            }
                          } catch {
                            setPreviewResult(null);
                            addToast("Preview failed", "error");
                          } finally {
                            setPreviewLoading(false);
                          }
                        }}
                        className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                        disabled={previewLoading}
                      >
                        {previewLoading ? "Previewing..." : "Preview"}
                      </button>
                    </div>
                    {previewResult?.resolved && (
                      <div className="mt-3 text-xs text-gray-700 bg-white border rounded p-2">
                        <p><span className="font-semibold">taskType:</span> {previewResult.resolved.task_type || '-'}</p>
                        <p><span className="font-semibold">model:</span> {previewResult.resolved.model_id || '-'} / {previewResult.resolved.model_name || '-'}</p>
                        <p><span className="font-semibold">provider:</span> {previewResult.resolved.provider || '-'}</p>
                        <p><span className="font-semibold">template_task_type:</span> {previewResult.resolved.template_task_type || '-'}</p>
                        <p><span className="font-semibold">policy_task_type:</span> {previewResult.resolved.policy_task_type || '-'}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <input
                      value={policyUseCaseFilter}
                      onChange={(e) => setPolicyUseCaseFilter(e.target.value)}
                      placeholder="Filter by use_case..."
                      className="px-3 py-2 border rounded-lg text-sm min-w-[220px]"
                    />
                    <select
                      value={policyTierFilter}
                      onChange={(e) => setPolicyTierFilter(e.target.value as any)}
                      className="px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">All planTags</option>
                      <option value="basic">{ROUTING_TAG_LABELS.basic}</option>
                      <option value="pro">{ROUTING_TAG_LABELS.pro}</option>
                      <option value="max">{ROUTING_TAG_LABELS.max}</option>
                      <option value="ultra">{ROUTING_TAG_LABELS.ultra}</option>
                    </select>
                    <input
                      value={policyModelFilter}
                      onChange={(e) => setPolicyModelFilter(e.target.value)}
                      placeholder="Filter by model id..."
                      className="px-3 py-2 border rounded-lg text-sm min-w-[240px]"
                    />
                    <button
                      onClick={async () => {
                        setLoadingRouting(true);
                        try {
                          await fetchRoutingPolicies({
                            use_case: policyUseCaseFilter || undefined,
                            tier: policyTierFilter || undefined,
                            model: policyModelFilter || undefined,
                          });
                        } catch {
                          addToast("Failed to query routing policies", "error");
                        } finally {
                          setLoadingRouting(false);
                        }
                      }}
                      className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Query
                    </button>
                    <button
                      onClick={async () => {
                        setPolicyUseCaseFilter("");
                        setPolicyTierFilter("");
                        setPolicyModelFilter("");
                        setLoadingRouting(true);
                        try {
                          await fetchRoutingPolicies();
                        } catch {
                          addToast("Failed to reset routing policies", "error");
                        } finally {
                          setLoadingRouting(false);
                        }
                      }}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      Reset
                    </button>
                    <span className="text-xs text-gray-500">
                      模型来自 ai_models，策略来自 use_case_model_policies
                    </span>
                  </div>
                  {loadingRouting ? (
                    <p className="text-gray-500">Loading routing policies...</p>
                  ) : (
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr className="text-left">
                            <th className="px-3 py-2">use_case</th>
                            <th className="px-3 py-2">task/planTag</th>
                            <th className="px-3 py-2">primary_model</th>
                            <th className="px-3 py-2">fallback_models</th>
                            <th className="px-3 py-2">strength</th>
                            <th className="px-3 py-2">weights(Q/C/S)</th>
                            <th className="px-3 py-2">active</th>
                            <th className="px-3 py-2">actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {routingPolicies.map((policy) => {
                              const isEditing = editingPolicyId === policy.id;
                              return (
                                <tr key={policy.id} className="border-t align-top">
                                  <td className="px-3 py-2 font-medium">{policy.use_case}</td>
                                  <td className="px-3 py-2">{policy.task_type} / {ROUTING_TAG_LABELS[policy.tier]}</td>
                                  <td className="px-3 py-2">
                                    {isEditing ? (
                                      <select
                                        value={policyDraft?.primary_model || ""}
                                        onChange={(e) => setPolicyDraft({ ...policyDraft, primary_model: e.target.value })}
                                        className="w-56 px-2 py-1 border rounded"
                                      >
                                        {routingModels
                                          .filter((m) => m.task_type === policy.task_type)
                                          .map((m) => (
                                            <option key={m.id} value={m.id}>{m.id}</option>
                                          ))}
                                      </select>
                                    ) : (
                                      <span className="font-mono">{policy.primary_model}</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {isEditing ? (
                                      <input
                                        value={policyDraft?.fallback_models || ""}
                                        onChange={(e) => setPolicyDraft({ ...policyDraft, fallback_models: e.target.value })}
                                        className="w-64 px-2 py-1 border rounded"
                                      />
                                    ) : (
                                      <span className="font-mono break-all">{policy.fallback_models}</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {isEditing ? (
                                      <div className="flex gap-1">
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          max="1"
                                          value={policyDraft?.strength_min ?? ""}
                                          onChange={(e) => setPolicyDraft({ ...policyDraft, strength_min: e.target.value })}
                                          className="w-20 px-2 py-1 border rounded"
                                        />
                                        <input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          max="1"
                                          value={policyDraft?.strength_max ?? ""}
                                          onChange={(e) => setPolicyDraft({ ...policyDraft, strength_max: e.target.value })}
                                          className="w-20 px-2 py-1 border rounded"
                                        />
                                      </div>
                                    ) : (
                                      <span>{policy.strength_min ?? "-"} / {policy.strength_max ?? "-"}</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">
                                    {isEditing ? (
                                      <div className="flex gap-1">
                                        <input type="number" step="0.01" min="0" max="1" value={policyDraft?.weight_quality ?? 0.6} onChange={(e) => setPolicyDraft({ ...policyDraft, weight_quality: e.target.value })} className="w-16 px-1 py-1 border rounded" />
                                        <input type="number" step="0.01" min="0" max="1" value={policyDraft?.weight_cost ?? 0.3} onChange={(e) => setPolicyDraft({ ...policyDraft, weight_cost: e.target.value })} className="w-16 px-1 py-1 border rounded" />
                                        <input type="number" step="0.01" min="0" max="1" value={policyDraft?.weight_speed ?? 0.1} onChange={(e) => setPolicyDraft({ ...policyDraft, weight_speed: e.target.value })} className="w-16 px-1 py-1 border rounded" />
                                      </div>
                                    ) : (
                                      <span>{policy.weight_quality}/{policy.weight_cost}/{policy.weight_speed}</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2">{policy.is_active ? "on" : "off"}</td>
                                  <td className="px-3 py-2">
                                    {isEditing ? (
                                      <div className="flex gap-2">
                                        <button onClick={savePolicy} disabled={savingPolicy} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded">Save</button>
                                        <button onClick={cancelEditPolicy} className="px-2 py-1 text-xs border rounded">Cancel</button>
                                      </div>
                                    ) : (
                                      <div className="flex gap-2">
                                        <button onClick={() => openEditPolicy(policy)} className="px-2 py-1 text-xs border rounded">Edit</button>
                                        <button onClick={() => togglePolicy(policy)} className="px-2 py-1 text-xs border rounded">{policy.is_active ? "Disable" : "Enable"}</button>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          {routingPolicies.length === 0 && (
                            <tr>
                              <td colSpan={8} className="px-4 py-8 text-center text-gray-500">No routing policies found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                )}

                {activeAdminPanel === "pricing" && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-bold mb-4">Use Case Pricing Policies</h2>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <input
                      value={pricingUseCaseFilter}
                      onChange={(e) => setPricingUseCaseFilter(e.target.value)}
                      placeholder="Filter by use_case..."
                      className="px-3 py-2 border rounded-lg text-sm min-w-[220px]"
                    />
                    <select
                      value={pricingTierFilter}
                      onChange={(e) => setPricingTierFilter(e.target.value as any)}
                      className="px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">All tiers</option>
                      <option value="basic">basic</option>
                      <option value="pro">pro</option>
                      <option value="max">max</option>
                      <option value="ultra">ultra</option>
                    </select>
                    <button
                      onClick={async () => {
                        setLoadingPricing(true);
                        try {
                          await fetchPricingPolicies({
                            use_case: pricingUseCaseFilter || undefined,
                            tier: pricingTierFilter || undefined,
                          });
                        } catch {
                          addToast("Failed to query pricing policies", "error");
                        } finally {
                          setLoadingPricing(false);
                        }
                      }}
                      className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      Query
                    </button>
                    <button
                      onClick={async () => {
                        setPricingUseCaseFilter("");
                        setPricingTierFilter("");
                        setLoadingPricing(true);
                        try {
                          await fetchPricingPolicies();
                        } catch {
                          addToast("Failed to reset pricing policies", "error");
                        } finally {
                          setLoadingPricing(false);
                        }
                      }}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      Reset
                    </button>
                    <span className="text-xs text-gray-500">策略来自 use_case_pricing（功能定价）</span>
                  </div>
                  {loadingPricing ? (
                    <p className="text-gray-500">Loading pricing policies...</p>
                  ) : (
                    <div className="overflow-x-auto border rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr className="text-left">
                            <th className="px-3 py-2">use_case</th>
                            <th className="px-3 py-2">task/tier</th>
                            <th className="px-3 py-2">base/override</th>
                            <th className="px-3 py-2">multiplier</th>
                            <th className="px-3 py-2">retry budget</th>
                            <th className="px-3 py-2">active</th>
                            <th className="px-3 py-2">actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pricingPolicies.map((policy) => {
                            const isEditing = editingPricingId === policy.id;
                            return (
                              <tr key={policy.id} className="border-t align-top">
                                <td className="px-3 py-2 font-medium">{policy.use_case}</td>
                                <td className="px-3 py-2">{policy.task_type} / {policy.tier || "-"}</td>
                                <td className="px-3 py-2">
                                  {isEditing ? (
                                    <div className="flex gap-1">
                                      <input type="number" value={pricingDraft?.base_points ?? 0} onChange={(e) => setPricingDraft({ ...pricingDraft, base_points: e.target.value })} className="w-20 px-1 py-1 border rounded" />
                                      <input type="number" value={pricingDraft?.override_points ?? ""} onChange={(e) => setPricingDraft({ ...pricingDraft, override_points: e.target.value })} className="w-20 px-1 py-1 border rounded" placeholder="override" />
                                    </div>
                                  ) : (
                                    <span>{policy.base_points} / {policy.override_points ?? "-"}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {isEditing ? (
                                    <div className="flex gap-1">
                                      <input type="number" step="0.01" value={pricingDraft?.tier_multiplier ?? 1} onChange={(e) => setPricingDraft({ ...pricingDraft, tier_multiplier: e.target.value })} className="w-16 px-1 py-1 border rounded" />
                                      <input type="number" step="0.01" value={pricingDraft?.resolution_multiplier ?? 1} onChange={(e) => setPricingDraft({ ...pricingDraft, resolution_multiplier: e.target.value })} className="w-16 px-1 py-1 border rounded" />
                                    </div>
                                  ) : (
                                    <span>{policy.tier_multiplier}/{policy.resolution_multiplier}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">
                                  {isEditing ? (
                                    <div className="flex gap-1">
                                      <input type="number" value={pricingDraft?.retry_budget ?? 0} onChange={(e) => setPricingDraft({ ...pricingDraft, retry_budget: e.target.value })} className="w-16 px-1 py-1 border rounded" />
                                      <input type="number" value={pricingDraft?.max_attempts_included ?? 1} onChange={(e) => setPricingDraft({ ...pricingDraft, max_attempts_included: e.target.value })} className="w-16 px-1 py-1 border rounded" />
                                    </div>
                                  ) : (
                                    <span>{policy.retry_budget}/{policy.max_attempts_included}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2">{policy.is_active ? "on" : "off"}</td>
                                <td className="px-3 py-2">
                                  {isEditing ? (
                                    <div className="flex gap-2">
                                      <button onClick={savePricing} disabled={savingPricing} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded">Save</button>
                                      <button onClick={cancelEditPricing} className="px-2 py-1 text-xs border rounded">Cancel</button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-2">
                                      <button onClick={() => openEditPricing(policy)} className="px-2 py-1 text-xs border rounded">Edit</button>
                                      <button onClick={() => togglePricing(policy)} className="px-2 py-1 text-xs border rounded">{policy.is_active ? "Disable" : "Enable"}</button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {pricingPolicies.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No pricing policies found.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                )}

                {activeAdminPanel === "cache" && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-bold mb-4">Cache Management</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Purge Cloudflare Worker cache by known groups or custom keys.
                  </p>

                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <label className="text-sm">
                      <span className="block text-gray-600 mb-1">Scope</span>
                      <select
                        value={cacheScope}
                        onChange={(e) => setCacheScope(e.target.value as any)}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="smart-routing">Smart Routing</option>
                        <option value="all">All Known Caches</option>
                        <option value="keys">Custom Keys</option>
                      </select>
                    </label>
                    <div className="md:col-span-2">
                      <span className="block text-sm text-gray-600 mb-1">Known Groups</span>
                      {loadingCacheMeta ? (
                        <p className="text-sm text-gray-500">Loading...</p>
                      ) : (
                        <div className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border max-h-40 overflow-auto">
                          {Object.keys(knownCacheGroups).length === 0 ? (
                            <span>No cache groups found.</span>
                          ) : (
                            Object.entries(knownCacheGroups).map(([group, keys]) => (
                              <div key={group} className="mb-2 last:mb-0">
                                <p className="font-semibold">{group}</p>
                                {keys.map((key) => (
                                  <p key={key} className="font-mono break-all">{key}</p>
                                ))}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {cacheScope === "keys" && (
                    <div className="mb-4">
                      <label className="block text-sm text-gray-600 mb-1">Custom Cache Keys (one URL per line)</label>
                      <textarea
                        value={cacheCustomKeysText}
                        onChange={(e) => setCacheCustomKeysText(e.target.value)}
                        rows={5}
                        className="w-full px-3 py-2 border rounded-lg font-mono text-xs"
                        placeholder="https://lavieai.net/__cache/ai-models-router-v1"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      disabled={purgingCache}
                      onClick={async () => {
                        const customKeys = cacheCustomKeysText
                          .split(/\r?\n/)
                          .map((line) => line.trim())
                          .filter(Boolean);
                        if (cacheScope === "keys" && customKeys.length === 0) {
                          addToast("Please enter at least one cache key", "error");
                          return;
                        }

                        setPurgingCache(true);
                        try {
                          const { adminApi } = await import("@/lib/api-client");
                          const res = await adminApi.purgeCache({
                            scope: cacheScope,
                            keys: cacheScope === "keys" ? customKeys : undefined,
                          });
                          if (res?.success) {
                            const deleted = res.data?.deletedCount ?? 0;
                            const requested = res.data?.requested ?? 0;
                            addToast(`Cache purge done: ${deleted}/${requested}`, "success");
                          } else {
                            addToast(res?.error?.message || "Failed to purge cache", "error");
                          }
                        } catch {
                          addToast("Failed to purge cache", "error");
                        } finally {
                          setPurgingCache(false);
                        }
                      }}
                      className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
                    >
                      {purgingCache ? "Purging..." : "Purge Cache"}
                    </button>
                    <button
                      disabled={loadingCacheMeta}
                      onClick={async () => {
                        setLoadingCacheMeta(true);
                        try {
                          const { adminApi } = await import("@/lib/api-client");
                          const res = await adminApi.getCacheKeys();
                          if (res?.success) {
                            setKnownCacheGroups(res.data?.groups || {});
                            addToast("Cache metadata refreshed", "success");
                          } else {
                            addToast(res?.error?.message || "Refresh failed", "error");
                          }
                        } catch {
                          addToast("Refresh failed", "error");
                        } finally {
                          setLoadingCacheMeta(false);
                        }
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      Refresh Keys
                    </button>
                  </div>
                </div>
                )}

                {activeAdminPanel === "users" && (
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
                        
                        {pendingGrant ? (
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-xl">⚠️</span>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-amber-900 dark:text-amber-200 mb-2">Confirm Credit Grant</h4>
                                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1 mb-4">
                                  <p><span className="font-medium">User:</span> {adminSearchResult.user.email}</p>
                                  <p><span className="font-medium">Amount:</span> <span className="text-green-600 font-bold">+{pendingGrant.amount} credits</span></p>
                                  <p><span className="font-medium">Reason:</span> {pendingGrant.reason}</p>
                                  <p><span className="font-medium">Valid Days:</span> {pendingGrant.days} days</p>
                                </div>
                                <p className="text-xs text-amber-700 dark:text-amber-400 mb-4">
                                  This action cannot be undone. Are you sure?
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={confirmGrant}
                                    disabled={granting}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {granting && <Loader2 size={14} className="animate-spin" />}
                                    Confirm Grant
                                  </button>
                                  <button
                                    onClick={cancelGrant}
                                    disabled={granting}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
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
                        )}
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
                )}
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
