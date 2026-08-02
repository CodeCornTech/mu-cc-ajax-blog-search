# MU CC Ajax Blog Search

Ricerca AJAX **multi-contesto** e **multi-profilo** per WordPress, distribuita come Must-Use plugin.

Il plugin intercetta uno o più form di ricerca già presenti nel tema, assegna a ciascuno un profilo indipendente e restituisce risultati coerenti con post type, contesto e configurazione server-side. Non richiede modifiche al markup del tema e conserva il normale submit WordPress come fallback.

## Stato del progetto

- Versione: **1.2.0**
- WordPress: **6.0+**
- PHP: **8.0+**
- Licenza: **MIT**
- Text domain: `cc-ajax-blog-search`
- Endpoint AJAX: `cc_ajax_blog_search`

## Funzionalità

- ricerca live con debounce e annullamento delle richieste precedenti;
- supporto a utenti autenticati e visitatori;
- profili indipendenti per form tramite `cc_ajax_blog_search_profiles`;
- ricerca su uno o più post type;
- rilevamento dei contesti globali, singoli, archivi e tassonomie;
- selettori configurabili con modalità merge, override o disable;
- thumbnail ed excerpt configurabili per profilo;
- query server-side estendibile prima dell'esecuzione;
- dropdown risultati accessibile e ancorabile al form o a un selettore dedicato;
- pannello sidebar mobile opzionale;
- fallback al normale submit WordPress quando JavaScript non è disponibile;
- localizzazione frontend e logger condiviso CodeCorn.

## Struttura canonica

```text
mu-plugins/
├── mu-cc-ajax-blog-search.php
└── codecorn/
    ├── ajax-blog-search/
    │   ├── index.php
    │   ├── src/
    │   │   └── Plugin.php
    │   ├── assets/
    │   │   ├── css/
    │   │   │   └── cc-ajax-blog-search.css
    │   │   └── js/
    │   │       ├── cc-ajax-blog-search-pre.js
    │   │       ├── cc-ajax-blog-search-search.js
    │   │       └── cc-ajax-blog-search-sidebar.js
    │   └── languages/
    │       ├── cc-ajax-blog-search.pot
    │       ├── cc-ajax-blog-search-it_IT.po
    │       └── cc-ajax-blog-search-it_IT.mo
    └── core/
        ├── index.php
        └── js/
            └── cc-logger-core-pre.js
```

L'unico entrypoint MU è `mu-plugins/mu-cc-ajax-blog-search.php`. La directory `codecorn/` contiene esclusivamente codice, asset e infrastruttura interna.

## Installazione

La directory `mu-plugins/` della repository deve essere copiata **dentro** `wp-content/mu-plugins/`. Non clonare l'intera repository direttamente in quella directory, altrimenti l'entrypoint rimane annidato e WordPress non lo carica.

```bash
#!/usr/bin/env bash

git clone https://github.com/CodeCornTech/mu-cc-ajax-blog-search.git /tmp/mu-cc-ajax-blog-search

rsync -a \
    /tmp/mu-cc-ajax-blog-search/mu-plugins/ \
    /percorso/wordpress/wp-content/mu-plugins/
```

Verifica quindi in **Plugin → Plugin installati → Must-Use** che compaia `MU CC Ajax Blog Search`.

## Architettura runtime

### Bootstrap PHP

L'entrypoint:

1. dichiara versione, handle, text domain e percorsi;
2. registra il logger condiviso `cc-logger-core-pre`;
3. carica le traduzioni MU-safe;
4. inizializza `CodeCorn\AjaxBlogSearch\Plugin`.

### Moduli frontend

- `pre`: normalizza configurazione, profili e infrastruttura condivisa;
- `search`: intercetta i form, invia le richieste AJAX e renderizza i risultati;
- `sidebar`: gestisce il pannello mobile opzionale.

### Backend AJAX

Il backend valida il nonce, normalizza scope e post type, applica i filtri di configurazione, esegue `WP_Query` e restituisce JSON normalizzato.

## Profilo minimo

Un profilo associa un form a uno scope e a uno o più post type:

