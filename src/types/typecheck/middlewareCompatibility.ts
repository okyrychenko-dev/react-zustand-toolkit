import { createJSONStorage, devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createShallowStore } from "../../core/createShallowStore";
import { createStoreToolkit } from "../../core/createStoreToolkit";
import { createStoreProvider } from "../../providers/createStoreProvider";

interface CounterState {
  count: number;
  increment: () => void;
}

type Assert<T extends true> = T;
type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;
type IsCallable<T> = T extends (...args: Array<never>) => unknown ? true : false;

const storage = createJSONStorage<CounterState>(() => ({
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}));

const _devtoolsStore = createShallowStore<CounterState, [["zustand/devtools", never]]>(
  devtools(
    (set) => ({
      count: 0,
      increment: () => {
        set((state) => ({ count: state.count + 1 }));
      },
    }),
    { name: "DevtoolsStore" }
  )
);

type DevtoolsCleanupAssertion = Assert<
  IsCallable<typeof _devtoolsStore.useStoreApi.devtools.cleanup>
>;

const _persistStore = createShallowStore<CounterState, [["zustand/persist", CounterState]]>(
  persist(
    (set) => ({
      count: 0,
      increment: () => {
        set((state) => ({ count: state.count + 1 }));
      },
    }),
    { name: "PersistStore", storage }
  )
);

type PersistApiAssertion = Assert<HasKey<typeof _persistStore.useStoreApi, "persist">>;

const _subscribeStore = createShallowStore<
  CounterState,
  [["zustand/subscribeWithSelector", never]]
>(
  subscribeWithSelector((set) => ({
    count: 0,
    increment: () => {
      set((state) => ({ count: state.count + 1 }));
    },
  }))
);

const _unsubscribe = _subscribeStore.useStoreApi.subscribe(
  (state) => state.count,
  (selected, previous) => {
    const nextCount: number = selected;
    const prevCount: number = previous;

    void nextCount;
    void prevCount;
  },
  { fireImmediately: true }
);

void _unsubscribe;

const _immerStore = createShallowStore<CounterState, [["zustand/immer", never]]>(
  immer((set) => ({
    count: 0,
    increment: () => {
      set({ count: 1 });
    },
  }))
);

const _immerUpdater: Parameters<typeof _immerStore.useStoreApi.setState>[0] = (
  draft: CounterState
) => {
  draft.count += 1;
};

void _immerUpdater;

type CombinedMutators = [["zustand/persist", CounterState], ["zustand/devtools", never]];

const combinedCreator = persist<CounterState, [], [["zustand/devtools", never]], CounterState>(
  devtools<CounterState>(
    (set) => ({
      count: 0,
      increment: () => {
        set((state) => ({ count: state.count + 1 }));
      },
    }),
    { name: "CombinedStore" }
  ),
  { name: "CombinedStore", storage }
);

const _provider = createStoreProvider<CounterState, CombinedMutators>(combinedCreator);
const _toolkit = createStoreToolkit<CounterState, CombinedMutators>(combinedCreator);

type ProviderPersistAssertion = Assert<
  HasKey<ReturnType<typeof _provider.useContextStoreApi>, "persist">
>;
type ProviderDevtoolsAssertion = Assert<
  HasKey<ReturnType<typeof _provider.useContextStoreApi>, "devtools">
>;
type ToolkitPersistAssertion = Assert<HasKey<typeof _toolkit.useStoreApi, "persist">>;
type ToolkitDevtoolsAssertion = Assert<HasKey<typeof _toolkit.useStoreApi, "devtools">>;
type ResolvedPersistAssertion = Assert<
  HasKey<ReturnType<typeof _toolkit.useResolvedStoreApi>, "persist">
>;

export type MiddlewareCompatibilityAssertions = [
  DevtoolsCleanupAssertion,
  PersistApiAssertion,
  ProviderPersistAssertion,
  ProviderDevtoolsAssertion,
  ToolkitPersistAssertion,
  ToolkitDevtoolsAssertion,
  ResolvedPersistAssertion,
];
