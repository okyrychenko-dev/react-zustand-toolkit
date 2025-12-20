import { type ReactNode, createContext, useContext, useEffect, useMemo, useRef } from "react";
import { createStore, useStore } from "zustand";
import { devtools } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import type { MutatorsStateCreator, StoreProviderProps, StoreProviderResult } from "../types";
import type { StateCreator, StoreApi, StoreMutators } from "zustand";

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
 * Creates a React Context provider for isolated Zustand store instances
 *
 * This is useful for:
 * - Server-side rendering (each request gets its own store)
 * - Testing (no need for beforeEach cleanup)
 * - Micro-frontends (isolated state per app)
 * - Multiple instances of the same component tree with independent state
 *
 * @template TState - The shape of your store state
 * @template TMutators - Array of mutators (middleware) applied to the store
 * @param storeCreator - Function that creates the store state and actions
 * @param contextName - Optional name for better debugging (used in React DevTools)
 * @returns Provider component and hooks to access the context store
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
    const lastStoreRef = useRef<StoreApi<TState> | null>(null);

    const store = useMemo(() => {
      const newStore = enableDevtools
        ? createStore(
            devtools(wrapForDevtools(storeCreator), {
              name: devtoolsName,
              enabled: enableDevtools,
            })
          )
        : createStore<TState, TMutators>(storeCreator);

      return newStore;
    }, [enableDevtools, devtoolsName]);

    useEffect(() => {
      if (!onStoreCreate || lastStoreRef.current === store) {
        return;
      }

      lastStoreRef.current = store;
      onStoreCreate(store);
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
  function useContextStoreWithSelector<T>(selector?: (state: TState) => T): T | TState {
    const store = useStoreContext();
    const actualSelector = (state: TState): T | TState => (selector ? selector(state) : state);

    return useStore(store, useShallow(actualSelector));
  }

  return {
    Provider,
    useContext: useStoreContext,
    useContextStore: useContextStoreWithSelector,
    useIsInsideProvider,
    useOptionalContext,
  };
}
