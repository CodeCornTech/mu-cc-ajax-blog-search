perfetto 👍
qui facciamo **la “tabella di verità” completa del filtro**, così chiunque ( anche tu tra 6 mesi ) capisce **tutti i casi supportati** + **il colpo di grazia: override totale**.

Parliamo **solo del filtro**:

```php
cc_ajax_blog_search_selectors
```

firma definitiva:

```php
apply_filters(
    'cc_ajax_blog_search_selectors',
    string[] $selectors,   // default aggregati dalla mappa
    string[] $contexts,    // post_type risolti ( es: ['post','page'] )
    string   $scope        // global | single | archive
);
```

---

# 🧠 COME VA LETTO IL FILTRO

* `$selectors` → **baseline** ( dalla mappa )
* `$contexts`  → **cosa stai cercando**
* `$scope`     → **dove stai cercando**

👉 ogni regola dovrebbe rispondere a:

> *“in questo contesto, voglio intercettare quali form?”*

---

# ✅ CASI SUPPORTATI ( COMPLETI )

## 1️⃣ Override per `page` SENZA toccare `post`

👉 classico: popup search solo sulle pagine

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    if (in_array('page', $contexts, true)) {
        return ['.popup-search-box form'];
    }

    return $selectors;

}, 10, 3);
```

✔ non rompe blog
✔ non rompe product
✔ override chirurgico

---

## 2️⃣ Override SOLO su `single page`

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    if ($scope === 'single' && in_array('page', $contexts, true)) {
        return ['.popup-search-box form'];
    }

    return $selectors;

}, 10, 3);
```

---

## 3️⃣ WooCommerce — aggiungi un form custom

👉 estendi, non sovrascrivi

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts) {

    if (in_array('product', $contexts, true)) {
        $selectors[] = '.woocommerce-product-search';
    }

    return $selectors;

}, 10, 2);
```

✔ mantiene `.search-form`
✔ aggiunge il Woo core
✔ zero side-effect

---

## 4️⃣ WooCommerce — SOLO shop / archive

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    if ($scope === 'archive' && in_array('product', $contexts, true)) {
        return ['.woocommerce-product-search'];
    }

    return $selectors;

}, 10, 3);
```

---

## 5️⃣ Blog — sidebar search SOLO su archive

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    if ($scope === 'archive' && in_array('post', $contexts, true)) {
        return ['.sidebar .search-form'];
    }

    return $selectors;

}, 10, 3);
```

---

## 6️⃣ Portfolio — DISABILITA AJAX

👉 questo è importante: **ritorno array vuoto = off**

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    if ($scope === 'archive' && in_array('portfolio', $contexts, true)) {
        return [];
    }

    return $selectors;

}, 10, 3);
```

✔ AJAX spento
✔ form resta normale submit

---

## 7️⃣ Header search — SOLO globale

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    if ($scope === 'global') {
        return ['header .search-form'];
    }

    return $selectors;

}, 10, 3);
```

---

## 8️⃣ Multi-CPT — un solo search box per tutto

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts) {

    if (count($contexts) > 1) {
        return ['#global-search form'];
    }

    return $selectors;

}, 10, 2);
```

---

# 💣 CASO FINALE — OVERRIDE TOTALE ( “riscrive tutto” )

👉 **questo è il caso che cercavi**
👉 ignora completamente la mappa di default
👉 il plugin diventa “headless” lato selectors

```php

add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    // Mappa custom totale
    $custom_map = [
        'single:page'    => ['.popup-search-box form'],
        'archive:post'   => ['.sidebar .search-form'],
        'archive:product'=> ['.woocommerce-product-search'],
        'global:*'       => ['header .search-form'],
    ];

    foreach ($custom_map as $key => $value) {

        [$rule_scope, $rule_ctx] = explode(':', $key);

        if ($rule_scope !== '*' && $rule_scope !== $scope) {
            continue;
        }

        if ($rule_ctx !== '*' && !in_array($rule_ctx, $contexts, true)) {
            continue;
        }

        return $value; // 🔥 OVERRIDE TOTALE
    }

    return []; // fallback: disabilita tutto
}, 999, 3);
```

