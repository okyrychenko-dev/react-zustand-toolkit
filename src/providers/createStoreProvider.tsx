import { isDefined } from "@okyrychenko-dev/type-utils";
import { type ReactNode, createContext, useContext, useEffect, useRef, useState } from "react";
import { createStore } from "zustand";
import { createStoreSelectionBindings } from "../hooks";
import type {
  StoreApiWithMutators,
  StoreMutatorTuple,
  StorePlainHook,
  StoreRecipe,
  StoreValueHook,
} from "../types";

/** Lifecycle callbacks for one Provider store. */
export interface StoreProviderConfig<
  TState = unknown,
  TMutators extends Array<StoreMutatorTuple> = [],
> {
  onStoreInit?: (store: StoreApiWithMutators<TState, TMutators>) => void;
  onStoreReady?: (store: StoreApiWithMutators<TState, TMutators>) => void;
}

/** Props for a generated Provider. */
export interface StoreProviderProps<
  TState = unknown,
  TInput = undefined,
  TMutators extends Array<StoreMutatorTuple> = [],
> extends StoreProviderConfig<TState, TMutators> {
  children: ReactNode;
  input: TInput;
}

/** Bindings returned by the standalone Provider-store factory. */
export interface StoreProviderResult<
  TState,
  TInput = undefined,
  TMutators extends Array<StoreMutatorTuple> = [],
> {
  Provider: (props: StoreProviderProps<TState, TInput, TMutators>) => ReactNode;
  useContextStoreApi: () => StoreApiWithMutators<TState, TMutators>;
  useContextStore: StoreValueHook<TState>;
  useContextStorePlain: StorePlainHook<TState>;
  useIsInsideProvider: () => boolean;
  useProviderStoreOptional: () => StoreApiWithMutators<TState, TMutators> | null;
}

/**
 * Creates an advanced standalone Provider-store module.
 *
 * Each Provider synchronously creates one isolated Store from its required inert input. Input is
 * consumed only at creation. `onStoreInit` completes before descendants observe the Store, while
 * `onStoreReady` runs after commit at most once for the Store lifetime.
 */
export function createStoreProvider<
  TState,
  TInput = undefined,
  TMutators extends Array<StoreMutatorTuple> = [],
>(
  storeRecipe: StoreRecipe<TState, TInput, TMutators>,
  contextName = "Store"
): StoreProviderResult<TState, TInput, TMutators> {
  const StoreContext = createContext<StoreApiWithMutators<TState, TMutators> | null>(null);
  StoreContext.displayName = `${contextName}Context`;

  function Provider({
    children,
    input,
    onStoreInit,
    onStoreReady,
  }: StoreProviderProps<TState, TInput, TMutators>): ReactNode {
    const isReadyRef = useRef(false);
    const [store] = useState<StoreApiWithMutators<TState, TMutators>>(() => {
      const newStore = createStore<TState, TMutators>(storeRecipe(input));
      onStoreInit?.(newStore);
      return newStore;
    });

    useEffect(() => {
      if (!isReadyRef.current && onStoreReady) {
        onStoreReady(store);
        isReadyRef.current = true;
      }
    }, [onStoreReady, store]);

    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
  }

  function useStoreContext(): StoreApiWithMutators<TState, TMutators> {
    const store = useContext(StoreContext);

    if (!isDefined(store)) {
      throw new Error(`${contextName} store hooks must be used within a ${contextName}Provider`);
    }

    return store;
  }

  function useIsInsideProvider(): boolean {
    const store = useContext(StoreContext);
    return isDefined(store);
  }

  function useProviderStoreOptional(): StoreApiWithMutators<TState, TMutators> | null {
    return useContext(StoreContext);
  }

  const { useStoreValue: useContextStore, useStorePlain: useContextStorePlain } =
    createStoreSelectionBindings(useStoreContext);

  return {
    Provider,
    useContextStoreApi: useStoreContext,
    useContextStore,
    useContextStorePlain,
    useIsInsideProvider,
    useProviderStoreOptional,
  };
}
