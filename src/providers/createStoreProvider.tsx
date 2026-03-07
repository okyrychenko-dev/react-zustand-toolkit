import { type ReactNode, createContext, useContext, useEffect, useMemo, useRef } from "react";
import { createStore, useStore } from "zustand";
import { devtools } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { createSelectorWithEquality } from "../shared";
import type {
  MutatorsStateCreator,
  StoreApiWithMutators,
  StoreMutatorTuple,
  StoreProviderProps,
  StoreProviderResult,
} from "../types";
import type { StateCreator } from "zustand";

type ProviderRuntimeProps<TState, TMutators extends Array<StoreMutatorTuple>> = Omit<
  StoreProviderProps<TState, TMutators>,
  "onStoreCreate"
> & {
  onStoreCreate?: (store: StoreApiWithMutators<TState, TMutators>) => void;
};

type DevtoolsStateCreator<TState, TMutators extends Array<StoreMutatorTuple>> = StateCreator<
  TState,
  [["zustand/devtools", never]],
  TMutators,
  TState
>;

function wrapForDevtools<TState, TMutators extends Array<StoreMutatorTuple>>(
  creator: MutatorsStateCreator<TState, TMutators>
): DevtoolsStateCreator<TState, TMutators> {
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
 * - `useContextStoreApi`: Hook to get the store API
 * - `useContextStore`: Hook to select values from store (with shallow comparison)
 * - `useContextStorePlain`: Hook to select values with plain Zustand semantics
 * - `useIsInsideProvider`: Hook to check if inside provider
 * - `useContextStoreOptional`: Hook that returns null if outside provider
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
 * With DevTools and lifecycle hooks
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
 *       onStoreInit={(store) => {
 *         // Called once when the store instance is created
 *         store.setState({ ready: true });
 *       }}
 *       onStoreReady={(store) => {
 *         // Called after the provider commits
 *         console.log('Store initialized:', store.getState());
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
export function createStoreProvider<TState, TMutators extends Array<StoreMutatorTuple> = []>(
  storeCreator: MutatorsStateCreator<TState, TMutators>,
  contextName = "Store"
): StoreProviderResult<TState, TMutators> {
  const StoreContext = createContext<StoreApiWithMutators<TState, TMutators> | null>(null);
  StoreContext.displayName = `${contextName}Context`;

  function Provider({
    children,
    enableDevtools = process.env.NODE_ENV === "development",
    devtoolsName = contextName,
    onStoreInit,
    onStoreReady,
    onStoreCreate,
  }: ProviderRuntimeProps<TState, TMutators>): ReactNode {
    const storeRef = useRef<StoreApiWithMutators<TState, TMutators> | null>(null);
    const isReadyRef = useRef(false);

    if (!storeRef.current) {
      const newStore = createStore<TState, TMutators>(storeCreator);

      if (enableDevtools) {
        const devtoolsStore = createStore(
          devtools(wrapForDevtools(storeCreator), {
            name: devtoolsName,
            enabled: enableDevtools,
          })
        );

        newStore.setState = devtoolsStore.setState;
        newStore.getState = devtoolsStore.getState;
        newStore.getInitialState = devtoolsStore.getInitialState;
        newStore.subscribe = devtoolsStore.subscribe;
      }

      onStoreInit?.(newStore);
      storeRef.current = newStore;
    }

    const store = storeRef.current;

    useEffect(() => {
      const readyCallback = onStoreReady ?? onStoreCreate;

      if (!isReadyRef.current && readyCallback) {
        readyCallback(store);
        isReadyRef.current = true;
      }
    }, [onStoreCreate, onStoreReady, store]);

    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
  }

  function useStoreContext(): StoreApiWithMutators<TState, TMutators> {
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

  function useContextStoreOptional(): StoreApiWithMutators<TState, TMutators> | null {
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

  function useContextStorePlain(): TState;
  function useContextStorePlain<T>(selector: (state: TState) => T): T;
  function useContextStorePlain<T>(selector?: (state: TState) => T): T | TState {
    const store = useStoreContext();
    const actualSelector = selector ?? ((state: TState) => state);
    return useStore<typeof store, T | TState>(store, actualSelector);
  }

  return {
    Provider,
    useContextStoreApi: useStoreContext,
    useContext: useStoreContext,
    useContextStore: useContextStoreWithSelector,
    useContextStorePlain,
    useIsInsideProvider,
    useContextStoreOptional,
    useOptionalContext: useContextStoreOptional,
  };
}
