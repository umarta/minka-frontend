'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, Tag, Shield } from 'lucide-react';
import { Label } from '@/types';
import { useLabelStore } from '@/lib/stores/labels';
import { toast } from 'sonner';

interface LabelCardProps {
  label: Label;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (label: Label) => void;
  showSelection?: boolean;
}

export function LabelCard({ 
  label, 
  isSelected, 
  onSelect, 
  onEdit, 
  showSelection = false 
}: LabelCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { deleteLabel, isDeleting } = useLabelStore();
  
  // Check if this is a system label (basic check)
  const isSystemLabel = label.name.toLowerCase().includes('urgent') || 
                       label.name.toLowerCase().includes('high') ||
                       label.name.toLowerCase().includes('medium') ||
                       label.name.toLowerCase().includes('low') ||
                       label.name.toLowerCase().includes('important');

  const handleDelete = async () => {
    try {
      await deleteLabel(label.id);
      toast.success('Label deleted successfully');
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete label');
    }
  };

  const getTextColor = (backgroundColor: string) => {
    // Convert hex to RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  return (
    <>
      <Card className={`transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 flex-1">
              {showSelection && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onSelect(label.id)}
                  className="mt-1"
                />
              )}
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: label.color }}
                  />
                  <h3 className="font-medium text-sm truncate">{label.name}</h3>
                  {isSystemLabel && (
                    <Shield className="h-3 w-3 text-gray-500" />
                  )}
                </div>
                
                {label.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {label.description}
                  </p>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(label)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {!isSystemLabel && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <Badge
              variant="secondary"
              style={{
                backgroundColor: label.color,
                color: getTextColor(label.color),
                border: 'none'
              }}
              className="text-xs"
            >
              <Tag className="h-3 w-3 mr-1" />
              {label.name}
            </Badge>
            
            <div className="text-right">
              <div className="text-xs text-gray-500">Usage</div>
              <div className="text-sm font-medium">0</div>
            </div>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            Created {new Date(label.created_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Label</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the label &quot;{label.name}&quot;? This action cannot be undone.
              The label will be removed from all contacts and conversations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}