💥 con questo:

* la `$search_context_map` diventa solo **documentazione**
* il comportamento è **100% controllato dal tema**
* zero fork
* zero hack

---

# 🧠 TL;DR FINALE

* il filtro ora è **potentissimo**
* copre **tutti i casi reali**
* puoi:

  * estendere
  * sostituire
  * disabilitare
  * riscrivere tutto
* la mappa di default resta **una base sensata**, non una gabbia

Se vuoi, prossimo step naturale:

* aggiungere **priority ai selector**
* oppure debug overlay che evidenzia i form intercettati
* oppure binding JS “un form → un context”

ma così com’è:
👉 **è un sistema maturo** 🔥

sì zio, ci sono **altre combo** che ti conviene avere in tasca, perché con lo schema `scope:ctx` ti sei creato un mini rule engine… ma quello che hai ora è ancora “1 livello”.
Ti do **le combo vere** ( pulite, estendibili, e senza diventare un casino ) + una versione “bene bene” del tuo mapper.

---

# 1) Combo “specificità” con fallback a cascata ( senza duplicare )

Problema: oggi fai “first match wins”, ma non hai una gerarchia esplicita.
Soluzione: **ordine di specificità** automatico:

1. `scope:ctx`
2. `scope:*`
3. `*:ctx`
4. `*:*`

### ✅ Implementazione

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    $map = [
        // super specifiche
        'single:page'       => ['.single-page-test'],
        'archive:post'      => ['.post-test'],
        'archive:product'   => ['.woocommerce-test'],
        'archive:portfolio' => ['.portfolio-archive-test'],
        'single:portfolio'  => ['.portfolio-single-test'],

        // fallback per scope
        'archive:*'         => ['.archive-fallback-test'],
        'single:*'          => ['.single-fallback-test'],

        // fallback per context ovunque
        '*:product'         => ['.product-anywhere-test'],

        // fallback globale finale
        '*:*'               => ['.global-test'],
    ];

    // genera automaticamente la lista di chiavi candidate in ordine di priorità
    $candidates = [];

    foreach ((array) $contexts as $ctx) {
        $candidates[] = "{$scope}:{$ctx}";
    }
    $candidates[] = "{$scope}:*";

    foreach ((array) $contexts as $ctx) {
        $candidates[] = "*:{$ctx}";
    }
    $candidates[] = "*:*";

    foreach ($candidates as $key) {
        if (isset($map[$key])) {
            return $map[$key];
        }
    }

    return []; // se vuoi “no match = disable”
}, 999, 3);
```

🔥 Questa combo ti dà:

* regole compatte
* fallback dichiarativi
* zero `explode()`
* portfolio gestito “gratis”

---

# 2) Combo “multi-context” vera ( AND / OR )

Problema: `$contexts` può essere `['post','product']` e tu vuoi una regola che matchi **solo se ci sono entrambi** o **se c’è almeno uno**.

### ✅ OR ( se c’è almeno uno di questi )

```php
if ($scope === 'archive' && array_intersect($contexts, ['product','portfolio'])) {
    return ['.archive-commerce-or-portfolio'];
}
```

### ✅ AND ( devono esserci tutti )

```php
$must = ['product','portfolio'];
$hasAll = !array_diff($must, $contexts);

if ($scope === 'archive' && $hasAll) {
    return ['.archive-both-product-and-portfolio'];
}
```

📌 questa combo è “killer” quando fai global search o pagine ibride.

---

# 3) Combo “context group” ( categorie di contesti )

Problema: non vuoi scrivere 20 righe per 20 CPT.
Soluzione: gruppi.

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    $groups = [
        'content'  => ['post','page'],
        'shop'     => ['product'],
        'media'    => ['video','portfolio'],
    ];

    $ctx = $contexts;

    $isContent = array_intersect($ctx, $groups['content']);
    $isShop    = array_intersect($ctx, $groups['shop']);
    $isMedia   = array_intersect($ctx, $groups['media']);

    if ($scope === 'archive' && $isMedia) {
        return ['.archive-media-search'];
    }

    if ($scope === 'single' && $isShop) {
        return ['.single-shop-search'];
    }

    return $selectors;

}, 50, 3);
```

