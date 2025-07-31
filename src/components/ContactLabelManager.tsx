import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Tag } from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat';

interface ContactLabelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  currentSelectedLabels?: Label[];
  onLabelsChanged?: () => void; // Callback to refresh conversation data
}

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
  isSelected?: boolean;
}

export const ContactLabelManager: React.FC<ContactLabelManagerProps> = ({
  isOpen,
  onClose,
  contactId,
  contactName,
  onLabelsChanged,
}) => {
  const {
    labels,
    conversationLabels,
    isLoadingLabels,
    loadLabels,
    createLabel,
    addLabelsToConversation,
    removeLabelsFromConversation,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');
  
  const currentLabels = conversationLabels[contactId] || [];
  const currentLabelIds = currentLabels.map(label => label.id);
  useEffect(() => {
    if (isOpen && labels.length === 0) {
      loadLabels();
    }
  }, [isOpen, labels.length, loadLabels]);

  const filteredLabels = labels.filter(label =>
    label.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleLabel = async (label: Label) => {
    const isCurrentlyAssigned = currentLabelIds.includes(label.id);
    
    if (isCurrentlyAssigned) {
      await removeLabelsFromConversation(contactId, [label.id]);
    } else {
      await addLabelsToConversation(contactId, [label.id]);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    
    try {
      const newLabel = await createLabel({
        name: newLabelName.trim(),
        color: newLabelColor,
      });
      
      // Automatically assign the new label to this contact
      await addLabelsToConversation(contactId, [newLabel.id]);
      
      // Reset form
      setNewLabelName('');
      setNewLabelColor('#3b82f6');
      setIsCreatingLabel(false);
    } catch (error) {
      console.error('Failed to create label:', error);
    }
  };

  const predefinedColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // yellow
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#84cc16', // lime
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Manage Labels
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contact Info */}
        <div className="px-4 py-2 bg-gray-50 border-b">
          <p className="text-sm text-gray-600">
            Managing labels for <span className="font-medium text-gray-900">{contactName}</span>
          </p>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search labels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Labels List */}
        <div className="max-h-64 overflow-y-auto">
          {isLoadingLabels ? (
            <div className="p-4 text-center text-gray-500">
              Loading labels...
            </div>
          ) : filteredLabels.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No labels found' : 'No labels available'}
            </div>
          ) : (
            <div className="p-2">
              {filteredLabels.map((label) => {
                const isAssigned = currentLabelIds.includes(label.id);
                return (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
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
                      onChange={() => handleToggleLabel(label)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                        newLabelColor === color ? 'border-gray-400' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleCreateLabel}
                  disabled={!newLabelName.trim()}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Label
                </button>
                <button
                  onClick={() => {
                    setIsCreatingLabel(false);
                    setNewLabelName('');
                    setNewLabelColor('#3b82f6');
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsCreatingLabel(true)}
              className="w-full p-4 text-left text-blue-600 hover:bg-blue-50 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Label</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">
              {currentLabels.length} label{currentLabels.length !== 1 ? 's' : ''} assigned
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactLabelManager;