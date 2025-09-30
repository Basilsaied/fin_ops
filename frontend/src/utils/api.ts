import axios, { AxiosError, AxiosInstance } from 'axios';
import { ApiError } from '../types/expense';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: {
    message: string;
    code: string;
    timestamp: string;
    path: string;
  };
}

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string = API_BASE_URL) {
    this.client = axios.create({
      baseURL: `${baseURL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token here if needed in the future
        // const token = localStorage.getItem('authToken');
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error: AxiosError) => {
        // Transform axios errors to our ApiError format
        const apiError: ApiError = {
          message: 'An unexpected error occurred',
          code: 'UNKNOWN_ERROR',
        };

        if (error.response) {
          // Server responded with error status
          const responseData = error.response.data as any;
          apiError.message = responseData?.error?.message || responseData?.message || error.message;
          apiError.code = responseData?.error?.code || `HTTP_${error.response.status}`;
          apiError.details = responseData?.error?.details;
        } else if (error.request) {
          // Request was made but no response received
          apiError.message = 'Network error - please check your connection';
          apiError.code = 'NETWORK_ERROR';
        } else {
          // Something else happened
          apiError.message = error.message;
          apiError.code = 'REQUEST_ERROR';
        }

        return Promise.reject(apiError);
      }
    );
  }

  // GET request
  async get<T>(endpoint: string, params?: any): Promise<T> {
    const response = await this.client.get(endpoint, { params });
    return response.data;
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.post(endpoint, data);
    return response.data;
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await this.client.put(endpoint, data);
    return response.data;
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    const response = await this.client.delete(endpoint);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    return this.get('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;