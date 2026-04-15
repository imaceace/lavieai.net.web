"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Loader2 } from "lucide-react";
import { useUserStore } from "@/stores/userStore";
import { authApi, userApi } from "@/lib/api-client";
import { useToast } from "@/hooks/useToast";
import { UpgradeModal } from "@/components/auth/UpgradeModal";

type Tab = "overview" | "orders" | "history" | "messages" | "admin";
type AdminPanelTab = "whitelist" | "routing" | "pricing" | "cache" | "refunds" | "users";

interface Order {
  id: string;
  type: string;
  points: number;
  amount: number;
  currency: string;
  status: string;
  created_at: number;
  paid_at: number | null;
  metadata?: string | null;
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

interface UserMessage {
  id: string;
  message_type: string;
  title: string;
  content: string;
  metadata?: string;
  is_read: number;
  read_at?: number | null;
  read_ip?: string | null;
  read_mode?: string | null;
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

interface AdminUserListItem {
  id: string;
  email: string;
  name: string;
  subscription_type: string;
  subscription_display: string;
  points: number;
  created_at: number;
  last_ip?: string | null;
  country?: string | null;
  preferred_language?: string | null;
  fingerprint?: string | null;
  device_type?: string | null;
  is_admin: number;
  login_disabled: number;
  login_disabled_reason?: string | null;
  login_disabled_at?: number | null;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  creator: "Creator",
  studio: "Studio",
  // Legacy/internal aliases kept for backward compatibility
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

function formatLanguageTag(tag?: string | null): string {
  const raw = String(tag || "").trim();
  if (!raw) return "-";
  const normalized = raw.replace("_", "-");
  const [languageCodeRaw, regionCodeRaw] = normalized.split("-");
  const languageCode = (languageCodeRaw || "").toLowerCase();
  const regionCode = (regionCodeRaw || "").toUpperCase();
  if (!languageCode) return normalized;

  try {
    const languageName = new Intl.DisplayNames(["en"], { type: "language" }).of(languageCode) || languageCode;
    if (!regionCode) return languageName;
    const regionName = new Intl.DisplayNames(["en"], { type: "region" }).of(regionCode) || regionCode;
    return `${languageName} (${regionName})`;
  } catch {
    return normalized;
  }
}

function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100) / 100;
}

function roundRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10000) / 10000;
}

const SUBSCRIPTION_PLAN_CREDITS: Record<string, number> = {
  creator: 1200,
  plus: 3000,
  studio: 6000,
  basic: 1200, // legacy alias
  ultra: 6000, // legacy alias
};

function getOrderCreditsDisplay(order: Order): string {
  if (order.type === "points") {
    return order.points > 0 ? `+${order.points}` : "-";
  }
  if (order.type === "subscription") {
    try {
      const meta = order.metadata ? JSON.parse(order.metadata) : {};
      const plan = String(meta?.plan || "").toLowerCase();
      const credits = SUBSCRIPTION_PLAN_CREDITS[plan] || 0;
      return credits > 0 ? `+${credits}` : "-";
    } catch {
      return "-";
    }
  }
  return order.points > 0 ? `+${order.points}` : "-";
}

