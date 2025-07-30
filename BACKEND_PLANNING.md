# Backend Planning Document
## Agent Management System Implementation

### Overview
This document provides comprehensive backend specifications to replace the mock data system with a production-ready backend implementation. All specifications are derived from the existing frontend implementation to ensure seamless integration.

---

## 1. Database Schema

### 1.1 Agents Table
```sql
CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'cs', 'viewer')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Extended fields
    full_name VARCHAR(255) NOT NULL,
    avatar TEXT NULL,
    phone VARCHAR(20) NULL,
    department VARCHAR(100) NOT NULL,
    online_status VARCHAR(20) DEFAULT 'offline' CHECK (online_status IN ('online', 'offline', 'away', 'busy')),
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Performance metrics (current values)
    current_tickets INTEGER DEFAULT 0,
    total_tickets_handled INTEGER DEFAULT 0,
    avg_response_time DECIMAL(5,2) DEFAULT 5.0, -- in minutes
    customer_satisfaction DECIMAL(3,2) DEFAULT 3.5 CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    tickets_resolved_today INTEGER DEFAULT 0,
    messages_handled_today INTEGER DEFAULT 0,
    online_hours_today DECIMAL(4,2) DEFAULT 0.0
);

-- Indexes
CREATE INDEX idx_agents_role ON agents(role);
CREATE INDEX idx_agents_department ON agents(department);
CREATE INDEX idx_agents_online_status ON agents(online_status);
CREATE INDEX idx_agents_is_active ON agents(is_active);
CREATE INDEX idx_agents_last_login ON agents(last_login_at);
```

### 1.2 Agent Performance Metrics Table
```sql
CREATE TABLE agent_performance_metrics (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    messages_handled INTEGER DEFAULT 0,
    avg_response_time DECIMAL(5,2) DEFAULT 0, -- in minutes
    customer_satisfaction DECIMAL(3,2) DEFAULT 0 CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    tickets_resolved INTEGER DEFAULT 0,
    online_hours DECIMAL(4,2) DEFAULT 0,
    sla_compliance DECIMAL(5,2) DEFAULT 0, -- percentage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(agent_id, date)
);

-- Indexes
CREATE INDEX idx_performance_agent_date ON agent_performance_metrics(agent_id, date);
CREATE INDEX idx_performance_date ON agent_performance_metrics(date);
```

### 1.3 Agent Activities Table
```sql
CREATE TABLE agent_activities (
    id VARCHAR(50) PRIMARY KEY, -- UUID or similar
    agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('login', 'logout', 'status_change', 'ticket_assigned', 'ticket_resolved', 'message_sent')),
    description TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB NULL, -- For additional data like ticket IDs, etc.
    
    INDEX(agent_id, timestamp),
    INDEX(type),
    INDEX(timestamp)
);
```

### 1.4 Agent Sessions Table (for real-time tracking)
```sql
CREATE TABLE agent_sessions (
    id VARCHAR(50) PRIMARY KEY, -- Session ID
    agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
    socket_id VARCHAR(100) NULL, -- WebSocket connection ID
    ip_address INET NULL,
    user_agent TEXT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true,
    
    INDEX(agent_id, is_active),
    INDEX(socket_id),
    INDEX(last_activity)
);
```

---

## 2. API Endpoints Specification

### 2.1 Authentication Endpoints
```
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh
GET  /api/auth/me
```

### 2.2 Agent Management Endpoints

