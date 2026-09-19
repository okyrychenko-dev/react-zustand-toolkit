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
import { publicationContract } from "./publication-contract.ts";

const repositoryRoot = new URL("../", import.meta.url);
const repositoryPath = fileURLToPath(repositoryRoot);
const temporaryRoot = mkdtempSync(join(tmpdir(), "react-zustand-toolkit-package-"));
const tarballPath = join(temporaryRoot, "react-zustand-toolkit.tgz");
const extractRoot = join(temporaryRoot, "extract");
const consumerRoot = join(temporaryRoot, "consumer");

function run(command: string, args: Array<string>) {
  return execFileSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: "inherit",
  });
}

const contractViolations: Array<string> = [];

function check(condition: boolean, message: string) {
  if (!condition) {
    contractViolations.push(message);
  }
}

function throwIfContractViolations(): void {
  if (contractViolations.length > 0) {
    throw new Error(
      `Publication contract violations (${contractViolations.length}):\n- ${contractViolations.join("\n- ")}`
    );
  }
}

function listFiles(directory: string): Array<string> {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [relative(join(extractRoot, "package"), path)];
  });
}

function packageRootName(specifier: string): string {
  const segments = specifier.split("/");
  return specifier.startsWith("@") ? `${segments[0]}/${segments[1]}` : segments[0];
}

function externalPackages(contents: string): Array<string> {
  const specifiers = [
    ...contents.matchAll(/\bfrom\s+["']([^"']+)["']/gu),
    ...contents.matchAll(/\brequire\(["']([^"']+)["']\)/gu),
  ].map((match) => packageRootName(match[1]));
  return [...new Set(specifiers)].sort();
}

function runtimeExportAssertions(moduleLabel: string): string {
  const expectedRuntimeExports = [
    ...publicationContract.runtimeExports.stable,
    ...publicationContract.runtimeExports.deprecated,
  ].sort();

  return `const expected = ${JSON.stringify(expectedRuntimeExports)};\nconst actual = Object.keys(packageExports).sort();\nif (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(\`${moduleLabel} exports differ: \${JSON.stringify(actual)}\`);\nfor (const name of expected) if (typeof packageExports[name] !== "function") throw new Error(\`${moduleLabel} export unavailable: \${name}\`);\n`;
}

