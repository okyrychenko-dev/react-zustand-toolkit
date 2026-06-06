import { startTransition } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTransitionAction } from "../createTransitionAction";

vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();

  return {
    ...react,
    startTransition: vi.fn((scope: () => void | Promise<void>) => scope()),
  };
});

describe("createTransitionAction", () => {
  beforeEach(() => {
    vi.mocked(startTransition).mockClear();
  });

  it("should call original action with args", () => {
    const action = vi.fn((_value: number) => undefined);
    const transitionAction = createTransitionAction(action);

    transitionAction(42);

    expect(action).toHaveBeenCalledTimes(1);
    expect(action).toHaveBeenCalledWith(42);
  });

  it("should return the async action promise from the transition scope", async () => {
    const actionPromise = Promise.resolve();
    const action = vi.fn(() => actionPromise);
    const transitionAction = createTransitionAction(action);

    transitionAction();

    const transitionScope = vi.mocked(startTransition).mock.calls[0][0];
    const returnedPromise = transitionScope();

    expect(returnedPromise).toBe(actionPromise);
    await expect(returnedPromise).resolves.toBeUndefined();
  });
});
