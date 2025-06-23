# FTD Session Management System

## Overview

The FTD Session Management System allows affiliate managers to capture browser sessions during manual FTD injections and assign them to agents for seamless continuation of the workflow. This eliminates the need for agents to manually log into sites like Gmail, social media, etc.

## System Components

### 1. Session Management Service (`backend/services/sessionManagementService.js`)
- **Purpose**: Core service handling session storage, retrieval, and management
- **Key Methods**:
  - `storeSession()`: Stores browser session data after manual injection
  - `retrieveSession()`: Retrieves stored session data for agent use
  - `assignSessionToAgent()`: Assigns sessions to specific agents
  - `launchAgentBrowser()`: Spawns browser with session data for agents
  - `hasActiveSession()`: Checks if lead has active session
  - `cleanupOldSessions()`: Removes expired session files

### 2. Manual Injector (`manual_injector_playwright.py`)
- **Purpose**: Opens browser for manual FTD injection and captures session data
- **Key Features**:
  - Auto-fills form fields with lead data
  - Monitors for form submission
  - Automatically captures session data (cookies, localStorage, etc.)
  - Outputs session data to backend via stdout

### 3. Agent Browser Launcher (`agent_browser_launcher.py`)
- **Purpose**: Launches browser for agents with stored session data
- **Key Features**:
  - Applies stored cookies, localStorage, sessionStorage
  - Uses same user agent and viewport as original injection
  - Tests session validity by navigating to final domain
  - Provides instructions to agents

### 4. Backend Integration
- **Controllers**: Updated `backend/controllers/orders.js` with session endpoints
- **Routes**: Added session management routes in `backend/routes/orders.js`
- **Model**: Enhanced `backend/models/Lead.js` with sessionData field

## Workflow

### Phase 1: Manual Injection & Session Capture
1. Affiliate manager starts manual FTD injection via API
2. `manual_injector_playwright.py` opens browser with auto-filled form
3. Manager submits form manually
4. Script automatically detects submission and captures session data
5. Session data is sent to backend and stored in JSON files
6. Lead model is updated with session reference

### Phase 2: Session Assignment
1. Admin/manager assigns FTD session to specific agent via API
2. System validates agent and session availability
3. Lead is marked as assigned to the agent
4. Session data is linked to the agent

### Phase 3: Agent Browser Launch
1. Agent requests browser launch via API
2. System retrieves stored session data
3. `agent_browser_launcher.py` is spawned with session data
4. Browser opens with all session data applied
5. Agent can access sites without manual login

## API Endpoints

### Manual Injection
- `POST /api/orders/:id/start-manual-ftd-injection` - Start manual FTD injection
- `POST /api/orders/:id/leads/:leadId/start-manual-ftd-injection` - Start injection for specific lead

### Session Management
- `POST /api/orders/:id/assign-ftd-session` - Assign FTD session to agent
- `POST /api/orders/:id/launch-agent-browser` - Launch browser with session for agent

## Session Data Structure

```json
{
  "sessionId": "session_leadId_orderId_timestamp_randomBytes",
  "leadId": "MongoDB ObjectId",
  "orderId": "MongoDB ObjectId", 
  "createdAt": "2024-01-01T00:00:00.000Z",
  "sessionData": {
    "cookies": [...],
    "localStorage": {...},
    "sessionStorage": {...},
    "userAgent": "Mozilla/5.0...",
    "viewport": {"width": 1280, "height": 720},
    "finalDomain": "example.com"
  },
  "status": "active",
  "lastUsed": "2024-01-01T00:00:00.000Z"
}
```

## File Storage

- **Location**: `backend/browser_sessions/`
- **Format**: JSON files named `{sessionId}.json`
- **Cleanup**: Automatic cleanup of sessions older than 30 days

## Lead Model Updates

The Lead model now includes a `sessionData` field:

```javascript
sessionData: {
  sessionId: String,
  sessionPath: String,
  createdAt: Date,
  status: String, // "active", "expired", "used"
  assignedAgent: ObjectId,
  assignedAt: Date,
  lastUsed: Date
}
```

## Security Considerations

1. **Session Files**: Stored locally in backend directory (not in database)
2. **Access Control**: Only assigned agents can launch browsers with their sessions
3. **Expiration**: Sessions automatically expire after 30 days
4. **Validation**: Session validity tested before browser launch

## Usage Examples

### Starting Manual Injection
```javascript
POST /api/orders/60f1b2e3c4567890abcdef12/start-manual-ftd-injection
```

### Assigning Session to Agent
```javascript
POST /api/orders/60f1b2e3c4567890abcdef12/assign-ftd-session
{
  "leadId": "60f1b2e3c4567890abcdef34",
  "agentId": "60f1b2e3c4567890abcdef56"
}
```

### Launching Agent Browser
```javascript
POST /api/orders/60f1b2e3c4567890abcdef12/launch-agent-browser
{
  "leadId": "60f1b2e3c4567890abcdef34"
}
```

## Error Handling

- **Session Not Found**: Returns 404 if session doesn't exist
- **Invalid Agent**: Returns 404 if agent is not active
- **Access Denied**: Returns 403 if agent tries to access unassigned session
- **Expired Session**: Returns 400 if session has expired
- **Browser Launch Failure**: Returns 500 with error details

## Monitoring & Debugging

- **Logs**: All session operations are logged to console
- **Session Stats**: Available via `sessionManagementService.getSessionStats()`
- **File Cleanup**: Automatic cleanup logs old session removals
- **Browser Output**: Python script output is captured and logged

## Future Enhancements

1. **Session Encryption**: Encrypt session files for additional security
2. **Session Sharing**: Allow multiple agents to use same session
3. **Session Analytics**: Track session usage patterns
4. **Auto-Refresh**: Automatically refresh expired sessions
5. **Cross-Device**: Support for mobile device sessions 