```php
<?php
add_filter(
    'cc_ajax_blog_search_profiles',
    static function (array $profiles, array $page_context): array {
        $profiles['site_header'] = [
            'selectors' => [
                '#site-header form.search-form',
            ],
            'scope' => 'site_header',
            'post_type' => [
                'page',
                'post',
            ],
            'label' => 'sito',
            'show_thumb' => false,
            'ui' => [
                'results_anchor' => 'form',
                'results_gap' => 10,
            ],
        ];

        return $profiles;
    },
    20,
    2
);
```

Per esempi completi e regole di sicurezza server-side consulta [`docs/profiles.md`](docs/profiles.md).

## Filtri principali

| Filtro | Scopo |
| --- | --- |
| `cc_ajax_blog_search_profiles` | Registra profili indipendenti per form |
| `cc_ajax_blog_search_selectors` | Estende, sostituisce o disabilita i selettori del contesto |
| `cc_ajax_blog_search_taxonomy_post_type` | Risolve il post type di una tassonomia |
| `cc_ajax_blog_search_query_args` | Modifica gli argomenti finali di `WP_Query` |
| `cc_ajax_blog_search_results_limit` | Imposta il numero massimo di risultati |
| `cc_ajax_blog_search_show_thumbnail` | Abilita la thumbnail |
| `cc_ajax_blog_search_thumbnail_size` | Imposta la dimensione della thumbnail |
| `cc_ajax_blog_search_show_excerpt` | Abilita o disabilita l'excerpt |
| `cc_ajax_blog_search_excerpt_source` | Fornisce una sorgente alternativa per l'excerpt |
| `cc_ajax_blog_search_excerpt_words` | Imposta la lunghezza massima dell'excerpt |
| `cc_ajax_blog_search_result_excerpt` | Modifica l'excerpt normalizzato |
| `cc_ajax_blog_search_sidebar_toggle_enabled` | Abilita il pannello sidebar mobile |
| `cc_ajax_blog_search_sidebar_toggle_mode` | Seleziona modalità `floating` o `top` |
| `cc_ajax_blog_search_sidebar_toggle_breakpoint` | Imposta il breakpoint del pannello |
| `cc_ajax_blog_search_sidebar_toggle_label` | Personalizza l'etichetta del toggle |

## Debug

Il debug è disattivato per impostazione predefinita.

In `wp-config.php`, prima del caricamento dei MU plugin:

```php
<?php
define('MU_CC_ABS_JS_DEBUG', true);
define('MU_CC_ABS_PHP_DEBUG', true);
```

Il debug PHP produce log soltanto quando anche `WP_DEBUG` è attivo.

Le stesse impostazioni possono essere filtrate:

```php
<?php
add_filter('cc_ajax_blog_search_js_debug', '__return_true');
add_filter('cc_ajax_blog_search_php_debug', '__return_true');
```

## Validazione locale

```bash
#!/usr/bin/env bash

find mu-plugins -name '*.php' -print0 \
    | xargs -0 -n1 php -l

node --check \
    mu-plugins/codecorn/ajax-blog-search/assets/js/cc-ajax-blog-search-pre.js

node --check \
    mu-plugins/codecorn/ajax-blog-search/assets/js/cc-ajax-blog-search-search.js

node --check \
    mu-plugins/codecorn/ajax-blog-search/assets/js/cc-ajax-blog-search-sidebar.js

node --check \
    mu-plugins/codecorn/core/js/cc-logger-core-pre.js
```

La checklist completa di rilascio è in [`docs/release-checklist.md`](docs/release-checklist.md).

## Traduzioni

Dalla root della repository, con il pacchetto `wp i18n` disponibile:

```bash
#!/usr/bin/env bash

wp i18n make-pot \
    mu-plugins/codecorn/ajax-blog-search \
    mu-plugins/codecorn/ajax-blog-search/languages/cc-ajax-blog-search.pot \
    --domain=cc-ajax-blog-search

wp i18n make-mo \
    mu-plugins/codecorn/ajax-blog-search/languages
```

## Versionamento

La versione deve essere aggiornata in:

- header del MU plugin;
- costante `MU_CC_ABS_VERSION`;
- `README.md`;
- `CHANGELOG.md`.

Gli asset WordPress usano `MU_CC_ABS_VERSION` per il cache busting.

## Changelog

Vedi [`CHANGELOG.md`](CHANGELOG.md).

## Licenza

MIT © Federico Girolami / CodeCorn™ Technology.
