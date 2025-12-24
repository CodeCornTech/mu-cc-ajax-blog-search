// CC LOGGER CORE PRE v0.1.0 — CodeCorn™ (2025) | TAG: CC-LC-PRE@0.1.0
// codecorn/core/js/cc-logger-core-pre.js
// @ts-nocheck
(function (w) {
    'use strict';
    if (w.CC_LC && w.CC_LC.__PRE_READY) return;
    // inizializza namespace se non esiste
    w.CC_LC = w.CC_LC || {};
    w.CC_LC.__PRE_READY = true;
    w.CC_LC.VERSION = '0.1.0';

    /* ============================================================
       PALETTE CODECORN™
    ============================================================ */
    const COLORS = {
        ok: '#9fe870',
        warn: '#f3b44a',
        err: '#e85959',
        info: '#7ac8ff',
        gold: '#b69b6a',
        corn: '#f5cd60',
        dim: '#9aa0a6',
        bg1: '#111111',
        bg2: '#1d1d1d',
        bg3: '#333333',
    };

    w.CC_LC.COLORS = COLORS;
    /* ============================================================
        CTX BACKGROUNDS ( sempre diversi )
    ============================================================ */
    const CTX_BG = {
        '[CORE]': '#1d1d1d',
        '[XX]': '#0b2a3d',
        '[YYY]': '#2a0b3d',
        '[EET]': '#3d2a0b',
        '[WP]': '#0b3d1f',
    };
    w.CC_LC.CTX_BG = w.CC_LC.CTX_BG || CTX_BG;
    function ctxBg(ctx) {
        const map = w.CC_LC.CTX_BG || CTX_BG;
        if (map && map[ctx]) return map[ctx];

        // fallback stabile : hash → hue ( scuro )
        let h = 0;
        for (let i = 0; i < String(ctx).length; i++) {
            h = (h * 31 + String(ctx).charCodeAt(i)) >>> 0;
        }
        const hue = h % 360;
        return `hsl(${hue} 38% 16%)`;
    }

    /**
     * Normalizza qualsiasi valore a booleano reale
     * @param {*} v
     * @returns {boolean}
     */
    w.CC_LC.asBool = function asBool(v) {
        if (v === true || v === false) return v;
        if (typeof v === 'number') return v === 1;
        if (typeof v === 'string') {
            const s = v.trim().toLowerCase();
            if (s === '1' || s === 'true' || s === 'yes' || s === 'on') return true;
            if (s === '' || s === '0' || s === 'false' || s === 'no' || s === 'off') return false;
        }
        return !!v;
    };
    /**
     * Rende la funzione asBool non sovrascrivibile
     */
    // Object.defineProperty(w.CC_LC, 'asBool', {
    //     writable: false,
    //     configurable: false,
    //     enumerable: true,
    // });
    /* ============================================================
       LIVELLI LOG (da wp_localize_script)
    ============================================================ */

    const DEBUG_ENABLED = w.CC_LC.asBool(w.CC_LC.DEBUG);
    const LOGLEVEL = w.CC_LC.LOGLEVEL || 'DEBUG';

    const LVL = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3,
        TRACE: 4,
    };

    const currentLevel = LVL[LOGLEVEL] ?? LVL.DEBUG;

    function shouldLog(levelKey) {
        const lvl = LVL[levelKey] ?? LVL.DEBUG;
        return DEBUG_ENABLED && lvl <= currentLevel;
    }

    function safeString(a) {
        if (a && (a.nodeType || a.jquery)) return '[DOM]';
        if (typeof a === 'object') {
            try {
                return JSON.stringify(a);
            } catch (_) {
                return '[Object]';
            }
        }
        return String(a);
    }

    /* ============================================================
        BADGE STYLE ENTERPRISE™ ( with CTX )
       ============================================================ */
    function _CC_LC_extractCtxAndMsg(argsLike) {
        const args = Array.prototype.slice.call(argsLike || []);
        const parts = args.map(safeString);

        // CTX : primo argomento tipo "[XX]" / "[YYY]" / "[CORE]"
        let ctx = '[CORE]';
        if (parts.length && typeof args[0] === 'string') {
            const s = String(args[0]).trim();
            if (/^\[[A-Za-z0-9_\-]{2,}\]$/.test(s)) {
                ctx = s;
                parts.shift(); // rimuovi ctx dal messaggio
            }
        }

        return { ctx, msg: parts.join(' ') };
    }

    /**
     * badge(level, ctx, msg, colorKey)
     * - compat : se chiami badge(level, msg, colorKey) funziona lo stesso
     */
    function badge(level, ctx, msg, colorKey = 'gold') {
        if (!shouldLog(level)) return;

        // compat vecchio : badge(level, msg, colorKey)
        if (msg === undefined && typeof ctx === 'string') {
            msg = ctx;
            ctx = '[CORE]';
        }

        const c = COLORS[colorKey] || colorKey || COLORS.corn;

        const tag = `%c CodeCorn™ - Logger Core %c ${level} %c ${ctx} %c ${msg} %c`;

        const css1 = `background:${COLORS.bg1};color:${COLORS.corn};padding:3px 6px;border-radius:4px 0 0 4px;font-weight:bold;`;
        const css2 = `background:${c};color:#000;padding:3px 6px;font-weight:bold;`;
        const css3 = `background:${ctxBg(ctx)};color:${COLORS.corn};padding:3px 6px;font-weight:bold;`; // CTX
        const css4 = `background:${COLORS.bg3};color:${COLORS.corn};padding:3px 6px;border-radius:0 4px 4px 0;`; // MSG
        const css5 = '';

        try {
            console.log(tag, css1, css2, css3, css4, css5);
        } catch (_) {}
    }

    w.CC_LC.badge = badge;

    /* ============================================================
       LOGGER BASE  OVERRIDE : primo argomento è CTX ( opzionale )
    ============================================================ */

    w.CC_LC.log = function () {
        if (!shouldLog('DEBUG')) return;
        const { ctx, msg } = _CC_LC_extractCtxAndMsg(arguments);
        badge('DEBUG', ctx, msg, 'ok');
    };
    w.CC_LC.info = function () {
        if (!shouldLog('INFO')) return;
        const { ctx, msg } = _CC_LC_extractCtxAndMsg(arguments);
        badge('INFO', ctx, msg, 'corn');
    };
    w.CC_LC.warn = function () {
        if (!shouldLog('WARN')) return;
        const { ctx, msg } = _CC_LC_extractCtxAndMsg(arguments);
        badge('WARN', ctx, msg, 'warn');
    };
    w.CC_LC.error = function () {
        if (!shouldLog('ERROR')) return;
        const { ctx, msg } = _CC_LC_extractCtxAndMsg(arguments);
        badge('ERROR', ctx, msg, 'err');
    };
    w.CC_LC.trace = function () {
        if (!shouldLog('TRACE')) return;
        const { ctx, msg } = _CC_LC_extractCtxAndMsg(arguments);
        badge('TRACE', ctx, msg, 'dim');
    };

    /* ============================================================
       ADVANCED API (Enterprise Debug Tools)
    ============================================================ */

    // 🔥 GROUP: console.group con badge (CTX opzionale)
    w.CC_LC.group = function (title = 'Group') {
        if (!shouldLog('DEBUG')) return;

        const { ctx, msg } = _CC_LC_extractCtxAndMsg([title]);
        badge('DEBUG', ctx, msg || 'Group', 'gold');

        try {
            console.groupCollapsed(`${ctx} ${msg || ''}`.trim());
        } catch (_) {}
    };

    // 🔥 GROUP END
    w.CC_LC.groupEnd = function () {
        if (!shouldLog('DEBUG')) return;
        try {
            console.groupEnd();
        } catch (_) {}
    };

    // 🔥 TIME / TIME END (CTX opzionale)
    w.CC_LC.time = function (label = 'Timer') {
        if (!shouldLog('DEBUG')) return;

        const { ctx, msg } = _CC_LC_extractCtxAndMsg([label]);
        const finalLabel = `⏳ ${ctx} ${msg || 'Timer'}`.trim();

        badge('DEBUG', ctx, `TIME ${msg || 'Timer'}`, 'gold');

        try {
            console.time(finalLabel);
        } catch (_) {}
    };

    w.CC_LC.timeEnd = function (label = 'Timer') {
        if (!shouldLog('DEBUG')) return;

        const { ctx, msg } = _CC_LC_extractCtxAndMsg([label]);
        const finalLabel = `⏳ ${ctx} ${msg || 'Timer'}`.trim();

        badge('DEBUG', ctx, `TIME END ${msg || 'Timer'}`, 'gold');

        try {
            console.timeEnd(finalLabel);
        } catch (_) {}
    };

    // 🔥 DUMP (Object viewer) (label può essere "[XX] foo" oppure foo)
    w.CC_LC.dump = function (label, obj) {
        if (!shouldLog('DEBUG')) return;

        const { ctx, msg } = _CC_LC_extractCtxAndMsg([label]);
        badge('DEBUG', ctx, `${msg} (dump)`, 'info');

        try {
            console.table(obj);
        } catch (_) {
            try {
                console.log(obj);
            } catch (_) {}
        }
    };

    // 🔥 ASSERT (msg può essere "[XX] Assertion failed" oppure testo)
    w.CC_LC.assert = function (condition, msg = 'Assertion failed') {
        if (condition) return;

        const { ctx, msg: m } = _CC_LC_extractCtxAndMsg([msg]);
        badge('ERROR', ctx, m, 'err');

        try {
            console.assert(false, `${ctx} ${m}`.trim());
        } catch (_) {}
    };

    // ============================================================
    // SIGNAL READY (per altri moduli)
    // ============================================================
    try {
        w.dispatchEvent(
            new CustomEvent('cc-logger-core-pre-ready', {
                detail: { version: w.CC_LC.VERSION || 'unknown' },
            }),
        );
    } catch (_) {}
})(window);
