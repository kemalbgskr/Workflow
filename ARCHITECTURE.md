# BNI SDLC Approvals - Architecture Overview

## System Architecture

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript)"
        UI[User Interface]
        Auth[Authentication]
        Dashboard[Dashboard]
        Projects[Project Management]
        Docs[Document Management]
        Approvals[Approval Workflows]
    end

    subgraph "Backend (Express.js + TypeScript)"
        API[REST API]
        AuthM[Auth Middleware]
        Storage[Storage Layer]
        DocuSeal[DocuSeal Service]
        Email[Email Service]
    end

    subgraph "Database (PostgreSQL)"
        Users[Users Table]
        ProjectsDB[Projects Table]
        DocsDB[Documents Table]
        ApprovalsDB[Approvals Table]
        Audit[Audit Logs]
    end

    subgraph "External Services"
        DS[DocuSeal API]
        SMTP[Email SMTP]
        FileStore[File Storage]
    end

    UI --> API
    Auth --> AuthM
    Dashboard --> API
    Projects --> API
    Docs --> API
    Approvals --> API

    API --> Storage
    API --> DocuSeal
    API --> Email

    Storage --> Users
    Storage --> ProjectsDB
    Storage --> DocsDB
    Storage --> ApprovalsDB
    Storage --> Audit

    DocuSeal --> DS
    Email --> SMTP
    Storage --> FileStore
```

## SDLC Status Flow

```mermaid
stateDiagram-v2
    [*] --> InitiativeSubmitted: Create Initiative
    InitiativeSubmitted --> DemandPrioritized: Prioritize
    DemandPrioritized --> InitiativeApproved: Approve FS & BRD
    InitiativeApproved --> KickOff: Start Project
    KickOff --> ARF: Upload Project Charter
    ARF --> DeploymentPreparation: Complete ARF
    DeploymentPreparation --> RCB: Prepare Deployment
    RCB --> Deployment: Review Complete
    Deployment --> PTR: Deploy System
    PTR --> GoLive: Post Testing
    GoLive --> [*]: Project Complete

    note right of InitiativeApproved
        Auto-created when FS & BRD
        are digitally signed
    end note

    note right of KickOff
        Requires Project Charter
        upload and approval
    end note

    note right of ARF
        Requires ARF Form
        upload and approval
    end note
```

## Document Approval Flow

```mermaid
sequenceDiagram
    participant User as Requester
    participant System as BNI System
    participant Approver as Approver
    participant DocuSeal as DocuSeal API
    participant Email as Email Service

    User->>System: Upload Document (FS/BRD)
    System->>System: Store Document
    User->>System: Configure Approvers
    System->>System: Create Approval Round
    User->>System: Send for Signature
    System->>DocuSeal: Create Envelope
    DocuSeal-->>System: Return Envelope ID & URL
    System->>Email: Send Approval Notification
    Email->>Approver: Email with Signing Link
    Approver->>DocuSeal: Access Signing Interface
    Approver->>DocuSeal: Complete Signature
    DocuSeal->>System: Webhook: envelope.completed
    System->>System: Update Document Status
    System->>System: Check All Approvers Complete
    alt All Approved
        System->>System: Mark Document as SIGNED
        System->>System: Auto-create Project (if FS/BRD)
        System->>Email: Send Completion Notification
    else Some Rejected
        System->>System: Mark Document as REJECTED
        System->>Email: Send Rejection Notification
    end
