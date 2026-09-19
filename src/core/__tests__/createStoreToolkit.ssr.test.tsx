import { PassThrough } from "node:stream";
import { act } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToPipeableStream, renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createStoreToolkit } from "../createStoreToolkit";
import type { ReactNode } from "react";

interface RequestInput {
  requestId: string;
}

interface RequestStore {
  requestId: string;
}

function createRequestToolkit() {
  return createStoreToolkit<RequestStore, RequestInput>(
    ({ requestId }) =>
      () => ({ requestId }),
    { globalInput: { requestId: "client-global" }, name: "Request" }
  );
}

describe("createStoreToolkit SSR", () => {
  it("should isolate concurrent request-local Provider trees", async () => {
    const toolkit = createRequestToolkit();

    function RequestId(): ReactNode {
      return <span>{toolkit.useStore((state) => state.requestId)}</span>;
    }

    function renderRequest(requestId: string): Promise<string> {
      return new Promise((resolve, reject) => {
        const output = new PassThrough();
        let html = "";
        output.setEncoding("utf8");
        output.on("data", (chunk: unknown) => {
          if (typeof chunk !== "string") {
            reject(new Error("Server stream emitted non-text output"));
            return;
          }
          html += chunk;
        });
        output.on("end", () => resolve(html));
        const { pipe } = renderToPipeableStream(
          <toolkit.Provider input={{ requestId }}>
            <RequestId />
          </toolkit.Provider>,
          {
            onAllReady: () => pipe(output),
            onError: reject,
          }
        );
      });
    }

    const [first, second] = await Promise.all([
      renderRequest("request-a"),
      renderRequest("request-b"),
    ]);

    expect(first).toContain("request-a");
    expect(first).not.toContain("request-b");
    expect(second).toContain("request-b");
    expect(second).not.toContain("request-a");
    expect(toolkit.global.store.getState().requestId).toBe("client-global");
  });

  it("should hydrate without mismatch diagnostics from equivalent decoded input", async () => {
    const toolkit = createRequestToolkit();
    const input = { requestId: "serialized-request" };

    function RequestId(): ReactNode {
      return <span>{toolkit.useStore((state) => state.requestId)}</span>;
    }

    function App(): ReactNode {
      return (
        <toolkit.Provider input={input}>
          <RequestId />
        </toolkit.Provider>
      );
    }

    const container = document.createElement("div");
    container.innerHTML = renderToString(<App />);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    let root: ReturnType<typeof hydrateRoot> | undefined;

    act(() => {
      root = hydrateRoot(container, <App />);
    });

    expect(container.textContent).toBe("serialized-request");
    expect(consoleError).not.toHaveBeenCalled();

    act(() => root?.unmount());
    consoleError.mockRestore();
  });
});
