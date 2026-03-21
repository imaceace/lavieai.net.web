const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.lavieai.net";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include",
    });

    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      error: {
        code: "NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Network error",
      },
    };
  }
}

// Auth API
export const authApi = {
  me: () => fetchApi<any>("/auth/me"),
  logout: () => fetchApi<any>("/auth/logout", { method: "POST" }),
};

// User API
export const userApi = {
  getPoints: () => fetchApi<{ points: number }>("/user/points"),
  getTransactions: (limit = 20, offset = 0) =>
    fetchApi<any>(`/user/transactions?limit=${limit}&offset=${offset}`),
  getHistory: (type?: string, limit = 20, offset = 0) =>
    fetchApi<any>(
      `/user/history${type ? `?type=${type}` : ""}&limit=${limit}&offset=${offset}`
    ),
};

// Gallery API
export const galleryApi = {
  list: (params?: { type?: string; style?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set("type", params.type);
    if (params?.style) searchParams.set("style", params.style);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    return fetchApi<any>(`/gallery?${searchParams.toString()}`);
  },
  get: (id: string) => fetchApi<any>(`/gallery/${id}`),
};

// Generate API
export const generateApi = {
  textToImage: (data: {
    prompt: string;
    negativePrompt?: string;
    style?: string;
    useCase?: string;
    resolution?: [number, number];
  }) =>
    fetchApi<{ workId: string; predictionId: string; status: string }>(
      "/generate/text-to-image",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),
  getStatus: (id: string) => fetchApi<any>(`/generate/status/${id}`),
};

// Contact API
export const contactApi = {
  submit: (data: {
    type: "suggestion" | "feedback";
    name?: string;
    email: string;
    title: string;
    content: string;
  }) =>
    fetchApi<{ id: string; message: string }>("/contact", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