🔥 qui aggiungere “portfolio” è solo metterlo nel gruppo, fine.

---

# 4) Combo “selector merge” ( non solo override )

Problema: a volte non vuoi sostituire, vuoi **aggiungere**.

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    if ($scope === 'archive' && in_array('product', $contexts, true)) {
        $selectors[] = '.woocommerce-product-search';
    }

    return array_values(array_unique($selectors));

}, 20, 3);
```

📌 tu stai usando il filtro come “override totale”; questa combo lo usa come “estensione”.

---

# 5) Combo “denylist” ( disabilita solo alcuni form )

Problema: vuoi intercettare `.search-form` ma NON quella in footer.

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    $selectors = array_filter($selectors, function ($sel) {
        return $sel !== 'footer .search-form';
    });

    return array_values($selectors);

}, 20, 3);
```

🔥 utilissimo quando un tema ha 3 search form uguali.

---

# 6) Combo “match per taxonomy” ( senza toccare detect )

Se ti serve un caso tipo:

* su `product_cat` usa un selettore
* su `category` un altro

puoi farlo **nel filtro selectors** leggendo la query:

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    if ($scope === 'archive' && is_tax('product_cat')) {
        return ['.wc-tax-search-form'];
    }

    if ($scope === 'archive' && is_category()) {
        return ['.blog-tax-search-form'];
    }

    return $selectors;

}, 30, 3);
```

---

# ⭐ “BENE BENE” : la tua versione ma senza limiti

Se vuoi restare con “mappa custom totale”, falla così:

* cascade automatico
* portfolio incluso
* `*:*` finale
* debug di quale regola ha matchato ( opzionale )

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    $map = [
        'single:page'       => ['.single-page-test'],
        'archive:post'      => ['.post-test'],
        'archive:product'   => ['.woocommerce-test'],
        'single:portfolio'  => ['.portfolio-single-test'],
        'archive:portfolio' => ['.portfolio-archive-test'],

        // fallback per scope
        'archive:*'         => ['.archive-fallback-test'],
        'single:*'          => ['.single-fallback-test'],

        // fallback globale
        '*:*'               => ['.global-test'],
    ];

    $candidates = [];

    foreach ((array) $contexts as $ctx) {
        $candidates[] = "{$scope}:{$ctx}";
    }
    $candidates[] = "{$scope}:*";
    $candidates[] = "*:*";

    foreach ($candidates as $key) {
        if (isset($map[$key])) {

            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log('[CC SEARCH][SELECTORS] matched rule: ' . $key);
            }

            return $map[$key];
        }
    }

    return [];

}, 999, 3);
```

---

## Dimmi quale stile vuoi come “standard del progetto”

1. **Cascade rule engine** ( consigliato )
2. **Groups** ( mega scalabile )
3. **AND/OR multi-context** ( per pagine ibride )

Io per CodeCorn MU-grade farei **1 + groups**, e il resto solo quando serve.



#### MERDAIOLO
#### MERDAIOLO
zio qui stiamo cappellando pero xke o usiamo la mappa o non so 

```php
add_filter(
    'cc_ajax_blog_search_sidebar_container_selector',
    function () {
        // sidebar WooCommerce
        return '.sidebar-area.sticky-sidebar';
    }
);
```

