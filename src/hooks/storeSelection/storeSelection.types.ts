import type { StoreApi } from "zustand";

export type SelectionStore<TState> = Pick<
  StoreApi<TState>,
  "getState" | "getInitialState" | "subscribe"
>;

export interface StoreValueHook<TState> {
  (): TState;
  <T>(selector: (state: TState) => T, equalityFn?: (left: T, right: T) => boolean): T;
}

export interface StorePlainHook<TState> {
  (): TState;
  <T>(selector: (state: TState) => T): T;
}
