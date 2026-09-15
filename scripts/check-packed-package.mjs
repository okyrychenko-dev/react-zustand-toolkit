import { execFileSync, spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = new URL("../", import.meta.url);
const repositoryPath = fileURLToPath(repositoryRoot);
const temporaryRoot = mkdtempSync(join(tmpdir(), "react-zustand-toolkit-package-"));
const tarballPath = join(temporaryRoot, "react-zustand-toolkit.tgz");
const extractRoot = join(temporaryRoot, "extract");
const consumerRoot = join(temporaryRoot, "consumer");

function run(command, args) {
  return execFileSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: "inherit",
  });
}

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [relative(join(extractRoot, "package"), path)];
  });
}

function packageRootName(specifier) {
  const segments = specifier.split("/");
  return specifier.startsWith("@") ? `${segments[0]}/${segments[1]}` : segments[0];
}

function externalPackages(contents) {
  const specifiers = [
    ...contents.matchAll(/\bfrom\s+["']([^"']+)["']/gu),
    ...contents.matchAll(/\brequire\(["']([^"']+)["']\)/gu),
  ].map((match) => packageRootName(match[1]));
  return [...new Set(specifiers)].sort();
}

try {
  run("pnpm", ["pack", "--out", tarballPath]);
  mkdirSync(extractRoot, { recursive: true });
  mkdirSync(consumerRoot, { recursive: true });
  run("tar", ["-xzf", tarballPath, "-C", extractRoot]);

  const packageRoot = join(extractRoot, "package");
  const expectedFiles = [
    "CHANGELOG.md",
    "LICENSE",
    "README.md",
    "dist/index.cjs",
    "dist/index.cjs.map",
    "dist/index.d.cts",
    "dist/index.d.ts",
    "dist/index.js",
    "dist/index.js.map",
    "package.json",
  ];
  const packedFiles = listFiles(packageRoot).sort();
  invariant(
    JSON.stringify(packedFiles) === JSON.stringify(expectedFiles),
    `Unexpected packed files:\n${packedFiles.join("\n")}`
  );

  const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
  invariant(manifest.sideEffects === false, "Published package must remain side-effect free");
  invariant(
    JSON.stringify(manifest.peerDependencies) ===
      JSON.stringify({ react: "^18.0.0 || ^19.0.0", zustand: "^5.0.0" }),
    "Published peer dependencies do not match the public contract"
  );
  invariant(
    JSON.stringify(manifest.dependencies) ===
      JSON.stringify({ "@okyrychenko-dev/type-utils": "^0.1.2" }),
    "Published runtime dependencies do not match the implementation contract"
  );

  const declaredRuntimePackages = [
    ...Object.keys(manifest.dependencies ?? {}),
    ...Object.keys(manifest.peerDependencies ?? {}),
  ].sort();
  const importedRuntimePackages = [
    ...new Set(
      ["dist/index.js", "dist/index.cjs"].flatMap((file) =>
        externalPackages(readFileSync(join(packageRoot, file), "utf8"))
      )
    ),
  ].sort();
  invariant(
    JSON.stringify(importedRuntimePackages) === JSON.stringify(declaredRuntimePackages),
    `Built imports ${JSON.stringify(importedRuntimePackages)} do not match declared runtime packages ${JSON.stringify(declaredRuntimePackages)}`
  );

  for (const exportPath of [
    manifest.exports["."].import.types,
    manifest.exports["."].import.default,
    manifest.exports["."].require.types,
    manifest.exports["."].require.default,
  ]) {
    invariant(existsSync(join(packageRoot, exportPath)), `Missing exported file: ${exportPath}`);
  }

  writeFileSync(
    join(consumerRoot, "package.json"),
    JSON.stringify({ private: true, type: "module" })
  );
  writeFileSync(
    join(consumerRoot, "esm.mjs"),
    'import { createShallowStore } from "@okyrychenko-dev/react-zustand-toolkit";\nif (typeof createShallowStore !== "function") throw new Error("ESM export unavailable");\n'
  );
  writeFileSync(
    join(consumerRoot, "cjs.cjs"),
    'const { createShallowStore } = require("@okyrychenko-dev/react-zustand-toolkit");\nif (typeof createShallowStore !== "function") throw new Error("CommonJS export unavailable");\n'
  );
  writeFileSync(
    join(consumerRoot, "side-effect-entry.js"),
    'const before = new Set(Reflect.ownKeys(globalThis));\nawait import("@okyrychenko-dev/react-zustand-toolkit");\nconst added = Reflect.ownKeys(globalThis).filter((key) => !before.has(key));\nif (added.length > 0) throw new Error(`Package added globals: ${added.join(", ")}`);\n'
  );
  const typeConsumer = readFileSync(join(repositoryPath, "scripts/package-consumer.typecheck.ts"));
  writeFileSync(join(consumerRoot, "consumer.mts"), typeConsumer);
  writeFileSync(join(consumerRoot, "consumer.cts"), typeConsumer);

  const consumerModules = join(consumerRoot, "node_modules");
  const installedPackage = join(consumerModules, "@okyrychenko-dev/react-zustand-toolkit");
  mkdirSync(join(consumerModules, "@okyrychenko-dev"), { recursive: true });
  mkdirSync(join(consumerModules, "@types"), { recursive: true });
  cpSync(packageRoot, installedPackage, { recursive: true });
  for (const packageName of ["@okyrychenko-dev/type-utils", "@types/react", "react", "zustand"]) {
    const target = join(repositoryPath, "node_modules", packageName);
    const link = join(consumerModules, packageName);
    mkdirSync(join(link, ".."), { recursive: true });
    symlinkSync(target, link, "dir");
  }

  execFileSync("node", [join(consumerRoot, "esm.mjs")], { stdio: "inherit" });
  execFileSync("node", [join(consumerRoot, "cjs.cjs")], { stdio: "inherit" });
  execFileSync(
    join(repositoryPath, "node_modules/.bin/tsc"),
    [
      "--noEmit",
      "--strict",
      "--skipLibCheck",
      "--module",
      "NodeNext",
      "--moduleResolution",
      "NodeNext",
      "--target",
      "ES2020",
      "consumer.mts",
      "consumer.cts",
    ],
    { cwd: consumerRoot, stdio: "inherit" }
  );

  const sideEffectBundlePath = join(consumerRoot, "side-effect-check.js");
  execFileSync(
    join(repositoryPath, "node_modules/.bin/esbuild"),
    [
      join(consumerRoot, "side-effect-entry.js"),
      "--bundle",
      "--external:react",
      "--external:zustand",
      "--format=esm",
      "--minify",
      `--outfile=${sideEffectBundlePath}`,
    ],
    { stdio: "inherit" }
  );
  const sideEffectExecution = spawnSync("node", [sideEffectBundlePath], {
    encoding: "utf8",
    timeout: 5_000,
  });
  invariant(
    sideEffectExecution.status === 0 &&
      sideEffectExecution.stdout === "" &&
      sideEffectExecution.stderr === "",
    `Importing the package produced observable behavior despite sideEffects: false\n${sideEffectExecution.stdout}${sideEffectExecution.stderr}`
  );
} finally {
  rmSync(temporaryRoot, { force: true, recursive: true });
}
