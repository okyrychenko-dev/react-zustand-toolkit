import type { StoreApi } from "zustand";

export type SelectionStore<TState> = Pick<
  StoreApi<TState>,
  "getState" | "getInitialState" | "subscribe"
>;
