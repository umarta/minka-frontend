import { ResponseTimeData } from '@/lib/stores/analytics';

interface ResponseTimeChartProps {
  data: ResponseTimeData[];
  isLoading: boolean;
}

export function ResponseTimeChart({ data, isLoading }: ResponseTimeChartProps) {
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
        No response time data available
      </div>
    );
  }

  const maxTime = Math.max(...data.map(d => Math.max(d.avgResponseTime, d.firstResponseTime)));
  const chartHeight = 200;

  // Generate path for average response time line
  const avgPath = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = chartHeight - (item.avgResponseTime / maxTime) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Generate path for first response time line
  const firstPath = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = chartHeight - (item.firstResponseTime / maxTime) * chartHeight;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative h-64">
        <svg width="100%" height={chartHeight} className="overflow-visible" viewBox={`0 0 100 ${chartHeight}`}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <g key={i}>
              <line
                x1="0"
                y1={chartHeight * ratio}
                x2="100"
                y2={chartHeight * ratio}
                stroke="#e5e7eb"
                strokeWidth="0.5"
                strokeDasharray="1,1"
              />
              <text
                x="-2"
                y={chartHeight * ratio + 1}
                fontSize="3"
                fill="#6b7280"
                textAnchor="end"
              >
                {(maxTime * (1 - ratio)).toFixed(1)}m
              </text>
            </g>
          ))}

          {/* Average response time line */}
          <path
            d={avgPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* First response time line */}
          <path
            d={firstPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="3,3"
          />

          {/* Data points for average response time */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = chartHeight - (item.avgResponseTime / maxTime) * chartHeight;
            return (
              <circle
                key={`avg-${index}`}
                cx={x}
                cy={y}
                r="1"
                fill="#3b82f6"
              />
            );
          })}

          {/* Data points for first response time */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = chartHeight - (item.firstResponseTime / maxTime) * chartHeight;
            return (
              <circle
                key={`first-${index}`}
                cx={x}
                cy={y}
                r="1"
                fill="#f59e0b"
              />
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
          <div className="w-3 h-0.5 bg-blue-500 rounded"></div>
          <span className="text-gray-600">Average Response Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-yellow-500 rounded border-dashed border border-yellow-500"></div>
          <span className="text-gray-600">First Response Time</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.avgResponseTime, 0) / data.length).toFixed(1) : '0'}m
          </div>
          <div className="text-xs text-gray-500">Avg Response</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-yellow-600">
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.firstResponseTime, 0) / data.length).toFixed(1) : '0'}m
          </div>
          <div className="text-xs text-gray-500">Avg First Response</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.slaCompliance, 0) / data.length).toFixed(1) : '0'}%
          </div>
          <div className="text-xs text-gray-500">SLA Compliance</div>
        </div>
      </div>
    </div>
  );
} 