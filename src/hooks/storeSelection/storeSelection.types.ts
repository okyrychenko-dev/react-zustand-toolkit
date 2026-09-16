import type { StoreApi } from "zustand";
import type { StorePlainHook, StoreValueHook } from "../../types/store-hooks.types";

export type SelectionStore<TState> = Pick<
  StoreApi<TState>,
  "getState" | "getInitialState" | "subscribe"
>;

export type StoreResolver<TState> = () => SelectionStore<TState>;

export interface EmptySelectionCache {
  hasValue: false;
  store: unknown;
}

export interface RetainedSelectionCache<TSelected> {
  hasValue: true;
  store: unknown;
  value: TSelected;
}

export type SelectionCache<TSelected> = EmptySelectionCache | RetainedSelectionCache<TSelected>;

export interface StoreSelectionBindings<TState> {
  useStoreValue: StoreValueHook<TState>;
  useStorePlain: StorePlainHook<TState>;
}
