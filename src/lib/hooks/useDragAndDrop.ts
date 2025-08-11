import { useState, useRef, useCallback } from "react";

interface DragAndDropOptions {
  onFilesDropped?: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  onError?: (error: string) => void;
}

export const useDragAndDrop = (options: DragAndDropOptions = {}) => {
  const {
    onFilesDropped,
    acceptedTypes = [],
    maxFiles = 10,
    maxSize = 50 * 1024 * 1024, // 50MB default
    onError,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      // Check file size
      if (file.size > maxSize) {
        onError?.(
          `File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`
        );
        return false;
      }

      // Check file type if specified
      if (acceptedTypes.length > 0) {
        const isAccepted = acceptedTypes.some((type) => {
          if (type.endsWith("/*")) {
            return file.type.startsWith(type.slice(0, -1));
          }
          return file.type === type;
        });

        if (!isAccepted) {
          onError?.(`File type "${file.type}" is not accepted.`);
          return false;
        }
      }

      return true;
    },
    [acceptedTypes, maxSize, onError]
  );

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if dragged items contain files
    if (e.dataTransfer?.types?.includes("Files")) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(false);

      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files);

        // Check max files limit
        if (files.length > maxFiles) {
          onError?.(`Too many files. Maximum ${maxFiles} files allowed.`);
          return;
        }

        // Validate each file
        const validFiles = files.filter(validateFile);

        if (validFiles.length > 0) {
          onFilesDropped?.(validFiles);
        }
      } else {
        console.log("❌ No files found in drop event");
      }
    },
    [maxFiles, validateFile, onFilesDropped, onError]
  );

  // Set up event listeners
  const setDropRef = useCallback(
    (element: HTMLDivElement | null) => {
      if (dropRef.current) {
        dropRef.current.removeEventListener("dragenter", handleDragEnter);
        dropRef.current.removeEventListener("dragleave", handleDragLeave);
        dropRef.current.removeEventListener("dragover", handleDragOver);
        dropRef.current.removeEventListener("drop", handleDrop);
      }

      dropRef.current = element;

      if (element) {
        // Use passive: false to ensure preventDefault works
        const options = { passive: false };
        element.addEventListener("dragenter", handleDragEnter, options);
        element.addEventListener("dragleave", handleDragLeave, options);
        element.addEventListener("dragover", handleDragOver, options);
        element.addEventListener("drop", handleDrop, options);
      }
    },
    [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]
  );

  return {
    isDragging,
    setDropRef,
    dropRef,
  };
};

export default useDragAndDrop;
