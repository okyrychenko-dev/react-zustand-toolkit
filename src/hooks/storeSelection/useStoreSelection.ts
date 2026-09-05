import { useStore } from "zustand";
import { shallow } from "zustand/shallow";
import { identitySelector } from "../../utils";
import { useSelectorWithEquality } from "../useSelectorWithEquality";
import type { SelectionStore } from "./storeSelection.types";

/** Selects from a store with store-scoped reference retention. */
export function useStoreSelection<TState, TSelected = TState>(
  store: SelectionStore<TState>,
  selector?: (state: TState) => TSelected,
  equalityFn?: (left: TSelected | TState, right: TSelected | TState) => boolean
): TSelected | TState {
  const actualSelector = useSelectorWithEquality({
    cacheKey: store,
    equalityFn: equalityFn ?? shallow,
    selector: (state: TState): TSelected | TState => (selector ? selector(state) : state),
  });

  return useStore(store, actualSelector);
}

/** Keeps plain selection independent of equality caching. */
export function useStoreSelectionPlain<TState, TSelected = TState>(
  store: SelectionStore<TState>,
  selector?: (state: TState) => TSelected
): TSelected | TState {
  const actualSelector = selector ?? identitySelector<TState>;

  return useStore<typeof store, TSelected | TState>(store, actualSelector);
}
