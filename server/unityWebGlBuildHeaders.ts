export type WebHeaderSink = { setHeader(name: string, value: string): void };

/**
 * Unity WebGL pre-compressed outputs must be served with matching Content-Encoding
 * or the browser receives gzip/br bytes as raw wasm/js and startup stalls near ~90%.
 */
export function applyUnityWebglBuildHeaders(res: WebHeaderSink, absPath: string): void {
  const p = absPath.replace(/\\/g, "/").toLowerCase();
  if (p.endsWith(".wasm.gz")) {
    res.setHeader("Content-Type", "application/wasm");
    res.setHeader("Content-Encoding", "gzip");
  } else if (p.endsWith(".framework.js.gz") || p.endsWith(".worker.js.gz")) {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Content-Encoding", "gzip");
  } else if (p.endsWith(".data.gz")) {
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Encoding", "gzip");
  } else if (p.endsWith(".wasm.br")) {
    res.setHeader("Content-Type", "application/wasm");
    res.setHeader("Content-Encoding", "br");
  } else if (p.endsWith(".framework.js.br") || p.endsWith(".worker.js.br")) {
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Content-Encoding", "br");
  } else if (p.endsWith(".data.br")) {
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Encoding", "br");
  } else if (p.endsWith("court-3d.loader.js") || p.endsWith(".loader.js")) {
    res.setHeader("Content-Type", "application/javascript");
  }
}

/** Long cache for shipped Unity binaries (repeat visits); dev skips to avoid stale exports. */
export function applyCourtBuildCacheHeaders(res: WebHeaderSink, absPath: string, isProduction: boolean): void {
  if (!isProduction) return;
  const p = absPath.replace(/\\/g, "/").toLowerCase();
  if (!p.includes("/court-3d/build/")) return;
  if (
    /\/court-3d\.(loader\.js|data\.gz|framework\.js\.gz|wasm\.gz)$/.test(p) ||
    /\/court-3d\.worker\.js(\.gz|\.br)?$/.test(p)
  ) {
    res.setHeader("Cache-Control", "public, max-age=604800");
  }
}
