'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Palette, 
  Check, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  AgentGroup,
  CreateGroupRequest,
  UpdateGroupRequest,
  GROUP_COLORS,
  GroupModalProps,
} from '@/types/agent-groups';

interface FormData {
  name: string;
  description: string;
  color: string;
}

interface FormErrors {
  name?: string;
  description?: string;
  color?: string;
  general?: string;
}

export function AgentGroupModal({
  isOpen,
  onClose,
  group,
  onSave,
}: GroupModalProps) {
  const isEditing = !!group;
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    color: GROUP_COLORS[0],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidatingName, setIsValidatingName] = useState(false);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (group) {
        setFormData({
          name: group.name,
          description: group.description || '',
          color: group.color,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          color: GROUP_COLORS[0],
        });
      }
      setErrors({});
    }
  }, [isOpen, group]);

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Group name must be at least 3 characters long';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Group name cannot exceed 50 characters';
    }

    // Description validation (optional but with limits)
    if (formData.description.length > 200) {
      newErrors.description = 'Description cannot exceed 200 characters';
    }

    // Color validation
    if (!GROUP_COLORS.includes(formData.color as any)) {
      newErrors.color = 'Please select a valid color';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const requestData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
      };

      if (isEditing) {
        await onSave(requestData as UpdateGroupRequest);
      } else {
        await onSave(requestData as CreateGroupRequest);
      }
      
      onClose();
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to save group',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle color selection
  const handleColorSelect = (color: string) => {
    handleInputChange('color', color);
  };

  // Get character count styling
  const getCharCountStyle = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 90) return 'text-red-500';
    if (percentage >= 75) return 'text-yellow-500';
    return 'text-gray-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {isEditing ? 'Edit Group' : 'Create New Group'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error Alert */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="group-name" className="text-sm font-medium">
              Group Name *
            </Label>
            <Input
              id="group-name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter group name"
              className={errors.name ? 'border-red-500' : ''}
              maxLength={50}
            />
            <div className="flex justify-between items-center">
              {errors.name && (
                <span className="text-sm text-red-500">{errors.name}</span>
              )}
              <span className={`text-xs ml-auto ${getCharCountStyle(formData.name.length, 50)}`}>
                {formData.name.length}/50
              </span>
            </div>
          </div>

          {/* Group Description */}
          <div className="space-y-2">
            <Label htmlFor="group-description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="group-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter group description (optional)"
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
              maxLength={200}
            />
            <div className="flex justify-between items-center">
              {errors.description && (
                <span className="text-sm text-red-500">{errors.description}</span>
              )}
              <span className={`text-xs ml-auto ${getCharCountStyle(formData.description.length, 200)}`}>
                {formData.description.length}/200
              </span>
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Group Color
            </Label>
            <div className="grid grid-cols-5 gap-3">
              {GROUP_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`
                    relative w-12 h-12 rounded-lg border-2 transition-all
                    hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${formData.color === color 
                      ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                  style={{ backgroundColor: color }}
                  title={`Select ${color}`}
                >
                  {formData.color === color && (
                    <Check className="h-5 w-5 text-white absolute inset-0 m-auto drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
            {errors.color && (
              <span className="text-sm text-red-500">{errors.color}</span>
            )}
          </div>

          {/* Preview Section */}
          {formData.name && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Preview</Label>
              <div 
                className="p-3 rounded-lg border-l-4 bg-gray-50"
                style={{ borderLeftColor: formData.color }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{formData.name}</h4>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: formData.color }}
                  />
                </div>
                {formData.description && (
                  <p className="text-sm text-gray-600">{formData.description}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    0 members
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </form>

        <DialogFooter className="gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Group' : 'Create Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Quick create button component
export function CreateGroupButton({ 
  onClick, 
  className = '' 
}: { 
  onClick: () => void; 
  className?: string; 
}) {
  return (
    <Button 
      onClick={onClick}
      className={`flex items-center gap-2 ${className}`}
    >
      <Users className="h-4 w-4" />
      Create Group
    </Button>
  );
}