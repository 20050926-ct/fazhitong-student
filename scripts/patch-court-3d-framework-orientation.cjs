/**
 * Patch Unity WebGL framework after export: avoid crash in JS_ScreenOrientation_eventHandler
 * (RuntimeError: null function or function signature mismatch) on some Chromium builds.
 *
 * - Coerce width/height/angle to integers before dynCall (undefined angle is unsafe).
 * - Wrap dynCall in try/catch so a bad callback does not abort the player.
 * - Drop the immediate setTimeout(handler,0) call (can race before wasm tables settle).
 *
 * Run: node scripts/patch-court-3d-framework-orientation.cjs
 * Idempotent: skips if already patched.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const rel = path.join('public', 'court-3d', 'Build', 'court-3d.framework.js.gz');
const frameworkPath = path.join(__dirname, '..', rel);

const OLD_HANDLER =
  'function JS_ScreenOrientation_eventHandler(){if(JS_ScreenOrientation_callback)dynCall_viii(JS_ScreenOrientation_callback,window.innerWidth,window.innerHeight,screen.orientation?screen.orientation.angle:window.orientation)}';

const NEW_HANDLER =
  'function JS_ScreenOrientation_eventHandler(){if(!JS_ScreenOrientation_callback)return;var o=screen.orientation,a=o!=null&&typeof o.angle==="number"?o.angle:typeof window.orientation==="number"?window.orientation:0;try{dynCall_viii(JS_ScreenOrientation_callback,0|window.innerWidth,0|window.innerHeight,0|a)}catch(e){}}';

const OLD_INIT =
  'function _JS_ScreenOrientation_Init(callback){if(!JS_ScreenOrientation_callback){if(screen.orientation){screen.orientation.addEventListener("change",JS_ScreenOrientation_eventHandler)}window.addEventListener("resize",JS_ScreenOrientation_eventHandler);JS_ScreenOrientation_callback=callback;setTimeout(JS_ScreenOrientation_eventHandler,0)}}';

const NEW_INIT =
  'function _JS_ScreenOrientation_Init(callback){if(!JS_ScreenOrientation_callback){if(screen.orientation){screen.orientation.addEventListener("change",JS_ScreenOrientation_eventHandler)}window.addEventListener("resize",JS_ScreenOrientation_eventHandler);JS_ScreenOrientation_callback=callback}}';

function main() {
  if (!fs.existsSync(frameworkPath)) {
    console.error('[patch-court-3d-framework-orientation] Missing', frameworkPath);
    process.exit(1);
  }
  const buf = fs.readFileSync(frameworkPath);
  let js = zlib.gunzipSync(buf).toString('utf8');

  if (js.includes('0|window.innerHeight,0|a)}catch(e){}}')) {
    console.log('[patch-court-3d-framework-orientation] Already patched.');
    return;
  }

  if (!js.includes(OLD_HANDLER)) {
    console.error(
      '[patch-court-3d-framework-orientation] Expected handler snippet not found; Unity export layout may have changed.',
    );
    process.exit(1);
  }
  if (!js.includes(OLD_INIT)) {
    console.error(
      '[patch-court-3d-framework-orientation] Expected Init snippet not found; Unity export layout may have changed.',
    );
    process.exit(1);
  }

  js = js.replace(OLD_HANDLER, NEW_HANDLER).replace(OLD_INIT, NEW_INIT);
  const out = zlib.gzipSync(Buffer.from(js, 'utf8'), { level: 9 });
  fs.writeFileSync(frameworkPath, out);
  console.log('[patch-court-3d-framework-orientation] Patched', rel);
}

main();
