# Uplevl Project - Agent Rules

This file contains consolidated rules and guidelines for AI coding assistants working on the Uplevl Demo project.

## Project Overview

You are an expert full-stack web developer focused on producing clear, readable Next.js code. This project uses:

- **Next.js 15** with App Router
- **React 19** with React Compiler
- **TypeScript 5.9**
- **TailwindCSS 4**
- **Biome** for linting and formatting
- **Drizzle ORM** with PostgreSQL (Supabase)
- **Sentry** for error tracking and monitoring
- **PostHog** for analytics and feature flags
- **Inngest** for background jobs
- **Hono** for API routing

## Code Style Guidelines

### General Principles

- **Focus on readability** over performance optimization
- Follow the user's requirements carefully & to the letter
- Write correct, up-to-date, bug-free, fully functional code
- Leave NO todos, placeholders or missing pieces
- Be concise and minimize prose
- If you don't know the answer, say so instead of guessing
- Never hallucinate API keys - always use environment variables

### Function and Component Style

- Prefer **function declarations** over expressions when defining functions inside React components and everywhere else in the codebase.
- Use **arrow functions only** for inline callbacks (event handlers, `.map()` calls)
- Apply **guard clauses** to simplify logic and reduce nesting
- Use **descriptive variable and function names** - avoid vague names like `data`, `info`, `handleThing`
- Prefer **named exports** over default exports unless there's a clear reason otherwise (e.g. page and API routes in Next.js)
- Use **explicit return types** on exported functions to improve readability

### Documentation and Comments

- Write clear **JSDoc blocks** for all public functions and exported utilities
- Describe purpose, expected behavior, and edge cases
- **Do not document types** in JSDoc - TypeScript handles this
- Only use `@param` or `@returns` to explain behavior or purpose
- Use **inline comments** to describe intent or non-obvious implementation details
- Write for the "future you" or another developer

### SOLID Principles