questa ci rompetutto il lavoro inoltre anche il js non e predisposto per averlo ...
```log
jquery-migrate.min.js?ver=3.4.1:2 JQMIGRATE: Migrate is installed, version 3.4.1
_fix.js?ver=1.0.0:45 [CodeCorn Fix] window._ frozen successfully
[Violation] Forced reflow while executing JavaScript took 33ms
init_embed.js:287 Search endpoint requested!
cc-logger-core-pre.js?ver=0.1.0:154  CodeCorn™ - Logger Core  DEBUG  [AJX-SIDEBAR]  initAjaxSearch: start 
cc-logger-core-pre.js?ver=0.1.0:154  CodeCorn™ - Logger Core  DEBUG  [AJX-SIDEBAR]  initAjaxSearch: context {"scope":"archive","post_type":["post"],"selectors":[".sidebar .search-form"]} 
cc-logger-core-pre.js?ver=0.1.0:154  CodeCorn™ - Logger Core  DEBUG  [AJX-SIDEBAR]  sidebar: initSidebarToggle() called 
cc-logger-core-pre.js?ver=0.1.0:154  CodeCorn™ - Logger Core  DEBUG  [AJX-SIDEBAR]  sidebar: config {"enabled":true,"mode":"floating","breakpoint":992,"label":"Cassola Viola"} 
cc-logger-core-pre.js?ver=0.1.0:154  CodeCorn™ - Logger Core  DEBUG  [AJX-SIDEBAR]  sidebar: cc-sidebar-toggle-enabled added to body 
cc-logger-core-pre.js?ver=0.1.0:154  CodeCorn™ - Logger Core  DEBUG  [AJX-SIDEBAR]  sidebar: placeholder inserted before sidebar_inner 
jquery.min.js?ver=3.7.1:2 jQuery.Deferred exception: Failed to execute 'appendChild' on 'Node': parameter 1 is not of type 'Node'. TypeError: parameter 1 is not of type 'Node'.
    at Ae (https://scopacani.test/wp-includes/js/jquery/jquery.min.js?ver=3.7.1:2:36543)
    at $e (https://scopacani.test/wp-includes/js/jquery/jquery.min.js?ver=3.7.1:2:45790)
    at e.<computed>.append (https://scopacani.test/wp-includes/js/jquery/jquery.min.js?ver=3.7.1:2:47633)
    at initSidebarToggle (https://scopacani.test/wp-content/mu-plugins/codecorn/ajax-blog-search/assets/js/cc-ajax-blog-search.js?ver=1.0.15:342:21)
    at HTMLDocument.<anonymous> (https://scopacani.test/wp-content/mu-plugins/codecorn/ajax-blog-search/assets/js/cc-ajax-blog-search.js?ver=1.0.15:483:5)
    at e (https://scopacani.test/wp-includes/js/jquery/jquery.min.js?ver=3.7.1:2:27028)
    at t (https://scopacani.test/wp-includes/js/jquery/jquery.min.js?ver=3.7.1:2:27330) undefined
ce.Deferred.exceptionHook @ jquery.min.js?ver=3.7.1:2
t @ jquery.min.js?ver=3.7.1:2Understand this warning
monte/:1 Unchecked runtime.lastError: The message port closed before a response was received.Understand this error
jquery.min.js?ver=3.7.1:2 Uncaught TypeError: Failed to execute 'appendChild' on 'Node': parameter 1 is not of type 'Node'.
    at Ae (jquery.min.js?ver=3.7.1:2:36543)
    at $e (jquery.min.js?ver=3.7.1:2:45790)
    at e.<computed>.append (jquery.min.js?ver=3.7.1:2:47633)
    at initSidebarToggle (cc-ajax-blog-search.js?ver=1.0.15:342:21)
    at HTMLDocument.<anonymous> (cc-ajax-blog-search.js?ver=1.0.15:483:5)
    at e (jquery.min.js?ver=3.7.1:2:27028)
    at t (jquery.min.js?ver=3.7.1:2:27330)
Ae @ jquery.min.js?ver=3.7.1:2
$e @ jquery.min.js?ver=3.7.1:2
append @ jquery.min.js?ver=3.7.1:2
initSidebarToggle @ cc-ajax-blog-search.js?ver=1.0.15:342
(anonymous) @ cc-ajax-blog-search.js?ver=1.0.15:483
e @ jquery.min.js?ver=3.7.1:2
t @ jquery.min.js?ver=3.7.1:2Understand this error
[Violation] Forced reflow while executing JavaScript took 34ms
```

____
infine capita che si abbiamo due search come nel caso horseno 
uno globale sempre disponibile in popup 
mentre gli altri sono scoped e stiamo andando alla grande ... 
ora strategia e pensare prima di sparare ...

#### MERDAIOLO
#### MERDAIOLO