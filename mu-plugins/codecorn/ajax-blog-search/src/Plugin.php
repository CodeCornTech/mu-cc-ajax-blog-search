<?php

/**
 * Core del MU plugin CC Ajax Blog Search
 */

namespace CodeCorn\AjaxBlogSearch;

use WP_Query;

defined('ABSPATH') || exit;


class Plugin
{

    protected static $instance = null;

    protected $base_dir;

    protected $base_url;

    const string VERSION = '1.0.0';

    const string HANDLE = 'cc-ajax-blog-search';

    public static function boot($base_dir, $base_url)
    {

        if (null === static::$instance) {
            static::$instance = new static($base_dir, $base_url);
        }

        return static::$instance;
    }

    protected function __construct($base_dir, $base_url)
    {

        $this->base_dir = rtrim($base_dir, '/\\');
        $this->base_url = rtrim($base_url, '/\\');

        $this->register_hooks();
    }

    protected function register_hooks()
    {

        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));

        add_action('wp_ajax_cc_ajax_blog_search', array($this, 'handle_ajax_search'));
        add_action('wp_ajax_nopriv_cc_ajax_blog_search', array($this, 'handle_ajax_search'));
    }

    public function enqueue_assets()
    {

        if (is_admin()) {
            return;
        }

        $script_url = $this->base_url . '/assets/js/ajax-blog-search.js';

        wp_enqueue_script(
            static::HANDLE,
            $script_url,
            array('jquery'),
            static::VERSION,
            true
        );

        $style_path = $this->base_dir . '/assets/css/ajax-blog-search.css';

        if (file_exists($style_path)) {

            $style_url = $this->base_url . '/assets/css/ajax-blog-search.css';

            wp_enqueue_style(
                static::HANDLE,
                $style_url,
                array(),
                static::VERSION
            );
        }

        wp_localize_script(
            static::HANDLE,
            'CC_Ajax_Blog_Search',
            array(
                'ajax_url'        => admin_url('admin-ajax.php'),
                'nonce'           => wp_create_nonce('cc_ajax_blog_search'),
                'no_results_text' => __('Nessun articolo trovato .', 'mu-cc-ajax-blog-search'),
                'error_text'      => __('Si è verificato un errore , riprova più tardi .', 'mu-cc-ajax-blog-search'),
            )
        );
    }

    public function handle_ajax_search()
    {

        check_ajax_referer('cc_ajax_blog_search', 'nonce');

        $term = isset($_REQUEST['s'])
            ? sanitize_text_field(wp_unslash($_REQUEST['s']))
            : '';

        if ('' === $term) {
            wp_send_json_success(
                array(
                    'results' => array(),
                )
            );
        }

        $args = array(
            'post_type'           => 'post',
            's'                   => $term,
            'posts_per_page'      => 5,
            'post_status'         => 'publish',
            'ignore_sticky_posts' => true,
        );

        $query   = new WP_Query($args);
        $results = array();

        if ($query->have_posts()) {

            while ($query->have_posts()) {

                $query->the_post();

                $results[] = array(
                    'title'   => get_the_title(),
                    'url'     => get_permalink(),
                    'date'    => get_the_date(),
                    'excerpt' => wp_trim_words(get_the_excerpt(), 18, '…'),
                );
            }

            wp_reset_postdata();
        }

        wp_send_json_success(
            array(
                'results' => $results,
            )
        );
    }
}
