import { act, renderHook } from "@testing-library/react";
import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { subscribeWithSelector } from "zustand/middleware";
import { createShallowStore } from "../createShallowStore";

interface TestStore {
  count: number;
  increment: () => void;
}

describe("createShallowStore", () => {
  it("should select and update the global store", () => {
    const { useStore, useStoreApi } = createShallowStore<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));
    const { result } = renderHook(() => useStore((state) => state.count));

    act(() => useStoreApi.getState().increment());

    expect(result.current).toBe(1);
    expect(useStoreApi.getState().count).toBe(1);
  });

  it("should preserve middleware-enhanced store capabilities", () => {
    const listener = vi.fn();
    const { useStoreApi } = createShallowStore<
      TestStore,
      [["zustand/subscribeWithSelector", never]]
    >(
      subscribeWithSelector((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }))
    );

    expectTypeOf(useStoreApi.subscribe).toBeCallableWith(
      (state: TestStore) => state.count,
      listener
    );

    const unsubscribe = useStoreApi.subscribe((state) => state.count, listener);
    useStoreApi.getState().increment();

    expect(listener).toHaveBeenCalledWith(1, 0);
    unsubscribe();
  });
});
