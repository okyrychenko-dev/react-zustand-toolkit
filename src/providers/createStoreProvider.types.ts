import type { ReactNode } from "react";
import type { StorePlainHook, StoreValueHook } from "../hooks";
import type { StoreApiWithMutators, StoreMutatorTuple } from "../types";

/** Configuration for store provider lifecycle. */
export interface StoreProviderConfig<
  TState = unknown,
  TMutators extends Array<StoreMutatorTuple> = [],
> {
  /** Pure synchronous initialization invoked when the store instance is created. */
  onStoreInit?: (store: StoreApiWithMutators<TState, TMutators>) => void;
  /** Post-commit callback invoked at most once for each provider store instance. */
  onStoreReady?: (store: StoreApiWithMutators<TState, TMutators>) => void;
}

/** Props for a generated provider. */
export interface StoreProviderProps<
  TState = unknown,
  TMutators extends Array<StoreMutatorTuple> = [],
> extends StoreProviderConfig<TState, TMutators> {
  children: ReactNode;
}

/** Bindings returned by the store provider factory. */
export interface StoreProviderResult<TState, TMutators extends Array<StoreMutatorTuple> = []> {
  Provider: (props: StoreProviderProps<TState, TMutators>) => ReactNode;
  useContextStoreApi: () => StoreApiWithMutators<TState, TMutators>;
  useContextStore: StoreValueHook<TState>;
  useContextStorePlain: StorePlainHook<TState>;
  useIsInsideProvider: () => boolean;
  useContextStoreOptional: () => StoreApiWithMutators<TState, TMutators> | null;
}
