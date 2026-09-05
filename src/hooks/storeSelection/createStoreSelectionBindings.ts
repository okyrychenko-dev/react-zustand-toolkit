import { useStoreSelection, useStoreSelectionPlain } from "./useStoreSelection";
import type { StoreResolver, StoreSelectionBindings } from "./storeSelection.types";

export function createStoreSelectionBindings<TState>(
  useStoreResolver: StoreResolver<TState>
): StoreSelectionBindings<TState> {
  function useStoreValue(): TState;
  function useStoreValue<T>(
    selector: (state: TState) => T,
    equalityFn?: (left: T, right: T) => boolean
  ): T;
  function useStoreValue<T>(
    selector?: (state: TState) => T,
    equalityFn?: (left: T | TState, right: T | TState) => boolean
  ): T | TState {
    return useStoreSelection(useStoreResolver(), selector, equalityFn);
  }

  function useStorePlain(): TState;
  function useStorePlain<T>(selector: (state: TState) => T): T;
  function useStorePlain<T>(selector?: (state: TState) => T): T | TState {
    return useStoreSelectionPlain(useStoreResolver(), selector);
  }

  return { useStoreValue, useStorePlain };
}
