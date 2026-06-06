import { act, render, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createStoreProvider } from "../createStoreProvider";
import type { PropsWithChildren } from "react";
import type { StoreApi } from "zustand";

interface TestStore {
  value: number;
  increment: () => void;
}

interface LegacyProviderProps {
  onStoreCreate?: () => void;
}

describe("createStoreProvider", () => {
  it("should create provider and context hooks", () => {
    const {
      Provider,
      useContextStoreApi,
      useContextStore,
      useContextStorePlain,
      useIsInsideProvider,
    } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    expect(Provider).toBeDefined();
    expect(useContextStoreApi).toBeDefined();
    expect(useContextStore).toBeDefined();
    expect(useContextStorePlain).toBeDefined();
    expect(useIsInsideProvider).toBeDefined();
  });

  it("should throw error when used outside provider", () => {
    const { useContextStoreApi } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    expect(() => {
      renderHook(() => useContextStoreApi());
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

  it("should call onStoreReady callback with store", async () => {
    let receivedStore: StoreApi<TestStore> | null = null;

    const { Provider, useContextStore } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider
        onStoreReady={(store) => {
          receivedStore = store;
        }}
      >
        {children}
      </Provider>
    );

    renderHook(() => useContextStore(), { wrapper });

    await waitFor(() => {
      expect(receivedStore).not.toBeNull();
    });
    expect(receivedStore).toHaveProperty("getState");
    expect(receivedStore).toHaveProperty("setState");
    expect(receivedStore).toHaveProperty("subscribe");
  });

  it("should allow store initialization via onStoreInit", () => {
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
        onStoreInit={(store) => {
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

  it("should return null from useContextStoreOptional when outside provider", () => {
    const { useContextStoreOptional } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const { result } = renderHook(() => useContextStoreOptional());

    expect(result.current).toBeNull();
  });

  it("should return store from useContextStoreOptional when inside provider", () => {
    const { Provider, useContextStoreOptional } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const wrapper = ({ children }: PropsWithChildren) => <Provider>{children}</Provider>;

    const { result } = renderHook(() => useContextStoreOptional(), { wrapper });

    expect(result.current).not.toBeNull();
    expect(result.current).toHaveProperty("getState");
    expect(result.current).toHaveProperty("setState");
  });

  it("should call onStoreReady only once for rerenders", async () => {
    let calls = 0;

    const { Provider, useContextStore } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider
        onStoreReady={() => {
          calls += 1;
        }}
      >
        {children}
      </Provider>
    );

    const { rerender } = renderHook(() => useContextStore((state) => state.value), { wrapper });

    await waitFor(() => {
      expect(calls).toBe(1);
    });

    rerender();
    rerender();

    expect(calls).toBe(1);
  });

  it("should call onStoreReady when it is provided after the initial render", async () => {
    const onStoreReady = vi.fn();
    const { Provider } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));
    const { rerender } = render(<Provider>content</Provider>);

    expect(onStoreReady).not.toHaveBeenCalled();

    rerender(<Provider onStoreReady={onStoreReady}>content</Provider>);

    await waitFor(() => {
      expect(onStoreReady).toHaveBeenCalledOnce();
    });
  });

  it("should keep deprecated onStoreCreate as onStoreReady alias", async () => {
    let calls = 0;

    const { Provider, useContextStore } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const legacyProps: LegacyProviderProps = {
      onStoreCreate: () => {
        calls += 1;
      },
    };

    const wrapper = ({ children }: PropsWithChildren) => (
      <Provider {...legacyProps}>{children}</Provider>
    );

    renderHook(() => useContextStore((state) => state.value), { wrapper });

    await waitFor(() => {
      expect(calls).toBe(1);
    });
  });

  it("should support custom equality for context selector hook", () => {
    const { Provider, useContextStoreApi, useContextStore } = createStoreProvider<TestStore>(
      (set) => ({
        value: 0,
        increment: () => set((state) => ({ value: state.value + 1 })),
      })
    );

    const wrapper = ({ children }: PropsWithChildren) => <Provider>{children}</Provider>;

    const { result } = renderHook(
      () => ({
        store: useContextStoreApi(),
        value: useContextStore(
          (state) => state.value,
          () => true
        ),
      }),
      { wrapper }
    );

    expect(result.current.value).toBe(0);

    act(() => {
      result.current.store.getState().increment();
    });

    expect(result.current.value).toBe(0);
  });

  it("should expose plain selector access for provider store", () => {
    interface ProviderPlainStore extends TestStore {
      label: string;
      setLabel: (label: string) => void;
    }

    const { Provider, useContextStore, useContextStorePlain, useContextStoreApi } =
      createStoreProvider<ProviderPlainStore>((set) => ({
        value: 0,
        label: "test",
        increment: () => set((state) => ({ value: state.value + 1 })),
        setLabel: (label: string) => set({ label }),
      }));

    const wrapper = ({ children }: PropsWithChildren) => <Provider>{children}</Provider>;
    const { result } = renderHook(
      () => ({
        api: useContextStoreApi(),
        shallow: useContextStore((state) => ({ value: state.value })),
        plain: useContextStorePlain((state) => state.label),
      }),
      { wrapper }
    );

    act(() => {
      result.current.api.getState().setLabel("updated");
    });

    expect(result.current.shallow.value).toBe(0);
    expect(result.current.plain).toBe("updated");
  });

  it("should expose full state through plain context hook without selector", () => {
    interface ProviderPlainStore extends TestStore {
      label: string;
    }

    const { Provider, useContextStorePlain } = createStoreProvider<ProviderPlainStore>((set) => ({
      value: 5,
      label: "ready",
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));

    const wrapper = ({ children }: PropsWithChildren) => <Provider>{children}</Provider>;
    const { result } = renderHook(() => useContextStorePlain(), { wrapper });

    expect(result.current.value).toBe(5);
    expect(result.current.label).toBe("ready");
    expect(typeof result.current.increment).toBe("function");
  });

  it("should preserve context shallow selection reference across parent rerenders", () => {
    const { Provider, useContextStore } = createStoreProvider<TestStore>((set) => ({
      value: 0,
      increment: () => set((state) => ({ value: state.value + 1 })),
    }));
    const wrapper = ({ children }: PropsWithChildren) => <Provider>{children}</Provider>;
    const { result, rerender } = renderHook(
      () => useContextStore((state) => ({ value: state.value })),
      { wrapper }
    );
    const initialSelection = result.current;

    rerender();

    expect(result.current).toBe(initialSelection);
  });
});
