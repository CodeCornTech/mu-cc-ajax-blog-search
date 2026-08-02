# 🧩 ORA: WooCommerce ( fuori dal plugin )

## 👉 In **tema / child / MU di progetto**

```php
add_filter(
    'cc_ajax_blog_search_selectors',
    function (array $selectors, string $context): array {

        if ($context !== 'product') {
            return $selectors;
        }

        return [
            '.widget_product_search form.search-form',
            'form.search-form input[name="post_type"][value="product"]',
        ];
    },
    10,
    2
);
```

✔ WooCommerce isolato
✔ sostituibile
✔ testabile
✔ disattivabile

---

## 🔁 Fallback globale ( sempre fuori dal plugin )

```php
add_filter(
    'cc_ajax_blog_search_selectors',
    function (array $selectors, string $context): array {

        if ($context !== 'global') {
            return $selectors;
        }

        return [
            '.search-form',
        ];
    },
    10,
    2
);
```

---

# 🧠 Variante avanzata ( multi-selettore )

```php
return [
    '.widget_product_search form.search-form',
    'form.search-form input[name="post_type"][value="product"]',
];
```

Il JS può poi validare realmente il form.

```php
add_filter(
    'cc_ajax_blog_search_sidebar_container_selector',
    function () {
        // sidebar WooCommerce
        return '.sidebar-area.sticky-sidebar';
    }
);
```
