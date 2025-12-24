ok, allora **scelta netta** 👇
andiamo con **la soluzione PIÙ STABILE, MENO RISCHIOSA e FACILE DA DEBUGGARE**.

Questa è quella che in MU-plugin / ambienti grossi **non ti tradisce mai**.

---

# ✅ SCELTA UFFICIALE: **Cascade Rule Engine deterministico**

### Perché è la migliore

✔ nessuna magia
✔ nessun parsing strano
✔ priorità **esplicita**
✔ debug **deterministico** ( sai sempre *perché* una regola ha matchato )
✔ portfolio, product, post, qualsiasi CPT → **gratis**

---

## 🧠 PRINCIPIO

Ordine **immutabile** delle regole:

1. `scope:context`
2. `scope:*`
3. `*:context`
4. `*:*` ( fallback finale )

👉 **first match wins**
👉 **nessun comportamento ambiguo**

---

# 🧱 IMPLEMENTAZIONE “MU-GRADE”

```php
add_filter('cc_ajax_blog_search_selectors', function ($selectors, $contexts, $scope) {

    /**
     * Rule map ( deterministic, ordered by specificity )
     *
     * Key format:
     * - scope:context
     * - scope:*
     * - *:context
     * - *:*
     */
    $rules = [
        // 🔴 MASSIMA SPECIFICITÀ
        'single:page'       => ['.single-page-search'],
        'single:portfolio'  => ['.portfolio-single-search'],
        'archive:portfolio' => ['.portfolio-archive-search'],
        'archive:product'   => ['.woocommerce-product-search'],
        'archive:post'      => ['.blog-archive-search'],

        // 🟠 FALLBACK PER SCOPE
        'single:*'          => ['.single-default-search'],
        'archive:*'         => ['.archive-default-search'],

        // 🟡 FALLBACK PER CONTEXT OVUNQUE
        '*:product'         => ['.product-anywhere-search'],
        '*:portfolio'       => ['.portfolio-anywhere-search'],

        // 🟢 FALLBACK GLOBALE ASSOLUTO
        '*:*'               => ['.global-search'],
    ];

    /**
     * Build candidate keys in deterministic order
     */
    $candidates = [];

    foreach ((array) $contexts as $ctx) {
        $candidates[] = "{$scope}:{$ctx}";
    }

    $candidates[] = "{$scope}:*";

    foreach ((array) $contexts as $ctx) {
        $candidates[] = "*:{$ctx}";
    }

    $candidates[] = "*:*";

    /**
     * Match rules
     */
    foreach ($candidates as $key) {
        if (isset($rules[$key])) {

            if (defined('WP_DEBUG') && WP_DEBUG) {
                error_log(
                    '[CC SEARCH][SELECTORS] MATCH ' .
                    $key .
                    ' | scope=' . $scope .
                    ' | contexts=' . wp_json_encode($contexts)
                );
            }

            return $rules[$key];
        }
    }

    /**
     * No match = disable AJAX safely
     */
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log(
            '[CC SEARCH][SELECTORS] NO MATCH | scope=' .
            $scope .
            ' | contexts=' . wp_json_encode($contexts)
        );
    }

    return [];

}, 999, 3);
```

---

# 🧪 DEBUG: COSA VEDRAI NEI LOG

### Esempio: **single portfolio**

```
[CC SEARCH][SELECTORS] MATCH single:portfolio
| scope=single
| contexts=["portfolio"]
```

### Esempio: **archive product**

```
[CC SEARCH][SELECTORS] MATCH archive:product
| scope=archive
| contexts=["product"]
```

### Esempio: **nessuna regola**

```
[CC SEARCH][SELECTORS] NO MATCH
| scope=global
| contexts=["post","page","product"]
```

👉 **zero ambiguità**
👉 sai sempre *chi ha deciso cosa*

---

# 🧠 PERCHÉ NON HO SCELTO LE ALTRE

### ❌ AND / OR complessi

* utili solo in casi rari
* aumentano il rischio
* difficili da spiegare a chi legge dopo

### ❌ Gruppi

* ottimi, ma **livello 2**
* da introdurre solo se servono davvero

### ❌ Parsing tipo `explode(':')` + wildcard misti

* più fragile
* più difficile da testare

---

# 🧩 COME SI ESTENDE SENZA PAURA

Aggiungere un CPT nuovo ( es. `case_study` ):

```php
'single:case_study'  => ['.case-study-single-search'],
'archive:case_study' => ['.case-study-archive-search'],
```

Fine.
Nessun refactor. Nessun bug collaterale.

---

# 🏁 CONCLUSIONE

👉 Questa è **la base solida**
👉 È **debuggabile**
👉 È **prevedibile**
👉 È **MU-plugin safe**

Se vuoi, prossimi step **solo se servono**:

* helper per generare `$candidates`
* flag `merge` vs `override`
* priority numerica sulle regole

Ma **così è già production-ready** 🔥
