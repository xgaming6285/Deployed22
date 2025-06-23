# Client Network Assignment Logic

## Overview
This document describes the new client network assignment logic implemented for leads in the FTD system. The logic ensures that leads maintain a proper history of their client network assignments and prevents duplicate assignments within the same order.

## Key Rules

### 1. Assignment History Tracking
- Every lead maintains a complete history of all client network assignments in the `clientNetworkHistory` array
- Each history entry includes:
  - `clientNetwork`: The name of the client network
  - `clientBroker`: The associated client broker (if any)
  - `assignedAt`: Timestamp of when the assignment was made
  - `assignedBy`: User ID of who made the assignment
  - `orderId`: The order ID associated with this assignment

### 2. Duplicate Prevention Rule
- **Within Same Order**: A lead CANNOT be assigned to the same client network twice within the same order
- **Across Different Orders**: A lead CAN be assigned to the same client network in different orders
- **Different Networks**: A lead CAN be assigned to different client networks within the same order

## API Endpoints

### ~~Assign Client Network to Order Leads~~ (DISABLED)
```
PUT /api/orders/:id/assign-client-info
```
- **This endpoint has been disabled** (returns 410 error)
- Mass assignment of client info to all leads in an order is no longer supported
- Use individual lead assignment instead

### Assign Client Network to Individual Lead
```
PUT /api/leads/:id/assign-client-network
```
- Validates individual lead assignment
- Updates the lead and adds history entry
- Returns error if lead already assigned to this client network in the same order

### Get Lead Assignment History
```
GET /api/leads/:id/assignment-history
```
- Returns complete assignment history for a specific lead
- Includes current assignment and historical assignments
- Shows order information and assignment details

### Get Client Network Analytics
```
GET /api/leads/client-network-analytics?orderId=:orderId
```
- Provides analytics on client network assignments
- Shows assignment counts, unique leads, and order breakdowns
- Includes conflict detection for specified orders

## Database Schema

### Lead Model Updates
The `Lead` model now includes:
```javascript
clientNetworkHistory: [
  {
    clientNetwork: String, // required
    clientBroker: String,  // optional
    assignedAt: Date,      // auto-generated
    assignedBy: ObjectId,  // ref to User
    orderId: ObjectId      // ref to Order
  }
]
```

### Performance Indexes
New indexes added for efficient queries:
- `clientNetworkHistory.clientNetwork`
- `clientNetworkHistory.orderId`
- `clientNetworkHistory.clientNetwork + orderId` (compound)
- `clientNetworkHistory.assignedAt`

## Validation Logic

### Validation Utility
The `clientNetworkValidator.js` utility provides:
- `validateClientNetworkAssignment()`: Validates single lead assignment
- `validateBulkClientNetworkAssignment()`: Validates multiple lead assignments
- `getLeadClientNetworkSummary()`: Gets summary of lead's assignments
- `checkOrderClientNetworkConflicts()`: Checks for conflicts in an order

### Validation Flow
1. Check if lead exists
2. Determine target order ID (provided or lead's current order)
3. Search client network history for existing assignment to same network in same order
4. Return validation result with conflict information if applicable

## Error Handling

### Conflict Detection
When a conflict is detected, the system returns:
```javascript
{
  success: false,
  message: "Descriptive error message",
  data: {
    conflictingLeadIds: [/* array of lead IDs */],
    conflictingLeadNames: [/* array of lead names */],
    clientNetwork: "network name",
    orderId: "order ID"
  }
}
```

### Analytics Conflicts
The analytics endpoint can detect and report:
- Multiple assignments to same network within same order
- Leads with conflicting assignments
- Summary of conflicts by client network

## Usage Examples

### Assigning Client Network to Order
```javascript
// This will work - first time assigning to this network
PUT /api/orders/12345/assign-client-info
{
  "clientNetwork": "Network A",
  "clientBroker": "Broker 1"
}

// This will fail if any lead already assigned to Network A in this order
PUT /api/orders/12345/assign-client-info
{
  "clientNetwork": "Network A",
  "clientBroker": "Broker 2"
}
```

### Assigning Different Networks
```javascript
// This will work - different client networks in same order
PUT /api/orders/12345/assign-client-info
{
  "clientNetwork": "Network B",
  "clientBroker": "Broker 3"
}
```

### Cross-Order Assignments
```javascript
// This will work - same network in different order
PUT /api/orders/67890/assign-client-info
{
  "clientNetwork": "Network A",
  "clientBroker": "Broker 1"
}
```

## Benefits

1. **Data Integrity**: Prevents duplicate assignments within orders
2. **Audit Trail**: Complete history of all assignments
3. **Flexibility**: Allows same network assignments across different orders
4. **Analytics**: Rich reporting on assignment patterns
5. **Performance**: Optimized with proper database indexes
6. **Validation**: Comprehensive validation before assignments

## Order Creation vs Lead Assignment

### Client Network Selection in Orders
- ✅ **Preserved**: Users can still select a client network when creating an order
- 📋 **Purpose**: For organization and reference purposes only
- ⚠️ **Important**: Selecting a client network in order creation does NOT automatically assign it to leads
- 🎯 **Usage**: Helps affiliate managers organize orders by intended client network

### Lead Assignment Process
- ❌ **Removed**: Mass assignment of client networks to all leads in an order
- ✅ **Available**: Individual lead assignment using `PUT /api/leads/:id/assign-client-network`
- 🔒 **Validation**: Each assignment is validated against history to prevent duplicates within same order

## Migration Notes

- Existing leads without `clientNetworkHistory` will have empty arrays
- Current `clientNetwork`, `clientBroker`, and `client` fields are preserved
- New assignments will automatically populate the history
- The `selectedClientNetwork` field in orders is preserved for reference
- No breaking changes to existing functionality
- Orders can still be filtered/organized by selected client network 