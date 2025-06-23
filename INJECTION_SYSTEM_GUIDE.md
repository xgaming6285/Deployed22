# Lead Injection System Integration Guide

## Overview

The Lead Injection System is fully integrated with the order management system, allowing affiliate managers and admins to automatically inject leads into target websites when creating orders. The system supports multiple injection modes and provides comprehensive tracking and control features.

## System Architecture

### Components

1. **Backend Integration**

   - `backend/controllers/orders.js` - Order management with injection logic
   - `backend/routes/orders.js` - API endpoints for injection control
   - `backend/models/Order.js` - Order schema with injection settings
   - `injector_playwright.py` - Python script for lead injection

2. **Frontend Integration**
   - `frontend/src/pages/OrdersPage.jsx` - UI for injection controls
   - Order creation form with injection settings
   - Real-time injection status tracking
   - Control buttons for start/pause/stop

## How It Works

### 1. Order Creation with Injection Settings

When creating an order, injection is automatically enabled for all non-FTD leads:

```javascript
{
  "requests": {
    "ftd": 0,
    "filler": 2,
    "cold": 1,
    "live": 1
  },
  "injectionSettings": {
    "enabled": true, // Always enabled
    "mode": "bulk", // or "scheduled"
    "scheduledTime": {
      "startTime": "10:00", // for scheduled mode
      "endTime": "12:00"
    },
    "includeTypes": {
      "filler": true, // Always true
      "cold": true,   // Always true
      "live": true    // Always true
      // FTDs are always manual - never included
    }
  }
}
```

### 2. Injection Modes

#### Bulk Injection

- All leads are injected immediately when started
- Processes leads sequentially with 2-second delays
- Automatic progress tracking

#### Scheduled Injection

- Leads are injected at random intervals within specified time window
- Supports both HH:MM format (e.g., "10:00") and ISO8601 format
- Distributes injections evenly across the time period

### 3. Lead Processing Flow

1. **Order Creation**

   - System pulls leads based on requests (ftd, filler, cold, live)
   - Applies country/gender filters
   - Stores leads in order.leads array

2. **Injection Start**

   - Calculate total injectable leads (excludes FTDs)
   - Update injection status to "in_progress"
   - Process leads based on selected mode

3. **Individual Lead Injection**

   - Calls Python script with lead data
   - Script handles proxy configuration and form filling
   - Captures final redirect domain
   - Automatically assigns client broker based on domain

4. **Progress Tracking**
   - Tracks successful/failed injections
   - Updates injection progress in real-time
   - Automatically completes when all leads processed

### 4. Client Broker Assignment

The system automatically handles client broker assignment:

- **Domain Detection**: Captures final redirect domain from injection
- **Auto-Creation**: Creates new client brokers for unknown domains
- **Assignment**: Links leads to appropriate client brokers
- **Tracking**: Updates broker assignment counts

## API Endpoints

### Injection Control

- `POST /api/orders/:id/start-injection` - Start injection process
- `POST /api/orders/:id/pause-injection` - Pause ongoing injection
- `POST /api/orders/:id/stop-injection` - Stop injection completely
- `POST /api/orders/:id/skip-ftds` - Skip FTD manual filling
- `POST /api/orders/:id/assign-brokers` - Manual broker assignment

### Order Management

- `POST /api/orders` - Create order with injection settings
- `GET /api/orders/:id` - Get order details including injection status
- `GET /api/orders/:id/export` - Export order leads to CSV

## Frontend Features

### Order Creation Form

- **Injection Settings Section**
  - Mode selection (bulk/scheduled only)
  - Time range picker for scheduled mode
  - All non-FTD leads automatically included (FTDs remain manual)

### Orders Table

- **Injection Status Column** - Shows current injection status
- **Control Buttons** - Start/pause/stop injection
- **Progress Indicators** - Real-time status updates
- **Broker Assignment** - Manual assignment when needed

### Status Tracking

- **Real-time Alerts** - Success/error notifications
- **Progress Bars** - Visual injection progress
- **Status Chips** - Color-coded status indicators

## Order Schema Updates

The Order model includes comprehensive injection tracking:

```javascript
{
  // Injection configuration
  injectionSettings: {
    enabled: Boolean,
    mode: String, // "manual", "bulk", "scheduled"
    status: String, // "pending", "in_progress", "completed", "failed", "paused"
    scheduledTime: {
      startTime: String,
      endTime: String
    },
    includeTypes: {
      filler: Boolean,
      cold: Boolean,
      live: Boolean
    }
  },

  // Progress tracking
  injectionProgress: {
    totalToInject: Number,
    totalInjected: Number,
    successfulInjections: Number,
    failedInjections: Number,
    lastInjectionAt: Date,
    completedAt: Date,
    brokersAssigned: Number,
    brokerAssignmentPending: Boolean
  },

  // FTD handling
  ftdHandling: {
    status: String, // "pending", "skipped", "manual_fill_required", "completed"
    notes: String
  },

  // Client broker assignment
  clientBrokerAssignment: {
    status: String, // "pending", "in_progress", "completed", "skipped"
    assignedBy: ObjectId,
    assignedAt: Date,
    notes: String
  }
}
```

## Security & Permissions

### Access Control

- Only **admins** and **affiliate managers** can:
  - Start/pause/stop injections
  - Skip FTDs
  - Assign client brokers
  - Create orders with injection enabled

### Data Protection

- Lead data is processed securely through the Python script
- Proxy configurations protect user identity
- Client broker assignments are tracked with audit trail

## Error Handling

### Injection Failures

- Individual lead failures don't stop the entire process
- Failed injections are tracked and reported
- Orders can be retried or completed manually

### System Resilience

- Timeout handling for long-running injections
- Graceful degradation when Python script fails
- Automatic recovery and status updates

## Monitoring & Analytics

### Progress Tracking

- Real-time injection progress updates
- Success/failure rate monitoring
- Time-based injection distribution

### Performance Metrics

- Injection completion times
- Success rates by lead type
- Broker assignment efficiency

## Testing

Use the provided test script to verify system integration:

```bash
python test_order_injection.py
```

This script tests:

- Python injection script functionality
- Order creation payload structure
- API endpoint availability

## Troubleshooting

### Common Issues

1. **Python Script Failures**

   - Check Python dependencies are installed
   - Verify proxy configurations
   - Ensure target website is accessible

2. **Injection Stuck in Progress**

   - Use pause/stop controls to reset status
   - Check backend logs for errors
   - Verify lead data integrity

3. **Broker Assignment Issues**
   - Check domain extraction from injection output
   - Verify ClientBroker model permissions
   - Use manual assignment as fallback

### Debug Information

The system provides comprehensive logging:

- Python script output is captured and logged
- Injection progress is tracked in database
- Frontend shows real-time status updates

## Best Practices

### Order Planning

- Test injection settings with small orders first
- Use scheduled injection during off-peak hours
- Monitor success rates and adjust accordingly

### Lead Management

- Ensure lead data quality before injection
- Use appropriate country/gender filters
- Export leads before injection for backup

### System Maintenance

- Regularly clean up completed orders
- Monitor proxy performance and rotation
- Update client broker assignments as needed

## Conclusion

The Lead Injection System provides a comprehensive, automated solution for processing leads through the order management system. With support for multiple injection modes, real-time tracking, and automatic broker assignment, it streamlines the entire lead processing workflow while maintaining security and reliability.
