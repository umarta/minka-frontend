import {
  Camera,
  FileText,
  Mic,
  MicOff,
  Music,
  Paperclip,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface IMessageActionProps {
  onOpenFilePicker?: (type: "image" | "video" | "audio" | "document") => void;
  onFilesChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyboardShortcut?: (event: React.KeyboardEvent) => void;
  isRecording?: boolean;
  onStartVoiceRecording?: () => void;
  onStopVoiceRecording?: () => void;
  isNotPadding?: boolean;
}

const MessageAction = (props: IMessageActionProps) => {
  return (
    <div
      className={cn(
        "flex items-center",
        props.isNotPadding ? "gap-4" : "gap-1"
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            className={cn(
              "text-gray-500 hover:text-gray-700",
              props.isNotPadding && "has-[>svg]:px-0"
            )}
          >
            <Paperclip className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-48">
          <DropdownMenuLabel>Upload Files</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              props.onOpenFilePicker && props.onOpenFilePicker("image")
            }
          >
            <Camera className="w-4 h-4 mr-2" />
            Photos
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              props.onOpenFilePicker && props.onOpenFilePicker("video")
            }
          >
            <Video className="w-4 h-4 mr-2" />
            Videos
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              props.onOpenFilePicker && props.onOpenFilePicker("document")
            }
          >
            <FileText className="w-4 h-4 mr-2" />
            Documents
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              props.onOpenFilePicker && props.onOpenFilePicker("audio")
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
          props.isRecording && "bg-red-100 text-red-600",
          props.isNotPadding && "has-[>svg]:px-0"
        )}
        onClick={() => {
          if (props.isRecording) {
            props.onStopVoiceRecording?.();
          } else {
            props.onStartVoiceRecording?.();
          }
        }}
      >
        {props.isRecording ? (
          <MicOff className="w-4 h-4" />
        ) : (
          <Mic className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
};

export default MessageAction;
