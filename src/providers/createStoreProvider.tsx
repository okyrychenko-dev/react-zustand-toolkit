import { type ReactNode, createContext, useContext, useLayoutEffect, useMemo, useRef } from "react";
import { createStore, useStore } from "zustand";
import { devtools } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import type { MutatorsStateCreator, StoreProviderProps, StoreProviderResult } from "../types";
import type { StateCreator, StoreApi, StoreMutators } from "zustand";

function createSelectorWithEquality<TState, TSelected>(
  selector: (state: TState) => TSelected,
  equalityFn: (a: TSelected, b: TSelected) => boolean
): (state: TState) => TSelected {
  let hasPrev = false;
  let prevValue: TSelected;

  return (state: TState): TSelected => {
    const nextValue = selector(state);

    if (hasPrev && equalityFn(prevValue, nextValue)) {
      return prevValue;
    }

    hasPrev = true;
    prevValue = nextValue;
    return nextValue;
  };
}

type DevtoolsStateCreator<
  TState,
  TMutators extends Array<[keyof StoreMutators<TState, TState>, unknown]>,
> = StateCreator<TState, [["zustand/devtools", never]], TMutators, TState>;

function wrapForDevtools<
  TState,
  TMutators extends Array<[keyof StoreMutators<TState, TState>, unknown]>,
>(creator: MutatorsStateCreator<TState, TMutators>): DevtoolsStateCreator<TState, TMutators> {
  return (set, get, api) => creator(set, get, api);
}

/**
 * Creates a React Context provider for isolated Zustand store instances.
 *
 * This utility creates a React Context provider that wraps a Zustand store, allowing
 * each provider instance to have its own isolated store. This is essential for:
 * - **Server-Side Rendering**: Each request gets its own store instance
 * - **Testing**: No shared state between test runs
 * - **Micro-frontends**: Isolated state per application instance
 * - **Multiple instances**: Same component tree with independent state
 *
 * The provider automatically integrates Zustand DevTools in development mode and
 * provides hooks for accessing the store from components within the provider tree.
 *
 * Returns an object with:
 * - `Provider`: React component to wrap your app
 * - `useContext`: Hook to get the store API
 * - `useContextStore`: Hook to select values from store (with shallow comparison)
 * - `useIsInsideProvider`: Hook to check if inside provider
 * - `useOptionalContext`: Hook that returns null if outside provider
 *
 * @template TState - The shape of your store state and actions
 * @template TMutators - Array of mutators (middleware) applied to the store (default: [])
 *
 * @param storeCreator - Function that creates the store state and actions
 * @param contextName - Optional name for better debugging (default: 'Store')
 *                      Used in React DevTools and error messages
 *
 * @returns Object with Provider component and hooks to access the context store
 *
 * @example
 * Basic usage with provider
 * ```tsx
 * import { createStoreProvider } from '@okyrychenko-dev/react-zustand-toolkit';
 *
 * interface TodoState {
 *   todos: Todo[];
 *   addTodo: (text: string) => void;
 *   removeTodo: (id: string) => void;
 * }
 *
 * const { Provider: TodoProvider, useContextStore: useTodoStore } =
 *   createStoreProvider<TodoState>(
 *     (set) => ({
 *       todos: [],
 *       addTodo: (text) => set((state) => ({
 *         todos: [...state.todos, { id: Date.now().toString(), text }]
 *       })),
 *       removeTodo: (id) => set((state) => ({
 *         todos: state.todos.filter(t => t.id !== id)
 *       })),
 *     }),
 *     'Todo'
 *   );
 *
 * // Wrap your app
 * function App() {
 *   return (
 *     <TodoProvider>
 *       <TodoList />
 *       <AddTodo />
 *     </TodoProvider>
 *   );
 * }
 *
 * // Use in components
 * function TodoList() {
 *   const todos = useTodoStore((state) => state.todos);
 *   return <ul>{todos.map(todo => <li key={todo.id}>{todo.text}</li>)}</ul>;
 * }
 * ```
 *
 * @example
 * Multiple independent instances
 * ```tsx
 * const { Provider: CounterProvider, useContextStore } =
 *   createStoreProvider<CounterState>(..., 'Counter');
 *
 * function App() {
 *   return (
 *     <div>
 *       <CounterProvider>
 *         <Counter title="Counter 1" />
 *       </CounterProvider>
 *
 *       <CounterProvider>
 *         <Counter title="Counter 2" />
 *       </CounterProvider>
 *     </div>
 *   );
 * }
 *
 * // Each Counter has its own isolated state
 * function Counter({ title }) {
 *   const { count, increment } = useContextStore();
 *   return <div>{title}: {count} <button onClick={increment}>+</button></div>;
 * }
 * ```
 *
 * @example
 * With DevTools and store creation callback
 * ```tsx
 * const { Provider, useContextStore } = createStoreProvider<AppState>(
 *   (set) => ({
 *     // ... state
 *   }),
 *   'AppStore'
 * );
 *
 * function App() {
 *   return (
 *     <Provider
 *       enableDevtools={true}
 *       devtoolsName="My App Store"
 *       onStoreCreate={(store) => {
 *         // Called once when store is created
 *         console.log('Store initialized:', store.getState());
 *
 *         // Register middleware
 *         store.registerMiddleware('logger', loggerMiddleware);
 *       }}
 *     >
 *       <MyApp />
 *     </Provider>
 *   );
 * }
 * ```
 *
 * @example
 * Conditional rendering based on provider existence
 * ```tsx
 * const { Provider, useContextStore, useIsInsideProvider } =
 *   createStoreProvider<SettingsState>(..., 'Settings');
 *
 * function SettingsButton() {
 *   const isInsideSettingsProvider = useIsInsideProvider();
 *
 *   if (!isInsideSettingsProvider) {
 *     return null; // Don't render if not inside provider
 *   }
 *
 *   return <button>Settings</button>;
 * }
 * ```
 *
 * @see {@link createShallowStore} for creating a global store
 * @see {@link https://github.com/pmndrs/zustand | Zustand documentation}
 *
 * @public
 * @since 0.6.0
 */
