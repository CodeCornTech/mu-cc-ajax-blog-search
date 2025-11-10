#!/usr/bin/env bash

# Scaffold per MU plugin :
# mu-cc-ajax-blog-search
# Struttura :
# wp-content / mu-plugins /
#   mu-cc-ajax-blog-search.php
#   codecorn / ajax-blog-search / ...

set -euo pipefail

WP_CONTENT_DIR="${1:-wp-content}"

MU_PLUGINS_DIR="${WP_CONTENT_DIR}/mu-plugins"
MODULE_DIR="${MU_PLUGINS_DIR}/codecorn/ajax-blog-search"
SRC_DIR="${MODULE_DIR}/src"
ASSETS_JS_DIR="${MODULE_DIR}/assets/js"
ASSETS_CSS_DIR="${MODULE_DIR}/assets/css"

echo "➡️  Using wp-content dir : ${WP_CONTENT_DIR}"

mkdir -p "${MU_PLUGINS_DIR}"
mkdir -p "${SRC_DIR}"
mkdir -p "${ASSETS_JS_DIR}"
mkdir -p "${ASSETS_CSS_DIR}"

BOOTSTRAP_FILE="${MU_PLUGINS_DIR}/mu-cc-ajax-blog-search.php"
INDEX_FILE="${MODULE_DIR}/index.php"
PLUGIN_FILE="${SRC_DIR}/Plugin.php"
JS_FILE="${ASSETS_JS_DIR}/ajax-blog-search.js"
CSS_FILE="${ASSETS_CSS_DIR}/ajax-blog-search.css"

if [[ ! -f "${BOOTSTRAP_FILE}" ]]; then
  cat > "${BOOTSTRAP_FILE}" << 'PHP'
<?php
/**
 * Plugin Name: MU CC Ajax Blog Search
 * Description: Attiva la ricerca AJAX nei widget di ricerca del blog con namespace CodeCorn .
 * Author: CodeCorn™ Technology
 * Version: 1.0.0
 * Author URI: https://github.com/CodeCornTech
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'MU_CC_ABS_BASE_DIR', __DIR__ . '/codecorn/ajax-blog-search' );
define( 'MU_CC_ABS_BASE_URL', WPMU_PLUGIN_URL . '/codecorn/ajax-blog-search' );

require_once MU_CC_ABS_BASE_DIR . '/src/Plugin.php';

CodeCorn\AjaxBlogSearch\Plugin::boot(
    MU_CC_ABS_BASE_DIR,
    MU_CC_ABS_BASE_URL
);
PHP
  echo "✅ Created bootstrap : ${BOOTSTRAP_FILE}"
else
  echo "ℹ️  Bootstrap already exists : ${BOOTSTRAP_FILE}"
fi

if [[ ! -f "${INDEX_FILE}" ]]; then
  cat > "${INDEX_FILE}" << 'PHP'
<?php
/**
 * Silence is golden .
 */
PHP
  echo "✅ Created index : ${INDEX_FILE}"
else
  echo "ℹ️  Index already exists : ${INDEX_FILE}"
fi

if [[ ! -f "${PLUGIN_FILE}" ]]; then
  cat > "${PLUGIN_FILE}" << 'PHP'
<?php
/**
 * Core del MU plugin CC Ajax Blog Search
 */

namespace CodeCorn\AjaxBlogSearch;

