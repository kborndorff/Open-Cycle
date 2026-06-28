const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const root = process.cwd();
const reportPath = path.join(root, "reports", "owner-release-tools.json");
const unsignedAabPath = path.join(root, "apps", "mobile", "android", "app", "build", "outputs", "bundle", "release", "app-release.aab");
const githubWebFallbackPath = path.join(root, "docs", "github-web-publication.md");

function javaHomeCandidates() {
  const candidates = [process.env.JAVA_HOME].filter(Boolean);
  if (process.platform === "win32") {
    for (const rootPath of [process.env.ProgramFiles, process.env["ProgramFiles(x86)"]].filter(Boolean)) {
      for (const androidStudioDir of ["Android Studio", "Android Studio1", "Android Studio2"]) {
        candidates.push(path.join(rootPath, "Android", androidStudioDir, "jbr"));
      }
    }
  }
  return candidates;
}

function androidHomeCandidates() {
  return [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Android", "Sdk") : "",
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, "AppData", "Local", "Android", "Sdk") : "",
    os.homedir() ? path.join(os.homedir(), "AppData", "Local", "Android", "Sdk") : ""
  ].filter(Boolean);
}

function findJavaHome() {
  return javaHomeCandidates().find((candidate) =>
    fs.existsSync(path.join(candidate, "bin", process.platform === "win32" ? "jarsigner.exe" : "jarsigner")) &&
      fs.existsSync(path.join(candidate, "bin", process.platform === "win32" ? "keytool.exe" : "keytool"))
  ) || "";
}

function findAndroidHome() {
  return androidHomeCandidates().find((candidate) =>
    fs.existsSync(path.join(candidate, "platforms")) &&
      fs.existsSync(path.join(candidate, "build-tools"))
  ) || "";
}

const detectedJavaHome = findJavaHome();
const detectedAndroidHome = findAndroidHome();

const requiredCommands = [
  {
    id: "node",
    command: process.execPath,
    args: ["--version"],
    purpose: "Run the release validators."
  },
  {
    id: "npm",
    command: process.env.npm_execpath ? process.execPath : resolveShellTool("npm"),
    args: process.env.npm_execpath ? [process.env.npm_execpath, "--version"] : ["--version"],
    purpose: "Run the project release scripts."
  },
  {
    id: "gh",
    command: resolveGitHubCli(),
    args: ["--version"],
    purpose: "Set GitHub Actions secrets and validate the public repository."
  },
  {
    id: "jarsigner",
    command: resolveJavaTool("jarsigner"),
    args: ["-help"],
    purpose: "Verify the signed Android App Bundle."
  },
  {
    id: "keytool",
    command: resolveJavaTool("keytool"),
    args: ["-help"],
    purpose: "Create or inspect the private Play upload keystore."
  }
];

const optionalCommands = [
  {
    id: "wrangler",
    command: resolveShellTool("wrangler"),
    args: ["--version"],
    purpose: "Optional local Cloudflare Pages deploy checks; GitHub Actions uses cloudflare/wrangler-action."
  }
];

const requiredFiles = [
  {
    id: "privateSigningPrompt",
    file: path.join(root, "scripts", "run-android-private-release.ps1"),
    purpose: "Prompt for signing secrets without committing them."
  },
  {
    id: "keystoreCreator",
    file: path.join(root, "scripts", "create-android-upload-keystore.ps1"),
    purpose: "Create a local upload keystore outside the repository."
  },
  {
    id: "androidGradleWrapper",
    file: path.join(root, "apps", "mobile", "android", process.platform === "win32" ? "gradlew.bat" : "gradlew"),
    purpose: "Build the Android App Bundle locally."
  },
  {
    id: "cloudflarePagesWorkflow",
    file: path.join(root, ".github", "workflows", "deploy-site.yml"),
    purpose: "Deploy site/dist through Cloudflare Pages."
  }
];

const environmentPresence = [
  {
    id: "JAVA_HOME",
    present: Boolean(detectedJavaHome),
    purpose: process.env.JAVA_HOME ? "Helps locate jarsigner and keytool." : "Detected from a common Android Studio Java runtime path."
  },
  {
    id: "ANDROID_HOME",
    present: Boolean(detectedAndroidHome),
    purpose: process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT ? "Helps Gradle locate the Android SDK." : "Detected from a common Android SDK path."
  }
];

