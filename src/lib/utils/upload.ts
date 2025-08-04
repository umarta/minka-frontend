import { tokenManager } from "@/lib/api";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  onSuccess?: (response: any) => void;
  onError?: (error: Error) => void;
  timeout?: number;
}

/**
 * Upload file with real progress tracking using XMLHttpRequest
 */
export const uploadWithProgress = (
  url: string,
  formData: FormData,
  options: UploadOptions = {}
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const { onProgress, onSuccess, onError, timeout = 30000 } = options;

    // Set timeout
    xhr.timeout = timeout;

    // Track upload progress
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress: UploadProgress = {
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
        };
        onProgress(progress);
      }
    });

    // Handle successful upload
    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (onSuccess) onSuccess(response);
          resolve(response);
        } catch (error) {
          const parseError = new Error("Failed to parse response");
          if (onError) onError(parseError);
          reject(parseError);
        }
      } else {
        const statusError = new Error(
          `Upload failed with status ${xhr.status}`
        );
        if (onError) onError(statusError);
        reject(statusError);
      }
    });

    // Handle upload errors
    xhr.addEventListener("error", () => {
      const networkError = new Error("Network error during upload");
      if (onError) onError(networkError);
      reject(networkError);
    });

    // Handle timeout
    xhr.addEventListener("timeout", () => {
      const timeoutError = new Error("Upload timeout");
      if (onError) onError(timeoutError);
      reject(timeoutError);
    });

    // Handle abort
    xhr.addEventListener("abort", () => {
      const abortError = new Error("Upload aborted");
      if (onError) onError(abortError);
      reject(abortError);
    });

    // Set up request
    xhr.open("POST", url, true);

    // Add authorization header if token exists
    const token = tokenManager.getToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    // Start upload
    xhr.send(formData);
  });
};

/**
 * Upload media file with progress tracking
 */
export const uploadMediaWithProgress = (
  formData: FormData,
  options: UploadOptions = {}
): Promise<any> => {
  const baseURL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
  const url = `${baseURL}/messages/send/media`;

  return uploadWithProgress(url, formData, options);
};

/**
 * Retry upload with exponential backoff
 */
export const uploadWithRetry = async (
  uploadFn: () => Promise<any>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff delay
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Validate file before upload
 */
export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
}

export const validateFile = (
  file: File,
  options: FileValidationOptions = {}
): { valid: boolean; error?: string } => {
  const {
    maxSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = ["image/*", "video/*", "audio/*", "application/*"],
    allowedExtensions = [],
  } = options;

  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxSize)})`,
    };
  }

  // Check file type
  const isTypeAllowed = allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      return file.type.startsWith(type.slice(0, -1));
    }
    return file.type === type;
  });

  if (!isTypeAllowed) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed`,
    };
  }

  // Check file extension if specified
  if (allowedExtensions.length > 0) {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension ".${extension}" is not allowed`,
      };
    }
  }

  return { valid: true };
};