use WP_Query;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Plugin {

    protected static $instance = null;

    protected $base_dir;

    protected $base_url;

    const VERSION = '1.0.0';

    const HANDLE = 'cc-ajax-blog-search';

    public static function boot( $base_dir , $base_url ) {

        if ( null === static::$instance ) {
            static::$instance = new static( $base_dir , $base_url );
        }

        return static::$instance;
    }

    protected function __construct( $base_dir , $base_url ) {

        $this->base_dir = rtrim( $base_dir , '/\\' );
        $this->base_url = rtrim( $base_url , '/\\' );

        $this->register_hooks();
    }

    protected function register_hooks() {

        \add_action( 'wp_enqueue_scripts' , array( $this , 'enqueue_assets' ) );

        \add_action( 'wp_ajax_cc_ajax_blog_search' , array( $this , 'handle_ajax_search' ) );
        \add_action( 'wp_ajax_nopriv_cc_ajax_blog_search' , array( $this , 'handle_ajax_search' ) );
    }

    public function enqueue_assets() {

        if ( \is_admin() ) {
            return;
        }

        $script_url = $this->base_url . '/assets/js/ajax-blog-search.js';

        \wp_enqueue_script(
            static::HANDLE,
            $script_url,
            array( 'jquery' ),
            static::VERSION,
            true
        );

        $style_path = $this->base_dir . '/assets/css/ajax-blog-search.css';

        if ( \file_exists( $style_path ) ) {

            $style_url = $this->base_url . '/assets/css/ajax-blog-search.css';

            \wp_enqueue_style(
                static::HANDLE,
                $style_url,
                array(),
                static::VERSION
            );
        }

        \wp_localize_script(
            static::HANDLE,
            'CC_Ajax_Blog_Search',
            array(
                'ajax_url'        => \admin_url( 'admin-ajax.php' ),
                'nonce'           => \wp_create_nonce( 'cc_ajax_blog_search' ),
                'no_results_text' => \__( 'Nessun articolo trovato .' , 'mu-cc-ajax-blog-search' ),
                'error_text'      => \__( 'Si è verificato un errore , riprova più tardi .' , 'mu-cc-ajax-blog-search' ),
            )
        );
    }

    public function handle_ajax_search() {

        \check_ajax_referer( 'cc_ajax_blog_search' , 'nonce' );

        $term = isset( $_REQUEST['s'] )
            ? \sanitize_text_field( \wp_unslash( $_REQUEST['s'] ) )
            : '';

        if ( '' === $term ) {
            \wp_send_json_success(
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

        $query   = new WP_Query( $args );
        $results = array();

        if ( $query->have_posts() ) {

            while ( $query->have_posts() ) {

                $query->the_post();

                $results[] = array(
                    'title'   => \get_the_title(),
                    'url'     => \get_permalink(),
                    'date'    => \get_the_date(),
                    'excerpt' => \wp_trim_words( \get_the_excerpt(), 18 , '…' ),
                );
            }

            \wp_reset_postdata();
        }

        \wp_send_json_success(
            array(
                'results' => $results,
            )
        );
    }
}
PHP
  echo "✅ Created plugin core : ${PLUGIN_FILE}"
else
  echo "ℹ️  Plugin core already exists : ${PLUGIN_FILE}"
fi

if [[ ! -f "${JS_FILE}" ]]; then
  cat > "${JS_FILE}" << 'JS'
/* CC Ajax Blog Search
 * Aggancia i widget .widget_search e trasforma il submit in una chiamata AJAX
 */
jQuery(function ($) {

  function debounce(fn, delay) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  function initAjaxSearch() {

    $('.widget_search form.search-form').each(function () {
      var $form = $(this);

      if ($form.data('ccAjaxSearchInited')) {
        return;
      }
      $form.data('ccAjaxSearchInited', true);

      var $input = $form.find('input.search-field');
      if (!$input.length) {
        return;
      }

      var $resultsBox = $('<div class="cc-ajax-search-results" aria-live="polite"></div>');
      $resultsBox.insertAfter($form);

      function renderResults(items, term) {
        if (!items || !items.length) {
          $resultsBox.html(
            '<div class="cc-ajax-search-empty">' +
              (CC_Ajax_Blog_Search.no_results_text || 'Nessun articolo trovato .') +
            '</div>'
          );
          return;
        }

        var html = '<div class="cc-ajax-search-heading">Risultati per "<strong>' +
          $('<div>').text(term).html() + '</strong>"</div>';
        html += '<ul class="cc-ajax-search-list">';

        items.forEach(function (item) {
          html += '<li class="cc-ajax-search-item">';
          html +=   '<a href="' + item.url + '">';
          html +=     '<span class="cc-ajax-search-title">' + item.title + '</span>';
          if (item.date) {
            html +=   '<span class="cc-ajax-search-date">' + item.date + '</span>';
          }
          if (item.excerpt) {
            html +=   '<span class="cc-ajax-search-excerpt">' + item.excerpt + '</span>';
          }
          html +=   '</a>';
          html += '</li>';
        });

        html += '</ul>';
        $resultsBox.html(html);
      }

      function renderError() {
        $resultsBox.html(
          '<div class="cc-ajax-search-error">' +
            (CC_Ajax_Blog_Search.error_text || 'Errore nella ricerca .') +
          '</div>'
        );
      }

      var doSearch = debounce(function () {
        var term = $input.val().trim();
        if (!term) {
          $resultsBox.empty();
          return;
        }

        $.ajax({
          url: CC_Ajax_Blog_Search.ajax_url,
          method: 'GET',
          dataType: 'json',
          data: {
            action: 'cc_ajax_blog_search',
            nonce: CC_Ajax_Blog_Search.nonce,
            s: term
          }
        })
          .done(function (resp) {
            if (resp && resp.success) {
              renderResults(resp.data.results || [], term);
            } else {
              renderError();
            }
          })
          .fail(function () {
            renderError();
          });

      }, 300);

      $form.on('submit', function (e) {
        e.preventDefault();
        doSearch();
      });

      $input.on('keyup', function (e) {
        if (e.key === 'Enter') {
          return;
        }
        doSearch();
      });
    });
  }

  initAjaxSearch();
});
JS
  echo "✅ Created JS : ${JS_FILE}"
else
  echo "ℹ️  JS already exists : ${JS_FILE}"
fi

if [[ ! -f "${CSS_FILE}" ]]; then
  cat > "${CSS_FILE}" << 'CSS'
.sidebar .cc-ajax-search-results {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 6px;
  font-size: 14px;
}

.sidebar .cc-ajax-search-heading {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.sidebar .cc-ajax-search-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sidebar .cc-ajax-search-item + .cc-ajax-search-item {
  margin-top: 0.5rem;
}

.sidebar .cc-ajax-search-item a {
  display: block;
  text-decoration: none;
}

.sidebar .cc-ajax-search-title {
  display: block;
  font-weight: 500;
}

.sidebar .cc-ajax-search-date {
  display: block;
  opacity: 0.8;
  font-size: 12px;
}

.sidebar .cc-ajax-search-excerpt {
  display: block;
  font-size: 12px;
  opacity: 0.8;
}

.sidebar .cc-ajax-search-empty,
.sidebar .cc-ajax-search-error {
  font-size: 13px;
  opacity: 0.9;
}
CSS
  echo "✅ Created CSS : ${CSS_FILE}"
else
  echo "ℹ️  CSS already exists : ${CSS_FILE}"
fi

echo "🎉 Scaffold mu-cc-ajax-blog-search completato ."
