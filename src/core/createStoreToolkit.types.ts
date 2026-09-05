import type { ResolvedStoreBindings } from "../hooks";
import type { StoreProviderResult } from "../providers";
import type { StoreMutatorTuple } from "../types";
import type { ShallowStoreBindings } from "./createShallowStore.types";

/** Combined global, provider, and resolved store bindings. */
export interface StoreToolkit<TState, TMutators extends Array<StoreMutatorTuple> = []>
  extends ShallowStoreBindings<TState, TMutators>, ResolvedStoreBindings<TState, TMutators> {
  provider: StoreProviderResult<TState, TMutators>;
  getProvider: () => StoreProviderResult<TState, TMutators>;
}
