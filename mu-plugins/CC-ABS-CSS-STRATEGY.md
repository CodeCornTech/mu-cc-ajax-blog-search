# CC Ajax Blog Search — Strategia CSS pilotabile

## Obiettivo

Separare completamente:

1. struttura del componente;
2. token visivi di default;
3. skin del singolo progetto;
4. skin del singolo profilo di ricerca.

## Livelli

### Core

`cc-ajax-blog-search.css` contiene layout e custom properties neutre.

Non deve contenere:

- palette Barbagia Musei;
- palette Milkare;
- selettori specifici di un sito;
- correzioni di layout appartenenti a un tema specifico.

### Integrazione progetto

Un MU plugin root usa `wp_add_inline_style()` per impostare soltanto i token.

Esempi:

- `bbm_header`;
- `bbm_press`;
- eventuali profili futuri.

### Scoping

Il JavaScript assegna `data-cc-abs-profile`:

- al form;
- al box `.cc-ajax-search-results`.

Il CSS può quindi usare:

```css
.cc-ajax-search-results[data-cc-abs-profile="bbm_header"] {
    --cc-abs-results-bg: #fff;
}
```

Il selettore adiacente viene mantenuto temporaneamente come fallback:

```css
form[data-cc-abs-profile="bbm_header"] + .cc-ajax-search-results
```

## Migrazione

1. Salvare il CSS corrente.
2. Estrarre la sezione `CUSTOM MILKARE` in un file di integrazione separato.
3. Sostituire il CSS core con la versione a token.
4. Aggiungere il MU config Barbagia.
5. Replicare il profile ID sul box risultati.
6. Verificare Header e Press separatamente.
7. Eliminare il selettore adiacente dopo aver confermato il nuovo attributo sul box.

## Verifiche

- nessun colore progetto-specifico nel CSS core;
- nessun `#111111`, `#c1a269`, `#f7f7f7` residuo;
- Header e Press espongono profili diversi;
- la sidebar mobile usa i token globali;
- stato vuoto, errore, thumbnail e footer ereditano la skin corretta.


## Geometria pilotata dal profilo

Ogni profilo può dichiarare:

```php
'ui' => [
    'results_anchor' => 'form', // form | input-parent | selector
    'results_anchor_selector' => '',
    'results_gap' => 8,
    'hide_native_clear' => false,
    'reset_on_close' => false,
    'close_scope_selector' => '',
    'close_control_selectors' => [],
],
```

Il box risultati viene montato dentro l'anchor e posizionato con:

```css
top: calc(100% + var(--cc-abs-results-gap));
width: 100%;
```

Non vengono più usati offset verticali scollegati dall'altezza reale
del form o del wrapper.

## Chiusura del searchbox

Il core non genera pulsanti di chiusura.

Quando un tema ne fornisce già uno, il profilo può:

- nascondere il cancel button nativo dell'input search;
- indicare i controlli di chiusura esistenti;
- svuotare input e dropdown al click;
- annullare una richiesta AJAX ancora pendente.
