import React, { useState } from 'react';
import { CheckSquare, Square, X, Tag, Archive, Trash2, MessageSquare } from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat';
import { ConversationStatusDropdown } from './ConversationStatusIndicator';

interface BulkOperationsToolbarProps {
  className?: string;
}

export const BulkOperationsToolbar: React.FC<BulkOperationsToolbarProps> = ({
  className = '',
}) => {
  const {
    bulkOperations,
    conversations,
    selectAllConversations,
    clearBulkSelection,
    bulkUpdateConversations,
    labels,
  } = useChatStore();

  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showLabelDropdown, setShowLabelDropdown] = useState(false);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);

  const { selectedConversations, isProcessing } = bulkOperations;
  const selectedCount = selectedConversations.length;
  const totalCount = conversations.length;
  const isAllSelected = selectedCount === totalCount && totalCount > 0;
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

  if (selectedCount === 0) {
    return null;
  }

  const handleSelectAll = () => {
    if (isAllSelected) {
      clearBulkSelection();
    } else {
      selectAllConversations();
    }
  };

  const handleStatusUpdate = async (status: string) => {
    await bulkUpdateConversations({ status });
    setShowStatusDropdown(false);
  };

  const handleLabelUpdate = async (action: 'add' | 'remove') => {
    if (selectedLabels.length === 0) return;
    
    await bulkUpdateConversations({
      labels: {
        action,
        label_ids: selectedLabels,
      },
    });
    
    setSelectedLabels([]);
    setShowLabelDropdown(false);
  };

  const handleArchive = async () => {
    await bulkUpdateConversations({ status: 'archived' });
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCount} conversation${selectedCount !== 1 ? 's' : ''}?`)) {
      await bulkUpdateConversations({ action: 'delete' });
    }
  };

  return (
    <div className={`bg-blue-50 border-b border-blue-200 px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Selection Info */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-blue-700 hover:text-blue-800 transition-colors"
          >
            {isAllSelected ? (
              <CheckSquare className="w-5 h-5" />
            ) : isPartiallySelected ? (
              <div className="w-5 h-5 border-2 border-blue-700 rounded bg-blue-700 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-sm" />
              </div>
            ) : (
              <Square className="w-5 h-5" />
            )}
            <span className="font-medium">
              {isAllSelected ? 'Deselect All' : `Select All (${totalCount})`}
            </span>
          </button>
          
          <div className="text-blue-700">
            <span className="font-medium">{selectedCount}</span> conversation{selectedCount !== 1 ? 's' : ''} selected
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Status Update */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Status</span>
            </button>
            
            {showStatusDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowStatusDropdown(false)}
                />
                <div className="absolute top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="p-2">
                    <button
                      onClick={() => handleStatusUpdate('need_reply')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Need Reply
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('automated')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Automated
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('completed')}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Completed
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Label Management */}
          <div className="relative">
            <button
              onClick={() => setShowLabelDropdown(!showLabelDropdown)}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Tag className="w-4 h-4" />
              <span>Labels</span>
            </button>
            
            {showLabelDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowLabelDropdown(false)}
                />
                <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="p-3">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Select labels to add/remove:
                    </div>
                    
                    <div className="max-h-32 overflow-y-auto space-y-1 mb-3">
                      {labels.map((label) => (
                        <label
                          key={label.id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedLabels.includes(label.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLabels([...selectedLabels, label.id]);
                              } else {
                                setSelectedLabels(selectedLabels.filter(id => id !== label.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="text-sm text-gray-700">{label.name}</span>
                        </label>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleLabelUpdate('add')}
                        disabled={selectedLabels.length === 0}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        Add Labels
                      </button>
                      <button
                        onClick={() => handleLabelUpdate('remove')}
                        disabled={selectedLabels.length === 0}
                        className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        Remove Labels
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Archive */}
          <button
            onClick={handleArchive}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            title="Archive selected conversations"
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            title="Delete selected conversations"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          {/* Cancel */}
          <button
            onClick={clearBulkSelection}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Cancel bulk selection"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="mt-2 flex items-center space-x-2 text-blue-700">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700" />
          <span className="text-sm">Processing bulk operation...</span>
        </div>
      )}
    </div>
  );
};

export default BulkOperationsToolbar;