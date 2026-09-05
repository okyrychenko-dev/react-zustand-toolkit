import type { StorePlainHook, StoreValueHook } from "./store-hooks.types";
import type { StoreApiWithMutators, StoreMutatorTuple } from "./store.types";

/** Bindings that resolve to a provider store when present, otherwise the global store. */
export interface ResolvedStoreBindings<TState, TMutators extends Array<StoreMutatorTuple> = []> {
  useResolvedStoreApi: () => StoreApiWithMutators<TState, TMutators>;
  useResolvedValue: StoreValueHook<TState>;
  useResolvedStorePlain: StorePlainHook<TState>;
}

/** Store bindings with shallow comparison built in. */
export interface ShallowStoreBindings<TState, TMutators extends Array<StoreMutatorTuple> = []> {
  useStore: StoreValueHook<TState>;
  useStorePlain: StorePlainHook<TState>;
  useStoreApi: StoreApiWithMutators<TState, TMutators>;
}
