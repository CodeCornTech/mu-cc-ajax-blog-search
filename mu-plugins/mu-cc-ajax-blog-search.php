<?php

/**
 * Plugin Name: MU CC Ajax Blog Search
 * Description: Attiva la ricerca AJAX nei widget di ricerca del blog con namespace CodeCorn .
 * Author: CodeCorn™ Technology
 * Version: 1.0.0
 * Author URI: https://github.com/CodeCornTech
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
