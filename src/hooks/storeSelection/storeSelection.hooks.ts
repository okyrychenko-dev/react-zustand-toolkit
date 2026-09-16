import { useRef } from "react";
import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { identitySelector } from "./storeSelection.utils";
import type { SelectionCache, SelectionStore } from "./storeSelection.types";

function useRetainedStoreSelection<TState, TSelected>(
  store: SelectionStore<TState>,
  selector: (state: TState) => TSelected,
  equalityFn: (left: TSelected, right: TSelected) => boolean
): TSelected {
  const cacheRef = useRef<SelectionCache<TSelected>>({
    hasValue: false,
    store,
  });

  function retainEqualSelection(state: TState): TSelected {
    const nextValue = selector(state);
    const cache = cacheRef.current;

    if (cache.hasValue && Object.is(cache.store, store) && equalityFn(cache.value, nextValue)) {
      return cache.value;
    }

    cacheRef.current = {
      hasValue: true,
      store,
      value: nextValue,
    };

    return nextValue;
  }

  return useStore(store, retainEqualSelection);
}

export function useStoreSelection<TState, TSelected = TState>(
  store: SelectionStore<TState>,
  selector?: (state: TState) => TSelected,
  equalityFn?: (left: TSelected | TState, right: TSelected | TState) => boolean
): TSelected | TState {
  return useRetainedStoreSelection(
    store,
    (state: TState): TSelected | TState => (selector ? selector(state) : state),
    equalityFn ?? shallow
  );
}

export function useStoreSelectionPlain<TState, TSelected = TState>(
  store: SelectionStore<TState>,
  selector?: (state: TState) => TSelected
): TSelected | TState {
  const actualSelector = selector ?? identitySelector<TState>;

  return useStore<typeof store, TSelected | TState>(store, actualSelector);
}
