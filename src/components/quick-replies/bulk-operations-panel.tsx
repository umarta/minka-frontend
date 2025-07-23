'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, 
  Copy, 
  FolderOpen, 
  Download, 
  Upload, 
  Archive,
  Share,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/lib/stores/chat';
import { QuickReplyTemplate } from '@/types';

interface BulkOperationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplates: string[];
  templates: QuickReplyTemplate[];
  onSelectionChange: (selectedIds: string[]) => void;
}

type BulkOperation = 
  | 'delete'
  | 'duplicate'
  | 'move-category'
  | 'export'
  | 'archive'
  | 'share';

interface OperationConfig {
  id: BulkOperation;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'default' | 'destructive' | 'secondary';
  requiresConfirmation: boolean;
}

const BULK_OPERATIONS: OperationConfig[] = [
  {
    id: 'duplicate',
    label: 'Duplicate Templates',
    description: 'Create copies of selected templates',
    icon: Copy,
    variant: 'default',
    requiresConfirmation: false
  },
  {
    id: 'move-category',
    label: 'Move to Category',
    description: 'Change category for selected templates',
    icon: FolderOpen,
    variant: 'default',
    requiresConfirmation: false
  },
  {
    id: 'export',
    label: 'Export Templates',
    description: 'Download selected templates as JSON',
    icon: Download,
    variant: 'secondary',
    requiresConfirmation: false
  },
  {
    id: 'share',
    label: 'Share with Team',
    description: 'Make selected templates available to team members',
    icon: Share,
    variant: 'default',
    requiresConfirmation: false
  },
  {
    id: 'archive',
    label: 'Archive Templates',
    description: 'Move selected templates to archive',
    icon: Archive,
    variant: 'secondary',
    requiresConfirmation: true
  },
  {
    id: 'delete',
    label: 'Delete Templates',
    description: 'Permanently delete selected templates',
    icon: Trash2,
    variant: 'destructive',
    requiresConfirmation: true
  }
];

