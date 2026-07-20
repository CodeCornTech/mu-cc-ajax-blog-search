<?php
/**
 * Plugin Name: CC BBM Press Ajax Search Config
 * Description: Configura il profilo ABS della sidebar Press di Barbagia Musei.
 * Version:     0.3.0
 * Author:      CodeCorn™ Technology
 */

defined('ABSPATH') || exit;

defined('MU_CC_ABS_JS_DEBUG')
    || define('MU_CC_ABS_JS_DEBUG', true);

defined('MU_CC_ABS_PHP_DEBUG')
    || define('MU_CC_ABS_PHP_DEBUG', false);

defined('BBM_CC_ABS_PRESS_PAGE_ID')
    || define('BBM_CC_ABS_PRESS_PAGE_ID', 662);

/**
 * Verifica il contesto frontend della pagina Press.
 */
function bbm_cc_abs_is_press_page(): bool
{
    if (is_admin()) {
        return false;
    }

    return is_page(BBM_CC_ABS_PRESS_PAGE_ID);
}

/**
 * Post type canonici del profilo Press.
 *
 * @return string[]
 */
function bbm_cc_abs_press_post_types(): array
{
    return [
        'post',
    ];
}

/**
 * Registra il profilo frontend della sidebar Press.
 */
add_filter(
    'cc_ajax_blog_search_profiles',
    static function (
        array $profiles,
        array $page_context
    ): array {
        if (!bbm_cc_abs_is_press_page()) {
            return $profiles;
        }

        $profiles['bbm_press'] = [
            'selectors' => [
                '.bbm-blog-sidebar .widget_search form.wp-block-search',
            ],
            'scope' => 'bbm_press',
            'post_type' => bbm_cc_abs_press_post_types(),
            'label' => 'Press',
            'show_thumb' => true,
            'ui' => [
                /**
                 * Il dropdown segue esattamente larghezza e altezza
                 * del wrapper che contiene input e pulsante Cerca.
                 */
                'results_anchor' => 'selector',
                'results_anchor_selector' => '.wp-block-search__inside-wrapper',
                'results_gap' => 10,
            ],
        ];

        return $profiles;
    },
    20,
    2
);

/**
 * Blinda lato server il profilo Press.
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
            !== 'bbm_press'
        ) {
            return $args;
        }

        $args['post_type'] = bbm_cc_abs_press_post_types();
        $args['post_status'] = 'publish';

        return $args;
    },
    999,
    3
);

/**
 * Abilita le thumbnail soltanto per il profilo Press.
 */
add_filter(
    'cc_ajax_blog_search_show_thumbnail',
    static function (
        bool $show,
        array $context = []
    ): bool {
        if (
            ($context['profile'] ?? '')
            === 'bbm_press'
        ) {
            return true;
        }

        return $show;
    },
    999,
    2
);

/**
 * Dimensione thumbnail del profilo Press.
 */
add_filter(
    'cc_ajax_blog_search_thumbnail_size',
    static function (
        string $size,
        array $context = []
    ): string {
        if (
            ($context['profile'] ?? '')
            === 'bbm_press'
        ) {
            return 'medium';
        }

        return $size;
    },
    999,
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

        if ($profile !== 'bbm_press') {
            return;
        }

        $query->set(
            'post_type',
            bbm_cc_abs_press_post_types()
        );

        $query->set(
            'post_status',
            'publish'
        );
    },
    999
);
