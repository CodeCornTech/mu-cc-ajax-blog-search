<?php
/**
 * Plugin Name: MU CC Ajax Blog Search
 * Plugin URI:  https://github.com/CodeCornTech/mu-cc-ajax-blog-search
 * Description: Attiva la ricerca AJAX nei widget di ricerca del blog con namespace CodeCorn .
 * Version:     1.0.15
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author:      CodeCorn™ Technology
 * Author URI:  https://github.com/CodeCornTech
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: cc-ajax-blog-search
 * Domain Path: /codecorn/ajax-blog-search/languages
 *
 * @package CodeCorn\AjaxBlogSearch
 */

defined('ABSPATH') || exit;

/**
 * ------------------------------------------------------------
 * Global constants
 * ------------------------------------------------------------
 */
defined('MU_CC_ABS_JS_DEBUG') || define('MU_CC_ABS_JS_DEBUG', true); /**  add_filter('cc_ajax_blog_search_js_debug', '__return_true'); */
defined('MU_CC_ABS_PHP_DEBUG') || define('MU_CC_ABS_PHP_DEBUG', false); /**  add_filter('cc_ajax_blog_search_php_debug', '__return_true'); */
defined('MU_CC_ABS_I18N_DEBUG') || define('MU_CC_ABS_I18N_DEBUG', false);  /** Oppure via filtro: add_filter('cc_abs_i18n_debug', '__return_true'); */
defined('MU_CC_ABS_VERSION') || define('MU_CC_ABS_VERSION', '1.0.15');
defined('MU_CC_AJAX_ACTION') || define('MU_CC_AJAX_ACTION', 'cc_ajax_blog_search'); # look _ and -
defined('MU_CC_ABS_TEXT_DOMAIN') || define('MU_CC_ABS_TEXT_DOMAIN', 'cc-ajax-blog-search'); # look _ and -

defined('MU_CC_ABS_HANDLE') || define('MU_CC_ABS_HANDLE', MU_CC_ABS_TEXT_DOMAIN);

/** Absolute paths */
defined('MU_CC_ABS_BASE_DIR') || define('MU_CC_ABS_BASE_DIR', __DIR__ . '/codecorn/ajax-blog-search');
defined('MU_CC_ABS_BASE_URL') || define('MU_CC_ABS_BASE_URL', WPMU_PLUGIN_URL . '/codecorn/ajax-blog-search');

/** Relative paths ( for MU plugins APIs ) */
defined('MU_CC_ABS_REL_PATH') || define('MU_CC_ABS_REL_PATH', 'codecorn/ajax-blog-search');
defined('MU_CC_ABS_LANG_REL_PATH') || define('MU_CC_ABS_LANG_REL_PATH', MU_CC_ABS_REL_PATH . '/languages');

/**
 * Register CodeCorn™ Logger Core (HEAD).
 *
 * The logger core is global infrastructure and must be registered
 * at MU entrypoint level, not inside plugin classes.
 *
 * - Always available
 * - Loaded in HEAD
 * - Declared as a dependency by all MU plugins
 *
 * @since 0.1.0
 */
add_action('wp_enqueue_scripts', function () {
    wp_register_script(
        'cc-logger-core-pre',
        WPMU_PLUGIN_URL . '/codecorn/core/js/cc-logger-core-pre.js',
        [],
        '0.1.0',
        false // Load in HEAD
    );
    // 2️⃣ inizializza configurazione GLOBALE (prima del file)
    wp_add_inline_script(
        'cc-logger-core-pre',
        'window.CC_LC = window.CC_LC || {};
         window.CC_LC.DEBUG = ' . (MU_CC_ABS_JS_DEBUG ? 'true' : 'false') . ';
         window.CC_LC.LOGLEVEL = ' . (MU_CC_ABS_JS_DEBUG ? "'DEBUG'" : "'ERROR'") . ';',
        'before'
    );
}, 0);


/**
 * ------------------------------------------------------------
 * i18n Debug Helper ( optional )
 * ------------------------------------------------------------
 *  🧪 Test di verifica rapida ( se vuoi )
 * Serve SOLO a verificare che:
 * - il textdomain venga caricato
 * - il file .mo venga trovato
 *
 * NON modifica traduzioni
 * NON forza fallback
 * NON influenza il runtime
 *
 * Abilitazione consigliata:
 * define('MU_CC_ABS_I18N_DEBUG', true);
 *
 * Oppure via filtro:
 * add_filter('cc_abs_i18n_debug', '__return_true');
 */
