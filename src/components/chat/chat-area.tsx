"use client";

import { ChatHeader } from "./chat-header";
import { MessagesList } from "./messages-list";
import { MessageInput } from "./message-input";
import { EmptyChatState } from "./empty-chat-state";
import { TakeoverStatus } from "./takeover-status";
import { useChatStore } from "@/lib/stores/chat";
import { Message } from "@/types";
import { useEffect, useState } from "react";
import { useDragAndDrop } from "@/lib/hooks/useDragAndDrop";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface ChatAreaProps {
  onReact?: (messageId: string, emoji: string) => void;
  onEdit?: (messageId: string) => void;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onCopy?: (content: string) => void;
  onSearch?: (query: string) => void;
  onClearSearch?: () => void;
  searchQuery?: string;
  searchResults?: Message[];
  isSearching?: boolean;
  replyToMessage?: Message | null;
  setReplyToMessage?: (message: Message | null) => void;
  editingMessage?: string | null;
  setEditingMessage?: (messageId: string | null) => void;
  onFilesDropped?: (files: File[]) => void;
}

export function ChatArea(props: ChatAreaProps) {
  const { activeContact, sendMessage } = useChatStore();

  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [showDroppedFiles, setShowDroppedFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [isUploading, setIsUploading] = useState(false);

  const { isDragging, setDropRef } = useDragAndDrop({
    onFilesDropped: (files) => {
      console.log("Files dropped in chat area:", files);
      setDroppedFiles(files);
      setShowDroppedFiles(true);

      props.onFilesDropped?.(files);
    },
    acceptedTypes: ["image/*", "video/*", "audio/*", "application/*"],
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024, // 50MB
    onError: (error) => {
      console.error("❌ Drag & Drop Error:", error);
    },
  });

  // Function to handle sending files
  const handleSendFiles = async (files: File[], message?: string) => {
    if (!activeContact) return;

    setIsUploading(true);
    setUploadProgress({});

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `${file.name}-${i}`;

        let messageType: "image" | "video" | "audio" | "document" = "document";

        if (file.type.startsWith("image/")) messageType = "image";
        else if (file.type.startsWith("video/")) messageType = "video";
        else if (file.type.startsWith("audio/")) messageType = "audio";

        // Simulate upload progress
        setUploadProgress((prev) => ({ ...prev, [fileId]: 0 }));

        // Progress simulation with more realistic behavior
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const currentProgress = prev[fileId] || 0;
            if (currentProgress >= 95) {
              clearInterval(progressInterval);
              return prev;
            }
            // Slower progress as it gets closer to completion
            const increment =
              currentProgress < 50 ? Math.random() * 20 : Math.random() * 10;
            const newProgress = Math.min(currentProgress + increment, 95);
            return { ...prev, [fileId]: newProgress };
          });
        }, 300);

        await sendMessage({
          content: file.name,
          message_type: messageType,
          contact_id: activeContact.id,
          session_id: "default",
          media_file: file,
          isDragAndDrop: true, // Flag to indicate this is from drag & drop
        });

        // Complete the progress
        clearInterval(progressInterval);
        setUploadProgress((prev) => ({ ...prev, [fileId]: 100 }));

        // Wait a bit before removing the progress
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }, 1000);
      }

      // Close modal and reset state after all files are sent
      setTimeout(() => {
        setShowDroppedFiles(false);
        setDroppedFiles([]);
        setIsUploading(false);
        setUploadProgress({});
      }, 1500);
    } catch (error) {
      console.error("Failed to send files:", error);
      setIsUploading(false);
      setUploadProgress({});
    }
  };

  // Function to remove a file from dropped files
  const removeDroppedFile = (index: number) => {
    setDroppedFiles((prev) => prev.filter((_, i) => i !== index));
    if (droppedFiles.length === 1) {
      setShowDroppedFiles(false);
    }
  };

  // Prevent default browser drag and drop behavior
  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add event listeners to prevent default browser behavior
    document.addEventListener("dragover", preventDefault);
    document.addEventListener("drop", preventDefault);
    document.addEventListener("dragenter", preventDefault);
    document.addEventListener("dragleave", preventDefault);

    return () => {
      document.removeEventListener("dragover", preventDefault);
      document.removeEventListener("drop", preventDefault);
      document.removeEventListener("dragenter", preventDefault);
      document.removeEventListener("dragleave", preventDefault);
    };
  }, []);

  // Hapus atau komentari useEffect inisialisasi WebSocketManager di ChatArea
  // useEffect(() => {
  //   console.log('[WS] useEffect in ChatArea: initializing WebSocketManager');
  //   createWebSocketManager();
  // }, []);

  return (
    <div
      ref={setDropRef}
      className={cn(
        "flex flex-col flex-1 h-full min-w-0",
        isDragging && "bg-blue-50"
      )}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="p-8 bg-white border-2 border-blue-300 border-dashed rounded-lg shadow-xl">
            <div className="flex flex-col items-center gap-4 text-blue-600">
              <Upload className="w-16 h-16" />
              <div className="text-center">
                <p className="text-xl font-semibold">Drop files here to send</p>
                <p className="mt-1 text-sm text-gray-600">
                  Support images, videos, audio, and documents
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {showDroppedFiles && droppedFiles.length > 0 && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Send Files</h3>
                <button
                  onClick={() => {
                    if (!isUploading) {
                      setShowDroppedFiles(false);
                      setDroppedFiles([]);
                      setUploadProgress({});
                      setIsUploading(false);
                    }
                  }}
                  className="p-1 rounded-full hover:bg-gray-100"
                  disabled={isUploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto max-h-96">
              {/* Upload Progress Display */}
              {isUploading && Object.keys(uploadProgress).length > 0 && (
                <div className="p-3 mb-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 border-2 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <h4 className="text-sm font-medium text-blue-800">
                      Uploading files...
                    </h4>
                  </div>
                  {Object.entries(uploadProgress).map(([fileId, progress]) => (
                    <div key={fileId} className="mb-3 last:mb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-blue-700">
                          {fileId.split("-")[0]}
                        </span>
                        <span className="text-xs text-blue-600">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2 bg-blue-100" />
                      {progress === 100 && (
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex items-center justify-center w-3 h-3 bg-green-500 rounded-full">
                            <span className="text-xs text-white">✓</span>
                          </div>
                          <span className="text-xs text-green-600">
                            Completed
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {droppedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg"
                  >
                    {/* File preview */}
                    <div className="flex-shrink-0">
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt="Preview"
                          className="object-cover w-12 h-12 rounded"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded">
                          {file.type.startsWith("video/") && (
                            <Upload className="w-6 h-6 text-blue-500" />
                          )}
                          {file.type.startsWith("audio/") && (
                            <Upload className="w-6 h-6 text-green-500" />
                          )}
                          {!file.type.startsWith("image/") &&
                            !file.type.startsWith("video/") &&
                            !file.type.startsWith("audio/") && (
                              <Upload className="w-6 h-6 text-gray-500" />
                            )}
                        </div>
                      )}
                    </div>

                    {/* File info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeDroppedFile(index)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!isUploading) {
                      setShowDroppedFiles(false);
                      setDroppedFiles([]);
                      setUploadProgress({});
                      setIsUploading(false);
                    }
                  }}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Cancel"}
                </Button>
                <Button
                  onClick={() => handleSendFiles(droppedFiles)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      Send {droppedFiles.length} file
                      {droppedFiles.length > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!activeContact ? (
        <div className="flex-1 h-full">
          <EmptyChatState />
        </div>
      ) : (
        <>
          <ChatHeader />
          <div className="flex-1 overflow-hidden">
            <div className="py-4">
              <TakeoverStatus contact={activeContact} />
            </div>
            <MessagesList contactId={activeContact.id} />
          </div>
          <MessageInput
            onSearch={props.onSearch}
            onClearSearch={props.onClearSearch}
            searchQuery={props.searchQuery}
          />
        </>
      )}
    </div>
  );
}
