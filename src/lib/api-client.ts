// API Client for lavieai.net

import FingerprintJS from '@fingerprintjs/fingerprintjs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.lavieai.net';

let fpPromise: Promise<string> | null = null;

async function getFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return '';
  
  if (!fpPromise) {
    fpPromise = (async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      return result.visitorId;
    })();
  }
  
  return fpPromise;
}

export async function getClientFingerprint(): Promise<string> {
  return getFingerprint();
}

async function fileToDataUrl(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:${file.type || 'application/octet-stream'};base64,${btoa(binary)}`;
}

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  // Membership type shown to users: Free/Creator/Plus/Studio
  subscription_type: 'free' | 'creator' | 'plus' | 'studio';
  subscription_interval?: 'monthly' | 'yearly' | null;
  tier: 'free' | 'basic' | 'pro' | 'max' | 'ultra';
  credits: number;
  subscription_expire?: number;
  created_at?: number;
  is_public_default?: number;
  isWhitelisted?: boolean;
  canBuyPoints?: boolean;
  is_admin?: boolean;
}

interface Task {
  id: string;
  prompt: string;
  tool_type: 'text-to-image' | 'image-to-image';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result_url?: string;
  error?: string;
  created_at: number;
}

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  resolution?: [number, number];
  model?: string;
  fastMode?: boolean;
  useCase?: string;
  strength?: number;
}

export interface UseCasePricingPreview {
  use_case: string;
  task_type: string;
  points_cost: number;
  source: 'use_case_pricing' | 'fallback';
  trial: {
    eligible: boolean;
    periodType: 'daily' | 'weekly' | string;
    quota: number;
    used: number;
    remaining: number;
    periodEnd: number | null;
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  monthly_price: number;
  yearly_price: number;
  credits: number;
  features: string[];
}

// Auth API
export const authApi = {
  googleLogin: async () => {
    const fingerprint = await getFingerprint();
    const target = new URL(`${API_BASE}/api/auth/google`);
    if (fingerprint) {
      target.searchParams.set('fp', fingerprint);
    }
    window.location.href = target.toString();
  },

  logout: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Logout failed');
    } catch {
      // Ignore logout errors
    }
  },

  getMe: async (): Promise<User | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: 'include',
      });
      // Important: don't clear user if it's a server/network error
      if (!res.ok) {
        if (res.status === 401) {
          return null; // Explicitly unauthorized
        }
        throw new Error(`API Error ${res.status}`); // Network/Server error, keep existing state if possible
      }
      
      const data = await res.json();
      if (!data.success || !data.data) return null;
      
      const u = data.data;
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        avatar: u.avatar || "",
        subscription_type: (u.subscription_type || 'free'),
        subscription_interval: u.subscription_interval,
        tier: (u.tier || 'basic'),
        credits: u.credits ?? 0,
        subscription_expire: u.subscription_expire,
        created_at: u.created_at,
        is_public_default: u.is_public_default,
        isWhitelisted: u.isWhitelisted,
        canBuyPoints: u.canBuyPoints,
        is_admin: u.is_admin,
      };
    } catch (e) {
      console.error("[authApi.getMe] Failed to fetch user profile", e);
      throw e; // Let caller decide what to do
    }
  },
};

// Whitelist API
export const whitelistApi = {
  join: async (email: string) => {
    const res = await fetch(`${API_BASE}/api/whitelist/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      credentials: "include",
    });
    return res.json();
  },
  getList: async () => {
    const res = await fetch(`${API_BASE}/api/whitelist`, {
      method: "GET",
      credentials: "include",
    });
    return res.json();
  },
  updateStatus: async (email: string, status: "pending" | "approved" | "rejected") => {
    const res = await fetch(`${API_BASE}/api/whitelist/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, status }),
      credentials: "include",
    });
    return res.json();
  },
};

// Admin API
export const adminApi = {
  getUserInfo: async (email: string) => {
    const res = await fetch(`${API_BASE}/api/admin/user/info?email=${encodeURIComponent(email)}`, {
      method: "GET",
      credentials: "include",
    });
    return res.json();
  },
  listUsers: async (params?: {
    email?: string;
    emailMatch?: 'exact' | 'fuzzy';
    name?: string;
    ip?: string;
    page?: number;
    pageSize?: 10 | 20 | 50 | 100;
  }) => {
    const q = new URLSearchParams();
    if (params?.email) q.set('email', params.email);
    if (params?.emailMatch) q.set('email_match', params.emailMatch);
    if (params?.name) q.set('name', params.name);
    if (params?.ip) q.set('ip', params.ip);
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('page_size', String(params.pageSize));
    const res = await fetch(`${API_BASE}/api/admin/users?${q.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    return res.json();
  },
  setUserLoginStatus: async (userId: string, disabled: boolean, reason?: string) => {
    const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(userId)}/login-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ disabled, reason }),
    });
    return res.json();
  },
  getTransactions: async (userId: string, page = 1, limit = 20) => {
    const res = await fetch(`${API_BASE}/api/admin/user/transactions?userId=${encodeURIComponent(userId)}&page=${page}&limit=${limit}`, {
      method: "GET",
      credentials: "include",
    });
    return res.json();
  },
  getOrders: async (userId: string, page = 1, limit = 20) => {
    const res = await fetch(`${API_BASE}/api/admin/user/orders?userId=${encodeURIComponent(userId)}&page=${page}&limit=${limit}`, {
      method: "GET",
      credentials: "include",
    });
    return res.json();
  },
  getWorks: async (userId: string, page = 1, limit = 20) => {
    const res = await fetch(`${API_BASE}/api/admin/user/works?userId=${encodeURIComponent(userId)}&page=${page}&limit=${limit}`, {
      method: "GET",
      credentials: "include",
    });
    return res.json();
  },
  getUploads: async (params?: {
    userId?: string;
    email?: string;
    status?: 'active' | 'expired' | 'deleted' | 'all';
    useCase?: string;
    expiredOnly?: boolean;
    page?: number;
    pageSize?: 10 | 20 | 50 | 100;
  }) => {
    const q = new URLSearchParams();
    if (params?.userId) q.set('user_id', params.userId);
    if (params?.email) q.set('email', params.email);
    if (params?.status) q.set('status', params.status);
    if (params?.useCase) q.set('use_case', params.useCase);
    if (params?.expiredOnly) q.set('expired_only', 'true');
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('page_size', String(params.pageSize));
    const res = await fetch(`${API_BASE}/api/admin/uploads?${q.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    return res.json();
  },
  extendUploads: async (uploadIds: string[], extendDays: number): Promise<{ success: boolean; data?: { updated: number; extend_days: number }; error?: { message?: string } }> => {
    const res = await fetch(`${API_BASE}/api/admin/uploads/extend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ uploadIds, extendDays }),
    });
    return res.json();
  },
  expireUploads: async (uploadIds: string[]): Promise<{ success: boolean; data?: { updated: number }; error?: { message?: string } }> => {
    const res = await fetch(`${API_BASE}/api/admin/uploads/expire`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ uploadIds }),
    });
    return res.json();
  },
  cleanupExpiredUploads: async (payload?: { limit?: number; dryRun?: boolean }): Promise<{
    success: boolean;
    data?: {
      dry_run: boolean;
      total_candidates: number;
      deleted?: number;
      failed?: number;
      failed_items?: Array<{ id: string; reason: string }>;
      candidates?: Array<{ id: string; r2_key: string; status: string; expire_at: number }>;
    };
    error?: { message?: string };
  }> => {
    const res = await fetch(`${API_BASE}/api/admin/uploads/cleanup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload || {}),
    });
    return res.json();
  },
  extendWorks: async (workIds: string[], extendDays: number): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/works/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ workIds, extendDays })
      });
      return res.json();
    } catch {
      return { success: false, message: 'Network error' };
    }
  },

  grantCredits: async (userId: string, amount: number, reason: string, expiresInDays: number): Promise<{ success: boolean; data?: { newBalance: number }; error?: { message: string } }> => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/credits/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId, amount, reason, expiresInDays })
      });
      return res.json();
    } catch (e) {
      return { success: false, error: { message: (e as Error).message || 'Network error' } };
    }
  },

  getSubscriptionRefundPreview: async (email: string, params?: { channelFeeRate?: number; channelFeeMode?: 'ratio' | 'fixed'; channelFeeFixed?: number; pointUsdRate?: number; subscriptionId?: string; orderId?: string }) => {
    const q = new URLSearchParams({ email });
    if (typeof params?.channelFeeRate === 'number') q.set('channel_fee_rate', String(params.channelFeeRate));
    if (params?.channelFeeMode) q.set('channel_fee_mode', params.channelFeeMode);
    if (typeof params?.channelFeeFixed === 'number') q.set('channel_fee_fixed', String(params.channelFeeFixed));
    if (typeof params?.pointUsdRate === 'number') q.set('point_usd_rate', String(params.pointUsdRate));
    if (params?.subscriptionId) q.set('subscription_id', params.subscriptionId);
    if (params?.orderId) q.set('order_id', params.orderId);
    const res = await fetch(`${API_BASE}/api/admin/subscription/refund/preview?${q.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    return res.json();
  },

  lookupSubscriptionRefundTargets: async (params: { email?: string; paypalSubscriptionId?: string; paypalTransactionId?: string }) => {
    const q = new URLSearchParams();
    if (params.email) q.set('email', params.email);
    if (params.paypalSubscriptionId) q.set('paypal_subscription_id', params.paypalSubscriptionId);
    if (params.paypalTransactionId) q.set('paypal_transaction_id', params.paypalTransactionId);
    const res = await fetch(`${API_BASE}/api/admin/subscription/refund/lookup?${q.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    return res.json();
  },

  executeSubscriptionRefund: async (payload: {
    userId: string;
    subscriptionId: string;
    orderId?: string;
    paypalTransactionId?: string;
    finalRefundAmount: number;
    channelFeeRate: number;
    channelFeeMode?: 'ratio' | 'fixed';
    channelFeeFixed?: number;
    pointUsdRate: number;
    reason?: string;
  }) => {
    const res = await fetch(`${API_BASE}/api/admin/subscription/refund/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  getRoutingModels: async (params?: { task_type?: string; tier?: string }) => {
    const query = new URLSearchParams();
    if (params?.task_type) query.set('task_type', params.task_type);
    if (params?.tier) query.set('tier', params.tier);
    const res = await fetch(`${API_BASE}/api/admin/routing/models?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    return res.json();
  },

  getRoutingPolicies: async (params?: { use_case?: string; task_type?: string; tier?: string; model?: string; include_inactive?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.use_case) query.set('use_case', params.use_case);
    if (params?.task_type) query.set('task_type', params.task_type);
    if (params?.tier) query.set('tier', params.tier);
    if (params?.model) query.set('model', params.model);
    if (params?.include_inactive) query.set('include_inactive', 'true');
    const res = await fetch(`${API_BASE}/api/admin/routing/policies?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    return res.json();
  },

  upsertRoutingPolicy: async (payload: {
    id: string;
    use_case: string;
    task_type: string;
    tier: 'basic' | 'pro' | 'max' | 'ultra';
    primary_model: string;
    fallback_models: string[];
    strength_min?: number | null;
    strength_max?: number | null;
    weight_quality: number;
    weight_cost: number;
    weight_speed: number;
    is_active: 0 | 1;
  }) => {
    const res = await fetch(`${API_BASE}/api/admin/routing/policies/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  toggleRoutingPolicy: async (id: string, is_active: 0 | 1) => {
    const res = await fetch(`${API_BASE}/api/admin/routing/policies/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, is_active }),
    });
    return res.json();
  },

  previewRouting: async (payload: { use_case: string; tier: 'basic' | 'pro' | 'max' | 'ultra'; width?: number; height?: number }) => {
    const res = await fetch(`${API_BASE}/api/admin/routing/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  getPricingPolicies: async (params?: { use_case?: string; task_type?: string; tier?: string; include_inactive?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.use_case) query.set('use_case', params.use_case);
    if (params?.task_type) query.set('task_type', params.task_type);
    if (params?.tier) query.set('tier', params.tier);
    if (params?.include_inactive) query.set('include_inactive', 'true');
    const res = await fetch(`${API_BASE}/api/admin/pricing/policies?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
    });
    return res.json();
  },

  upsertPricingPolicy: async (payload: any) => {
    const res = await fetch(`${API_BASE}/api/admin/pricing/policies/upsert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  togglePricingPolicy: async (id: string, is_active: 0 | 1) => {
    const res = await fetch(`${API_BASE}/api/admin/pricing/policies/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, is_active }),
    });
    return res.json();
  },

  getCacheKeys: async () => {
    const res = await fetch(`${API_BASE}/api/admin/cache/keys`, {
      method: 'GET',
      credentials: 'include',
    });
    return res.json();
  },

  purgeCache: async (payload: { scope: 'all' | 'smart-routing' | 'keys'; keys?: string[] }) => {
    const res = await fetch(`${API_BASE}/api/admin/cache/purge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return res.json();
  }
};

// Generation API
export const generateApi = {
  textToImage: async (params: GenerationParams, onResponse?: (res: Response) => void, turnstileToken?: string): Promise<Task> => {
    const fingerprint = await getFingerprint();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Fingerprint': fingerprint,
    };
    if (turnstileToken) {
      headers['X-Turnstile-Token'] = turnstileToken;
    }

    const res = await fetch(`${API_BASE}/api/generate/text-to-image`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        prompt: params.prompt,
        negative_prompt: params.negativePrompt,
        style: params.style,
        width: params.resolution?.[0] || 1024,
        height: params.resolution?.[1] || 1024,
        model: params.model || 'basic',
        fast_mode: params.fastMode,
        use_case: params.useCase,
      }),
    });
    
    if (onResponse) onResponse(res);
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: 'Generation failed', code: 'UNKNOWN_ERROR' } }));
      console.error('[API Client] text-to-image request failed with status', res.status, err);
      
      const code = err.error?.code || 'UNKNOWN_ERROR';
      // Handle Turnstile Challenge
      if (code === 'CHALLENGE_REQUIRED' && !turnstileToken) {
        const { useTurnstileStore } = await import('@/stores/turnstileStore');
        try {
          const newToken = await useTurnstileStore.getState().requestChallenge();
          return generateApi.textToImage(params, onResponse, newToken);
        } catch (challengeErr) {
          throw challengeErr;
        }
      }

      const msg = typeof err.error === 'string'
        ? err.error
        : err.error?.message || 'Generation failed';
      const errorObj = new Error(msg);
      (errorObj as any).code = code;
      throw errorObj;
    }
    const raw = await res.json();
    if (!raw.success || !raw.data) {
      console.error('[API Client] text-to-image logical failure:', raw.error);
      const msg = typeof raw.error === 'string'
        ? raw.error
        : raw.error?.message || 'Generation failed';
      const code = raw.error?.code || 'UNKNOWN_ERROR';
      const errorObj = new Error(msg);
      (errorObj as any).code = code;
      throw errorObj;
    }
    return {
      id: raw.data.workId,
      prompt: params.prompt,
      tool_type: 'text-to-image' as const,
      status: raw.data.status as Task['status'],
      created_at: Date.now() / 1000,
    };
  },

  imageToImage: async (params: GenerationParams & { imageUrl: string; imageId?: string }, onResponse?: (res: Response) => void, turnstileToken?: string): Promise<Task> => {
    const fingerprint = await getFingerprint();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Fingerprint': fingerprint,
    };
    if (turnstileToken) {
      headers['X-Turnstile-Token'] = turnstileToken;
    }

    const res = await fetch(`${API_BASE}/api/generate/image-to-image`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        prompt: params.prompt,
        negative_prompt: params.negativePrompt,
        style: params.style,
        strength: params.strength ?? 0.5,
        model: params.model || 'basic',
        imageUrl: params.imageUrl,
        imageId: params.imageId,
        width: params.resolution?.[0] || 1024,
        height: params.resolution?.[1] || 1024,
        resolution: params.resolution,
        fast_mode: params.fastMode,
        useCase: params.useCase,
      }),
    });
    
    if (onResponse) onResponse(res);
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: 'Generation failed', code: 'UNKNOWN_ERROR' } }));
      console.error('[API Client] image-to-image request failed with status', res.status, err);

      const code = err.error?.code || 'UNKNOWN_ERROR';
      // Handle Turnstile Challenge
      if (code === 'CHALLENGE_REQUIRED' && !turnstileToken) {
        const { useTurnstileStore } = await import('@/stores/turnstileStore');
        try {
          const newToken = await useTurnstileStore.getState().requestChallenge();
          return generateApi.imageToImage(params, onResponse, newToken);
        } catch (challengeErr) {
          throw challengeErr;
        }
      }

      const msg = typeof err.error === 'string'
        ? err.error
        : err.error?.message || 'Generation failed';
      const errorObj = new Error(msg);
      (errorObj as any).code = code;
      throw errorObj;
    }
    const raw = await res.json();
    if (!raw.success || !raw.data) {
      console.error('[API Client] image-to-image logical failure:', raw.error);
      const msg = typeof raw.error === 'string'
        ? raw.error
        : raw.error?.message || 'Generation failed';
      const code = raw.error?.code || 'UNKNOWN_ERROR';
      const errorObj = new Error(msg);
      (errorObj as any).code = code;
      throw errorObj;
    }
    return {
      id: raw.data.workId,
      prompt: params.prompt,
      tool_type: 'image-to-image' as const,
      status: raw.data.status as Task['status'],
      created_at: Date.now() / 1000,
    };
  },

  imageToImageUseCase: async (
    params: { useCase: string; imageUrl: string; imageId?: string; fastMode?: boolean; resolution?: [number, number] },
    onResponse?: (res: Response) => void,
    turnstileToken?: string
  ): Promise<Task> => {
    const fingerprint = await getFingerprint();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Fingerprint': fingerprint,
    };
    if (turnstileToken) headers['X-Turnstile-Token'] = turnstileToken;

    const res = await fetch(`${API_BASE}/api/generate/image-to-image/use-case`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({
        useCase: params.useCase,
        imageUrl: params.imageUrl,
        imageId: params.imageId,
        fast_mode: params.fastMode,
        resolution: params.resolution,
        enforceUseCaseTemplate: true,
      }),
    });
    if (onResponse) onResponse(res);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: 'Generation failed', code: 'UNKNOWN_ERROR' } }));
      const code = err.error?.code || 'UNKNOWN_ERROR';
      if (code === 'CHALLENGE_REQUIRED' && !turnstileToken) {
        const { useTurnstileStore } = await import('@/stores/turnstileStore');
        const newToken = await useTurnstileStore.getState().requestChallenge();
        return generateApi.imageToImageUseCase(params, onResponse, newToken);
      }
      const errorObj = new Error(err.error?.message || 'Generation failed');
      (errorObj as any).code = code;
      throw errorObj;
    }

    const raw = await res.json();
    if (!raw.success || !raw.data) {
      const errorObj = new Error(raw.error?.message || 'Generation failed');
      (errorObj as any).code = raw.error?.code || 'UNKNOWN_ERROR';
      throw errorObj;
    }
    return {
      id: raw.data.workId,
      prompt: params.useCase,
      tool_type: 'image-to-image' as const,
      status: raw.data.status as Task['status'],
      created_at: Date.now() / 1000,
    };
  },

  getUseCasePricingPreview: async (params: {
    useCase: string;
    taskType?: string;
    width?: number;
    height?: number;
    fastMode?: boolean;
  }): Promise<UseCasePricingPreview> => {
    const fp = await getFingerprint();
    const query = new URLSearchParams();
    query.set('use_case', params.useCase);
    if (params.taskType) query.set('task_type', params.taskType);
    if (typeof params.width === 'number') query.set('width', String(params.width));
    if (typeof params.height === 'number') query.set('height', String(params.height));
    query.set('fast_mode', params.fastMode ? 'true' : 'false');

    const res = await fetch(`${API_BASE}/api/generate/use-case-pricing-preview?${query.toString()}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'X-Fingerprint': fp,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: 'Failed to get pricing preview' } }));
      throw new Error(err.error?.message || 'Failed to get pricing preview');
    }

    const raw = await res.json();
    if (!raw.success || !raw.data) {
      throw new Error(raw.error?.message || 'Failed to get pricing preview');
    }
    return raw.data as UseCasePricingPreview;
  },

  getUseCasePricingPreviewBatch: async (params: {
    fastMode?: boolean;
    items: Array<{ useCase: string; width?: number; height?: number; taskType?: string }>;
  }): Promise<{ items: UseCasePricingPreview[] }> => {
    const fp = await getFingerprint();
    const res = await fetch(`${API_BASE}/api/generate/use-case-pricing-preview/batch`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Fingerprint': fp,
      },
      body: JSON.stringify({
        fast_mode: params.fastMode ?? false,
        items: params.items.map((item) => ({
          use_case: item.useCase,
          width: item.width,
          height: item.height,
          task_type: item.taskType,
        })),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: 'Failed to get pricing preview batch' } }));
      throw new Error(err.error?.message || 'Failed to get pricing preview batch');
    }
    const raw = await res.json();
    if (!raw.success || !raw.data?.items) {
      throw new Error(raw.error?.message || 'Failed to get pricing preview batch');
    }
    return { items: raw.data.items as UseCasePricingPreview[] };
  },

  getStatus: async (taskId: string): Promise<Task> => {
    const fingerprint = await getFingerprint();
    const res = await fetch(`${API_BASE}/api/generate/status/${taskId}`, {
      credentials: 'include',
      headers: {
        'X-Fingerprint': fingerprint,
      },
    });
    if (!res.ok) throw new Error('Failed to get status');
    const payload = await res.json();
    if (!payload.success) throw new Error(payload.error?.message || 'Failed to get status');
    return payload.data as Task;
  },
};

