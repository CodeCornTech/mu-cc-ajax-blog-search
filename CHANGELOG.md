# Changelog

Tutte le modifiche rilevanti del progetto sono documentate in questo file.

Il progetto segue il versionamento semantico.

## [1.2.0] - 2026-07-20

### Added

- profili indipendenti per form tramite `cc_ajax_blog_search_profiles`;
- supporto a ricerche multi-contesto e multi-post-type;
- moduli frontend separati `pre`, `search` e `sidebar`;
- ancoraggio configurabile del dropdown risultati;
- configurazione per thumbnail ed excerpt per profilo;
- filtri server-side per limite risultati e argomenti `WP_Query`;
- fallback dell'excerpt sul contenuto ripulito da blocchi e shortcode;
- logger frontend condiviso CodeCorn;
- documentazione per profili e checklist di rilascio.

### Changed

- struttura canonica spostata sotto `mu-plugins/codecorn/`;
- unico entrypoint MU mantenuto nella root di `mu-plugins/`;
- requisiti documentati allineati a WordPress 6.0 e PHP 8.0;
- debug JavaScript e PHP disattivati per impostazione predefinita;
- licenza dell'header PHP allineata alla licenza MIT della repository;
- README riscritto sulla base dell'architettura runtime effettiva.

### Removed

- copie `dev`, checkpoint, stash, backup timestampati e patch di lavorazione;
- scaffold 1.0.0 non più compatibile con l'architettura modulare;
- script i18n con destinazione non coerente con il caricamento delle traduzioni;
- documentazione sperimentale duplicata dalla root operativa.

## [1.1.22] - 2026-07-20

### Changed

- consolidamento del reset dell'anchor UI;
- aggiornamento dell'integrazione Barbagia Musei;
- ultimo rilascio precedente alla normalizzazione della repository.