export default function ProfilePage() {
  const { addToast } = useToast();
  const { user, isLoggedIn: storeIsLoggedIn, isLoading: storeLoading, setUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messagesUnread, setMessagesUnread] = useState(0);
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
  const [adminListEmail, setAdminListEmail] = useState("");
  const [adminListEmailMatch, setAdminListEmailMatch] = useState<"exact" | "fuzzy">("fuzzy");
  const [adminListName, setAdminListName] = useState("");
  const [adminListIp, setAdminListIp] = useState("");
  const [adminUserList, setAdminUserList] = useState<AdminUserListItem[]>([]);
  const [adminUserListLoading, setAdminUserListLoading] = useState(false);
  const [adminUserListPage, setAdminUserListPage] = useState(1);
  const [adminUserListPageSize, setAdminUserListPageSize] = useState<10 | 20 | 50 | 100>(10);
  const [adminUserListTotal, setAdminUserListTotal] = useState(0);
  const [updatingLoginStatusUserId, setUpdatingLoginStatusUserId] = useState<string | null>(null);

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
  const [refundChannelFeeRate, setRefundChannelFeeRate] = useState(0.03);
  const [refundChannelFeeMode, setRefundChannelFeeMode] = useState<"ratio" | "fixed">("ratio");
  const [refundChannelFeeFixed, setRefundChannelFeeFixed] = useState(0);
  const [refundPointUsdRate, setRefundPointUsdRate] = useState(0.018);
  const [refundReason, setRefundReason] = useState("User requested cancellation/refund");
  const [refundPaypalTxnId, setRefundPaypalTxnId] = useState("");
  const [refundPreview, setRefundPreview] = useState<any>(null);
  const [finalRefundAmount, setFinalRefundAmount] = useState(0);
  const [loadingRefundPreview, setLoadingRefundPreview] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [refundLookupEmail, setRefundLookupEmail] = useState("");
  const [refundLookupSubId, setRefundLookupSubId] = useState("");
  const [refundLookupTxnId, setRefundLookupTxnId] = useState("");
  const [refundLookupLoading, setRefundLookupLoading] = useState(false);
  const [refundLookupRows, setRefundLookupRows] = useState<any[]>([]);
  const [selectedRefundSubscriptionId, setSelectedRefundSubscriptionId] = useState("");
  const [selectedRefundOrderId, setSelectedRefundOrderId] = useState("");

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
    if (typeof window === "undefined") return;
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab === "overview" || tab === "orders" || tab === "history" || tab === "messages" || tab === "admin") {
      setActiveTab(tab);
    }
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
    if (activeTab === "messages" && messages.length === 0) {
      setLoadingMessages(true);
      userApi.getMessages({ limit: 50, offset: 0 }).then((res) => {
        setMessages(res.data || []);
        setMessagesUnread(res.unread || 0);
      }).finally(() => setLoadingMessages(false));
    }
  }, [activeTab, messages.length]);

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

  const fetchAdminUserList = async (page: number = adminUserListPage, pageSize: 10 | 20 | 50 | 100 = adminUserListPageSize) => {
    setAdminUserListLoading(true);
    try {
      const { adminApi } = await import("@/lib/api-client");
      const res = await adminApi.listUsers({
        email: adminListEmail || undefined,
        emailMatch: adminListEmailMatch,
        name: adminListName || undefined,
        ip: adminListIp || undefined,
        page,
        pageSize,
      });
      if (res?.success) {
        setAdminUserList(res.data || []);
        setAdminUserListTotal(Number(res.pagination?.total || 0));
      } else {
        addToast(res?.error?.message || "Failed to load user list", "error");
      }
    } catch {
      addToast("Failed to load user list", "error");
    } finally {
      setAdminUserListLoading(false);
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

  useEffect(() => {
    if (activeTab !== "admin" || activeAdminPanel !== "users" || !user?.is_admin) return;
    fetchAdminUserList(adminUserListPage, adminUserListPageSize);
  }, [activeTab, activeAdminPanel, user?.is_admin, adminUserListPage, adminUserListPageSize]);

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

  const handleAdminUserListSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminUserListPage(1);
    await fetchAdminUserList(1, adminUserListPageSize);
  };

  const openAdminUserDetail = async (email: string) => {
    setAdminSearchEmail(email);
    setAdminSearchLoading(true);
    setAdminSearchResult(null);
    setAdminTransactions([]);
    setAdminOrders([]);
    setAdminWorks([]);
    setRefundPreview(null);
    try {
      const { adminApi } = await import("@/lib/api-client");
      const data = await adminApi.getUserInfo(email);
      if (data.success) {
        setAdminSearchResult(data.data);
        setActiveAdminTab("transactions");
        setAdminPage(1);
      } else {
        addToast(data.error?.message || "Search failed", "error");
      }
    } catch {
      addToast("Search failed", "error");
    } finally {
      setAdminSearchLoading(false);
    }
  };

  const handleSetUserLoginStatus = async (target: AdminUserListItem, disabled: boolean) => {
    if (!disabled && !window.confirm(`Enable login for ${target.email}?`)) return;
    let reason = "";
    if (disabled) {
      reason = (window.prompt(`Disable login for ${target.email}. Please enter reason:`, target.login_disabled_reason || "") || "").trim();
    }
    setUpdatingLoginStatusUserId(target.id);
    try {
      const { adminApi } = await import("@/lib/api-client");
      const res = await adminApi.setUserLoginStatus(target.id, disabled, reason || undefined);
      if (!res?.success) {
        addToast(res?.error?.message || "Failed to update login status", "error");
        return;
      }
      addToast(disabled ? "User login disabled" : "User login enabled", "success");
      setAdminUserList((prev) =>
        prev.map((u) =>
          u.id === target.id
            ? {
                ...u,
                login_disabled: disabled ? 1 : 0,
                login_disabled_reason: disabled ? (reason || "Disabled by admin") : null,
                login_disabled_at: disabled ? Math.floor(Date.now() / 1000) : null,
              }
            : u
        )
      );
      if (adminSearchResult?.user?.id === target.id) {
        await openAdminUserDetail(target.email);
      }
    } catch {
      addToast("Failed to update login status", "error");
    } finally {
      setUpdatingLoginStatusUserId(null);
    }
  };

  const handleAdminSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSearchEmail) return;
    await openAdminUserDetail(adminSearchEmail);
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

  const loadRefundPreview = async (silent = false) => {
    if (!refundLookupEmail) return;
    setLoadingRefundPreview(true);
    try {
      const { adminApi } = await import("@/lib/api-client");
      const res = await adminApi.getSubscriptionRefundPreview(refundLookupEmail, {
        channelFeeRate: refundChannelFeeRate,
        channelFeeMode: refundChannelFeeMode,
        channelFeeFixed: refundChannelFeeFixed,
        pointUsdRate: refundPointUsdRate,
        subscriptionId: selectedRefundSubscriptionId || undefined,
        orderId: selectedRefundOrderId || undefined,
      });
      if (res.success && res.data) {
        setRefundPreview(res.data);
        setFinalRefundAmount(roundMoney(Number(res.data.calculation?.suggestedRefund || 0)));
        if (res.data.calculation?.pointUsdRate) {
          setRefundPointUsdRate(Number(res.data.calculation.pointUsdRate));
        }
      } else {
        setRefundPreview(null);
        if (!silent) addToast(res.error?.message || "Failed to load refund preview", "error");
      }
    } catch (e: any) {
      setRefundPreview(null);
      if (!silent) addToast(e?.message || "Failed to load refund preview", "error");
    } finally {
      setLoadingRefundPreview(false);
    }
  };

  // Auto recalculate preview when fee/rate inputs change (debounced).
  useEffect(() => {
    if (!refundLookupEmail) return;
    if (!refundPreview && !selectedRefundSubscriptionId) return;
    const timer = setTimeout(() => {
      loadRefundPreview(true);
    }, 350);
    return () => clearTimeout(timer);
  }, [
    refundChannelFeeMode,
    refundChannelFeeRate,
    refundChannelFeeFixed,
    refundPointUsdRate,
    refundLookupEmail,
    selectedRefundSubscriptionId,
  ]);

  const executeRefund = async () => {
    if (!refundPreview?.subscription?.id || !refundPreview?.user?.id) return;
    if (finalRefundAmount <= 0) {
      addToast("Final refund amount must be greater than 0", "error");
      return;
    }
    setRefunding(true);
    try {
      const { adminApi } = await import("@/lib/api-client");
      const normalizedFinalRefundAmount = roundMoney(finalRefundAmount);
      const res = await adminApi.executeSubscriptionRefund({
        userId: refundPreview.user.id,
        subscriptionId: refundPreview.subscription.id,
        orderId: selectedRefundOrderId || undefined,
        paypalTransactionId: refundPaypalTxnId.trim() || undefined,
        finalRefundAmount: normalizedFinalRefundAmount,
        channelFeeRate: refundChannelFeeRate,
        channelFeeMode: refundChannelFeeMode,
        channelFeeFixed: refundChannelFeeFixed,
        pointUsdRate: refundPointUsdRate,
        reason: refundReason,
      });
      if (res.success) {
        addToast(`Refund succeeded: ${res.data?.currency || 'USD'} ${res.data?.refundedAmount ?? normalizedFinalRefundAmount}`, "success");
        const refreshed = await adminApi.getUserInfo(refundLookupEmail);
        if (refreshed?.success) {
          setAdminSearchResult(refreshed.data);
        }
        await lookupRefundTargets();
        await loadRefundPreview();
      } else {
        addToast(res.error?.message || "Refund failed", "error");
      }
    } catch (e: any) {
      addToast(e?.message || "Refund failed", "error");
    } finally {
      setRefunding(false);
    }
  };

  // Keep channel fee and point/USD ratio in sync against the current preview baseline.
  const syncPointRateByFeeInput = (
    nextMode: "ratio" | "fixed",
    nextFeeRate: number,
    nextFeeFixed: number
  ) => {
    if (!refundPreview?.calculation) return;
    const paid = Number(refundPreview.calculation?.paidAmount || 0);
    const usedCredits = Number(refundPreview.calculation?.usedCredits || 0);
    const targetRefund = Number(refundPreview.calculation?.suggestedRefund || 0);
    if (paid <= 0 || usedCredits <= 0) return;
    const feeAmount = nextMode === "fixed"
      ? Math.max(0, nextFeeFixed)
      : Math.max(0, paid * Math.max(0, nextFeeRate));
    const inferredUsedValue = Math.max(0, paid - (targetRefund + feeAmount));
    const inferredPointRate = inferredUsedValue / usedCredits;
    setRefundPointUsdRate(roundRate(inferredPointRate));
  };

  const syncFeeByPointRateInput = (
    nextPointRate: number
  ) => {
    if (!refundPreview?.calculation) return;
    const paid = Number(refundPreview.calculation?.paidAmount || 0);
    const usedCredits = Number(refundPreview.calculation?.usedCredits || 0);
    const targetRefund = Number(refundPreview.calculation?.suggestedRefund || 0);
    if (paid <= 0) return;
    const usedValue = Math.max(0, usedCredits * Math.max(0, nextPointRate));
    const inferredFeeAmount = Math.max(0, paid - usedValue - targetRefund);
    if (refundChannelFeeMode === "fixed") {
      setRefundChannelFeeFixed(roundMoney(inferredFeeAmount));
    } else {
      setRefundChannelFeeRate(roundRate(inferredFeeAmount / paid));
    }
  };

  const lookupRefundTargets = async () => {
    if (!refundLookupEmail && !refundLookupSubId && !refundLookupTxnId) {
      addToast("Provide email or PayPal subscription id or transaction id", "error");
      return;
    }
    setRefundLookupLoading(true);
    try {
      const { adminApi } = await import("@/lib/api-client");
      const res = await adminApi.lookupSubscriptionRefundTargets({
        email: refundLookupEmail || undefined,
        paypalSubscriptionId: refundLookupSubId || undefined,
        paypalTransactionId: refundLookupTxnId || undefined,
      });
      if (res.success) {
        setRefundLookupRows(res.data || []);
        if ((res.data || []).length === 0) addToast("No matched records", "info");
      } else {
        addToast(res.error?.message || "Lookup failed", "error");
      }
    } catch (e: any) {
      addToast(e?.message || "Lookup failed", "error");
    } finally {
      setRefundLookupLoading(false);
    }
  };

  const handleReadMessage = async (id: string) => {
    const target = messages.find((m) => m.id === id);
    if (!target || target.is_read === 1) return;
    const res = await userApi.markMessagesRead({ ids: [id] });
    if (res.updated > 0) {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: 1, read_mode: "single", read_at: Math.floor(Date.now() / 1000) } : m)));
      setMessagesUnread((n) => Math.max(0, n - 1));
    }
  };

  const handleReadAllMessages = async () => {
    const res = await userApi.markMessagesRead({ readAll: true });
    if (res.updated > 0) {
      setMessages((prev) => prev.map((m) => ({ ...m, is_read: 1, read_mode: "batch", read_at: m.read_at ?? Math.floor(Date.now() / 1000) })));
      setMessagesUnread(0);
      addToast(`Marked ${res.updated} message(s) as read`, "success");
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
    { id: "messages", label: messagesUnread > 0 ? `Messages (${messagesUnread})` : "Messages" },
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
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (typeof window !== "undefined") {
                      const url = new URL(window.location.href);
                      url.searchParams.set("tab", tab.id);
                      window.history.replaceState({}, "", url.toString());
                    }
                  }}
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
                            <td className="py-3">{getOrderCreditsDisplay(order)}</td>
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
            {activeTab === "messages" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">System Messages</h3>
                  <button
                    onClick={handleReadAllMessages}
                    disabled={messagesUnread === 0}
                    className={`px-3 py-1.5 text-sm rounded ${
                      messagesUnread === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"
                    }`}
                  >
                    Mark All Read
                  </button>
                </div>
                {loadingMessages ? (
                  <div className="text-center py-8 text-gray-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No messages.</div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-lg border p-4 ${m.is_read ? "bg-white border-gray-200" : "bg-indigo-50 border-indigo-200"}`}
                        onClick={() => handleReadMessage(m.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium">{m.title}</div>
                            <div className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{m.content}</div>
                            <div className="text-xs text-gray-500 mt-2">
                              {formatDateTime(m.created_at)}
                              {m.is_read === 1 && m.read_at ? ` | Read at ${formatDateTime(m.read_at)}` : ""}
                              {m.is_read === 1 && m.read_mode ? ` | ${m.read_mode}` : ""}
                            </div>
                          </div>
                          {m.is_read === 0 ? (
                            <span className="text-xs px-2 py-1 rounded bg-indigo-600 text-white">Unread</span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">Read</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                      { id: "refunds", label: "Refund Center" },
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

                {activeAdminPanel === "refunds" && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-bold mb-4">Refund Center</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Lookup by email, PayPal subscription id, or PayPal transaction id from user statement.
                  </p>
                  <div className="grid md:grid-cols-3 gap-3 mb-3">
                    <input
                      type="email"
                      value={refundLookupEmail}
                      onChange={(e) => setRefundLookupEmail(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm"
                      placeholder="email@example.com"
                    />
                    <input
                      type="text"
                      value={refundLookupSubId}
                      onChange={(e) => setRefundLookupSubId(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm font-mono"
                      placeholder="PayPal Subscription ID (I-...)"
                    />
                    <input
                      type="text"
                      value={refundLookupTxnId}
                      onChange={(e) => setRefundLookupTxnId(e.target.value)}
                      className="px-3 py-2 border rounded-lg text-sm font-mono"
                      placeholder="PayPal Transaction ID"
                    />
                  </div>
                  <div className="mb-4">
                    <button
                      onClick={lookupRefundTargets}
                      disabled={refundLookupLoading}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {refundLookupLoading ? "Searching..." : "Search Refund Targets"}
                    </button>
                  </div>

                  {refundLookupRows.length > 0 && (
                    <div className="overflow-x-auto mb-4">
                      <table className="w-full text-sm border rounded-lg">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-3 py-2 text-left">User</th>
                            <th className="px-3 py-2 text-left">Plan</th>
                            <th className="px-3 py-2 text-left">Credits</th>
                            <th className="px-3 py-2 text-left">Subscription Status</th>
                            <th className="px-3 py-2 text-left">Subscription ID</th>
                            <th className="px-3 py-2 text-left">Order</th>
                            <th className="px-3 py-2 text-left">Order Status</th>
                            <th className="px-3 py-2 text-left">Refundable</th>
                            <th className="px-3 py-2 text-left">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {refundLookupRows.map((r, idx) => (
                            <tr key={`${r.subscription_id || 'sub'}-${idx}`} className="border-b last:border-0">
                              <td className="px-3 py-2">{r.user_email}</td>
                              <td className="px-3 py-2">{r.subscription_plan_display || PLAN_LABELS[r.subscription_plan] || r.subscription_plan || '-'}</td>
                              <td className="px-3 py-2 text-xs">
                                <div>Expected/cycle: {r.expected_cycle_credits ?? 0}</div>
                                <div className="text-gray-500">Initial grant: {r.initial_grant_credits ?? 0}</div>
                                <div className="text-gray-500">Granted(total): {r.granted_subscription_credits ?? 0}</div>
                              </td>
                              <td className="px-3 py-2">{r.subscription_status || '-'}</td>
                              <td className="px-3 py-2 font-mono text-xs">{r.provider_subscription_id || '-'}</td>
                              <td className="px-3 py-2 text-xs">{r.order_id ? `${r.order_id.slice(0, 10)}...` : '-'}</td>
                              <td className="px-3 py-2">{r.order_status || '-'}</td>
                              <td className="px-3 py-2">
                                {Number(r.can_refund) === 1 ? (
                                  <span className="text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700">Yes</span>
                                ) : (
                                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600" title={r.non_refundable_reason || ''}>No</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  className={`px-2 py-1 text-xs rounded ${
                                    Number(r.can_refund) === 1
                                      ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
                                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  }`}
                                  disabled={Number(r.can_refund) !== 1}
                                  onClick={async () => {
                                    if (Number(r.can_refund) !== 1) {
                                      addToast(r.non_refundable_reason || "This row is not refundable", "info");
                                      return;
                                    }
                                    setRefundLookupEmail(r.user_email || "");
                                    setRefundLookupSubId(r.provider_subscription_id || "");
                                    setSelectedRefundSubscriptionId(r.subscription_id || "");
                                    setSelectedRefundOrderId(r.order_id || "");
                                    setRefundPaypalTxnId("");
                                    setRefundPreview(null);
                                    if (r.user_email) {
                                      setLoadingRefundPreview(true);
                                      try {
                                        const { adminApi } = await import("@/lib/api-client");
                                        const preview = await adminApi.getSubscriptionRefundPreview(r.user_email, {
                                          channelFeeRate: refundChannelFeeRate,
                                          channelFeeMode: refundChannelFeeMode,
                                          channelFeeFixed: refundChannelFeeFixed,
                                          pointUsdRate: refundPointUsdRate,
                                          subscriptionId: r.subscription_id || undefined,
                                          orderId: r.order_id || undefined,
                                        });
                                        if (preview?.success) {
                                          setRefundPreview(preview.data);
                                          setFinalRefundAmount(roundMoney(Number(preview.data?.calculation?.suggestedRefund || 0)));
                                        }
                                      } finally {
                                        setLoadingRefundPreview(false);
                                      }
                                    }
                                  }}
                                >
                                  Select
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="mt-4 bg-rose-50 p-4 rounded-xl border border-rose-100">
                    <h3 className="font-bold text-rose-900 mb-3">Refund Calculator & Execute</h3>
                    <div className="grid md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Channel Fee Mode</label>
                        <select
                          value={refundChannelFeeMode}
                          onChange={(e) => {
                            const nextMode = (e.target.value as "ratio" | "fixed") || "ratio";
                            setRefundChannelFeeMode(nextMode);
                            syncPointRateByFeeInput(nextMode, refundChannelFeeRate, refundChannelFeeFixed);
                          }}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        >
                          <option value="ratio">Ratio (default)</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">
                          {refundChannelFeeMode === "fixed" ? "Channel Fee Fixed Amount" : "Channel Fee Rate"}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={refundChannelFeeMode === "fixed" ? undefined : 1}
                          step={refundChannelFeeMode === "fixed" ? 0.01 : 0.001}
                          value={refundChannelFeeMode === "fixed" ? refundChannelFeeFixed : refundChannelFeeRate}
                          onChange={(e) => {
                            const next = Number(e.target.value || 0);
                            if (refundChannelFeeMode === "fixed") {
                              const nextFixed = roundMoney(next);
                              setRefundChannelFeeFixed(nextFixed);
                              syncPointRateByFeeInput("fixed", refundChannelFeeRate, nextFixed);
                            } else {
                              const nextRate = roundRate(next);
                              setRefundChannelFeeRate(nextRate);
                              syncPointRateByFeeInput("ratio", nextRate, refundChannelFeeFixed);
                            }
                          }}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Point/USD Ratio</label>
                        <input
                          type="number"
                          min={0}
                          step={0.0001}
                          value={refundPointUsdRate}
                          onChange={(e) => {
                            const nextPointRate = roundRate(Number(e.target.value || 0));
                            setRefundPointUsdRate(nextPointRate);
                            syncFeeByPointRateInput(nextPointRate);
                          }}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-600 mb-1">Refund Reason</label>
                        <input
                          type="text"
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm"
                        />
                      </div>
                      <div className="md:col-span-4">
                        <label className="block text-xs text-gray-600 mb-1">PayPal Transaction ID (Optional, use statement number for direct refund target)</label>
                        <input
                          type="text"
                          value={refundPaypalTxnId}
                          onChange={(e) => setRefundPaypalTxnId(e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                          placeholder="e.g. 6HD15223EH201692W or capture/sale id"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={async () => {
                          if (!refundLookupEmail) {
                            addToast("Select a target row or input email first", "error");
                            return;
                          }
                          await loadRefundPreview();
                        }}
                        disabled={loadingRefundPreview}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
                      >
                        {loadingRefundPreview ? "Calculating..." : "Calculate Refund"}
                      </button>
                    </div>
                    {refundPreview && (
                      <div className="bg-white rounded-lg border p-3 text-sm">
                        <div className="grid md:grid-cols-2 gap-3">
                          <p>Paid: <span className="font-semibold">{formatCurrency(refundPreview.calculation?.paidAmount || 0, refundPreview.calculation?.currency || "USD")}</span></p>
                          <p>Expected Credits/Cycle: <span className="font-semibold">{refundPreview.calculation?.cycleCredits || 0}</span></p>
                          <p>Initial Grant: <span className="font-semibold">{refundPreview.calculation?.initialGrantCredits || 0}</span></p>
                          <p>Used Credits: <span className="font-semibold">{refundPreview.calculation?.usedCredits || 0}</span></p>
                          <p>Granted Credits (period): <span className="font-semibold">{refundPreview.calculation?.grantedCredits || 0}</span></p>
                          <p>Used Value: <span className="font-semibold">{formatCurrency(refundPreview.calculation?.usedValue || 0, refundPreview.calculation?.currency || "USD")}</span></p>
                          <p>Fee Amount: <span className="font-semibold">{formatCurrency(refundPreview.calculation?.feeAmount || 0, refundPreview.calculation?.currency || "USD")}</span></p>
                          <p>Suggested Refund: <span className="font-semibold text-green-700">{formatCurrency(refundPreview.calculation?.suggestedRefund || 0, refundPreview.calculation?.currency || "USD")}</span></p>
                        </div>
                        <div className="mt-3 flex items-end gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Final Refund Amount</label>
                            <input
                              type="number"
                              min={0}
                              step={0.01}
                              value={finalRefundAmount}
                              onChange={(e) => setFinalRefundAmount(roundMoney(Number(e.target.value || 0)))}
                              onBlur={() => setFinalRefundAmount(roundMoney(finalRefundAmount))}
                              className="px-3 py-2 border rounded-lg text-sm"
                            />
                          </div>
                          <button
                            onClick={executeRefund}
                            disabled={refunding}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                          >
                            {refunding ? "Refunding..." : "Execute Refund"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                )}

                {activeAdminPanel === "users" && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <h2 className="text-xl font-bold mb-4">User Management</h2>
                  <form onSubmit={handleAdminUserListSearch} className="grid md:grid-cols-6 gap-3 mb-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">Email</label>
                      <input
                        type="text"
                        value={adminListEmail}
                        onChange={e => setAdminListEmail(e.target.value)}
                        placeholder="email keyword or exact"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email Match</label>
                      <select
                        value={adminListEmailMatch}
                        onChange={e => setAdminListEmailMatch(e.target.value as "exact" | "fuzzy")}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="fuzzy">Fuzzy</option>
                        <option value="exact">Exact</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Nickname</label>
                      <input
                        type="text"
                        value={adminListName}
                        onChange={e => setAdminListName(e.target.value)}
                        placeholder="nickname keyword"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">IP</label>
                      <input
                        type="text"
                        value={adminListIp}
                        onChange={e => setAdminListIp(e.target.value)}
                        placeholder="ip keyword"
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Page Size</label>
                      <select
                        value={adminUserListPageSize}
                        onChange={e => {
                          setAdminUserListPageSize(Number(e.target.value) as 10 | 20 | 50 | 100);
                          setAdminUserListPage(1);
                        }}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <div className="md:col-span-6 flex gap-2">
                      <button
                        type="submit"
                        disabled={adminUserListLoading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {adminUserListLoading ? "Searching..." : "Search Users"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAdminListEmail("");
                          setAdminListEmailMatch("fuzzy");
                          setAdminListName("");
                          setAdminListIp("");
                          setAdminUserListPage(1);
                          fetchAdminUserList(1, adminUserListPageSize);
                        }}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        Reset
                      </button>
                    </div>
                  </form>

                  <div className="mb-6 border rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600">
                      Total: {adminUserListTotal} users
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-y">
                          <tr>
                            <th className="px-3 py-2 text-left">Email</th>
                            <th className="px-3 py-2 text-left">Nickname</th>
                            <th className="px-3 py-2 text-left">IP</th>
                            <th className="px-3 py-2 text-left">Country</th>
                            <th className="px-3 py-2 text-left">Language</th>
                            <th className="px-3 py-2 text-left">Fingerprint</th>
                            <th className="px-3 py-2 text-left">Plan</th>
                            <th className="px-3 py-2 text-left">Status</th>
                            <th className="px-3 py-2 text-left">Registered</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminUserListLoading ? (
                            <tr>
                              <td className="px-3 py-6 text-center text-gray-500" colSpan={10}>Loading...</td>
                            </tr>
                          ) : adminUserList.length === 0 ? (
                            <tr>
                              <td className="px-3 py-6 text-center text-gray-500" colSpan={10}>No users found.</td>
                            </tr>
                          ) : adminUserList.map((u) => (
                            <tr key={u.id} className="border-t">
                              <td className="px-3 py-2">{u.email}</td>
                              <td className="px-3 py-2">{u.name || "-"}</td>
                              <td className="px-3 py-2">{u.last_ip || "-"}</td>
                              <td className="px-3 py-2">{u.country || "-"}</td>
                              <td className="px-3 py-2">{formatLanguageTag(u.preferred_language)}</td>
                              <td className="px-3 py-2 max-w-[160px] truncate" title={u.fingerprint || "-"}>
                                {u.fingerprint || "-"}
                              </td>
                              <td className="px-3 py-2">{u.subscription_display || u.subscription_type || "free"}</td>
                              <td className="px-3 py-2">
                                {u.login_disabled ? (
                                  <span className="text-red-600">Disabled</span>
                                ) : (
                                  <span className="text-green-600">Active</span>
                                )}
                              </td>
                              <td className="px-3 py-2">{formatDate(u.created_at)}</td>
                              <td className="px-3 py-2">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openAdminUserDetail(u.email)}
                                    className="px-2 py-1 text-xs border rounded hover:bg-gray-50"
                                  >
                                    Details
                                  </button>
                                  <button
                                    type="button"
                                    disabled={updatingLoginStatusUserId === u.id}
                                    onClick={() => handleSetUserLoginStatus(u, !Boolean(u.login_disabled))}
                                    className={`px-2 py-1 text-xs rounded text-white disabled:opacity-50 ${u.login_disabled ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                                  >
                                    {updatingLoginStatusUserId === u.id ? "Updating..." : u.login_disabled ? "Enable Login" : "Disable Login"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-3 border-t flex items-center justify-between text-sm">
                      <button
                        type="button"
                        disabled={adminUserListPage <= 1 || adminUserListLoading}
                        onClick={() => setAdminUserListPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span>Page {adminUserListPage}</span>
                      <button
                        type="button"
                        disabled={adminUserListPage * adminUserListPageSize >= adminUserListTotal || adminUserListLoading}
                        onClick={() => setAdminUserListPage((p) => p + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-semibold mb-2">User Detail (by Email)</h3>
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
                          <p className="font-medium capitalize">{adminSearchResult.subscription_display || adminSearchResult.user.subscription_type || 'free'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Member Since</p>
                          <p className="font-medium">{formatDate(adminSearchResult.user.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Last IP</p>
                          <p className="font-medium">{adminSearchResult.user.last_ip || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Country / Language</p>
                          <p className="font-medium">{adminSearchResult.user.country || "-"} / {formatLanguageTag(adminSearchResult.user.preferred_language)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fingerprint</p>
                          <p className="font-mono text-xs break-all">{adminSearchResult.user.fingerprint || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Login Status</p>
                          <p className={`font-medium ${adminSearchResult.user.login_disabled ? "text-red-600" : "text-green-600"}`}>
                            {adminSearchResult.user.login_disabled ? "Disabled" : "Active"}
                          </p>
                          {adminSearchResult.user.login_disabled_reason && (
                            <p className="text-xs text-red-500 mt-1">{adminSearchResult.user.login_disabled_reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="mb-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSetUserLoginStatus({
                            id: adminSearchResult.user.id,
                            email: adminSearchResult.user.email,
                            name: adminSearchResult.user.name || "",
                            subscription_type: adminSearchResult.user.subscription_type || "free",
                            subscription_display: adminSearchResult.subscription_display || adminSearchResult.user.subscription_type || "free",
                            points: adminSearchResult.user.credits ?? adminSearchResult.user.points ?? 0,
                            created_at: adminSearchResult.user.created_at,
                            last_ip: adminSearchResult.user.last_ip || null,
                            country: adminSearchResult.user.country || null,
                            preferred_language: adminSearchResult.user.preferred_language || null,
                            fingerprint: adminSearchResult.user.fingerprint || null,
                            device_type: adminSearchResult.user.device_type || null,
                            is_admin: Number(adminSearchResult.user.is_admin || 0),
                            login_disabled: Number(adminSearchResult.user.login_disabled || 0),
                            login_disabled_reason: adminSearchResult.user.login_disabled_reason || null,
                            login_disabled_at: adminSearchResult.user.login_disabled_at || null,
                          }, !Boolean(adminSearchResult.user.login_disabled))}
                          disabled={updatingLoginStatusUserId === adminSearchResult.user.id}
                          className={`px-3 py-1.5 text-sm rounded text-white disabled:opacity-50 ${adminSearchResult.user.login_disabled ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                        >
                          {updatingLoginStatusUserId === adminSearchResult.user.id
                            ? "Updating..."
                            : adminSearchResult.user.login_disabled
                              ? "Enable Login"
                              : "Disable Login"}
                        </button>
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
                                        {(tx.order_amount !== null || tx.order_refunded_amount !== null || tx.clawback_credits !== null) && (
                                          <p className="text-[11px] text-gray-500 mt-1">
                                            {tx.order_amount !== null ? `Paid: ${tx.order_currency || 'USD'} ${Number(tx.order_amount).toFixed(2)}` : ''}
                                            {tx.order_refunded_amount !== null ? ` | Refunded: ${(tx.order_currency || 'USD')} ${Number(tx.order_refunded_amount).toFixed(2)}` : ''}
                                            {tx.clawback_credits !== null ? ` | Clawback: ${tx.clawback_credits} credits${tx.clawback_amount ? ` (~${tx.order_currency || 'USD'} ${Number(tx.clawback_amount).toFixed(2)})` : ''}` : ''}
                                          </p>
                                        )}
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
                                          <th className="px-4 py-2">Paid</th>
                                          <th className="px-4 py-2">Used</th>
                                          <th className="px-4 py-2">Refunded</th>
                                          <th className="px-4 py-2">Coverage</th>
                                          <th className="px-4 py-2">Remaining</th>
                                          <th className="px-4 py-2">Status</th>
                                          <th className="px-4 py-2">Date</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {adminOrders.map((order, idx) => (
                                          <tr key={idx} className="border-b last:border-0">
                                            <td className="px-4 py-2 text-xs font-mono">{order.id.slice(0, 8)}...</td>
                                            <td className="px-4 py-2 capitalize">{order.type}</td>
                                            <td className="px-4 py-2">{formatCurrency((order as any).paid_amount ?? order.amount, order.currency)}</td>
                                            <td className="px-4 py-2 text-xs">
                                              {(order as any).used_amount != null
                                                ? `${formatCurrency((order as any).used_amount, order.currency)} (${(order as any).used_credits ?? 0}c)`
                                                : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-xs">
                                              {(order as any).refunded_amount != null
                                                ? `${formatCurrency((order as any).refunded_amount, order.currency)} (${(order as any).refunded_credits ?? 0}c)`
                                                : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-xs">
                                              {(order as any).refunded_amount != null && ((order as any).paid_amount ?? order.amount) > 0
                                                ? `${Math.min(100, Math.max(0, (((order as any).refunded_amount / ((order as any).paid_amount ?? order.amount)) * 100))).toFixed(1)}%`
                                                : '-'}
                                            </td>
                                            <td className="px-4 py-2 text-xs">
                                              {(order as any).refundable_amount != null
                                                ? `${formatCurrency((order as any).refundable_amount, order.currency)} (${(order as any).remaining_credits ?? 0}c)`
                                                : '-'}
                                            </td>
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
