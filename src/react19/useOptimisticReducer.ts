import { startTransition, useCallback, useOptimistic } from "react";

/**
 * Thin wrapper around React 19 useOptimistic for optimistic store UIs.
 */
export function useOptimisticReducer<TState, TInput>(
  committedState: TState,
  reducer: (currentState: TState, input: TInput) => TState
): readonly [TState, (input: TInput) => void] {
  const [optimisticState, dispatchOptimistic] = useOptimistic(committedState, reducer);

  const dispatchInTransition = useCallback(
    (input: TInput) => {
      startTransition(() => {
        dispatchOptimistic(input);
      });
    },
    [dispatchOptimistic]
  );

  const result: readonly [TState, (input: TInput) => void] = [
    optimisticState,
    dispatchInTransition,
  ];
  return result;
}
