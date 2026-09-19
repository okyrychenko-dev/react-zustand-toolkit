# @okyrychenko-dev/react-zustand-toolkit

[![npm version](https://img.shields.io/npm/v/@okyrychenko-dev/react-zustand-toolkit.svg)](https://www.npmjs.com/package/@okyrychenko-dev/react-zustand-toolkit)
[![npm downloads](https://img.shields.io/npm/dm/@okyrychenko-dev/react-zustand-toolkit.svg)](https://www.npmjs.com/package/@okyrychenko-dev/react-zustand-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Type-safe Zustand helpers for declarative Provider scope, shallow-first selection, SSR isolation,
and middleware-preserving Store handles.

## What this library does

`react-zustand-toolkit` provides four composable layers:

- `createStoreToolkit` for the normal declarative path: Resolved selection, explicit Global access,
  and isolated Provider stores from one typed recipe
- `createShallowStore` for a standalone process-wide Store with Shallow-first selectors
- `createStoreProvider` for standalone isolated Provider stores
- `createResolvedStoreHooks` for advanced composition of an existing Global store and Provider

The library does not ship its own Redux DevTools or persistence runtime. Apply Zustand middleware in
the Store creator returned by the recipe.

## Features

- Declarative nearest-Provider resolution with Global fallback
- Shallow-first and Plain selector modes, plus custom equality
- Typed creation-only Provider input for deterministic initialization
- Request-local SSR isolation and matching-input hydration
- Stable imperative Store handles with Zustand middleware capabilities
- Standalone factories for advanced composition

## Installation

```bash
pnpm add @okyrychenko-dev/react-zustand-toolkit react zustand
```

## Declarative toolkit

Provider placement declares which Store descendants observe. The top-level hooks use the nearest
matching Provider store and otherwise fall back to the process-scoped Global store.

```tsx
import { createStoreToolkit } from "@okyrychenko-dev/react-zustand-toolkit";

interface CounterInput {
  initialCount: number;
}

interface CounterStore {
  count: number;
  increment: () => void;
}

export const counter = createStoreToolkit<CounterStore, CounterInput>(
  ({ initialCount }) => (set) => ({
    count: initialCount,
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  { globalInput: { initialCount: 0 }, name: "Counter" }
);

function Count() {
  const count = counter.useStore((state) => state.count);
  return <span>{count}</span>;
}

function App() {
  return (
    <counter.Provider input={{ initialCount: 10 }}>
      <Count />
    </counter.Provider>
  );
}
```

Outside a Provider, `Count` observes `counter.global.store`. Inside the Provider it observes `10`.
A nested `counter.Provider` wins for its descendants. Each Provider owns an isolated Store.

### Toolkit interface

| Member | Behavior |
| --- | --- |
| `Provider` | Creates one isolated Provider store from required, inert `input` |
| `useStore` | Resolved Shallow selection; accepts optional custom equality |
| `useStorePlain` | Resolved selection with Zustand's default equality |
| `useStoreApi()` | Hook returning the Resolved Store handle |
| `global.useStore` | Explicit Global Shallow selection |
| `global.useStorePlain` | Explicit Global Plain selection |
| `global.store` | Stable imperative Global Store handle; not a hook |

The Store recipe runs synchronously when a Store is created and must be deterministic for equivalent
input and free of external side effects. It constructs state, actions, and middleware together;
the toolkit does not patch initial state afterward. Later Provider `input` changes are ignored. Use
Store actions for live changes or change the Provider `key` to start a new Store lifetime.

`onStoreInit` runs synchronously after construction and before descendants observe the Store.
`onStoreReady` runs after commit at most once for a Provider Store. Put subscriptions, analytics,
registrations, and other external effects in `onStoreReady`, not in the recipe or `onStoreInit`.

To model optional initialization, include `undefined` in the input type and still pass the required
`input` prop.

## Choosing a factory

### `createStoreToolkit`

Use the declarative toolkit for most applications. Components use one top-level selection vocabulary
and Provider placement determines whether they observe a local Store or the Global fallback. The
complete example above shows its interface.

### `createShallowStore`

Use this when a process-wide Store is intentional and Provider isolation is unnecessary.

```tsx
import { createShallowStore } from "@okyrychenko-dev/react-zustand-toolkit";

interface SessionStore {
  token: string | null;
  setToken: (token: string | null) => void;
}

const session = createShallowStore<SessionStore>((set) => ({
  token: null,
  setToken: (token) => set({ token }),
}));

const token = session.useStore((state) => state.token);
const plainToken = session.useStorePlain((state) => state.token);
session.store.getState().setToken("token");
```

It returns `useStore`, `useStorePlain`, and the stable imperative `store` property.

### `createStoreProvider`

Use this advanced factory when every Provider must own an isolated Store but you do not want Global
fallback or the combined toolkit interface.

```tsx
import { createStoreProvider } from "@okyrychenko-dev/react-zustand-toolkit";

interface WizardInput {
  initialStep: number;
}

interface WizardStore {
  step: number;
  next: () => void;
}

const wizard = createStoreProvider<WizardStore, WizardInput>(
  ({ initialStep }) => (set) => ({
    step: initialStep,
    next: () => set((state) => ({ step: state.step + 1 })),
  }),
  "Wizard"
);

function WizardStep() {
  const step = wizard.useContextStore((state) => state.step);
  return <div>Step {step}</div>;
}

function WizardShell() {
  return (
    <wizard.Provider input={{ initialStep: 1 }}>
      <WizardStep />
    </wizard.Provider>
  );
}
```

It returns `Provider`, strict Store hooks, `useIsInsideProvider`, and the advanced
`useProviderStoreOptional` lookup. Strict hooks throw outside the matching Provider.

## Provider lifecycle

Both the toolkit Provider and standalone Provider support two lifecycle stages:

- `onStoreInit` runs synchronously once during Store creation, before descendants observe it.
- `onStoreReady` runs after commit, at most once for that Store lifetime.

Use the Store recipe and `onStoreInit` only for synchronous construction and validation. Start
subscriptions, analytics, registrations, and other external effects in `onStoreReady`. Changing
callback identities does not repeat a lifecycle stage that has already completed.

## Server rendering and hydration

> Never put request-specific server data in `global.store`. The Global store is module-scoped and
> can be shared by concurrent requests. A request-local Provider is the SSR isolation boundary.

Decode transport data before passing it to the Provider. Serialize that same data into the response
and give the client Provider observably equivalent decoded input on its first render.

```tsx
interface PageInput {
  userId: string;
}

const page = createStoreToolkit<PageStore, PageInput>(
  ({ userId }) => () => ({ userId }),
  { globalInput: { userId: "anonymous" }, name: "Page" }
);

function PageView() {
  return <main>{page.useStore((state) => state.userId)}</main>;
}

// Server: create one element tree per request.
const input = decodePageInput(request);
const html = renderToString(
  <page.Provider input={input}>
    <PageView />
  </page.Provider>
);
const serializedInput = JSON.stringify(input).replaceAll("<", "\\u003c");

// Client: decode the embedded data and hydrate with equivalent input.
const clientInput = decodeEmbeddedPageInput(serializedInput);
const root = document.getElementById("root");
if (root) {
  hydrateRoot(
    root,
    <page.Provider input={clientInput}>
      <PageView />
    </page.Provider>
  );
}
```

The application owns encoding, decoding, and validation. React may construct and discard unobserved
Stores while retrying server work; the guarantee is that distinct request trees do not share an
observable Provider store, not an exact recipe call count.

### Next.js App Router

Create the toolkit in a client module containing `"use client"`. A React Server Component may load,
validate, and serialize data, then pass inert props to a client component that renders the Provider.
Server Components must not invoke toolkit hooks or read or mutate toolkit Store handles. No Next.js
runtime dependency is required.

### Persistence

Browser storage can change the first client state before hydration and cause markup mismatches. When
using Zustand persistence, disable automatic hydration when needed, render from the server input,
then rehydrate storage in a controlled post-commit step. Do not let persisted browser state replace
the initial Provider state before React hydrates matching server markup.

## Advanced standalone composition

The standalone factories remain available when custom wiring is genuinely required:

```tsx
const global = createShallowStore(recipe({ initialCount: 0 }));
const provider = createStoreProvider<CounterStore, CounterInput>(recipe, "Counter");
const resolved = createResolvedStoreHooks(global.store, provider.useProviderStoreOptional);
```

`createStoreProvider` also exposes strict `useContextStoreApi`, Shallow `useContextStore`, Plain
`useContextStorePlain`, `useIsInsideProvider`, and advanced `useProviderStoreOptional`. Strict hooks
throw outside the matching Provider. Middleware-enhanced Store capabilities remain on all Store
handles.

## Migration to the declarative major interface

| Previous member | Replacement |
| --- | --- |
| `toolkit.provider.Provider` | `toolkit.Provider` |
| `toolkit.getProvider().Provider` | `toolkit.Provider` |
| `toolkit.provider.useContextStore` | `toolkit.useStore` for Resolved selection; `createStoreProvider().useContextStore` for standalone strict selection |
| `toolkit.provider.useContextStorePlain` | `toolkit.useStorePlain` for Resolved selection; `createStoreProvider().useContextStorePlain` for standalone strict selection |
| `toolkit.provider.useContextStoreApi` | `toolkit.useStoreApi()` for Resolved access; `createStoreProvider().useContextStoreApi()` for standalone strict access |
| `toolkit.provider.useIsInsideProvider` | Usually remove; Provider placement now declares scope. For advanced detection use `createStoreProvider().useIsInsideProvider()` |
| `toolkit.provider.useContextStoreOptional` | Omitted from the toolkit; use advanced `createStoreProvider().useProviderStoreOptional()` |
| `toolkit.getProvider()` | Remove and use the direct toolkit members above |
| `toolkit.useResolvedValue` | `toolkit.useStore` |
| `toolkit.useResolvedStorePlain` | `toolkit.useStorePlain` |
| `toolkit.useResolvedStoreApi()` | `toolkit.useStoreApi()` |
| `toolkit.useStore` | `toolkit.global.useStore` |
| `toolkit.useStorePlain` | `toolkit.global.useStorePlain` |
| `toolkit.useStoreApi` | `toolkit.global.store` |
| `createShallowStore().useStoreApi` | `createShallowStore().store` |
| `provider.useContextStoreOptional` | `provider.useProviderStoreOptional` |
| `createTransitionAction` | Call the Store action inside React's `startTransition` |
| `useActionStateAdapter` | Compose React's `useActionState` directly with the Store action |
| `useOptimisticReducer` | Compose React's `useOptimistic` directly with the Store update |

Change a state creator into an input recipe, provide `globalInput`, add `input` to every Provider,
and move normal selection to the toolkit's top-level hooks. Outside a Provider they fall back to the
Global store; inside nested Providers they select the nearest store. Move request data from Global
state to request-local Provider input and use identical decoded input for server render and initial
client hydration.

A codemod is intentionally not provided: the old `useStore` name becomes
`global.useStore` while the new top-level `useStore` has Resolved semantics, so automated renaming
cannot reliably distinguish destructured aliases and application-specific wrappers. Apply the table
manually and review each call by intended Store scope.

Lifecycle ordering stays explicit during migration:

```tsx
<counter.Provider
  input={decodedInput}
  onStoreInit={(store) => {
    // Synchronous, before descendants observe this Store. Do not start external effects here.
    validateInitialState(store.getState());
  }}
  onStoreReady={(store) => {
    // Post-commit, at most once per Store lifetime: connect external integrations here.
    analytics.observe(store);
  }}
>
  <App />
</counter.Provider>
```

## Selection semantics

Shallow hooks retain the prior selected reference while `zustand/shallow` (or supplied custom
equality) considers the next value equal. The cache is discarded when the selected Store identity
changes. Plain hooks use Zustand's default equality. Omitting a selector returns the full state.

### Shallow-first selection

Shallow selection is useful for object and array picks because an equivalent result retains its
previous reference:

```tsx
const selection = counter.useStore((state) => ({
  count: state.count,
  increment: state.increment,
}));
```

Supply custom equality when the domain has a stronger equivalence rule:

```tsx
const stableUser = account.useStore(
  (state) => state.user,
  (left, right) => left?.id === right?.id
);
```

Retained selection never crosses Store identities. Moving a component into or out of a Provider, or
between nested Providers, discards the old Store's cached value.

### Plain selection

Use the explicit Plain hooks for Zustand's default selector behavior:

```tsx
const resolvedValue = counter.useStorePlain((state) => state.count);
const globalValue = counter.global.useStorePlain((state) => state.count);
const providerValue = wizard.useContextStorePlain((state) => state.step);
```

## Middleware support

Zustand middleware belongs in the Store creator returned by a recipe. Middleware-enhanced
capabilities remain available on Global, Provider, and Resolved Store handles.

```tsx
import { createStoreToolkit } from "@okyrychenko-dev/react-zustand-toolkit";
import { devtools, persist } from "zustand/middleware";

type CounterMutators = [
  ["zustand/persist", CounterStore],
  ["zustand/devtools", never],
];

const counter = createStoreToolkit<CounterStore, CounterInput, CounterMutators>(
  ({ initialCount }) =>
    persist(
      devtools(
        (set) => ({
          count: initialCount,
          increment: () => set((state) => ({ count: state.count + 1 })),
        }),
        { name: "CounterStore" }
      ),
      { name: "counter-store" }
    ),
  { globalInput: { initialCount: 0 } }
);

counter.global.store.persist.rehydrate();
counter.global.store.devtools.cleanup();
```

This library does not auto-connect Provider stores to Redux DevTools. Apply `devtools(...)` in the
recipe when each Store instance should expose that middleware capability.

With browser persistence, also follow the controlled hydration guidance above so stored state does
not change the initial client render before React hydration completes.

## TypeScript and subscriptions

Store mutator types are preserved through the public Store handles. For example,
`subscribeWithSelector` retains its selector-aware subscription overload:

```tsx
import { createShallowStore } from "@okyrychenko-dev/react-zustand-toolkit";
import { subscribeWithSelector } from "zustand/middleware";

interface FilterStore {
  query: string;
  setQuery: (query: string) => void;
}

const filter = createShallowStore<FilterStore, [["zustand/subscribeWithSelector", never]]>(
  subscribeWithSelector((set) => ({
    query: "",
    setQuery: (query) => set({ query }),
  }))
);

const unsubscribe = filter.store.subscribe(
  (state) => state.query,
  (nextQuery) => console.log(nextQuery)
);

unsubscribe();
```

## Replacing the removed React 19 helpers

The old helpers were thin wrappers around React primitives and are no longer package exports.

Use `startTransition` instead of `createTransitionAction`:

```tsx
import { startTransition } from "react";

function incrementInTransition(): void {
  startTransition(() => {
    counter.global.store.getState().increment();
  });
}
```

Use `useActionState` directly instead of `useActionStateAdapter`:

```tsx
import { useActionState } from "react";

const [status, submit, isPending] = useActionState(
  (_previousStatus: string, payload: FormData) => action(payload),
  "idle"
);
```

Use `useOptimistic` directly instead of `useOptimisticReducer`:

```tsx
import { startTransition, useOptimistic } from "react";

const [optimisticTodos, addOptimisticTodo] = useOptimistic(
  todos,
  (current, nextTodo: Todo) => [...current, nextTodo]
);

startTransition(() => addOptimisticTodo(todo));
```

## Development

```bash
pnpm install --frozen-lockfile
pnpm run check
pnpm run test:coverage
pnpm run package:check
```

## License

MIT © [Oleksii Kyrychenko](https://github.com/okyrychenko-dev)
