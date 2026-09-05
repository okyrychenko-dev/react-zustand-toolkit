import type { Mutate, StateCreator, StoreApi, StoreMutatorIdentifier } from "zustand";

export type StoreMutatorTuple = [StoreMutatorIdentifier, unknown];

export type StoreApiWithMutators<TState, TMutators extends Array<StoreMutatorTuple> = []> = Mutate<
  StoreApi<TState>,
  TMutators
>;

/** Type alias for StateCreator without mutators. */
export type SimpleStateCreator<TState> = StateCreator<TState, [], [], TState>;

/** Type alias for StateCreator with mutators support. */
export type MutatorsStateCreator<
  TState,
  TMutators extends Array<StoreMutatorTuple> = [],
> = StateCreator<TState, [], TMutators, TState>;