try {
  run("pnpm", ["pack", "--out", tarballPath]);
  mkdirSync(extractRoot, { recursive: true });
  mkdirSync(consumerRoot, { recursive: true });
  run("tar", ["-xzf", tarballPath, "-C", extractRoot]);

  const packageRoot = join(extractRoot, "package");
  const packedFiles = listFiles(packageRoot).sort();
  check(
    JSON.stringify(packedFiles) === JSON.stringify(publicationContract.packedFiles),
    `Unexpected packed files:\n${packedFiles.join("\n")}`
  );

  const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
  check(
    manifest.sideEffects === publicationContract.sideEffects,
    "Published package must remain side-effect free"
  );
  check(
    JSON.stringify(manifest.peerDependencies) ===
      JSON.stringify(publicationContract.peerDependencies),
    "Published peer dependencies do not match the public contract"
  );
  check(
    JSON.stringify(Object.keys(manifest.dependencies ?? {}).sort()) ===
      JSON.stringify(publicationContract.runtimeDependencies),
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
  check(
    JSON.stringify(importedRuntimePackages) === JSON.stringify(declaredRuntimePackages),
    `Built imports ${JSON.stringify(importedRuntimePackages)} do not match declared runtime packages ${JSON.stringify(declaredRuntimePackages)}`
  );

  const exportTargets = [
    manifest.exports["."].import.types,
    manifest.exports["."].import.default,
    manifest.exports["."].require.types,
    manifest.exports["."].require.default,
  ];
  check(
    JSON.stringify(exportTargets) === JSON.stringify(publicationContract.exportTargets),
    `Package export targets do not match the publication contract: ${JSON.stringify(exportTargets)}`
  );
  for (const exportPath of exportTargets) {
    check(existsSync(join(packageRoot, exportPath)), `Missing exported file: ${exportPath}`);
  }

  for (const declarationFile of ["dist/index.d.ts", "dist/index.d.cts"]) {
    const declarations = readFileSync(join(packageRoot, declarationFile), "utf8");
    const exportStatement = declarations.match(/^export \{ ([^}]+) \};$/mu);
    if (exportStatement) {
      const exportEntries = exportStatement[1].split(", ");
      const actualTypeExports = exportEntries
        .filter((entry) => entry.startsWith("type "))
        .map((entry) => entry.slice("type ".length))
        .sort();
      const expectedTypeExports = [
        ...publicationContract.typeExports.stable,
        ...publicationContract.typeExports.deprecated,
      ].sort();
      check(
        JSON.stringify(actualTypeExports) === JSON.stringify(expectedTypeExports),
        `${declarationFile} type exports ${JSON.stringify(actualTypeExports)} do not match ${JSON.stringify(expectedTypeExports)}`
      );
    } else {
      check(false, `${declarationFile} is missing its public export statement`);
    }
    const deprecatedExports = [
      ...publicationContract.runtimeExports.deprecated,
      ...publicationContract.typeExports.deprecated,
    ];
    for (const deprecatedName of deprecatedExports) {
      const declarationPattern = new RegExp(
        `/\\*\\*(?:(?!\\*/)[\\s\\S])*?@deprecated(?:(?!\\*/)[\\s\\S])*?\\*/\\s*(?:declare\\s+function\\s+)?${deprecatedName}\\b`,
        "u"
      );
      check(
        declarationPattern.test(declarations),
        `${declarationFile} is missing deprecation guidance for ${deprecatedName}`
      );
    }
  }

  throwIfContractViolations();

  writeFileSync(
    join(consumerRoot, "package.json"),
    JSON.stringify({ private: true, type: "module" })
  );
  writeFileSync(
    join(consumerRoot, "esm.mjs"),
    `import * as packageExports from "@okyrychenko-dev/react-zustand-toolkit";\n${runtimeExportAssertions("ESM")}`
  );
  writeFileSync(
    join(consumerRoot, "cjs.cjs"),
    `const packageExports = require("@okyrychenko-dev/react-zustand-toolkit");\n${runtimeExportAssertions("CommonJS")}`
  );
  writeFileSync(
    join(consumerRoot, "side-effect-entry.js"),
    'const before = new Set(Reflect.ownKeys(globalThis));\nawait import("@okyrychenko-dev/react-zustand-toolkit");\nconst added = Reflect.ownKeys(globalThis).filter((key) => !before.has(key));\nif (added.length > 0) throw new Error(`Package added globals: ${added.join(", ")}`);\n'
  );
  const typeConsumer = readFileSync(join(repositoryPath, "scripts/package-consumer.typecheck.ts"));
  const ssrConsumer = readFileSync(join(repositoryPath, "scripts/package-consumer.ssr.ts"));
  writeFileSync(join(consumerRoot, "consumer.mts"), typeConsumer);
  writeFileSync(join(consumerRoot, "consumer.cts"), typeConsumer);
  writeFileSync(join(consumerRoot, "ssr.mts"), ssrConsumer);

  const consumerModules = join(consumerRoot, "node_modules");
  const installedPackage = join(consumerModules, "@okyrychenko-dev/react-zustand-toolkit");
  mkdirSync(join(consumerModules, "@okyrychenko-dev"), { recursive: true });
  mkdirSync(join(consumerModules, "@types"), { recursive: true });
  cpSync(packageRoot, installedPackage, { recursive: true });
  for (const packageName of [
    "@okyrychenko-dev/type-utils",
    "@types/react",
    "@types/react-dom",
    "happy-dom",
    "react",
    "react-dom",
    "zustand",
  ]) {
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
      "ssr.mts",
    ],
    { cwd: consumerRoot, stdio: "inherit" }
  );
  execFileSync("node", [join(consumerRoot, "ssr.mts")], { stdio: "inherit" });

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
  check(
    sideEffectExecution.status === 0 &&
      sideEffectExecution.stdout === "" &&
      sideEffectExecution.stderr === "",
    `Importing the package produced observable behavior despite sideEffects: false\n${sideEffectExecution.stdout}${sideEffectExecution.stderr}`
  );
  throwIfContractViolations();
} finally {
  rmSync(temporaryRoot, { force: true, recursive: true });
}
