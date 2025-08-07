"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Paperclip,
  FileText,
  Mic,
  Search,
  X,
  Video,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/lib/stores/chat";
import { MessageType } from "@/types";
import { cn, formatDuration } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import MessageReply from "./message-reply";
import EmojiPicker from "./emoji-picker";

interface MessageInputProps {
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  onSearch?: (query: string) => void;
  onClearSearch?: () => void;
  searchQuery?: string;
  onOpenFilePicker?: (type: "image" | "video" | "audio" | "document") => void;
  onFilesChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyboardShortcut?: (event: React.KeyboardEvent) => void;
}

export function MessageInput({
  fileInputRef,
  onSearch,
  onClearSearch,
  onOpenFilePicker,
  onFilesChange,
  onKeyboardShortcut,
}: MessageInputProps) {
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
  const debouncedMessage = useDebounce(message, 800); // Debounce message for auto-save

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

  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get quick reply templates from store
  const { quickReplyTemplates, loadQuickReplyTemplates, useQuickReply } =
    useChatStore();

  if (!activeContact) return null;

  // Load quick reply templates on mount
  useEffect(() => {
    loadQuickReplyTemplates();
  }, [loadQuickReplyTemplates]);

  // Auto-save draft with debounce
  useEffect(() => {
    if (!debouncedMessage.trim()) return;

    setIsDraftSaving(true);
    // Save to localStorage
    localStorage.setItem(`draft_${activeContact.id}`, debouncedMessage);
    // Simulate API call completion
    const timer = setTimeout(() => {
      setIsDraftSaving(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [debouncedMessage, activeContact.id]);

  // Load saved draft
  useEffect(() => {
    // Simulate loading saved draft
    const savedDraft = localStorage.getItem(`draft_${activeContact.id}`);
    if (savedDraft) {
      setMessage(savedDraft);
    }
  }, [activeContact.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!message.trim() && !recordingBlob) || isSendingMessage) return;

    try {
      let messageType: MessageType = "text";
      let mediaFile: File | Blob | undefined;

      if (recordingBlob) {
        messageType = "audio";
        mediaFile = recordingBlob;
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

  // const insertTemplate = async (template: QuickReplyTemplate) => {
  //   setMessage((prev) => prev + (prev ? "\n\n" : "") + template.content);
  //   setShowTemplates(false);

  //   try {
  //     await useQuickReply(template.id);
  //   } catch (error) {
  //     console.error("Failed to track template usage:", error);
  //   }

  //   textareaRef.current?.focus();
  // };

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

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setMessage(value);

      // Auto-resize textarea using requestAnimationFrame for better performance
      const textarea = e.target;
      requestAnimationFrame(() => {
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
      });
    },
    []
  );

  useEffect(() => {
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
    <div className="relative p-4 space-y-4 transition-all duration-200 bg-background">
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
              disabled={(!message.trim() && !recordingBlob) || isSendingMessage}
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
                      onClick={() =>
                        onOpenFilePicker && onOpenFilePicker("image")
                      }
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Photos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        onOpenFilePicker && onOpenFilePicker("video")
                      }
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Videos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        onOpenFilePicker && onOpenFilePicker("document")
                      }
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Documents
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        onOpenFilePicker && onOpenFilePicker("audio")
                      }
                    >
                      <Music className="w-4 h-4 mr-2" />
                      Audio
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
                  onKeyDown={(e) => onKeyboardShortcut && onKeyboardShortcut(e)}
                  placeholder="Type a message..."
                  className="min-h-[40px] max-h-[120px] resize-none pr-20 border-gray-300 focus:border-green-500 focus:ring-green-500"
                  rows={1}
                />

                {/* Right Side Actions in Input */}
                <div className="absolute flex items-center gap-1 transform -translate-y-1/2 right-2 top-1/2">
                  <EmojiPicker
                    onInsertEmoji={(v) => insertEmoji(v)}
                    emojiOpen={showEmojiPicker}
                    onEmojiOpen={setShowEmojiPicker}
                  />

                  {/* Draft Status */}
                  {isDraftSaving && (
                    <Save className="w-3 h-3 text-blue-500 animate-pulse" />
                  )}
                </div>
              </div>
            )}

            {!recordingBlob && (
              <div className="flex items-center gap-1">
                {/* <Popover open={showTemplates} onOpenChange={setShowTemplates}>
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
                </Popover> */}

                <Button
                  type="submit"
                  disabled={
                    (!message.trim() && !recordingBlob) || isSendingMessage
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
          onChange={(e) => onFilesChange && onFilesChange(e)}
        />
      </form>
    </div>
  );
}
