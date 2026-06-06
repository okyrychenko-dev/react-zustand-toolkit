export type UseSelectorWithEqualitySelector<TState, TSelected> = (state: TState) => TSelected;

export type UseSelectorWithEqualityEqualityFn<TSelected> = (
  left: TSelected,
  right: TSelected
) => boolean;

export interface UseSelectorWithEqualityOptions<TState, TSelected> {
  cacheKey: unknown;
  equalityFn: UseSelectorWithEqualityEqualityFn<TSelected>;
  selector: UseSelectorWithEqualitySelector<TState, TSelected>;
}

export type UseSelectorWithEqualityReturn<TState, TSelected> = (state: TState) => TSelected;

export interface EmptySelectorCache {
  hasValue: false;
  key: unknown;
}

export interface SelectorValueCache<TSelected> {
  hasValue: true;
  key: unknown;
  value: TSelected;
}

export type SelectorCache<TSelected> = EmptySelectorCache | SelectorValueCache<TSelected>;