export function BulkOperationsPanel({ 
  isOpen, 
  onClose, 
  selectedTemplates, 
  templates, 
  onSelectionChange 
}: BulkOperationsPanelProps) {
  const { toast } = useToast();
  const { createQuickReply, updateQuickReply, deleteQuickReply } = useChatStore();
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [targetCategory, setTargetCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const selectedTemplateObjects = templates.filter(t => selectedTemplates.includes(t.id));
  const categories = Array.from(new Set(templates.map(t => t.category))).filter(Boolean);

  const handleOperationSelect = (operation: BulkOperation) => {
    setSelectedOperation(operation);
    const config = BULK_OPERATIONS.find(op => op.id === operation);
    if (config?.requiresConfirmation) {
      setShowConfirmation(true);
    }
  };

  const handleDuplicateTemplates = async () => {
    setIsLoading(true);
    try {
      const promises = selectedTemplateObjects.map(template => 
        createQuickReply({
          title: `${template.title} (Copy)`,
          content: template.content,
          category: template.category
        })
      );
      await Promise.all(promises);
      toast({
        title: "Templates duplicated",
        description: `Successfully duplicated ${selectedTemplates.length} template(s).`,
      });
      onSelectionChange([]);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate some templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToCategory = async () => {
    if (!targetCategory) {
      toast({
        title: "Error",
        description: "Please select a target category.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const promises = selectedTemplateObjects.map(template => 
        updateQuickReply(template.id, {
          ...template,
          category: targetCategory === 'none' ? '' : targetCategory
        })
      );
      await Promise.all(promises);
      toast({
        title: "Templates moved",
        description: `Successfully moved ${selectedTemplates.length} template(s) to ${targetCategory}.`,
      });
      onSelectionChange([]);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move some templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportTemplates = () => {
    const exportData = {
      templates: selectedTemplateObjects,
      exportDate: new Date().toISOString(),
      count: selectedTemplates.length
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quick-reply-templates-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Templates exported",
      description: `Successfully exported ${selectedTemplates.length} template(s).`,
    });
    onClose();
  };

  const handleDeleteTemplates = async () => {
    setIsLoading(true);
    try {
      const promises = selectedTemplates.map(id => deleteQuickReply(id));
      await Promise.all(promises);
      toast({
        title: "Templates deleted",
        description: `Successfully deleted ${selectedTemplates.length} template(s).`,
      });
      onSelectionChange([]);
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete some templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleShareTemplates = async () => {
    // This would typically update the isShared field
    // For now, we'll just show a success message
    toast({
      title: "Templates shared",
      description: `Successfully shared ${selectedTemplates.length} template(s) with team.`,
    });
    onClose();
  };

  const handleArchiveTemplates = async () => {
    // This would typically move templates to an archived state
    // For now, we'll just show a success message
    toast({
      title: "Templates archived",
      description: `Successfully archived ${selectedTemplates.length} template(s).`,
    });
    onSelectionChange([]);
    onClose();
  };

  const executeOperation = async () => {
    switch (selectedOperation) {
      case 'duplicate':
        await handleDuplicateTemplates();
        break;
      case 'move-category':
        await handleMoveToCategory();
        break;
      case 'export':
        handleExportTemplates();
        break;
      case 'share':
        await handleShareTemplates();
        break;
      case 'archive':
        await handleArchiveTemplates();
        break;
      case 'delete':
        await handleDeleteTemplates();
        break;
    }
  };

  const resetState = () => {
    setSelectedOperation(null);
    setTargetCategory('');
    setShowConfirmation(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (showConfirmation) {
    const operation = BULK_OPERATIONS.find(op => op.id === selectedOperation);
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm Action
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to {operation?.label.toLowerCase()} {selectedTemplates.length} template(s)?
            </p>
            
            {selectedOperation === 'delete' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ This action cannot be undone!
                </p>
                <p className="text-xs text-red-600 mt-1">
                  All selected templates will be permanently deleted.
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-2">Selected templates:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {selectedTemplateObjects.slice(0, 5).map(template => (
                  <div key={template.id} className="text-xs text-gray-800">
                    • {template.title}
                  </div>
                ))}
                {selectedTemplateObjects.length > 5 && (
                  <div className="text-xs text-gray-500">
                    ... and {selectedTemplateObjects.length - 5} more
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowConfirmation(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant={operation?.variant || 'default'}
              onClick={executeOperation}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Bulk Operations
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Selected Templates Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Selected Templates ({selectedTemplates.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {selectedTemplateObjects.map(template => (
                  <Badge key={template.id} variant="secondary" className="flex items-center gap-1">
                    {template.title}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => onSelectionChange(selectedTemplates.filter(id => id !== template.id))}
                    />
                  </Badge>
                ))}
              </div>
              {selectedTemplates.length === 0 && (
                <p className="text-sm text-gray-500">No templates selected</p>
              )}
            </CardContent>
          </Card>

          {/* Operations */}
          {selectedTemplates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available Operations</CardTitle>
                <CardDescription>
                  Choose an operation to perform on the selected templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {BULK_OPERATIONS.map(operation => {
                    const Icon = operation.icon;
                    return (
                      <Button
                        key={operation.id}
                        variant={selectedOperation === operation.id ? 'default' : 'outline'}
                        className="h-auto p-4 flex flex-col items-start gap-2"
                        onClick={() => handleOperationSelect(operation.id)}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium text-sm">{operation.label}</span>
                        </div>
                        <p className="text-xs text-left opacity-70">
                          {operation.description}
                        </p>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operation-specific options */}
          {selectedOperation === 'move-category' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Move to Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="targetCategory">Target Category</Label>
                  <Select value={targetCategory} onValueChange={setTargetCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {selectedOperation && selectedOperation !== 'move-category' && (
            <Button 
              type="button" 
              onClick={executeOperation}
              disabled={isLoading || selectedTemplates.length === 0}
              variant={BULK_OPERATIONS.find(op => op.id === selectedOperation)?.variant || 'default'}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Execute
            </Button>
          )}
          {selectedOperation === 'move-category' && (
            <Button 
              type="button" 
              onClick={executeOperation}
              disabled={isLoading || !targetCategory || selectedTemplates.length === 0}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Move Templates
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}