#### GET /api/agents
**Purpose**: Retrieve agents with filtering and pagination
**Query Parameters**:
```typescript
interface AgentFilters {
  role?: 'admin' | 'cs' | 'viewer';
  status?: 'active' | 'inactive';
  onlineStatus?: 'online' | 'offline' | 'away' | 'busy';
  department?: string;
  search?: string;
  performanceLevel?: 'high' | 'medium' | 'low';
  page?: number;
  limit?: number;
}
```
**Response**:
```typescript
interface PaginatedAgentResponse {
  data: Agent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

#### GET /api/agents/:id
**Purpose**: Get agent by ID
**Response**: `Agent` object

#### POST /api/agents
**Purpose**: Create new agent
**Body**:
```typescript
interface CreateAgentData {
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'cs' | 'viewer';
  department: string;
  phone?: string;
  password: string;
}
```
**Response**: `Agent` object

#### PUT /api/agents/:id
**Purpose**: Update agent
**Body**:
```typescript
interface UpdateAgentData {
  username?: string;
  email?: string;
  fullName?: string;
  role?: 'admin' | 'cs' | 'viewer';
  department?: string;
  phone?: string;
  isActive?: boolean;
}
```
**Response**: `Agent` object

#### DELETE /api/agents/:id
**Purpose**: Deactivate agent (soft delete)
**Response**: 
```typescript
{ success: boolean; message: string }
```

#### PUT /api/agents/:id/status
**Purpose**: Update agent online status
**Body**:
```typescript
{ status: 'online' | 'offline' | 'away' | 'busy' }
```
**Response**: `Agent` object

#### GET /api/agents/:id/performance
**Purpose**: Get agent performance metrics
**Query Parameters**:
```typescript
{
  from?: string; // ISO date
  to?: string;   // ISO date
}
```
**Response**: `AgentPerformanceMetrics[]`

#### GET /api/agents/:id/activity
**Purpose**: Get agent activity history
**Query Parameters**:
```typescript
{ days?: number } // Default: 7
```
**Response**: `AgentActivity[]`

#### GET /api/agents/stats
**Purpose**: Get agent statistics
**Response**:
```typescript
{
  total: number;
  active: number;
  online: number;
  offline: number;
  byRole: Record<string, number>;
  byDepartment: Record<string, number>;
}
```

#### GET /api/agents/search
**Purpose**: Search agents
**Query Parameters**:
```typescript
{
  q: string; // Search query
  ...AgentFilters
}
```
**Response**: `PaginatedAgentResponse`

#### PUT /api/agents/bulk
**Purpose**: Bulk update agents
**Body**:
```typescript
{
  agentIds: number[];
  updates: Partial<UpdateAgentData>;
}
```
**Response**:
```typescript
{
  success: boolean;
  updated: number;
  errors: string[];
}
```

---

## 3. WebSocket Implementation

### 3.1 Connection Management
- **Endpoint**: `wss://api.domain.com/ws`
- **Authentication**: JWT token in query parameter or header
- **Room Management**: Agents join room based on their role/department

### 3.2 Event Types
```typescript
interface WebSocketEvents {
  // Agent status events
  'agent_online': { agentId: number; timestamp: string };
  'agent_offline': { agentId: number; timestamp: string };
  'agent_status_change': { agentId: number; status: string; timestamp: string };
  
  // Activity events
  'agent_activity': AgentActivity;
  
  // Performance updates
  'performance_update': { agentId: number; metric: string; value: number; timestamp: string };
  
  // System events
  'agent_created': Agent;
  'agent_updated': Agent;
  'agent_deleted': { agentId: number; timestamp: string };
}
```

### 3.3 Room Structure
- `agents:all` - All agent updates
- `agents:admin` - Admin-specific events
- `agents:department:{name}` - Department-specific events
- `agent:{id}` - Individual agent updates

---

## 4. Business Logic Implementation

### 4.1 Performance Calculation
```typescript
// Daily metrics calculation
interface PerformanceCalculator {
  calculateAvgResponseTime(agentId: number, date: Date): Promise<number>;
  calculateCustomerSatisfaction(agentId: number, date: Date): Promise<number>;
  calculateSLACompliance(agentId: number, date: Date): Promise<number>;
  updateDailyMetrics(agentId: number): Promise<void>;
}
```

### 4.2 Real-time Status Management
```typescript
interface StatusManager {
  updateAgentStatus(agentId: number, status: OnlineStatus): Promise<void>;
  trackActivity(agentId: number, activity: AgentActivity): Promise<void>;
  calculateOnlineHours(agentId: number, date: Date): Promise<number>;
  resetDailyCounters(): Promise<void>; // Run daily at midnight
}
```

### 4.3 Session Management
```typescript
interface SessionManager {
  createSession(agentId: number, socketId: string, metadata: any): Promise<string>;
  updateLastActivity(sessionId: string): Promise<void>;
  endSession(sessionId: string): Promise<void>;
  getActiveSessions(agentId: number): Promise<AgentSession[]>;
  cleanupInactiveSessions(): Promise<void>; // Run periodically
}
```

---

## 5. Background Jobs

### 5.1 Daily Metrics Aggregation
```typescript
// Run daily at 00:01
async function aggregateDailyMetrics() {
  // Calculate and store daily performance metrics for all agents
  // Reset daily counters (tickets_resolved_today, messages_handled_today, etc.)
  // Update performance levels based on recent metrics
}
```

### 5.2 Session Cleanup
```typescript
// Run every 5 minutes
async function cleanupSessions() {
  // Mark sessions as inactive if no activity for 30+ minutes
  // Update agent online status based on active sessions
  // Clean up old session records
}
```

### 5.3 Performance Level Updates
```typescript
// Run hourly
async function updatePerformanceLevels() {
  // Calculate performance levels (high/medium/low) based on recent metrics
  // Update agent records with current performance level
}
```

---

## 6. Data Validation

