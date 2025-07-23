import React from 'react';
import { Clock, Bot, CheckCircle, AlertCircle } from 'lucide-react';

type ConversationStatus = 'need_reply' | 'automated' | 'completed' | 'pending' | 'active' | 'resolved' | 'closed' | 'archived';

interface ConversationStatusIndicatorProps {
  status: ConversationStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
  onClick?: () => void;
}

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const statusConfigs: Record<ConversationStatus, StatusConfig> = {
  need_reply: {
    label: 'Need Reply',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: AlertCircle,
    description: 'Customer message requires response',
  },
  automated: {
    label: 'Automated',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    icon: Bot,
    description: 'Handled by automation or bot',
  },
  completed: {
    label: 'Completed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    description: 'Conversation resolved and closed',
  },
  pending: {
    label: 'Pending',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    icon: Clock,
    description: 'Waiting for customer response',
  },
  active: {
    label: 'Active',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    icon: AlertCircle,
    description: 'Active conversation requiring attention',
  },
  resolved: {
    label: 'Resolved',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    icon: CheckCircle,
    description: 'Issue resolved, conversation completed',
  },
  closed: {
    label: 'Closed',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: CheckCircle,
    description: 'Conversation closed',
  },
  archived: {
    label: 'Archived',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    icon: CheckCircle,
    description: 'Conversation archived',
  },
};

export const ConversationStatusIndicator: React.FC<ConversationStatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
  showTooltip = true,
  className = '',
  onClick,
}) => {
  const config = statusConfigs[status] || statusConfigs.pending;
  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      dot: 'w-2 h-2',
      icon: 'w-3 h-3',
      text: 'text-xs',
      padding: 'px-2 py-0.5',
    },
    md: {
      dot: 'w-3 h-3',
      icon: 'w-4 h-4',
      text: 'text-sm',
      padding: 'px-3 py-1',
    },
    lg: {
      dot: 'w-4 h-4',
      icon: 'w-5 h-5',
      text: 'text-base',
      padding: 'px-4 py-2',
    },
  };

  const sizes = sizeClasses[size];

  if (showLabel) {
    return (
      <div
        className={`inline-flex items-center space-x-2 rounded-full ${config.bgColor} ${sizes.padding} ${className} ${
          onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
        }`}
        title={showTooltip ? config.description : undefined}
        onClick={onClick}
      >
        <Icon className={`${sizes.icon} ${config.color}`} />
        <span className={`font-medium ${config.color} ${sizes.text}`}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center ${className} ${
        onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
      }`}
      title={showTooltip ? `${config.label}: ${config.description}` : undefined}
      onClick={onClick}
    >
      <div className={`rounded-full ${config.bgColor} p-1`}>
        <Icon className={`${sizes.icon} ${config.color}`} />
      </div>
    </div>
  );
};

// Simple dot indicator for compact display
export const ConversationStatusDot: React.FC<{
  status: ConversationStatus;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}> = ({ status, size = 'md', showTooltip = true, className = '' }) => {
  const config = statusConfigs[status] || statusConfigs.pending;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  // Convert color classes to actual colors for the dot
  const dotColors: Record<string, string> = {
    'text-red-600': '#dc2626',
    'text-blue-600': '#2563eb',
    'text-green-600': '#16a34a',
    'text-yellow-600': '#ca8a04',
    'text-gray-600': '#4b5563',
  };

  return (
    <div
      className={`rounded-full ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: dotColors[config.color] || '#4b5563' }}
      title={showTooltip ? `${config.label}: ${config.description}` : undefined}
    />
  );
};

// Status dropdown for changing status
export const ConversationStatusDropdown: React.FC<{
  currentStatus: ConversationStatus;
  onStatusChange: (status: ConversationStatus) => void;
  disabled?: boolean;
}> = ({ currentStatus, onStatusChange, disabled = false }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentConfig = statusConfigs[currentStatus] || statusConfigs.pending;

  const availableStatuses: ConversationStatus[] = [
    'need_reply',
    'automated', 
    'completed',
    'pending',
  ];

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:opacity-80 cursor-pointer'
        } ${currentConfig.bgColor} ${currentConfig.color}`}
      >
        <currentConfig.icon className="w-4 h-4" />
        <span>{currentConfig.label}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            {availableStatuses.map((status) => {
              const config = statusConfigs[status];
              const Icon = config.icon;
              return (
                <button
                  key={status}
                  onClick={() => {
                    onStatusChange(status);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors ${
                    status === currentStatus ? 'bg-blue-50' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <div>
                    <div className={`font-medium ${config.color}`}>
                      {config.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {config.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ConversationStatusIndicator;