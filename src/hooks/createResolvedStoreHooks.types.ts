import type { StoreApiWithMutators, StoreMutatorTuple } from "../types";
import type { StorePlainHook, StoreValueHook } from "./storeSelection";

/** Bindings that resolve to a provider store when present, otherwise the global store. */
export interface ResolvedStoreBindings<TState, TMutators extends Array<StoreMutatorTuple> = []> {
  useResolvedStoreApi: () => StoreApiWithMutators<TState, TMutators>;
  useResolvedValue: StoreValueHook<TState>;
  useResolvedStorePlain: StorePlainHook<TState>;
}
