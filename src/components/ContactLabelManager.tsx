import React, { useState, useEffect } from "react";
import { X, Plus, Search, Tag } from "lucide-react";
import { useChatStore } from "@/lib/stores/chat";
import { ConversationGroup } from "@/types";

interface ContactLabelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  currentSelectedLabels?: Label[];
  onLabelsChanged?: () => void;
}

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
  isSelected?: boolean;
}

export const ContactLabelManager = ({
  isOpen,
  onClose,
  contactId,
  contactName,
  onLabelsChanged,
  currentSelectedLabels,
}: ContactLabelManagerProps) => {
  const {
    labels,
    conversationLabels,
    isLoadingLabels,
    loadLabels,
    createLabel,
    addLabelsToConversation,
    removeLabelsFromConversation,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmittingLabel, setIsSubmittingLabel] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");

  const [pendingLabelIds, setPendingLabelIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const currentLabels =
    currentSelectedLabels || conversationLabels[contactId] || [];
  const currentLabelIds = currentLabels.map((label) => label.id);

  useEffect(() => {
    if (isOpen) {
      setPendingLabelIds([...currentLabelIds]);
    } else {
      setPendingLabelIds([]);
      setSearchQuery("");
      setIsCreatingLabel(false);
      setNewLabelName("");
      setNewLabelColor("#3b82f6");
    }
  }, [isOpen, JSON.stringify(currentLabelIds)]);

  useEffect(() => {
    if (isOpen && currentLabelIds.length >= 0) {
      setPendingLabelIds([...currentLabelIds]);
    }
  }, [currentSelectedLabels, isOpen, JSON.stringify(currentLabelIds)]);

  useEffect(() => {
    if (isOpen) {
      loadLabels();
    }
  }, [isOpen]);

  const filteredLabels = labels.filter((label) =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleLabel = (label: Label) => {
    setPendingLabelIds((prev) => {
      const isCurrentlySelected = prev.includes(label.id);

      if (isCurrentlySelected) {
        const newPending = prev.filter((id) => id !== label.id);
        return newPending;
      } else {
        if (prev.includes(label.id)) {
          return prev;
        } else {
          const newPending = [...prev, label.id];
          return newPending;
        }
      }
    });
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    setIsSubmittingLabel(true);
    try {
      const newLabel = await createLabel({
        name: newLabelName.trim(),
        color: newLabelColor,
      });

      setPendingLabelIds((prev) => [...prev, newLabel.id]);

      // Reset form
      setNewLabelName("");
      setNewLabelColor("#3b82f6");
      setIsCreatingLabel(false);
    } catch (error) {
      console.error("Failed to create label:", error);
    } finally {
      setIsSubmittingLabel(false);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Bandingkan current labels dengan pending labels
      const labelsToAdd = pendingLabelIds.filter(
        (id) => !currentLabelIds.includes(id)
      );
      const labelsToRemove = currentLabelIds.filter(
        (id) => !pendingLabelIds.includes(id)
      );

      // Execute API calls
      if (labelsToAdd.length > 0) {
        await addLabelsToConversation(contactId, labelsToAdd);
      }

      if (labelsToRemove.length > 0) {
        await removeLabelsFromConversation(contactId, labelsToRemove);
      }

      // Callback untuk refresh data - penting untuk update parent component
      if (onLabelsChanged) {
        onLabelsChanged();
      }

      onClose();
    } catch (error) {
      console.error("Failed to save label changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPendingLabelIds([...currentLabelIds]);
    onClose();
  };

  const hasUnsavedChanges =
    JSON.stringify([...pendingLabelIds].sort()) !==
    JSON.stringify([...currentLabelIds].sort());

  const predefinedColors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // yellow
    "#ef4444", // red
    "#8b5cf6", // purple
    "#06b6d4", // cyan
    "#f97316", // orange
    "#84cc16", // lime
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md mx-4 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Manage Labels
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 transition-colors rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contact Info */}
        <div className="px-4 py-2 border-b bg-gray-50">
          <p className="text-sm text-gray-600">
            Managing labels for{" "}
            <span className="font-medium text-gray-900">{contactName}</span>
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute w-4 h-4 text-gray-400 transform -translate-y-1/2 left-3 top-1/2" />
            <input
              type="text"
              placeholder="Search labels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Labels List */}
        <div className="overflow-y-auto max-h-64">
          {isLoadingLabels ? (
            <div className="p-4 text-center text-gray-500">
              Loading labels...
            </div>
          ) : filteredLabels.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? "No labels found" : "No labels available"}
            </div>
          ) : (
            <div className="p-2">
              {filteredLabels.map((label) => {
                const isAssigned = pendingLabelIds.includes(label.id);
                console.log(
                  `Label "${label.name}" (${label.id}): isAssigned=${isAssigned}, pendingLabelIds:`,
                  pendingLabelIds
                );

                return (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-50"
                    onClick={() => handleToggleLabel(label)}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: label.color }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {label.name}
                      </span>
                      {label.description && (
                        <span className="text-xs text-gray-500">
                          {label.description}
                        </span>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      checked={isAssigned}
                      readOnly
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded pointer-events-none focus:ring-blue-500"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create New Label */}
        <div className="border-t">
          {isCreatingLabel ? (
            <div className="p-4 space-y-3">
              <input
                type="text"
                placeholder="Label name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />

              {/* Color Picker */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Color:</span>
                <div className="flex space-x-1">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewLabelColor(color)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        newLabelColor === color
                          ? "border-gray-400"
                          : "border-gray-200"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleCreateLabel}
                  disabled={!newLabelName.trim() || isSubmittingLabel}
                  className="flex-1 px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Label
                </button>
                <button
                  onClick={() => {
                    setIsCreatingLabel(false);
                    setNewLabelName("");
                    setNewLabelColor("#3b82f6");
                  }}
                  disabled={isSubmittingLabel}
                  className="px-4 py-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingLabel(true)}
              className="flex items-center w-full p-4 space-x-2 text-left text-blue-600 transition-colors hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Label</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {pendingLabelIds.length} label
              {pendingLabelIds.length !== 1 ? "s" : ""} selected
              {hasUnsavedChanges && (
                <span className="ml-1 font-medium text-orange-600">
                  (unsaved changes)
                </span>
              )}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 transition-colors rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving || pendingLabelIds.length === 0}
                className="px-4 py-2 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Done"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactLabelManager;
