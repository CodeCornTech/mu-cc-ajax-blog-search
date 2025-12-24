ok Priscolusco 😄 andiamo **dritti al punto**, senza WooCommerce, **solo WordPress core**.

Quello che vuoi è **esattamente questo comportamento**:

* **Home / blog principale** → mostra **SOLO le categorie**
* **Dentro una categoria (o sottocategoria)** → mostra **SOLO gli articoli**
* Zero hack strani, zero plugin, **logica WP corretta**

Ci sono **due strade pulite**. Ti dico **quella giusta** e poi l’alternativa.

---

## ✅ SOLUZIONE CORRETTA (core WP, pulita)

### 1️⃣ Home = archivio categorie (non post)

Nel template della home (di solito `home.php` oppure `index.php` se non esiste):

```php
<?php if ( is_home() && ! is_paged() ) : ?>

    <?php
    // Stampa SOLO le categorie di primo livello
    wp_list_categories([
        'title_li' => '',
        'depth'    => 1, // solo top-level
    ]);
    ?>

<?php else : ?>

    <?php
    // fallback normale (post loop)
    if ( have_posts() ) :
        while ( have_posts() ) : the_post();
            get_template_part('template-parts/content', get_post_type());
        endwhile;
    endif;
    ?>

<?php endif; ?>
```

📌 Risultato:

* `/blog` → **solo categorie**
* `/blog/page/2` → **articoli** (opzionale ma sensato)

---

## 2️⃣ Categoria = SOLO articoli (default WP)

Qui **non devi fare nulla**.

WordPress:

* su `category.php`
* o `archive.php`

mostra **automaticamente i post**, NON le sottocategorie.

Se il tema Horseno ti stampa anche le sottocategorie → **le sta forzando**.

---

## 🔥 SE Horseno mostra categorie ANCHE dentro la categoria

Blocchiamolo **a livello di loop**:

### In `category.php` (o `archive.php`)

```php
<?php
// Forza SOLO articoli, niente categorie figlie
remove_action('woocommerce_before_shop_loop', 'woocommerce_output_product_categories');
```

(Se non è Woo, ignora questa riga)

Oppure **versione universale**:

```php
<?php if ( is_category() ) : ?>

    <?php
    // NON stampiamo sottocategorie
    // solo loop post
    if ( have_posts() ) :
        while ( have_posts() ) : the_post();
            get_template_part('template-parts/content', 'post');
        endwhile;
    endif;
    ?>

<?php endif; ?>
```

---

## 🧠 Versione PRO (query-level, elegantissima)

Se vuoi essere **chirurgico**:

```php
add_action('pre_get_posts', function ($q) {
    if (
        ! is_admin() &&
        $q->is_main_query() &&
        is_home()
    ) {
        // home NON mostra post
        $q->set('posts_per_page', 0);
    }
});
```

E poi nella home **stampi solo categorie manualmente**.

---

## ✅ RIEPILOGO SECCO

| Contesto        | Mostra      |
| --------------- | ----------- |
| Home blog       | ✅ categorie |
| Categoria padre | ✅ articoli  |
| Sottocategoria  | ✅ articoli  |
| Paginazione     | ✅ articoli  |

---

## Consiglio Domiziano™

👉 **Non mischiare categorie + post nello stesso loop**
👉 Home = **navigazione**
👉 Categorie = **contenuto**

Se vuoi, al prossimo giro:

* ti faccio **breadcrumb categorie**
* oppure **griglia categorie con thumbnail**
* oppure lo integriamo con **AJAX search contestuale** (quello che stai già costruendo)

Dimmi tu.



ok allora stringiamo **molto**.
Niente chiacchiere, niente varianti.

### ✅ Obiettivo unico

**Home blog → categorie**
**Dentro categoria → articoli**
**Stop.**

---

## ✅ Soluzione MINIMA (1 solo hook)

Mettila **in un MU plugin o functions.php**:

```php
add_action('pre_get_posts', function ($q) {
    if (
        ! is_admin() &&
        $q->is_main_query() &&
        is_home()
    ) {
        // Home blog: NON mostrare articoli
        $q->set('posts_per_page', 0);
    }
});
```

Fine.

---

## 🔹 Cosa succede

* **Home blog (`is_home`)**

  * WP_Query → 0 post
  * Il loop è vuoto
  * Tu **stampi solo le categorie** nel template (come già fai)

* **Categoria / sottocategoria**

  * Query normale
  * **Solo articoli**
  * Nessuna sottocategoria stampata (se il tema non forza)

---

## 🔹 Nel template home (1 riga)

Dove ora hai il loop:

```php
<?php if ( is_home() ) {
    wp_list_categories(['title_li' => '', 'depth' => 1]);
} ?>
```

---

## 🧠 Perché è giusto

* non tocchi archive.php
* non tocchi category.php
* non rompi paginazioni
* non inventi logiche parallele
* **WordPress lavora per te**

---

Se vuoi, al prossimo passo **lo rendiamo filtrabile**
oppure **diverso per blog secondari**

Per ora:
**questa è la soluzione più corta possibile.**
