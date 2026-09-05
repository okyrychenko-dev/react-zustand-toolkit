import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createStore } from "zustand";
import { createStoreSelectionBindings } from "../createStoreSelectionBindings";

describe("createStoreSelectionBindings", () => {
  it("should expose shallow and plain selection through one interface", () => {
    const store = createStore(() => ({ count: 1, items: [1, 2] }));
    const { useStoreValue, useStorePlain } = createStoreSelectionBindings(() => store);
    const { result } = renderHook(() => ({
      shallow: useStoreValue((state) => state.items),
      plain: useStorePlain((state) => state.items),
    }));
    const initialItems = store.getState().items;
    const replacementItems = [1, 2];

    act(() => store.setState({ items: replacementItems }));

    expect(result.current.shallow).toBe(initialItems);
    expect(result.current.plain).toBe(replacementItems);
  });

  it("should retain shallow references across rerenders and unrelated updates", () => {
    const store = createStore(() => ({ count: 1, label: "initial" }));
    const { useStoreValue } = createStoreSelectionBindings(() => store);
    const { result, rerender } = renderHook(() =>
      useStoreValue((state) => ({ count: state.count }))
    );
    const initialSelection = result.current;

    rerender();
    act(() => store.setState({ label: "updated" }));

    expect(result.current).toBe(initialSelection);

    act(() => store.setState({ count: 2 }));

    expect(result.current).toEqual({ count: 2 });
    expect(result.current).not.toBe(initialSelection);
  });

  it("should use the latest selector and equality after rerender", () => {
    const store = createStore(() => ({ count: 1 }));
    const { useStoreValue } = createStoreSelectionBindings(() => store);
    const { result, rerender } = renderHook(
      ({ multiplier, equalityFn }) =>
        useStoreValue((state) => state.count * multiplier, equalityFn),
      { initialProps: { multiplier: 1, equalityFn: Object.is } }
    );

    rerender({ multiplier: 2, equalityFn: Object.is });
    expect(result.current).toBe(2);

    rerender({ multiplier: 2, equalityFn: () => true });
    act(() => store.setState({ count: 3 }));
    expect(result.current).toBe(2);

    rerender({ multiplier: 2, equalityFn: Object.is });
    expect(result.current).toBe(6);
  });

  it("should reset retained values and subscriptions when the store changes", () => {
    const first = createStore(() => ({ items: [1, 2] }));
    const second = createStore(() => ({ items: [1, 2] }));
    let currentStore = first;
    const { useStoreValue } = createStoreSelectionBindings(() => currentStore);
    const { result, rerender } = renderHook(() =>
      useStoreValue(
        (state) => state.items,
        () => true
      )
    );

    expect(result.current).toBe(first.getState().items);

    currentStore = second;
    rerender();

    expect(result.current).toBe(second.getState().items);

    act(() => first.setState({ items: [9] }));
    expect(result.current).toBe(second.getState().items);
  });

  it("should subscribe both selection modes to the current store", () => {
    const first = createStore(() => ({ count: 1 }));
    const second = createStore(() => ({ count: 1 }));
    let currentStore = first;
    const { useStoreValue, useStorePlain } = createStoreSelectionBindings(() => currentStore);
    const { result, rerender } = renderHook(() => ({
      shallow: useStoreValue((state) => state.count),
      plain: useStorePlain((state) => state.count),
    }));

    currentStore = second;
    rerender();
    act(() => second.setState({ count: 4 }));

    expect(result.current).toEqual({ shallow: 4, plain: 4 });

    act(() => first.setState({ count: 9 }));

    expect(result.current).toEqual({ shallow: 4, plain: 4 });
  });

  it("should return full state when selectors are omitted", () => {
    const store = createStore(() => ({ count: 1 }));
    const { useStoreValue, useStorePlain } = createStoreSelectionBindings(() => store);
    const { result } = renderHook(() => ({
      shallow: useStoreValue(),
      plain: useStorePlain(),
    }));

    expect(result.current.shallow).toBe(store.getState());
    expect(result.current.plain).toBe(store.getState());

    act(() => store.setState({ count: 2 }));

    expect(result.current.shallow).toBe(store.getState());
    expect(result.current.plain).toBe(store.getState());
  });

  it("should retain independent values for separate consumers", () => {
    const store = createStore(() => ({ count: 1, label: "initial" }));
    const { useStoreValue } = createStoreSelectionBindings(() => store);
    const { result } = renderHook(() => ({
      count: useStoreValue((state) => state.count),
      label: useStoreValue((state) => state.label),
    }));

    act(() => store.setState({ count: 2 }));

    expect(result.current).toEqual({ count: 2, label: "initial" });
  });
});
