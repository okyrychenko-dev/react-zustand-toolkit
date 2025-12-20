import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createStoreProvider } from "../createStoreProvider";
import type { ReactNode } from "react";
import type { StoreApi } from "zustand";

interface TestStore {
  value: number;
  increment: () => void;
}

describe("createStoreProvider", () => {
  it("should create provider and context hooks", () => {
    const { Provider, useContext, useContextStore, useIsInsideProvider } =
      createStoreProvider<TestStore>((set) => ({
        value: 0,
        increment: () => set((state) => ({ value: state.value + 1 })),
      }));

    expect(Provider).toBeDefined();
    expect(useContext).toBeDefined();
    expect(useContextStore).toBeDefined();
    expect(useIsInsideProvider).toBeDefined();
  });

  it("should throw error when used outside provider", () => {
    const { useContext } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    expect(() => {
      renderHook(() => useContext());
    }).toThrow();
  });

  it("should work inside provider", () => {
    const { Provider, useContextStore } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const wrapper = ({ children }: { children: ReactNode }) => <Provider>{children}</Provider>;

    const { result } = renderHook(() => useContextStore((state) => state.value), {
      wrapper,
    });

    expect(result.current).toBe(0);
  });

  it("should detect if inside provider", () => {
    const { Provider, useIsInsideProvider } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const { result: outsideResult } = renderHook(() => useIsInsideProvider());
    expect(outsideResult.current).toBe(false);

    const wrapper = ({ children }: { children: ReactNode }) => <Provider>{children}</Provider>;

    const { result: insideResult } = renderHook(() => useIsInsideProvider(), { wrapper });
    expect(insideResult.current).toBe(true);
  });

  it("should create isolated instances", () => {
    const { Provider, useContextStore } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const wrapper1 = ({ children }: { children: ReactNode }) => <Provider>{children}</Provider>;

    const wrapper2 = ({ children }: { children: ReactNode }) => <Provider>{children}</Provider>;

    const { result: result1 } = renderHook(() => useContextStore(), { wrapper: wrapper1 });
    const { result: result2 } = renderHook(() => useContextStore(), { wrapper: wrapper2 });

    // Both should start with same initial state
    expect(result1.current.value).toBe(0);
    expect(result2.current.value).toBe(0);

    // But they should be different instances
    expect(result1.current).not.toBe(result2.current);
  });

  it("should call onStoreCreate callback with store", () => {
    let receivedStore: StoreApi<TestStore> | null = null;

    const { Provider, useContextStore } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider
        onStoreCreate={(store) => {
          receivedStore = store;
        }}
      >
        {children}
      </Provider>
    );

    renderHook(() => useContextStore(), { wrapper });

    expect(receivedStore).not.toBeNull();
    expect(receivedStore).toHaveProperty("getState");
    expect(receivedStore).toHaveProperty("setState");
    expect(receivedStore).toHaveProperty("subscribe");
  });

  it("should allow store initialization via onStoreCreate", () => {
    interface StoreWithInit extends TestStore {
      initialized: boolean;
      setInitialized: (value: boolean) => void;
    }

    const { Provider, useContextStore } = createStoreProvider<StoreWithInit>((set) => ({
      value: 0,
      initialized: false,
      increment: () => set((state) => ({ value: state.value + 1 })),
      setInitialized: (value: boolean) => set({ initialized: value }),
    }));

    const wrapper = ({ children }: { children: ReactNode }) => (
      <Provider
        onStoreCreate={(store) => {
          store.getState().setInitialized(true);
        }}
      >
        {children}
      </Provider>
    );

    const { result } = renderHook(() => useContextStore((state) => state.initialized), {
      wrapper,
    });

    expect(result.current).toBe(true);
  });
});
