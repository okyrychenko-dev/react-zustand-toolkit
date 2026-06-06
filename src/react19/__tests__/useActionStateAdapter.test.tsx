import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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

  it("should use the latest action after rerender", async () => {
    const initialAction = vi.fn((payload: number) => payload * 2);
    const latestAction = vi.fn((payload: number) => payload * 3);
    const { result, rerender } = renderHook(
      ({ action }: { action: (payload: number) => number }) => useActionStateAdapter(action, 0),
      {
        initialProps: {
          action: initialAction,
        },
      }
    );

    rerender({
      action: latestAction,
    });

    act(() => {
      result.current[1](5);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(15);
    });
    expect(initialAction).not.toHaveBeenCalled();
    expect(latestAction).toHaveBeenCalledWith(5);
  });
});
