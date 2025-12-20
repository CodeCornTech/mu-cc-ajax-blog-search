<?php
/**
 * Core del MU plugin CC Ajax Blog Search.
 *
 * Gestisce:
 * - bootstrap singleton del plugin
 * - enqueue di asset frontend
 * - localizzazione JS
 * - handler AJAX per la ricerca
 *
 * @package CodeCorn\AjaxBlogSearch
 */

namespace CodeCorn\AjaxBlogSearch;

\defined('ABSPATH') || exit;

use WP_Query;

/**
 * Main plugin class.
 *
 * Implementata come Singleton:
 * - una sola istanza per richiesta
 * - bootstrap tramite ::boot()
 *
 * @final
 */
final class Plugin
{
    /**
     * Singleton instance.
     *
     * @var self|null
     */
    protected static ?self $instance = null;

    /**
     * Plugin version.
     *
     * @var string
     */
    protected string $version;

    /**
     * Text domain for translations.
     *
     * @var string
     */
    protected string $text_domain;

    /**
     * Script / style handle.
     *
     * @var string
     */
    protected string $handle;

    /**
     * Absolute base directory path.
     *
     * @var string
     */
    protected string $base_dir;

    /**
     * Base URL for assets.
     *
     * @var string
     */
    protected string $base_url;

    /**
     * Allowed post types.
     *
     * Elenco dei post type sui quali il plugin è autorizzato
     * a operare ( ricerca AJAX , rilevamento contesto , filtri ).
     *
     * Usato come whitelist di sicurezza e come base
     * per il rilevamento automatico del contesto di ricerca.
     *
     * @var string[]
     */
    private array $allowed_cpt = [
        'post',
        'page',
        'product',
        'portfolio',
        'case_study',
        'video',
    ];

    /**
     * Search context selectors map.
     *
     * Mappa che associa un contesto ( CPT o globale )
     * ai selettori CSS dei form di ricerca da intercettare.
     *
     * La chiave rappresenta:
     * - uno specifico post type
     * - oppure il contesto "global" come fallback
     *
     * I selettori vengono passati al frontend per
     * collegare la ricerca AJAX ai form esistenti.
     *
     * @var array<string, string[]>
     */
    private array $search_context_map = [
        'post' => [
            '#horseno_search_widget-1.search-form', // @todo rimuovere hardcode tema
        ],
        'product' => [
            '.woocommerce-product-search',
        ],
        'portfolio' => [
            '#portfolio-search .search-form',
        ],
        'global' => [
            '.search-form', // fallback globale
        ],
    ];

    /**
     * Bootstrap the plugin instance.
     *
     * @param array{
     *     version:string,
     *     text_domain:string,
     *     handle:string,
     *     base_dir:string,
     *     base_url:string
     * } $config Plugin configuration array.
     *
     * @return self
     */
    public static function boot(array $config): self
    {
        if (null === self::$instance) {
            self::$instance = new self($config);
        }

        return self::$instance;
    }

    /**
     * Plugin constructor.
     *
     * @param array{
     *     version:string,
     *     text_domain:string,
     *     handle:string,
     *     base_dir:string,
     *     base_url:string
     * } $config Plugin configuration.
     */
    protected function __construct(array $config)
    {
        $this->version = $config['version'];
        $this->text_domain = $config['text_domain'];
        $this->handle = $config['handle'];
        $this->base_dir = rtrim($config['base_dir'], '/\\');
        $this->base_url = rtrim($config['base_url'], '/\\');

        $this->register_hooks();
    }

    /**
     * Register WordPress hooks.
     *
     * @return void
     */
    protected function register_hooks(): void
    {
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('wp_ajax_cc_ajax_blog_search', [$this, 'handle_ajax_search']);
        add_action('wp_ajax_nopriv_cc_ajax_blog_search', [$this, 'handle_ajax_search']);
    }

    /**
     * Detect current search context.
     *
     * Determina dinamicamente il contesto di ricerca corrente
     * in base allo stato della query WordPress:
     *
     * - globale ( default )
     * - singolo contenuto ( is_singular )
     * - archivio di post type ( is_post_type_archive )
     *
     * Il contesto restituito include:
     * - scope        → tipo di contesto ( global | single | archive )
     * - post_type    → post type coinvolti
     * - selectors    → selettori CSS dei form da intercettare
     *
     * @return array{
     *     scope: string,
     *     post_type: string[],
     *     selectors: string[]
     * }
     */
    private function detect_search_context(): array
    {
        // default = globale
        $context = [
            'scope' => 'global',
            'post_type' => $this->allowed_cpt,
            'selectors' => $this->search_context_map['global'],
        ];

        // singolo CPT
        if (is_singular()) {
            $pt = get_post_type();
            if (\in_array($pt, $this->allowed_cpt, true)) {
                $context['scope'] = 'single';
                $context['post_type'] = [$pt];
                $context['selectors'] = $this->search_context_map[$pt] ?? [];
            }
        }

        // archivio CPT
        if (is_post_type_archive()) {
            $pt = get_query_var('post_type');
            if (\is_string($pt) && \in_array($pt, $this->allowed_cpt, true)) {
                $context['scope'] = 'archive';
                $context['post_type'] = [$pt];
                $context['selectors'] = $this->search_context_map[$pt] ?? [];
            }
        }

        return $context;
    }

