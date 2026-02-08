import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createStoreToolkit } from "../createStoreToolkit";
import type { ReactNode } from "react";

interface TestStore {
  count: number;
  increment: () => void;
}

describe("createStoreToolkit", () => {
  it("should create complete toolkit", () => {
    const toolkit = createStoreToolkit<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    expect(toolkit.useStore).toBeDefined();
    expect(toolkit.useStoreApi).toBeDefined();
    expect(toolkit.getProvider).toBeDefined();
    expect(toolkit.createProvider).toBeDefined();
    expect(toolkit.useResolvedStore).toBeDefined();
    expect(toolkit.useResolvedStoreWithSelector).toBeDefined();
  });

  it("should return shared provider from getProvider and createProvider", () => {
    const toolkit = createStoreToolkit<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    expect(toolkit.getProvider()).toBe(toolkit.createProvider());
  });

  it("should work with global store", () => {
    const { useStore } = createStoreToolkit<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    const { result } = renderHook(() => useStore((state) => state.count));
    expect(result.current).toBe(0);
  });

  it("should resolve to global store when outside provider", () => {
    const { useResolvedStoreWithSelector, useStoreApi } = createStoreToolkit<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    const { result: resolvedResult } = renderHook(() =>
      useResolvedStoreWithSelector((state) => state.count)
    );

    expect(resolvedResult.current).toBe(0);

    act(() => {
      useStoreApi.getState().increment();
    });

    expect(resolvedResult.current).toBe(1);
  });

  it("should resolve to context store when inside provider", () => {
    const toolkit = createStoreToolkit<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    const { Provider } = toolkit.createProvider();

    const wrapper = ({ children }: { children: ReactNode }) => <Provider>{children}</Provider>;

    const { result } = renderHook(
      () => toolkit.useResolvedStoreWithSelector((state) => state.count),
      { wrapper }
    );

    expect(result.current).toBe(0);
  });

  it("should keep global and provider stores independent", () => {
    const toolkit = createStoreToolkit<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    const { Provider } = toolkit.createProvider();

    // Global store
    const { result: globalResult } = renderHook(() =>
      toolkit.useResolvedStoreWithSelector((state) => state.count)
    );

    // Provider store
    const wrapper = ({ children }: { children: ReactNode }) => <Provider>{children}</Provider>;

    const { result: providerResult } = renderHook(
      () => toolkit.useResolvedStoreWithSelector((state) => state.count),
      { wrapper }
    );

    // Both start at 0
    expect(globalResult.current).toBe(0);
    expect(providerResult.current).toBe(0);

    // Increment global
    act(() => {
      toolkit.useStoreApi.getState().increment();
    });

    // Global changed, provider didn't
    expect(globalResult.current).toBe(1);
    expect(providerResult.current).toBe(0);
  });

  it("should support custom equality in resolved selector hook", () => {
    const toolkit = createStoreToolkit<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    const { result } = renderHook(() =>
      toolkit.useResolvedStoreWithSelector((state) => state.count, () => true)
    );

    expect(result.current).toBe(0);

    act(() => {
      toolkit.useStoreApi.getState().increment();
    });

    expect(result.current).toBe(0);
  });
});
