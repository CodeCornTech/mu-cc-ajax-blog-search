# Checklist di rilascio

## 1. Stato della repository

```bash
#!/usr/bin/env bash

git status --short
git diff --check
```

Il working tree deve contenere soltanto modifiche intenzionali. Non devono essere presenti stash locali, ZIP, backup, patch di lavorazione o copie `dev`.

## 2. Versione

Verificare che la stessa versione sia dichiarata in:

- header di `mu-plugins/mu-cc-ajax-blog-search.php`;
- costante `MU_CC_ABS_VERSION`;
- `README.md`;
- `CHANGELOG.md`.

```bash
#!/usr/bin/env bash

grep -RIn --exclude-dir=.git \
    -E 'Version:|MU_CC_ABS_VERSION|Versione:' \
    mu-plugins README.md CHANGELOG.md
```

## 3. Sintassi PHP

```bash
#!/usr/bin/env bash

find mu-plugins -name '*.php' -print0 \
    | xargs -0 -n1 php -l
```

Ogni file deve restituire `No syntax errors detected`.

## 4. Sintassi JavaScript

```bash
#!/usr/bin/env bash

for file in \
    mu-plugins/codecorn/ajax-blog-search/assets/js/cc-ajax-blog-search-pre.js \
    mu-plugins/codecorn/ajax-blog-search/assets/js/cc-ajax-blog-search-search.js \
    mu-plugins/codecorn/ajax-blog-search/assets/js/cc-ajax-blog-search-sidebar.js \
    mu-plugins/codecorn/core/js/cc-logger-core-pre.js
do
    node --check "$file"
done
```

## 5. Layout MU

```bash
#!/usr/bin/env bash

test -f mu-plugins/mu-cc-ajax-blog-search.php \
    && printf 'OK entrypoint MU\n'

test -f mu-plugins/codecorn/ajax-blog-search/src/Plugin.php \
    && printf 'OK core PHP\n'

test -f mu-plugins/codecorn/core/js/cc-logger-core-pre.js \
    && printf 'OK logger core\n'
```

Non devono esistere entrypoint PHP aggiuntivi direttamente dentro `mu-plugins/codecorn/`.

## 6. Traduzioni

Rigenerare il POT quando cambiano stringhe traducibili:

```bash
#!/usr/bin/env bash

wp i18n make-pot \
    mu-plugins/codecorn/ajax-blog-search \
    mu-plugins/codecorn/ajax-blog-search/languages/cc-ajax-blog-search.pot \
    --domain=cc-ajax-blog-search

wp i18n make-mo \
    mu-plugins/codecorn/ajax-blog-search/languages
```

## 7. Smoke test WordPress

Verificare almeno:

1. il MU plugin compare nella schermata dei plugin obbligatori;
2. nessun errore PHP viene prodotto con `WP_DEBUG_LOG` attivo;
3. i tre moduli frontend vengono caricati una sola volta;
4. una ricerca valida restituisce risultati coerenti col profilo;
5. un nonce non valido restituisce HTTP 403;
6. il submit nativo continua a funzionare senza JavaScript;
7. thumbnail ed excerpt rispettano i filtri del profilo;
8. il pannello sidebar resta disattivato quando non configurato.

## 8. Diff finale

```bash
#!/usr/bin/env bash

{
    printf '\n===== STATUS =====\n'
    git status -sb

    printf '\n===== DIFF CHECK =====\n'
    git diff --check

    printf '\n===== DIFF STAT =====\n'
    git diff --stat
} | tee /dev/tty | pbcopy
```

## 9. Tag

Dopo il merge su `main`:

```bash
#!/usr/bin/env bash

git switch main
git pull --ff-only origin main
git tag -a 1.2.0 -m 'MU CC Ajax Blog Search 1.2.0'
git push origin 1.2.0
```
