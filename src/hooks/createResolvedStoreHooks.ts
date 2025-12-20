import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import type { StoreApi } from "zustand";

/**
 * Creates hooks that resolve between context store and global store
 *
 * This pattern allows components to work seamlessly both inside and outside a provider:
 * - Inside provider: uses isolated store from context
 * - Outside provider: falls back to global singleton store
 *
 * @template TState - The shape of your store state
 * @param globalStoreApi - The global singleton store API
 * @param useContextStore - Hook that returns store from context (or null if outside provider)
 * @returns Hooks for resolved store access
 */
export function createResolvedStoreHooks<TState>(
  globalStoreApi: StoreApi<TState>,
  useContextStore: () => StoreApi<TState> | null
): {
  useResolvedStore: () => StoreApi<TState>;
  useResolvedStoreWithSelector: {
    (): TState;
    <T>(selector: (state: TState) => T): T;
  };
} {
  function useResolvedStore(): StoreApi<TState> {
    const contextStore = useContextStore();
    return contextStore ?? globalStoreApi;
  }

  function useResolvedStoreWithSelector(): TState;
  function useResolvedStoreWithSelector<T>(selector: (state: TState) => T): T;
  function useResolvedStoreWithSelector<T>(selector?: (state: TState) => T): T | TState {
    const store = useResolvedStore();
    const actualSelector = (state: TState): T | TState => (selector ? selector(state) : state);

    return useStore(store, useShallow(actualSelector));
  }

  return {
    useResolvedStore,
    useResolvedStoreWithSelector,
  };
}
