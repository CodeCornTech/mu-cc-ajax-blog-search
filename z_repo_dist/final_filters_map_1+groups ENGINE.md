perfetto.
Ti sparo **la versione “CodeCorn MU-grade = Cascade + Groups”**, **stabile**, **leggibile**, **debuggabile**, **zero magia**.

Questa è quella che puoi tenere **anni** senza che qualcuno ti maledica.

---

# 🧠 FILOSOFIA ( chiara )

1. **Cascade rule engine** = decide *CHI vince*
2. **Groups** = decide *CHI appartiene a cosa*
3. **First match wins**
4. **Debug sempre esplicito**

👉 i **groups NON sostituiscono la cascade**, la **potenziano**
👉 nessun AND/OR strano, niente parsing fragile

---

# 🧱 STRUTTURA MENTALE

### Regole possibili

* `scope:context`
* `scope:group`
* `scope:*`
* `*:context`
* `*:group`
* `*:*`

### Ordine **immutabile**

1. `scope:context`
2. `scope:group`
3. `scope:*`
4. `*:context`
5. `*:group`
6. `*:*`

---

# ✅ IMPLEMENTAZIONE “BENE BENE”

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    /**
     * Context groups ( logical, not WP-specific )
     */
    $groups = [
        'content' => ['post', 'page'],
        'shop'    => ['product'],
        'media'   => ['portfolio', 'video'],
    ];

    /**
     * Rule map ( deterministic )
     */
    $rules = [
        // 🔴 SPECIFIC CONTEXT
        'single:page'       => ['.single-page-search'],
        'single:portfolio'  => ['.portfolio-single-search'],
        'archive:product'   => ['.woocommerce-archive-search'],
        'archive:post'      => ['.blog-archive-search'],

        // 🟠 GROUP RULES
        'archive:media'     => ['.media-archive-search'],
        'single:shop'       => ['.shop-single-search'],

        // 🟡 SCOPE FALLBACK
        'archive:*'         => ['.archive-default-search'],
        'single:*'          => ['.single-default-search'],

        // 🟢 CONTEXT ANYWHERE
        '*:product'         => ['.product-anywhere-search'],

        // 🔵 GROUP ANYWHERE
        '*:media'           => ['.media-anywhere-search'],

        // ⚫ GLOBAL FALLBACK
        '*:*'               => ['.global-search'],
    ];

    /**
     * Resolve groups present in current contexts
     */
    $activeGroups = [];

    foreach ($groups as $group => $members) {
        if (array_intersect($contexts, $members)) {
            $activeGroups[] = $group;
        }
    }

    /**
     * Build candidate keys ( deterministic order )
     */
    $candidates = [];

    // 1. scope:context
    foreach ($contexts as $ctx) {
        $candidates[] = "{$scope}:{$ctx}";
    }

    // 2. scope:group
    foreach ($activeGroups as $group) {
        $candidates[] = "{$scope}:{$group}";
    }

    // 3. scope:*
    $candidates[] = "{$scope}:*";

    // 4. *:context
    foreach ($contexts as $ctx) {
        $candidates[] = "*:{$ctx}";
    }

    // 5. *:group
    foreach ($activeGroups as $group) {
        $candidates[] = "*:{$group}";
    }

    // 6. *:*
    $candidates[] = "*:*";

    /**
     * Match rules
     */
    foreach ($candidates as $key) {
        if (isset($rules[$key])) {

            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log(
                    '[CC SEARCH][SELECTORS] MATCH ' . $key .
                    ' | scope=' . $scope .
                    ' | contexts=' . wp_json_encode($contexts) .
                    ' | groups=' . wp_json_encode($activeGroups)
                );
            }

            return $rules[$key];
        }
    }

    /**
     * No match → disable safely
     */
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log(
            '[CC SEARCH][SELECTORS] NO MATCH' .
            ' | scope=' . $scope .
            ' | contexts=' . wp_json_encode($contexts) .
            ' | groups=' . wp_json_encode($activeGroups)
        );
    }

    return [];

}, 999, 3);
```

---

# 🧪 DEBUG: COSA TI DICE ( DAVVERO )

### Esempio — archive portfolio

```
[CC SEARCH][SELECTORS] MATCH archive:media
| scope=archive
| contexts=["portfolio"]
| groups=["media"]
```

### Esempio — single product

```
[CC SEARCH][SELECTORS] MATCH single:shop
| scope=single
| contexts=["product"]
| groups=["shop"]
```

### Esempio — page singola

```
[CC SEARCH][SELECTORS] MATCH single:page
| scope=single
| contexts=["page"]
| groups=["content"]
```

👉 **sai sempre perché ha vinto una regola**

---

# 🧠 PERCHÉ QUESTA È LA VERSIONE “MU-GRADE”

✔ cascade deterministica
✔ groups dichiarativi ( nessuna logica nascosta )
✔ portfolio = zero codice extra
✔ debug leggibile
✔ estendibile senza refactor
✔ niente “magia WordPress”

---

# 🏁 REGOLA D’ORO ( CHE TI SALVA IN FUTURO )

> **Se una regola non è esprimibile come `scope:x` → `selector[]`,
> allora NON è una buona regola per questo livello.**

AND / OR / edge cases → **livello superiore**, non qui.

---

Se vuoi, step successivo **solo se serve**:

* helper per definire rules con priority
* flag `merge` vs `override`
* oppure documentiamo questo pattern come *standard CodeCorn*

ma così com’è…
👉 **è solido** 💪
