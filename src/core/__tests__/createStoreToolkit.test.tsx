import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createStoreToolkit } from "../createStoreToolkit";
import type { ReactNode } from "react";

interface TestStore {
  count: number;
  increment: () => void;
}

interface LegacyToolkitApi {
  createProvider: () => { Provider: (props: { children: ReactNode }) => ReactNode };
  useResolvedStore: () => unknown;
  useResolvedStoreWithSelector: <T>(
    selector: (state: TestStore) => T,
    equalityFn?: (a: T, b: T) => boolean
  ) => T;
}

describe("createStoreToolkit", () => {
  it("should create complete toolkit", () => {
    const toolkit = createStoreToolkit<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));
    const legacyToolkit: LegacyToolkitApi = toolkit;

    expect(toolkit.useStore).toBeDefined();
    expect(toolkit.useStorePlain).toBeDefined();
    expect(toolkit.useStoreApi).toBeDefined();
    expect(toolkit.provider).toBeDefined();
    expect(toolkit.getProvider).toBeDefined();
    expect(legacyToolkit.createProvider).toBeDefined();
    expect(toolkit.useResolvedStoreApi).toBeDefined();
    expect(legacyToolkit.useResolvedStore).toBeDefined();
    expect(toolkit.useResolvedValue).toBeDefined();
    expect(legacyToolkit.useResolvedStoreWithSelector).toBeDefined();
    expect(toolkit.useResolvedStorePlain).toBeDefined();
  });

  it("should expose the shared provider through all provider access paths", () => {
    const toolkit = createStoreToolkit<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));
    const legacyToolkit: LegacyToolkitApi = toolkit;

    expect(toolkit.provider).toBe(toolkit.getProvider());
    expect(toolkit.getProvider()).toBe(legacyToolkit.createProvider());
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
    const { useResolvedValue, useStoreApi } = createStoreToolkit<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    const { result: resolvedResult } = renderHook(() => useResolvedValue((state) => state.count));

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
    const legacyToolkit: LegacyToolkitApi = toolkit;

    const { Provider } = toolkit.provider;

    const wrapper = ({ children }: { children: ReactNode }) => <Provider>{children}</Provider>;

    const { result } = renderHook(
      () => legacyToolkit.useResolvedStoreWithSelector((state) => state.count),
      { wrapper }
    );

    expect(result.current).toBe(0);
  });

  it("should keep global and provider stores independent", () => {
    const toolkit = createStoreToolkit<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));
    const legacyToolkit: LegacyToolkitApi = toolkit;

    const { Provider } = toolkit.provider;

    // Global store
    const { result: globalResult } = renderHook(() =>
      legacyToolkit.useResolvedStoreWithSelector((state) => state.count)
    );

    // Provider store
    const wrapper = ({ children }: { children: ReactNode }) => <Provider>{children}</Provider>;

    const { result: providerResult } = renderHook(
      () => legacyToolkit.useResolvedStoreWithSelector((state) => state.count),
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
    const legacyToolkit: LegacyToolkitApi = toolkit;

    const { result } = renderHook(() =>
      legacyToolkit.useResolvedStoreWithSelector(
        (state) => state.count,
        () => true
      )
    );

    expect(result.current).toBe(0);

    act(() => {
      toolkit.useStoreApi.getState().increment();
    });

    expect(result.current).toBe(0);
  });

  it("should expose plain resolved selector access", () => {
    const toolkit = createStoreToolkit<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));
    const legacyToolkit: LegacyToolkitApi = toolkit;

    const { result } = renderHook(() => toolkit.useResolvedStorePlain((state) => state.count));
    const { result: apiResult } = renderHook(() => toolkit.useResolvedStoreApi());

    expect(result.current).toBe(0);
    expect(apiResult.current).toBe(toolkit.useStoreApi);
    expect(toolkit.useResolvedValue).toBe(legacyToolkit.useResolvedStoreWithSelector);
  });
});
