# BNI SDLC Approvals System - Project Structure

## Directory Architecture

### Root Level Organization
```
ReplitVibe/
├── client/                 # React frontend application
├── server/                 # Express.js backend services
├── shared/                 # Shared TypeScript schemas and types
├── migrations/             # Database migration files
├── uploads/                # File storage directory
└── .amazonq/              # Amazon Q configuration and rules
```

### Frontend Structure (`client/`)
```
client/
├── public/                 # Static assets and BNI branding
│   ├── bni-logo.png       # Primary BNI logo
│   ├── bni-logo.svg       # Vector BNI logo
│   └── Logo-Bank-BNI-PNG-1024x334.png
├── src/
│   ├── components/        # Reusable UI components
│   │   └── ui/           # shadcn/ui component library
│   ├── pages/            # Page-level React components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions and configurations
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles and Tailwind imports
└── index.html            # HTML template
```

### Backend Structure (`server/`)
```
server/
├── index.ts              # Express server entry point
├── routes.ts             # API route definitions and handlers
├── auth.ts               # Authentication middleware and strategies
├── storage.ts            # Database operations and queries
├── docuseal.ts           # DocuSeal API integration
├── emailService.ts       # Email notification service
├── fileStorage.ts        # File upload and storage handling
├── db.ts                 # Database connection and configuration
├── seed.ts               # Database seeding script
├── test-db.ts            # Database connection testing
└── vite.ts               # Vite development server integration
```

### Database Layer (`migrations/`)
```
migrations/
├── meta/                 # Drizzle migration metadata
│   ├── _journal.json     # Migration history
│   └── *_snapshot.json   # Schema snapshots
├── 0000_loud_wind_dancer.sql        # Initial schema
├── 0001_pink_thunderbird.sql        # User and project tables
├── 0002_flawless_puff_adder.sql     # Document and approval tables
├── 0003_add_signature_envelopes.sql # DocuSeal integration
├── 0004_add_docuseal_fields.sql     # Enhanced DocuSeal support
├── 0005_add_project_status_approvals.sql # Status workflow
└── 0006_add_priority_columns.sql    # Priority and categorization
```

## Core Components & Relationships

### Data Model Architecture
- **User Management**: User authentication, roles, and permissions
- **Project Lifecycle**: Project creation, status progression, and governance
- **Document Management**: File uploads, versioning, and approval workflows
- **Approval System**: Sequential/parallel approval processes with digital signatures
- **Audit System**: Comprehensive logging and status history tracking

### Frontend Architecture Patterns
- **Component-Based**: Modular React components with TypeScript
- **State Management**: React Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component system
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture Patterns
- **RESTful API**: Express.js with structured route handlers
- **Database Layer**: Drizzle ORM with PostgreSQL
- **Authentication**: Passport.js with session-based auth
- **File Handling**: Multer for multipart uploads with local storage
- **External Integration**: DocuSeal API wrapper for digital signatures

### Integration Points
- **Database**: PostgreSQL via Neon serverless with connection pooling
- **File Storage**: Local filesystem with configurable cloud migration path
- **Digital Signatures**: DocuSeal API for envelope creation and webhook handling
- **Email**: Nodemailer for notification delivery
- **Session Management**: Express sessions with PostgreSQL store

## Architectural Patterns

### Full-Stack TypeScript
- Shared type definitions in `shared/schema.ts`
- End-to-end type safety from database to frontend
- Zod schemas for runtime validation and type inference

### Monorepo Structure
- Single repository with clear separation of concerns
- Shared dependencies and build configuration
- Unified development and deployment workflow

### Event-Driven Workflows
- Webhook-based integration with DocuSeal
- Status change triggers for automated workflows
- Audit logging for all state changes

### Security-First Design
- Role-based access control throughout the application
- Input validation at API boundaries
- Secure file upload with type validation
- Session-based authentication with CSRF protection