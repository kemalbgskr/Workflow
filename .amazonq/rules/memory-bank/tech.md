# BNI SDLC Approvals System - Technology Stack

## Programming Languages & Versions
- **TypeScript 5.6.3**: Primary language for both frontend and backend
- **JavaScript (ES Modules)**: Build output and configuration files
- **SQL**: Database migrations and schema definitions

## Frontend Technology Stack

### Core Framework
- **React 18.3.1**: Component-based UI library with hooks
- **Vite 5.4.20**: Fast development server and build tool
- **TypeScript**: Type-safe React development

### UI & Styling
- **Tailwind CSS 3.4.17**: Utility-first CSS framework
- **shadcn/ui**: Modern component library built on Radix UI
- **Radix UI**: Accessible, unstyled UI primitives
- **Framer Motion 11.13.1**: Animation and gesture library
- **Lucide React 0.453.0**: Icon library

### State Management & Data Fetching
- **React Query 5.60.5**: Server state management and caching
- **React Hook Form 7.55.0**: Form state management
- **Zod 3.24.2**: Schema validation and type inference

### Routing & Navigation
- **Wouter 3.3.5**: Minimalist client-side routing

## Backend Technology Stack

### Core Framework
- **Node.js**: JavaScript runtime environment
- **Express.js 4.21.2**: Web application framework
- **TypeScript 5.6.3**: Type-safe server development

### Database & ORM
- **PostgreSQL**: Primary database via Neon serverless
- **Drizzle ORM 0.39.1**: Type-safe database toolkit
- **Drizzle Kit 0.31.4**: Database migrations and introspection
- **@neondatabase/serverless 0.10.4**: Neon PostgreSQL driver

### Authentication & Security
- **Passport.js 0.7.0**: Authentication middleware
- **passport-local 1.0.0**: Local username/password strategy
- **express-session 1.18.1**: Session management
- **connect-pg-simple 10.0.0**: PostgreSQL session store

### File Handling & Storage
- **Multer 2.0.2**: Multipart form data handling
- **Node.js fs**: Local file system operations

### External Integrations
- **node-fetch 3.3.2**: HTTP client for API calls
- **nodemailer 6.9.8**: Email sending service
- **formdata-node 6.0.3**: FormData implementation for Node.js

## Development Tools & Build System

### Build & Development
- **Vite 5.4.20**: Development server and build tool
- **esbuild 0.25.0**: Fast JavaScript bundler for server builds
- **tsx 4.20.5**: TypeScript execution for development

### Code Quality
- **TypeScript 5.6.3**: Static type checking
- **ESLint**: Code linting (configured via Vite)
- **Prettier**: Code formatting (via editor integration)

### Database Tools
- **Drizzle Kit 0.31.4**: Schema management and migrations
- **PostgreSQL**: Database server and client tools

## Development Commands

### Setup & Installation
```bash
npm install              # Install all dependencies
npm run setup           # Initialize database and tables
npm run seed            # Populate database with sample data
```

### Development Workflow
```bash
npm run dev             # Start development server (client + server)
npm run build           # Build for production
npm run start           # Start production server
npm run check           # TypeScript type checking
```

### Database Operations
```bash
npm run db:push         # Push schema changes to database
npm run migrate         # Run database migrations
npm run test-db         # Test database connection
```

### Utility Scripts
```bash
npm run setup-and-run   # Complete setup and start development
npm run quick-start     # Fast development startup
npm run test-docuseal   # Test DocuSeal integration
```

## Configuration Files

### Build Configuration
- **vite.config.ts**: Vite build and development configuration
- **tsconfig.json**: TypeScript compiler configuration
- **drizzle.config.ts**: Database ORM configuration

### Styling Configuration
- **tailwind.config.ts**: Tailwind CSS configuration
- **postcss.config.js**: PostCSS processing configuration
- **components.json**: shadcn/ui component configuration

### Environment Configuration
- **.env**: Environment variables (not in version control)
- **.env.example**: Environment variable template
- **package.json**: Dependencies and scripts

## External Service Dependencies

### Required Services
- **PostgreSQL Database**: Via Neon serverless or local instance
- **DocuSeal API**: Digital signature service integration
- **SMTP Server**: Email notification delivery

### Optional Services
- **Cloud Storage**: Future migration from local file storage
- **Monitoring**: Application performance monitoring
- **Logging**: Centralized log aggregation

## Runtime Requirements

### Development Environment
- **Node.js 18+**: JavaScript runtime
- **npm**: Package manager
- **PostgreSQL 14+**: Database server
- **Git**: Version control

### Production Environment
- **Node.js 18+**: Production runtime
- **PostgreSQL 14+**: Production database
- **HTTPS**: Secure communication
- **File System Access**: Document storage
- **Network Access**: DocuSeal API and email SMTP