### 6.1 Agent Validation Rules
```typescript
const agentValidation = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/,
    unique: true
  },
  email: {
    required: true,
    format: 'email',
    unique: true
  },
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 255
  },
  role: {
    required: true,
    enum: ['admin', 'cs', 'viewer']
  },
  department: {
    required: true,
    minLength: 2,
    maxLength: 100
  },
  phone: {
    optional: true,
    pattern: /^\+?[\d\s\-\(\)]+$/
  },
  password: {
    required: true, // Only for creation
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/ // At least one lowercase, uppercase, and digit
  }
};
```

### 6.2 Performance Metrics Validation
```typescript
const performanceValidation = {
  avgResponseTime: {
    type: 'number',
    min: 0,
    max: 1440 // Max 24 hours in minutes
  },
  customerSatisfaction: {
    type: 'number',
    min: 1,
    max: 5,
    decimal: 2
  },
  slaCompliance: {
    type: 'number',
    min: 0,
    max: 100
  }
};
```

---

## 7. Security Implementation

### 7.1 Authentication & Authorization
```typescript
interface AuthMiddleware {
  authenticateJWT(req: Request, res: Response, next: NextFunction): void;
  requireRole(roles: AgentRole[]): Middleware;
  requireSelfOrAdmin(req: Request, res: Response, next: NextFunction): void;
}

// Role-based permissions
const permissions = {
  admin: ['*'], // All operations
  cs: ['read:agents', 'update:self', 'read:performance', 'update:status'],
  viewer: ['read:agents', 'read:performance']
};
```

### 7.2 Rate Limiting
```typescript
const rateLimits = {
  'POST /api/agents': { windowMs: 60000, max: 10 }, // 10 creates per minute
  'PUT /api/agents/:id': { windowMs: 60000, max: 30 }, // 30 updates per minute
  'GET /api/agents': { windowMs: 60000, max: 100 }, // 100 reads per minute
  'PUT /api/agents/bulk': { windowMs: 300000, max: 5 } // 5 bulk operations per 5 minutes
};
```

### 7.3 Input Sanitization
```typescript
interface SecurityMiddleware {
  sanitizeInput(req: Request, res: Response, next: NextFunction): void;
  validateCSRF(req: Request, res: Response, next: NextFunction): void;
  preventSQLInjection(input: string): string;
  sanitizeHTML(input: string): string;
}
```

---

## 8. Performance Optimization

### 8.1 Database Indexing Strategy
```sql
-- Primary indexes (already included in schema)
-- Additional composite indexes for common queries
CREATE INDEX idx_agents_role_department ON agents(role, department);
CREATE INDEX idx_agents_active_online ON agents(is_active, online_status);
CREATE INDEX idx_performance_agent_date_range ON agent_performance_metrics(agent_id, date DESC);
CREATE INDEX idx_activities_agent_type_time ON agent_activities(agent_id, type, timestamp DESC);
```

### 8.2 Caching Strategy
```typescript
interface CacheManager {
  // Cache frequently accessed data
  cacheAgentStats(ttl: number): Promise<void>; // 5 minutes
  cacheAgentList(filters: AgentFilters, ttl: number): Promise<void>; // 2 minutes
  cacheDepartmentList(ttl: number): Promise<void>; // 1 hour
  
  // Invalidation strategies
  invalidateAgentCache(agentId: number): Promise<void>;
  invalidateStatsCache(): Promise<void>;
}
```

### 8.3 Query Optimization
```typescript
// Use pagination for all list endpoints
const defaultPagination = { page: 1, limit: 20, maxLimit: 100 };

// Optimize performance queries with date range limits
const performanceQueryLimits = {
  maxDays: 90, // Maximum 90 days of historical data
  defaultDays: 30 // Default to 30 days if not specified
};

// Use database views for complex aggregations
const performanceViews = {
  agent_daily_summary: 'Daily performance aggregation per agent',
  department_stats: 'Department-level statistics',
  real_time_metrics: 'Current day metrics for dashboard'
};
```

---

## 9. Monitoring & Logging

### 9.1 Application Metrics
```typescript
interface MetricsCollector {
  // API performance metrics
  trackAPILatency(endpoint: string, duration: number): void;
  trackAPIErrors(endpoint: string, errorType: string): void;
  trackCacheHitRate(cacheKey: string): void;
  
  // Business metrics
  trackAgentActivities(type: string, count: number): void;
  trackPerformanceCalculations(duration: number): void;
  trackWebSocketConnections(count: number): void;
}
```

### 9.2 Logging Strategy
```typescript
interface Logger {
  // Structured logging with correlation IDs
  logAgentAction(agentId: number, action: string, metadata: any): void;
  logPerformanceUpdate(agentId: number, metrics: any): void;
  logSecurityEvent(type: string, details: any): void;
  logSystemError(error: Error, context: any): void;
}

// Log levels and retention
const logConfig = {
  levels: ['error', 'warn', 'info', 'debug'],
  retention: {
    error: '90 days',
    warn: '30 days',
    info: '7 days',
    debug: '1 day'
  }
};
```

