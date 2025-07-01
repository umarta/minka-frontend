import { CustomerSatisfactionData } from '@/lib/stores/analytics';
import { Star } from 'lucide-react';

interface CustomerSatisfactionChartProps {
  data: CustomerSatisfactionData[];
  isLoading: boolean;
}

export function CustomerSatisfactionChart({ data, isLoading }: CustomerSatisfactionChartProps) {
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
        No customer satisfaction data available
      </div>
    );
  }

  // Calculate average ratings from all data
  const totalRatings = data.reduce((acc, item) => ({
    excellent: acc.excellent + item.ratings.excellent,
    good: acc.good + item.ratings.good,
    average: acc.average + item.ratings.average,
    poor: acc.poor + item.ratings.poor,
    terrible: acc.terrible + item.ratings.terrible,
  }), { excellent: 0, good: 0, average: 0, poor: 0, terrible: 0 });

  const totalResponses = Object.values(totalRatings).reduce((sum, count) => sum + count, 0);
  const avgScore = data.length > 0 ? data.reduce((sum, item) => sum + item.score, 0) / data.length : 0;

  const ratingTypes = [
    { label: 'Excellent', count: totalRatings.excellent, color: 'bg-green-500', stars: 5 },
    { label: 'Good', count: totalRatings.good, color: 'bg-green-400', stars: 4 },
    { label: 'Average', count: totalRatings.average, color: 'bg-yellow-500', stars: 3 },
    { label: 'Poor', count: totalRatings.poor, color: 'bg-orange-500', stars: 2 },
    { label: 'Terrible', count: totalRatings.terrible, color: 'bg-red-500', stars: 1 },
  ];

  const chartHeight = 120;

  return (
    <div className="space-y-6">
      {/* Score Trend Line Chart */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Satisfaction Score Trend</h4>
        <div className="relative h-24">
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
                  {(5 * (1 - ratio)).toFixed(1)}
                </text>
              </g>
            ))}

            {/* Trend line */}
            <path
              d={data.map((item, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = chartHeight - (item.score / 5) * chartHeight;
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = chartHeight - (item.score / 5) * chartHeight;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="1"
                  fill="#10b981"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Rating Distribution</h4>
        <div className="space-y-2">
          {ratingTypes.map((rating) => {
            const percentage = totalResponses > 0 ? (rating.count / totalResponses) * 100 : 0;
            
            return (
              <div key={rating.label} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < rating.stars
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">{rating.label}</span>
                    <span className="text-gray-900">{rating.count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`${rating.color} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
            {avgScore.toFixed(1)}
            <Star className="h-5 w-5 text-yellow-400 fill-current" />
          </div>
          <div className="text-xs text-gray-500">Average Score</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {totalResponses.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total Responses</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {totalResponses > 0 ? ((totalRatings.excellent + totalRatings.good) / totalResponses * 100).toFixed(1) : '0'}%
          </div>
          <div className="text-xs text-gray-500">Satisfied Customers</div>
        </div>
      </div>
    </div>
  );
} 