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
 * Domain Path: /languages
 *
 * @package CodeCorn\AjaxBlogSearch
 */

defined('ABSPATH') || exit;

/**
 * ------------------------------------------------------------
 * Global constants
 * ------------------------------------------------------------
 */
defined('MU_CC_ABS_VERSION') || define('MU_CC_ABS_VERSION', '1.0.15');
defined('MU_CC_ABS_TEXT_DOMAIN') || define('MU_CC_ABS_TEXT_DOMAIN', 'cc-ajax-blog-search');
defined('MU_CC_ABS_HANDLE') || define('MU_CC_ABS_HANDLE', MU_CC_ABS_TEXT_DOMAIN);

/** Absolute paths */
defined('MU_CC_ABS_BASE_DIR') || define('MU_CC_ABS_BASE_DIR', __DIR__ . '/codecorn/ajax-blog-search');
defined('MU_CC_ABS_BASE_URL') || define('MU_CC_ABS_BASE_URL', WPMU_PLUGIN_URL . '/codecorn/ajax-blog-search');

/** Relative paths ( for MU plugins APIs ) */
defined('MU_CC_ABS_REL_PATH') || define('MU_CC_ABS_REL_PATH', 'codecorn/ajax-blog-search');
defined('MU_CC_ABS_LANG_REL_PATH') || define('MU_CC_ABS_LANG_REL_PATH', MU_CC_ABS_REL_PATH . '/languages');

/**
 * ------------------------------------------------------------
 * Load translations ( MU plugin safe )
 * ------------------------------------------------------------
 */
add_action('init', static function () {
    load_muplugin_textdomain(
        MU_CC_ABS_TEXT_DOMAIN,
        MU_CC_ABS_LANG_REL_PATH
    );
});

/**
 * ------------------------------------------------------------
 * Bootstrap plugin
 * ------------------------------------------------------------
 */
require_once MU_CC_ABS_BASE_DIR . '/src/Plugin.php';

CodeCorn\AjaxBlogSearch\Plugin::boot(
    [
        'version' => MU_CC_ABS_VERSION,
        'text_domain' => MU_CC_ABS_TEXT_DOMAIN,
        'handle' => MU_CC_ABS_HANDLE,
        'base_dir' => MU_CC_ABS_BASE_DIR,
        'base_url' => MU_CC_ABS_BASE_URL,
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
add_filter('cc_ajax_blog_search_sidebar_toggle_enabled', '__return_true');
add_filter('cc_ajax_blog_search_sidebar_toggle_mode', fn() => 'floating'); // oppure 'top'
add_filter('cc_ajax_blog_search_debug', '__return_true'); # o commenta per disabilitare


// 🧪 Test di verifica rapida ( se vuoi )
// Aggiungi temporaneamente:
add_action('init', function () {
    if (is_textdomain_loaded('cc-ajax-blog-search')) {
        error_log('✅ cc-ajax-blog-search textdomain LOADED');
    } else {
        error_log('❌ cc-ajax-blog-search textdomain NOT loaded');
    }
}, 999);
