<?php
/**
 * Plugin Name: CC BBM Header Ajax Search Config
 * Description: Configura il profilo ABS della ricerca principale nell'header di Barbagia Musei.
 * Version:     0.2.0
 * Author:      CodeCorn™ Technology
 */

defined('ABSPATH') || exit;

/**
 * Post type canonici della ricerca globale nell'header.
 *
 * @return string[]
 */
function bbm_cc_abs_header_post_types(): array
{
    return [
        'page',
        'post',
    ];
}

/**
 * Registra il profilo frontend dell'header.
 */
add_filter(
    'cc_ajax_blog_search_profiles',
    static function (
        array $profiles,
        array $page_context
    ): array {
        if (is_admin()) {
            return $profiles;
        }

        $profiles['bbm_header'] = [
            'selectors' => [
                '#bm-header-main-menu form.et_pb_menu__search-form',
            ],
            'scope' => 'bbm_header',
            'post_type' => bbm_cc_abs_header_post_types(),
            'label' => 'sito',
            'show_thumb' => false,
            'ui' => [
                /**
                 * Il dropdown viene montato dentro il form:
                 * top e larghezza seguono il campo di ricerca reale.
                 */
                'results_anchor' => 'form',
                'results_gap' => 10,

                /**
                 * Divi fornisce già il proprio pulsante di chiusura.
                 * Nascondiamo il cancel button nativo dell'input search
                 * per evitare il doppio controllo.
                 */
                'hide_native_clear' => true,

                /**
                 * Alla chiusura del searchbox:
                 * - svuota l'input;
                 * - nasconde e svuota il dropdown;
                 * - annulla l'eventuale richiesta pendente.
                 */
                'reset_on_close' => true,
                'close_scope_selector' => '#bm-header-main-menu',
                'close_control_selectors' => [
                    '.et_pb_menu__close-search-button',
                ],
            ],
        ];

        return $profiles;
    },
    20,
    2
);

/**
 * Blinda lato server il profilo dell'header.
 */
add_filter(
    'cc_ajax_blog_search_query_args',
    static function (
        array $args,
        array $context,
        string $term
    ): array {
        if (
            ($context['profile'] ?? '')
            !== 'bbm_header'
        ) {
            return $args;
        }

        $args['post_type'] = bbm_cc_abs_header_post_types();
        $args['post_status'] = 'publish';

        return $args;
    },
    999,
    3
);

/**
 * Disabilita esplicitamente le thumbnail nell'header.
 */
add_filter(
    'cc_ajax_blog_search_show_thumbnail',
    static function (
        bool $show,
        array $context = []
    ): bool {
        if (
            ($context['profile'] ?? '')
            === 'bbm_header'
        ) {
            return false;
        }

        return $show;
    },
    1000,
    2
);

/**
 * Allinea la SERP nativa aperta da "Mostra tutti".
 */
add_action(
    'pre_get_posts',
    static function (WP_Query $query): void {
        if (
            is_admin()
            || !$query->is_main_query()
            || !$query->is_search()
        ) {
            return;
        }

        $raw_profile = $_GET['cc_abs_profile'] ?? '';

        $profile = is_string($raw_profile)
            ? sanitize_key(wp_unslash($raw_profile))
            : '';

        if ($profile !== 'bbm_header') {
            return;
        }

        $query->set(
            'post_type',
            bbm_cc_abs_header_post_types()
        );

        $query->set(
            'post_status',
            'publish'
        );
    },
    999
);