function resolveJavaTool(name) {
  const executable = process.platform === "win32" ? `${name}.exe` : name;
  for (const javaHome of javaHomeCandidates()) {
    const candidate = path.join(javaHome, "bin", executable);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return executable;
}

function resolveShellTool(name) {
  if (process.platform !== "win32") {
    return name;
  }

  const result = spawnSync("where.exe", [name], {
    cwd: root,
    encoding: "utf8",
    timeout: 5000
  });
  const firstMatch = String(result.stdout || "").split(/\r?\n/).find((line) => line.trim());
  return firstMatch ? firstMatch.trim() : `${name}.cmd`;
}

function githubCliCandidates() {
  if (process.platform !== "win32") {
    return ["gh"];
  }

  return [
    process.env.ProgramFiles ? path.join(process.env.ProgramFiles, "GitHub CLI", "gh.exe") : "",
    process.env["ProgramFiles(x86)"] ? path.join(process.env["ProgramFiles(x86)"], "GitHub CLI", "gh.exe") : "",
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, "Programs", "GitHub CLI", "gh.exe") : "",
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, "AppData", "Local", "Programs", "GitHub CLI", "gh.exe") : ""
  ].filter(Boolean);
}

function resolveGitHubCli() {
  if (process.platform !== "win32") {
    return "gh";
  }

  const fromPath = resolveShellTool("gh");
  if (fs.existsSync(fromPath)) {
    return fromPath;
  }

  return githubCliCandidates().find((candidate) => fs.existsSync(candidate)) || fromPath;
}

function runCommand(check) {
  const result = spawnSync(check.command, check.args, {
    cwd: root,
    encoding: "utf8",
    timeout: 15000
  });

  const output = `${result.stdout || ""}\n${result.stderr || ""}`.trim();
  const firstLine = output.split(/\r?\n/).find(Boolean) || "";
  return {
    id: check.id,
    status: result.error || result.status !== 0 ? "missing" : "present",
    purpose: check.purpose,
    version: firstLine.slice(0, 120) || null
  };
}

function checkFile(item) {
  return {
    id: item.id,
    status: fs.existsSync(item.file) ? "present" : "missing",
    purpose: item.purpose
  };
}

function main() {
  const commands = requiredCommands.map(runCommand);
  const optional = optionalCommands.map(runCommand);
  const files = requiredFiles.map(checkFile);
  const env = environmentPresence.map((item) => ({
    id: item.id,
    status: item.present ? "present" : "missing",
    purpose: item.purpose
  }));

  const missingRequired = [
    ...commands
      .filter((item) => item.status !== "present")
      .filter((item) => item.id !== "gh" || !fs.existsSync(githubWebFallbackPath))
      .map((item) => item.id),
    ...files.filter((item) => item.status !== "present").map((item) => item.id)
  ];

  const missingRecommended = [
    ...optional.filter((item) => item.status !== "present").map((item) => item.id),
    ...commands
      .filter((item) => item.status !== "present")
      .filter((item) => item.id === "gh" && fs.existsSync(githubWebFallbackPath))
      .map((item) => item.id),
    ...env
      .filter((item) => item.status !== "present")
      .filter((item) => item.id !== "ANDROID_HOME" || !fs.existsSync(unsignedAabPath))
      .map((item) => item.id)
  ];

  const report = {
    generatedAt: new Date().toISOString(),
    status: missingRequired.length === 0 ? "ready-or-owner-action-only" : "missing-required-owner-tools",
    strict,
    secretSafe: true,
    note: "This report records tool presence only. It does not read, print, or store secret values.",
    unsignedAabExists: fs.existsSync(unsignedAabPath),
    githubWebFallbackExists: fs.existsSync(githubWebFallbackPath),
    missingRequired,
    missingRecommended,
    commands,
    optionalCommands: optional,
    environmentPresence: env,
    files
  };

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Owner release tools report written to ${reportPath}`);
  console.log(`Status: ${report.status}`);

  if (missingRequired.length > 0) {
    console.log(`Missing required tools/files: ${missingRequired.join(", ")}`);
  }
  if (missingRecommended.length > 0) {
    console.log(`Missing recommended local setup: ${missingRecommended.join(", ")}`);
  }
  console.log("No secret values were read or printed.");

  if (strict && missingRequired.length > 0) {
    process.exit(1);
  }
}

main();
