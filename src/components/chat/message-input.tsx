"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Paperclip,
  FileText,
  Smile,
  Mic,
  Search,
  X,
  Video,
  MapPin,
  CreditCard,
  Zap,
  Save,
  MicOff,
  Play,
  Pause,
  Camera,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { useChatStore } from "@/lib/stores/chat";
import { MessageType, QuickReplyTemplate } from "@/types";
import { cn, formatDuration } from "@/lib/utils";
import { useDragAndDrop } from "@/lib/hooks/useDragAndDrop";
import MessageReply from "./message-reply";

interface MessageInputProps {
  onSearch?: (query: string) => void;
  onClearSearch?: () => void;
  searchQuery?: string;
}

export function MessageInput({ onSearch, onClearSearch }: MessageInputProps) {
  const {
    selectedContactId,
    selectedMessage,
    setSelectedMessage,
    activeContact,
    sendMessage,
    isSendingMessage,
    uploadProgress,
    removeUploadProgress,
  } = useChatStore();

  // Message State
  const [message, setMessage] = useState("");

  // File Upload State
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentPreviews, setAttachmentPreviews] = useState<string[]>([]);

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<File | Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayTime, setCurrentPlayTime] = useState(0); // Current playback position in seconds

  // UI State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchLocal, setSearchLocal] = useState("");
  const [isDraftSaving, setIsDraftSaving] = useState(false);
  const [fadingOutUploads, setFadingOutUploads] = useState<Set<string>>(
    new Set()
  );

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        reply_to: selectedMessage?.wa_message_id || "",
      });

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
    setRecordingDuration(0);
    setIsPlaying(false);
    setCurrentPlayTime(0);

    // Stop and cleanup audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }

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

  // const removeAttachment = (index: number) => {
  //   setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  //   setAttachmentPreviews((prev) => prev.filter((_, i) => i !== index));
  // };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });

        // Create a File object with proper name
        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, "-")
          .replace("T", "_")
          .split("Z")[0];

        const fileName = `voice-recording-${timestamp}.wav`;

        const audioFile = new File([blob], fileName, {
          type: "audio/wav",
          lastModified: Date.now(),
        });

        setRecordingBlob(audioFile);
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

  const handleAudioPlayPause = () => {
    if (!recordingBlob) return;

    if (isPlaying) {
      // Pause audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      setIsPlaying(false);
    } else {
      // Play audio
      if (audioRef.current) {
        audioRef.current.play();
      } else {
        // Create audio element if not exists
        const audio = new Audio(URL.createObjectURL(recordingBlob));
        audioRef.current = audio;

        // Set current time to where we left off
        audio.currentTime = currentPlayTime;

        // Setup event listeners
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentPlayTime(0);
          if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
          }
        };

        audio.onerror = (error) => {
          console.error("Audio playback error:", error);
          setIsPlaying(false);
          if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
          }
        };

        audio.play();
      }

      setIsPlaying(true);

      // Start countdown timer
      playbackIntervalRef.current = setInterval(() => {
        setCurrentPlayTime((prev) => {
          const newTime = prev + 1;
          // Stop when we reach the total duration
          if (newTime >= recordingDuration) {
            setIsPlaying(false);
            if (playbackIntervalRef.current) {
              clearInterval(playbackIntervalRef.current);
            }
            return 0; // Reset to beginning
          }
          return newTime;
        });
      }, 1000);
    }
  };

  const deleteRecording = () => {
    // Stop playback if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
    }

    setRecordingBlob(null);
    setRecordingDuration(0);
    setIsPlaying(false);
    setCurrentPlayTime(0);
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

  const handleOnKeyDown = async (e: React.KeyboardEvent) => {
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

            const fileList = Object.assign([file], {
              item: (index: number) => (index === 0 ? file : null),
            }) as unknown as FileList;

            handleFileSelect(fileList);
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

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Save to localStorage for draft
    localStorage.setItem(`draft_${activeContact.id}`, e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
  };

  useEffect(() => {
    setAttachmentFiles([]);
    setAttachmentPreviews([]);
    setSelectedMessage({
      wa_message_id: "",
      content: "",
      media_url: "",
      message_type: "text",
      direction: "incoming",
      name: "",
    });
    setSearchLocal("");
    onSearch?.("");
    onClearSearch?.();
    setMessage("");
    deleteRecording();
    setIsRecording(false);
  }, [selectedContactId]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={setDropRef}
      className={cn(
        "bg-background p-4 space-y-4 relative transition-all duration-200",
        isDragging && "bg-blue-50 border-blue-300 border-2 border-dashed"
      )}
    >
      {(selectedMessage?.content || selectedMessage?.media_url) && (
        <MessageReply />
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

      {/* {Object.keys(uploadProgress).length > 0 && (
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
      )} */}

      {/* {attachmentFiles.length > 0 && (
        <div className="absolute inset-x-0 z-20 -top-[83px] px-4 pt-4 mb-0 bg-white">
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
      )} */}
      {/* Main Input Area */}
      <form onSubmit={handleSubmit}>
        {recordingBlob ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                  <Mic className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">
                    Voice Recording
                  </p>
                  <p className="text-sm text-green-600">
                    Duration:{" "}
                    {formatDuration(
                      isPlaying
                        ? recordingDuration - currentPlayTime
                        : recordingDuration
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAudioPlayPause}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deleteRecording}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
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
        ) : (
          <div className="flex items-end gap-2">
            {!recordingBlob && (
              <div className="flex items-center gap-1">
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
                  <DropdownMenuContent
                    side="top"
                    align="start"
                    className="w-48"
                  >
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
            )}

            {isRecording && !recordingBlob && (
              <div className="relative flex-1">
                <div className="flex items-center justify-center gap-2 mt-2 text-red-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">
                    Recording... {formatDuration(recordingDuration)}
                  </span>
                  <span className="text-xs">(Release to stop)</span>
                </div>
              </div>
            )}

            {!isRecording && !recordingBlob && (
              <div className="relative flex-1">
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={handleTextareaChange}
                  onKeyPress={handleKeyPress}
                  onKeyDown={handleOnKeyDown}
                  placeholder="Type a message..."
                  className="min-h-[40px] max-h-[120px] resize-none pr-20 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  rows={1}
                />

                {/* Right Side Actions in Input */}
                <div className="absolute flex items-center gap-1 transform -translate-y-1/2 right-2 top-1/2">
                  {/* Emoji Picker */}
                  <Popover
                    open={showEmojiPicker}
                    onOpenChange={setShowEmojiPicker}
                  >
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
            )}

            {!recordingBlob && (
              <div className="flex items-center gap-1">
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
                      <h4 className="mb-3 font-medium">
                        Quick Reply Templates
                      </h4>
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
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </form>
    </div>
  );
}
