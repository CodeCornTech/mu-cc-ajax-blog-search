# Profili di ricerca

I profili consentono di collegare form diversi a configurazioni indipendenti senza duplicare il core del plugin.

## Contratto del profilo

Un profilo viene registrato tramite `cc_ajax_blog_search_profiles` e può contenere:

```php
[
    'selectors' => ['form.search-form'],
    'scope' => 'site_search',
    'post_type' => ['post', 'page'],
    'label' => 'sito',
    'show_thumb' => false,
    'ui' => [
        'results_anchor' => 'form',
        'results_anchor_selector' => null,
        'results_gap' => 10,
        'hide_native_clear' => false,
        'reset_on_close' => false,
        'close_scope_selector' => null,
        'close_control_selectors' => [],
    ],
]
```

### Campi principali

| Campo | Descrizione |
| --- | --- |
| `selectors` | Form intercettati dal profilo |
| `scope` | Identificatore logico inviato al backend |
| `post_type` | Post type ammessi per la ricerca |
| `label` | Etichetta usata nell'interfaccia risultati |
| `show_thumb` | Preferenza frontend per la thumbnail |
| `ui` | Configurazione del dropdown e dei controlli del form |

## Esempio completo

```php
<?php
/**
 * Configurazione specifica del sito.
 * Questo file deve essere un MU plugin separato nella root di mu-plugins.
 */

defined('ABSPATH') || exit;

function project_search_post_types(): array
{
    return [
        'post',
        'page',
    ];
}

add_filter(
    'cc_ajax_blog_search_profiles',
    static function (
        array $profiles,
        array $page_context
    ): array {
        if (is_admin()) {
            return $profiles;
        }

        $profiles['site_header'] = [
            'selectors' => [
                '#site-header form.search-form',
            ],
            'scope' => 'site_header',
            'post_type' => project_search_post_types(),
            'label' => 'sito',
            'show_thumb' => false,
            'ui' => [
                'results_anchor' => 'form',
                'results_gap' => 10,
                'reset_on_close' => true,
                'close_scope_selector' => '#site-header',
                'close_control_selectors' => [
                    '.search-close',
                ],
            ],
        ];

        return $profiles;
    },
    20,
    2
);
```

## Blindatura server-side

I valori inviati dal browser non devono essere considerati una policy di sicurezza. Per i profili che limitano contenuti o post type, applicare sempre una regola server-side tramite `cc_ajax_blog_search_query_args`.

```php
<?php
add_filter(
    'cc_ajax_blog_search_query_args',
    static function (
        array $args,
        array $context,
        string $term
    ): array {
        if (($context['profile'] ?? '') !== 'site_header') {
            return $args;
        }

        $args['post_type'] = project_search_post_types();
        $args['post_status'] = 'publish';

        return $args;
    },
    999,
    3
);
```

## Thumbnail per profilo

```php
<?php
add_filter(
    'cc_ajax_blog_search_show_thumbnail',
    static function (
        bool $show,
        array $context = []
    ): bool {
        if (($context['profile'] ?? '') === 'site_header') {
            return false;
        }

        return $show;
    },
    999,
    2
);
```

```php
<?php
add_filter(
    'cc_ajax_blog_search_thumbnail_size',
    static function (
        string $size,
        array $context = []
    ): string {
        if (($context['profile'] ?? '') === 'press_sidebar') {
            return 'medium';
        }

        return $size;
    },
    999,
    2
);
```

## Excerpt per profilo

```php
<?php
add_filter(
    'cc_ajax_blog_search_excerpt_words',
    static function (
        int $words,
        array $context,
        int $post_id
    ): int {
        if (($context['profile'] ?? '') === 'site_header') {
            return 12;
        }

        return $words;
    },
    20,
    3
);
```

Per nascondere completamente l'excerpt:

```php
<?php
add_filter(
    'cc_ajax_blog_search_show_excerpt',
    static function (
        bool $show,
        array $context,
        int $post_id
    ): bool {
        return ($context['profile'] ?? '') !== 'compact_search';
    },
    20,
    3
);
```

## Selettori contestuali

Il filtro `cc_ajax_blog_search_selectors` supporta tre comportamenti.

### Merge

Un array numerico estende i selettori di default:

```php
<?php
return [
    '#custom-search form',
];
```

### Override

```php
<?php
return [
    '__mode' => 'override',
    'selectors' => [
        '#custom-search form',
    ],
];
```

### Disable

```php
<?php
return [
    '__mode' => 'disable',
];
```

## Allineamento della SERP nativa

Quando il dropdown offre un collegamento alla ricerca completa, il profilo può essere trasmesso tramite `cc_abs_profile`. Il sito integratore può allineare la query principale con `pre_get_posts`.

```php
<?php
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

        if ($profile !== 'site_header') {
            return;
        }

        $query->set('post_type', project_search_post_types());
        $query->set('post_status', 'publish');
    },
    999
);
```

Le integrazioni specifiche di un sito non devono essere inserite nel core della repository: devono vivere in MU plugin separati nella root del relativo progetto WordPress.