export function createStoreProvider<
  TState,
  TMutators extends Array<[keyof StoreMutators<TState, TState>, unknown]> = [],
>(
  storeCreator: MutatorsStateCreator<TState, TMutators>,
  contextName = "Store"
): StoreProviderResult<TState> {
  const StoreContext = createContext<StoreApi<TState> | null>(null);
  StoreContext.displayName = `${contextName}Context`;

  function Provider({
    children,
    enableDevtools = process.env.NODE_ENV === "development",
    devtoolsName = contextName,
    onStoreCreate,
  }: StoreProviderProps<TState>): ReactNode {
    const storeRef = useRef<StoreApi<TState> | null>(null);
    const isInitializedRef = useRef(false);

    if (!storeRef.current) {
      const newStore = enableDevtools
        ? createStore(
            devtools(wrapForDevtools(storeCreator), {
              name: devtoolsName,
              enabled: enableDevtools,
            })
          )
        : createStore<TState, TMutators>(storeCreator);

      storeRef.current = newStore;
    }

    const store = storeRef.current;

    useLayoutEffect(() => {
      if (!isInitializedRef.current && onStoreCreate) {
        onStoreCreate(store);
        isInitializedRef.current = true;
      }
    }, [onStoreCreate, store]);

    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
  }

  function useStoreContext(): StoreApi<TState> {
    const store = useContext(StoreContext);

    if (store === null) {
      throw new Error(`use${contextName}Context must be used within a ${contextName}Provider`);
    }

    return store;
  }

  function useIsInsideProvider(): boolean {
    const store = useContext(StoreContext);
    return store !== null;
  }

  function useOptionalContext(): StoreApi<TState> | null {
    return useContext(StoreContext);
  }

  function useContextStoreWithSelector(): TState;
  function useContextStoreWithSelector<T>(selector: (state: TState) => T): T;
  function useContextStoreWithSelector<T>(
    selector: (state: TState) => T,
    equalityFn: (a: T, b: T) => boolean
  ): T;
  function useContextStoreWithSelector<T>(
    selector?: (state: TState) => T,
    equalityFn?: (a: T | TState, b: T | TState) => boolean
  ): T | TState {
    const store = useStoreContext();
    const defaultEquality = (a: T | TState, b: T | TState): boolean => shallow(a, b);
    const actualEquality = equalityFn ?? defaultEquality;
    const actualSelector = useMemo(() => {
      const baseSelector = (state: TState): T | TState => (selector ? selector(state) : state);
      return createSelectorWithEquality(baseSelector, actualEquality);
    }, [selector, actualEquality]);

    return useStore(store, actualSelector);
  }

  return {
    Provider,
    useContext: useStoreContext,
    useContextStore: useContextStoreWithSelector,
    useIsInsideProvider,
    useOptionalContext,
  };
}
