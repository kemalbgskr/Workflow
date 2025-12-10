# BNI SDLC Approvals System - Development Guidelines

## Code Quality Standards

### TypeScript Usage
- **Strict Type Safety**: All files use TypeScript with strict mode enabled
- **Interface Definitions**: Comprehensive interfaces for all data structures (IStorage, User, Project, Document, etc.)
- **Type Inference**: Leverage Zod schemas for runtime validation and type inference
- **Generic Types**: Use generic types for reusable components and functions
- **Optional Chaining**: Consistent use of optional chaining (`?.`) for safe property access

### Naming Conventions
- **Variables**: camelCase for variables and functions (`projectId`, `fetchDocuments`)
- **Constants**: UPPER_SNAKE_CASE for constants (`SIDEBAR_COOKIE_NAME`, `SIDEBAR_WIDTH`)
- **Components**: PascalCase for React components (`ProjectDetail`, `DocumentRow`)
- **Files**: PascalCase for component files, camelCase for utility files
- **Database Tables**: snake_case for table names (`project_status_requests`, `approval_rounds`)
- **API Endpoints**: kebab-case for URL paths (`/api/status-changes`, `/api/projects/:id/approvers`)

### Code Formatting Patterns
- **Import Organization**: Grouped imports (external libraries, internal components, utilities)
- **Destructuring**: Consistent destructuring of props and objects
- **Arrow Functions**: Prefer arrow functions for inline callbacks and short functions
- **Template Literals**: Use template literals for string interpolation
- **Async/Await**: Prefer async/await over Promise chains

## Architectural Patterns

### Database Layer (Drizzle ORM)
- **Schema Definition**: Centralized schema definitions in `shared/schema.ts`
- **Type Safety**: Generated types from schema using `$inferSelect` and `$inferInsert`
- **Relationships**: Proper foreign key relationships with cascade deletes
- **Validation**: Zod schemas for runtime validation derived from database schema
- **Query Patterns**: Use of Drizzle query builders with proper joins and filtering

```typescript
// Example pattern from storage.ts
const result = await db.select({
  id: documents.id,
  filename: documents.filename,
  createdByName: users.name
})
.from(documents)
.leftJoin(users, eq(documents.createdById, users.id))
.where(eq(documents.projectId, projectId))
.orderBy(desc(documents.createdAt));
```

### API Route Structure
- **RESTful Design**: Consistent REST patterns for CRUD operations
- **Error Handling**: Standardized error responses with appropriate HTTP status codes
- **Authentication**: Role-based access control with middleware (`requireRole`)
- **Validation**: Request validation using Zod schemas
- **Response Format**: Consistent JSON response structure

```typescript
// Example pattern from routes.ts
app.post("/api/documents/:id/approvers", requireRole(['ADMIN']), async (req, res) => {
  try {
    const data = schema.parse(req.body);
    const result = await storage.operation(data);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ error: "Operation failed" });
  }
});
```

### React Component Patterns
- **Functional Components**: All components use functional components with hooks
- **Custom Hooks**: Centralized logic in custom hooks (`useAuth`, `useSidebar`)
- **State Management**: React Query for server state, useState for local state
- **Props Interface**: Explicit TypeScript interfaces for component props
- **Conditional Rendering**: Consistent patterns for conditional UI elements

```typescript
// Example pattern from ProjectDetail.tsx
const { toast } = useToast();
const { canUploadDocument, canConfigureApprovers } = useAuth();
const [project, setProject] = useState<Project | null>(null);

const updateStatusMutation = useMutation({
  mutationFn: (newStatus: string) => api.updateProjectStatus(params?.id || "", newStatus),
  onSuccess: (updatedProject) => {
    setProject(updatedProject);
    toast({ title: "Success", description: "Status updated" });
  }
});
```

## Error Handling Standards

### Backend Error Handling
- **Try-Catch Blocks**: Comprehensive error handling in all async operations
- **Logging**: Detailed console logging for debugging with context
- **Error Propagation**: Proper error propagation with meaningful messages
- **Status Codes**: Appropriate HTTP status codes (400, 401, 403, 404, 500)
- **Graceful Degradation**: Fallback values and safe defaults

