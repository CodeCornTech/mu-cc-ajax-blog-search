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
 * @phpstan-type SearchContextMap array{
 *     post?: list<string>,
 *     page?: list<string>,
 *     product?: list<string>,
 *     portfolio?: list<string>,
 *     global: list<string>
 * }
 */

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
     * Script ajax_action.
     *
     * @var string
     */
    protected string $ajax_action;

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
     * PHP debug enabled.
     *
     * @var bool
     */
    private bool $php_debug = false;

    /**
     * JS debug enabled.
     *
     * @var bool
     */
    private bool $js_debug = false;
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
     * Taxonomy → Post Type map.
     *
     * Serve a risolvere correttamente il contesto
     * quando ci troviamo su archivi di taxonomy.
     *
     * @var array<string, string>
     */
    private array $taxonomy_map = [
        // WordPress core
        'category' => 'post',
        'post_tag' => 'post',

        // WooCommerce
        'product_cat' => 'product',
        'product_tag' => 'product',
    ];

    /**
     * Search context selectors map ( default selectors ).
     *
     * Mappa di fallback che associa un *context key* ( post type o contesto logico )
     * a uno o più selettori CSS dei form di ricerca da intercettare.
     * Contiene i selettori CSS di fallback per i form di ricerca
     * più comuni ( WordPress core / WooCommerce core ).
     *
     * ⚠️ Questi valori NON sono vincolanti:
     * La mappa rappresenta SOLO i default:
     * - non è vincolante
     * - non è esaustiva
     * - può essere completamente sovrascritta
     *
     * I selettori finali vengono risolti tramite:
     * {@see get_search_selectors()}
     * e filtrati via:
     * {@see cc_ajax_blog_search_selectors}
     *
     * Chiavi supportate ( non limitative ):
     * - post
     * - page
     * - product
     * - portfolio
     * - global
     *
     * @var SearchContextMap
     *      Array indicizzato per contesto ( context key ),
     *      contenente liste di selettori CSS validi.
     */
    private array $search_context_map = [
        'single' => [
            '.search-form', // WP core search form
        ],
        'post' => [
            '.search-form', // WP core search form
        ],
        'product' => [
            '.search-form', // WooCommerce core ( fallback )
            // '.woocommerce-product-search',
        ],
        'portfolio' => [
            '.search-form', // fallback generico CPT
            // '#portfolio-search .search-form',
        ],
        'page' => [
            '.popup-search-box form', // search popup custom per page
        ],
        'global' => [
            '.search-form', // fallback globale WP
        ],
    ];

    /**
     * Bootstrap the plugin instance.
     *
     * @param array{
     *     version:string,
     *     ajax_action:string,
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
     * Resolve PHP debug flag.
     */
    private function resolve_php_debug(bool $initial): bool
    {
        /**
         * Ordine di precedenza:
         * 0. WP_DEBUG deve essere true
         * 1. valore passato dal bootstrap
         * 2. filtro cc_ajax_blog_search_php_debug
         */
        if (!\defined('WP_DEBUG') || !WP_DEBUG) {
            return false;
        }

        $debug = $initial;

        return (bool) apply_filters(
            'cc_ajax_blog_search_php_debug',
            $debug
        );
    }

    /**
     * Resolve JS debug flag.
     */
    private function resolve_js_debug(bool $initial): bool
    {
        /**
         * Ordine di precedenza:
         * 1. valore passato dal bootstrap
         * 2. filtro cc_ajax_blog_search_js_debug
         */
        $debug = $initial;

        return (bool) apply_filters(
            'cc_ajax_blog_search_js_debug',
            $debug
        );
    }

    /**
     * Check if PHP debug is enabled.
     */
    private function can_debug(): bool
    {
        return $this->php_debug;
    }

    /**
     * Plugin constructor.
     *
     * @param array{
     *     version:string,
     *     ajax_action:string,
     *     text_domain:string,
     *     handle:string,
     *     base_dir:string,
     *     base_url:string
     *     js_debug:boolean
     *     php_debug:boolean
     * } $config Plugin configuration.
     */
    protected function __construct(array $config)
    {
        $this->version = $config['version'];
        $this->ajax_action = $config['ajax_action'];
        $this->text_domain = $config['text_domain'];
        $this->handle = $config['handle'];
        $this->base_dir = rtrim($config['base_dir'], '/\\');
        $this->base_url = rtrim($config['base_url'], '/\\');
        $this->php_debug = $config['php_debug'];
        $this->js_debug = $config['js_debug'];

        // 🔥 fire up debuggers or shutdown them @@@ filterables @@@
        $this->php_debug = $this->resolve_php_debug((bool) ($config['php_debug'] ?? false));
        $this->js_debug = $this->resolve_js_debug((bool) ($config['js_debug'] ?? false));

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
        add_action('wp_ajax_' . $this->ajax_action, [$this, 'handle_ajax_search']);
        add_action('wp_ajax_nopriv_' . $this->ajax_action, [$this, 'handle_ajax_search']);
    }

    /**
     * Resolve search form selectors for one or more contexts.
     *
     * @param string|string[] $contexts Post type(s) or context keys.
     * @param string         $scope    Scope ( global | single | archive ).
     * @return string[]
     */
    private function get_search_selectors($contexts, string $scope = 'global'): array
    {
        $contexts = (array) $contexts;

        $selectors = [];

        foreach ($contexts as $ctx) {
            if (isset($this->search_context_map[$ctx])) {
                $selectors = array_merge(
                    $selectors,
                    $this->search_context_map[$ctx]
                );
            }
        }

        // fallback globale se vuoto
        if (!$selectors) {
            $selectors = $this->search_context_map['global'] ?? [];
        }

        /**
         * Filters search form selectors.
         *
         * @param string[] $selectors Aggregated default selectors.
         * @param string[] $contexts  Resolved contexts ( post types ).
         * @param string   $scope     Search scope.
         */
        $filtered = apply_filters(
            'cc_ajax_blog_search_selectors',
            $selectors,
            $contexts,
            $scope
        );
        /**
         * Resolve selectors returned by `cc_ajax_blog_search_selectors`.
         *
         * CONTRATTO DEL FILTRO
         * -------------------
         *
         * Il filtro può restituire:
         *
         * 1) array numerico di stringhe
         *    → viene interpretato come ESTENSIONE ( merge ) dei selettori esistenti
         *
         * 2) array associativo con chiave '__mode'
         *    → istruzione esplicita per il core
         *
         *    Modalità supportate:
         *    - '__mode' => 'disable'
         *        Disabilita completamente l'AJAX search per il contesto corrente.
         *
         *    - '__mode' => 'override'
         *        Sostituisce integralmente i selettori risolti con quelli forniti
         *        in 'selectors'.
         *
         * 3) qualsiasi altro valore ( null, false, string, ecc. )
         *    → ignorato, il core mantiene i selettori di default.
         *
         * Questo approccio garantisce:
         * - backward compatibility
         * - merge sicuro di default
         * - override / disable SOLO se dichiarati esplicitamente
         */

        // Se il filtro non ritorna un array valido → ignora
        if (!\is_array($filtered)) {
            return array_values(array_unique($selectors));
        }

        // 🔴 Modalità esplicita dichiarata dal filtro
        if (isset($filtered['__mode'])) {

            return match ($filtered['__mode']) {

                // Disabilita completamente l'intercettazione AJAX
                'disable' => [],

                // Sostituisce integralmente i selettori risolti
                'override' => array_values(
                    array_unique((array) ($filtered['selectors'] ?? []))
                ),

                // Modalità sconosciuta → fallback sicuro
                default => array_values(array_unique($selectors)),
            };
        }

        // 🟢 DEFAULT: merge ( comportamento storico del core )
        return array_values(
            array_unique(array_merge($selectors, $filtered))
        );
    }

    /**
     * Normalize post_type input to a safe array of allowed post types.
     *
     * Accetta un valore di post_type in forma:
     * - string   ( es: 'post' )
     * - array    ( es: ['post', 'page', 'foo'] )
     *
     * e restituisce SEMPRE:
     * - un array di post type validi
     * - filtrati tramite la whitelist $this->allowed_cpt
     *
     * Comportamento:
     * - string   → ['string']
     * - array    → intersect con allowed_cpt
     * - altro    → []
     *
     * ⚠️ Non valida l'esistenza del post type in WordPress,
     *    ma solo l'appartenenza alla whitelist del plugin.
     *
     * @param string|string[]|mixed $pt
     *        Post type(s) da normalizzare.
     *
     * @return string[]
     *         Array di post type consentiti ( può essere vuoto ).
     */
    private function normalize_post_types($pt): array
    {
        ## 🔥 OPTIONAL ( solo se vuoi essere ultra-difensivo )
        ## Se vuoi blindarla ancora di più ( **facoltativo** ):
        // if (\is_string($pt) && in_array($pt, $this->allowed_cpt, true)) { return [$pt]; }
        ### ma **non è obbligatorio** se il chiamante è affidabile ( e nel tuo caso lo è ).

        if (\is_string($pt)) {
            return [$pt];
        }

        if (\is_array($pt)) {
            return array_values(
                array_intersect($pt, $this->allowed_cpt)
            );
        }

        return [];
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
        $context = [
            'scope' => 'global',
            'post_type' => $this->allowed_cpt,
            'selectors' => $this->search_context_map['global'],
        ];

        if ($this->can_debug()) {

            error_log("[CC SEARCH][CTX] init global");
            $pt_dbg = get_post_type();

            error_log(
                '[CC SEARCH][CTX][DEBUG] ' .
                    'post_type=' . var_export($pt_dbg, true) . ' | ' .
                    'is_singular=' . (is_singular() ? '1' : '0') . ' | ' .
                    'is_home=' . (is_home() ? '1' : '0') . ' | ' .
                    'is_front_page=' . (is_front_page() ? '1' : '0') . ' | ' .
                    'is_tax=' . (is_tax() ? '1' : '0') . ' | ' .
                    'is_category=' . (is_category() ? '1' : '0') . ' | ' .
                    'is_tag=' . (is_tag() ? '1' : '0') . ' | ' .
                    'is_post_type_archive=' . (is_post_type_archive() ? '1' : '0')
            );

            if (empty($context['post_type'])) {
                error_log('[CC SEARCH][CTX][WARN] Empty post_type resolved');
            }
        }
        /**
         * 1. TAXONOMY ARCHIVE ( massima priorità )
         */
        if (is_tax() || is_category() || is_tag()) {

            $tax = get_queried_object();

            if ($tax && !is_wp_error($tax)) {

                $pt = $this->taxonomy_map[$tax->taxonomy] ?? null;

                $pt = apply_filters(
                    'cc_ajax_blog_search_taxonomy_post_type',
                    $pt,
                    $tax
                );

                $pts = $this->normalize_post_types($pt);

                if ($pts) {
                    return [
                        'scope' => 'archive',
                        'post_type' => $pts,
                        'selectors' => $this->get_search_selectors($pts, 'archive'),
                    ];
                }
            }
        }

        /**
         * 2. SINGULAR CPT
         */
        if (is_singular() && !is_front_page()) {

            $pt = get_post_type();
            $pts = $this->normalize_post_types($pt);

            if ($pts) {
                return [
                    'scope' => 'single',
                    'post_type' => $pts,
                    'selectors' => $this->get_search_selectors($pts, 'single'),
                ];
            }
        }

        /**
         * 3. POST TYPE ARCHIVE
         */
        if (is_post_type_archive()) {

            $pt = get_query_var('post_type');
            $pts = $this->normalize_post_types($pt);

            if ($pts) {
                return [
                    'scope' => 'archive',
                    'post_type' => $pts,
                    'selectors' => $this->get_search_selectors($pts, 'archive'),
                ];
            }
        }

        /**
         * 4. HOME / BLOG PAGE ( opzionale ma consigliato )
         */
        /**
         * 4. HOME / BLOG PAGE
         *
         * - is_home()               → archivio post ( blog )
         * - is_front_page() statica → pagina ( page )
         */
        if (is_home() || is_front_page()) {

            $scope = 'archive';
            $pts = [];

            if (is_home()) {
                $scope = 'archive';
                $pts = ['post'];
            }

            if (is_front_page() && !is_home()) {
                // homepage statica
                $scope = 'single';
                $pts = ['page'];
            }

            if ($this->can_debug()) {
                error_log(
                    '[CC SEARCH][CTX] home/front detected | ' .
                        'is_home=' . (is_home() ? '1' : '0') . ' | ' .
                        'is_front_page=' . (is_front_page() ? '1' : '0') . ' | ' .
                        'scope=' . $scope . ' | ' .
                        'post_type=' . wp_json_encode($pts) .
                        'selectors=' . wp_json_encode($this->get_search_selectors($pts, $scope))
                );
            }

            return [
                'scope' => $scope,
                'post_type' => $pts,
                'selectors' => $this->get_search_selectors($pts, $scope),
            ];
        }


        /**
         * 5. FALLBACK GLOBALE
         */
        return $context;
    }

    protected function register_assets(): void
    {
        $v = $this->version;

        wp_register_script(
            "{$this->handle}-pre",
            "{$this->base_url}/assets/js/{$this->text_domain}-pre.js",
            ['jquery', 'cc-logger-core-pre'],
            $v,
            true
        );

        wp_register_script(
            "{$this->handle}-search",
            "{$this->base_url}/assets/js/{$this->text_domain}-search.js",
            ["{$this->handle}-pre"],
            $v,
            true
        );

        wp_register_script(
            "{$this->handle}-sidebar",
            "{$this->base_url}/assets/js/{$this->text_domain}-sidebar.js",
            ["{$this->handle}-pre"],
            $v,
            true
        );

        wp_register_style(
            $this->handle,
            "{$this->base_url}/assets/css/{$this->text_domain}.css",
            [],
            $v
        );
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
    public function enqueue_assets(): void
    {
        if (is_admin()) {
            return;
        }
        // 🔹 registra SOLO ora
        $this->register_assets();

        if ($this->can_debug()) {
            error_log('[CC ABS][ENQUEUE] begin | uri=' . (isset($_SERVER['REQUEST_URI']) ? sanitize_text_field(wp_unslash($_SERVER['REQUEST_URI'])) : 'n/a'));
            error_log('[CC ABS][ENQUEUE] base_dir=' . $this->base_dir . ' | base_url=' . $this->base_url);
            error_log('[CC ABS][ENQUEUE] pre=' . (file_exists($this->base_dir . '/assets/js/' . $this->text_domain . '-pre.js') ? '1' : '0') .
                ' | search=' . (file_exists($this->base_dir . '/assets/js/' . $this->text_domain . '-search.js') ? '1' : '0') .
                ' | sidebar=' . (file_exists($this->base_dir . '/assets/js/' . $this->text_domain . '-sidebar.js') ? '1' : '0'));
        }
        wp_enqueue_script("{$this->handle}-pre");
        wp_enqueue_script("{$this->handle}-search");
        wp_enqueue_script("{$this->handle}-sidebar");

        if (file_exists("{$this->base_dir}/assets/css/cc-ajax-blog-search.css")) {
            wp_enqueue_style($this->handle);
        }

        // 🔹 localizza DOPO register + enqueue
        $this->localize_config(); // JSON UNICO
    }
    protected function localize_config(): void
    {


        // Determina il contesto di ricerca
        $context = $this->detect_search_context();
        // Profilo di ricerca per form
        $profiles = apply_filters(
            'cc_ajax_blog_search_profiles',
            [],
            $context
        );

        if (!\is_array($profiles)) {
            $profiles = [];
        }
        // La configurazione serve già al PRE: deve essere stampata PRIMA del PRE,
        // non soltanto prima del modulo SEARCH.
        if ($this->can_debug()) {
            error_log('[CC ABS][LOCALIZE] ' . wp_json_encode([
                'handle' => "{$this->handle}-pre",
                'debug' => $this->js_debug,
                // CONTESTO LEGACY
                'context' => $context,
                // PROFILI INDIPENDENTI PER FORM
                'profiles' => $profiles,
                'ajax_url' => admin_url('admin-ajax.php'),
                'action' => $this->ajax_action,
            ]));
        }

        wp_localize_script(
            "{$this->handle}-pre",
            'CC_Ajax_Blog_Search',
            [
                'ajax_url' => admin_url('admin-ajax.php'),
                'action' => $this->ajax_action,
                'nonce' => wp_create_nonce($this->ajax_action),
                'no_results_text' => __('Nessun articolo trovato.', 'cc-ajax-blog-search'),
                'error_text' => __('Si è verificato un errore , riprova più tardi.', 'cc-ajax-blog-search'),
                'show_thumb' => (bool) apply_filters(
                    'cc_ajax_blog_search_show_thumbnail',
                    false,
                    $context
                ),
                // 🔍 DEBUG
                'debug' => $this->js_debug,
                // CONTESTO LEGACY
                'context' => $context,
                // PROFILI INDIPENDENTI PER FORM
                'profiles' => $profiles,
                'ui' => [
                    'sidebar_container_selector' => apply_filters(
                        'cc_ajax_blog_search_sidebar_container_selector', # @todo va mappato anche se filtrato
                        null // null = disabilitato
                    ),
                ],
                // ⚙️ Config sidebar mobile toggle
                'sidebar_toggle' => [
                    // di default disattivato, lo accendi via filter
                    'enabled' => (bool) apply_filters('cc_ajax_blog_search_sidebar_toggle_enabled', false), # @todo mappiamo anche questo potendo gestire il multi contesto togglabile o globalmente con true attivato | false disattivato ovunque
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
     * Risolve l'excerpt di un singolo risultato AJAX.
     *
     * Il comportamento è pilotabile per profilo tramite:
     *
     * - cc_ajax_blog_search_show_excerpt
     * - cc_ajax_blog_search_excerpt_source
     * - cc_ajax_blog_search_excerpt_words
     * - cc_ajax_blog_search_result_excerpt
     *
     * L'ordine delle sorgenti è:
     *
     * 1. excerpt WordPress;
     * 2. sorgente personalizzata tramite filtro;
     * 3. contenuto del post ripulito da blocchi e shortcode.
     *
     * @param int                  $post_id ID del contenuto.
     * @param array<string, mixed> $context Contesto della ricerca ABS.
     *
     * @return string
     */
    private function resolve_result_excerpt(
        int $post_id,
        array $context
    ): string {
        /**
         * Permette di abilitare o disabilitare completamente
         * l'excerpt per uno specifico profilo.
         *
         * @param bool                 $show_excerpt Stato iniziale.
         * @param array<string, mixed> $context      Contesto ABS.
         * @param int                  $post_id      ID del contenuto.
         */
        $show_excerpt = (bool) apply_filters(
            'cc_ajax_blog_search_show_excerpt',
            true,
            $context,
            $post_id
        );

        if (!$show_excerpt) {
            return '';
        }

        $post = get_post($post_id);

        if (!$post instanceof \WP_Post) {
            return '';
        }

        /**
         * Prima sorgente: excerpt WordPress manuale o automatico.
         */
        $source = (string) get_the_excerpt($post);

        /**
         * Consente alle integrazioni di fornire una sorgente alternativa.
         *
         * @param string               $source  Sorgente corrente.
         * @param int                  $post_id ID del contenuto.
         * @param array<string, mixed> $context Contesto ABS.
         */
        $source = (string) apply_filters(
            'cc_ajax_blog_search_excerpt_source',
            $source,
            $post_id,
            $context
        );

        /**
         * Fallback sul contenuto reale.
         *
         * Serve soprattutto per:
         * - pagine Divi;
         * - contenuti costruiti tramite shortcode;
         * - CPT senza excerpt manuale;
         * - contenuti per i quali get_the_excerpt() restituisce vuoto.
         */
        if (
            trim(
                wp_strip_all_tags($source)
            ) === ''
        ) {
            $source = (string) $post->post_content;

            if (
                $source !== ''
                && has_blocks($source)
            ) {
                $source = excerpt_remove_blocks($source);
            }

            $source = strip_shortcodes($source);
        }

        $charset = get_bloginfo('charset');

        if (!is_string($charset) || $charset === '') {
            $charset = 'UTF-8';
        }

        $source = html_entity_decode(
            $source,
            ENT_QUOTES | ENT_HTML5,
            $charset
        );

        $source = wp_strip_all_tags(
            $source,
            true
        );

        $source = preg_replace(
            '/\s+/u',
            ' ',
            $source
        );

        $source = is_string($source)
            ? trim($source)
            : '';

        if ($source === '') {
            return '';
        }

        /**
         * Numero massimo di parole.
         *
         * @param int                  $words   Limite iniziale.
         * @param array<string, mixed> $context Contesto ABS.
         * @param int                  $post_id ID del contenuto.
         */
        $words = (int) apply_filters(
            'cc_ajax_blog_search_excerpt_words',
            18,
            $context,
            $post_id
        );

        $words = max(
            1,
            min(80, $words)
        );

        $excerpt = wp_trim_words(
            $source,
            $words,
            '…'
        );

        /**
         * Filtro finale sull'excerpt normalizzato.
         *
         * @param string               $excerpt Excerpt prodotto.
         * @param int                  $post_id ID del contenuto.
         * @param array<string, mixed> $context Contesto ABS.
         * @param string               $source  Sorgente normalizzata.
         */
        $excerpt = (string) apply_filters(
            'cc_ajax_blog_search_result_excerpt',
            $excerpt,
            $post_id,
            $context,
            $source
        );

        return esc_html($excerpt);
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
        if ($this->can_debug()) {
            error_log('[CC ABS][AJAX] request=' . wp_json_encode([
                'action' => isset($_REQUEST['action']) ? sanitize_text_field(wp_unslash($_REQUEST['action'])) : '',
                's' => isset($_REQUEST['s']) ? sanitize_text_field(wp_unslash($_REQUEST['s'])) : '',
                'scope' => isset($_REQUEST['scope']) ? sanitize_text_field(wp_unslash($_REQUEST['scope'])) : '',
                'post_type' => $_REQUEST['post_type'] ?? [],
                'logged_in' => is_user_logged_in(),
            ]));
        }

        $nonce_ok = check_ajax_referer($this->ajax_action, 'nonce', false);
        if (!$nonce_ok) {
            if ($this->can_debug()) {
                error_log('[CC ABS][AJAX][ERROR] nonce invalid');
            }
            wp_send_json_error(['code' => 'invalid_nonce'], 403);
        }

        $term = isset($_REQUEST['s'])
            ? sanitize_text_field(wp_unslash($_REQUEST['s']))
            : '';

        if ($term === '') {
            wp_send_json_success([
                'results' => [],
                'total' => 0,
            ]);
        }

        $post_types = $_REQUEST['post_type'] ?? [];
        $raw_scope = $_REQUEST['scope'] ?? 'global';

        $scope = is_string($raw_scope)
            ? sanitize_key(wp_unslash($raw_scope))
            : 'global';

        $raw_profile = $_REQUEST['cc_abs_profile'] ?? '';

        $profile = is_string($raw_profile)
            ? sanitize_key(wp_unslash($raw_profile))
            : '';

        /**
         * Ricostruiamo un contesto minimo lato AJAX
         * ( NON rifacciamo detect_search_context )
         */
        $context = [
            'profile' => $profile,
            'scope' => $scope,
            'post_type' => $this->normalize_post_types($post_types),
        ];

        /**
         * Numero risultati visibili ( filtrabile )
         */
        $limit = (int) apply_filters(
            'cc_ajax_blog_search_results_limit',
            5,
            $context
        );

        /**
         * Argomenti base WP_Query
         */
        $args = [
            's' => $term,
            'post_type' => $scope === 'global' ? 'any' : $context['post_type'],
            'posts_per_page' => $limit,
            'post_status' => 'publish',
            'ignore_sticky_posts' => true,
            'no_found_rows' => false, // 🔥 SERVE per total_results
        ];

        /**
         * Filtro avanzato sugli args
         */
        $args = apply_filters(
            'cc_ajax_blog_search_query_args',
            $args,
            $context,
            $term
        );

        if ($this->can_debug()) {
            error_log('[CC ABS][AJAX] query_args=' . wp_json_encode($args));
        }

        $query = new WP_Query($args);

        $results = [];
        $total = (int) $query->found_posts;
        $show_thumb = (bool) apply_filters(
            'cc_ajax_blog_search_show_thumbnail',
            false,
            $context
        );

        $thumb_size = apply_filters(
            'cc_ajax_blog_search_thumbnail_size',
            'thumbnail',
            $context
        );

        while ($query->have_posts()) {
            $query->the_post();
            $post_id = get_the_ID();
            $thumb = '';
            if ($show_thumb) {
                $url = get_the_post_thumbnail_url($post_id, $thumb_size);
                $thumb = $url ? esc_url($url) : '';
            }

            $results[] = [
                'title' => get_the_title(),
                'url' => get_permalink(),
                'date' => get_the_date(),
                'excerpt' => $this->resolve_result_excerpt(
                    $post_id,
                    $context
                ),
                'thumb' => $thumb,
            ];
        }

        if ($this->can_debug()) {
            error_log('[CC ABS][AJAX] results=' . count($results) . ' | total=' . $total);
        }
        wp_reset_postdata();

        wp_send_json_success([
            'results' => $results,
            'total' => $total,        // 🔥 NUOVO
            'shown' => \count($results),
            'limit' => $limit,
        ]);
    }
}
