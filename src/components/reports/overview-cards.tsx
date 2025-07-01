import { TrendingUp, TrendingDown, MessageSquare, Users, Clock, Star, Ticket, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OverviewData } from '@/lib/stores/analytics';

interface OverviewCardsProps {
  data: OverviewData | null;
  isLoading: boolean;
}

export function OverviewCards({ data, isLoading }: OverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      title: 'Total Messages',
      value: data.totalMessages.toLocaleString(),
      icon: MessageSquare,
      growth: data.growth.messages,
      subtitle: 'All time messages',
    },
    {
      title: 'Total Contacts',
      value: data.totalContacts.toLocaleString(),
      icon: Users,
      growth: data.growth.contacts,
      subtitle: 'Active contacts',
    },
    {
      title: 'Active Conversations',
      value: data.activeConversations.toLocaleString(),
      icon: MessageSquare,
      growth: data.growth.conversations,
      subtitle: 'Currently active',
    },
    {
      title: 'Avg Response Time',
      value: `${data.avgResponseTime.toFixed(1)}m`,
      icon: Clock,
      growth: data.growth.responseTime,
      subtitle: 'Average response',
      inverse: true, // For response time, lower is better
    },
    {
      title: 'Customer Satisfaction',
      value: `${data.customerSatisfaction.toFixed(1)}/5`,
      icon: Star,
      growth: 0, // Could add growth calculation
      subtitle: 'CSAT score',
    },
    {
      title: 'Tickets Resolved',
      value: data.ticketsResolved.toLocaleString(),
      icon: Ticket,
      growth: 0, // Could add growth calculation
      subtitle: 'This month',
    },
    {
      title: 'Revenue',
      value: `$${(data.revenue / 1000).toFixed(0)}K`,
      icon: DollarSign,
      growth: 0, // Could add growth calculation
      subtitle: 'This month',
    },
    {
      title: 'Conversion Rate',
      value: '12.5%',
      icon: TrendingUp,
      growth: 0, // Could add growth calculation
      subtitle: 'Chat to sale',
    },
  ];

  const getGrowthIcon = (growth: number, inverse = false) => {
    if (growth === 0) return null;
    
    const isPositive = inverse ? growth < 0 : growth > 0;
    return isPositive ? TrendingUp : TrendingDown;
  };

  const getGrowthColor = (growth: number, inverse = false) => {
    if (growth === 0) return 'text-gray-500';
    
    const isPositive = inverse ? growth < 0 : growth > 0;
    return isPositive ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthBadgeVariant = (growth: number, inverse = false) => {
    if (growth === 0) return 'secondary';
    
    const isPositive = inverse ? growth < 0 : growth > 0;
    return isPositive ? 'default' : 'destructive';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const GrowthIcon = getGrowthIcon(card.growth, card.inverse);
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-gray-900">
                  {card.value}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    {card.subtitle}
                  </p>
                  
                  {card.growth !== 0 && (
                    <Badge 
                      variant={getGrowthBadgeVariant(card.growth, card.inverse)}
                      className="flex items-center gap-1 px-2"
                    >
                      {GrowthIcon && <GrowthIcon className="h-3 w-3" />}
                      <span className="text-xs">
                        {Math.abs(card.growth).toFixed(1)}%
                      </span>
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 