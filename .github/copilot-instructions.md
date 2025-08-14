<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Booking Microservice - Copilot Instructions

This is a multi-tenant booking microservice built with SvelteKit 2.0, Svelte 5, TypeScript, and MySQL.

## Architecture Guidelines

1. **Multi-tenant Design**: All database operations must include tenant isolation using `tenant_id`
2. **API Security**: All API endpoints require either API key authentication or JWT token validation
3. **Database Access**: Use the connection utilities in `src/lib/server/database.ts`
4. **Type Safety**: Maintain strict TypeScript types defined in `src/lib/types.ts`

## Code Style Preferences

- Use TypeScript for all new files
- Follow SvelteKit's file-based routing conventions
- Implement proper error handling with try-catch blocks
- Use Zod for input validation when adding new endpoints
- Maintain consistent API response format using `ApiResponse<T>` type

## Database Guidelines

- Always include `tenant_id` in WHERE clauses for data isolation
- Use UUIDs for all primary keys
- Include proper indexes for performance
- Implement soft deletes where appropriate (using `is_active` flags)

## API Design Patterns

- RESTful endpoints following `/api/resource/[id]` pattern
- Consistent error responses with `success`, `error`, and `message` fields
- Support pagination with `limit` and `offset` parameters
- Include proper HTTP status codes

## Security Considerations

- Validate tenant access on every request
- Hash passwords with bcrypt (salt rounds: 12)
- Use JWT tokens with reasonable expiration times
- Sanitize user inputs to prevent SQL injection

## Testing Approach

- Write integration tests for API endpoints
- Test multi-tenant isolation
- Validate booking conflict detection
- Test authentication and authorization flows
