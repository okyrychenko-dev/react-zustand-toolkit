import { createStore } from "zustand";
import { createStoreToolkit } from "../core";
import { createResolvedStoreHooks } from "../hooks";
import type { StoreToolkit } from "../core";
import type { ResolvedStoreBindings } from "../hooks";

interface CounterState {
  count: number;
}

const globalStore = createStore<CounterState>(() => ({ count: 0 }));
const resolvedBindings: ResolvedStoreBindings<CounterState> = createResolvedStoreHooks(
  globalStore,
  () => null
);

const fullState: CounterState = resolvedBindings.useResolvedValue();
const selectedCount: number = resolvedBindings.useResolvedValue((state) => state.count);
const equalCount: number = resolvedBindings.useResolvedValue((state) => state.count, Object.is);
const plainState: CounterState = resolvedBindings.useResolvedStorePlain();
const plainCount: number = resolvedBindings.useResolvedStorePlain((state) => state.count);
const resolvedApi = resolvedBindings.useResolvedStoreApi();

const toolkit = createStoreToolkit<CounterState>(() => () => ({ count: 0 }), {
  globalInput: undefined,
});
const toolkitBindings: StoreToolkit<CounterState> = toolkit;

void fullState;
void selectedCount;
void equalCount;
void plainState;
void plainCount;
void resolvedApi;
void toolkitBindings;
