# Kaizen

A modern fitness tracking application built for fast-paced progress tracking.

**Kaizen** (改善) - Japanese philosophy of continuous improvement. Track your workouts, build momentum, and level up every day.

## 🚀 Tech Stack

### Core
- **[Vite](https://vitejs.dev/)** (v7.x with Rolldown) - Lightning-fast build tool
- **[React](https://react.dev/)** (v19.x) - UI library
- **[TypeScript](https://www.typescriptlang.org/)** (v5.x) - Strict type checking
- **[Panda CSS](https://panda-css.com/)** - Zero-runtime CSS-in-JS
- **[Valtio](https://github.com/pmndrs/valtio)** - Proxy-based state management

### Developer Tools
- **[Biome](https://biomejs.dev/)** - Fast linter + formatter (replaces ESLint + Prettier)
- **[Vitest](https://vitest.dev/)** - Vite-native testing framework
- **[React Testing Library](https://testing-library.com/react)** - Component testing
- **[Commitlint](https://commitlint.js.org/)** - Enforce conventional commits
- **[Lefthook](https://github.com/evilmartians/lefthook)** - Fast git hooks
- **[Knip](https://knipjs.dev/)** - Find unused files and dependencies
- **[pnpm](https://pnpm.io/)** (v10.x) - Fast, efficient package manager

## 📦 Getting Started

### Prerequisites
- Node.js 22.x or higher
- pnpm 10.x or higher

### Installation

```bash
# Install dependencies
pnpm install

# Generate Panda CSS (if not auto-generated)
pnpm panda

# Initialize git hooks
pnpm lefthook install

# Setup environment variables (required for API features)
cp .env.example .env
# Edit .env and add your API keys
```

### Editor Setup

This project includes VSCode/Cursor workspace settings (`.vscode/`) for consistent formatting:
- **VSCode/Cursor users**: Install the recommended Biome extension when prompted
- **Other editors**: Use `.editorconfig` for basic formatting rules, or run `pnpm format` manually

Format-on-save is configured to use Biome. If you prefer not to use it, you can override in your local editor settings.

## 🛠️ Development

```bash
# Start dev server
pnpm dev

# Run type checking
pnpm typecheck

# Run tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Lint code
pnpm lint

# Lint and auto-fix
pnpm lint:fix

# Format code
pnpm format

# Find unused code
pnpm knip

# Run all validations (lint + typecheck + test + build)
pnpm validate
```

## 🏗️ Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

## 🎨 Styling with Panda CSS

Panda CSS provides zero-runtime styling with full TypeScript support:

```tsx
import { css } from '@/styles/css';

export function Button() {
  return (
    <button
      className={css({
        bg: 'blue.500',
        color: 'white',
        px: 4,
        py: 2,
        borderRadius: 'md',
        _hover: {
          bg: 'blue.600',
        },
      })}
    >
      Click me
    </button>
  );
}
```

## 🔄 State Management with Valtio

```tsx
import { proxy, useSnapshot } from 'valtio';

// Create state
const state = proxy({
  count: 0,
  increment: () => state.count++,
});

// Use in component
function Counter() {
  const snap = useSnapshot(state);
  return (
    <div>
      <p>Count: {snap.count}</p>
      <button type='button' onClick={state.increment}>
        Increment
      </button>
    </div>
  );
}
```

## 🧪 Testing

```tsx
import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const element = screen.getByText(/vite \+ react/i);
  expect(element).toBeInTheDocument();
});
```

## 📝 Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add new feature
fix: resolve bug
docs: update documentation
style: format code
refactor: restructure code
perf: improve performance
test: add tests
chore: update dependencies
ci: update CI config
build: update build config
```

## 🪝 Git Hooks

Git hooks are managed by Lefthook:

- **pre-commit**: Runs Biome lint/format and TypeScript check on staged files
- **commit-msg**: Validates commit message format
- **pre-push**: Runs tests and build

## 📄 License

MIT
