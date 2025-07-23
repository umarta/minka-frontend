'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Copy, 
  BarChart3,
  Download,
  Upload,
  MoreVertical,
  Eye,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useChatStore } from '@/lib/stores/chat';
import { QuickReplyTemplate } from '@/types';
import { TemplateEditorModal } from '@/components/quick-replies/template-editor-modal';
import { BulkOperationsPanel } from '@/components/quick-replies/bulk-operations-panel';
import { UsageAnalytics } from '@/components/quick-replies/usage-analytics';
import { CategoryManager } from '@/components/quick-replies/category-manager';

interface FilterState {
  search: string;
  category: string;
  language: string;
  status: string;
  shared: string;
}

interface SortState {
  field: 'title' | 'usage_count' | 'created_at' | 'updated_at';
  direction: 'asc' | 'desc';
}

export default function QuickRepliesPage() {
  const { toast } = useToast();
  const { 
    quickReplyTemplates, 
    loadQuickReplyTemplates, 
    createQuickReply, 
    updateQuickReply, 
    deleteQuickReply,
    isLoadingQuickReplies 
  } = useChatStore();

  // State management
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    language: '',
    status: '',
    shared: ''
  });
  const [sort, setSort] = useState<SortState>({
    field: 'updated_at',
    direction: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [activeTab, setActiveTab] = useState('templates');
  
  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuickReplyTemplate | null>(null);
  const [isBulkPanelOpen, setIsBulkPanelOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Load templates on mount
  useEffect(() => {
    loadQuickReplyTemplates();
  }, [loadQuickReplyTemplates]);

  // Filter and sort templates
  const filteredTemplates = quickReplyTemplates
    .filter(template => {
      if (filters.search && !template.title.toLowerCase().includes(filters.search.toLowerCase()) && 
          !template.content.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.category && filters.category !== 'all' && template.category !== filters.category) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      const aValue = a[sort.field];
      const bValue = b[sort.field];
      const direction = sort.direction === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * direction;
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * direction;
      }
      return 0;
    });

  // Pagination
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const paginatedTemplates = filteredTemplates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique categories
  const categories = Array.from(new Set(quickReplyTemplates.map(t => t.category))).filter(Boolean);

  // Handlers
  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleEditTemplate = (template: QuickReplyTemplate) => {
    setEditingTemplate(template);
    setIsEditorOpen(true);
  };

  const handleDuplicateTemplate = async (template: QuickReplyTemplate) => {
    try {
      await createQuickReply({
        title: `${template.title} (Copy)`,
        content: template.content,
        category: template.category
      });
      toast({
        title: "Template duplicated",
        description: "Template has been successfully duplicated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate template.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (template: QuickReplyTemplate) => {
    if (confirm(`Are you sure you want to delete "${template.title}"?`)) {
      try {
        await deleteQuickReply(template.id);
        toast({
          title: "Template deleted",
          description: "Template has been successfully deleted.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete template.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSelectTemplate = (templateId: string, checked: boolean) => {
    if (checked) {
      setSelectedTemplates(prev => [...prev, templateId]);
    } else {
      setSelectedTemplates(prev => prev.filter(id => id !== templateId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTemplates(paginatedTemplates.map(t => t.id));
    } else {
      setSelectedTemplates([]);
    }
  };

  const handleSort = (field: SortState['field']) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quick Reply Templates</h1>
            <p className="text-gray-600">
              Manage your quick reply templates for efficient customer communication
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCategoryManagerOpen(true)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Categories
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsBulkPanelOpen(true)}
              disabled={selectedTemplates.length === 0}
            >
              <MoreVertical className="h-4 w-4 mr-2" />
              Bulk Actions ({selectedTemplates.length})
            </Button>
            <Button onClick={handleCreateTemplate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Template
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search templates..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={sort.field}
                    onValueChange={(value) => setSort(prev => ({ ...prev, field: value as SortState['field'] }))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="usage_count">Usage Count</SelectItem>
                      <SelectItem value="created_at">Created Date</SelectItem>
                      <SelectItem value="updated_at">Updated Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSort(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                  >
                    {sort.direction === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Templates Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedTemplates.length === paginatedTemplates.length && paginatedTemplates.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-gray-500">Select All</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingQuickReplies ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : paginatedTemplates.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                    <p className="text-gray-500 mb-4">
                      {filters.search || filters.category ? 'Try adjusting your filters' : 'Create your first quick reply template'}
                    </p>
                    {!filters.search && !filters.category && (
                      <Button onClick={handleCreateTemplate}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Template
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {paginatedTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Checkbox
                          checked={selectedTemplates.includes(template.id)}
                          onCheckedChange={(checked) => handleSelectTemplate(template.id, checked as boolean)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900 truncate">{template.title}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{template.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              {template.usage_count} uses
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(template.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditTemplate(template)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicateTemplate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicateTemplate(template)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTemplate(template)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTemplates.length)} of {filteredTemplates.length} templates
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-500">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <UsageAnalytics templates={quickReplyTemplates} />
          </TabsContent>
        </Tabs>

        {/* Modals */}
        <TemplateEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          template={editingTemplate}
          categories={categories}
        />

        <BulkOperationsPanel
          isOpen={isBulkPanelOpen}
          onClose={() => setIsBulkPanelOpen(false)}
          selectedTemplates={selectedTemplates}
          templates={quickReplyTemplates}
          onSelectionChange={setSelectedTemplates}
        />

        <CategoryManager
          isOpen={isCategoryManagerOpen}
          onClose={() => setIsCategoryManagerOpen(false)}
          templates={quickReplyTemplates}
        />
      </div>
    </MainLayout>
  );
}