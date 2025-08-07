"use client";

import React from "react";
import { ChatHeader } from "./chat-header";
import { MessagesList } from "./messages-list";
import { MessageInput } from "./message-input";
import { EmptyChatState } from "./empty-chat-state";
import { useChatStore } from "@/lib/stores/chat";
import { Message, MessageType } from "@/types";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useDragAndDrop } from "@/lib/hooks/useDragAndDrop";
import { Mic2, Plus, Upload, Video, X, FileText, Send } from "lucide-react";
import { cn, getMessageType } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "../ui/textarea";
import EmojiPicker from "./emoji-picker";

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
  editingMessage?: string | null;
  setEditingMessage?: (messageId: string | null) => void;
  onFilesDropped?: (files: File[]) => void;
}

export function ChatArea(props: ChatAreaProps) {
  const {
    selectedMessage,
    activeContact,
    sendMessage,
    selectedContactId,
    setSelectedMessage,
  } = useChatStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDroppedFiles, setShowDroppedFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef2 = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize selected file for performance
  const selectedFile = useMemo(() => {
    return droppedFiles[selectedFileIndex];
  }, [droppedFiles, selectedFileIndex]);

  // Memoize file preview URL for performance
  const selectedFilePreviewUrl = useMemo(() => {
    if (!selectedFile || !selectedFile.type.startsWith("image/")) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  // Cleanup preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (selectedFilePreviewUrl) {
        URL.revokeObjectURL(selectedFilePreviewUrl);
      }
    };
  }, [selectedFilePreviewUrl]);

  // Memoize file items rendering for performance
  const fileItems = useMemo(() => {
    return droppedFiles.map((file, index) => (
      <div
        key={`${file.name}-${index}`} // More stable key
        className={cn(
          "relative flex-shrink-0 group cursor-pointer",
          selectedFileIndex === index &&
            "ring-2 ring-blue-500 ring-offset-2 rounded-lg"
        )}
        onClick={() => setSelectedFileIndex(index)}
      >
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          {file.type.startsWith("image/") ? (
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="object-cover rounded size-14"
            />
          ) : (
            <div className="flex items-center justify-center bg-gray-100 rounded size-14">
              {file.type.startsWith("video/") && (
                <Video className="w-6 h-6 text-blue-500" />
              )}
              {file.type.startsWith("audio/") && (
                <Mic2 className="w-6 h-6 text-green-500" />
              )}
              {!file.type.startsWith("image/") &&
                !file.type.startsWith("video/") &&
                !file.type.startsWith("audio/") && (
                  <FileText className="w-6 h-6 text-gray-500" />
                )}
            </div>
          )}
        </div>

        <div className="absolute inset-0 transition-opacity duration-200 opacity-0 group-hover:opacity-100">
          <div className="absolute inset-0 rounded-lg bg-black/20"></div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeDroppedFile(index);
            }}
            className="absolute top-1 right-1 p-0.5 bg-white rounded-full transition-colors duration-200 shadow-sm cursor-pointer"
            disabled={isUploading}
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      </div>
    ));
  }, [droppedFiles, selectedFileIndex, isUploading]);

  const handleAddMoreFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      const prevFilesLength = droppedFiles.length;
      setDroppedFiles((prevFiles) => [...prevFiles, ...files]);
      setShowDroppedFiles(true);
      setSelectedFileIndex(prevFilesLength);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const { isDragging, setDropRef } = useDragAndDrop({
    onFilesDropped: (files) => {
      const prevFilesLength = droppedFiles.length;
      setDroppedFiles((prevFiles) => [...prevFiles, ...files]);
      setShowDroppedFiles(true);

      if (prevFilesLength === 0) {
        setSelectedFileIndex(0);
      } else {
        setSelectedFileIndex(prevFilesLength);
      }

      props.onFilesDropped?.(files);
    },
    acceptedTypes: ["image/*", "video/*", "audio/*", "application/*"],
    maxFiles: 10,
    maxSize: 50 * 1024 * 1024, // 50MB
    onError: (error) => {
      console.error("❌ Drag & Drop Error:", error);
    },
  });

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
  };

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, []);

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setMessage(newValue);

      // Auto-resize textarea using requestAnimationFrame for better performance
      const textarea = e.target;
      requestAnimationFrame(() => {
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
      });
    },
    []
  );

  const removeDroppedFile = useCallback(
    (index: number) => {
      setDroppedFiles((prev) => prev.filter((_, i) => i !== index));

      // Adjust selected index after removal
      if (index === selectedFileIndex) {
        // If removing the selected file, select the next file or previous if it was the last
        if (index >= droppedFiles.length - 1) {
          setSelectedFileIndex(Math.max(0, droppedFiles.length - 2));
        } else {
          setSelectedFileIndex(index);
        }
      } else if (index < selectedFileIndex) {
        // If removing a file before the selected one, decrease selected index
        setSelectedFileIndex(selectedFileIndex - 1);
      }

      if (droppedFiles.length === 1) {
        setShowDroppedFiles(false);
        setIsUploading(false);
        setSelectedFileIndex(0);
      }
    },
    [selectedFileIndex, droppedFiles.length]
  );

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);

    // Validate each file before processing
    const validFiles = fileArray.filter((file) => {
      // Check if it's a valid File object
      if (!file) {
        console.error("❌ File is null or undefined:", file);
        return false;
      }

      // Check if it has the necessary File properties
      if (typeof file !== "object") {
        console.error("❌ File is not an object:", file);
        return false;
      }

      // Check for name property (File objects should have this)
      if (!file.name && file.name !== "") {
        console.error("❌ File object missing name property:", file);
        return false;
      }

      // Check for size property
      if (typeof file.size !== "number") {
        console.error("❌ File object missing or invalid size property:", file);
        return false;
      }

      return true;
    });

    if (validFiles.length === 0) {
      console.error("❌ No valid files to process");
      return;
    }

    if (validFiles.length > 0) {
      setDroppedFiles((prev) => [...prev, ...validFiles]);
      setShowDroppedFiles(true);
    }

    if (fileInputRef2.current) {
      fileInputRef2.current.value = "";
    }
  };

  const handleOnKeyDown = async (
    e: React.KeyboardEvent,
    type: "inner" | "outer"
  ) => {
    if (!["inner", "outer"].includes(type)) return;

    const isPasteShortcut =
      (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "v";

    if (!isPasteShortcut) return;

    if (!navigator.clipboard || !navigator.clipboard.read) {
      console.warn("Clipboard read API not available in this browser.");
      return;
    }

    try {
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({
            name: "clipboard-read" as PermissionName,
          });
          if (permission.state === "denied") {
            console.warn("Clipboard permission denied.");
            return;
          }
        } catch (permError) {
          console.warn(
            "Permission query failed, proceeding anyway.",
            permError
          );
        }
      }

      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        if (!clipboardItem || !clipboardItem.types) continue;

        for (const type of clipboardItem.types) {
          if (typeof type !== "string" || !type.startsWith("image/")) continue;

          e.preventDefault();

          try {
            const blob = await clipboardItem.getType(type);

            if (!blob || blob.size === 0) {
              console.warn("Empty image blob, skipping.");
              continue;
            }

            const timestamp = new Date()
              .toISOString()
              .replace(/[:.]/g, "-")
              .replace("T", "_")
              .split("Z")[0];

            const extension = type.split("/")[1] || "png";
            const fileName = `snipped-image-${timestamp}.${extension}`;

            const file = new File([blob], fileName, {
              type: type,
              lastModified: Date.now(),
            });

            const prevFilesLength = droppedFiles.length;
            setDroppedFiles((prev) => [...prev, file]);
            setShowDroppedFiles(true);

            // Set selected to the newly pasted file
            setSelectedFileIndex(prevFilesLength);
            return;
          } catch (blobError) {
            console.error("Error reading image blob:", blobError);
          }
        }
      }
    } catch (clipboardError) {
      console.error("Clipboard read failed:", clipboardError);
    }
  };

  const resetState = () => {
    setShowDroppedFiles(false);
    setDroppedFiles([]);
    setSelectedFileIndex(0);
    setMessage("");
    // setIsDraftSaving(false);
    setShowEmojiPicker(false);

    // Clear any pending localStorage save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      let messageType: MessageType = "text";
      let mediaFile: File | Blob | undefined;

      if (droppedFiles.length > 0) {
        const file = droppedFiles[0];
        messageType = getMessageType(file);
        mediaFile = file;
      }

      await sendMessage({
        content: message.trim() || "",
        message_type: messageType,
        contact_id: activeContact?.id ?? "",
        session_id: "default",
        media_file: mediaFile as File,
        reply_to: selectedMessage?.wa_message_id || "",
      }).finally(() => {
        resetState();
        setIsSubmitting(false);
        setSelectedMessage({
          wa_message_id: "",
          content: "",
          media_url: "",
          message_type: "text",
          direction: "incoming",
          name: "",
        });
      });

      if (droppedFiles.length > 1) {
        for (let i = 1; i < droppedFiles.length; i++) {
          const file = droppedFiles[i];
          const messageType = getMessageType(file);

          await sendMessage({
            content: "",
            message_type: messageType,
            contact_id: activeContact?.id ?? "",
            session_id: "default",
            media_file: file,
            reply_to: "",
          }).finally(() => {
            resetState();
            setIsSubmitting(false);
            setSelectedMessage({
              wa_message_id: "",
              content: "",
              media_url: "",
              message_type: "text",
              direction: "incoming",
              name: "",
            });
          });
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  useEffect(() => {
    setSelectedMessage({
      wa_message_id: "",
      content: "",
      media_url: "",
      message_type: "text",
      direction: "incoming",
      name: "",
    });
    resetState();
  }, [selectedContactId]);

  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

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

  return (
    <div
      ref={setDropRef}
      className={cn(
        "flex flex-col flex-1 h-full min-w-0",
        isDragging && "bg-blue-50"
      )}
    >
      {!activeContact ? (
        <div className="flex-1 h-full">
          <EmptyChatState />
        </div>
      ) : (
        <>
          <ChatHeader />
          <div className="relative flex-1">
            <MessagesList contactId={activeContact.id} />
            {isDragging && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="p-8 bg-white border-2 border-blue-300 border-dashed rounded-lg shadow-xl">
                  <div className="flex flex-col items-center gap-4 text-blue-600">
                    <Upload className="w-16 h-16" />
                    <div className="text-center">
                      <p className="text-xl font-semibold">
                        {droppedFiles.length > 0
                          ? `Add more files (${droppedFiles.length} files queued)`
                          : "Drop files here to send"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600">
                        Support images, videos, audio, and documents
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showDroppedFiles && droppedFiles.length > 0 && (
              <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold"></h3>
                      <button
                        onClick={() => {
                          if (!isUploading) resetState();
                        }}
                        className="p-1 rounded-full hover:bg-gray-100"
                        disabled={isUploading}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept="image/*,video/*,audio/*,application/*"
                    onChange={handleFileInputChange}
                  />

                  <div className="p-4 border-b border-gray-200">
                    {selectedFile && (
                      <div className="p-3 mb-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {selectedFile.type.startsWith("image/") ? (
                              <img
                                src={selectedFilePreviewUrl!}
                                alt={selectedFile.name}
                                className="object-cover w-12 h-12 rounded"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-12 h-12 bg-white border rounded">
                                {selectedFile.type.startsWith("video/") && (
                                  <Video className="w-6 h-6 text-blue-500" />
                                )}
                                {selectedFile.type.startsWith("audio/") && (
                                  <Mic2 className="w-6 h-6 text-green-500" />
                                )}
                                {!selectedFile.type.startsWith("image/") &&
                                  !selectedFile.type.startsWith("video/") &&
                                  !selectedFile.type.startsWith("audio/") && (
                                    <FileText className="w-6 h-6 text-gray-500" />
                                  )}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              • File {selectedFileIndex + 1} of{" "}
                              {droppedFiles.length}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Textarea
                          ref={textareaRef}
                          value={message}
                          onChange={handleTextareaChange}
                          onKeyPress={handleKeyPress}
                          onKeyDown={(e) => handleOnKeyDown(e, "inner")}
                          placeholder="Type a message..."
                          className="min-h-[40px] max-h-[120px] resize-none pr-20 border-gray-300 focus:border-green-500 focus:ring-green-500"
                          rows={1}
                        />

                        <div className="absolute flex items-center gap-1 transform -translate-y-1/2 right-2 top-1/2">
                          <EmojiPicker
                            onInsertEmoji={(v) => insertEmoji(v)}
                            emojiOpen={showEmojiPicker}
                            onEmojiOpen={setShowEmojiPicker}
                          />

                          {/* {isDraftSaving && (
                            <Save className="w-3 h-3 text-blue-500 animate-pulse" />
                          )} */}
                        </div>
                      </div>
                      <Button
                        className="px-4 text-white bg-green-600 hover:bg-green-700"
                        onClick={handleSubmit}
                        disabled={isSubmitting || message.trim() === ""}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 overflow-y-auto max-h-96">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-3 px-1 py-1 overflow-x-auto scroll-hide">
                        {fileItems}
                      </div>
                      <button
                        className="flex items-center justify-center gap-3 border border-gray-200 rounded-lg size-14 min-w-[56px] max-w-[56px] min-h-[56px] max-h-[56px]"
                        onClick={handleAddMoreFiles}
                        disabled={isUploading}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {showDroppedFiles && droppedFiles.length > 0 ? null : (
            <MessageInput
              fileInputRef={fileInputRef2}
              onSearch={props.onSearch}
              onClearSearch={props.onClearSearch}
              searchQuery={props.searchQuery}
              onFilesChange={(v) => handleFileSelect(v.target.files)}
              onKeyboardShortcut={(e) => handleOnKeyDown(e, "outer")}
              onOpenFilePicker={(v) => {
                if (v === "image") {
                  if (fileInputRef2.current) {
                    fileInputRef2.current.accept = "image/*";
                    fileInputRef2.current.click();
                  }
                } else if (v === "video") {
                  if (fileInputRef2.current) {
                    fileInputRef2.current.accept = "video/*";
                    fileInputRef2.current.click();
                  }
                } else if (v === "document") {
                  if (fileInputRef2.current) {
                    fileInputRef2.current.accept =
                      ".pdf,.doc,.docx,.xls,.xlsx,.txt";
                    fileInputRef2.current.click();
                  }
                } else if (v === "audio") {
                  if (fileInputRef2.current) {
                    fileInputRef2.current.accept = "audio/*";
                    fileInputRef2.current.click();
                  }
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
}

// Export optimized version with React.memo
export const OptimizedChatArea = React.memo(ChatArea);
