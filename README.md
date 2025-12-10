# BNI SDLC Approvals System

A full-stack web application designed to digitize and streamline the Software Development Life Cycle (SDLC) approval process for Bank Negara Indonesia (BNI). This internal enterprise tool replaces manual approval workflows with an automated, trackable digital system.

## Features

### Core Functionality
- **Digital Initiative Creation**: Streamlined wizard for creating new SDLC projects
- **Document Management**: Upload, version control, and approval of project documents
- **Approval Workflows**: Configurable sequential/parallel approval processes
- **Digital Signatures**: Integration with DocuSeal for legally binding e-signatures
- **Status Tracking**: Real-time project status updates with timeline visualization
- **Audit Trails**: Comprehensive logging of all actions and status changes

### User Management
- **Role-Based Access**: Different permission levels (Admin, Approver, Initiator)
- **Authentication**: Secure login with session management
- **User Administration**: Comprehensive user management interface

### Dashboard & Analytics
- **Executive Dashboard**: High-level metrics and project overview
- **Personal Workspaces**: Individual dashboards for assigned tasks
- **Progress Tracking**: Visual timeline showing approval flow progress

## Technology Stack

### Frontend
- **React 18.3.1** with TypeScript
- **Vite 5.4.20** for development and building
- **Tailwind CSS 3.4.17** for styling
- **shadcn/ui** component library
- **Wouter 3.3.5** for routing
- **React Query 5.60.5** for state management

### Backend
- **Node.js** with Express.js 4.21.2
- **TypeScript 5.6.3** for type safety
- **Drizzle ORM 0.39.1** with PostgreSQL
- **Passport.js 0.7.0** for authentication
- **Multer 2.0.2** for file uploads

### Database & Storage
- **PostgreSQL** via Neon serverless
- **Local file storage** with configurable cloud migration
- **Drizzle Kit 0.31.4** for migrations

### External Integrations
- **DocuSeal API** for digital signatures
- **Nodemailer** for email notifications (optional)

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (or Neon account)
- DocuSeal API account (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ReplitVibe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server
   NODE_ENV=development
   PORT=5000
   APP_URL=http://localhost:5000
   
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/bni_sdlc
   
   # Session
   SESSION_SECRET=your-secret-key-change-in-production
   
   # DocuSeal (optional)
   DOCUSEAL_API_BASE=https://api.docuseal.co
   DOCUSEAL_API_KEY=your-api-key
   DOCUSEAL_WEBHOOK_SECRET=your-webhook-secret
   
   # Email (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   ```

4. **Database Setup**
   ```bash
   npm run setup
   ```

5. **Seed Database (optional)**
   ```bash
   npm run seed
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run check` - TypeScript type checking

### Database
- `npm run setup` - Initialize database and tables
- `npm run seed` - Populate database with sample data
- `npm run db:push` - Push schema changes to database
- `npm run migrate` - Run database migrations
- `npm run test-db` - Test database connection

### Utilities
- `npm run setup-and-run` - Complete setup and start
- `npm run quick-start` - Fast development startup

## Project Structure

```
ReplitVibe/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utility functions
│   └── public/            # Static assets
├── server/                # Express.js backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API route definitions
│   ├── auth.ts           # Authentication logic
│   ├── storage.ts        # Database operations
│   ├── docuseal.ts       # DocuSeal integration
│   └── emailService.ts   # Email notifications
├── shared/               # Shared TypeScript schemas
├── migrations/           # Database migrations
└── uploads/             # File storage directory
```

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id/status` - Update project status
- `DELETE /api/projects/:id` - Delete project

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document details
- `POST /api/documents/:id/approvers` - Configure approvers
- `POST /api/documents/:id/approve` - Approve document
- `POST /api/documents/:id/reject` - Reject document

### Approvals
- `GET /api/approvals` - Get pending approvals
- `GET /api/approvals/completed` - Get completed approvals
- `POST /api/approvals/:id/approve` - Approve item
- `POST /api/approvals/:id/decline` - Decline item

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Webhooks
- `POST /api/webhooks/docuseal` - DocuSeal webhook endpoint

## SDLC Status Flow

The system implements the following status progression:

```
Initiative Submitted → Demand Prioritized → Initiative Approved → 
Kick Off → ARF → Deployment Preparation → RCB → Deployment → PTR → Go Live
```

## Document Types

- **FS (Feasibility Study)** - Required at Initiative stage
- **BRD (Business Requirements Document)** - Required at Initiative stage  
- **Project Charter** - Required at Kick Off stage
- **ARF (Architecture Review Form)** - Required at ARF stage
- **FSD (Functional Specification Document)** - Optional during delivery

## Security Features

- Session-based authentication with secure cookies
- Role-based access control (RBAC)
- Input validation with Zod schemas
- File upload security with type validation
- Audit logging for all actions
- CSRF protection for state-changing operations

## Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Ensure all production environment variables are set:
- `NODE_ENV=production`
- `DATABASE_URL` - Production database connection
- `SESSION_SECRET` - Strong secret for session encryption
- `DOCUSEAL_API_KEY` - Production DocuSeal API key

### Requirements
- Node.js 18+
- PostgreSQL 14+
- File system access for document storage
- HTTPS for secure authentication

## Development Guidelines

### Code Quality
- TypeScript strict mode enabled
- ESLint for code linting
- Prettier for code formatting
- Comprehensive type definitions with Drizzle ORM

### Testing
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end tests with Cypress (planned)

### Contributing
1. Follow existing code style and patterns
2. Add appropriate TypeScript types
3. Include error handling
4. Update documentation for new features
5. Test thoroughly before submitting

## Troubleshooting

### Common Issues

**Database Connection Failed**
- Verify DATABASE_URL is correct
- Ensure PostgreSQL is running
- Check network connectivity

**File Upload Issues**
- Verify uploads/ directory exists and is writable
- Check file size limits in server configuration
- Ensure proper MIME type validation

**DocuSeal Integration**
- Verify API key is valid
- Check webhook URL is accessible
- Ensure proper SSL certificate for webhooks

**Email Notifications Not Working**
- Verify SMTP configuration
- Check email credentials
- Ensure less secure app access is enabled (Gmail)

### Logs
Application logs are output to console. In production, consider using a logging service like Winston or similar.

## License

This project is proprietary software developed for Bank Negara Indonesia (BNI).

## Support

For technical support or questions, please contact the development team or create an issue in the project repository.