---

## 10. Testing Strategy

### 10.1 Unit Tests
```typescript
// Test coverage requirements
const testCoverage = {
  controllers: 95,
  services: 90,
  models: 85,
  utilities: 95
};

// Key test scenarios
const testScenarios = [
  'Agent CRUD operations',
  'Performance calculation accuracy',
  'Real-time event broadcasting',
  'Authentication and authorization',
  'Input validation and sanitization',
  'Error handling and recovery'
];
```

### 10.2 Integration Tests
```typescript
// API endpoint testing
const integrationTests = [
  'Complete agent lifecycle (create → update → delete)',
  'WebSocket connection and event handling',
  'Performance metrics calculation and retrieval',
  'Bulk operations with error handling',
  'Search and filtering accuracy',
  'Pagination consistency'
];
```

### 10.3 Load Testing
```typescript
const loadTestTargets = {
  concurrent_users: 100,
  api_requests_per_second: 1000,
  websocket_connections: 500,
  database_queries_per_second: 2000,
  response_time_p95: '200ms',
  error_rate: '<0.1%'
};
```

---

## 11. Deployment Configuration

### 11.1 Environment Variables
```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# Redis (for caching and sessions)
REDIS_URL=redis://host:6379
REDIS_PASSWORD=secret

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# WebSocket
WS_PORT=3001
WS_HEARTBEAT_INTERVAL=30000

# Performance
CACHE_TTL_AGENTS=120 # 2 minutes
CACHE_TTL_STATS=300  # 5 minutes
MAX_CONCURRENT_REQUESTS=1000

# Monitoring
LOG_LEVEL=info
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=60000
```

### 11.2 Docker Configuration
```dockerfile
# Multi-stage build for production optimization
FROM node:18-alpine AS builder
# Build stage...

FROM node:18-alpine AS production
# Production stage with minimal dependencies
EXPOSE 3000 3001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

---

## 12. Migration Strategy

### 12.1 Database Migration Plan
```typescript
// Migration scripts in order
const migrations = [
  '001_create_agents_table.sql',
  '002_create_performance_metrics_table.sql',
  '003_create_activities_table.sql',
  '004_create_sessions_table.sql',
  '005_add_indexes.sql',
  '006_create_views.sql'
];

// Data migration from mock to production
const dataMigration = {
  preserveAgentIds: true, // Keep existing IDs for frontend compatibility
  generateHistoricalData: false, // Don't create fake historical performance data
  setInitialPasswords: true, // Require password reset on first login
  notifyAgents: true // Send email notifications about system migration
};
```

### 12.2 API Versioning
```typescript
// Version strategy for smooth transition
const apiVersioning = {
  current: 'v1',
  supportedVersions: ['v1'],
  deprecationPolicy: '6 months notice',
  headerBased: true, // Accept-Version: v1
  pathBased: false // Not /v1/agents
};
```

---

## 13. Implementation Timeline

### Phase 1: Core Backend (Week 1-2)
- [ ] Database schema setup
- [ ] Basic CRUD API endpoints
- [ ] Authentication system
- [ ] Input validation and security

### Phase 2: Real-time Features (Week 3)
- [ ] WebSocket implementation
- [ ] Session management
- [ ] Real-time status updates
- [ ] Activity tracking

### Phase 3: Performance & Analytics (Week 4)
- [ ] Performance metrics calculation
- [ ] Historical data aggregation
- [ ] Background jobs setup
- [ ] Caching implementation

### Phase 4: Testing & Optimization (Week 5)
- [ ] Comprehensive testing suite
- [ ] Performance optimization
- [ ] Load testing
- [ ] Security audit

### Phase 5: Deployment & Migration (Week 6)
- [ ] Production deployment
- [ ] Data migration
- [ ] Frontend integration testing
- [ ] Go-live and monitoring

---

## 14. Success Criteria

### 14.1 Functional Requirements ✅
- [ ] All mock API endpoints replaced with real implementation
- [ ] Real-time WebSocket events working correctly
- [ ] Performance metrics calculated accurately
- [ ] Search and filtering working as expected
- [ ] Bulk operations functioning properly

### 14.2 Non-Functional Requirements ✅
- [ ] API response time < 200ms (95th percentile)
- [ ] WebSocket connection stability > 99.9%
- [ ] Database query performance optimized
- [ ] Security vulnerabilities addressed
- [ ] 95%+ test coverage achieved

### 14.3 Frontend Compatibility ✅
- [ ] No changes required to frontend code
- [ ] All TypeScript interfaces match exactly
- [ ] WebSocket events compatible
- [ ] Error handling consistent
- [ ] Environment switching works seamlessly

---

This comprehensive backend planning document ensures a smooth transition from the mock data system to a production-ready backend while maintaining complete compatibility with the existing frontend implementation.