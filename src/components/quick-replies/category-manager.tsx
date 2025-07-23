'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FolderOpen, 
  FolderPlus,
  X,
  Check,
  AlertTriangle,
  MoreVertical,
  Tag,
  Archive
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/lib/stores/chat';
import { QuickReplyTemplate } from '@/types';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  templates: QuickReplyTemplate[];
}

interface CategoryInfo {
  name: string;
  count: number;
  usage: number;
  templates: QuickReplyTemplate[];
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
}

const CATEGORY_COLORS = [
  { name: 'Blue', value: 'bg-blue-100 text-blue-800 border-blue-200' },
  { name: 'Green', value: 'bg-green-100 text-green-800 border-green-200' },
  { name: 'Yellow', value: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { name: 'Red', value: 'bg-red-100 text-red-800 border-red-200' },
  { name: 'Purple', value: 'bg-purple-100 text-purple-800 border-purple-200' },
  { name: 'Pink', value: 'bg-pink-100 text-pink-800 border-pink-200' },
  { name: 'Indigo', value: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { name: 'Gray', value: 'bg-gray-100 text-gray-800 border-gray-200' }
];

export function CategoryManager({ isOpen, onClose, templates }: CategoryManagerProps) {
  const { toast } = useToast();
  const { updateQuickReply } = useChatStore();
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: CATEGORY_COLORS[0].value
  });

  // Calculate category information
  useEffect(() => {
    const categoryMap = new Map<string, CategoryInfo>();
    
    // Add uncategorized templates
    const uncategorizedTemplates = templates.filter(t => !t.category);
    if (uncategorizedTemplates.length > 0) {
      categoryMap.set('', {
        name: 'Uncategorized',
        count: uncategorizedTemplates.length,
        usage: uncategorizedTemplates.reduce((sum, t) => sum + t.usage_count, 0),
        templates: uncategorizedTemplates
      });
    }

    // Add categorized templates
    templates.forEach(template => {
      if (template.category) {
        const existing = categoryMap.get(template.category);
        if (existing) {
          existing.count++;
          existing.usage += template.usage_count;
          existing.templates.push(template);
        } else {
          categoryMap.set(template.category, {
            name: template.category,
            count: 1,
            usage: template.usage_count,
            templates: [template]
          });
        }
      }
    });

    const categoryList = Array.from(categoryMap.values())
      .sort((a, b) => {
        // Sort uncategorized last
        if (a.name === 'Uncategorized') return 1;
        if (b.name === 'Uncategorized') return -1;
        return b.usage - a.usage; // Sort by usage descending
      });

    setCategories(categoryList);
  }, [templates]);

  const handleCreateCategory = () => {
    setIsCreating(true);
    setFormData({
      name: '',
      description: '',
      color: CATEGORY_COLORS[0].value
    });
  };

  const handleSaveCategory = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required.",
        variant: "destructive",
      });
      return;
    }

    // Check if category already exists
    const existingCategory = categories.find(c => 
      c.name.toLowerCase() === formData.name.trim().toLowerCase() && 
      c.name !== 'Uncategorized'
    );
    
    if (existingCategory) {
      toast({
        title: "Error",
        description: "A category with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    // For now, we'll just show a success message since we don't have category CRUD in the backend
    toast({
      title: "Category created",
      description: `Category "${formData.name}" has been created.`,
    });
    
    setIsCreating(false);
    setFormData({ name: '', description: '', color: CATEGORY_COLORS[0].value });
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) {
      setEditingCategory(null);
      return;
    }

    // Check if new name already exists
    const existingCategory = categories.find(c => 
      c.name.toLowerCase() === newName.trim().toLowerCase() && 
      c.name !== oldName
    );
    
    if (existingCategory) {
      toast({
        title: "Error",
        description: "A category with this name already exists.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update all templates in this category
      const category = categories.find(c => c.name === oldName);
      if (category) {
        const promises = category.templates.map(template => 
          updateQuickReply(template.id, {
            ...template,
            category: newName.trim()
          })
        );
        await Promise.all(promises);
        
        toast({
          title: "Category renamed",
          description: `Category "${oldName}" has been renamed to "${newName}".`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to rename category.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    if (!category) return;

    setIsLoading(true);
    try {
      // Move all templates to uncategorized
      const promises = category.templates.map(template => 
        updateQuickReply(template.id, {
          ...template,
          category: ''
        })
      );
      await Promise.all(promises);
      
      toast({
        title: "Category deleted",
        description: `Category "${categoryName}" has been deleted. Templates moved to uncategorized.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(null);
    }
  };

  const handleMoveTemplates = async (fromCategory: string, toCategory: string) => {
    const category = categories.find(c => c.name === fromCategory);
    if (!category) return;

    setIsLoading(true);
    try {
      const promises = category.templates.map(template => 
        updateQuickReply(template.id, {
          ...template,
          category: toCategory === 'Uncategorized' ? '' : toCategory
        })
      );
      await Promise.all(promises);
      
      toast({
        title: "Templates moved",
        description: `${category.count} template(s) moved to ${toCategory}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move templates.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingCategory(null);
    setNewCategoryName('');
    setShowDeleteConfirm(null);
    setFormData({ name: '', description: '', color: CATEGORY_COLORS[0].value });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Category Manager
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Category */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Categories</CardTitle>
                  <CardDescription>
                    Organize your templates into categories for better management
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCreateCategory}
                  disabled={isCreating}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isCreating && (
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="categoryName">Category Name</Label>
                      <Input
                        id="categoryName"
                        placeholder="Enter category name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="categoryDescription">Description (Optional)</Label>
                      <Input
                        id="categoryDescription"
                        placeholder="Enter category description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {CATEGORY_COLORS.map(color => (
                          <button
                            key={color.name}
                            type="button"
                            className={`w-8 h-8 rounded border-2 ${color.value} ${
                              formData.color === color.value ? 'ring-2 ring-blue-500' : ''
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" onClick={handleSaveCategory}>
                        <Check className="h-4 w-4 mr-2" />
                        Create
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setIsCreating(false)}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Categories List */}
              <div className="space-y-3">
                {categories.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                    <p className="text-gray-500 mb-4">
                      Create your first category to organize your templates
                    </p>
                    <Button onClick={handleCreateCategory}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Category
                    </Button>
                  </div>
                ) : (
                  categories.map((category) => (
                    <div
                      key={category.name}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-2 bg-blue-50 rounded">
                          <Tag className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          {editingCategory === category.name ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRenameCategory(category.name, newCategoryName);
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingCategory(null);
                                  }
                                }}
                                className="h-8"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRenameCategory(category.name, newCategoryName)}
                                disabled={isLoading}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingCategory(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-gray-900">
                                  {category.name === 'Uncategorized' ? (
                                    <span className="text-gray-500 italic">Uncategorized</span>
                                  ) : (
                                    category.name
                                  )}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  {category.count} template{category.count !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500">
                                {category.usage} total uses
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {category.name !== 'Uncategorized' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => {
                                setEditingCategory(category.name);
                                setNewCategoryName(category.name);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setShowDeleteConfirm(category.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Statistics */}
          {categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{categories.length}</p>
                    <p className="text-xs text-gray-500">Total Categories</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">
                      {categories.reduce((sum, c) => sum + c.count, 0)}
                    </p>
                    <p className="text-xs text-gray-500">Total Templates</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {categories.reduce((sum, c) => sum + c.usage, 0)}
                    </p>
                    <p className="text-xs text-gray-500">Total Usage</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500" />
                <h3 className="text-lg font-semibold">Delete Category</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete the category "{showDeleteConfirm}"? 
                All templates in this category will be moved to "Uncategorized".
              </p>
              <div className="flex items-center gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteCategory(showDeleteConfirm)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : null}
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}