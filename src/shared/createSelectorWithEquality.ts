export function createSelectorWithEquality<TState, TSelected>(
  selector: (state: TState) => TSelected,
  equalityFn: (a: TSelected, b: TSelected) => boolean
): (state: TState) => TSelected {
  let hasPrev = false;
  let prevValue: TSelected;

  return (state: TState): TSelected => {
    const nextValue = selector(state);

    if (hasPrev && equalityFn(prevValue, nextValue)) {
      return prevValue;
    }

    hasPrev = true;
    prevValue = nextValue;
    return nextValue;
  };
}
