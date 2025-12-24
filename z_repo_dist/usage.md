ok, **questa è una richiesta sensata** 👍
facciamo **documentazione vera**, così puoi **togliere quel mappazzone dal bootstrap** senza perdere memoria storica.

Niente filosofia, **solo tabelle utili**, con:

-   **scopo**
-   **esempio semplice**
-   **variante avanzata / realistica**

---

# 🧩 CC Ajax Blog Search — Mappa Filtri ( Documentata )

---

## 🔹 A) FILTRI DI FEATURE ( comportamento )

> **Cosa fanno**: attivano / modificano funzionalità
> **Dove usarli**: tema, mu-plugin di progetto, environment-specific

| Filtro                                          | Scopo                          | Esempio semplice                                                                        | Variante avanzata                                                                                                             |
| ----------------------------------------------- | ------------------------------ | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `cc_ajax_blog_search_show_thumbnail`            | Mostra thumbnail nei risultati | `php add_filter('cc_ajax_blog_search_show_thumbnail','__return_true'); `                | `php add_filter('cc_ajax_blog_search_show_thumbnail', fn() => is_singular('product')); `                                      |
| `cc_ajax_blog_search_thumbnail_size`            | Dimensione immagine            | `php add_filter('cc_ajax_blog_search_thumbnail_size', fn()=>'thumbnail'); `             | `php add_filter('cc_ajax_blog_search_thumbnail_size', fn()=> is_mobile()?'medium':'thumbnail'); `                             |
| `cc_ajax_blog_search_sidebar_toggle_enabled`    | Attiva toggle sidebar          | `php add_filter('cc_ajax_blog_search_sidebar_toggle_enabled','__return_true'); `        | `php add_filter('cc_ajax_blog_search_sidebar_toggle_enabled', fn()=> is_post_type_archive('product')); `                      |
| `cc_ajax_blog_search_sidebar_toggle_mode`       | Modalità toggle                | `php add_filter('cc_ajax_blog_search_sidebar_toggle_mode', fn()=>'floating'); `         | `php add_filter('cc_ajax_blog_search_sidebar_toggle_mode', fn()=> wp_is_mobile()?'floating':'top'); `                         |
| `cc_ajax_blog_search_sidebar_toggle_breakpoint` | Breakpoint px                  | `php add_filter('cc_ajax_blog_search_sidebar_toggle_breakpoint', fn()=>992); `          | `php add_filter('cc_ajax_blog_search_sidebar_toggle_breakpoint', fn()=> get_theme_mod('sidebar_bp',992)); `                   |
| `cc_ajax_blog_search_sidebar_toggle_label`      | Testo bottone                  | `php add_filter('cc_ajax_blog_search_sidebar_toggle_label', fn()=>__('Filtri','td')); ` | `php add_filter('cc_ajax_blog_search_sidebar_toggle_label', fn()=> is_shop()?__('Filtri prodotti','td'):__('Filtri','td')); ` |

---

## 🔹 B) FILTRI DI LAYOUT / DOM ( ⚠️ POTENTI )

> **Cosa fanno**: dicono _dove_ intercettare il DOM
> **Rischio**: alto se usati male
> **Uso corretto**: mirato, documentato

