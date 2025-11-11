<?php

/**
 * Plugin Name: MU CC Ajax Blog Search
 * Description: Attiva la ricerca AJAX nei widget di ricerca del blog con namespace CodeCorn .
 * Author: CodeCorn™ Technology
 * Version: 1.0.14
 * Author URI: https://github.com/CodeCornTech
 * Plugin URI: https://github.com/CodeCornTech/mu-cc-ajax-blog-search
 */

defined('ABSPATH') ||
    exit;


define('MU_CC_ABS_BASE_DIR', __DIR__ . '/codecorn/ajax-blog-search');
define('MU_CC_ABS_BASE_URL', WPMU_PLUGIN_URL . '/codecorn/ajax-blog-search');

require_once MU_CC_ABS_BASE_DIR . '/src/Plugin.php';

CodeCorn\AjaxBlogSearch\Plugin::boot(
    MU_CC_ABS_BASE_DIR,
    MU_CC_ABS_BASE_URL
);
//👉 Per attivare i thumb ti basta , da tema / altro mu-plugin:
add_filter( 'cc_ajax_blog_search_show_thumbnail', '__return_true' );
add_filter( 'cc_ajax_blog_search_sidebar_toggle_enabled', '__return_true' );
add_filter( 'cc_ajax_blog_search_sidebar_toggle_mode', fn () => 'floating'); // oppure 'top'
#add_filter('cc_ajax_blog_search_debug', '__return_true'); # o commenta per disabilitare