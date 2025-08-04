"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  Image,
  FileText,
  Smile,
  Mic,
  Search,
  X,
  Plus,
  Video,
  MapPin,
  CreditCard,
  Zap,
  Clock,
  Save,
  MicOff,
  Play,
  Pause,
  Camera,
  Upload,
  Link,
  FileImage,
  Music,
  Archive,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useChat, useChatStore } from "@/lib/stores/chat";
import { useAntiBlockingStore } from "@/lib/stores/antiBlocking";
import { MessageType, QuickReplyTemplate, FileUploadProgress } from "@/types";
import { cn } from "@/lib/utils";
import { AntiBlockingValidation } from "./anti-blocking-validation";
import { useDragAndDrop } from "@/lib/hooks/useDragAndDrop";
import { validateFile } from "@/lib/utils/upload";

interface MessageInputProps {
  onSearch?: (query: string) => void;
  onClearSearch?: () => void;
  searchQuery?: string;
}

export function MessageInput({
  onSearch,
  onClearSearch,
  searchQuery,
}: MessageInputProps) {
  const {
    activeContact,
    sendMessage,
    isSendingMessage,
    uploadProgress,
    removeUploadProgress,
  } = useChatStore();
  const { lastValidation, validateMessage, clear } = useAntiBlockingStore();

  // Message State
  const [message, setMessage] = useState("");
  const [replyToMessage, setReplyToMessage] = useState<any>(null);

  // File Upload State
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // UI State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLocal, setSearchLocal] = useState("");
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [fadingOutUploads, setFadingOutUploads] = useState<Set<string>>(
    new Set()
  );

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Drag and Drop
  const { isDragging, setDropRef } = useDragAndDrop({
    onFilesDropped: (files) => {
      handleFileSelect({
        length: files.length,
        item: (i) => files[i],
      } as FileList);
    },
    acceptedTypes: ["image/*", "video/*", "audio/*", "application/*"],
    maxFiles: 5,
    maxSize: 50 * 1024 * 1024, // 50MB
    onError: (error) => {
      console.error("❌ Drag & Drop Error:", error);
      // You could show a toast notification here
    },
  });

  // Get quick reply templates from store
  const { quickReplyTemplates, loadQuickReplyTemplates, useQuickReply } =
    useChatStore();

  // Emoji categories
  const emojiCategories = {
    recent: ["👍", "❤️", "😊", "🎉", "👏", "🔥", "💯", "✨"],
    faces: [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "😂",
      "🤣",
      "😊",
      "😇",
      "🙂",
      "🙃",
      "😉",
      "😌",
      "😍",
      "🥰",
      "😘",
      "😗",
      "😙",
      "😚",
      "😋",
      "😛",
      "😝",
      "😜",
    ],
    gestures: [
      "👍",
      "👎",
      "👏",
      "🙌",
      "👐",
      "🤲",
      "🤝",
      "🙏",
      "✍️",
      "💪",
      "🦾",
      "🦿",
      "🦵",
      "🦶",
      "👂",
      "🦻",
      "👃",
      "🧠",
      "🦷",
      "🦴",
    ],
    objects: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
    ],
  };

  if (!activeContact) return null;

  // Load quick reply templates on mount
  useEffect(() => {
    loadQuickReplyTemplates();
  }, [loadQuickReplyTemplates]);

  // Auto-save draft
  useEffect(() => {
    if (message.trim() && !isDraftSaving) {
      const timer = setTimeout(() => {
        setIsDraftSaving(true);
        // Simulate API call
        setTimeout(() => {
          setIsDraftSaving(false);
        }, 500);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message, activeContact.id, isDraftSaving]);

  // Load saved draft
  useEffect(() => {
    // Simulate loading saved draft
    const savedDraft = localStorage.getItem(`draft_${activeContact.id}`);
    if (savedDraft) {
      setMessage(savedDraft);
    }
  }, [activeContact.id]);

  // Auto-validate message when typing
  useEffect(() => {
    if (message.trim() && activeContact && message.length > 10) {
      const timer = setTimeout(async () => {
        try {
          await validateMessage({
            contact_id: parseInt(activeContact.id),
            session_name: "default",
            content: message,
            message_type: "text",
            admin_id: 1, // TODO: Get from auth store
          });
          setShowValidation(true);
        } catch (error) {
          console.error("Validation error:", error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      setShowValidation(false);
      clear();
    }
  }, [message, activeContact, validateMessage, clear]);

  // Auto-remove completed upload progress
  useEffect(() => {
    const completedUploads = Object.entries(uploadProgress).filter(
      ([_, progress]) =>
        progress.progress === 100 && progress.status === "complete"
    );

    if (completedUploads.length > 0) {
      // First, trigger fade out animation
      const completedFileIds = completedUploads.map(([fileId]) => fileId);
      setFadingOutUploads(new Set(completedFileIds));

      const timer = setTimeout(() => {
        // Remove completed uploads from the store after fade animation
        completedUploads.forEach(([fileId]) => {
          removeUploadProgress(fileId);
        });
        // Clear fading state
        setFadingOutUploads(new Set());
      }, 1500); // 1.5 seconds total (0.5s fade + 1s delay)

      return () => clearTimeout(timer);
    }
  }, [uploadProgress, removeUploadProgress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      (!message.trim() && attachmentFiles.length === 0 && !recordingBlob) ||
      isSendingMessage
    )
      return;

    // Clear validation feedback when sending
    setShowValidation(false);
    clear();

    try {
      let messageType: MessageType = "text";
      let mediaFile: File | Blob | undefined;

      if (recordingBlob) {
        messageType = "audio";
        mediaFile = recordingBlob;
      } else if (attachmentFiles.length > 0) {
        const file = attachmentFiles[0];
        messageType = getMessageType(file);
        mediaFile = file;
      }

      await sendMessage({
        content: message.trim(),
        message_type: messageType,
        contact_id: activeContact.id,
        session_id: "default",
        media_file: mediaFile as File,
        reply_to_message_id: replyToMessage?.id,
      });

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const resetForm = () => {
    setMessage("");
    setAttachmentFiles([]);
    setAttachmentPreviews([]);
    setRecordingBlob(null);
    setReplyToMessage(null);
    setRecordingDuration(0);

    // Clear draft
    localStorage.removeItem(`draft_${activeContact.id}`);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const getMessageType = (file: File): MessageType => {
    const fileType = file.type || "";
    if (fileType.startsWith("image/")) return "image";
    if (fileType.startsWith("video/")) return "video";
    if (fileType.startsWith("audio/")) return "audio";
    return "document";
  };

  const handleFileSelect = (files: FileList | null) => {
    console.log(files, "files");

    if (!files) return;

    const fileArray = Array.from(files);

    console.log(fileArray, "fileArray");

    // Validate each file before processing
    const validFiles = fileArray.filter((file) => {
      console.log("Validating file:", file);

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

      console.log("✅ File is valid:", {
        name: file.name,
        size: file.size,
        type: file.type,
      });
      return true;
    });

    console.log("Valid files:", validFiles);

    if (validFiles.length === 0) {
      console.error("❌ No valid files to process");
      return;
    }

    setAttachmentFiles((prev) => [...prev, ...validFiles]);

    // Create previews for images
    validFiles.forEach((file, index) => {
      // Add extra validation for file type
      const fileType = file.type || "";
      if (fileType && fileType.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setAttachmentPreviews((prev) => [
              ...prev,
              e.target!.result as string,
            ]);
          }
        };
        reader.onerror = (error) => {
          console.error("❌ Error reading file:", error);
        };
        reader.readAsDataURL(file);
      }

      // Upload progress will be handled by chat store when message is sent
    });
  };

  const removeAttachment = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
    setAttachmentPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setRecordingBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const playRecordingPreview = () => {
    if (recordingBlob) {
      const audio = new Audio(URL.createObjectURL(recordingBlob));
      previewAudioRef.current = audio;
      audio.play();
      setIsPlayingPreview(true);

      audio.onended = () => {
        setIsPlayingPreview(false);
      };
    }
  };

  const deleteRecording = () => {
    setRecordingBlob(null);
    setRecordingDuration(0);
    setIsPlayingPreview(false);
  };

  const insertTemplate = async (template: QuickReplyTemplate) => {
    // Insert template content
    setMessage((prev) => prev + (prev ? "\n\n" : "") + template.content);
    setShowTemplates(false);

    // Track usage via API
    try {
      await useQuickReply(template.id);
    } catch (error) {
      console.error("Failed to track template usage:", error);
    }

    // Focus textarea
    textareaRef.current?.focus();
  };

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newMessage = message.slice(0, start) + emoji + message.slice(end);
      setMessage(newMessage);

      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      }, 0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Save to localStorage for draft
    localStorage.setItem(`draft_${activeContact.id}`, e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={setDropRef}
      className={cn(
        "border-t bg-background p-4 space-y-4 relative transition-all duration-200",
        isDragging && "bg-blue-50 border-blue-300 border-2 border-dashed"
      )}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-500 rounded-lg bg-opacity-10">
          <div className="p-6 bg-white border-2 border-blue-300 border-dashed rounded-lg shadow-lg">
            <div className="flex flex-col items-center gap-3 text-blue-600">
              <Upload className="w-12 h-12" />
              <p className="text-lg font-semibold">Drop files here</p>
              <p className="text-sm text-gray-600">
                Support images, videos, audio, and documents
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Anti-blocking Validation Feedback */}
      {showValidation && lastValidation && (
        <AntiBlockingValidation
          validation={lastValidation}
          onDismiss={() => {
            setShowValidation(false);
            clear();
          }}
        />
      )}

      {/* Search Bar */}
      {showSearch && (
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search in conversation..."
              value={searchLocal}
              onChange={(e) => {
                setSearchLocal(e.target.value);
                onSearch?.(e.target.value);
              }}
              className="flex-1"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowSearch(false);
                setSearchLocal("");
                onClearSearch?.();
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Typing Indicators */}
      {typingUsers.length > 0 && (
        <div className="px-3 py-2 border-b border-gray-100 bg-blue-50">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
            </div>
            <span>
              {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"}{" "}
              typing...
            </span>
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="p-3 border-b border-gray-100 bg-blue-50">
          {Object.entries(uploadProgress).map(([fileId, progress]) => (
            <div
              key={fileId}
              className={cn(
                "mb-2 transition-all duration-500",
                fadingOutUploads.has(fileId) && "opacity-0 scale-95"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{progress.fileName}</span>
                <span className="text-sm text-gray-500">
                  {progress.progress}%
                </span>
              </div>
              <Progress value={progress.progress} className="h-2" />
              {progress.status === "error" && progress.error && (
                <p className="mt-1 text-xs text-red-500">{progress.error}</p>
              )}
              {progress.progress === 100 && progress.status === "complete" && (
                <p className="flex items-center gap-1 mt-1 text-xs text-green-600">
                  <span className="w-3 h-3 text-green-600">✓</span>
                  Upload completed!
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reply Preview */}
      {replyToMessage && (
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="flex items-start gap-3">
            <div className="w-1 h-full bg-green-500 rounded-full"></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700">
                Replying to{" "}
                {replyToMessage.direction === "outgoing" ? "You" : "Customer"}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {replyToMessage.content}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyToMessage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Voice Recording Preview */}
      {recordingBlob && (
        <div className="p-3 border-b border-gray-100 bg-green-50">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
              <Mic className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">
                Voice Recording
              </p>
              <p className="text-sm text-green-600">
                Duration: {formatDuration(recordingDuration)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={playRecordingPreview}
              disabled={isPlayingPreview}
            >
              {isPlayingPreview ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={deleteRecording}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* File Attachments Preview */}
      {attachmentFiles.length > 0 && (
        <div className="p-3 border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-3">
            {attachmentFiles.map((file, index) => (
              <div key={index} className="relative">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-2 min-w-[200px]">
                  {attachmentPreviews[index] ? (
                    <img
                      src={attachmentPreviews[index]}
                      alt="Preview"
                      className="object-cover w-12 h-12 rounded"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-200 rounded">
                      <FileText className="w-6 h-6 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(index)}
                    className="w-6 h-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Input Area */}
      <form onSubmit={handleSubmit} className="p-3">
        <div className="flex items-end gap-2">
          {/* Left Side Actions */}
          <div className="flex items-center gap-1">
            {/* Search Toggle */}
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={cn(
                "text-gray-500 hover:text-gray-700",
                showSearch && "bg-blue-100 text-blue-600"
              )}
              onClick={() => setShowSearch(!showSearch)}
            >
              <Search className="w-4 h-4" />
            </Button>

            {/* File Upload Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-48">
                <DropdownMenuLabel>Upload Files</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*";
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Photos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "video/*";
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Videos
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept =
                        ".pdf,.doc,.docx,.xls,.xlsx,.txt";
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Documents
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "audio/*";
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <Music className="w-4 h-4 mr-2" />
                  Audio
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <MapPin className="w-4 h-4 mr-2" />
                  Location
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Payment Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Voice Recording */}
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className={cn(
                "text-gray-500 hover:text-gray-700",
                isRecording && "bg-red-100 text-red-600"
              )}
              onMouseDown={startVoiceRecording}
              onMouseUp={stopVoiceRecording}
              onMouseLeave={stopVoiceRecording}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Message Input */}
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              onKeyDown={async (e) => {
                // Handle Ctrl+V for paste (specifically for snipping tools)
                if (e.ctrlKey && e.key === "v") {
                  console.log(
                    "🎯 Ctrl+V detected - checking for snipped images"
                  );

                  // Check if Clipboard API is available
                  if (!navigator.clipboard || !navigator.clipboard.read) {
                    console.log(
                      "ℹ️ Clipboard API not available, using fallback handlers"
                    );
                    return; // Let existing handlers take over
                  }

                  try {
                    // Check clipboard permissions first (if available)
                    if (navigator.permissions) {
                      try {
                        const permission = await navigator.permissions.query({
                          name: "clipboard-read" as any,
                        });
                        if (permission.state === "denied") {
                          console.log(
                            "ℹ️ Clipboard permission denied, using fallback handlers"
                          );
                          return;
                        }
                      } catch (permError) {
                        console.log(
                          "ℹ️ Permission check failed, proceeding anyway"
                        );
                      }
                    }

                    // Read clipboard data
                    const clipboardItems = await navigator.clipboard.read();
                    console.log(
                      "📋 Clipboard items from navigator:",
                      clipboardItems
                    );

                    for (const clipboardItem of clipboardItems) {
                      // Validate clipboard item
                      if (!clipboardItem || !clipboardItem.types) {
                        console.log("⚠️ Invalid clipboard item, skipping");
                        continue;
                      }

                      console.log(
                        "🔍 Clipboard item types:",
                        clipboardItem.types
                      );

                      // Check if clipboard contains image data (from snipping tools)
                      for (const type of clipboardItem.types) {
                        // Validate type string
                        if (!type || typeof type !== "string") {
                          console.log("⚠️ Invalid type, skipping:", type);
                          continue;
                        }

                        if (type.startsWith("image/")) {
                          console.log(`📸 Image found in clipboard: ${type}`);
                          e.preventDefault(); // Prevent default paste behavior

                          try {
                            const blob = await clipboardItem.getType(type);
                            console.log("✅ Image blob retrieved:", blob);

                            // Validate blob
                            if (!blob || blob.size === 0) {
                              console.log("⚠️ Invalid or empty blob, skipping");
                              continue;
                            }

                            // Create a proper File object for the snipped image
                            const timestamp =
                              new Date()
                                .toISOString()
                                .replace(/[:.]/g, "-")
                                .split("T")[0] +
                              "_" +
                              new Date()
                                .toTimeString()
                                .slice(0, 8)
                                .replace(/:/g, "-");

                            // Safely extract extension
                            const extension =
                              type && type.includes("/")
                                ? type.split("/")[1] || "png"
                                : "png";
                            const fileName = `snipped-image-${timestamp}.${extension}`;

                            // Create file with proper validation
                            const file = new File([blob], fileName, {
                              type: type || "image/png",
                              lastModified: Date.now(),
                            });

                            // Validate file creation
                            if (!file || !file.name || !file.type) {
                              console.error(
                                "❌ Failed to create valid file object"
                              );
                              continue;
                            }

                            console.log(`📎 Created file:`, {
                              name: file.name,
                              size: file.size,
                              type: file.type,
                            });

                            // Create proper FileList-like object with all necessary properties
                            const fileList = Object.assign([file], {
                              item: (index: number) =>
                                index === 0 ? file : null,
                            }) as unknown as FileList;

                            console.log(fileList, "fileList");

                            // Use existing file handler
                            handleFileSelect(fileList);

                            console.log(
                              `✅ Successfully pasted snipped image: ${fileName}`
                            );
                            return; // Exit after handling the first image
                          } catch (blobError) {
                            console.error(
                              "❌ Error processing image blob:",
                              blobError
                            );
                          }
                        }
                      }
                    }
                  } catch (clipboardError) {
                    console.log(
                      "ℹ️ Navigator clipboard API not available or failed, falling back to existing handlers"
                    );
                    console.log("ℹ️ Error details:", clipboardError);
                    // Let the event propagate to existing paste handlers
                    // The textarea onPaste and document paste handlers will catch it
                  }
                }
              }}
              placeholder="Type a message..."
              className="min-h-[40px] max-h-[120px] resize-none pr-20 border-gray-300 focus:border-green-500 focus:ring-green-500"
              rows={1}
            />

            {/* Right Side Actions in Input */}
            <div className="absolute flex items-center gap-1 transform -translate-y-1/2 right-2 top-1/2">
              {/* Emoji Picker */}
              <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="w-6 h-6 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-80" side="top">
                  <div className="p-3">
                    <div className="grid grid-cols-8 gap-2">
                      {emojiCategories.faces.map((emoji) => (
                        <button
                          key={emoji}
                          className="p-2 text-lg rounded hover:bg-gray-100"
                          onClick={() => insertEmoji(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Draft Status */}
              {isDraftSaving && (
                <Save className="w-3 h-3 text-blue-500 animate-pulse" />
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1">
            {/* Quick Templates */}
            <Popover open={showTemplates} onOpenChange={setShowTemplates}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Zap className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-80" side="top">
                <div className="p-3">
                  <h4 className="mb-3 font-medium">Quick Reply Templates</h4>
                  <div className="space-y-2 overflow-y-auto max-h-60">
                    {quickReplyTemplates.length > 0 ? (
                      quickReplyTemplates.map((template) => (
                        <div
                          key={template.id}
                          className="p-2 rounded cursor-pointer hover:bg-gray-100"
                          onClick={() => insertTemplate(template)}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-sm font-medium">
                              {template.title}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {template.usage_count}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {template.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-sm text-center text-gray-500">
                        <p>No quick reply templates available.</p>
                        <p className="mt-1 text-xs">
                          Create templates in the Quick Replies page.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={
                (!message.trim() &&
                  attachmentFiles.length === 0 &&
                  !recordingBlob) ||
                isSendingMessage
              }
              className="px-4 text-white bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
        />

        {/* Recording Status */}
        {isRecording && (
          <div className="flex items-center justify-center gap-2 mt-2 text-red-600">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              Recording... {formatDuration(recordingDuration)}
            </span>
            <span className="text-xs">(Release to stop)</span>
          </div>
        )}
      </form>
    </div>
  );
}
