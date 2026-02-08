import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { shallow } from "zustand/shallow";
import type { MutatorsStateCreator, ShallowStoreBindings } from "../types";
import type { StoreApi, StoreMutators } from "zustand";

function createSelectorWithEquality<TState, TSelected>(
  selector: (state: TState) => TSelected,
  equalityFn: (a: TSelected, b: TSelected) => boolean
): (state: TState) => TSelected {
  let hasPrev = false;
  let prevValue: TSelected;

  return (state: TState): TSelected => {
    const nextValue = selector(state);

    if (hasPrev && equalityFn(prevValue, nextValue)) {
      return prevValue;
    }

    hasPrev = true;
    prevValue = nextValue;
    return nextValue;
  };
}

/**
 * Creates a Zustand store with automatic shallow comparison for all selectors.
 *
 * This utility wraps Zustand's `createStore` and returns a hook that automatically
 * uses shallow comparison for all selectors. This prevents unnecessary re-renders when
 * selecting multiple values from the store, as it only re-renders when the actual
 * values change, not when the reference changes.
 *
 * Without shallow comparison, selecting multiple values like `{ count, name }` would
 * cause a re-render on every store update because the object reference changes.
 * With shallow comparison, it only re-renders when `count` or `name` actually change.
 *
 * The returned hook has two signatures:
 * - `useStore()` - Returns the entire store state
 * - `useStore(selector)` - Returns the selected value(s) with shallow comparison
 *
 * @template TState - The shape of your store state and actions
 * @template TMutators - Array of mutators (middleware) applied to the store (default: [])
 *
 * @param storeCreator - Function that creates the store state and actions
 *
 * @returns Object with two properties:
 *          - `useStore`: Hook to access store with shallow comparison
 *          - `useStoreApi`: Direct access to the store API for imperative usage
 *
 * @example
 * Basic counter store with shallow comparison
 * ```tsx
 * import { createShallowStore } from '@okyrychenko-dev/react-zustand-toolkit';
 *
 * interface CounterState {
 *   count: number;
 *   name: string;
 *   increment: () => void;
 *   decrement: () => void;
 *   setName: (name: string) => void;
 * }
 *
 * const { useStore: useCounterStore } = createShallowStore<CounterState>((set) => ({
 *   count: 0,
 *   name: 'Counter',
 *   increment: () => set((state) => ({ count: state.count + 1 })),
 *   decrement: () => set((state) => ({ count: state.count - 1 })),
 *   setName: (name) => set({ name }),
 * }));
 *
 * // Component only re-renders when count or name changes
 * function Counter() {
 *   const { count, increment } = useCounterStore((state) => ({
 *     count: state.count,
 *     increment: state.increment,
 *   }));
 *
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={increment}>+</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * With DevTools middleware
 * ```tsx
 * import { devtools } from 'zustand/middleware';
 * import { createShallowStore } from '@okyrychenko-dev/react-zustand-toolkit';
 *
 * const { useStore: useStore } = createShallowStore(
 *   devtools(
 *     (set) => ({
 *       bears: 0,
 *       increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
 *       removeAllBears: () => set({ bears: 0 }),
 *     }),
 *     { name: 'BearsStore' }
 *   )
 * );
 * ```
 *
 * @example
 * Accessing entire state
 * ```tsx
 * function Dashboard() {
 *   // Gets entire state with shallow comparison
 *   const state = useCounterStore();
 *
 *   return (
 *     <div>
 *       <h1>{state.name}</h1>
 *       <p>Count: {state.count}</p>
 *       <button onClick={state.increment}>Increment</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * Using store API for imperative access
 * ```tsx
 * const { useStore, useStoreApi } = createShallowStore<CounterState>(...);
 *
 * function ExternalButton() {
 *   const storeApi = useStoreApi();
 *
 *   const handleClick = () => {
 *     // Direct imperative access without hook
 *     const currentCount = storeApi.getState().count;
 *     console.log('Current count:', currentCount);
 *
 *     // Directly mutate
 *     storeApi.setState({ count: currentCount + 10 });
 *   };
 *
 *   return <button onClick={handleClick}>Add 10</button>;
 * }
 * ```
 *
 * @see {@link https://github.com/pmndrs/zustand | Zustand documentation}
 * @see {@link createStoreProvider} for creating a store with React Context provider
 * @see {@link createStoreToolkit} for advanced store utilities
 *
 * @public
 * @since 0.6.0
 */
export function createShallowStore<
  TState,
  TMutators extends Array<[keyof StoreMutators<TState, TState>, unknown]> = [],
>(storeCreator: MutatorsStateCreator<TState, TMutators>): ShallowStoreBindings<TState> {
  const storeApi: StoreApi<TState> = createStore<TState, TMutators>(storeCreator);

  function useShallowStore(): TState;
  function useShallowStore<T>(selector: (state: TState) => T): T;
  function useShallowStore<T>(
    selector: (state: TState) => T,
    equalityFn: (a: T, b: T) => boolean
  ): T;
  function useShallowStore<T>(
    selector?: (state: TState) => T,
    equalityFn?: (a: T | TState, b: T | TState) => boolean
  ): T | TState {
    const defaultEquality = (a: T | TState, b: T | TState): boolean => shallow(a, b);
    const actualEquality = equalityFn ?? defaultEquality;
    const actualSelector = useMemo(() => {
      const baseSelector = (state: TState): T | TState => (selector ? selector(state) : state);
      return createSelectorWithEquality(baseSelector, actualEquality);
    }, [selector, actualEquality]);

    return useStore(storeApi, actualSelector);
  }

  return {
    useStore: useShallowStore,
    useStoreApi: storeApi,
  };
}
