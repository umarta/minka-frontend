import { RevenueData } from '@/lib/stores/analytics';

interface RevenueChartProps {
  data: RevenueData[];
  isLoading: boolean;
}

export function RevenueChart({ data, isLoading }: RevenueChartProps) {
  if (isLoading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No revenue data available
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const maxOrders = Math.max(...data.map(d => d.orders));
  const chartHeight = 250;

  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="relative h-80">
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
                ${Math.round(maxRevenue * (1 - ratio) / 1000)}K
              </text>
            </g>
          ))}

          {/* Revenue bars */}
          {data.map((item, index) => {
            const barWidth = Math.max(1, (100 / data.length) - 2);
            const x = (index * 100) / data.length;
            const revenueHeight = (item.revenue / maxRevenue) * chartHeight;
            
            return (
              <rect
                key={index}
                x={`${x + 1}%`}
                y={chartHeight - revenueHeight}
                width={`${barWidth}%`}
                height={revenueHeight}
                fill="#10b981"
                opacity="0.8"
                rx="2"
                className="hover:opacity-100 transition-opacity cursor-pointer"
              />
            );
          })}

          {/* Orders line */}
          <path
            d={data.map((item, index) => {
              const x = ((index + 0.5) * 100) / data.length;
              const y = chartHeight - (item.orders / maxOrders) * chartHeight * 0.7; // Scale down orders line
              return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
            }).join(' ')}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Orders data points */}
          {data.map((item, index) => {
            const x = ((index + 0.5) * 100) / data.length;
            const y = chartHeight - (item.orders / maxOrders) * chartHeight * 0.7;
            return (
              <circle
                key={`order-${index}`}
                cx={`${x}%`}
                cy={y}
                r="3"
                fill="#f59e0b"
                className="hover:r-4 transition-all cursor-pointer"
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
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span className="text-gray-600">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-gray-600">Orders</span>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            ${data.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total Revenue</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {data.reduce((sum, item) => sum + item.orders, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total Orders</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            ${data.length > 0 ? (data.reduce((sum, item) => sum + item.avgOrderValue, 0) / data.length).toFixed(0) : '0'}
          </div>
          <div className="text-xs text-gray-500">Avg Order Value</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.conversion, 0) / data.length).toFixed(1) : '0'}%
          </div>
          <div className="text-xs text-gray-500">Avg Conversion</div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Best Performing Day</h4>
          {data.length > 0 && (() => {
            const bestDay = data.reduce((max, item) => item.revenue > max.revenue ? item : max, data[0]);
            return (
              <div className="text-sm text-green-700">
                <div className="font-semibold">{new Date(bestDay.date).toLocaleDateString()}</div>
                <div>${bestDay.revenue.toLocaleString()} revenue • {bestDay.orders} orders</div>
              </div>
            );
          })()}
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Growth Trend</h4>
          <div className="text-sm text-blue-700">
            {data.length >= 2 && (() => {
              const recent = data.slice(-7).reduce((sum, item) => sum + item.revenue, 0);
              const previous = data.slice(-14, -7).reduce((sum, item) => sum + item.revenue, 0);
              const growth = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
              
              return (
                <div>
                  <div className="font-semibold">
                    {growth >= 0 ? '↗️' : '↘️'} {Math.abs(growth).toFixed(1)}%
                  </div>
                  <div>vs previous period</div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
} 