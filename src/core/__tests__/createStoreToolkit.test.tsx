import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createStoreToolkit } from "../createStoreToolkit";
import type { ReactNode } from "react";

interface CounterInput {
  initialCount: number;
}

interface CounterStore {
  count: number;
  increment: VoidFunction;
}

function createCounterToolkit() {
  return createStoreToolkit<CounterStore, CounterInput>(
    ({ initialCount }) =>
      (set) => ({
        count: initialCount,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
    { globalInput: { initialCount: 1 }, name: "Counter" }
  );
}

describe("createStoreToolkit", () => {
  it("should expose resolved behavior at the top level and explicit Global behavior", () => {
    const toolkit = createCounterToolkit();

    expect(toolkit.Provider).toBeTypeOf("function");
    expect(toolkit.useStore).toBeTypeOf("function");
    expect(toolkit.useStorePlain).toBeTypeOf("function");
    expect(toolkit.useStoreApi).toBeTypeOf("function");
    expect(toolkit.global.store.getState().count).toBe(1);
    expect(toolkit).not.toHaveProperty("provider");
    expect(toolkit).not.toHaveProperty("getProvider");
  });

  it("should resolve to the Global store outside a Provider", () => {
    const toolkit = createCounterToolkit();
    const { result } = renderHook(() => ({
      shallow: toolkit.useStore((state) => state.count),
      plain: toolkit.useStorePlain((state) => state.count),
      store: toolkit.useStoreApi(),
    }));

    expect(result.current).toEqual({ shallow: 1, plain: 1, store: toolkit.global.store });
    act(() => toolkit.global.store.getState().increment());
    expect(result.current.shallow).toBe(2);
    expect(result.current.plain).toBe(2);
  });

  it("should synchronously resolve to the nearest Provider store from inert input", () => {
    const toolkit = createCounterToolkit();
    let observedStore: ReturnType<typeof toolkit.useStoreApi> | null = null;

    function Count({ label }: { label: string }): ReactNode {
      observedStore = toolkit.useStoreApi();
      return <span>{`${label}:${String(toolkit.useStore((state) => state.count))}`}</span>;
    }

    render(
      <toolkit.Provider input={{ initialCount: 2 }}>
        <Count label="outer" />
        <toolkit.Provider input={{ initialCount: 3 }}>
          <Count label="inner" />
        </toolkit.Provider>
      </toolkit.Provider>
    );

    expect(screen.getByText("outer:2")).toBeInTheDocument();
    expect(screen.getByText("inner:3")).toBeInTheDocument();
    expect(observedStore).not.toBeNull();
    expect(toolkit.global.store.getState().count).toBe(1);
  });

  it("should reset Retained selection when Provider placement changes the Resolved store", () => {
    const toolkit = createStoreToolkit<{ items: Array<number> }, number>(
      (initialItem) => () => ({ items: [initialItem] }),
      { globalInput: 1 }
    );
    const selections: Array<Array<number>> = [];

    function Selection(): ReactNode {
      const items = toolkit.useStore(
        (state) => state.items,
        () => true
      );
      selections.push(items);
      return <span>{items[0]}</span>;
    }

    const { rerender } = render(<Selection />);
    const globalSelection = selections[selections.length - 1];
    rerender(
      <toolkit.Provider input={2}>
        <Selection />
      </toolkit.Provider>
    );

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(selections[selections.length - 1]).not.toBe(globalSelection);

    rerender(<Selection />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(selections[selections.length - 1]).toBe(globalSelection);
  });

  it("should provide Shallow, Plain, custom-equality, and full-state selection", () => {
    const toolkit = createStoreToolkit<{ items: Array<number> }>(() => () => ({ items: [1, 2] }), {
      globalInput: undefined,
    });
    const { result } = renderHook(() => ({
      shallow: toolkit.useStore((state) => state.items),
      custom: toolkit.useStore(
        (state) => state.items,
        () => true
      ),
      plain: toolkit.useStorePlain((state) => state.items),
      full: toolkit.useStore(),
    }));
    const originalItems = result.current.shallow;
    const replacementItems = [1, 2];

    act(() => toolkit.global.store.setState({ items: replacementItems }));

    expect(result.current.shallow).toBe(originalItems);
    expect(result.current.custom).toBe(originalItems);
    expect(result.current.plain).toBe(replacementItems);
    expect(result.current.full.items).toBe(replacementItems);
  });

  it("should consume input once and complete readiness once per Provider lifetime", async () => {
    const toolkit = createCounterToolkit();
    const firstReady = vi.fn();
    const secondReady = vi.fn();
    const stores: Array<ReturnType<typeof toolkit.useStoreApi>> = [];

    function Count(): ReactNode {
      stores.push(toolkit.useStoreApi());
      return <span>{toolkit.useStore((state) => state.count)}</span>;
    }

    const { rerender } = render(
      <toolkit.Provider input={{ initialCount: 4 }} onStoreReady={firstReady}>
        <Count />
      </toolkit.Provider>
    );
    await waitFor(() => expect(firstReady).toHaveBeenCalledOnce());

    rerender(
      <toolkit.Provider input={{ initialCount: 9 }} onStoreReady={secondReady}>
        <Count />
      </toolkit.Provider>
    );

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(stores[stores.length - 1]).toBe(stores[0]);
    expect(secondReady).not.toHaveBeenCalled();
  });

  it("should create a new Provider lifetime after a keyed remount", () => {
    const toolkit = createCounterToolkit();
    function Count(): ReactNode {
      return <span>{toolkit.useStore((state) => state.count)}</span>;
    }
    const { rerender } = render(
      <toolkit.Provider key="first" input={{ initialCount: 4 }}>
        <Count />
      </toolkit.Provider>
    );
    rerender(
      <toolkit.Provider key="second" input={{ initialCount: 9 }}>
        <Count />
      </toolkit.Provider>
    );
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("should propagate Store recipe and initialization errors through React", () => {
    const recipeError = new Error("recipe failed");
    const toolkit = createStoreToolkit<CounterStore, boolean>(
      (shouldFail) => {
        if (shouldFail) {
          throw recipeError;
        }
        return () => ({ count: 0, increment: () => undefined });
      },
      { globalInput: false }
    );

    expect(() => render(<toolkit.Provider input>unreachable</toolkit.Provider>)).toThrow(
      recipeError
    );

    const initError = new Error("init failed");
    expect(() =>
      render(
        <toolkit.Provider
          input={false}
          onStoreInit={() => {
            throw initError;
          }}
        >
          unreachable
        </toolkit.Provider>
      )
    ).toThrow(initError);
  });
});
