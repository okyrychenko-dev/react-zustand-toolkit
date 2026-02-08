import { useMemo } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import type { StoreApi } from "zustand";

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
    <T>(selector: (state: TState) => T, equalityFn?: (a: T, b: T) => boolean): T;
  };
} {
  function useResolvedStore(): StoreApi<TState> {
    const contextStore = useContextStore();
    return contextStore ?? globalStoreApi;
  }

  function useResolvedStoreWithSelector(): TState;
  function useResolvedStoreWithSelector<T>(
    selector: (state: TState) => T,
    equalityFn?: (a: T, b: T) => boolean
  ): T;
  function useResolvedStoreWithSelector<T>(
    selector?: (state: TState) => T,
    equalityFn?: (a: T | TState, b: T | TState) => boolean
  ): T | TState {
    const store = useResolvedStore();
    const defaultEquality = (a: T | TState, b: T | TState): boolean => shallow(a, b);
    const actualEquality = equalityFn ?? defaultEquality;
    const actualSelector = useMemo(() => {
      const baseSelector = (state: TState): T | TState => (selector ? selector(state) : state);
      return createSelectorWithEquality(baseSelector, actualEquality);
    }, [selector, actualEquality]);

    return useStore(store, actualSelector);
  }

  return {
    useResolvedStore,
    useResolvedStoreWithSelector,
  };
}
