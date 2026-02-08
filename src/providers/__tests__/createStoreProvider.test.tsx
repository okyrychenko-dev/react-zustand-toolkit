import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createStoreProvider } from "../createStoreProvider";
import type { PropsWithChildren } from "react";
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

    const wrapper = ({ children }: PropsWithChildren) => <Provider>{children}</Provider>;

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

    const wrapper = ({ children }: PropsWithChildren) => <Provider>{children}</Provider>;

    const { result: insideResult } = renderHook(() => useIsInsideProvider(), { wrapper });
    expect(insideResult.current).toBe(true);
  });

  it("should create isolated instances", () => {
    const { Provider, useContextStore } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const wrapper1 = ({ children }: PropsWithChildren) => <Provider>{children}</Provider>;

    const wrapper2 = ({ children }: PropsWithChildren) => <Provider>{children}</Provider>;

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

    const wrapper = ({ children }: PropsWithChildren) => (
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

    const wrapper = ({ children }: PropsWithChildren) => (
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

  it("should work with enableDevtools explicitly set to false", () => {
    const { Provider, useContextStore } = createStoreProvider<TestStore>((set) => ({
      value: 42,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider enableDevtools={false}>{children}</Provider>
    );

    const { result } = renderHook(() => useContextStore((state) => state.value), {
      wrapper,
    });

    expect(result.current).toBe(42);
  });

  it("should work with enableDevtools explicitly set to true", () => {
    const { Provider, useContextStore } = createStoreProvider<TestStore>(
      (set) => ({
        value: 100,
        increment: () => set((state) => ({ value: state.value + 1 })),
      }),
      "TestDevtoolsStore"
    );

    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider enableDevtools={true} devtoolsName="CustomDevtoolsName">
        {children}
      </Provider>
    );

    const { result } = renderHook(() => useContextStore((state) => state.value), {
      wrapper,
    });

    expect(result.current).toBe(100);
  });

  it("should return null from useOptionalContext when outside provider", () => {
    const { useOptionalContext } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const { result } = renderHook(() => useOptionalContext());

    expect(result.current).toBeNull();
  });

  it("should return store from useOptionalContext when inside provider", () => {
    const { Provider, useOptionalContext } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const wrapper = ({ children }: PropsWithChildren) => <Provider>{children}</Provider>;

    const { result } = renderHook(() => useOptionalContext(), { wrapper });

    expect(result.current).not.toBeNull();
    expect(result.current).toHaveProperty("getState");
    expect(result.current).toHaveProperty("setState");
  });

  it("should call onStoreCreate only once for rerenders", () => {
    let calls = 0;

    const { Provider, useContextStore } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider
        onStoreCreate={() => {
          calls += 1;
        }}
      >
        {children}
      </Provider>
    );

    const { rerender } = renderHook(() => useContextStore((state) => state.value), { wrapper });

    rerender();
    rerender();

    expect(calls).toBe(1);
  });

  it("should support custom equality for context selector hook", () => {
    const { Provider, useContext, useContextStore } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const wrapper = ({ children }: PropsWithChildren) => <Provider>{children}</Provider>;

    const { result } = renderHook(
      () => ({
        store: useContext(),
        value: useContextStore((state) => state.value, () => true),
      }),
      { wrapper }
    );

    expect(result.current.value).toBe(0);

    act(() => {
      result.current.store.getState().increment();
    });

    expect(result.current.value).toBe(0);
  });
});
