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
    const { useStore, store } = createShallowStore<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));
    const { result } = renderHook(() => useStore((state) => state.count));

    act(() => store.getState().increment());

    expect(result.current).toBe(1);
    expect(store.getState().count).toBe(1);
  });

  it("should preserve middleware-enhanced store capabilities", () => {
    const listener = vi.fn();
    const { store } = createShallowStore<TestStore, [["zustand/subscribeWithSelector", never]]>(
      subscribeWithSelector((set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }))
    );

    expectTypeOf(store.subscribe).toBeCallableWith((state: TestStore) => state.count, listener);

    const unsubscribe = store.subscribe((state) => state.count, listener);
    store.getState().increment();

    expect(listener).toHaveBeenCalledWith(1, 0);
    unsubscribe();
  });
});
