import { MessageVolumeData } from '@/lib/stores/analytics';

interface MessageVolumeChartProps {
  data: MessageVolumeData[];
  isLoading: boolean;
}

export function MessageVolumeChart({ data, isLoading }: MessageVolumeChartProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No message volume data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.total));
  const chartHeight = 200;

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative h-64">
        <svg width="100%" height={chartHeight} className="overflow-visible">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line
                x1="0"
                y1={chartHeight * ratio}
                x2="100%"
                y2={chartHeight * ratio}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x="-8"
                y={chartHeight * ratio + 4}
                fontSize="12"
                fill="#6b7280"
                textAnchor="end"
              >
                {Math.round(maxValue * (1 - ratio))}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((item, index) => {
            const barWidth = Math.max(1, (100 / data.length) - 1);
            const x = (index * 100) / data.length;
            const incomingHeight = (item.incoming / maxValue) * chartHeight;
            const outgoingHeight = (item.outgoing / maxValue) * chartHeight;
            
            return (
              <g key={index}>
                {/* Incoming messages */}
                <rect
                  x={`${x}%`}
                  y={chartHeight - incomingHeight}
                  width={`${barWidth}%`}
                  height={incomingHeight}
                  fill="#3b82f6"
                  opacity="0.8"
                  rx="2"
                />
                
                {/* Outgoing messages */}
                <rect
                  x={`${x + barWidth * 0.5}%`}
                  y={chartHeight - outgoingHeight}
                  width={`${barWidth * 0.5}%`}
                  height={outgoingHeight}
                  fill="#10b981"
                  opacity="0.8"
                  rx="2"
                />
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {data.map((item, index) => {
            // Show only every nth label to avoid crowding
            const showLabel = data.length <= 7 || index % Math.ceil(data.length / 7) === 0;
            return (
              <span key={index} className={showLabel ? '' : 'invisible'}>
                {new Date(item.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Incoming Messages</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Outgoing Messages</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total Messages</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            {data.reduce((sum, item) => sum + item.incoming, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Incoming</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {data.reduce((sum, item) => sum + item.outgoing, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Outgoing</div>
        </div>
      </div>
    </div>
  );
} 