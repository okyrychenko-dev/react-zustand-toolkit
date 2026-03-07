import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useActionStateAdapter } from "../useActionStateAdapter";

describe("useActionStateAdapter", () => {
  it("should update state after action dispatch", async () => {
    const { result } = renderHook(() => useActionStateAdapter((payload: number) => payload * 2, 0));

    expect(result.current[0]).toBe(0);

    act(() => {
      result.current[1](5);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(10);
    });
  });
});
