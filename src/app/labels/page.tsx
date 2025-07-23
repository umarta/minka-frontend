'use client';

import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { LabelStats } from '@/components/labels/LabelStats';
import { LabelToolbar } from '@/components/labels/LabelToolbar';
import { LabelCard } from '@/components/labels/LabelCard';
import { LabelForm } from '@/components/labels/LabelForm';
import { useLabelStore } from '@/lib/stores/labels';
import { Label } from '@/types';
import { AlertCircle, Tags } from 'lucide-react';
import { toast } from 'sonner';

export default function LabelsPage() {
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [showSelection, setShowSelection] = useState(false);
  
  const {
    labels,
    selectedLabels,
    isLoading,
    error,
    fetchLabels,
    selectLabel,
    clearError,
  } = useLabelStore();

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const handleCreateLabel = () => {
    setEditingLabel(null);
    setShowLabelForm(true);
  };

  const handleEditLabel = (label: Label) => {
    setEditingLabel(label);
    setShowLabelForm(true);
  };

  const handleFormClose = () => {
    setShowLabelForm(false);
    setEditingLabel(null);
  };

  const handleToggleSelection = () => {
    setShowSelection(!showSelection);
    if (showSelection) {
      // Clear selection when hiding selection mode
      selectedLabels.forEach(id => selectLabel(id));
    }
  };

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Labels</h1>
            <p className="text-gray-600">
              Organize contacts and conversations with custom labels
            </p>
          </div>

          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearError();
                  fetchLabels();
                }}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Labels</h1>
          <p className="text-gray-600">
            Organize contacts and conversations with custom labels
          </p>
        </div>

        {/* Statistics */}
        <LabelStats />

        {/* Toolbar */}
        <LabelToolbar
          onCreateLabel={handleCreateLabel}
          showSelection={showSelection}
          onToggleSelection={handleToggleSelection}
        />

        {/* Labels Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : labels.length === 0 ? (
          <div className="text-center py-16">
            <Tags className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No Labels Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Create your first label to start organizing your contacts and conversations.
            </p>
            <Button onClick={handleCreateLabel}>
              Create Your First Label
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {labels.map((label) => (
              <LabelCard
                key={label.id}
                label={label}
                isSelected={selectedLabels.includes(label.id)}
                onSelect={selectLabel}
                onEdit={handleEditLabel}
                showSelection={showSelection}
              />
            ))}
          </div>
        )}

        {/* Label Form Modal */}
        <LabelForm
          open={showLabelForm}
          onOpenChange={handleFormClose}
          label={editingLabel}
          mode={editingLabel ? 'edit' : 'create'}
        />
      </div>
    </MainLayout>
  );
}