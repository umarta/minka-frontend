'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label as LabelType } from '@/types';
import { useLabelStore } from '@/lib/stores/labels';
import { toast } from 'sonner';

interface LabelFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: LabelType | null;
  mode: 'create' | 'edit';
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#6b7280', // gray
];

export function LabelForm({ open, onOpenChange, label, mode }: LabelFormProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { createLabel, updateLabel, isCreating, isUpdating } = useLabelStore();
  
  const isLoading = isCreating || isUpdating;

  useEffect(() => {
    if (label && mode === 'edit') {
      setName(label.name);
      setColor(label.color);
      setDescription(label.description || '');
    } else {
      setName('');
      setColor('#3b82f6');
      setDescription('');
    }
    setErrors({});
  }, [label, mode, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Label name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Label name must be at least 2 characters';
    }
    
    if (!color) {
      newErrors.color = 'Color is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const data = {
        name: name.trim(),
        color,
        description: description.trim() || undefined,
      };

      if (mode === 'create') {
        await createLabel(data);
        toast.success('Label created successfully');
      } else if (label) {
        await updateLabel(label.id, data);
        toast.success('Label updated successfully');
      }
      
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save label');
    }
  };

  const handleColorSelect = (selectedColor: string) => {
    setColor(selectedColor);
    if (errors.color) {
      setErrors(prev => ({ ...prev, color: '' }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create New Label' : 'Edit Label'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a new label to organize your contacts and conversations.'
              : 'Update the label information.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors(prev => ({ ...prev, name: '' }));
                }
              }}
              placeholder="Enter label name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Color *</Label>
            <div className="space-y-3">
              <div className="grid grid-cols-9 gap-2">
                {PRESET_COLORS.map((presetColor) => (
                  <button
                    key={presetColor}
                    type="button"
                    onClick={() => handleColorSelect(presetColor)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      color === presetColor
                        ? 'border-gray-900 scale-110'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    style={{ backgroundColor: presetColor }}
                    title={presetColor}
                  />
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <Input
                  type="color"
                  value={color}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  className="w-16 h-8 p-1 border rounded"
                />
                <Input
                  type="text"
                  value={color}
                  onChange={(e) => handleColorSelect(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-600">Preview</span>
              </div>
            </div>
            {errors.color && (
              <p className="text-sm text-red-500">{errors.color}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this label"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Updating...'
                : mode === 'create'
                ? 'Create Label'
                : 'Update Label'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}