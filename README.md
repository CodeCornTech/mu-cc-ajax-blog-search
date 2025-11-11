# MU CC Ajax Blog Search

**MU plugin** per WordPress che trasforma il classico _widget di ricerca del blog_ in una **ricerca AJAX live**, senza modificare il markup del tema.

Pensato per essere “drop-in” dentro `wp-content/mu-plugins`, con codice strutturato in `codecorn/ajax-blog-search` e un bootstrap minimale che registra hook e asset.

---

## 🚀 Caratteristiche principali

- 🔍 Ricerca **AJAX** sui post del blog direttamente dal widget `widget_search`
- 🧩 Nessuna modifica al template del tema → il form rimane quello standard
- 💬 Risultati mostrati sotto il campo di ricerca, con titolo, data ed excerpt
- ⚙️ Fallback automatico: se JS è disattivo, il form continua a funzionare in modo classico
- 🧱 Struttura pulita e organizzata:

  - bootstrap MU → `mu-cc-ajax-blog-search.php`
  - core PHP → `codecorn/ajax-blog-search/src/Plugin.php`
  - asset → `assets/js` e `assets/css`

- 🧭 Namespace dedicato `CodeCorn\AjaxBlogSearch`

---

## 🧰 Requisiti

- WordPress 5.x o superiore
- PHP 7.4 o superiore (consigliato)
- jQuery frontend attivo (WordPress lo include di default nei temi classici)

---

## 📁 Struttura del plugin

```
mu-plugins/
  mu-cc-ajax-blog-search.php        # bootstrap MU
  codecorn/
    ajax-blog-search/
      index.php                     # stub di sicurezza
      src/
        Plugin.php                  # core del plugin (namespace CodeCorn\AjaxBlogSearch)
      assets/
        js/
          ajax-blog-search.js       # logica AJAX lato client
        css/
          ajax-blog-search.css      # stile minimo risultati
```

---

## ⚙️ Installazione

1. **Clona la repo** in `wp-content/mu-plugins`:

   ```bash
   cd wp-content/mu-plugins
   git clone https://github.com/CodeCornTech/mu-cc-ajax-blog-search.git
   ```

   Assicurati che:

   - `mu-cc-ajax-blog-search.php` sia **direttamente** dentro `mu-plugins/`
   - la cartella `codecorn/ajax-blog-search/` sia accanto.

2. Vai in **Bacheca → Plugin → Plugin uso obbligato (Must Use)**
   e verifica che **MU CC Ajax Blog Search** sia visibile.

3. Il tema deve usare un **widget di ricerca** standard (`widget_search`).
   Se nel markup trovi:

   ```html
   <aside class="widget widget_search">
     <form class="search-form" ...></form>
   </aside>
   ```

   allora il plugin si aggancia automaticamente.
   Nessuna configurazione aggiuntiva necessaria.

---

## ⚙️ Come funziona

### Lato PHP

La classe principale `CodeCorn\AjaxBlogSearch\Plugin`:

- registra JS + CSS quando serve
- espone un endpoint AJAX:

  - `action = cc_ajax_blog_search`
  - disponibile per utenti loggati e ospiti

- esegue una `WP_Query` con il termine `s` passato dal client
- restituisce un JSON strutturato così:

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "title": "Esempio articolo",
        "url": "https://sito.it/esempio-articolo/",
        "date": "10 Novembre 2025",
        "excerpt": "Estratto accorciato del contenuto …",
        "thumb": "https://sito.it/wp-content/uploads/2025/11/thumb.jpg"
      }
    ]
  }
}
```

---

### Lato JS

Lo script `assets/js/ajax-blog-search.js`:

- trova tutti i form `.widget_search form.search-form`
- crea un box risultati `<div class="cc-ajax-search-results">` subito dopo il form
- intercetta:

  - `submit` → effettua AJAX
  - `keyup` → ricerca live con debounce

- richiama `admin-ajax.php?action=cc_ajax_blog_search` passando `s` e `nonce`
- renderizza dinamicamente titolo, data, excerpt e thumb (opzionale)

Se il campo è vuoto, la box risultati viene svuotata.

---

## 🧩 Filtri e personalizzazioni

### 🔹 Miniatura (thumbnail)

```php
add_filter('cc_ajax_blog_search_show_thumbnail', '__return_true');

// opzionale: dimensione immagine
add_filter('cc_ajax_blog_search_thumbnail_size', function () {
    return 'medium'; // oppure una image-size custom
});
```

---

### 🔹 Sidebar mobile collapsabile / floating

Permette di trasformare i widget della sidebar in un pannello mobile a comparsa (overlay o barra top).
Disattivato di default.

```php
// attiva la feature
add_filter('cc_ajax_blog_search_sidebar_toggle_enabled', '__return_true');

// modalità: 'floating' (default) oppure 'top'
add_filter('cc_ajax_blog_search_sidebar_toggle_mode', function () {
    return 'floating'; // oppure 'top'
});

// breakpoint mobile (px)
add_filter('cc_ajax_blog_search_sidebar_toggle_breakpoint', function () {
    return 992;
});

// label del pulsante toggle
add_filter('cc_ajax_blog_search_sidebar_toggle_label', function () {
    return 'Filtri & ricerca';
});
```

Quando disattivato o non definito, il CSS non modifica il comportamento della sidebar.

---

### 🔹 Debug Layer

Il sistema di debug è gestito interamente da PHP ed esposto al JS tramite `wp_localize_script`.

Puoi attivarlo in 3 modi:

#### 1. via `wp-config.php`

```php
define('CC_AJAX_BLOG_SEARCH_DEBUG', true);
```

#### 2. via filtro (vince sul define)

```php
add_filter('cc_ajax_blog_search_debug', '__return_true');
```

#### 3. via console JS (solo runtime)

```js
window.AJX_CLP_DB = true;
```

Quando attivo, tutti i log `console.log` debug del plugin vengono stampati con prefisso `[AJX-SIDEBAR]`.

---

### 🔹 Traduzioni frontend

I testi mostrati dal JS sono passati via `wp_localize_script`:

- `no_results_text`
- `error_text`

Puoi sovrascriverli in un altro MU plugin o nel tema:

```php
add_filter('cc_ajax_blog_search_i18n', function ($strings) {
    $strings['no_results_text'] = 'Nessun risultato per la tua ricerca.';
    $strings['error_text']      = 'Errore temporaneo, riprova più tardi.';
    return $strings;
});
```

---

## 🧪 Debug manuale

1. Apri la pagina del blog
2. Premi `F12 → Network`
3. Digita almeno 3 caratteri nel campo ricerca
4. Dovresti vedere chiamate a:

```
/wp-admin/admin-ajax.php?action=cc_ajax_blog_search&s=...
```

Se la risposta è `200 OK` e contiene JSON valido → il backend è ok.
Se non compare il box risultati → verifica CSS del tema o conflitti JS.

---

## 🧭 Roadmap

- [ ] Filtro per post type custom
- [ ] Hook per template markup personalizzato
- [ ] Supporto multi-istanza con config separate
- [ ] Internazionalizzazione completa (`cc_ajax_blog_search_i18n`)
- [ ] Auto-scope alla categoria corrente del blog

---

## ⚖️ Licenza

**MIT License** — usa, forka, migliora e manda una PR ✨

© CodeCorn Technology SRLS — _Federico Girolami_
_“Digital Solution Architecture with Style.”_

---
