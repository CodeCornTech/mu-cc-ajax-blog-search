<?php
/**
 * Plugin Name: CC BBM Ajax Search Theme Config
 * Description: Applica i token visivi Barbagia Musei ai profili ABS e rifinisce il searchbox Divi.
 * Version:     0.2.0
 * Author:      CodeCorn™ Technology
 */

defined('ABSPATH') || exit;

/**
 * Inserisce la skin Barbagia dopo lo stylesheet core ABS.
 */
add_action(
    'wp_enqueue_scripts',
    static function (): void {
        if (
            is_admin()
            || !defined('MU_CC_ABS_HANDLE')
            || !wp_style_is(MU_CC_ABS_HANDLE, 'enqueued')
        ) {
            return;
        }

        $css = <<<'CSS'
/* ==========================================================
 * Barbagia Musei — token ABS globali
 * ========================================================== */

body {
    --cc-abs-title-color: var(--bm-teal, #02797e);
    --cc-abs-footer-link-color: var(--bm-teal, #02797e);
    --cc-abs-sidebar-bg: #ffffff;
    --cc-abs-sidebar-color: #17302f;
    --cc-abs-sidebar-border-color: var(--bm-gold, #d9a441);
    --cc-abs-toggle-bg: var(--bm-teal, #02797e);
    --cc-abs-toggle-color: #ffffff;
    --cc-abs-toggle-border-color: var(--bm-teal, #02797e);
    --cc-abs-toggle-active-bg: var(--bm-gold, #d9a441);
    --cc-abs-toggle-active-color: #17302f;
}

/* ==========================================================
 * Press sidebar
 * ========================================================== */

.cc-ajax-search-results[data-cc-abs-profile="bbm_press"] {
    --cc-abs-results-bg: #ffffff;
    --cc-abs-results-color: #21302e;
    --cc-abs-results-border-color: #d7dfdd;
    --cc-abs-results-border-width: 1px;
    --cc-abs-results-radius: 12px;
    --cc-abs-results-padding: 18px 24px;
    --cc-abs-results-shadow: 0 18px 42px rgba(32, 45, 42, 0.18);
    --cc-abs-results-max-height: min(72vh, 620px);
    --cc-abs-heading-color: #21302e;
    --cc-abs-link-color: #21302e;
    --cc-abs-title-color: var(--bm-teal, #02797e);
    --cc-abs-muted-color: #65736f;
    --cc-abs-divider-color: rgba(33, 48, 46, 0.14);
    --cc-abs-thumb-size: 64px;
    --cc-abs-thumb-border-color: rgba(2, 121, 126, 0.28);
    --cc-abs-footer-border-color: rgba(33, 48, 46, 0.14);
    --cc-abs-footer-link-color: #21302e;
}

.cc-ajax-search-results[data-cc-abs-profile="bbm_press"]
.cc-ajax-search-heading {
    margin-bottom: 14px;
}

.cc-ajax-search-results[data-cc-abs-profile="bbm_press"]
.cc-ajax-search-footer {
    margin-top: 10px;
}

/* ==========================================================
 * Header searchbox Divi
 * ========================================================== */

#bm-header-main-menu .et_pb_menu__search-container {
    overflow: visible;
    background: #ffffff;
}

#bm-header-main-menu .et_pb_menu__search {
    display: flex;
    align-items: center;
    gap: 12px;
    width: min(1180px, calc(100% - 40px));
    margin-inline: auto;
}

#bm-header-main-menu
form[data-cc-abs-profile="bbm_header"] {
    flex: 1 1 auto;
    min-width: 0;
    margin: 0;
}

#bm-header-main-menu
form[data-cc-abs-profile="bbm_header"]
.et_pb_menu__search-input {
    box-sizing: border-box;
    width: 100%;
    min-height: 52px;
    margin: 0;
    padding: 0 18px;
    color: #17302f;
    background: rgba(2, 121, 126, 0.035);
    border: 2px solid var(--bm-teal, #02797e);
    border-radius: 12px;
    box-shadow: none;
    font-size: clamp(16px, 1.15vw, 19px);
    line-height: 1.2;
    outline: none;
}

#bm-header-main-menu
form[data-cc-abs-profile="bbm_header"]
.et_pb_menu__search-input::placeholder {
    color: #596c69;
    opacity: 1;
}

#bm-header-main-menu
form[data-cc-abs-profile="bbm_header"]
.et_pb_menu__search-input:focus {
    background: #ffffff;
    border-color: var(--bm-teal, #02797e);
    box-shadow: 0 0 0 4px rgba(2, 121, 126, 0.12);
}

#bm-header-main-menu .et_pb_menu__close-search-button {
    display: inline-grid;
    position: relative;
    inset: auto;
    flex: 0 0 46px;
    place-items: center;
    width: 46px;
    height: 46px;
    margin: 0;
    padding: 0;
    color: var(--bm-teal, #02797e);
    background: transparent;
    border: 1px solid rgba(2, 121, 126, 0.22);
    border-radius: 999px;
    cursor: pointer;
}

/* ==========================================================
 * Header dropdown
 * ========================================================== */

.cc-ajax-search-results[data-cc-abs-profile="bbm_header"] {
    --cc-abs-results-bg: #ffffff;
    --cc-abs-results-color: #17302f;
    --cc-abs-results-border-color: rgba(2, 121, 126, 0.34);
    --cc-abs-results-border-width: 1px;
    --cc-abs-results-radius: 12px;
    --cc-abs-results-padding: 14px 20px;
    --cc-abs-results-shadow: 0 20px 48px rgba(2, 18, 20, 0.2);
    --cc-abs-results-max-height: min(62vh, 540px);
    --cc-abs-heading-color: #17302f;
    --cc-abs-link-color: #17302f;
    --cc-abs-title-color: var(--bm-teal, #02797e);
    --cc-abs-muted-color: #5b6d6a;
    --cc-abs-divider-color: rgba(2, 121, 126, 0.16);
    --cc-abs-footer-border-color: rgba(2, 121, 126, 0.16);
    --cc-abs-footer-link-color: var(--bm-teal, #02797e);
    --cc-abs-results-z-index: 10020;
}

.cc-ajax-search-results[data-cc-abs-profile="bbm_header"]
.cc-ajax-search-heading {
    margin-bottom: 6px;
}

.cc-ajax-search-results[data-cc-abs-profile="bbm_header"]
.cc-ajax-search-item {
    padding-block: 11px !important;
}

.cc-ajax-search-results[data-cc-abs-profile="bbm_header"]
.cc-ajax-search-title {
    font-size: clamp(14px, 1vw, 16px);
    font-weight: 600;
}

.cc-ajax-search-results[data-cc-abs-profile="bbm_header"]
.cc-ajax-search-date {
    margin-top: 4px;
    font-size: 12px;
}

@media (max-width: 767px) {
    #bm-header-main-menu .et_pb_menu__search {
        gap: 8px;
        width: calc(100% - 24px);
    }

    #bm-header-main-menu
    form[data-cc-abs-profile="bbm_header"]
    .et_pb_menu__search-input {
        min-height: 48px;
        padding-inline: 14px;
        font-size: 16px;
    }

    #bm-header-main-menu .et_pb_menu__close-search-button {
        flex-basis: 42px;
        width: 42px;
        height: 42px;
    }

    .cc-ajax-search-results[data-cc-abs-profile="bbm_header"] {
        --cc-abs-results-padding: 12px 14px;
        --cc-abs-results-radius: 10px;
    }
}
CSS;

        wp_add_inline_style(
            MU_CC_ABS_HANDLE,
            $css
        );
    },
    1000
);
