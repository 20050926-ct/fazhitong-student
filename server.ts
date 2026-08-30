import dotenv from "dotenv";
dotenv.config();
dotenv.config({ path: ".env.local", override: true });

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import cors from "cors";
import { PORT } from "./server/config";
import { createApiRouter } from "./server/apiRouter";
import { seedDefaultLegalVideosIfEmpty } from "./server/seedDefaultLegalVideosIfEmpty";
import { applyCourtBuildCacheHeaders, applyUnityWebglBuildHeaders } from "./server/unityWebGlBuildHeaders";

function warnIfCourtWebglBuildIncomplete(rootDir: string, label: string): void {
  const buildDir = path.join(rootDir, "court-3d", "Build");
  const required = ["court-3d.data.gz", "court-3d.framework.js.gz", "court-3d.wasm.gz"];
  for (const f of required) {
    const full = path.join(buildDir, f);
    if (!fs.existsSync(full)) {
      console.warn(
        `[court-3d] Missing ${f} under ${label}. Unity load will hang or fail. Export WebGL into ${path.join(label, "court-3d")} or run npm run build:court-3d.`,
      );
    }
  }
}

async function startServer() {
  await seedDefaultLegalVideosIfEmpty();
  const app = express();
  const HMR_PORT = Number(process.env.VITE_HMR_PORT) || 24679;

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use((req, res, next) => {
    res.setHeader("Permissions-Policy", "screen-orientation=*, fullscreen=*");
    next();
  });
  app.use("/api", createApiRouter());

  if (process.env.NODE_ENV !== "production") {
    const courtPublic = path.join(process.cwd(), "public", "court-3d");
    warnIfCourtWebglBuildIncomplete(path.join(process.cwd(), "public"), "public");

    app.use(
      "/court-3d",
      express.static(courtPublic, {
        fallthrough: false,
        setHeaders(res, filePath) {
          applyUnityWebglBuildHeaders(res, filePath);
          applyCourtBuildCacheHeaders(res, filePath, false);
        },
      }),
    );

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { port: HMR_PORT },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    warnIfCourtWebglBuildIncomplete(distPath, "dist");
    app.use(
      express.static(distPath, {
        setHeaders(res, filePath) {
          applyUnityWebglBuildHeaders(res, filePath);
          applyCourtBuildCacheHeaders(res, filePath, process.env.NODE_ENV === "production");
        },
      }),
    );
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
