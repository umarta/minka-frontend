import React from 'react';
import { Tag } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  color: string;
  description?: string;
}

interface LabelBadgeDisplayProps {
  labels: Label[];
  maxVisible?: number;
  size?: 'sm' | 'md';
  showTooltip?: boolean;
  className?: string;
}

export const LabelBadgeDisplay: React.FC<LabelBadgeDisplayProps> = ({
  labels,
  maxVisible = 3,
  size = 'sm',
  showTooltip = true,
  className = '',
}) => {
  if (!labels || labels.length === 0) {
    return null;
  }

  const visibleLabels = labels.slice(0, maxVisible);
  const hiddenCount = Math.max(0, labels.length - maxVisible);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 h-5',
    md: 'text-sm px-3 py-1 h-6',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {visibleLabels.map((label, index) => (
        <div
          key={`label-${label.id || label.name}-${index}`}
          className={`inline-flex items-center space-x-1 rounded-full font-medium text-white ${sizeClasses[size]}`}
          style={{ backgroundColor: label.color }}
          title={showTooltip ? `${label.name}${label.description ? `: ${label.description}` : ''}` : undefined}
        >
          <Tag className={iconSizes[size]} />
          <span className="truncate max-w-20">{label.name}</span>
        </div>
      ))}
      
      {hiddenCount > 0 && (
        <div
          className={`inline-flex items-center rounded-full bg-gray-500 text-white font-medium ${sizeClasses[size]}`}
          title={showTooltip ? `${hiddenCount} more label${hiddenCount !== 1 ? 's' : ''}: ${labels.slice(maxVisible).map(l => l.name).join(', ')}` : undefined}
        >
          <span>+{hiddenCount}</span>
        </div>
      )}
    </div>
  );
};

// Simplified version for inline display with label names
export const LabelBadgeInline: React.FC<{
  labels: Label[];
  maxVisible?: number;
  showNames?: boolean;
}> = ({ labels, maxVisible = 2, showNames = true }) => {
  if (!labels || labels.length === 0) {
    return null;
  }

  const visibleLabels = labels.slice(0, maxVisible);
  const hiddenCount = Math.max(0, labels.length - maxVisible);

  if (showNames) {
    return (
      <div className="flex items-center flex-wrap gap-1">
        {visibleLabels.map((label, index) => (
          <div
            key={`label-inline-${label.id || label.name}-${index}`}
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
            style={{ backgroundColor: label.color }}
            title={label.description || label.name}
          >
            {label.name}
          </div>
        ))}
        {hiddenCount > 0 && (
          <div
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500 text-white"
            title={`${hiddenCount} more labels: ${labels.slice(maxVisible).map(l => l.name).join(', ')}`}
          >
            +{hiddenCount}
          </div>
        )}
      </div>
    );
  }

  // Fallback to dots if showNames is false
  return (
    <div className="flex items-center space-x-1">
      {visibleLabels.map((label, index) => (
        <div
          key={`label-dot-${label.id || label.name}-${index}`}
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: label.color }}
          title={label.name}
        />
      ))}
      {hiddenCount > 0 && (
        <span className="text-xs text-gray-400" title={`${hiddenCount} more labels`}>
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};

export default LabelBadgeDisplay;