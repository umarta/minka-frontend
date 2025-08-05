import { useChatStore } from "@/lib/stores/chat";
import { Camera, X } from "lucide-react";
import Image from "next/image";

const MessageReply = () => {
  const { selectedMessage, setSelectedMessage } = useChatStore();

  console.log(selectedMessage, "selectedMessage in MessageReply");

  const generateReplyContent = () => {
    switch (selectedMessage?.message_type) {
      case "image":
        return (
          <div className="flex items-center gap-1">
            <Camera className="object-contain size-4" />
            <span className="text-sm text-gray-600">Photo</span>
          </div>
        );

      default:
        break;
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <div className="flex justify-between flex-1 gap-4 p-2 bg-gray-100">
        <div className="flex flex-col gap-y-1">
          <h4 className="text-sm font-semibold text-blue-500">
            {selectedMessage?.name}
          </h4>
          {generateReplyContent()}
        </div>
        {selectedMessage?.message_type === "image" &&
          selectedMessage?.media_url && (
            <Image
              className="object-cover object-center size-20"
              src={selectedMessage.media_url}
              alt="Image Reply"
              width={80}
              height={80}
              quality={100}
            />
          )}
      </div>
      <X
        className="w-4 h-4 text-gray-500"
        onClick={() =>
          setSelectedMessage({
            wa_message_id: "",
            content: "",
            name: "",
            message_type: "text",
            direction: "incoming",
            media_url: undefined,
          })
        }
      />
    </div>
  );
};

export default MessageReply;
