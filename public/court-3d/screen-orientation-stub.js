/**
 * Work around Unity WebGL crash: RuntimeError in JS_ScreenOrientation_eventHandler
 * ("null function or function signature mismatch") on some browsers.
 * Must load before court-3d.loader.js (see index.html).
 */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  function noop() {}
  function noopPromise() {
    return Promise.resolve();
  }
  try {
    var proto = typeof ScreenOrientation !== 'undefined' && ScreenOrientation.prototype;
    if (proto && typeof proto.addEventListener === 'function') {
      var origAdd = proto.addEventListener;
      proto.addEventListener = function (type, listener, options) {
        if (type === 'change') return;
        return origAdd.call(this, type, listener, options);
      };
      var origRemove = proto.removeEventListener;
      proto.removeEventListener = function (type, listener, options) {
        if (type === 'change') return;
        return origRemove.call(this, type, listener, options);
      };
    }
  } catch (e1) {}
  try {
    if (window.screen) {
      var fake = {
        angle: 0,
        type: 'landscape-primary',
        onchange: null,
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: function () {
          return true;
        },
        lock: noopPromise,
        unlock: noop,
      };
      Object.defineProperty(window.screen, 'orientation', {
        configurable: true,
        enumerable: true,
        get: function () {
          return fake;
        },
      });
    }
  } catch (e2) {}
})();