    /**
     * Enqueue frontend assets and localize configuration.
     *
     * - Script JS principale
     * - CSS opzionale se presente
     * - Oggetto JS con config e testi localizzati
     *
     * @return void
     */
    public function enqueue_assets()
    {

        if (is_admin()) {
            return;
        }

        $script_url = "{$this->base_url}/assets/js/ajax-blog-search.js";

        wp_enqueue_script(
            $this->handle,
            $script_url,
            ['jquery'],
            $this->version,
            true
        );

        $style_path = "{$this->base_dir}/assets/css/ajax-blog-search.css";

        if (file_exists($style_path)) {

            $style_url = "{$this->base_url}/assets/css/ajax-blog-search.css";

            wp_enqueue_style(
                $this->handle,
                $style_url,
                [],
                $this->version
            );
        }

        /**
         * Debug flag.
         *
         * Ordine di precedenza:
         * 1. costante CC_AJAX_BLOG_SEARCH_DEBUG
         * 2. filtro cc_ajax_blog_search_debug
         */
        $debug = \defined('CC_AJAX_BLOG_SEARCH_DEBUG') ? (bool) CC_AJAX_BLOG_SEARCH_DEBUG : false;
        $debug = (bool) apply_filters('cc_ajax_blog_search_debug', $debug);

        // Determina il contesto di ricerca
        $context = $this->detect_search_context();

        wp_localize_script(
            $this->handle,
            'CC_Ajax_Blog_Search',
            [
                'ajax_url' => admin_url('admin-ajax.php'),
                'action' => $this->handle,
                'nonce' => wp_create_nonce($this->handle),
                'no_results_text' => __('Nessun articolo trovato.', 'cc-ajax-blog-search'),
                'error_text' => __('Si è verificato un errore , riprova più tardi.', 'cc-ajax-blog-search'),
                'show_thumb' => (bool) apply_filters('cc_ajax_blog_search_show_thumbnail', false),
                // 🔍 DEBUG
                'debug' => $debug,
                // CONTESTO
                'context' => $context,
                // ⚙️ Config sidebar mobile toggle
                'sidebar_toggle' => [
                    // di default disattivato, lo accendi via filter
                    'enabled' => (bool) apply_filters('cc_ajax_blog_search_sidebar_toggle_enabled', false),
                    // 'floating' | 'top'
                    'mode' => apply_filters('cc_ajax_blog_search_sidebar_toggle_mode', 'floating'),
                    // breakpoint mobile (px)
                    'breakpoint' => (int) apply_filters('cc_ajax_blog_search_sidebar_toggle_breakpoint', 992),
                    // label nel bottone
                    'label' => apply_filters('cc_ajax_blog_search_sidebar_toggle_label', __('Filtri & ricerca', 'cc-ajax-blog-search')),
                ],
            ]
        );
    }

    /**
     * AJAX handler for blog search.
     *
     * Validates nonce, performs WP_Query and
     * returns a normalized JSON response.
     *
     * @return void
     */
    public function handle_ajax_search(): void
    {
        check_ajax_referer('cc_ajax_blog_search', 'nonce');

        $term = isset($_REQUEST['s'])
            ? sanitize_text_field(wp_unslash($_REQUEST['s']))
            : '';

        if ($term === '') {
            wp_send_json_success(['results' => []]);
        }

        $post_types = $_GET['post_type'] ?? [];
        $scope = sanitize_text_field($_GET['scope'] ?? 'global');

        $query = new WP_Query([
            's' => $term,
            'post_type' => $scope === 'global' ? 'any' : $post_types,
            'posts_per_page' => 5,
            'post_status' => 'publish',
            'ignore_sticky_posts' => true,
        ]);

        $results = [];
        $show_thumb = (bool) apply_filters('cc_ajax_blog_search_show_thumbnail', false);
        $thumb_size = apply_filters('cc_ajax_blog_search_thumbnail_size', 'thumbnail');

        while ($query->have_posts()) {
            $query->the_post();

            $thumb = '';
            if ($show_thumb) {
                $url = get_the_post_thumbnail_url(get_the_ID(), $thumb_size);
                $thumb = $url ? esc_url($url) : '';
            }

            $results[] = [
                'title' => get_the_title(),
                'url' => get_permalink(),
                'date' => get_the_date(),
                'excerpt' => wp_trim_words(get_the_excerpt(), 18, '…'),
                'thumb' => $thumb,
            ];
        }

        wp_reset_postdata();

        wp_send_json_success(['results' => $results]);
    }
}
