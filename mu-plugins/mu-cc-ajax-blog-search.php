<?php
/**
 * Plugin Name: MU CC Ajax Blog Search
 * Plugin URI:  https://github.com/CodeCornTech/mu-cc-ajax-blog-search
 * Description: Ricerca AJAX multi-contesto e multi-profilo per form WordPress.
 * Version:     1.2.0
 * Requires at least: 6.0
 * Requires PHP: 8.0
 * Author:      CodeCorn™ Technology
 * Author URI:  https://github.com/CodeCornTech
 * License:     MIT
 * License URI: https://opensource.org/license/mit
 * Text Domain: cc-ajax-blog-search
 * Domain Path: /codecorn/ajax-blog-search/languages
 *
 * @package CodeCorn\AjaxBlogSearch
 */

defined('ABSPATH') || exit;

defined('MU_CC_ABS_VERSION')
    || define('MU_CC_ABS_VERSION', '1.2.0');

defined('MU_CC_AJAX_ACTION')
    || define('MU_CC_AJAX_ACTION', 'cc_ajax_blog_search');

defined('MU_CC_ABS_TEXT_DOMAIN')
    || define('MU_CC_ABS_TEXT_DOMAIN', 'cc-ajax-blog-search');

defined('MU_CC_ABS_HANDLE')
    || define('MU_CC_ABS_HANDLE', MU_CC_ABS_TEXT_DOMAIN);

defined('MU_CC_ABS_JS_DEBUG')
    || define('MU_CC_ABS_JS_DEBUG', false);

defined('MU_CC_ABS_PHP_DEBUG')
    || define('MU_CC_ABS_PHP_DEBUG', false);

defined('MU_CC_ABS_BASE_DIR')
    || define(
        'MU_CC_ABS_BASE_DIR',
        __DIR__ . '/codecorn/ajax-blog-search'
    );

defined('MU_CC_ABS_BASE_URL')
    || define(
        'MU_CC_ABS_BASE_URL',
        WPMU_PLUGIN_URL . '/codecorn/ajax-blog-search'
    );

defined('MU_CC_ABS_REL_PATH')
    || define(
        'MU_CC_ABS_REL_PATH',
        'codecorn/ajax-blog-search'
    );

defined('MU_CC_ABS_LANG_REL_PATH')
    || define(
        'MU_CC_ABS_LANG_REL_PATH',
        MU_CC_ABS_REL_PATH . '/languages'
    );

/**
 * Registra il logger condiviso richiesto dai moduli frontend ABS.
 */
add_action(
    'wp_enqueue_scripts',
    static function (): void {
        wp_register_script(
            'cc-logger-core-pre',
            WPMU_PLUGIN_URL . '/codecorn/core/js/cc-logger-core-pre.js',
            [],
            '0.1.0',
            false
        );

        wp_add_inline_script(
            'cc-logger-core-pre',
            'window.CC_LC = Object.assign(window.CC_LC || {}, '
                . wp_json_encode(
                    [
                        'DEBUG' => (bool) MU_CC_ABS_JS_DEBUG,
                        'LOGLEVEL' => MU_CC_ABS_JS_DEBUG
                            ? 'DEBUG'
                            : 'ERROR',
                    ]
                )
                . ');',
            'before'
        );
    },
    0
);

/**
 * Carica le traduzioni dal modulo interno del MU plugin.
 */
add_action(
    'plugins_loaded',
    static function (): void {
        load_muplugin_textdomain(
            MU_CC_ABS_TEXT_DOMAIN,
            MU_CC_ABS_LANG_REL_PATH
        );
    },
    0
);

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
        'js_debug' => MU_CC_ABS_JS_DEBUG,
    ]
);
