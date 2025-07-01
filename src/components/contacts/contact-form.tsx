'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Plus, Upload } from 'lucide-react';
import { Contact, ContactForm as ContactFormData, Label as ContactLabel } from '@/types';
import { useContactStore } from '@/lib/stores/contact';

interface ContactFormProps {
  contact?: Contact | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ContactForm({ contact, onSuccess, onCancel }: ContactFormProps) {
  const { createContact, updateContact, labels, fetchLabels, createLabel } = useContactStore();
  
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    phone: '',
    email: '',
    notes: '',
    label_ids: [],
  });
  
  const [selectedLabels, setSelectedLabels] = useState<ContactLabel[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewLabel, setShowNewLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  useEffect(() => {
    if (contact) {
      setFormData({
        name: contact.name,
        phone: contact.phone,
        email: contact.email || '',
        notes: contact.notes || '',
        label_ids: contact.labels?.map(l => l.id) || [],
      });
      setSelectedLabels(contact.labels || []);
    }
  }, [contact]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (contact) {
        await updateContact(contact.id, formData);
      } else {
        await createContact(formData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Failed to save contact:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLabelToggle = (label: ContactLabel) => {
    const isSelected = selectedLabels.find(l => l.id === label.id);
    
    if (isSelected) {
      const newLabels = selectedLabels.filter(l => l.id !== label.id);
      setSelectedLabels(newLabels);
      setFormData({
        ...formData,
        label_ids: newLabels.map(l => l.id),
      });
    } else {
      const newLabels = [...selectedLabels, label];
      setSelectedLabels(newLabels);
      setFormData({
        ...formData,
        label_ids: newLabels.map(l => l.id),
      });
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) return;
    
    try {
      await createLabel({
        name: newLabelName,
        color: newLabelColor,
      });
      
      setNewLabelName('');
      setNewLabelColor('#3b82f6');
      setShowNewLabel(false);
    } catch (error) {
      console.error('Failed to create label:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={contact?.avatar_url} />
              <AvatarFallback className="bg-gray-200 text-gray-700">
                {formData.name ? getInitials(formData.name) : '?'}
              </AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter full name"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1234567890"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this contact..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Labels */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Labels</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewLabel(!showNewLabel)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Label
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Labels */}
          {selectedLabels.length > 0 && (
            <div>
              <Label>Selected Labels</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedLabels.map((label) => (
                  <Badge
                    key={label.id}
                    variant="secondary"
                    className="cursor-pointer"
                    style={{ backgroundColor: label.color + '20', color: label.color }}
                    onClick={() => handleLabelToggle(label)}
                  >
                    {label.name}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Create New Label */}
          {showNewLabel && (
            <div className="p-3 border rounded-lg space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Label name"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  className="flex-1"
                />
                <input
                  type="color"
                  value={newLabelColor}
                  onChange={(e) => setNewLabelColor(e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateLabel}
                  disabled={!newLabelName.trim()}
                >
                  Create
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewLabel(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Available Labels */}
          <div>
            <Label>Available Labels</Label>
            <div className="grid grid-cols-2 gap-2 mt-2 max-h-32 overflow-y-auto">
              {labels
                .filter(label => !selectedLabels.find(l => l.id === label.id))
                .map((label) => (
                  <div
                    key={label.id}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    onClick={() => handleLabelToggle(label)}
                  >
                    <Checkbox
                      checked={selectedLabels.find(l => l.id === label.id) !== undefined}
                      onChange={() => handleLabelToggle(label)}
                    />
                    <Badge
                      variant="outline"
                      style={{ borderColor: label.color, color: label.color }}
                    >
                      {label.name}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
        </Button>
      </div>
    </form>
  );
} 