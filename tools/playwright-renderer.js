function readCliArg(name) {
  const token = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(token));
  if (!match) {
    return undefined;
  }
  return match.slice(token.length);
}

function normalizeRendererMode(rawValue) {
  const normalized = String(rawValue || "").trim().toLowerCase();
  return normalized === "swiftshader" ? "swiftshader" : "hardware";
}

function resolveRendererMode(defaultMode = "hardware") {
  return normalizeRendererMode(
    readCliArg("renderer")
    || process.env.GAIL_PLAYWRIGHT_RENDERER
    || defaultMode,
  );
}

function buildChromiumLaunchOptions(options = {}) {
  const rendererMode = resolveRendererMode(options.defaultMode);
  const args = [
    "--enable-webgl",
    "--ignore-gpu-blocklist",
  ];

  if (rendererMode === "swiftshader") {
    args.unshift("--use-angle=swiftshader");
  } else {
    args.push("--enable-gpu-rasterization");
    args.push("--enable-zero-copy");
  }

  if (Array.isArray(options.extraArgs) && options.extraArgs.length > 0) {
    args.push(...options.extraArgs);
  }

  return {
    rendererMode,
    launchOptions: {
      headless: options.headless ?? true,
      args,
    },
  };
}

module.exports = {
  buildChromiumLaunchOptions,
  resolveRendererMode,
};
