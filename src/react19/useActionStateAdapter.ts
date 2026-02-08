import { useActionState } from "react";

/**
 * Adapter around React 19 useActionState for store-related async actions.
 */
export function useActionStateAdapter<TState, TPayload>(
  action: (payload: TPayload) => Awaited<TState> | Promise<Awaited<TState>>,
  initialState: Awaited<TState>
): readonly [Awaited<TState>, (payload: TPayload) => void, boolean] {
  const reducer = (
    _previousState: Awaited<TState>,
    payload: TPayload
  ): Awaited<TState> | Promise<Awaited<TState>> => {
    return action(payload);
  };

  return useActionState(reducer, initialState);
}
