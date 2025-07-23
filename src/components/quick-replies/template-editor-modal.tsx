'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { 
  Save, 
  X, 
  Plus, 
  Eye, 
  Code, 
  Type, 
  Hash, 
  Calendar,
  User,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/lib/stores/chat';
import { QuickReplyTemplate } from '@/types';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: QuickReplyTemplate | null;
  categories: string[];
}

interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'select';
  required: boolean;
  defaultValue?: string;
  options?: string[];
}

interface FormData {
  title: string;
  content: string;
  category: string;
  newCategory: string;
  language: string;
  isShared: boolean;
  tags: string[];
  variables: TemplateVariable[];
}

const VARIABLE_TYPES = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Select', icon: MessageSquare }
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'ar', label: 'Arabic' }
];

export function TemplateEditorModal({ isOpen, onClose, template, categories }: TemplateEditorModalProps) {
  const { toast } = useToast();
  const { createQuickReply, updateQuickReply } = useChatStore();
  const [activeTab, setActiveTab] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    category: '',
    newCategory: '',
    language: 'en',
    isShared: false,
    tags: [],
    variables: []
  });

  // Initialize form data when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title,
        content: template.content,
        category: template.category || '',
        newCategory: '',
        language: 'en', // Default since not in current interface
        isShared: false, // Default since not in current interface
        tags: [], // Default since not in current interface
        variables: [] // Default since not in current interface
      });
    } else {
      setFormData({
        title: '',
        content: '',
        category: '',
        newCategory: '',
        language: 'en',
        isShared: false,
        tags: [],
        variables: []
      });
    }
  }, [template]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('basic');
      setPreviewMode(false);
      setNewTag('');
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleAddVariable = () => {
    const newVariable: TemplateVariable = {
      name: '',
      type: 'text',
      required: false,
      defaultValue: ''
    };
    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, newVariable]
    }));
  };

  const handleUpdateVariable = (index: number, field: keyof TemplateVariable, value: any) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.map((variable, i) => 
        i === index ? { ...variable, [field]: value } : variable
      )
    }));
  };

  const handleRemoveVariable = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter((_, i) => i !== index)
    }));
  };

  const insertVariable = (variableName: string) => {
    const cursorPosition = document.querySelector('textarea')?.selectionStart || 0;
    const textBefore = formData.content.substring(0, cursorPosition);
    const textAfter = formData.content.substring(cursorPosition);
    const newContent = `${textBefore}{{${variableName}}}${textAfter}`;
    setFormData(prev => ({ ...prev, content: newContent }));
  };

  const renderPreview = () => {
    let previewContent = formData.content;
    formData.variables.forEach(variable => {
      const placeholder = variable.defaultValue || `[${variable.name}]`;
      previewContent = previewContent.replace(
        new RegExp(`{{${variable.name}}}`, 'g'),
        placeholder
      );
    });
    return previewContent;
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Template title is required.",
        variant: "destructive",
      });
      return false;
    }
    if (!formData.content.trim()) {
      toast({
        title: "Validation Error",
        description: "Template content is required.",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const category = formData.newCategory.trim() || (formData.category === 'none' ? '' : formData.category);
      const templateData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: category
      };

      if (template) {
        await updateQuickReply(template.id, templateData);
        toast({
          title: "Template updated",
          description: "Template has been successfully updated.",
        });
      } else {
        await createQuickReply(templateData);
        toast({
          title: "Template created",
          description: "Template has been successfully created.",
        });
      }
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: template ? "Failed to update template." : "Failed to create template.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            {template ? 'Edit Template' : 'Create New Template'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="content">Content &amp; Variables</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Template Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter template title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => handleInputChange('language', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
              <div className="space-y-2">
                <Label htmlFor="newCategory">Or Create New Category</Label>
                <Input
                  id="newCategory"
                  placeholder="Enter new category name"
                  value={formData.newCategory}
                  onChange={(e) => handleInputChange('newCategory', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="content">Template Content *</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? <Code className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {previewMode ? 'Edit' : 'Preview'}
                </Button>
              </div>
            </div>

            {previewMode ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border">
                    {renderPreview() || 'No content to preview'}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Textarea
                id="content"
                placeholder="Enter your template content here...\n\nUse {{variable_name}} to insert variables"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={8}
              />
            )}

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm">Variables</CardTitle>
                    <CardDescription>
                      Define variables that can be dynamically replaced in your template
                    </CardDescription>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddVariable}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Variable
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.variables.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No variables defined. Click "Add Variable" to create one.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.variables.map((variable, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded">
                        <div className="flex-1 grid grid-cols-4 gap-2">
                          <Input
                            placeholder="Variable name"
                            value={variable.name}
                            onChange={(e) => handleUpdateVariable(index, 'name', e.target.value)}
                          />
                          <Select
                            value={variable.type}
                            onValueChange={(value) => handleUpdateVariable(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {VARIABLE_TYPES.map(type => {
                                const Icon = type.icon;
                                return (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-4 w-4" />
                                      {type.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Default value"
                            value={variable.defaultValue || ''}
                            onChange={(e) => handleUpdateVariable(index, 'defaultValue', e.target.value)}
                          />
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={variable.required}
                              onCheckedChange={(checked) => handleUpdateVariable(index, 'required', checked)}
                            />
                            <span className="text-xs">Required</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => insertVariable(variable.name)}
                            disabled={!variable.name}
                          >
                            Insert
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveVariable(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sharing &amp; Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isShared">Share with team</Label>
                    <p className="text-xs text-gray-500">
                      Allow other team members to use this template
                    </p>
                  </div>
                  <Switch
                    id="isShared"
                    checked={formData.isShared}
                    onCheckedChange={(checked) => handleInputChange('isShared', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Template Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {template ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label>Usage Count</Label>
                      <p className="text-lg font-semibold">{template.usage_count}</p>
                    </div>
                    <div>
                      <Label>Created</Label>
                      <p>{new Date(template.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label>Last Updated</Label>
                      <p>{new Date(template.updated_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label>Admin ID</Label>
                      <p>{template.admin_id}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Statistics will be available after creating the template.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}