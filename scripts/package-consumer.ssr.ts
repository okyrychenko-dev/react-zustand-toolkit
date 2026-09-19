import { createStoreToolkit } from "@okyrychenko-dev/react-zustand-toolkit";
import { Window } from "happy-dom";
import { act, createElement } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";

const toolkit = createStoreToolkit<{ requestId: string }, string>(
  (requestId) => () => ({ requestId }),
  { globalInput: "global" }
);

function RequestId() {
  return createElement(
    "span",
    null,
    toolkit.useStore((state) => state.requestId)
  );
}

const serverInput = "request";
const serializedInput = JSON.stringify(serverInput);
const html = renderToString(
  createElement(toolkit.Provider, { input: serverInput, children: createElement(RequestId) })
);

if (!html.includes("request") || html.includes("global")) {
  throw new Error(`Packed SSR consumer did not resolve its request-local Provider: ${html}`);
}

const window = new Window();
Object.defineProperty(globalThis, "window", { configurable: true, value: window });
Object.defineProperty(globalThis, "document", {
  configurable: true,
  value: window.document,
});
Object.defineProperty(globalThis, "Element", {
  configurable: true,
  value: window.Element,
});
Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
  configurable: true,
  value: true,
});
const candidateContainer: unknown = window.document.createElement("div");
if (!(candidateContainer instanceof Element)) {
  throw new Error("SSR test environment did not create a DOM Element");
}
const container = candidateContainer;
container.innerHTML = html;
const errors: Array<unknown> = [];
const originalConsoleError = console.error;
console.error = (...messages: Array<unknown>) => errors.push(messages);
const clientInput: string = JSON.parse(serializedInput);

await act(async () => {
  hydrateRoot(
    container,
    createElement(toolkit.Provider, {
      input: clientInput,
      children: createElement(RequestId),
    })
  );
});

console.error = originalConsoleError;
if (container.textContent !== "request" || errors.length > 0) {
  throw new Error(`Packed hydration mismatch: ${errors.join("\n")}`);
}
