// Agent Groups - Mock Data Generator
// Comprehensive mock data generation for agent group management

import { 
  AgentGroup, 
  AdminSummary, 
  GroupStats, 
  GroupActivity,
  GROUP_COLORS,
  GROUP_SIZE_THRESHOLDS,
} from '@/types/agent-groups';

// Realistic group name templates
const GROUP_NAME_TEMPLATES = [
  'Customer Support Team',
  'Technical Support Division',
  'Sales Team Alpha',
  'Quality Assurance Group',
  'Management Team',
  'Training & Development',
  'Emergency Response Unit',
  'Specialist Consultants',
  'Frontend Development Team',
  'Backend Development Team',
  'Product Management',
  'Marketing Team',
  'HR Department',
  'Finance Team',
  'Operations Team',
];

// Group description templates
const GROUP_DESCRIPTIONS = [
  'Primary customer support team handling general inquiries and basic troubleshooting',
  'Specialized technical support for complex product issues and integrations',
  'High-performing sales team focused on new customer acquisition',
  'Quality assurance specialists ensuring product excellence',
  'Senior management team overseeing strategic initiatives',
  'Training coordinators and development specialists',
  'Emergency response team for critical customer issues',
  'Subject matter experts providing specialized consultation',
  'Frontend developers building user-facing applications',
  'Backend developers maintaining server infrastructure',
  'Product managers defining roadmaps and requirements',
  'Marketing professionals driving growth and engagement',
  'Human resources team managing talent and culture',
  'Finance team handling budgets and financial planning',
  'Operations team ensuring smooth daily processes',
];

// Action description templates for activities
const ACTIVITY_DESCRIPTIONS = {
  created: [
    'created a new group for better team organization',
    'established a new team group with specific focus areas',
    'formed a specialized group for improved workflow',
  ],
  member_added: [
    'added a new team member to enhance group capabilities',
    'welcomed a new member to join the team',
    'expanded the team with a skilled new member',
  ],
  member_removed: [
    'removed a member due to role changes',
    'member left the group for new opportunities',
    'team restructuring resulted in member removal',
  ],
  updated: [
    'updated group settings to improve efficiency',
    'modified group configuration for better performance',
    'enhanced group structure with new parameters',
  ],
  deleted: [
    'removed group as part of organizational restructuring',
    'deleted inactive group to streamline operations',
    'consolidated teams by removing redundant group',
  ],
};

class MockAgentGroupData {
  private groups: AgentGroup[] = [];
  private admins: AdminSummary[] = [];
  private activities: GroupActivity[] = [];
  private stats: GroupStats | null = null;

  constructor() {
    this.generateAdmins();
    this.generateGroups();
    this.generateActivities();
    this.calculateStats();
  }

