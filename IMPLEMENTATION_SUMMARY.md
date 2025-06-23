# Lead Injection and Client Broker Assignment Implementation

## Overview
This implementation adds comprehensive lead injection functionality with client network and broker management as specified in Task.txt.

## Key Features Implemented

### 1. Enhanced Order Injection System
- **Bulk Injection**: Immediate injection of all non-FTD leads
- **Scheduled Injection**: Random intervals within specified time window (e.g., 10am-12pm)
- **Manual Injection**: Individual lead injection control
- **FTD Handling**: FTDs are always manual, system prompts to skip or fill later

### 2. Client Network Management
- **Admin Control**: Only admins can create/manage client networks
- **Affiliate Assignment**: Networks are assigned to specific affiliate managers
- **Access Control**: Affiliate managers only see their assigned networks

### 3. Client Broker Assignment
- **Post-Injection Assignment**: Brokers are assigned after injection completion
- **Domain-Based Assignment**: Final domain from injection determines broker
- **Manual Assignment**: Admin/affiliate manager manually assigns brokers
- **Skip Option**: Ability to skip broker assignment if needed

### 4. Lead Assignment History
- **Network History**: Tracks all client network assignments per lead
- **Broker History**: Tracks all client broker assignments per lead
- **Duplicate Prevention**: Prevents re-assignment to same network/broker
- **Cross-Order Tracking**: Lead can exist in multiple orders with different networks

### 5. Broker Availability System
- **Availability Check**: System checks available brokers before injection
- **Sleep Mode**: Leads go to sleep when no brokers available
- **Auto Wake-up**: Leads wake up when new brokers are added
- **Status Tracking**: `available`, `sleep`, `not_available_brokers` states

## API Endpoints

### Order Management
```
POST /api/orders/:id/start-injection     # Start injection process
POST /api/orders/:id/pause-injection     # Pause ongoing injection
POST /api/orders/:id/stop-injection      # Stop injection process
POST /api/orders/:id/skip-ftds           # Skip FTDs for manual filling
```

### Broker Assignment
```
POST /api/orders/:id/assign-brokers              # Assign brokers to leads
GET  /api/orders/:id/pending-broker-assignment   # Get leads needing assignment
POST /api/orders/:id/skip-broker-assignment      # Skip broker assignment
```

### Lead Management
```
POST /api/leads/wake-up                   # Wake up sleeping leads
```

### Client Networks
```
GET    /api/client-networks               # Get networks (role-based access)
POST   /api/client-networks               # Create network (admin only)
PUT    /api/client-networks/:id           # Update network (admin only)
DELETE /api/client-networks/:id           # Delete network (admin only)
POST   /api/client-networks/:id/brokers   # Add broker to network
```

## Database Schema Updates

### Lead Model Enhancements
```javascript
// Client network and broker history
clientNetworkHistory: [{
  clientNetwork: ObjectId,
  clientBroker: String,
  assignedAt: Date,
  assignedBy: ObjectId,
  orderId: ObjectId,
  injectionStatus: String, // pending, successful, failed
  domain: String
}],

// Broker availability status
brokerAvailabilityStatus: String, // available, sleep, not_available_brokers

// Sleep tracking
sleepDetails: {
  putToSleepAt: Date,
  reason: String,
  lastCheckedAt: Date
}
```

### Order Model Enhancements
```javascript
// Injection progress tracking
injectionProgress: {
  totalToInject: Number,
  totalInjected: Number,
  successfulInjections: Number,
  failedInjections: Number,
  ftdsPendingManualFill: Number,
  lastInjectionAt: Date,
  completedAt: Date,
  brokersAssigned: Number,
  brokerAssignmentPending: Boolean
},

// Client broker assignment tracking
clientBrokerAssignment: {
  status: String, // pending, in_progress, completed, skipped
  assignedBy: ObjectId,
  assignedAt: Date,
  notes: String
}
```

## Frontend Components

### Order Creation Dialog
- Client network selection for affiliate managers
- Injection mode selection (manual, bulk, scheduled)
- Time window configuration for scheduled injection
- Lead type selection for injection

### Order Management Table
- Injection control buttons (start, pause, stop)
- FTD skip functionality
- Broker assignment buttons
- Status indicators for injection and broker assignment

### Broker Assignment Dialog
- Lead list with available brokers
- Manual broker and domain assignment
- Validation and error handling
- Bulk assignment capabilities

## Workflow

### 1. Order Creation
1. Admin/affiliate manager creates order
2. Selects client network (optional)
3. Configures injection settings
4. System pulls leads and checks for duplicates

### 2. Injection Process
1. User starts injection (bulk or scheduled)
2. System checks broker availability for each lead
3. Leads with no available brokers go to sleep
4. Successful injections mark leads for broker assignment
5. FTDs are skipped for manual processing

### 3. Broker Assignment
1. After injection completion, broker assignment dialog appears
2. Admin/affiliate manager assigns brokers based on domains
3. System updates lead history and broker assignments
4. Order status updated to reflect completion

### 4. Sleep/Wake System
1. Leads go to sleep when no brokers available
2. New brokers automatically wake up eligible leads
3. Manual wake-up function available for batch processing
4. System tracks sleep reasons and timestamps

## Error Handling

- **Duplicate Assignment Protection**: Prevents leads from being assigned to same network twice
- **Broker Availability Validation**: Checks broker availability before injection
- **Permission Validation**: Role-based access control throughout
- **Injection Status Tracking**: Comprehensive status tracking with error recovery
- **Data Consistency**: Atomic operations and transaction-like behavior

## Performance Considerations

- **Indexed Queries**: Proper database indexing for lead lookups
- **Batch Processing**: Efficient handling of bulk operations
- **Lazy Loading**: Client networks loaded only when needed
- **Debounced Filters**: Optimized search and filtering
- **Pagination**: Efficient data loading for large datasets

## Security Features

- **Role-Based Access**: Admin vs affiliate manager permissions
- **Network Assignment Validation**: Users can only access assigned networks
- **Input Validation**: Comprehensive validation on all inputs
- **Audit Trail**: Complete history of assignments and changes
- **Error Logging**: Comprehensive logging for debugging and monitoring

This implementation provides a robust, scalable solution for managing lead injection and client broker assignments while maintaining data integrity and user experience. 