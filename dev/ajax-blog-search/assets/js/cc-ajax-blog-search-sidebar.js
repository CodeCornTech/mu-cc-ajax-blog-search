// @ts-nocheck
/**
 * CC Ajax Blog Search — SIDEBAR
 *
 * Gestione UI sidebar / overlay / mobile.
 *
 * Responsabilità:
 * - creare pannello overlay
 * - gestire toggle open / close
 * - adattare layout mobile / desktop
 * - intercettare eventi (click / touch / resize)
 *
 * Dipendenze:
 * - cc-ajax-blog-search-pre.js (CC_ABS, CC_Ajax_Blog_Search)
 * - jQuery
 *
 * NON fa:
 * - AJAX
 * - logica di ricerca
 * - bootstrap / debug resolver
 *
 * @version 1.1.0
 */

(function (w, $) {
    'use strict';

    // ------------------------------------------------------------
    // Guard PRE
    // ------------------------------------------------------------
    if (!w.CC_ABS || !w.CC_Ajax_Blog_Search) {
        console.error('[CC ABS][SIDEBAR] PRE missing');
        return;
    }

    const { log } = w.CC_ABS;
    const CFG = w.CC_Ajax_Blog_Search;

    // ------------------------------------------------------------
    // Core
    // ------------------------------------------------------------
    function initSidebarToggle() {
        log.log('[AJX-SIDEBAR]', 'initSidebarToggle:start');

        // Guard feature flag
        if (!CFG.sidebar_toggle || !CFG.sidebar_toggle.enabled) {
            log.log('[AJX-SIDEBAR]', 'sidebar_toggle disabled or missing');
            return;
        }

        const cfg = CFG.sidebar_toggle;
        const breakpoint = cfg.breakpoint || 992;
        const mode = cfg.mode || 'floating';
        const label = cfg.label || 'Filtri';

        const ui = CFG.ui || {};
        const sidebarSelector = ui.sidebar_container_selector;

        if (!sidebarSelector) {
            log.warn('[AJX-SIDEBAR]', 'sidebar_container_selector missing');
            return;
        }

        const $sidebarInner = $(sidebarSelector).first();
        if (!$sidebarInner.length) {
            log.warn('[AJX-SIDEBAR]', 'sidebar container not found', sidebarSelector);
            return;
        }

        // --------------------------------------------------------
        // DOM setup
        // --------------------------------------------------------

        // Segnala feature attiva
        document.body.classList.add('cc-sidebar-toggle-enabled');

        // Placeholder per ripristino posizione originale
        const $placeholder = $('<div class="cc-sidebar-placeholder" style="display:none;"></div>');
        $placeholder.insertBefore($sidebarInner);

        // Overlay panel
        const $panel = $('<div class="cc-sidebar-panel"></div>');
        const $panelInner = $('<div class="cc-sidebar-panel__inner"></div>');
        const $close = $('<button type="button" class="cc-sidebar-panel__close" aria-label="Chiudi filtri">&times;</button>');

        $panelInner.append($close).append($sidebarInner);
        $panel.append($panelInner);
        $('body').append($panel);

        // Toggle button
        let toggleClass = 'cc-sidebar-toggle';
        toggleClass += mode === 'top' ? ' cc-sidebar-toggle--top' : ' cc-sidebar-toggle--floating';

        const $toggle = $(`<button type="button" class="${toggleClass}"></button>`);
        $toggle.text(label);
        $('body').append($toggle);

        // --------------------------------------------------------
        // State helpers
        // --------------------------------------------------------
        function isMobile() {
            return w.innerWidth <= breakpoint;
        }

        function openPanel() {
            log.log('[AJX-SIDEBAR]', 'openPanel');
            $panel.addClass('cc-sidebar-panel--open').show();
            $toggle.addClass('cc-sidebar-toggle--active');
            document.body.classList.add('cc-sidebar-panel-open');
        }

        function closePanel() {
            log.log('[AJX-SIDEBAR]', 'closePanel');
            $panel.removeClass('cc-sidebar-panel--open').hide();
            $toggle.removeClass('cc-sidebar-toggle--active');
            document.body.classList.remove('cc-sidebar-panel-open');
        }

        // Stato iniziale
        closePanel();

        // --------------------------------------------------------
        // Event binding
        // --------------------------------------------------------
        $toggle.on('click', function () {
            $panel.hasClass('cc-sidebar-panel--open') ? closePanel() : openPanel();
        });

        $close.on('click', function () {
            closePanel();
        });

        // Blocca eventi dentro il pannello
        $panelInner.on('click mousedown touchstart touchend', function (e) {
            e.stopPropagation();
        });

        // Click sull’overlay scuro → chiudi
        $panel.on('click mousedown touchstart touchend', function (e) {
            if ($(e.target).closest('.cc-sidebar-panel__inner').length) return;
            closePanel();
        });

        // Airbag: elementi interattivi non devono chiudere il pannello
        $panelInner.find('input, select, textarea, button, a').on('click mousedown touchstart touchend', function (e) {
            e.stopPropagation();
        });

        // --------------------------------------------------------
        // Resize handling
        // --------------------------------------------------------
        function handleResize() {
            log.log('[AJX-SIDEBAR]', 'handleResize', { width: w.innerWidth });

            if (isMobile()) {
                // Mobile: sidebar nel pannello
                if (!$panelInner.find($sidebarInner).length) {
                    $panelInner.append($sidebarInner);
                }

                $toggle.show();
                $placeholder.show();
            } else {
                // Desktop: ripristina sidebar
                closePanel();

                if ($placeholder.parent().length && !$placeholder.next().is($sidebarInner)) {
                    $sidebarInner.insertAfter($placeholder);
                }

                $toggle.hide();
                $panel.hide();
                $placeholder.hide();
            }
        }

        // Init + resize listener
        handleResize();
        $(w).on('resize', handleResize);
    }

    // ------------------------------------------------------------
    // Init
    // ------------------------------------------------------------
    $(function () {
        initSidebarToggle();
    });
})(window, jQuery);
