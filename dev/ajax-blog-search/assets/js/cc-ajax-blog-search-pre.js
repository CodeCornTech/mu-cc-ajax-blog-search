// @ts-nocheck
/**
 * CC Ajax Blog Search — PRE
 *
 * Bootstrap & infrastructure layer.
 *
 * Responsibilities:
 * - Validate runtime config (CC_Ajax_Blog_Search)
 * - Resolve debug flag
 * - Attach strict logger (CC_LC)
 * - Expose CC_ABS namespace
 *
 * This file MUST be loaded before any CC Ajax Blog Search feature.
 *
 * @version 1.1.0
 */

(function (w) {
    'use strict';

    // ------------------------------------------------------------
    // Runtime config guard
    // ------------------------------------------------------------
    const CFG = w.CC_Ajax_Blog_Search || {};
    w.CC_Ajax_Blog_Search = CFG;

    // ------------------------------------------------------------
    // Namespace
    // ------------------------------------------------------------
    const CC_ABS = (w.CC_ABS = w.CC_ABS || {});
    CC_ABS.version = CC_ABS.version || '1.1.0';
    CC_ABS.ctx = '[CC-ABS]';

    // ------------------------------------------------------------
    // Debug resolver (robusto)
    // ------------------------------------------------------------
    const resolveDebug = function () {
        // override manuale da console
        if (typeof w.AJX_CLP_DBG !== 'undefined') {
            return !!w.AJX_CLP_DBG;
        }

        // via wp_localize_script
        if (w.CC_LC && typeof w.CC_LC.asBool === 'function') {
            return w.CC_LC.asBool(CFG.debug);
        }

        // fallback permissivo
        return !!CFG.debug;
    };

    CC_ABS.debug = resolveDebug();

    // ------------------------------------------------------------
    // Debouncer helper
    // ------------------------------------------------------------
    CC_ABS.debounce = function debounce(fn, delay) {
        var t;
        return function () {
            var ctx = this;
            var args = arguments;
            clearTimeout(t);
            t = setTimeout(function () {
                fn.apply(ctx, args);
            }, delay);
        };
    };
    w.CC_ABS.debounce = CC_ABS.debounce;
    // ------------------------------------------------------------
    // LOGGER — STRICT MODE
    // ------------------------------------------------------------
    const hasLoggerCore = !!(w.CC_LC && typeof w.CC_LC.log === 'function');

    // 🔥 se debug attivo e logger mancante → ERRORE STRUTTURALE
    if (CC_ABS.debug && !hasLoggerCore) {
        throw new Error('[CC ABS] Debug enabled but CC_LC logger core is missing');
    }

    // Adapter definitivo
    CC_ABS.log = hasLoggerCore
        ? w.CC_LC
        : {
              log() {},
              info() {},
              warn() {},
              error() {},
              trace() {},
              group() {},
              groupEnd() {},
              time() {},
              timeEnd() {},
              dump() {},
          };

    // ------------------------------------------------------------
    // Sanity log
    // ------------------------------------------------------------
    CC_ABS.log.log(CC_ABS.ctx, 'PRE loaded', {
        debug: CC_ABS.debug,
        version: CC_ABS.version,
    });
})(window);
