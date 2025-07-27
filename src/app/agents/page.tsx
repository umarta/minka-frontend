'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { AgentMockDataDemo } from '@/components/agents/agent-mock-demo';

export default function AgentsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Agents</h1>
          <p className="text-gray-600">
            Comprehensive agent management system with mock data for development
          </p>
        </div>

        <AgentMockDataDemo />
      </div>
    </MainLayout>
  );
} 