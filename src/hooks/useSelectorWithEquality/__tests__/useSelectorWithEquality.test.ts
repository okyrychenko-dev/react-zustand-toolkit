import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { shallow } from "zustand/shallow";
import { useSelectorWithEquality } from "..";

interface TestState {
  count: number;
  label: string;
}

describe("useSelectorWithEquality", () => {
  it("should preserve the selected reference when equality passes", () => {
    const state: TestState = {
      count: 1,
      label: "initial",
    };
    const { result, rerender } = renderHook(() =>
      useSelectorWithEquality({
        cacheKey: "store",
        equalityFn: shallow,
        selector: (currentState: TestState) => ({ count: currentState.count }),
      })
    );
    const initialSelection = result.current(state);

    rerender();

    expect(result.current(state)).toBe(initialSelection);
  });

  it("should reset the selected reference when the cache key changes", () => {
    const state: TestState = {
      count: 1,
      label: "initial",
    };
    const { result, rerender } = renderHook(
      ({ cacheKey }: { cacheKey: string }) =>
        useSelectorWithEquality({
          cacheKey,
          equalityFn: shallow,
          selector: (currentState: TestState) => ({ count: currentState.count }),
        }),
      {
        initialProps: {
          cacheKey: "global",
        },
      }
    );
    const globalSelection = result.current(state);

    rerender({
      cacheKey: "context",
    });

    expect(result.current(state)).not.toBe(globalSelection);
  });
});
