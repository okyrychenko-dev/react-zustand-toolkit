import { startTransition } from "react";

/**
 * Wrap a synchronous or asynchronous store action in a React transition.
 *
 * Async action promises are returned from the transition scope so React 19 can
 * keep the transition pending until the action settles.
 */
export function createTransitionAction<TArgs extends Array<unknown>>(
  action: (...args: TArgs) => void | Promise<void>
): (...args: TArgs) => void {
  return (...args: TArgs) => {
    startTransition(() => action(...args));
  };
}
