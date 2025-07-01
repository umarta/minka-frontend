import { AgentPerformanceData } from '@/lib/stores/analytics';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface AgentPerformanceChartProps {
  data: AgentPerformanceData[];
  isLoading: boolean;
}

export function AgentPerformanceChart({ data, isLoading }: AgentPerformanceChartProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4">
            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-6 bg-gray-200 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No agent performance data available
      </div>
    );
  }

  // Sort agents by overall performance score
  const sortedAgents = [...data].sort((a, b) => {
    const scoreA = (a.messagesHandled * 0.3) + (a.customerSatisfaction * 20) + (a.ticketsResolved * 2) - (a.avgResponseTime * 5);
    const scoreB = (b.messagesHandled * 0.3) + (b.customerSatisfaction * 20) + (b.ticketsResolved * 2) - (b.avgResponseTime * 5);
    return scoreB - scoreA;
  });

  const maxMessages = Math.max(...data.map(d => d.messagesHandled));

  const getPerformanceColor = (score: number) => {
    if (score >= 4.0) return 'text-green-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score: number) => {
    if (score >= 4.0) return { variant: 'default' as const, label: 'Excellent' };
    if (score >= 3.5) return { variant: 'secondary' as const, label: 'Good' };
    return { variant: 'destructive' as const, label: 'Needs Improvement' };
  };

  return (
    <div className="space-y-6">
      {/* Agent Performance List */}
      <div className="space-y-4">
        {sortedAgents.map((agent, index) => {
          const messageBarWidth = (agent.messagesHandled / maxMessages) * 100;
          const badge = getPerformanceBadge(agent.customerSatisfaction);
          
          return (
            <div key={agent.agentId} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {agent.agentName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">{agent.agentName}</h3>
                    <p className="text-sm text-gray-500">
                      {agent.activeTime}h active time
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={badge.variant}>
                    {badge.label}
                  </Badge>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      #{index + 1}
                    </div>
                    <div className="text-xs text-gray-500">
                      Rank
                    </div>
                  </div>
                </div>
              </div>

              {/* Message Volume Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Messages Handled</span>
                  <span>{agent.messagesHandled}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${messageBarWidth}%` }}
                  ></div>
                </div>
              </div>

              {/* Performance Metrics Grid */}
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className={`font-semibold ${getPerformanceColor(agent.customerSatisfaction)}`}>
                    {agent.customerSatisfaction.toFixed(1)}/5
                  </div>
                  <div className="text-gray-500 text-xs">CSAT</div>
                </div>
                
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {agent.avgResponseTime.toFixed(1)}m
                  </div>
                  <div className="text-gray-500 text-xs">Avg Response</div>
                </div>
                
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {agent.ticketsResolved}
                  </div>
                  <div className="text-gray-500 text-xs">Tickets</div>
                </div>
                
                <div className="text-center">
                  <div className="font-semibold text-gray-900">
                    {((agent.messagesHandled / agent.activeTime) || 0).toFixed(1)}
                  </div>
                  <div className="text-gray-500 text-xs">Msg/Hour</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            {data.reduce((sum, agent) => sum + agent.messagesHandled, 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total Messages</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">
            {data.length > 0 ? (data.reduce((sum, agent) => sum + agent.avgResponseTime, 0) / data.length).toFixed(1) : '0'}m
          </div>
          <div className="text-xs text-gray-500">Avg Response Time</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">
            {data.length > 0 ? (data.reduce((sum, agent) => sum + agent.customerSatisfaction, 0) / data.length).toFixed(1) : '0'}/5
          </div>
          <div className="text-xs text-gray-500">Avg CSAT</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-600">
            {data.reduce((sum, agent) => sum + agent.ticketsResolved, 0)}
          </div>
          <div className="text-xs text-gray-500">Tickets Resolved</div>
        </div>
      </div>
    </div>
  );
} 