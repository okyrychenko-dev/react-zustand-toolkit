import { describe, expect, it, vi } from "vitest";
import { createTransitionAction } from "../createTransitionAction";

describe("createTransitionAction", () => {
  it("should call original action with args", () => {
    const action = vi.fn((value: number) => value + 1);
    const transitionAction = createTransitionAction(action);

    transitionAction(42);

    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith(42);
  });
});
