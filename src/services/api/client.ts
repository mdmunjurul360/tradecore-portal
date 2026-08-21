/**
 * API Client Abstraction
 * Configured to seamlessly switch between mock services and production REST endpoints.
 */

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_API_BASE_URL || '/api/v1';
    this.token = typeof window !== 'undefined' ? localStorage.getItem('tradecore_auth_token') : null;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('tradecore_auth_token', token);
    } else {
      localStorage.removeItem('tradecore_auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  /**
   * Simulated delay helper for mock calls to mimic real backend network requests
   */
  public async mockDelay<T>(data: T, ms: number = 300): Promise<ApiResponse<T>> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }, ms);
    });
  }

  public async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    // If real backend is connected in future:
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await fetch(`${this.baseUrl}${endpoint}${query}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json();
  }

  public async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    const res = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`API Error: ${res.statusText}`);
    }
    return res.json();
  }
}

export const apiClient = new ApiClient();