| Filtro                                           | Scopo                 | Esempio semplice                                                                                | Variante avanzata                                                                                                                                                                                                     |
| ------------------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cc_ajax_blog_search_sidebar_container_selector` | Contenitore sidebar   | `php add_filter('cc_ajax_blog_search_sidebar_container_selector', fn()=>'.sidebar'); `          | `php add_filter('cc_ajax_blog_search_sidebar_container_selector', fn()=> is_shop()?'.woo-sidebar':null); `                                                                                                            |
| `cc_ajax_blog_search_selectors`                  | Selettori form search | `php add_filter('cc_ajax_blog_search_selectors', fn($s)=>array_merge($s,['.custom-search'])); ` | `php add_filter('cc_ajax_blog_search_selectors', function($s,$ctx,$scope){ if($scope==='archive'&&in_array('product',$ctx,true)){ return ['__mode'=>'override','selectors'=>['.woo-search']]; } return $s; },10,3); ` |

📌 **Nota importante**
Questo filtro supporta:

-   merge ( default )
-   override esplicito
-   disable totale
    (via `__mode`, come hai già implementato)

---

## 🔹 C) FILTRI DI DEBUG

> **Cosa fanno**: log, console, probe
> **Regola**: MAI lasciarli attivi in produzione

| Filtro                          | Scopo            | Esempio semplice                                                    | Variante avanzata                                                                                                 |
| ------------------------------- | ---------------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `cc_ajax_blog_search_js_debug`  | Debug JS         | `php add_filter('cc_ajax_blog_search_js_debug','__return_true'); `  | `php add_filter('cc_ajax_blog_search_js_debug', fn()=> defined('WP_DEBUG')&&current_user_can('administrator')); ` |
| `cc_ajax_blog_search_php_debug` | Debug PHP        | `php add_filter('cc_ajax_blog_search_php_debug','__return_true'); ` | `php add_filter('cc_ajax_blog_search_php_debug', fn()=> WP_DEBUG && !wp_doing_ajax()); `                          |
| `cc_abs_i18n_debug`             | Probe traduzioni | `php add_filter('cc_abs_i18n_debug','__return_true'); `             | `php add_filter('cc_abs_i18n_debug', fn()=> defined('WP_DEBUG_I18N')); `                                          |

---

## 🧠 LINEA GUIDA ( DA TENERE A MENTE )

-   **Feature filters** → ok anche globali
-   **Layout / DOM filters** → sempre contestuali
-   **Debug filters** → temporanei, mai hardcoded
-   **Se devi commentare codice → probabilmente va documentato qui**

---

## ✅ RISULTATO

Ora puoi:

-   🧹 **togliere tutto questo dal bootstrap**
-   📄 tenere **solo questa tabella** come riferimento
-   🧠 sapere **quando usare cosa** senza rileggere il core

Quando vuoi, **prossimo step**:
👉 _“mostra tutti i risultati nel dropdown”_
(lì finalmente torniamo a fare UX e non filosofia 😄)
😂 va bene **Pibe de Oro**, fermo lì.
Qui facciamo **pulito, leggibile, BOYS COUT APPROVED™**.

Ti produco **2 VARIANTI PER OGNI SALSA**, come hai chiesto:

-   **SALSA A** → override **esplicito**
-   **SALSA B** → merge **controllato**

E **per la PRIMA** ti do **una variante che NON merge mai** (override duro), **commentata dentro riga per riga**.

---

# 🧂 SALSA A — **OVERRIDE ESPLICITO ( ZERO MERGE )**

## 🔴 Variante A1 — override “hard” ( NON merge MAI )

👉 quando **matcha una regola**, il core **butta tutto** e usa SOLO quello
👉 quando **non matcha nulla**, **DISABILITA** l’AJAX ( scelta consapevole )

```php
add_filter(
    'cc_ajax_blog_search_selectors',
    function (array $selectors, array $contexts, string $scope) {

        /**
         * Mappa regole custom:
         * chiave = scope:context
         * valore = selettori CSS da usare
         */
        $custom_map = [
            'single:page'     => ['.single-page-test'],
            'archive:post'    => ['.post-test'],
            'archive:product' => ['.woocommerce-test'],
            'global:*'        => ['.global-test'],
        ];

        foreach ($custom_map as $key => $value) {

            // Split "scope:context"
            [$rule_scope, $rule_ctx] = explode(':', $key);

            // Controllo scope ( single | archive | global )
            if ($rule_scope !== '*' && $rule_scope !== $scope) {
                continue;
            }

            // Controllo contesto ( post type )
            if ($rule_ctx !== '*' && !in_array($rule_ctx, $contexts, true)) {
                continue;
            }

            /**
             * MATCH TROVATO
             * → override totale
             * → nessun merge
             */
            return [
                '__mode'    => 'override',
                'selectors' => $value,
            ];
        }

        /**
         * NESSUNA REGOLA MATCHATA
         * → disabilita completamente l’AJAX
         * ( scelta voluta e dichiarata )
         */
        return [
            '__mode' => 'disable',
        ];
    },
    999,
    3
);
```

🧠 **Quando usarla**

-   ambienti molto controllati
-   page builder aggressivi
-   “se non so dove sono → meglio spento”

---

## 🔴 Variante A2 — override SOLO se matcha ( fallback al core )

👉 override **solo se matcha**
👉 altrimenti **lascia fare al core**

```php
add_filter(
    'cc_ajax_blog_search_selectors',
    function (array $selectors, array $contexts, string $scope) {

        $custom_map = [
            'single:page'     => ['.single-page-test'],
            'archive:post'    => ['.post-test'],
            'archive:product' => ['.woocommerce-test'],
            'global:*'        => ['.global-test'],
        ];

        foreach ($custom_map as $key => $value) {

            [$rule_scope, $rule_ctx] = explode(':', $key);

            if ($rule_scope !== '*' && $rule_scope !== $scope) {
                continue;
            }

            if ($rule_ctx !== '*' && !in_array($rule_ctx, $contexts, true)) {
                continue;
            }

            return [
                '__mode'    => 'override',
                'selectors' => $value,
            ];
        }

        // 👈 fallback: core invariato
        return $selectors;
    },
    999,
    3
);
```

🧠 **Quando usarla**

-   vuoi override mirato
-   non vuoi rompere il resto

---

# 🧂 SALSA B — **MERGE CONTROLLATO ( SAFE MODE )**

## 🟢 Variante B1 — merge classico ( aggiunge e basta )

👉 non tocca mai i default
👉 aggiunge solo quando matcha

```php
add_filter(
    'cc_ajax_blog_search_selectors',
    function (array $selectors, array $contexts, string $scope) {

        $custom_map = [
            'single:page'     => ['.single-page-test'],
            'archive:post'    => ['.post-test'],
            'archive:product' => ['.woocommerce-test'],
            'global:*'        => ['.global-test'],
        ];

        foreach ($custom_map as $key => $value) {

            [$rule_scope, $rule_ctx] = explode(':', $key);

            if ($rule_scope !== '*' && $rule_scope !== $scope) {
                continue;
            }

            if ($rule_ctx !== '*' && !in_array($rule_ctx, $contexts, true)) {
                continue;
            }

            /**
             * MERGE SAFE
             * → il core unirà i selettori
             */
            return $value;
        }

        return $selectors;
    },
    999,
    3
);
```

🧠 **Quando usarla**

-   90% dei casi
-   temi estesi
-   MU plugin condivisi

---

## 🟢 Variante B2 — merge + protezione duplicati logica

👉 merge solo se **non già presente**

```php
add_filter(
    'cc_ajax_blog_search_selectors',
    function (array $selectors, array $contexts, string $scope) {

        $custom_map = [
            'archive:product' => ['.woocommerce-test'],
        ];

        foreach ($custom_map as $key => $value) {

            [$rule_scope, $rule_ctx] = explode(':', $key);

            if ($rule_scope !== '*' && $rule_scope !== $scope) {
                continue;
            }

            if ($rule_ctx !== '*' && !in_array($rule_ctx, $contexts, true)) {
                continue;
            }

            // aggiunge solo quelli che non esistono già
            return array_diff($value, $selectors);
        }

        return $selectors;
    },
    999,
    3
);
```

🧠 **Quando usarla**

-   progetti legacy
-   temi sporchi
-   evitare doppio bind JS

---

## 🧠 TL;DR da stampare

| Vuoi             | Usa |
| ---------------- | --- |
| controllo totale | A1  |
| override mirato  | A2  |
| safe default     | B1  |
| safe + difesa    | B2  |

---

😂 capito, **nudo ma pulito**.
Questa è la **variante GIUSTA**: **merge della base conf**, **ZERO override**, **ZERO sorprese**, **debuggabile**, **ordine deterministico**.

Ti riscrivo **la TUA** versione con:

-   ✅ **merge reale** ( mai sovrascrive )
-   ✅ **priorità chiare**
-   ✅ **commenti SOLO dove servono**
-   ✅ **no garbage**
-   ✅ **no disable impliciti**

---

## VARIANTE “ NO MERGE ” ( OVERWRITE ! SPIANA )

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

## ✅ VARIANTE “MERGE PURO” ( BASE CONF SAFE )

👉 **aggiunge selettori** quando matcha
👉 **non tocca mai** quelli già risolti dal core
👉 **non disabilita mai** se non lo dici esplicitamente

```php
add_filter(
    'cc_ajax_blog_search_selectors',
    function (array $selectors, array $contexts, string $scope) {

        /**
         * Mappa regole:
         * - key   = scope:context
         * - value = selettori CSS da AGGIUNGERE
         *
         * ⚠️ Nessuna di queste sovrascrive il core.
         */
        $map = [
            // 🎯 super specifiche
            'single:page'       => ['.single-page-test'],
            'archive:post'      => ['.post-test'],
            'archive:product'   => ['.woocommerce-test'],
            'archive:portfolio' => ['.portfolio-archive-test'],
            'single:portfolio'  => ['.portfolio-single-test'],

            // 🧱 fallback per scope
            'archive:*'         => ['.archive-fallback-test'],
            'single:*'          => ['.single-fallback-test'],

            // 🌍 fallback per context ovunque
            '*:product'         => ['.product-anywhere-test'],

            // 🧬 fallback globale finale
            '*:*'               => ['.global-test'],
        ];

        /**
         * Genera le chiavi candidate in ORDINE DI PRIORITÀ
         *
         * es:
         * - single:portfolio
         * - single:*
         * - *:portfolio
         * - *:*
         */
        $candidates = [];

        foreach ($contexts as $ctx) {
            $candidates[] = "{$scope}:{$ctx}";
        }

        $candidates[] = "{$scope}:*";

        foreach ($contexts as $ctx) {
            $candidates[] = "*:{$ctx}";
        }

        $candidates[] = "*:*";

        /**
         * Accumula selettori da aggiungere
         */
        $extra = [];

        foreach ($candidates as $key) {
            if (isset($map[$key])) {
                $extra = array_merge($extra, $map[$key]);
            }
        }

        /**
         * MERGE SAFE:
         * - unisce ai selettori base
         * - rimuove duplicati
         */
        return array_values(
            array_unique(
                array_merge($selectors, $extra)
            )
        );
    },
    999,
    3
);
```

---

## 🧠 COSA FA ( IN CHIARO )

-   il **core** risolve i selettori base
-   questo filtro:

    -   **non li cancella**
    -   **non li rimpiazza**
    -   **aggiunge solo**

-   se domani togli tutto → **il plugin continua a funzionare identico**

---

## 🔍 DIFFERENZA CHIAVE CON LA VERSIONE PRIMA

| Prima                | Ora            |
| -------------------- | -------------- |
| `return $map[$key];` | ❌ sovrascrive |
| `return [];`         | ❌ disabilita  |
| merge implicito      | ❌             |
| merge esplicito      | ✅             |
| determinismo         | ✅             |
| safe-by-default      | ✅             |

---

## 🧘‍♂️ REGOLA D’ORO ( DA TENERE )

> **Il filtro `cc_ajax_blog_search_selectors` deve:**
>
> -   **aggiungere** per default
> -   **sostituire solo con `__mode`**
> -   **disabilitare solo se dichiarato**

Questa variante rispetta **perfettamente** il contratto che hai scritto nel core.

Se vuoi, **prossimo step**:
👉 versione **AND / OR multi-context**
👉 oppure **dump debug leggibile per capire quale regola ha matchato**

Dimmi tu, campione 🏆

```php
/**
 * Numero di risultati AJAX da mostrare.
 *
 * @param int   $limit   Default 5.
 * @param array $context Contesto di ricerca risolto.
 */
