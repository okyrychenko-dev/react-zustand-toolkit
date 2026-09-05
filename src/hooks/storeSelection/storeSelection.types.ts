import type { StoreApi } from "zustand";
import type { StorePlainHook, StoreValueHook } from "../../types/store-hooks.types";

export type SelectionStore<TState> = Pick<
  StoreApi<TState>,
  "getState" | "getInitialState" | "subscribe"
>;

export type StoreResolver<TState> = () => SelectionStore<TState>;

export interface StoreSelectionBindings<TState> {
  useStoreValue: StoreValueHook<TState>;
  useStorePlain: StorePlainHook<TState>;
}
