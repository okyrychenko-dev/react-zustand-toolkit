import { startTransition } from "react";

/**
 * Wrap a store action to run in a React transition.
 */
export function createTransitionAction<TArgs extends Array<unknown>>(
  action: (...args: TArgs) => void
): (...args: TArgs) => void {
  return (...args: TArgs) => {
    startTransition(() => {
      action(...args);
    });
  };
}
