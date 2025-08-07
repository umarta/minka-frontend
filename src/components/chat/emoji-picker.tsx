import { Smile } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import { emojiCategories } from "@/lib/mocks/emoji";

interface IEmojiPickerProps {
  emojiOpen: boolean;
  onEmojiOpen: (open: boolean) => void;
  onInsertEmoji: (emoji: string) => void;
}

const EmojiPicker = (props: IEmojiPickerProps) => {
  return (
    <Popover open={props.emojiOpen} onOpenChange={props.onEmojiOpen}>
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
                onClick={() => props.onInsertEmoji(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
