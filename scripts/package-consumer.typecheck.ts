import {
  createResolvedStoreHooks,
  createShallowStore,
  createStoreProvider,
  createStoreToolkit,
} from "@okyrychenko-dev/react-zustand-toolkit";
import type { StoreToolkit } from "@okyrychenko-dev/react-zustand-toolkit";

interface CounterStore {
  count: number;
  increment: VoidFunction;
}

const creator = (set: (state: Partial<CounterStore>) => void): CounterStore => ({
  count: 0,
  increment: () => set({ count: 1 }),
});

const shallowStore = createShallowStore<CounterStore>(creator);
const provider = createStoreProvider<CounterStore>(creator, "Counter");
const toolkit: StoreToolkit<CounterStore> = createStoreToolkit<CounterStore>(creator);
const resolved = createResolvedStoreHooks(
  shallowStore.useStoreApi,
  provider.useContextStoreOptional
);

void shallowStore;
void provider;
void toolkit;
void resolved;
