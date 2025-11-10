# MU CC Ajax Blog Search

**MU plugin** per WordPress che trasforma il widget di ricerca del blog in una **ricerca AJAX live** , senza cambiare il markup del tema .

Pensato per essere drop in in `wp-content / mu-plugins` , con codice organizzato sotto `codecorn / ajax-blog-search` e un piccolo bootstrap che registra hook e asset .

---

## Caratteristiche

- Ricerca **AJAX** sui post del blog direttamente dal widget `widget_search`
- Nessuna modifica al template del tema : il form rimane quello standard
- Risultati mostrati **sotto al campo di ricerca** , con titolo , data ed excerpt
- Fallback automatico :
  - se JS non è disponibile → il form continua a funzionare in modo classico
- Struttura pulita :
  - bootstrap MU in `mu-cc-ajax-blog-search.php`
  - core in `codecorn / ajax-blog-search / src / Plugin.php`
  - JS e CSS sotto `assets /`
- Namespace dedicato `CodeCorn \ AjaxBlogSearch`

---

## Requisiti

- WordPress 5 . x o superiore
- PHP 7 . 4 o superiore consigliato
- jQuery attivo sul frontend ( WordPress lo carica di default sui temi classici )

---

## Struttura del plugin

All interno di `wp-content / mu-plugins` :

```text
mu-plugins /
  mu-cc-ajax-blog-search.php        # bootstrap MU
  codecorn /
    ajax-blog-search /
      index.php                     # stub di sicurezza
      src /
        Plugin.php                  # core del plugin , namespace CodeCorn \ AjaxBlogSearch
      assets /
        js /
          ajax-blog-search.js       # logica AJAX lato client
        css /
          ajax-blog-search.css      # stile minimo risultati ( opzionale )
````

---

## Installazione

1 . Clona la repo dentro `wp-content / mu-plugins` :

```bash
cd wp-content / mu-plugins
git clone https : / / github . com / CodeCornTech / mu-cc-ajax-blog-search . git
```

Assicurati che il file `mu-cc-ajax-blog-search.php` si trovi **direttamente** dentro `mu-plugins /` , e la cartella `codecorn / ajax-blog-search /` sia accanto .

2 . Verifica che WordPress stia caricando il MU plugin :

* vai in **Bacheca → Plugin → Plugin uso obbligato ( Must Use )**
* dovresti vedere `MU CC Ajax Blog Search` nella lista

3 . Verifica che il tema usi un **widget di ricerca** standard , ad esempio il classico widget `Cerca` nella sidebar del blog :

* se il markup contiene `<aside class="widget widget_search">` e un `<form class="search-form">` , il plugin può agganciarsi automaticamente

Non serve alcuna configurazione nel backend .

---

## Come funziona

### Lato PHP

La classe principale `CodeCorn \ AjaxBlogSearch \ Plugin` :

* registra lo script JS e , se presente , il CSS
* espone un endpoint AJAX :

  * `action = cc_ajax_blog_search`
  * disponibile sia per utenti loggati che non loggati
* esegue una query `WP_Query` sui post del blog usando il parametro `s` passato dal client
* restituisce un JSON del tipo :

```json
{
  "success" : true ,
  "data" : {
    "results" : [
      {
        "title" : "Esempio articolo" ,
        "url" : "https : / / sito . it / esempio articolo /" ,
        "date" : "10 Novembre 2025" ,
        "excerpt" : "Estratto accorciato del contenuto …"
      }
    ]
  }
}
```

### Lato JS

Lo script `assets / js / ajax-blog-search.js` :

* cerca tutti i form `.widget_search form . search-form`
* per ciascuno :

  * crea un container `<div class = "cc-ajax-search-results">` subito dopo il form
  * intercetta `submit` del form e i `keyup` nel campo di ricerca
  * effettua una richiesta AJAX a `admin - ajax . php` con :

    * `action = cc_ajax_blog_search`
    * `nonce` per sicurezza
    * parametro `s` con il valore digitato
  * renderizza i risultati sotto il form

Se il campo di ricerca è vuoto , la box risultati viene svuotata .

---

## Personalizzazione

### Limitare a un numero diverso di risultati

Di default vengono restituiti i **5** post più rilevanti .
Nel file `src / Plugin.php` , nell array di query :

```php
'posts_per_page' => 5 ,
```

puoi aumentare o ridurre il valore .

### Limitare la ricerca a una categoria

Puoi aggiungere `cat` o `category__in` agli argomenti della query :

```php
$args = array(
    'post_type'      => 'post' ,
    's'              => $term ,
    'posts_per_page' => 5 ,
    'cat'            => 59 , // id categoria "News"
);
```

Oppure , in una futura versione , leggere il valore da un filtro o costante .

### Traduzioni testi frontend

I testi mostrati dal JS vengono passati tramite `wp_localize_script` :

* `no_results_text`
* `error_text`

Puoi sovrascriverli tramite filtro in un altro MU plugin o nel tema :

```php
add_filter( 'cc_ajax_blog_search_i18n' , function ( $strings ) {
    $strings['no_results_text'] = 'Nessun risultato per la tua ricerca .';
    return $strings;
});
```

( hook da aggiungere in una versione successiva se ti va di internazionalizzare pesante )

---

## Debug

Se vuoi controllare che l AJAX funzioni :

1 . Apri la pagina blog con sidebar
2 . Premi `F12` → tab **Network**
3 . Scrivi nel campo di ricerca almeno 3 caratteri
4 . Dovresti vedere chiamate a :

* `admin - ajax . php ? action = cc_ajax_blog_search & s = ...`

Se la risposta è `200` con un JSON valido , il lato PHP è ok .

Se non vedi il container risultati , verifica il CSS del tema o eventuali conflitti JS .

---

## Roadmap

* Filtro per post type custom
* Opzione per usare un template markup personalizzato via hook PHP
* Supporto per multiple istanze con comportamenti diversi
* Tiny helper per limitare in automatico la ricerca alla categoria del blog corrente

---

## Licenza

MIT . Usa , forka , migliora e mandaci una pull request ✨
