# Lead Management Platform (MERN Stack)

A comprehensive Lead Management Platform built with the MERN stack for managing FTD (First Time Deposit), Filler, and Cold leads with role-based access control.

## 🏗️ Architecture

### Backend (Node.js + Express + MongoDB)
- **Authentication**: JWT-based with role-based access control
- **Database**: MongoDB with Mongoose ODM
- **API**: RESTful endpoints with validation and error handling
- **Security**: Helmet, CORS, rate limiting, input validation

### Frontend (React + Redux + Material-UI)
- **State Management**: Redux Toolkit with persistence
- **UI Framework**: Material-UI (MUI) components
- **Routing**: React Router with protected routes
- **Forms**: React Hook Form with Yup validation
- **Build Tool**: Vite for fast development and optimized builds

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd FTD
```

2. **Install dependencies**
```bash
npm run install-all
```

3. **Environment Setup**
```bash
# Backend environment
cp backend/env.example backend/.env
# Edit backend/.env with your configuration
```

4. **Database Setup and Seeding**
```bash
# Seed the database with default admin user and sample data
npm run seed
```

5. **Start the application**
```bash
# Development mode (runs both frontend and backend)
npm run dev

# Or run separately:
npm run server  # Backend only
npm run client  # Frontend only
```

## 🔧 Development Scripts

```bash
# Install all dependencies
npm run install-all

# Seed database with default users and sample data
npm run seed

# Development mode
npm run dev

# Production build
npm run build

# Run tests
npm test
```

## 📊 User Roles & Permissions

### Admin
- Full system access
- User management
- View all orders and leads
- System analytics and reports

### Affiliate Manager
- Create and manage orders
- View own orders and assigned leads
- Limited user management

### Agent
- View assigned leads
- Add comments to leads
- Update lead status
- View own performance metrics

## 🗂️ Project Structure

```
FTD/
├── backend/                 # Node.js/Express backend
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Custom middleware (auth, validation)
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   └── server.js           # Main server file
├── frontend/               # React frontend (Vite)
│   ├── public/             # Static assets (fonts, images)
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── contexts/       # React contexts
│       ├── hooks/          # Custom React hooks
│       ├── layouts/        # Layout components
│       ├── pages/          # Page components
│       ├── services/       # API services
│       └── store/          # Redux store and slices
├── vite.config.js         # Vite configuration
└── package.json           # Root package.json
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Orders
- `POST /api/orders` - Create new order (pull leads)
- `GET /api/orders` - Get orders with filtering
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Cancel order

### Leads
- `GET /api/leads` - Get all leads (Admin only)
- `GET /api/leads/assigned` - Get assigned leads (Agent)
- `PUT /api/leads/:id/comment` - Add comment to lead
- `PUT /api/leads/:id/status` - Update lead status

### Users
- `GET /api/users` - Get all users (Admin)
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:id` - Update user (Admin)
- `PUT /api/users/:id/permissions` - Update permissions (Admin)

## 🗄️ Database Models

### User
- Authentication and role management
- Permissions system
- Profile information

### Lead
- **Lead Types**: 
  - FTD (First Time Deposit): Leads who made their first deposit
  - Filler: Standard leads with basic information
  - Cold: Leads with minimal interaction history
  - Live: Active leads currently in engagement
- **Contact Information**:
  - New and previous email tracking
  - New and previous phone tracking
  - Country and location data
- **Personal Details**:
  - Name (First/Last)
  - Gender
  - Date of Birth
  - SIN (for FTD leads)
  - Address information
- **Business Information**:
  - Client
  - Client Broker
  - Client Network
  - Source tracking
- **Status Management**:
  - Status tracking (Active, Contacted, Converted, Inactive)
  - Priority levels (High, Medium, Low)
- **Assignment System**:
  - Agent assignment
  - Assignment history
- **Document Verification**:
  - Document uploads for FTD verification
  - Document status tracking
- **Social Media Integration**:
  - Linked profiles (Facebook, LinkedIn, Twitter, etc.)
- **Comments and History**:
  - Timestamped comment system
  - Activity tracking
  - Interaction history

### Order
- Lead requests and fulfillment
- Requester tracking
- Status management

### AgentPerformance
- Daily performance metrics
- Call tracking
- Earnings and penalties

## 🔄 Core Business Logic

### Lead Pulling System
When an order is created:
1. Validates request parameters
2. Uses MongoDB transactions for atomicity
3. Queries available leads by type and status
4. Marks leads as assigned
5. Creates order record with fulfilled counts

### Role-Based Access
- Middleware validates JWT tokens
- Role-specific route protection
- Data filtering based on user role
- Permission-based feature access

## 🚦 Development Sprints Status

### Sprint 1: Backend Foundation ✅ **COMPLETED**
- [x] Mongoose models with proper schemas
- [x] JWT authentication middleware
- [x] Role-based access control
- [x] Basic API structure with security

### Sprint 2: Core API & Logic ✅ **COMPLETED**
- [x] Order creation with transactional lead pulling
- [x] Complete CRUD operations for all entities
- [x] Advanced filtering and pagination
- [x] Input validation and error handling

### Sprint 3: Frontend Foundation ✅ **COMPLETED**
- [x] React setup with Redux Toolkit
- [x] Authentication flow with JWT
- [x] Protected routing system
- [x] Complete MainLayout with navigation

### Sprint 4: MVP - Order Management ✅ **COMPLETED**
- [x] Material-UI integration
- [x] Role-based navigation
- [x] Order creation form implementation
- [x] Lead data table with filtering
- [x] Basic dashboard components

### Sprint 5: Agent & Admin Views ✅ **COMPLETED**
- [x] Agent dashboard for assigned leads
- [x] Comment system for leads
- [x] Admin user management interface
- [x] Performance analytics with charts
- [x] Complete dashboard with role-based content

## 🎯 Current Implementation Status

**Overall Progress: 100% Complete** 🎉

The project is now fully implemented with all planned features:

- ✅ **Backend**: Fully implemented with comprehensive API endpoints
- ✅ **Database Models**: Complete with proper indexing and relationships  
- ✅ **API Endpoints**: All RESTful routes implemented with validation and error handling
- ✅ **Authentication**: JWT-based with role-based access control
- ✅ **Frontend Foundation**: React + Redux + Material-UI properly set up
- ✅ **UI Components**: All page components fully implemented with modern UX
- ✅ **Lead Management**: Complete with assignment, commenting, and filtering
- ✅ **Order Management**: Full order creation and tracking system
- ✅ **User Management**: Comprehensive admin interface for user management
- ✅ **Performance Analytics**: Charts, metrics, and role-based dashboards
- ✅ **Dashboard**: Role-based content with real-time metrics and activity feeds

**Status**: Ready for production deployment! All core features implemented and functional.

## 🔑 Default Login Credentials

After running the database seeding script (`npm run seed`), you can log in with these default accounts:

- **Admin**: `admin@leadmanagement.com` / `admin123`
- **Manager**: `manager@leadmanagement.com` / `manager123`  
- **Agent 1**: `agent1@leadmanagement.com` / `agent123`
- **Agent 2**: `agent2@leadmanagement.com` / `agent123`

⚠️ **Security Notice**: Please change these default passwords immediately after first login!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.
