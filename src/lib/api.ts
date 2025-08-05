import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import {
  ApiResponse,
  PaginatedResponse,
  AntiBlockingValidationResult,
  AntiBlockingConfig,
  AntiBlockingStats,
  ContactRiskAssessment,
  BulkMessageRequest,
  BulkMessageResponse,
  WaMeLinkRequest,
  WaMeLinkResponse,
  MessageForm,
} from "@/types";

// Extend AxiosRequestConfig to include retry flag
declare module "axios" {
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
export const tokenManager = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("auth_token");
    return token;
  },

  setToken: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("auth_token", token);
    }
  },

  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refresh_token");
  },

  setRefreshToken: (token: string): void => {
    if (typeof window !== "undefined") {
      localStorage.setItem("refresh_token", token);
    }
  },

  removeTokens: (): void => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("refresh_token");
    }
  },
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log("❌ No token found in localStorage");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(
            `${api.defaults.baseURL}/auth/refresh`,
            {
              refresh_token: refreshToken,
            }
          );

          const { token } = response.data.data;
          tokenManager.setToken(token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        tokenManager.removeTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API response wrapper
const handleApiResponse = <T>(response: AxiosResponse<ApiResponse<T>>): T => {
  if (response.data.success) {
    return response.data.data || ({} as T); // fallback ke empty object
  }
  throw new Error(
    response.data.error || response.data.message || "API request failed"
  );
};

// Helper function to extract array from paginated or direct response
const extractArray = <T>(
  data: T[] | { data: T[] } | PaginatedResponse<T>
): T[] => {
  if (Array.isArray(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    "data" in data &&
    Array.isArray((data as any).data)
  ) {
    return (data as any).data;
  }
  return [];
};

// Helper function to extract single item from response
const extractSingle = <T>(data: T | { data: T }): T => {
  if (data && typeof data === "object" && "data" in data) {
    return (data as any).data;
  }
  return data as T;
};

// Standardized API response handler for array responses
const handleArrayResponse = <T>(
  response: AxiosResponse<ApiResponse<T[] | PaginatedResponse<T>>>
): T[] => {
  const data = handleApiResponse(response);
  return extractArray(data);
};

// Standardized API response handler for single item responses
const handleSingleResponse = <T>(
  response: AxiosResponse<ApiResponse<T>>
): T => {
  const data = handleApiResponse(response);
  return extractSingle(data);
};

const handleApiError = (error: AxiosError<ApiResponse>) => {
  if (error.response?.data) {
    const { message, error: errorMessage, errors } = error.response.data;
    if (errors) {
      // Handle validation errors
      const validationErrors = Object.entries(errors)
        .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
        .join("; ");
      throw new Error(validationErrors);
    }
    // Use message first, then errorMessage as fallback
    throw new Error(message || errorMessage || "Request failed");
  }
  throw new Error(error.message || "Network error");
};

// Auth API
export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    try {
      const response = await api.post("/auth/login", credentials);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
      tokenManager.removeTokens();
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  refreshToken: async () => {
    try {
      const refreshToken = tokenManager.getRefreshToken();
      const response = await api.post("/auth/refresh", {
        refresh_token: refreshToken,
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string;
  }) => {
    try {
      const response = await api.post("/auth/change-password", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get("/auth/me");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  updateProfile: async (data: any) => {
    try {
      const response = await api.put("/admin/profile", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Contacts API
export const contactsApi = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    label?: string;
  }) => {
    try {
      const response = await api.get("/contacts", { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/contacts/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  create: async (data: any) => {
    try {
      const response = await api.post("/contacts", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/contacts/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/contacts/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  block: async (id: string) => {
    try {
      const response = await api.post(`/contacts/${id}/block`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  unblock: async (id: string) => {
    try {
      const response = await api.post(`/contacts/${id}/unblock`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  search: async (query: string, params?: any) => {
    try {
      const response = await api.get("/contacts/search", {
        params: { ...params, search: query },
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  bulkUpdate: async (ids: string[], data: any) => {
    try {
      const response = await api.put("/contacts/bulk", { ids, data });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  bulkDelete: async (ids: string[]) => {
    try {
      const response = await api.delete("/contacts/bulk", { data: { ids } });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  addLabel: async (contactId: string, labelId: string) => {
    try {
      const response = await api.post(
        `/contacts/${contactId}/labels/${labelId}`
      );
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  removeLabel: async (contactId: string, labelId: string) => {
    try {
      const response = await api.delete(
        `/contacts/${contactId}/labels/${labelId}`
      );
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  import: async (file: File, options?: any) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (options) {
        formData.append("options", JSON.stringify(options));
      }
      const response = await api.post("/contacts/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  export: async (format: "csv" | "excel", params?: any) => {
    try {
      const response = await api.get("/contacts/export", {
        params: { ...params, format },
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Takeover management
  setTakeover: async (contactId: string, adminId: string) => {
    try {
      const response = await api.put(`/contacts/${contactId}/takeover`, {
        admin_id: adminId,
        mode: "takeover",
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  releaseTakeover: async (contactId: string, adminId: string) => {
    try {
      const response = await api.put(`/contacts/${contactId}/takeover`, {
        admin_id: adminId,
        mode: "release",
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getTakeoverStatus: async (contactId: string) => {
    try {
      const response = await api.get(`/contacts/${contactId}/takeover`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },
};

// Labels API
export const labelsApi = {
  getAll: async (params?: { page?: number; limit?: number }) => {
    try {
      const response = await api.get("/labels", { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  search: async (query: string, params?: { page?: number; limit?: number }) => {
    try {
      const response = await api.get("/labels/search", {
        params: { query, ...params },
      });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  create: async (data: {
    name: string;
    color: string;
    description?: string;
  }) => {
    try {
      const response = await api.post("/labels", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  update: async (
    id: string,
    data: { name?: string; color?: string; description?: string }
  ) => {
    try {
      const response = await api.put(`/labels/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/labels/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getStats: async () => {
    try {
      const response = await api.get("/labels/stats");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  createSystemLabels: async () => {
    try {
      const response = await api.post("/labels/system/create");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  cleanup: async () => {
    try {
      const response = await api.post("/labels/cleanup");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  recalculateUsage: async () => {
    try {
      const response = await api.post("/labels/recalculate");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },
};

// Admins API
export const adminsApi = {
  getAll: async () => {
    try {
      const response = await api.get("/admin/users");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Sessions API
export const sessionsApi = {
  getAll: async () => {
    try {
      const response = await api.get("/sessions");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/sessions/by-id/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getByName: async (name: string) => {
    try {
      const response = await api.get(`/sessions/by-name/${name}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  create: async (data: any) => {
    try {
      const response = await api.post("/sessions", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/sessions/by-id/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/sessions/by-id/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  start: async (name: string) => {
    try {
      const response = await api.post(`/sessions/by-name/${name}/start`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  stop: async (name: string) => {
    try {
      const response = await api.post(`/sessions/by-name/${name}/stop`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  restart: async (name: string) => {
    try {
      const response = await api.post(`/sessions/by-name/${name}/restart`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getQR: async (name: string) => {
    try {
      const response = await api.get(`/sessions/by-name/${name}/qr`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getStatus: async (name: string) => {
    try {
      const response = await api.get(`/sessions/by-name/${name}/status`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  logout: async (name: string) => {
    try {
      const response = await api.post(`/sessions/by-name/${name}/logout`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  sync: async () => {
    try {
      const response = await api.post("/sessions/sync");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getActiveCount: async () => {
    try {
      const response = await api.get("/sessions/active/count");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Messages API
// Files API
export const filesApi = {
  // Get presigned URL for direct client-side upload to storage
  getPresignedUrl: async (fileData: {
    filename: string;
    content_type: string;
    size: number;
    phone_number: string;
  }) => {
    try {
      // Map to the format expected by the backend
      const requestData = {
        phone_number: fileData.phone_number,
        file_name: fileData.filename,
        file_type: fileData.content_type,
        // Optional: expiry_hours: 1
      };

      const response = await api.post("/files/presigned", requestData);
      const responseData = handleSingleResponse<{
        presigned_url: string;
        public_url: string;
      }>(response);

      // Map response fields to match what our code expects
      return responseData
        ? {
            url: responseData.presigned_url,
            file_path: responseData.public_url,
            presignedURL: responseData.presigned_url,
            publicURL: responseData.public_url,
          }
        : null;
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  // Upload file directly to storage using presigned URL
  uploadWithPresignedUrl: async (
    presignedUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(true);
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed due to network error"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted"));
      });

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  },

  // Upload file to backend directly (legacy method)
  upload: async (file: File, onProgress?: (progress: number) => void) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round(
              (progressEvent.loaded / progressEvent.total) * 100
            );
            onProgress(progress);
          }
        },
      });

      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },
};

export const messagesApi = {
  getByContact: async (
    contactId: string,
    params?: { page?: number; limit?: number; query?: string; order?: string }
  ) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.limit) searchParams.append("limit", params.limit.toString());
    if (params?.query) searchParams.append("query", params.query);
    if (params?.order) searchParams.append("order", params.order);

    const response = await api.get(
      `/messages/contact/${contactId}?${searchParams.toString()}`
    );
    return response.data;
  },

  getByTicket: async (
    ticketId: string,
    params?: { page?: number; per_page?: number; order?: string }
  ) => {
    try {
      const response = await api.get(`/messages/ticket/${ticketId}`, {
        params,
      });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  send: async (data: MessageForm) => {
    try {
      // Map the data to match the backend's SendTextMessageRequest structure
      const messageData = {
        session_name: data.session_id || "default",
        ticket_id: data.ticket_id ? data.ticket_id : undefined, // Optional field
        to: data.to, // Required field
        text: data.content, // Required field
        ...(data.reply_to && {
          reply_to: data.reply_to,
        }),
        // AdminID is set by the backend from the JWT token
      };

      const response = await api.post("/messages/send/text", messageData);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  // Send media message using presigned URL flow
  sendMedia: async (
    data: {
      file: File;
      contact_id: string;
      session_id: string;
      content?: string;
      message_type: string;
      reply_to?: string;
      phone_number?: string; // Added phone number parameter
      ticket_id?: number; // Added ticket ID parameter
    },
    onProgress?: (progress: number) => void
  ) => {
    try {
      // Get phone number from contact if not provided directly
      let phoneNumber = data.phone_number;

      if (!phoneNumber) {
        // Try to get contact details if phone number not provided
        try {
          const contactResponse = await api.get(`/contacts/${data.contact_id}`);
          const contact = handleSingleResponse<any>(contactResponse);
          phoneNumber =
            contact?.phone_number || contact?.phone || contact?.wa_id;

          if (!phoneNumber) {
            throw new Error("Could not determine phone number for contact");
          }
        } catch (contactError) {
          console.error("Error fetching contact details:", contactError);
          throw new Error("Phone number is required for media upload");
        }
      }

      // Step 1: Get presigned URL for file upload
      const presignedUrlData = await filesApi.getPresignedUrl({
        filename: data.file.name,
        content_type: data.file.type,
        size: data.file.size,
        phone_number: phoneNumber,
      });

      if (!presignedUrlData?.url) {
        throw new Error("Failed to get presigned URL for file upload");
      }

      // Step 2: Upload file directly to storage using presigned URL
      const uploadSuccess = await filesApi.uploadWithPresignedUrl(
        presignedUrlData.url,
        data.file,
        onProgress
      );

      if (!uploadSuccess) {
        throw new Error("Failed to upload file to storage");
      }

      // Step 3: Send message with media URL to backend
      // Map our data to match the backend's SendMediaMessageRequest structure
      // Use the correct media_type to determine which WAHA endpoint to use
      const mediaType = data.message_type || "document";

      // Prepare the message data according to the new WAHA API format
      const messageData = {
        session_name: data.session_id || "default",
        ticket_id: data.ticket_id ? data.ticket_id : 1, // Use default ticket ID (1) when no ticket available
        to: phoneNumber, // Required field
        media_type: mediaType, // image, video, audio, document
        media_url: presignedUrlData.publicURL || presignedUrlData.file_path, // Use clean URL from backend response
        caption: data.content || "",
        ...(data.reply_to && {
          reply_to: data.reply_to,
        }),
        // AdminID is set by the backend from the JWT token
      };

      const response = await api.post("/messages/send/media", messageData);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  // Legacy method for direct upload to backend (fallback)
  sendMediaDirect: async (data: FormData) => {
    try {
      const response = await api.post("/message/send/media-upload", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  markAsRead: async (ticketId: string) => {
    try {
      const response = await api.put(`/messages/contact/${ticketId}/read-all`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  markSingleAsRead: async (messageId: string) => {
    try {
      const response = await api.put(`/messages/${messageId}/read`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  search: async (query: string, params?: any) => {
    try {
      const response = await api.get("/messages/search", {
        params: { query, ...params },
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getAll: async (params?: { page?: number; per_page?: number }) => {
    try {
      const response = await api.get("/messages", { params });
      return handleApiResponse<PaginatedResponse<any>>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/messages/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/messages/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/messages/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getUnreadCount: async (ticketId: string) => {
    try {
      const response = await api.get(
        `/messages/ticket/${ticketId}/unread-count`
      );
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Tickets API
export const ticketsApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get("/tickets", { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/tickets/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getByContact: async (contactId: string, params?: any) => {
    try {
      const response = await api.get(`/tickets/contact/${contactId}`, {
        params,
      });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  create: async (data: any) => {
    try {
      const response = await api.post("/tickets", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/tickets/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  assign: async (id: string, adminId: string) => {
    try {
      const response = await api.post(`/tickets/${id}/assign`, {
        admin_id: adminId,
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  close: async (id: string, resolution?: string) => {
    try {
      const response = await api.post(`/tickets/${id}/close`, { resolution });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/tickets/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Dashboard API
export const dashboardApi = {
  getOverview: async () => {
    try {
      const response = await api.get("/dashboards/overview");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getTicketStats: async (days?: number) => {
    try {
      const response = await api.get("/dashboards/tickets", {
        params: { days: days || 30 },
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getSessionStats: async () => {
    try {
      const response = await api.get("/dashboards/sessions");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getMessageStats: async (days?: number) => {
    try {
      const response = await api.get("/dashboards/messages", {
        params: { days: days || 30 },
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getRecentActivity: async (limit?: number) => {
    try {
      const response = await api.get("/dashboards/activity", {
        params: { limit: limit || 10 },
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getPerformanceMetrics: async (days?: number) => {
    try {
      const response = await api.get("/dashboards/performance", {
        params: { days: days || 30 },
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getTimeBasedStats: async (period?: string, days?: number) => {
    try {
      const response = await api.get("/dashboards/time-stats", {
        params: { period: period || "daily", days: days || 30 },
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getAdminWorkload: async () => {
    try {
      const response = await api.get("/dashboards/workload");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  getSystemStatus: async () => {
    try {
      const response = await api.get("/dashboards/system-status");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },
};

// Reports API
export const reportsApi = {
  generate: async (type: string, filters?: any) => {
    try {
      const response = await api.post("/reports/generate", { type, filters });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  export: async (type: string, format: string, filters?: any) => {
    try {
      const response = await api.post(
        "/reports/export",
        { type, format, filters },
        {
          responseType: "blob",
        }
      );
      return response.data;
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Admin API
export const adminApi = {
  getAll: async (params?: any) => {
    try {
      const response = await api.get("/admins", { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  create: async (data: any) => {
    try {
      const response = await api.post("/admins", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  update: async (id: string, data: any) => {
    try {
      const response = await api.put(`/admins/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/admins/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// WhatsApp Sync API
export const wahaApi = {
  // Sync messages for a specific contact with upsert logic
  syncContact: async (data: {
    phone_number: string;
    limit?: number;
    upsert_mode?: boolean;
    sync_options?: {
      create_if_new: boolean;
      update_if_exists: boolean;
      skip_duplicates: boolean;
      conflict_resolution: "server_wins" | "client_wins" | "merge";
      include_metadata?: boolean;
    };
  }) => {
    try {
      const response = await api.post("/sync/messages/contact", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Bulk sync all active contacts with upsert logic
  syncAll: async (data: {
    limit?: number;
    upsert_mode?: boolean;
    sync_options?: {
      create_if_new: boolean;
      update_if_exists: boolean;
      skip_duplicates: boolean;
      conflict_resolution: "server_wins" | "client_wins" | "merge";
      include_metadata?: boolean;
      batch_size?: number;
      parallel_sync?: boolean;
    };
    filters?: {
      active_sessions_only?: boolean;
      last_activity_hours?: number;
    };
  }) => {
    try {
      const response = await api.post("/sync/messages/all", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Get sync status for a specific contact
  getSyncStatus: async (phoneNumber: string) => {
    try {
      const response = await api.get(`/sync/status/${phoneNumber}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Get all sync statuses
  getAllSyncStatuses: async () => {
    try {
      const response = await api.get("/sync/status/all");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Get sync history/logs
  getSyncHistory: async (params?: {
    limit?: number;
    offset?: number;
    phone_number?: string;
  }) => {
    try {
      const response = await api.get("/sync/history", { params });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Manually trigger conflict resolution for duplicate records
  resolveConflicts: async (data: {
    phone_number: string;
    conflict_resolution: "server_wins" | "client_wins" | "merge";
    message_ids?: string[];
  }) => {
    try {
      const response = await api.post("/sync/resolve-conflicts", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Get WAHA session status for sync validation
  getWahaStatus: async (sessionName: string) => {
    try {
      const response = await api.get(`/waha/sessions/${sessionName}/status`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  // Validate phone number before sync
  validatePhoneNumber: async (phoneNumber: string) => {
    try {
      const response = await api.post("/sync/validate-phone", {
        phone_number: phoneNumber,
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Quick Reply API
export const quickReplyApi = {
  getAll: async (params?: {
    page?: number;
    per_page?: number;
    category?: string;
  }) => {
    try {
      const response = await api.get("/quick-replies", { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/quick-replies/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  create: async (data: {
    title: string;
    content: string;
    category: string;
  }) => {
    try {
      const response = await api.post("/quick-replies", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  update: async (
    id: string,
    data: { title?: string; content?: string; category?: string }
  ) => {
    try {
      const response = await api.put(`/quick-replies/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/quick-replies/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getByCategory: async (category: string) => {
    try {
      const response = await api.get(`/quick-replies/category/${category}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  incrementUsage: async (id: string) => {
    try {
      const response = await api.post(`/quick-replies/${id}/increment-usage`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Contact Notes API
export const contactNotesApi = {
  getByContact: async (
    contactId: string,
    params?: { page?: number; per_page?: number }
  ) => {
    try {
      const response = await api.get(`/contact-notes/contact/${contactId}`, {
        params,
      });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/contact-notes/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  create: async (data: {
    contact_id: string;
    content: string;
    type: "public" | "private";
  }) => {
    try {
      const response = await api.post("/contact-notes", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  update: async (
    id: string,
    data: { content?: string; type?: "public" | "private" }
  ) => {
    try {
      const response = await api.put(`/contact-notes/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/contact-notes/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// Conversations API
export const conversationsApi = {
  getAll: async (params?: { page?: number; per_page?: number }) => {
    try {
      const response = await api.get("/conversations", { params });
      return handleArrayResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return [];
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/conversations/${id}`);
      const result = handleSingleResponse<any>(response);
      return result;
    } catch (error) {
      console.error("❌ Error fetching conversation by ID:", error);
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  // New method to get conversation detail with all messages
  getConversationDetail: async (
    contactId: string,
    params?: {
      mode?: "unified" | "ticket-specific";
      page?: number;
      limit?: number;
      include_reactions?: boolean;
      include_receipts?: boolean;
      include_history?: boolean;
      ticket_id?: string;
    }
  ) => {
    try {
      const response = await api.get(
        `/enhanced-messages/conversation/${contactId}`,
        { params }
      );
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  // Update conversation status
  updateStatus: async (id: string, status: string) => {
    try {
      const response = await api.put(`/conversations/${id}/status`, { status });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  // Add labels to conversation
  addLabels: async (id: string, labelIds: string[]) => {
    try {
      const response = await api.patch(`/conversations/${id}/labels`, {
        label_ids: labelIds,
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  // Remove labels from conversation
  removeLabels: async (id: string, labelIds: string[]) => {
    try {
      const response = await api.delete(`/conversations/${id}/labels`, {
        data: { label_ids: labelIds },
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  // Bulk update conversations
  bulkUpdate: async (conversationIds: string[], updates: any) => {
    try {
      const response = await api.post("/conversations/bulk-update", {
        conversation_ids: conversationIds,
        updates,
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  // Get unread counts
  getUnreadCounts: async () => {
    try {
      const response = await api.get("/conversations/unread-counts");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  // Get conversations by group
  getByGroup: async (group: string, page = 1, limit = 20) => {
    try {
      const response = await api.get(`/conversations/group/${group}`, {
        params: { page, limit },
      });

      // Handle the correct response structure
      const conversations = response.data.data || [];
      const meta = response.data.meta || {};
      const pagination = meta.pagination || {};

      const result = {
        conversations: conversations,
        total: meta.total || 0,
        page: pagination.page || page,
        limit: pagination.limit || limit,
        hasNext: pagination.has_next || false,
      };

      return result;
    } catch (error) {
      console.error("❌ API Error:", error);
      handleApiError(error as AxiosError<ApiResponse>);
      return { conversations: [], total: 0, page, limit, hasNext: false };
    }
  },

  // Move conversation to group
  moveToGroup: async (conversationId: string, group: string) => {
    try {
      const response = await api.put(`/conversations/${conversationId}/move`, {
        group,
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return null;
    }
  },

  // Get conversation counts by group
  getCounts: async (): Promise<{
    advisor: number;
    ai_agent: number;
    done: number;
  }> => {
    try {
      const response = await api.get("/conversations/counts");
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return { advisor: 0, ai_agent: 0, done: 0 };
    }
  },

  // Get conversations with pagination for performance
  getWithPagination: async (
    page = 1,
    limit = 20
  ): Promise<{
    conversations: any[];
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
  }> => {
    try {
      const response = await api.get("/conversations/paginated", {
        params: { page, limit },
      });
      const data = handleSingleResponse<any>(response);

      // Handle the correct response structure with meta.pagination
      const conversations = data.data || [];
      const meta = response.data.meta || {};
      const pagination = meta.pagination || {};

      return {
        conversations: conversations,
        total: meta.total || pagination.total || 0,
        page: pagination.page || page,
        limit: pagination.limit || limit,
        hasNext: pagination.has_next || false,
      };
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);
      return { conversations: [], total: 0, page, limit, hasNext: false };
    }
  },
};

// Draft Messages API
export const draftMessagesApi = {
  getByContact: async (contactId: string) => {
    try {
      const response = await api.get(`/draft-messages/contact/${contactId}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  getById: async (id: string) => {
    try {
      const response = await api.get(`/draft-messages/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  create: async (data: { contact_id: string; content: string }) => {
    try {
      const response = await api.post("/draft-messages", data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  update: async (id: string, data: { content: string }) => {
    try {
      const response = await api.put(`/draft-messages/${id}`, data);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  delete: async (id: string) => {
    try {
      const response = await api.delete(`/draft-messages/${id}`);
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },

  autoSave: async (contactId: string, content: string) => {
    try {
      const response = await api.post("/draft-messages/auto-save", {
        contact_id: contactId,
        content,
      });
      return handleSingleResponse<any>(response);
    } catch (error) {
      handleApiError(error as AxiosError<ApiResponse>);

      return null;
    }
  },
};

// --- Anti-Blocking API ---
export const antiBlockingApi = {
  validateMessage: async (payload: {
    contact_id: number;
    session_name: string;
    content: string;
    message_type: string;
    admin_id?: number;
  }): Promise<AntiBlockingValidationResult> => {
    const response = await api.post("/anti-blocking/validate", payload);
    return handleSingleResponse<AntiBlockingValidationResult>(response);
  },

  sendWithAntiBlocking: async (payload: {
    contact_id: number;
    session_name: string;
    content: string;
    message_type: string;
    admin_id: number;
    priority?: string;
  }): Promise<{
    success: boolean;
    message_id?: string;
    delay_used?: string;
    risk_level?: string;
  }> => {
    const response = await api.post("/anti-blocking/send", payload);
    return handleSingleResponse(response);
  },

  getConfig: async (): Promise<AntiBlockingConfig> => {
    const response = await api.get("/anti-blocking/config");
    return handleSingleResponse<AntiBlockingConfig>(response);
  },

  updateConfig: async (
    config: Partial<AntiBlockingConfig>
  ): Promise<AntiBlockingConfig> => {
    const response = await api.put("/anti-blocking/config", config);
    return handleSingleResponse<AntiBlockingConfig>(response);
  },

  getStats: async (): Promise<AntiBlockingStats> => {
    const response = await api.get("/anti-blocking/stats");
    return handleSingleResponse<AntiBlockingStats>(response);
  },

  getContactRisk: async (contactId: number): Promise<ContactRiskAssessment> => {
    const response = await api.get(`/anti-blocking/contact-risk/${contactId}`);
    return handleSingleResponse<ContactRiskAssessment>(response);
  },

  bulkSend: async (
    payload: BulkMessageRequest
  ): Promise<BulkMessageResponse> => {
    const response = await api.post("/anti-blocking/bulk-send", payload);
    return handleSingleResponse<BulkMessageResponse>(response);
  },

  generateWaMeLink: async (
    payload: WaMeLinkRequest
  ): Promise<WaMeLinkResponse> => {
    const response = await api.post("/anti-blocking/wame-link", payload);
    return handleSingleResponse<WaMeLinkResponse>(response);
  },
};

export default api;
