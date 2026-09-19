import {
  createResolvedStoreHooks,
  createShallowStore,
  createStoreProvider,
  createStoreToolkit,
} from "@okyrychenko-dev/react-zustand-toolkit";
import { devtools } from "zustand/middleware";
import type { StoreProviderProps, StoreToolkit } from "@okyrychenko-dev/react-zustand-toolkit";

interface CounterInput {
  initialCount: number;
}

interface CounterStore {
  count: number;
  increment: VoidFunction;
}

const recipe =
  ({ initialCount }: CounterInput) =>
  (set: (state: Partial<CounterStore>) => void): CounterStore => ({
    count: initialCount,
    increment: () => set({ count: initialCount + 1 }),
  });

const shallowStore = createShallowStore<CounterStore>(recipe({ initialCount: 0 }));
const provider = createStoreProvider<CounterStore, CounterInput>(recipe, "Counter");
const toolkit: StoreToolkit<CounterStore, CounterInput> = createStoreToolkit<
  CounterStore,
  CounterInput
>(recipe, { globalInput: { initialCount: 0 } });
const providerProps: StoreProviderProps<CounterStore, CounterInput> = {
  children: "Counter",
  input: { initialCount: 1 },
  onStoreReady: (store) => store.getState().increment(),
};
const resolved = createResolvedStoreHooks(shallowStore.store, provider.useProviderStoreOptional);
const globalStore = toolkit.global.store;
const middlewareToolkit = createStoreToolkit<
  CounterStore,
  CounterInput,
  [["zustand/devtools", never]]
>(
  (input) =>
    devtools((set) => ({
      count: input.initialCount,
      increment: () => set((state) => ({ count: state.count + 1 })),
    })),
  { globalInput: { initialCount: 0 } }
);
const devtoolsCleanup: VoidFunction = middlewareToolkit.global.store.devtools.cleanup;

void providerProps;
void resolved;
void globalStore;
void devtoolsCleanup;