  private generateAdmins(): void {
    const adminNames = [
      'John Smith', 'Sarah Johnson', 'Michael Chen', 'Emily Davis', 'David Wilson',
      'Lisa Anderson', 'Robert Taylor', 'Jennifer Brown', 'James Miller', 'Maria Garcia',
      'Christopher Lee', 'Amanda White', 'Matthew Jones', 'Ashley Martinez', 'Andrew Rodriguez',
      'Jessica Thompson', 'Daniel Kim', 'Nicole Jackson', 'Kevin Wang', 'Rachel Adams',
      'Ryan Clark', 'Stephanie Moore', 'Brandon Hall', 'Lauren Wright', 'Justin Lopez',
      'Melissa Hill', 'Tyler Green', 'Samantha King', 'Nathan Scott', 'Kimberly Turner',
    ];

    this.admins = adminNames.map((name, index) => ({
      id: index + 1,
      username: name.toLowerCase().replace(' ', '.'),
      role: this.getRandomRole(),
      isActive: Math.random() > 0.15, // 85% active
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(' ', '')}`,
    }));
  }

  private getRandomRole(): 'admin' | 'cs' | 'viewer' {
    const roles: ('admin' | 'cs' | 'viewer')[] = ['admin', 'cs', 'viewer'];
    const weights = [0.2, 0.6, 0.2]; // 20% admin, 60% cs, 20% viewer
    const random = Math.random();
    let weightSum = 0;
    
    for (let i = 0; i < roles.length; i++) {
      weightSum += weights[i];
      if (random <= weightSum) {
        return roles[i];
      }
    }
    return 'cs';
  }

  private generateGroups(): void {
    const numGroups = Math.floor(Math.random() * 6) + 8; // 8-13 groups
    
    this.groups = Array.from({ length: numGroups }, (_, index) => {
      const isActive = Math.random() > 0.1; // 90% active
      const memberCount = this.getRandomMemberCount();
      const creator = this.getRandomAdmin();
      const members = this.getRandomMembers(memberCount);
      
      return {
        id: index + 1,
        name: GROUP_NAME_TEMPLATES[index] || `Team ${String.fromCharCode(65 + index)}`,
        description: GROUP_DESCRIPTIONS[index] || this.generateRandomDescription(),
        color: GROUP_COLORS[index % GROUP_COLORS.length],
        isActive,
        createdBy: creator.id,
        memberCount,
        createdAt: this.getRandomPastDate(365).toISOString(),
        updatedAt: this.getRandomPastDate(30).toISOString(),
        creator,
        members,
      };
    });
  }

  private getRandomMemberCount(): number {
    // Weighted distribution: more small and medium teams
    const random = Math.random();
    if (random < 0.4) {
      // Small teams (1-5 members) - 40%
      return Math.floor(Math.random() * 5) + 1;
    } else if (random < 0.8) {
      // Medium teams (6-15 members) - 40%
      return Math.floor(Math.random() * 10) + 6;
    } else {
      // Large teams (16-25 members) - 20%
      return Math.floor(Math.random() * 10) + 16;
    }
  }

  private getRandomAdmin(): AdminSummary {
    return this.admins[Math.floor(Math.random() * this.admins.length)];
  }

  private getRandomMembers(count: number): AdminSummary[] {
    const shuffled = [...this.admins].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, this.admins.length));
  }

  private getRandomPastDate(maxDaysAgo: number): Date {
    const now = new Date();
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  }

  private generateRandomDescription(): string {
    const templates = [
      'A specialized team focused on delivering excellent customer service',
      'Dedicated professionals working together to achieve common goals',
      'Cross-functional team combining diverse skills and expertise',
      'Experienced team members collaborating on strategic initiatives',
      'Dynamic group of professionals driving innovation and growth',
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private generateActivities(): void {
    const numActivities = 50;
    const actions: (keyof typeof ACTIVITY_DESCRIPTIONS)[] = [
      'created', 'member_added', 'member_removed', 'updated', 'deleted'
    ];
    
    this.activities = Array.from({ length: numActivities }, (_, index) => {
      const group = this.getRandomGroup();
      const admin = this.getRandomAdmin();
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      return {
        id: `activity_${index + 1}`,
        groupId: group.id,
        groupName: group.name,
        adminId: admin.id,
        adminName: this.getAdminDisplayName(admin),
        action,
        description: this.getRandomActivityDescription(action),
        timestamp: this.getRandomPastDate(7).toISOString(),
        metadata: {
          groupColor: group.color,
          adminRole: admin.role,
        },
      };
    });

    // Sort by timestamp (newest first)
    this.activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private getRandomGroup(): AgentGroup {
    return this.groups[Math.floor(Math.random() * this.groups.length)];
  }

  private getAdminDisplayName(admin: AdminSummary): string {
    return admin.username
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private getRandomActivityDescription(action: keyof typeof ACTIVITY_DESCRIPTIONS): string {
    const descriptions = ACTIVITY_DESCRIPTIONS[action];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private calculateStats(): void {
    const activeGroups = this.groups.filter(g => g.isActive);
    const totalMembers = this.groups.reduce((sum, g) => sum + g.memberCount, 0);
    
    // Calculate role distribution
    const roleDistribution: Record<string, number> = { admin: 0, cs: 0, viewer: 0 };
    this.admins.forEach(admin => {
      if (admin.isActive) {
        roleDistribution[admin.role]++;
      }
    });

    // Calculate group size distribution
    const groupSizes = {
      small: this.groups.filter(g => 
        g.memberCount >= GROUP_SIZE_THRESHOLDS.small.min && 
        g.memberCount <= GROUP_SIZE_THRESHOLDS.small.max
      ).length,
      medium: this.groups.filter(g => 
        g.memberCount >= GROUP_SIZE_THRESHOLDS.medium.min && 
        g.memberCount <= GROUP_SIZE_THRESHOLDS.medium.max
      ).length,
      large: this.groups.filter(g => 
        g.memberCount >= GROUP_SIZE_THRESHOLDS.large.min
      ).length,
    };

    this.stats = {
      totalGroups: this.groups.length,
      activeGroups: activeGroups.length,
      inactiveGroups: this.groups.length - activeGroups.length,
      totalMembers,
      byRole: roleDistribution,
      groupSizes,
      recentActivity: this.activities.slice(0, 10),
    };
  }

  // Public accessor methods
  getGroups(): AgentGroup[] {
    return [...this.groups];
  }

  getActiveGroups(): AgentGroup[] {
    return this.groups.filter(group => group.isActive);
  }

  getInactiveGroups(): AgentGroup[] {
    return this.groups.filter(group => !group.isActive);
  }

  getGroupById(id: number): AgentGroup | undefined {
    return this.groups.find(group => group.id === id);
  }

  getAdmins(): AdminSummary[] {
    return [...this.admins];
  }

  getActiveAdmins(): AdminSummary[] {
    return this.admins.filter(admin => admin.isActive);
  }

  getAdminById(id: number): AdminSummary | undefined {
    return this.admins.find(admin => admin.id === id);
  }

  getStats(): GroupStats {
    return this.stats!;
  }

  getActivities(): GroupActivity[] {
    return [...this.activities];
  }

  getRecentActivities(limit: number = 10): GroupActivity[] {
    return this.activities.slice(0, limit);
  }

  getActivitiesByGroup(groupId: number): GroupActivity[] {
    return this.activities.filter(activity => activity.groupId === groupId);
  }

  // Search and filter methods
  searchGroups(query: string): AgentGroup[] {
    const lowercaseQuery = query.toLowerCase();
    return this.groups.filter(group =>
      group.name.toLowerCase().includes(lowercaseQuery) ||
      group.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  filterGroups(filters: {
    isActive?: boolean;
    role?: string;
    memberCount?: { min?: number; max?: number };
    createdBy?: number;
  }): AgentGroup[] {
    return this.groups.filter(group => {
      if (filters.isActive !== undefined && group.isActive !== filters.isActive) {
        return false;
      }
      
      if (filters.createdBy !== undefined && group.createdBy !== filters.createdBy) {
        return false;
      }
      
      if (filters.memberCount) {
        if (filters.memberCount.min !== undefined && group.memberCount < filters.memberCount.min) {
          return false;
        }
        if (filters.memberCount.max !== undefined && group.memberCount > filters.memberCount.max) {
          return false;
        }
      }
      
      if (filters.role) {
        // Check if group has members with the specified role
        return group.members?.some(member => member.role === filters.role) || false;
      }
      
      return true;
    });
  }

  getGroupsBySize(size: 'small' | 'medium' | 'large'): AgentGroup[] {
    const threshold = GROUP_SIZE_THRESHOLDS[size];
    return this.groups.filter(group => {
      if (size === 'large') {
        return group.memberCount >= threshold.min;
      }
      return group.memberCount >= threshold.min && group.memberCount <= threshold.max;
    });
  }

  // Data manipulation methods for testing
  addGroup(group: Omit<AgentGroup, 'id'>): AgentGroup {
    const newGroup: AgentGroup = {
      ...group,
      id: Math.max(...this.groups.map(g => g.id), 0) + 1,
    };
    this.groups.unshift(newGroup);
    this.calculateStats();
    return newGroup;
  }

  updateGroup(id: number, updates: Partial<AgentGroup>): AgentGroup | null {
    const index = this.groups.findIndex(g => g.id === id);
    if (index === -1) return null;
    
    this.groups[index] = { 
      ...this.groups[index], 
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.calculateStats();
    return this.groups[index];
  }

  deleteGroup(id: number): boolean {
    const index = this.groups.findIndex(g => g.id === id);
    if (index === -1) return false;
    
    this.groups.splice(index, 1);
    this.calculateStats();
    return true;
  }

  addActivity(activity: Partial<GroupActivity>): GroupActivity {
    const newActivity: GroupActivity = {
      id: `activity_${Date.now()}`,
      groupId: activity.groupId || this.getRandomGroup().id,
      groupName: activity.groupName || this.getRandomGroup().name,
      adminId: activity.adminId || this.getRandomAdmin().id,
      adminName: activity.adminName || this.getAdminDisplayName(this.getRandomAdmin()),
      action: activity.action || 'updated',
      description: activity.description || this.getRandomActivityDescription(activity.action || 'updated'),
      timestamp: new Date().toISOString(),
      metadata: activity.metadata,
    };
    
    this.activities.unshift(newActivity);
    this.activities = this.activities.slice(0, 100); // Keep last 100 activities
    
    // Update stats with new activity
    if (this.stats) {
      this.stats.recentActivity = [newActivity, ...this.stats.recentActivity.slice(0, 9)];
    }
    
    return newActivity;
  }

  // Utility methods for member management
  addMemberToGroup(groupId: number, adminId: number): boolean {
    const group = this.getGroupById(groupId);
    const admin = this.getAdminById(adminId);
    
    if (!group || !admin) return false;
    
    if (!group.members) group.members = [];
    
    // Check if member already exists
    if (group.members.find(m => m.id === adminId)) return false;
    
    group.members.push(admin);
    group.memberCount = group.members.length;
    this.calculateStats();
    
    return true;
  }

  removeMemberFromGroup(groupId: number, adminId: number): boolean {
    const group = this.getGroupById(groupId);
    if (!group || !group.members) return false;
    
    const initialLength = group.members.length;
    group.members = group.members.filter(m => m.id !== adminId);
    group.memberCount = group.members.length;
    
    if (group.members.length < initialLength) {
      this.calculateStats();
      return true;
    }
    
    return false;
  }

  // Batch operations
  bulkUpdateGroups(groupIds: number[], updates: Partial<AgentGroup>): { successful: number[]; failed: number[] } {
    const successful: number[] = [];
    const failed: number[] = [];
    
    groupIds.forEach(id => {
      if (this.updateGroup(id, updates)) {
        successful.push(id);
      } else {
        failed.push(id);
      }
    });
    
    return { successful, failed };
  }

  // Reset data for testing
  regenerateData(): void {
    this.groups = [];
    this.admins = [];
    this.activities = [];
    this.stats = null;
    
    this.generateAdmins();
    this.generateGroups();
    this.generateActivities();
    this.calculateStats();
  }
}

// Export singleton instance
export const mockAgentGroupData = new MockAgentGroupData();

// Export class for testing or custom instances
export type { MockAgentGroupData };