import type { ResolvedStoreBindings, ShallowStoreBindings } from "./store-bindings.types";
import type { StoreProviderResult } from "./store-provider.types";
import type { StoreMutatorTuple } from "./store.types";

/** Combined global, provider, and resolved store bindings. */
export interface StoreToolkit<TState, TMutators extends Array<StoreMutatorTuple> = []>
  extends ShallowStoreBindings<TState, TMutators>, ResolvedStoreBindings<TState, TMutators> {
  provider: StoreProviderResult<TState, TMutators>;
  /**
   * @deprecated Use {@link provider} instead. This compatibility accessor will be removed in the
   * next intentional major release.
   */
  getProvider: () => StoreProviderResult<TState, TMutators>;
}
