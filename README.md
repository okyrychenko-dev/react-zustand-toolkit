# @okyrychenko-dev/react-zustand-toolkit

[![npm version](https://img.shields.io/npm/v/@okyrychenko-dev/react-zustand-toolkit.svg)](https://www.npmjs.com/package/@okyrychenko-dev/react-zustand-toolkit)
[![npm downloads](https://img.shields.io/npm/dm/@okyrychenko-dev/react-zustand-toolkit.svg)](https://www.npmjs.com/package/@okyrychenko-dev/react-zustand-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> A powerful toolkit for creating type-safe Zustand stores with automatic shallow comparison, provider patterns, and smart context resolution.

## Features

- **Automatic Shallow Comparison**: Built-in shallow equality checks for all selectors
- **Provider Pattern**: Create isolated store instances for SSR, testing, and micro-frontends
- **Smart Resolution**: Hooks that automatically resolve between global and context stores
- **Custom Equality**: Optional custom equality function for selectors
- **Type-Safe**: Full TypeScript support with comprehensive type inference
- **Zero Configuration**: Works out of the box with sensible defaults
- **DevTools Integration**: Redux DevTools support for debugging
- **Middleware Support**: Compatible with all Zustand middleware
- **React 19 Helpers**: Utilities for transitions, optimistic UI, and action state

## Installation

```bash
npm install @okyrychenko-dev/react-zustand-toolkit zustand
# or
yarn add @okyrychenko-dev/react-zustand-toolkit zustand
# or
pnpm add @okyrychenko-dev/react-zustand-toolkit zustand
```

## Quick Start

### Basic Store with Toolkit

```typescript
import { createStoreToolkit } from "@okyrychenko-dev/react-zustand-toolkit";

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const counterToolkit = createStoreToolkit<CounterStore>(
  (set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
    decrement: () => set((state) => ({ count: state.count - 1 })),
  }),
  { name: "Counter" }
);

// Export hooks
export const { useStore: useCounter, useResolvedValue: useCounterResolved } = counterToolkit;

// Shared provider toolkit
export const { Provider: CounterProvider } = counterToolkit.provider;
```

### Use in Components

```typescript
function Counter() {
  // Works both inside and outside provider
  const count = useCounterResolved((state) => state.count);
  const increment = useCounterResolved((state) => state.increment);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
    </div>
  );
}
```

### Wrap with Provider (Optional)

```typescript
function App() {
  return (
    <CounterProvider enableDevtools={true}>
      <Counter />
    </CounterProvider>
  );
}
```

## API Reference

### `createStoreToolkit<TState>(storeCreator, options?)`

Creates a complete toolkit with global store bindings, a shared provider toolkit, and resolved hooks.

**Parameters:**

- `storeCreator`: Function that creates store state and actions
- `options.name`: Optional name for DevTools and Provider

**Returns:**

- `useStore`: Hook for global store with shallow comparison
- `useStorePlain`: Hook for global store with plain Zustand selector semantics
- `useStoreApi`: Direct access to store API
- `provider`: Shared provider/context hooks for this toolkit instance
- `getProvider()`: Getter alias for the shared provider
- `createProvider()`: Backward-compatible alias for `getProvider()`
- `useResolvedStoreApi()`: Returns store API (context or global)
- `useResolvedValue()`: Resolved selector hook with shallow comparison
- `useResolvedStorePlain()`: Resolved selector hook with plain Zustand semantics

### `createShallowStore<TState>(storeCreator)`

Creates a Zustand store with automatic shallow comparison.

**Parameters:**

- `storeCreator`: Function that creates store state and actions

**Returns:**

- `useStore`: Hook with shallow comparison
- `useStorePlain`: Hook with plain Zustand selector semantics
- `useStoreApi`: Direct access to store API

```typescript
const { useStore, useStoreApi } = createShallowStore<MyStore>((set) => ({
  // your store implementation
}));

// Optional custom equality function
const selected = useStore((state) => state.data, (a, b) => a.id === b.id);
```

### `createStoreProvider<TState>(storeCreator, contextName?)`

Creates a React Context provider for isolated store instances.

**Parameters:**

- `storeCreator`: Function that creates store state and actions
- `contextName`: Optional name for debugging

**Returns:**

- `Provider`: React component to wrap your app/subtree
- `useContextStoreApi()`: Hook to access store from context (throws if outside provider)
- `useContextStore()`: Hook to access store with selector (throws if outside provider)
- `useContextStorePlain()`: Hook with plain Zustand selector semantics
- `useContextStoreOptional()`: Hook to access store from context (returns null if outside provider)
- `useIsInsideProvider()`: Check if inside provider

```typescript
const { Provider, useContextStore } = createStoreProvider<MyStore>((set) => ({
  // your store implementation
}));
```

## Usage Patterns

### Pattern 1: Global Singleton Store

```typescript
import { createShallowStore } from "@okyrychenko-dev/react-zustand-toolkit";

const { useStore: useGlobalStore } = createShallowStore<MyStore>((set) => ({
  // implementation
}));

// Use anywhere
const data = useGlobalStore((state) => state.data);
```

### Pattern 2: Isolated Instances with Provider

```typescript
import { createStoreProvider } from "@okyrychenko-dev/react-zustand-toolkit";

const { Provider, useContextStore } = createStoreProvider<MyStore>((set) => ({
  // implementation
}));

// Wrap your app
<Provider>
  <App />
</Provider>

// Use in components
const data = useContextStore((state) => state.data);
```

### Pattern 3: Smart Resolution (Recommended)

```typescript
import { createStoreToolkit } from "@okyrychenko-dev/react-zustand-toolkit";

const toolkit = createStoreToolkit<MyStore>((set) => ({
  // implementation
}));

export const { useResolvedValue: useMyStore } = toolkit;
export const { Provider: MyStoreProvider } = toolkit.provider;

// Works without provider (uses global store)
const data = useMyStore((state) => state.data);

// Works with provider (uses isolated store)
<MyStoreProvider>
  <Component /> {/* Same hook works here too */}
</MyStoreProvider>
```

### Pattern 4: With Middleware (DevTools)

```typescript
import { devtools } from "zustand/middleware";
import { createShallowStore } from "@okyrychenko-dev/react-zustand-toolkit";

const { useStore } = createShallowStore<MyStore, [["zustand/devtools", never]]>(
  devtools(
    (set) => ({
      // implementation
    }),
    { name: "MyStore" }
  )
);
```

### Pattern 5: React 19 Helpers

```typescript
import {
  createTransitionAction,
  useActionStateAdapter,
  useOptimisticReducer,
} from "@okyrychenko-dev/react-zustand-toolkit";

// Wrap store action in transition
const incrementInTransition = createTransitionAction(() => {
  store.getState().increment();
});

// useActionState adapter
const [status, submit, isPending] = useActionStateAdapter(async (payload: FormData) => {
  await save(payload);
  return "saved";
}, "idle");

// optimistic local state
const [optimisticTodos, addOptimisticTodo] = useOptimisticReducer(todos, (current, nextTodo) => [
  ...current,
  nextTodo,
]);
```

## Use Cases

### Server-Side Rendering (SSR)

Each request gets its own isolated store instance:

```typescript
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <MyStoreProvider>
      {children}
    </MyStoreProvider>
  );
}
```

### Testing

No need for beforeEach cleanup - each test gets a fresh instance:

```typescript
function wrapper({ children }) {
  return <MyStoreProvider>{children}</MyStoreProvider>;
}

test("my test", () => {
  const { result } = renderHook(() => useMyStore(), { wrapper });
  // Fresh store for this test
});
```

### Micro-Frontends

Each micro-frontend gets its own isolated state:

```typescript
// MicroApp1
<MyStoreProvider>
  <MicroApp1 />
</MyStoreProvider>

// MicroApp2
<MyStoreProvider>
  <MicroApp2 />
</MyStoreProvider>
```

### Store Lifecycle with onStoreInit / onStoreReady

Use `onStoreInit` for pure synchronous initialization and `onStoreReady` for post-commit side effects:

```typescript
interface AppStore {
  // ... state
  registerMiddleware: (name: string, middleware: Middleware) => void;
}

const { Provider } = createStoreProvider<AppStore>((set) => ({
  // ... implementation
}));

<Provider
  onStoreInit={(store) => {
    store.getState().registerMiddleware("logger", loggerMiddleware);
  }}
  onStoreReady={(store) => {
    console.log("store ready", store.getState());
  }}
>
  <App />
</Provider>
```

## Advanced API Matrix

- Global: `useStore`, `useStorePlain`, `useStoreApi`
- Provider: `useContextStore`, `useContextStorePlain`, `useContextStoreApi`, `useContextStoreOptional`
- Resolved: `useResolvedValue`, `useResolvedStorePlain`, `useResolvedStoreApi`

Deprecated aliases remain available for migration:

- `createProvider()` -> `getProvider()` / `provider`
- `useContext()` -> `useContextStoreApi()`
- `useOptionalContext()` -> `useContextStoreOptional()`
- `useResolvedStoreWithSelector()` -> `useResolvedValue()`
- `useResolvedStore()` -> `useResolvedStoreApi()`
- `onStoreCreate` -> `onStoreInit()` for pure synchronous initialization, or `onStoreReady()` for post-commit side effects

## Migration

Deprecated APIs remain available for now, but new code should use the updated names and lifecycle hooks.

### Provider access

Old:

```typescript
const { Provider } = toolkit.createProvider();
// or
const { Provider } = toolkit.getProvider();
```

New:

```typescript
const { Provider } = toolkit.provider;
```

### Provider lifecycle

Old:

```tsx
<Provider
  onStoreCreate={(store) => {
    console.log("ready", store.getState());
  }}
>
  <App />
</Provider>
```

New:

```tsx
<Provider
  onStoreInit={(store) => {
    // Pure, synchronous, idempotent initialization only
  }}
  onStoreReady={(store) => {
    console.log("ready", store.getState());
  }}
>
  <App />
</Provider>
```

### Provider raw API hooks

Old:

```typescript
const store = useContext();
const maybeStore = useOptionalContext();
```

New:

```typescript
const store = useContextStoreApi();
const maybeStore = useContextStoreOptional();
```

### Resolved hooks

Old:

```typescript
const count = useResolvedStoreWithSelector((state) => state.count);
const store = useResolvedStore();
```

New:

```typescript
const count = useResolvedValue((state) => state.count);
const store = useResolvedStoreApi();
```

### Plain selector mode

If you need plain Zustand selector semantics instead of the shallow-default path, use the explicit plain hooks:

```typescript
const value = useStorePlain((state) => state.value);
const contextValue = useContextStorePlain((state) => state.value);
const resolvedValue = useResolvedStorePlain((state) => state.value);
```

## TypeScript

Full type inference and type safety:

```typescript
interface UserStore {
  user: User | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

const toolkit = createStoreToolkit<UserStore>((set) => ({
  user: null,
  login: async (credentials) => {
    const user = await api.login(credentials);
    set({ user });
  },
  logout: () => set({ user: null }),
}));

// Type-safe selectors
const user = toolkit.useStore((state) => state.user); // User | null
const login = toolkit.useStore((state) => state.login); // (credentials: Credentials) => Promise<void>
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Build the package
npm run build

# Type checking
npm run typecheck

# Lint code
npm run lint

# Fix lint errors
npm run lint:fix

# Format code
npm run format

# Watch mode for development
npm run dev
```

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass (`npm run test`)
2. Code is properly typed (`npm run typecheck`)
3. Linting passes (`npm run lint`)
4. Code is formatted (`npm run format`)

## License

MIT © [Oleksii Kyrychenko](https://github.com/okyrychenko-dev)
