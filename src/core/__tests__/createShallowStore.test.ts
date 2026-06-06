import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createShallowStore } from "../createShallowStore";

interface TestStore {
  count: number;
  name: string;
  increment: () => void;
  setName: (name: string) => void;
}

describe("createShallowStore", () => {
  it("should create a store with shallow comparison", () => {
    const { useStore } = createShallowStore<TestStore>((set) => ({
      count: 0,
      name: "test",
      increment: () => set((state) => ({ count: state.count + 1 })),
      setName: (name: string) => set({ name }),
    }));

    const { result } = renderHook(() => useStore());

    expect(result.current.count).toBe(0);
    expect(result.current.name).toBe("test");
  });

  it("should work with selector", () => {
    const { useStore } = createShallowStore<TestStore>((set) => ({
      count: 0,
      name: "test",
      increment: () => set((state) => ({ count: state.count + 1 })),
      setName: (name: string) => set({ name }),
    }));

    const { result } = renderHook(() => useStore((state) => state.count));

    expect(result.current).toBe(0);
  });

  it("should expose plain selector access", () => {
    const { useStorePlain } = createShallowStore<TestStore>((set) => ({
      count: 0,
      name: "test",
      increment: () => set((state) => ({ count: state.count + 1 })),
      setName: (name: string) => set({ name }),
    }));

    const { result } = renderHook(() => useStorePlain((state) => state.name));

    expect(result.current).toBe("test");
  });

  it("should update state correctly", () => {
    const { useStore, useStoreApi } = createShallowStore<TestStore>((set) => ({
      count: 0,
      name: "test",
      increment: () => set((state) => ({ count: state.count + 1 })),
      setName: (name: string) => set({ name }),
    }));

    const { result } = renderHook(() => useStore((state) => state.count));

    act(() => {
      useStoreApi.getState().increment();
    });

    expect(result.current).toBe(1);

    act(() => {
      useStoreApi.getState().increment();
    });

    expect(result.current).toBe(2);
  });

  it("should provide access to store API", () => {
    const { useStoreApi } = createShallowStore<TestStore>((set) => ({
      count: 0,
      name: "test",
      increment: () => set((state) => ({ count: state.count + 1 })),
      setName: (name: string) => set({ name }),
    }));

    const state = useStoreApi.getState();
    expect(state.count).toBe(0);

    act(() => {
      state.increment();
    });

    expect(useStoreApi.getState().count).toBe(1);
  });

  it("should handle multiple selectors independently", () => {
    const { useStore } = createShallowStore<TestStore>((set) => ({
      count: 0,
      name: "test",
      increment: () => set((state) => ({ count: state.count + 1 })),
      setName: (name: string) => set({ name }),
    }));

    const { result: countResult } = renderHook(() => useStore((state) => state.count));
    const { result: nameResult } = renderHook(() => useStore((state) => state.name));

    expect(countResult.current).toBe(0);
    expect(nameResult.current).toBe("test");
  });

  it("should support custom equality function", () => {
    const { useStore, useStoreApi } = createShallowStore<TestStore>((set) => ({
      count: 0,
      name: "test",
      increment: () => set((state) => ({ count: state.count + 1 })),
      setName: (name: string) => set({ name }),
    }));

    const { result } = renderHook(() =>
      useStore(
        (state) => state.count,
        () => true
      )
    );

    expect(result.current).toBe(0);

    act(() => {
      useStoreApi.getState().increment();
    });

    // custom equality always returns true, so selection remains stable
    expect(result.current).toBe(0);
  });

  it("should keep shallow mode and plain mode behavior distinct", () => {
    const { useStore, useStorePlain, useStoreApi } = createShallowStore<TestStore>((set) => ({
      count: 0,
      name: "test",
      increment: () => set((state) => ({ count: state.count + 1 })),
      setName: (name: string) => set({ name }),
    }));

    let shallowRenders = 0;
    let plainRenders = 0;

    renderHook(() => {
      shallowRenders += 1;
      return useStore((state) => ({ count: state.count }));
    });

    renderHook(() => {
      plainRenders += 1;
      return useStorePlain();
    });

    act(() => {
      useStoreApi.getState().setName("updated");
    });

    expect(shallowRenders).toBe(1);
    expect(plainRenders).toBe(2);
  });

  it("should preserve shallow selection reference across parent rerenders", () => {
    const { useStore } = createShallowStore<TestStore>((set) => ({
      count: 0,
      name: "test",
      increment: () => set((state) => ({ count: state.count + 1 })),
      setName: (name: string) => set({ name }),
    }));

    const { result, rerender } = renderHook(() => useStore((state) => ({ count: state.count })));
    const initialSelection = result.current;

    rerender();

    expect(result.current).toBe(initialSelection);
  });
});
