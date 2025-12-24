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
defined('MU_CC_ABS_DEBUG') || define('MU_CC_ABS_DEBUG', true);
defined('MU_CC_ABS_VERSION') || define('MU_CC_ABS_VERSION', '1.0.15');
defined('MU_CC_AJAX_ACTION') || define('MU_CC_AJAX_ACTION', 'cc_ajax_blog_search');
defined('MU_CC_ABS_TEXT_DOMAIN') || define('MU_CC_ABS_TEXT_DOMAIN', 'cc-ajax-blog-search');

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
         window.CC_LC.DEBUG = ' . (MU_CC_ABS_DEBUG ? 'true' : 'false') . ';
         window.CC_LC.LOGLEVEL = ' . (MU_CC_ABS_DEBUG ? "'DEBUG'" : "'ERROR'") . ';',
        'before'
    );
}, 0);

/**
 * ------------------------------------------------------------
 * Load translations ( MU plugin safe )
 * ------------------------------------------------------------
 */
add_action('plugins_loaded', function () {

    load_muplugin_textdomain(
        MU_CC_ABS_TEXT_DOMAIN,
        MU_CC_ABS_LANG_REL_PATH
    );


    // // 🧪 Test di verifica rapida ( se vuoi )
    // // Aggiungi temporaneamente:
    // $test = __('Filtri & ricerca', MU_CC_ABS_TEXT_DOMAIN);
    // if ($test !== 'Filtri & ricerca') {
    //     error_log("'Filtri & ricerca' => $test - ✅ textdomain FUNZIONANTE");
    // } else {
    //     error_log("'Filtri & ricerca' => $test - ❌ traduzione NON risolta");
    // }

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
        'debug' => MU_CC_ABS_DEBUG
    ]
);
/**
 * ------------------------------------------------------------
 * 👉 TIPS: Per attivare i thumb ti basta , da tema / altro mu-plugin:
 * 
 * Optional defaults ( override via filters elsewhere )
 * ------------------------------------------------------------
 */
add_filter('cc_ajax_blog_search_show_thumbnail', '__return_true');
add_filter('cc_ajax_blog_search_sidebar_toggle_mode', fn() => 'floating'); // oppure 'top'
add_filter('cc_ajax_blog_search_debug', '__return_true'); # o commenta per disabilitare

add_filter('cc_ajax_blog_search_sidebar_toggle_enabled', '__return_true'); # OVUNQUE

# CIRCOSCRIVE LA SIDEBAR TOGGLED A DETERMINATI CONTESTI ATTENZIONE A COME SI USA
#add_filter('cc_ajax_blog_search_sidebar_toggle_enabled', fn($enabled) => is_post_type_archive('product')); 




