import type { StorePlainHook, StoreValueHook } from "../hooks";
import type { StoreApiWithMutators, StoreMutatorTuple } from "../types";

/** Store bindings with shallow comparison built in. */
export interface ShallowStoreBindings<TState, TMutators extends Array<StoreMutatorTuple> = []> {
  useStore: StoreValueHook<TState>;
  useStorePlain: StorePlainHook<TState>;
  useStoreApi: StoreApiWithMutators<TState, TMutators>;
}