apply_filters('cc_ajax_blog_search_results_limit', 5, $context);

/**
 * Permette di filtrare la query WP_Query prima dell'esecuzione.
 *
 * @param array $args    Argomenti WP_Query.
 * @param array $context Contesto di ricerca.
 * @param string $term   Termine di ricerca.
 */
apply_filters('cc_ajax_blog_search_query_args', $args, $context, $term);
```

## 3️⃣ Cosa ottieni ora nel JSON

```json
{
  "success": true,
  "data": {
    "results": [ ... ],
    "total": 37,
    "shown": 5,
    "limit": 5
  }
}
```

👉 **perfetto** per:

-   `Mostrati X di Y`
-   CTA “Mostra tutti”
-   logica differenziata mobile / desktop
-   UI progressiva

---

## 4️⃣ Esempi di override (tema / MU-plugin)

### 🔹 Cambiare il numero risultati

```php
add_filter('cc_ajax_blog_search_results_limit', function ($limit, $context) {

    if ($context['scope'] === 'global') {
        return 8;
    }

    if ($context['scope'] === 'single') {
        return 4;
    }

    return $limit;

}, 10, 2);
```

---

### 🔹 Forzare ordine / campi

```php
add_filter('cc_ajax_blog_search_query_args', function ($args, $context, $term) {

    $args['orderby'] = 'date';
    $args['order']   = 'DESC';

    return $args;
}, 10, 3);
```