```

## Database Schema Overview

```mermaid
erDiagram
    USERS {
        uuid id PK
        string name
        string email UK
        string password
        string role
        string department
        timestamp created_at
        timestamp updated_at
    }

    PROJECTS {
        uuid id PK
        string code UK
        string title
        string description
        string type
        string category
        string methodology
        string status
        uuid owner_id FK
        timestamp created_at
        timestamp updated_at
    }

    DOCUMENTS {
        uuid id PK
        uuid project_id FK
        string type
        string filename
        string storage_key
        string lifecycle_step
        integer version
        string status
        uuid created_by_id FK
        timestamp created_at
        timestamp updated_at
    }

    APPROVAL_ROUNDS {
        uuid id PK
        uuid document_id FK
        string mode
        integer order_index
        string status
        timestamp created_at
    }

    APPROVERS {
        uuid id PK
        uuid round_id FK
        uuid user_id FK
        string email
        integer order_index
        boolean must_sign
        string status
        timestamp signed_at
        timestamp created_at
    }

    SIGNATURE_ENVELOPES {
        uuid id PK
        uuid document_id FK
        string docuseal_template_id
        string docuseal_submission_id
        string docuseal_envelope_id
        string docuseal_url
        string status
        timestamp created_at
        timestamp completed_at
    }

    AUDIT_LOGS {
        uuid id PK
        uuid actor_id FK
        string action
        string target_type
        string target_id
        string metadata
        timestamp created_at
    }

    USERS ||--o{ PROJECTS : owns
    PROJECTS ||--o{ DOCUMENTS : contains
    DOCUMENTS ||--o{ APPROVAL_ROUNDS : has
    APPROVAL_ROUNDS ||--o{ APPROVERS : includes
    DOCUMENTS ||--o{ SIGNATURE_ENVELOPES : signs
    USERS ||--o{ APPROVERS : approves
    USERS ||--o{ AUDIT_LOGS : performs
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Authentication"
            Login[Login Form]
            Session[Session Management]
            Passport[Passport.js Strategy]
        end

        subgraph "Authorization"
            RBAC[Role-Based Access Control]
            Guards[Route Guards]
            Permissions[Permission Checks]
        end

        subgraph "Data Protection"
            Validation[Input Validation - Zod]
            Sanitization[Data Sanitization]
            Encryption[Session Encryption]
        end

        subgraph "File Security"
            Upload[File Upload Validation]
            Storage[Secure File Storage]
            Access[Controlled File Access]
        end

        subgraph "Audit & Monitoring"
            Logging[Comprehensive Logging]
            Trails[Audit Trails]
            Monitoring[Activity Monitoring]
        end
    end

    Login --> Session
    Session --> Passport
    Passport --> RBAC
    RBAC --> Guards
    Guards --> Permissions
    Permissions --> Validation
    Validation --> Sanitization
    Sanitization --> Encryption
    Upload --> Storage
    Storage --> Access
    Access --> Logging
    Logging --> Trails
    Trails --> Monitoring
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Application Layer"
            LB[Load Balancer]
            App1[App Instance 1]
            App2[App Instance 2]
        end

        subgraph "Database Layer"
            PG[PostgreSQL Primary]
            PGR[PostgreSQL Replica]
        end

        subgraph "Storage Layer"
            FS[File System Storage]
            Backup[Backup Storage]
        end

        subgraph "External Services"
            DocuSeal[DocuSeal API]
            SMTP[SMTP Service]
        end

        subgraph "Monitoring"
            Logs[Log Aggregation]
            Metrics[Application Metrics]
            Alerts[Alert System]
        end
    end

    LB --> App1
    LB --> App2
    App1 --> PG
    App2 --> PG
    PG --> PGR
    App1 --> FS
    App2 --> FS
    FS --> Backup
    App1 --> DocuSeal
    App2 --> DocuSeal
    App1 --> SMTP
    App2 --> SMTP
    App1 --> Logs
    App2 --> Logs
    Logs --> Metrics
    Metrics --> Alerts
```

## Key Design Decisions

### 1. Technology Choices
- **TypeScript**: End-to-end type safety from database to UI
- **Drizzle ORM**: Type-safe database operations with excellent TypeScript integration
- **React Query**: Efficient server state management with caching
- **shadcn/ui**: Consistent, accessible component library
- **Wouter**: Lightweight routing for better performance

### 2. Architecture Patterns
- **Layered Architecture**: Clear separation between presentation, business logic, and data layers
- **Repository Pattern**: Abstracted data access through storage interface
- **Command Query Separation**: Separate read and write operations
- **Event-Driven**: Webhook-based integration with external services

### 3. Security Considerations
- **Defense in Depth**: Multiple security layers from frontend to database
- **Principle of Least Privilege**: Role-based access with minimal required permissions
- **Audit Everything**: Comprehensive logging of all user actions
- **Secure by Default**: Safe defaults for all configuration options

### 4. Scalability Considerations
- **Stateless Design**: Session data stored in database for horizontal scaling
- **Database Optimization**: Proper indexing and query optimization
- **File Storage**: Configurable storage backend for cloud migration
- **Caching Strategy**: React Query for client-side caching, database query optimization

### 5. Integration Strategy
- **API-First**: RESTful API design for potential future integrations
- **Webhook Support**: Real-time updates from external services
- **Modular Services**: Loosely coupled services for easier maintenance
- **Configuration-Driven**: Environment-based configuration for different deployments