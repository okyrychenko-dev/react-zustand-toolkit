import { createResolvedStoreHooks } from "../hooks";
import { createStoreProvider } from "../providers";
import { createShallowStore } from "./createShallowStore";
import type { ReactNode } from "react";
import type { StoreProviderProps } from "../providers";
import type {
  StoreApiWithMutators,
  StoreMutatorTuple,
  StorePlainHook,
  StoreRecipe,
  StoreValueHook,
} from "../types";

/** Configuration for one declarative toolkit and its process-scoped Global store. */
export interface StoreToolkitOptions<TInput> {
  globalInput: TInput;
  name?: string;
}

/** Explicit access to the process-scoped Global store. */
export interface GlobalStoreBindings<TState, TMutators extends Array<StoreMutatorTuple> = []> {
  useStore: StoreValueHook<TState>;
  useStorePlain: StorePlainHook<TState>;
  store: StoreApiWithMutators<TState, TMutators>;
}

/** Declarative Resolved-store-first toolkit. */
export interface StoreToolkit<
  TState,
  TInput = undefined,
  TMutators extends Array<StoreMutatorTuple> = [],
> {
  Provider: (props: StoreProviderProps<TState, TInput, TMutators>) => ReactNode;
  useStore: StoreValueHook<TState>;
  useStorePlain: StorePlainHook<TState>;
  useStoreApi: () => StoreApiWithMutators<TState, TMutators>;
  global: GlobalStoreBindings<TState, TMutators>;
}

/**
 * Creates a declarative toolkit whose top-level hooks resolve the nearest Provider store and
 * otherwise fall back to the process-scoped Global store.
 */
export function createStoreToolkit<
  TState,
  TInput = undefined,
  TMutators extends Array<StoreMutatorTuple> = [],
>(
  storeRecipe: StoreRecipe<TState, TInput, TMutators>,
  { globalInput, name = "Store" }: StoreToolkitOptions<TInput>
): StoreToolkit<TState, TInput, TMutators> {
  const globalBindings = createShallowStore<TState, TMutators>(storeRecipe(globalInput));
  const provider = createStoreProvider<TState, TInput, TMutators>(storeRecipe, name);
  const resolved = createResolvedStoreHooks(
    globalBindings.store,
    provider.useProviderStoreOptional
  );

  return {
    Provider: provider.Provider,
    useStore: resolved.useResolvedValue,
    useStorePlain: resolved.useResolvedStorePlain,
    useStoreApi: resolved.useResolvedStoreApi,
    global: {
      useStore: globalBindings.useStore,
      useStorePlain: globalBindings.useStorePlain,
      store: globalBindings.store,
    },
  };
}