### Frontend Error Handling
- **Toast Notifications**: User-friendly error messages via toast system
- **Loading States**: Proper loading and error states for async operations
- **Fallback UI**: Safe fallbacks for missing or failed data
- **Error Boundaries**: Component-level error handling where appropriate

## Security Patterns

### Authentication & Authorization
- **Session-Based Auth**: Passport.js with session management
- **Role-Based Access**: Middleware functions for role checking
- **Route Protection**: Protected routes with authentication checks
- **Permission Checks**: UI-level permission checks using custom hooks

### Data Validation
- **Input Sanitization**: Zod schema validation for all inputs
- **File Upload Security**: MIME type validation and file size limits
- **SQL Injection Prevention**: Parameterized queries via Drizzle ORM
- **XSS Prevention**: Proper data escaping and sanitization

## Performance Optimization

### Database Optimization
- **Efficient Queries**: Optimized joins and selective field retrieval
- **Indexing**: Proper database indexes on frequently queried fields
- **Connection Pooling**: Database connection management
- **Batch Operations**: Bulk operations where appropriate

### Frontend Optimization
- **React Query Caching**: Intelligent caching of server state
- **Component Memoization**: Strategic use of React.memo and useMemo
- **Lazy Loading**: Code splitting and lazy component loading
- **Optimistic Updates**: Immediate UI updates with rollback on failure

## Testing Patterns

### Backend Testing
- **Unit Tests**: Individual function and method testing
- **Integration Tests**: API endpoint testing with database
- **Mock Services**: Mocking external services (DocuSeal, email)
- **Error Scenario Testing**: Testing error conditions and edge cases

### Frontend Testing
- **Component Testing**: Individual component behavior testing
- **User Interaction Testing**: Testing user workflows and interactions
- **API Integration Testing**: Testing frontend-backend integration
- **Accessibility Testing**: Ensuring WCAG compliance

## Documentation Standards

### Code Documentation
- **JSDoc Comments**: Comprehensive function and class documentation
- **Inline Comments**: Explanatory comments for complex logic
- **README Files**: Clear setup and usage instructions
- **API Documentation**: Endpoint documentation with examples

### Type Documentation
- **Interface Documentation**: Clear descriptions of data structures
- **Schema Documentation**: Database schema with relationships
- **Component Props**: Documented component interfaces
- **Hook Documentation**: Custom hook usage and return values

## Development Workflow

### Git Practices
- **Commit Messages**: Descriptive commit messages with context
- **Branch Naming**: Feature branches with descriptive names
- **Pull Requests**: Code review process with clear descriptions
- **Version Control**: Semantic versioning for releases

### Code Review Standards
- **Type Safety**: Ensure all code maintains type safety
- **Error Handling**: Verify proper error handling implementation
- **Performance**: Review for potential performance issues
- **Security**: Check for security vulnerabilities
- **Documentation**: Ensure adequate documentation coverage

## Common Patterns & Idioms

### Async Operations
```typescript
// Standard async/await pattern with error handling
const fetchData = async () => {
  try {
    const response = await fetch('/api/endpoint');
    if (!response.ok) throw new Error('Request failed');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};
```

### State Updates
```typescript
// Immutable state updates
setProject(prev => ({ ...prev, status: newStatus }));

// Array updates
setDocuments(prev => prev.filter(doc => doc.id !== deletedId));
```

### Conditional Rendering
```typescript
// Permission-based rendering
{canUploadDocument() && (
  <Button onClick={handleUpload}>Upload</Button>
)}

// Loading states
{isLoading ? <Skeleton /> : <Content data={data} />}
```

### Form Handling
```typescript
// React Hook Form with Zod validation
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: initialValues
});

const onSubmit = async (data) => {
  try {
    await submitData(data);
    toast({ title: "Success" });
  } catch (error) {
    toast({ title: "Error", variant: "destructive" });
  }
};
```

These guidelines ensure consistency, maintainability, and quality across the BNI SDLC Approvals System codebase.