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
  tier: 'free' | 'basic' | 'pro' | 'ultra';
  credits: number;
  subscription_expire?: number;
  created_at?: number;
  is_public_default?: number;
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

interface GenerationParams {
  prompt: string;
  negative_prompt?: string;
  style?: string;
  resolution?: [number, number];
  model?: string;
  fast_mode?: boolean;
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
  googleLogin: () => {
    window.location.href = `${API_BASE}/api/auth/google`;
  },

  logout: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST' });
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
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.success || !data.data) return null;
      const u = data.data;
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        avatar: u.avatar || "",
        tier: u.tier || 'free',
        credits: u.credits ?? 0,
        subscription_expire: u.subscription_expire,
        created_at: u.created_at,
        is_public_default: u.is_public_default,
      };
    } catch {
      return null;
    }
  },
};

// Generation API
export const generateApi = {
  textToImage: async (params: GenerationParams): Promise<Task> => {
    const fingerprint = await getFingerprint();
    const res = await fetch(`${API_BASE}/api/generate/text-to-image`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Fingerprint': fingerprint,
      },
      credentials: 'include',
      body: JSON.stringify({
        prompt: params.prompt,
        negative_prompt: params.negative_prompt,
        style: params.style,
        width: params.resolution?.[0] || 1024,
        height: params.resolution?.[1] || 1024,
        model: params.model || 'basic',
        fast_mode: params.fast_mode,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: 'Generation failed' } }));
      const msg = typeof err.error === 'string'
        ? err.error
        : err.error?.message || 'Generation failed';
      throw new Error(msg);
    }
    const raw = await res.json();
    if (!raw.success || !raw.data) {
      const msg = typeof raw.error === 'string'
        ? raw.error
        : raw.error?.message || 'Generation failed';
      throw new Error(msg);
    }
    return {
      id: raw.data.workId,
      prompt: params.prompt,
      tool_type: 'text-to-image' as const,
      status: raw.data.status as Task['status'],
      created_at: Date.now() / 1000,
    };
  },

  imageToImage: async (params: GenerationParams & { image: File }): Promise<Task> => {
    const fingerprint = await getFingerprint();
    const image_base64 = await fileToDataUrl(params.image);

    const res = await fetch(`${API_BASE}/api/generate/image-to-image`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Fingerprint': fingerprint,
      },
      body: JSON.stringify({
        prompt: params.prompt,
        style: params.style,
        strength: 0.5,
        model: params.model || 'basic',
        image_base64,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: 'Generation failed' } }));
      const msg = typeof err.error === 'string'
        ? err.error
        : err.error?.message || 'Generation failed';
      throw new Error(msg);
    }
    const raw = await res.json();
    if (!raw.success || !raw.data) {
      const msg = typeof raw.error === 'string'
        ? raw.error
        : raw.error?.message || 'Generation failed';
      throw new Error(msg);
    }
    return {
      id: raw.data.workId,
      prompt: params.prompt,
      tool_type: 'image-to-image' as const,
      status: raw.data.status as Task['status'],
      created_at: Date.now() / 1000,
    };
  },

  getStatus: async (taskId: string): Promise<Task> => {
    const res = await fetch(`${API_BASE}/api/generate/status/${taskId}`, {
      credentials: 'include',
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

  getOrders: async (type?: string): Promise<{ data: Array<{ id: string; type: string; points: number; amount: number; currency: string; status: string; created_at: number; paid_at: number | null }>; pagination: any }> => {
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
