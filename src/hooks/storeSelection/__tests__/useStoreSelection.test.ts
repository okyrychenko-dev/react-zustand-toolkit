import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createStore } from "zustand";
import { useStoreSelection, useStoreSelectionPlain } from "../useStoreSelection";

function createTestStore() {
  return createStore(() => ({ count: 1, label: "initial", items: [1, 2] }));
}

describe("store selection", () => {
  it("should retain shallow references across rerenders and unrelated updates", () => {
    const store = createTestStore();
    const { result, rerender } = renderHook(() =>
      useStoreSelection(store, (state) => ({ count: state.count }))
    );
    const initialSelection = result.current;

    rerender();
    expect(result.current).toBe(initialSelection);

    act(() => store.setState({ label: "updated" }));
    expect(result.current).toBe(initialSelection);

    act(() => store.setState({ count: 2 }));
    expect(result.current).toEqual({ count: 2 });
    expect(result.current).not.toBe(initialSelection);
  });

  it("should use the latest selector and equality after rerender", () => {
    const store = createTestStore();
    const { result, rerender } = renderHook(
      ({ multiplier, equalityFn }) =>
        useStoreSelection(store, (state) => state.count * multiplier, equalityFn),
      { initialProps: { multiplier: 1, equalityFn: Object.is } }
    );
    expect(result.current).toBe(1);

    rerender({ multiplier: 2, equalityFn: Object.is });
    expect(result.current).toBe(2);

    rerender({ multiplier: 2, equalityFn: () => true });
    act(() => store.setState({ count: 3 }));
    expect(result.current).toBe(2);

    rerender({ multiplier: 2, equalityFn: Object.is });
    expect(result.current).toBe(6);
  });

  it("should reset retained values and subscriptions when the store changes", () => {
    const first = createTestStore();
    const second = createTestStore();
    const { result, rerender } = renderHook(
      ({ store }) =>
        useStoreSelection(
          store,
          (state) => state.items,
          () => true
        ),
      { initialProps: { store: first } }
    );
    expect(result.current).toBe(first.getState().items);

    rerender({ store: second });
    expect(result.current).toBe(second.getState().items);

    act(() => first.setState({ items: [9] }));
    expect(result.current).toBe(second.getState().items);
  });

  it("should subscribe to the replacement store in both selection modes", () => {
    const first = createTestStore();
    const second = createTestStore();
    const { result, rerender, unmount } = renderHook(
      ({ store }) => ({
        shallow: useStoreSelection(store, (state) => state.count),
        plain: useStoreSelectionPlain(store, (state) => state.count),
      }),
      { initialProps: { store: first } }
    );
    rerender({ store: second });
    act(() => second.setState({ count: 4 }));
    expect(result.current).toEqual({ shallow: 4, plain: 4 });

    act(() => first.setState({ count: 9 }));
    expect(result.current).toEqual({ shallow: 4, plain: 4 });
    unmount();
  });

  it("should return full state when the selector is omitted", () => {
    const store = createTestStore();
    const { result } = renderHook(() => ({
      shallow: useStoreSelection(store),
      plain: useStoreSelectionPlain(store),
    }));
    expect(result.current.shallow).toBe(store.getState());
    expect(result.current.plain).toBe(store.getState());

    act(() => store.setState({ count: 2 }));
    expect(result.current.shallow).toBe(store.getState());
    expect(result.current.plain).toBe(store.getState());
  });

  it("should retain shallow-equal values while plain selection follows reference changes", () => {
    const store = createTestStore();
    const { result } = renderHook(() => ({
      shallow: useStoreSelection(store, (state) => state.items),
      plain: useStoreSelectionPlain(store, (state) => state.items),
    }));
    const initialItems = store.getState().items;
    const replacement = [1, 2];

    act(() => store.setState({ items: replacement }));
    expect(result.current.shallow).toBe(initialItems);
    expect(result.current.plain).toBe(replacement);
  });

  it("should retain separate selections for each consumer", () => {
    const store = createTestStore();
    const { result } = renderHook(() => ({
      count: useStoreSelection(store, (state) => state.count),
      label: useStoreSelection(store, (state) => state.label),
    }));
    act(() => store.setState({ count: 2 }));
    expect(result.current).toEqual({ count: 2, label: "initial" });
  });
});