- Adhere to **SOLID principles** where applicable
- Focus especially on Single Responsibility and Dependency Inversion
- Apply **DRY (Don't Repeat Yourself)** to reduce duplication

## Next.js Specific Guidelines

### App Router Patterns

- Use App Router with proper file conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`)
- Organize routes using the `app/` directory structure with proper nested layouts
- Use Metadata API for SEO (`generateMetadata` function or `metadata` export)
- Handle loading and error states with dedicated files

### Server vs Client Components

- **Distinguish Server vs Client Components**:
  - Use `"use client"` directive only when necessary (forms, event handlers, browser APIs, state)
  - Keep Server Components as the default for better performance and SEO
  - Fetch data in Server Components when possible using `async` functions
- Minimize usage of client components to small, isolated components
- Always add loading and error states to data fetching components

### Component Naming

- Always use **kebab-case** for component names (e.g., `my-component.tsx`)
- Use semantic HTML elements where possible

## JSX & Component Guidelines

### Structure and Organization

- Split large components into logical sections with **inline comments**
- Avoid deeply nested JSX - break out complex logic into **subcomponents** or helper functions
- Use **destructuring** in function arguments and hooks for readability
- Keep **effect hooks** (`useEffect`, `useLayoutEffect`) clean and focused
- Extract side-effect logic into separate functions when possible

### TypeScript Integration

- Use **TypeScript interfaces** for all component props and return types for public functions
- Use **TypeScript interfaces** derived from Zod schemas for type safety
- Implement proper **error boundaries** and loading states

## Data Fetching & State Management

### Server State

- Use **TanStack Query** (`@tanstack/react-query`) for all server state management with proper query keys
- Use **Hono client** (`useApi()` hook) for type-safe API communication
- Use **Drizzle ORM** queries in service functions, accessed via Hono API routes
- **No server actions** - all mutations go through TanStack Query + Hono API routes

### Client State

- Use **Zustand** for client-side state that needs to be shared across components

### API Communication Patterns

- Create custom hooks that combine `useApi()` with `useQuery` for data fetching
- Use `useQuery` for GET operations with proper query keys (e.g., `["post-results", postId]`)
- Use direct API calls via `useApi()` for mutations (POST, PUT, DELETE)
- Leverage Hono's type safety for end-to-end type checking from API routes to client

### Hono Client Usage Guidelines

- Always use the `useApi()` hook to get the type-safe Hono client
- Structure API calls as: `api.{resource}["{param}"].$get|$post|$put|$delete({ param, json, query })`
- Use Zod validators (`@hono/zod-validator`) in API routes for request validation
- Keep API routes organized in `src/server/routes/` with clear resource-based naming
- Export the main app type (`AppType`) from `src/server/app.ts` for client type inference

## Styling & UI Guidelines

### TailwindCSS

- Use **TailwindCSS** for styling with consistent design tokens
- Keep styling **responsive-first** with mobile-first breakpoints
- Use **CSS-in-JS** (via Tailwind) rather than separate CSS files for component-specific styles

### Component Libraries

- Leverage **Radix UI** components as the foundation for custom UI components
- Use **class-variance-authority (CVA)** for component variants
- Use **tailwind-merge** for conditional classes

## Form Handling

- Use **React Hook Form** with **Zod** validation for all forms
- Handle form submissions via **direct API calls** using the `useApi()` hook
- Combine React Hook Form with TanStack Query patterns for mutations when needed
- Provide clear **validation feedback** and loading states during form submission
- Use `useFormState()` to access submission state for loading indicators

## File Organization

- Group related files in **feature-based directories** under `src/components/features/`
- Keep **utility functions** in `src/lib/` with clear, single-purpose modules
- Place **database schemas** in `src/database/schema.ts` with proper relations

## Commit Message Rules

### Format

All commit messages must follow this format:

```text
<type>: <description>
```

### Type Prefixes

- `feat:` - New features or functionality
- `refactor:` - Code refactoring (no functional changes)
- `fix:` - Bug fixes
- `chore:` - Maintenance tasks, dependencies, build processes

### Core Principles

1. **Keep it simple** - Short, clear, and easy to read
2. **Focus on the topic** - Describe overall purpose rather than listing individual changes
3. **Consider the branch name** - Use branch context for the overall goal
4. **Single line only** - No multi-line descriptions or body text
5. **Lowercase** - All text must be lowercase
6. **Present tense** - Use present tense (e.g., "add feature" not "added feature")
7. **No period** - Don't end with a period

### Examples

✅ **Good:**

- `feat: add user authentication`
- `fix: resolve login errors`
- `refactor: simplify data fetching`
- `chore: update dependencies`

❌ **Bad:**

- `feat: Add user authentication` (capitalized)
- `fix: resolved login button not working` (past tense)
- `refactor: simplify user data fetching.` (ends with period)
- `feat: add user authentication, update login form, fix validation errors` (too detailed)

### Special Rules

- Don't use migration names in commit messages (they're random and don't reflect changes)
- If changes reflect multiple types, use `feat:` as the fallback
- ClickUp ticket IDs are automatically prepended by pre-commit hooks

## Sentry Integration

### Exception Handling

- Use `Sentry.captureException(error)` to capture exceptions in try-catch blocks
- Import Sentry using `import * as Sentry from "@sentry/nextjs"`

### Tracing and Performance

Create spans for meaningful actions like button clicks, API calls, and function calls:

```typescript
// Component actions
function handleButtonClick() {
  Sentry.startSpan(
    {
      op: "ui.click", 
      name: "Test Button Click",
    },
    (span) => {
      span.setAttribute("config", value);
      span.setAttribute("metric", metric);
      doSomething();
    },
  );
}

// API calls
async function fetchUserData(userId: string) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      return response.json();
    },
  );
}
```

### Logging

- Enable logging with `Sentry.init({ _experiments: { enableLogs: true } })`
- Use structured logging with `const { logger } = Sentry`
- Use `logger.fmt` template literal for variables in logs

```typescript
logger.trace("Starting database connection", { database: "users" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("Updated profile", { profileId: 345 });
logger.warn("Rate limit reached", { endpoint: "/api/results/" });
logger.error("Failed to process payment", { orderId: "order_123" });
```

### Configuration

- Client-side initialization: `instrumentation-client.ts`
- Server initialization: `sentry.server.config.ts`  
- Edge initialization: `sentry.edge.config.ts`
- Don't repeat initialization in other files

## PostHog Integration & Analytics

### API Keys

- Never hallucinate API keys
- Always use API keys from environment variables

### Feature Flags

- Use feature flags in as few places as possible to avoid undefined behavior
- Make flag names clear and descriptive
- Use TypeScript enums for flag names, or const objects in JavaScript
- Use `UPPERCASE_WITH_UNDERSCORE` naming convention
- Gate flag-dependent code with validation checks

```typescript
enum FeatureFlags {
  NEW_DASHBOARD = "NEW_DASHBOARD",
  ENHANCED_SEARCH = "ENHANCED_SEARCH",
}
```

### Custom Properties

- Use enums or const objects for properties referenced in multiple files or callsites
- Follow consistent naming conventions
- Consult with developers before creating new event/property names

### Naming Conventions

- Be careful with event and property name changes (can break reporting)
- Consistency is essential across the project
- Consider existing context outside the project

## Error Handling and Logging

- Implement error handling and error logging throughout the application
- Use proper error boundaries for React components
- Log meaningful information for debugging and monitoring
- Handle both client-side and server-side errors appropriately

## Performance Considerations

- While focusing on readability, don't ignore performance best practices
- Use React 19 features and React Compiler optimizations
- Implement proper loading states and suspense boundaries
- Optimize images and assets using Next.js built-in optimizations

## Development Workflow

- Use Biome for linting and formatting (configured for 120 character line width)
- Use Husky for pre-commit hooks
- Follow the lint-staged configuration for automatic formatting
- Use TypeScript strict mode and proper type checking
- Test changes locally before committing

---

*This document consolidates all project-specific rules and should be the single source of truth for AI coding assistants working on this project.*