// User API
export const userApi = {
  getPoints: async (): Promise<{ credits: number } | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/user/points`, {
        credentials: 'include',
      });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  getCreditHistory: async (): Promise<{ data: Array<{ id: number; user_id: string; change_amount: number; action_type: string; balance_after: number; related_id: string | null; created_at: string }>; pagination: any }> => {
    try {
      const res = await fetch(`${API_BASE}/api/user/transactions`, {
        credentials: 'include',
      });
      if (!res.ok) return { data: [], pagination: { total: 0 } };
      return res.json();
    } catch {
      return { data: [], pagination: { total: 0 } };
    }
  },

  getOrders: async (type?: string): Promise<{ data: Array<{ id: string; type: string; points: number; amount: number; currency: string; status: string; created_at: number; paid_at: number | null; metadata?: string | null }>; pagination: any }> => {
    try {
      const params = new URLSearchParams();
      if (type) params.set('type', type);
      const res = await fetch(`${API_BASE}/api/user/orders?${params}`, {
        credentials: 'include',
      });
      if (!res.ok) return { data: [], pagination: { total: 0 } };
      return res.json();
    } catch {
      return { data: [], pagination: { total: 0 } };
    }
  },

  getSubscriptions: async (): Promise<Array<{ id: string; plan: string; type: string; amount: number; currency: string; status: string; started_at: number; expire_at: number; created_at: number }>> => {
    try {
      const res = await fetch(`${API_BASE}/api/user/subscriptions`, {
        credentials: 'include',
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.success ? data.data : [];
    } catch {
      return [];
    }
  },

  getMessages: async (params?: { limit?: number; offset?: number; unreadOnly?: boolean }): Promise<{
    data: Array<{ id: string; message_type: string; title: string; content: string; metadata?: string; is_read: number; read_at?: number | null; read_ip?: string | null; read_mode?: string | null; created_at: number }>;
    unread: number;
    pagination: { limit: number; offset: number; total: number; hasMore: boolean };
  }> => {
    try {
      const q = new URLSearchParams();
      if (params?.limit) q.set('limit', String(params.limit));
      if (params?.offset) q.set('offset', String(params.offset));
      if (params?.unreadOnly) q.set('unread_only', '1');
      const res = await fetch(`${API_BASE}/api/user/messages?${q.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) return { data: [], unread: 0, pagination: { limit: params?.limit || 20, offset: params?.offset || 0, total: 0, hasMore: false } };
      const payload = await res.json();
      return payload.success
        ? payload
        : { data: [], unread: 0, pagination: { limit: params?.limit || 20, offset: params?.offset || 0, total: 0, hasMore: false } };
    } catch {
      return { data: [], unread: 0, pagination: { limit: params?.limit || 20, offset: params?.offset || 0, total: 0, hasMore: false } };
    }
  },

  markMessagesRead: async (params: { ids?: string[]; readAll?: boolean }): Promise<{ updated: number }> => {
    try {
      const res = await fetch(`${API_BASE}/api/user/messages/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ids: params.ids || [],
          read_all: params.readAll === true,
        }),
      });
      if (!res.ok) return { updated: 0 };
      const payload = await res.json();
      return payload.success ? (payload.data || { updated: 0 }) : { updated: 0 };
    } catch {
      return { updated: 0 };
    }
  },

  updatePublicDefault: async (isPublicDefault: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/user/public-default`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_public_default: isPublicDefault }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  updateWorksRecommended: async (workIds: string[], isRecommended: number): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/api/user/works/recommended`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ work_ids: workIds, is_recommended: isRecommended }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};

// Credits API
export const creditsApi = {
  claimDaily: async (): Promise<{ success: boolean; credits: number }> => {
    try {
      const res = await fetch(`${API_BASE}/api/credits/daily`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to claim daily credits');
      return res.json();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to claim daily credits');
    }
  },
};

// Subscription API
export const subscriptionApi = {
  getPlans: async (): Promise<SubscriptionPlan[]> => {
    try {
      const res = await fetch(`${API_BASE}/api/subscription/plans`);
      if (!res.ok) return [];
      return res.json();
    } catch {
      return [];
    }
  },
};

// Payment API
export const paymentApi = {
  createOrder: async (planId: string, type: 'monthly' | 'yearly'): Promise<{ approvalUrl: string; orderId: string }> => {
    const res = await fetch(`${API_BASE}/api/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ plan_id: planId, type }),
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  },

  createCreditPackOrder: async (packId: string): Promise<{ approvalUrl: string; orderId: string }> => {
    const res = await fetch(`${API_BASE}/api/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credit_pack_id: packId }),
    });
    if (!res.ok) throw new Error('Failed to create order');
    return res.json();
  },
};

// Upload API
export const uploadApi = {
  uploadImage: async (file: File, useCase: string = 'general'): Promise<{ url: string; id: string; expires_at?: number }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('useCase', useCase);

    const fp = await getFingerprint();

    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'X-Fingerprint': fp,
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: 'Upload failed' } }));
      throw new Error(err.error?.message || 'Upload failed');
    }

    const raw = await res.json();
    if (!raw.success || !raw.data) {
      throw new Error(raw.error?.message || 'Upload failed');
    }

    return raw.data;
  },
};

// Gallery API
export const galleryApi = {
  getImages: async (params?: { style?: string; limit?: number; offset?: number }): Promise<{ images: Array<{ id: string; result_url: string; prompt: string; style: string | null; use_case: string | null }> }> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.style) searchParams.set('style', params.style);
      if (params?.limit) searchParams.set('limit', String(params.limit));
      if (params?.offset) searchParams.set('offset', String(params.offset));

      const res = await fetch(`${API_BASE}/api/gallery?${searchParams}`, {
        credentials: 'include',
      });
      if (!res.ok) return { images: [] };
      const response = await res.json();
      return { images: response.data || [] };
    } catch {
      return { images: [] };
    }
  },

  getRecommended: async (params?: { limit?: number; offset?: number; style?: string; sort?: string }): Promise<{ images: any[] }> => {
    try {
      const query = new URLSearchParams();
      if (params?.limit) query.set('limit', String(params.limit));
      if (params?.offset) query.set('offset', String(params.offset));
      if (params?.style) query.set('style', params.style);
      if (params?.sort) query.set('sort', params.sort);

      const res = await fetch(`${API_BASE}/api/gallery?${query}`);
      if (!res.ok) return { images: [] };
      const data = await res.json();
      return { images: data.success ? data.data : [] };
    } catch {
      return { images: [] };
    }
  },
};

// Config API
export const configApi = {
  getPublic: async (): Promise<{
    styles: Array<{ id: string; name: string }>;
    use_cases: Array<{ id: string; name: string }>;
    points_config: { daily_bonus: number; generation_cost: { basic: number; pro: number; ultra: number } };
  }> => {
    try {
      const res = await fetch(`${API_BASE}/api/config`);
      if (!res.ok) throw new Error('Failed to get config');
      return res.json();
    } catch {
      return {
        styles: [],
        use_cases: [],
        points_config: { daily_bonus: 10, generation_cost: { basic: 10, pro: 10, ultra: 10 } }
      };
    }
  },

  getGenerationOptions: async (): Promise<{
    styles: Array<{ id: string; label: string }>;
    colors: Array<{ id: string; label: string }>;
    lighting: Array<{ id: string; label: string }>;
    composition: Array<{ id: string; label: string }>;
    ratios: Array<{ id: string; label: string; width: number; height: number }>;
  } | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/config/generation-options`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.success ? data.data : null;
    } catch {
      return null;
    }
  },
};

// Polling helper for task status
export async function pollTaskStatus(
  taskId: string,
  onProgress?: (task: Task) => void,
  interval = 2000,
  maxAttempts = 60
): Promise<Task> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const task = await generateApi.getStatus(taskId);
      onProgress?.(task);

      if (task.status === 'completed') return task;
      if (task.status === 'failed') throw new Error(task.error || 'Generation failed');
    } catch (error) {
      if (i === maxAttempts - 1) throw error;
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Generation timeout');
}
