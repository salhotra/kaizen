# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

This is a **Turborepo monorepo** managed with **pnpm**. All commands use Turbo's intelligent caching and parallel execution.

### Core Development
```bash
# Start all apps in development mode
pnpm dev

# Start only the web app
pnpm dev --filter @kaizen/web

# Build all packages and apps
pnpm build

# Run type checking across all packages
pnpm typecheck

# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

### Code Quality
```bash
# Lint all code (uses Biome, not ESLint)
pnpm lint

# Lint and auto-fix issues
pnpm lint:fix

# Format all code (uses Biome, not Prettier)
pnpm format

# Run comprehensive validation (lint + typecheck + test + build)
pnpm validate

# Find unused code and dependencies
pnpm knip
```

### Package-Specific Commands
```bash
# Run commands in specific packages
pnpm dev --filter @kaizen/web
pnpm test --filter @kaizen/audio-recorder
pnpm typecheck --filter @kaizen/web
```

### Single Test Execution
```bash
# Run a specific test file
cd apps/web && pnpm test src/components/VoiceRecorder.test.tsx

# Run tests matching a pattern
cd apps/web && pnpm test --grep "VoiceRecorder"
```

## Architecture Overview

### Monorepo Structure
- **`apps/web/`** - Main React web application (Vite + React 19)
- **`packages/audio-recorder/`** - Shared audio recording library with React hooks

### Technology Stack
- **Build Tool**: Vite 7.x with Rolldown
- **Frontend**: React 19, TypeScript 5.x
- **Styling**: Tailwind
- **State Management**: Valtio (proxy-based)
- **Code Quality**: Biome (replaces ESLint + Prettier)
- **Testing**: Vitest + React Testing Library
- **Monorepo**: Turborepo + pnpm workspaces

### Key Architectural Patterns

#### 1. Clean Separation of Concerns
- **Core Logic**: `packages/audio-recorder` contains pure React hooks and audio processing logic
- **UI Components**: `apps/web/src/ui/` contains styled components using Tailwind
- **Business Logic**: `apps/web/src/components/` contains feature components that combine hooks with UI
- **Services**: API integrations and external service calls

#### 2. Audio Recording Architecture
The audio recording functionality is split across layers:

**Core Package (`@kaizen/audio-recorder`)**:
- `core/` - Low-level audio processing utilities
- `hooks/` - React hooks (`useAudioRecorder`, `useSilenceDetection`, `useVoiceRecorder`)
- `services/` - Audio analysis and processing services
- `types/` - TypeScript definitions

**Web App Integration**:
- `components/VoiceRecorder.tsx` - Main feature component
- `services/whisper.ts` - OpenAI Whisper API integration
- `ui/RecordButton/` - Styled recording button component

#### 3. State Management Pattern
Uses **Valtio** for reactive state management:
- Proxy-based reactivity (no reducers/actions needed)
- Direct mutation with automatic React updates
- Snapshot-based consumption in components

### Import Patterns
```typescript
// Cross-package imports
import { useVoiceRecorder } from '@kaizen/audio-recorder';

// Internal app imports
import { css } from '@/styles/css';
import { VoiceRecorder } from '@/components/VoiceRecorder';
```

### Environment & Configuration
- Environment variables in `.env` (copy from `.env.example`)
- Config validation in `apps/web/src/config/env.ts`
- Git hooks managed by **Lefthook** (not Husky)
- Conventional commits enforced via `commitlint`

### Development Workflow
1. **Hooks** are automatically installed via `pnpm prepare` (Lefthook)
2. **Pre-commit**: Biome lint/format + TypeScript check
3. **Pre-push**: Tests + build validation

### Future Extensibility
The monorepo is designed for:
- Adding `apps/mobile` (React Native) that reuses `@kaizen/audio-recorder`
- Adding `apps/api` for backend services
- Adding `packages/shared-types` for cross-platform types
- Publishing `@kaizen/audio-recorder` as standalone npm package