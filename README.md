# @okyrychenko-dev/react-zustand-toolkit

[![npm version](https://img.shields.io/npm/v/@okyrychenko-dev/react-zustand-toolkit.svg)](https://www.npmjs.com/package/@okyrychenko-dev/react-zustand-toolkit)
[![npm downloads](https://img.shields.io/npm/dm/@okyrychenko-dev/react-zustand-toolkit.svg)](https://www.npmjs.com/package/@okyrychenko-dev/react-zustand-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

> Type-safe Zustand helpers for shallow-first selectors, isolated providers, and hooks that resolve between global and scoped stores.

## What This Library Does

`react-zustand-toolkit` gives you three composable layers:

- `createShallowStore` for a global singleton store with shallow-first selectors
- `createStoreProvider` for isolated store instances in React context
- `createStoreToolkit` for both patterns together, plus resolved hooks that work inside and outside a provider

It does not ship its own DevTools runtime for providers.
If you want Zustand Redux DevTools, apply `devtools(...)` in the store creator itself.

## Features

- Shallow-first selectors with explicit plain-selector hooks
- Context providers with isolated store instances
- Resolved hooks that choose context store first and fall back to global store
- Optional custom equality for shallow-first selector hooks
- Full TypeScript inference with Zustand middleware support
- React 19 helpers for transitions, optimistic updates, and action state adapters

## Installation

```bash
npm install @okyrychenko-dev/react-zustand-toolkit zustand
```

## Quick Start

```tsx
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

export const {
  useStore: useCounterStore,
  useResolvedValue: useCounter,
  useResolvedStoreApi: useCounterStoreApi,
} = counterToolkit;

export const { Provider: CounterProvider } = counterToolkit.provider;

function Counter() {
  const count = useCounter((state) => state.count);
  const increment = useCounter((state) => state.increment);

  return <button onClick={increment}>Count: {count}</button>;
}

function App() {
  return (
    <CounterProvider>
      <Counter />
    </CounterProvider>
  );
}
```

## Which Factory To Use

### `createShallowStore`

Use this when you want a global singleton store.

```tsx
import { createShallowStore } from "@okyrychenko-dev/react-zustand-toolkit";

interface SessionStore {
  token: string | null;
  setToken: (token: string | null) => void;
}

const { useStore, useStorePlain, useStoreApi } = createShallowStore<SessionStore>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
}));

const token = useStore((state) => state.token);
const plainToken = useStorePlain((state) => state.token);
const storeApi = useStoreApi;
```

Returns:

- `useStore`
- `useStorePlain`
- `useStoreApi`

### `createStoreProvider`

Use this when every provider instance must own a separate store.

```tsx
import { createStoreProvider } from "@okyrychenko-dev/react-zustand-toolkit";

interface WizardStore {
  step: number;
  next: () => void;
}

const { Provider: WizardProvider, useContextStore, useContextStoreApi } =
  createStoreProvider<WizardStore>((set) => ({
    step: 1,
    next: () => set((state) => ({ step: state.step + 1 })),
  }), "Wizard");

function WizardStep() {
  const step = useContextStore((state) => state.step);
  return <div>Step {step}</div>;
}

function WizardShell() {
  return (
    <WizardProvider>
      <WizardStep />
    </WizardProvider>
  );
}
```

Returns:

- `Provider`
- `useContextStoreApi`
- `useContextStore`
- `useContextStorePlain`
- `useContextStoreOptional`
- `useIsInsideProvider`

### `createStoreToolkit`

Use this when components should work both with and without a provider.

```tsx
import { createStoreToolkit } from "@okyrychenko-dev/react-zustand-toolkit";

interface CartStore {
  items: string[];
  addItem: (item: string) => void;
}

const cartToolkit = createStoreToolkit<CartStore>((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ items: [...state.items, item] })),
}), { name: "Cart" });

export const { useResolvedValue: useCart } = cartToolkit;
export const { Provider: CartProvider } = cartToolkit.provider;

function CartCount() {
  const items = useCart((state) => state.items);
  return <span>{items.length}</span>;
}
```

Returns:

- `useStore`
- `useStorePlain`
- `useStoreApi`
- `provider`
- `getProvider()`
- `createProvider()` deprecated alias
- `useResolvedStoreApi()`
- `useResolvedValue()`
- `useResolvedStorePlain()`

## Selector Semantics

### Shallow-first mode

`useStore`, `useContextStore`, and `useResolvedValue` keep the previous selected value when the equality check passes.
By default they use `zustand/shallow`.

This is useful for object and array picks:

```tsx
const selection = useCounter((state) => ({
  count: state.count,
  increment: state.increment,
}));
```

You can also provide your own equality function:

```tsx
const stableUser = useCounter(
  (state) => state.user,
  (left, right) => left?.id === right?.id
);
```

### Plain mode

If you want standard Zustand selector behavior, use the explicit plain hooks:

```tsx
const value = useStorePlain((state) => state.value);
const contextValue = useContextStorePlain((state) => state.value);
const resolvedValue = useResolvedStorePlain((state) => state.value);
```

## Resolved Hooks

Resolved hooks prefer the provider store when the component is inside a matching provider.
Otherwise they fall back to the global store.

```tsx
const toolkit = createStoreToolkit<MyStore>((set) => ({
  value: 0,
  increment: () => set((state) => ({ value: state.value + 1 })),
}));

const { useResolvedValue, useResolvedStoreApi } = toolkit;

function Status() {
  const value = useResolvedValue((state) => state.value);
  const store = useResolvedStoreApi();

  return <button onClick={() => store.getState().increment()}>{value}</button>;
}
```

## Provider Lifecycle

`createStoreProvider` supports two lifecycle stages:

- `onStoreInit` for synchronous initialization during store creation
- `onStoreReady` for post-commit side effects

```tsx
const { Provider } = createStoreProvider<AppStore>((set) => ({
  ready: false,
  setReady: (ready: boolean) => set({ ready }),
}));

<Provider
  onStoreInit={(store) => {
    store.getState().setReady(true);
  }}
  onStoreReady={(store) => {
    console.log("store mounted", store.getState());
  }}
>
  <App />
</Provider>;
```

Deprecated alias:

- `onStoreCreate` maps to the post-commit `onStoreReady` behavior

## Middleware Support

Zustand middleware belongs in the store creator.
That includes Redux DevTools support.

```tsx
import { createShallowStore } from "@okyrychenko-dev/react-zustand-toolkit";
import { devtools, persist } from "zustand/middleware";

interface CounterStore {
  count: number;
  increment: () => void;
}

const { useStore, useStoreApi } = createShallowStore<
  CounterStore,
  [["zustand/persist", CounterStore], ["zustand/devtools", never]]
>(
  persist(
    devtools(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      { name: "CounterStore" }
    ),
    { name: "counter-store" }
  )
);

useStoreApi.persist.rehydrate();
useStoreApi.devtools.cleanup();
```

This library does not auto-connect provider instances to Redux DevTools.

## TypeScript

The toolkit is designed to preserve store API types when you use Zustand middleware.

```tsx
import { createShallowStore } from "@okyrychenko-dev/react-zustand-toolkit";
import { subscribeWithSelector } from "zustand/middleware";

interface FilterStore {
  query: string;
  setQuery: (query: string) => void;
}

const { useStoreApi } = createShallowStore<
  FilterStore,
  [["zustand/subscribeWithSelector", never]]
>(
  subscribeWithSelector((set) => ({
    query: "",
    setQuery: (query) => set({ query }),
  }))
);

const unsubscribe = useStoreApi.subscribe(
  (state) => state.query,
  (nextQuery) => {
    console.log(nextQuery);
  }
);

unsubscribe();
```

## Migration

Deprecated names still exist for compatibility, but new code should prefer the current API.

### Provider access

```tsx
const { Provider } = toolkit.provider;
```

Old aliases:

```tsx
const { Provider } = toolkit.getProvider();
const { Provider: LegacyProvider } = toolkit.createProvider();
```

### Raw provider hooks

```tsx
const store = useContextStoreApi();
const maybeStore = useContextStoreOptional();
```

Old aliases:

```tsx
const store = useContext();
const maybeStore = useOptionalContext();
```

### Resolved hooks

```tsx
const value = useResolvedValue((state) => state.value);
const store = useResolvedStoreApi();
```

Old aliases:

```tsx
const value = useResolvedStoreWithSelector((state) => state.value);
const store = useResolvedStore();
```

## React 19 Helpers

```tsx
import {
  createTransitionAction,
  useActionStateAdapter,
  useOptimisticReducer,
} from "@okyrychenko-dev/react-zustand-toolkit";

const incrementInTransition = createTransitionAction(() => {
  counterToolkit.useStoreApi.getState().increment();
});

const saveInTransition = createTransitionAction(async () => {
  await save();
  counterToolkit.useStoreApi.setState({ saved: true });
});

const [status, submit, isPending] = useActionStateAdapter(async (payload: FormData) => {
  await save(payload);
  return "saved";
}, "idle");

const [optimisticTodos, addOptimisticTodo] = useOptimisticReducer(
  todos,
  (current, nextTodo) => [...current, nextTodo]
);
```

`createTransitionAction` supports synchronous and asynchronous actions. In React 19,
an async action remains part of the transition until its returned promise settles.

## Development

```bash
npm install
npm run typecheck
npm run test:run
npm run build
```

## License

MIT © [Oleksii Kyrychenko](https://github.com/okyrychenko-dev)
