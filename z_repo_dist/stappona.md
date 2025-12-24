# STRAPPONA.md


---

## 🛑 IL PROBLEMA ( detto secco )

Questa roba **NON deve stare nel bootstrap**:

```php
add_filter('cc_ajax_blog_search_show_thumbnail', '__return_true');
add_filter('cc_ajax_blog_search_sidebar_toggle_mode', fn() => 'floating');
add_filter('cc_ajax_blog_search_sidebar_toggle_enabled', '__return_true');
add_filter('cc_ajax_blog_search_sidebar_container_selector', fn() => '.sidebar-area.sticky-sidebar');
```

Perché?

* ❌ sono **default di prodotto**, non override
* ❌ sono **sempre attivi**, quindi non distinguibili
* ❌ se domani un tema li ridefinisce → casino
* ❌ MU plugin ≠ playground di add_filter

👉 **I filtri servono per OVERRIDE**, non per configurazione base.

---

## ✅ SOLUZIONE MU-GRADE ( semplice )

### 🎯 Regola

* **Default → array di config**
* **Filtri → solo per override mirato**

---

## 1️⃣ CREA UNA CONFIG BASE ( via array )

Nel bootstrap, **prima** di `Plugin::boot()`:

```php
/**
 * ------------------------------------------------------------
 * Default configuration ( MU-grade )
 * ------------------------------------------------------------
 *
 * Questi sono i DEFAULT di prodotto.
 * NON usare filtri qui.
 * I filtri servono solo per override esterni.
 */
$cc_abs_defaults = [
    'show_thumbnail' => true,

    'sidebar_toggle' => [
        'enabled'    => true,
        'mode'       => 'floating', // floating | top
        'breakpoint' => 992,
        'label'      => __('Filtri & ricerca', MU_CC_ABS_TEXT_DOMAIN),
        'container'  => '.sidebar-area.sticky-sidebar',
    ],
];
```

---

## 2️⃣ PASSA LA CONFIG AL PLUGIN ( stop filtri )

```php
CodeCorn\AjaxBlogSearch\Plugin::boot(
    [
        'version'     => MU_CC_ABS_VERSION,
        'ajax_action' => MU_CC_AJAX_ACTION,
        'text_domain' => MU_CC_ABS_TEXT_DOMAIN,
        'handle'      => MU_CC_ABS_HANDLE,
        'base_dir'    => MU_CC_ABS_BASE_DIR,
        'base_url'    => MU_CC_ABS_BASE_URL,
        'debug'       => MU_CC_ABS_PHP_DEBUG,

        // 🔥 CONFIG VERA
        'defaults'    => $cc_abs_defaults,
    ]
);
```

---

## 3️⃣ DENTRO `Plugin.php` ( una volta sola )

Nel costruttore:

```php
protected array $defaults = [];

protected function __construct(array $config)
{
    $this->version     = $config['version'];
    $this->ajax_action = $config['ajax_action'];
    $this->text_domain = $config['text_domain'];
    $this->handle      = $config['handle'];
    $this->base_dir    = rtrim($config['base_dir'], '/\\');
    $this->base_url    = rtrim($config['base_url'], '/\\');
    $this->debug       = (bool) ($config['debug'] ?? false);

    // ✅ CONFIG BASE
    $this->defaults = $config['defaults'] ?? [];

    $this->register_hooks();
}
```

---

## 4️⃣ USA I DEFAULT SENZA FILTRI

Esempio in `enqueue_assets()`:

```php
$show_thumb = (bool) (
    $this->defaults['show_thumbnail'] ?? false
);

$sidebar = $this->defaults['sidebar_toggle'] ?? [];
```

e nel `wp_localize_script`:

```php
'show_thumb' => $show_thumb,

'sidebar_toggle' => [
    'enabled'    => (bool) ($sidebar['enabled'] ?? false),
    'mode'       => $sidebar['mode'] ?? 'floating',
    'breakpoint' => (int) ($sidebar['breakpoint'] ?? 992),
    'label'      => $sidebar['label'] ?? __('Filtri & ricerca', 'cc-ajax-blog-search'),
],

'ui' => [
    'sidebar_container_selector' => $sidebar['container'] ?? null,
],
```

---

## 5️⃣ E I FILTRI? ( ora tornano utili )

Ora i filtri servono **solo se qualcuno vuole cambiare il default**:

```php
add_filter('cc_ajax_blog_search_sidebar_toggle_enabled', '__return_false');
```

oppure:

```php
add_filter('cc_ajax_blog_search_sidebar_toggle_enabled', fn() => is_post_type_archive('product'));
```

👉 **override esplicito**
👉 **nessun rumore**
👉 **nessun side-effect**

---

## 🔥 RISULTATO

* ✅ bootstrap pulito
* ✅ niente filtri “a cazzo”
* ✅ config leggibile
* ✅ MU-grade vero
* ✅ possiamo andare avanti

Ora sì che possiamo fare:
➡ **mostra tutti i risultati**
➡ **limiti per breakpoint**
➡ **UX seria**

Dimmi solo:
👉 **“andiamo avanti col dropdown”** oppure
👉 **“prima refactor minimo in Plugin.php”**
