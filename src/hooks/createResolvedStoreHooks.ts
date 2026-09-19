import { createStoreSelectionBindings } from "./storeSelection";
import type {
  StoreApiWithMutators,
  StoreMutatorTuple,
  StorePlainHook,
  StoreValueHook,
} from "../types";

/** Bindings that resolve to a Provider store when present, otherwise the Global store. */
export interface ResolvedStoreBindings<TState, TMutators extends Array<StoreMutatorTuple> = []> {
  useResolvedStoreApi: () => StoreApiWithMutators<TState, TMutators>;
  useResolvedValue: StoreValueHook<TState>;
  useResolvedStorePlain: StorePlainHook<TState>;
}

/**
 * Creates hooks that resolve between context store and global store
 *
 * This pattern allows components to work seamlessly both inside and outside a provider:
 * - Inside provider: uses isolated store from context
 * - Outside provider: falls back to global singleton store
 *
 * @template TState - The shape of your store state
 * @param globalStoreApi - The global singleton store API
 * @param useContextStore - Hook that returns store from context (or null if outside provider)
 * @returns Hooks for resolved store access
 */
export function createResolvedStoreHooks<TState, TMutators extends Array<StoreMutatorTuple> = []>(
  globalStoreApi: StoreApiWithMutators<TState, TMutators>,
  useContextStore: () => StoreApiWithMutators<TState, TMutators> | null
): ResolvedStoreBindings<TState, TMutators> {
  function useResolvedStoreApi(): StoreApiWithMutators<TState, TMutators> {
    const contextStore = useContextStore();
    return contextStore ?? globalStoreApi;
  }

  const { useStoreValue: useResolvedValue, useStorePlain: useResolvedStorePlain } =
    createStoreSelectionBindings(useResolvedStoreApi);

  return {
    useResolvedStoreApi,
    useResolvedValue,
    useResolvedStorePlain,
  };
}
