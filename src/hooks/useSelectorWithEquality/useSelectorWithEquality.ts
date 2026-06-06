import { useRef } from "react";
import type {
  SelectorCache,
  UseSelectorWithEqualityOptions,
  UseSelectorWithEqualityReturn,
} from "./useSelectorWithEquality.types";

export function useSelectorWithEquality<TState, TSelected>({
  cacheKey,
  equalityFn,
  selector,
}: UseSelectorWithEqualityOptions<TState, TSelected>): UseSelectorWithEqualityReturn<
  TState,
  TSelected
> {
  const cacheRef = useRef<SelectorCache<TSelected>>({
    hasValue: false,
    key: cacheKey,
  });

  return (state: TState): TSelected => {
    const nextValue = selector(state);
    const cache = cacheRef.current;

    if (cache.hasValue && Object.is(cache.key, cacheKey) && equalityFn(cache.value, nextValue)) {
      return cache.value;
    }

    cacheRef.current = {
      hasValue: true,
      key: cacheKey,
      value: nextValue,
    };
    return nextValue;
  };
}
