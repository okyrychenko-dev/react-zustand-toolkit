import { createStore } from "zustand";
import { type ResolvedStoreBindings, createResolvedStoreHooks, createStoreToolkit } from "../index";

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

const toolkit = createStoreToolkit<CounterState>(() => ({ count: 0 }));
const toolkitBindings: ResolvedStoreBindings<CounterState> = toolkit;

void fullState;
void selectedCount;
void equalCount;
void plainState;
void plainCount;
void resolvedApi;
void toolkitBindings;
