import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOptimisticReducer } from "../useOptimisticReducer";

describe("useOptimisticReducer", () => {
  it("should return optimistic state and dispatcher", () => {
    const { result } = renderHook(() =>
      useOptimisticReducer(1, (state, input: number) => state + input)
    );

    expect(result.current[0]).toBe(1);
    expect(typeof result.current[1]).toBe("function");

    expect(() => {
      act(() => {
        result.current[1](2);
      });
    }).not.toThrow();
  });
});