if (!function_exists('cc_abs_i18n_debug_enabled')) {
    function cc_abs_i18n_debug_enabled(): bool
    {
        $enabled = defined('MU_CC_ABS_I18N_DEBUG')
            ? (bool) MU_CC_ABS_I18N_DEBUG
            : false;

        return (bool) apply_filters('cc_abs_i18n_debug', $enabled);
    }
}

if (!function_exists('cc_abs_i18n_debug_probe')) {
    /**
     * Probe di verifica traduzioni.
     *
     * Nota:
     * WordPress restituisce la stringa originale
     * se la traduzione non esiste.
     */
    function cc_abs_i18n_debug_probe(): void
    {
        if (!cc_abs_i18n_debug_enabled()) {
            return;
        }

        $original = 'Filtri & ricerca';
        $translated = __($original, MU_CC_ABS_TEXT_DOMAIN);

        error_log(sprintf(
            "[CC ABS][i18n] domain=%s | rel=%s | %s | '%s' => '%s'",
            MU_CC_ABS_TEXT_DOMAIN,
            MU_CC_ABS_LANG_REL_PATH,
            ($translated !== $original) ? '✅ loaded' : '⚠️ not translated',
            $original,
            $translated
        ));
    }
}
/**
 * ------------------------------------------------------------
 * Load translations ( MU plugin safe )
 * ------------------------------------------------------------
 *
 * Note:
 * - `load_muplugin_textdomain()` carica da wp-content/mu-plugins
 * - MU_CC_ABS_LANG_REL_PATH deve essere relativo ( es: 'codecorn-ajax-blog-search/languages' )
 */
add_action('plugins_loaded', function () {

    load_muplugin_textdomain(
        MU_CC_ABS_TEXT_DOMAIN,
        MU_CC_ABS_LANG_REL_PATH
    );

    // Optional debug probe ( controllato da costante/filtro )
    if (function_exists('cc_abs_i18n_debug_probe')) {
        cc_abs_i18n_debug_probe();
    }

}, 0);
/**
 * ------------------------------------------------------------
 * Bootstrap plugin
 * ------------------------------------------------------------
 */
require_once MU_CC_ABS_BASE_DIR . '/src/Plugin.php';

CodeCorn\AjaxBlogSearch\Plugin::boot(
    [
        'version' => MU_CC_ABS_VERSION,
        'ajax_action' => MU_CC_AJAX_ACTION,
        'text_domain' => MU_CC_ABS_TEXT_DOMAIN,
        'handle' => MU_CC_ABS_HANDLE,
        'base_dir' => MU_CC_ABS_BASE_DIR,
        'base_url' => MU_CC_ABS_BASE_URL,
        'php_debug' => MU_CC_ABS_PHP_DEBUG,
        'js_debug' => MU_CC_ABS_JS_DEBUG
    ]
);

// add_filter(
//     'cc_ajax_blog_search_selectors',
//     function (array $selectors, array $contexts, string $scope) {

//         /**
//          * Mappa regole custom:
//          * chiave = scope:context
//          * valore = selettori CSS da usare
//          */
//         $custom_map = [
//             'single:page'     => ['.single-page-test'],
//             'archive:post'    => ['.post-test'],
//             'archive:product' => ['.woocommerce-test'],
//             'global:*'        => ['.global-test'],
//         ];

//         foreach ($custom_map as $key => $value) {

//             // Split "scope:context"
//             [$rule_scope, $rule_ctx] = explode(':', $key);

//             // Controllo scope ( single | archive | global )
//             if ($rule_scope !== '*' && $rule_scope !== $scope) {
//                 continue;
//             }

//             // Controllo contesto ( post type )
//             if ($rule_ctx !== '*' && !in_array($rule_ctx, $contexts, true)) {
//                 continue;
//             }

//             /**
//              * MATCH TROVATO
//              * → override totale
//              * → nessun merge
//              */
//             return [
//                 '__mode'    => 'override',
//                 'selectors' => $value,
//             ];
//         }

//         /**
//          * NESSUNA REGOLA MATCHATA
//          * → disabilita completamente l’AJAX
//          * ( scelta voluta e dichiarata )
//          */
//         return [
//             '__mode' => 'disable',
//         ];
//     },
//     999,
//     3
// );