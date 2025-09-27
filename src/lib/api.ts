// API configuration for VeriBite frontend
// Use this to integrate with the deployed backend

const isDevelopment = process.env.NODE_ENV === "development";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (isDevelopment
    ? "http://localhost:3002"
    : "https://team-juliet-veribite-production.up.railway.app");

if (!API_BASE_URL && !isDevelopment) {
  console.warn(
    "NEXT_PUBLIC_API_URL environment variable not set for production"
  );
}

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  endpoints: {
    // Health check
    health: `${API_BASE_URL}/health`,

    // Prediction endpoints
    predictions: {
      getAll: `${API_BASE_URL}/api/predictions`,
      getByUser: (userAddress: string) =>
        `${API_BASE_URL}/api/predictions/user/${userAddress}`,
      getStats: `${API_BASE_URL}/api/predictions/stats`,
      create: `${API_BASE_URL}/api/predictions`,
    },

    // Admin endpoints
    admin: {
      stats: `${API_BASE_URL}/api/admin/stats`,
      predictions: `${API_BASE_URL}/api/admin/predictions`,
      markOutcome: `${API_BASE_URL}/api/admin/mark-outcome`,
      distributeReward: `${API_BASE_URL}/api/admin/distribute-reward`,
      batchDistribute: `${API_BASE_URL}/api/admin/batch-distribute`,
    },

    // User endpoints
    users: {
      getProfile: (address: string) => `${API_BASE_URL}/api/users/${address}`,
      updateProfile: (address: string) =>
        `${API_BASE_URL}/api/users/${address}`,
    },
  },
};

// HTTP client configuration
export const httpClient = {
  get: async (url: string, options?: RequestInit) => {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  post: async (url: string, data?: any, options?: RequestInit) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },

  // Admin requests with API key
  adminRequest: async (
    url: string,
    method: "GET" | "POST" = "GET",
    data?: any
  ) => {
    const adminKey = process.env.NEXT_PUBLIC_ADMIN_API_KEY;

    if (!adminKey) {
      throw new Error("Admin API key not configured");
    }

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-admin-api-key": adminKey,
      },
    };

    if (method === "POST" && data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Admin API ${response.status}: ${response.statusText}`);
    }

    return response.json();
  },
};

// API service functions
export const apiService = {
  // Health check
  checkHealth: () => httpClient.get(API_CONFIG.endpoints.health),

  // Predictions
  getAllPredictions: () =>
    httpClient.get(API_CONFIG.endpoints.predictions.getAll),
  getUserPredictions: (userAddress: string) =>
    httpClient.get(API_CONFIG.endpoints.predictions.getByUser(userAddress)),
  getPredictionStats: () =>
    httpClient.get(API_CONFIG.endpoints.predictions.getStats),

  // Admin functions
  admin: {
    getStats: () => httpClient.adminRequest(API_CONFIG.endpoints.admin.stats),
    getAllPredictions: () =>
      httpClient.adminRequest(API_CONFIG.endpoints.admin.predictions),
    markOutcome: (predictionId: number, outcome: "correct" | "incorrect") =>
      httpClient.adminRequest(API_CONFIG.endpoints.admin.markOutcome, "POST", {
        predictionId,
        outcome,
      }),
    distributeReward: (predictionId: number) =>
      httpClient.adminRequest(
        API_CONFIG.endpoints.admin.distributeReward,
        "POST",
        {
          predictionId,
        }
      ),
    batchDistribute: (predictionIds: number[]) =>
      httpClient.adminRequest(
        API_CONFIG.endpoints.admin.batchDistribute,
        "POST",
        {
          predictionIds,
        }
      ),
  },
};

export default API_CONFIG;
