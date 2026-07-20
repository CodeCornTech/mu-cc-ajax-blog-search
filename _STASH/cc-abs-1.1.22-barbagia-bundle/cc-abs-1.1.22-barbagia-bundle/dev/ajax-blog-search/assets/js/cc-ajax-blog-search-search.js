// @ts-nocheck
/**
 * CC Ajax Blog Search — SEARCH
 *
 * Motore di ricerca AJAX.
 *
 * Responsabilità:
 * - intercettare i form di ricerca WordPress;
 * - intercettare anche i form aggiunti dinamicamente dal tema;
 * - gestire ricerca live tramite evento `input`;
 * - gestire il submit esplicito del form;
 * - inviare la richiesta ad admin-ajax.php;
 * - annullare eventuali richieste precedenti ancora pendenti;
 * - renderizzare risultati, stato vuoto ed errori;
 * - esporre diagnostica dettagliata quando il debug è attivo.
 *
 * Dipendenze:
 * - cc-ajax-blog-search-pre.js:
 *   - window.CC_ABS;
 *   - window.CC_ABS.debounce;
 * - configurazione localizzata:
 *   - window.CC_Ajax_Blog_Search;
 * - jQuery.
 *
 * NON fa:
 * - bootstrap generale del plugin;
 * - inizializzazione del logger core;
 * - rilevamento PHP del contesto WordPress;
 * - gestione sidebar / overlay mobile;
 * - query WordPress lato server.
 *
 * @version 1.1.22
 */

(function (w, $) {
    'use strict';

    // ------------------------------------------------------------
    // Riferimenti runtime
    // ------------------------------------------------------------

    /**
     * Prefisso unico usato dalla diagnostica diretta in console.
     *
     * La diagnostica locale non dipende dal logger grafico CC_LC:
     * deve infatti riuscire a segnalare anche un eventuale problema
     * avvenuto prima o durante il bootstrap del logger stesso.
     */
    const PREFIX = '[CC ABS][SEARCH]';

    /**
     * Configurazione generata lato PHP tramite wp_localize_script().
     *
     * Valore atteso:
     * window.CC_Ajax_Blog_Search = {
     *     ajax_url,
     *     action,
     *     nonce,
     *     debug,
     *     context,
     *     profiles,
     *     show_thumb,
     *     ...
     * }
     */
    const CFG = w.CC_Ajax_Blog_Search || null;

    /**
     * Namespace infrastrutturale creato dal modulo PRE.
     *
     * Contiene almeno:
     * - debounce();
     * - log;
     * - debug;
     * - version.
     */
    const ABS = w.CC_ABS || null;

    /**
     * Profilo normalizzato associato a uno o più form di ricerca.
     *
     * Ogni profilo mantiene indipendenti:
     * - selettori DOM;
     * - scope logico;
     * - post type ammessi;
     * - etichetta mostrata nel dropdown;
     * - abilitazione delle thumbnail.
     *
     * @typedef {Object} CCABSSearchProfileUI
     * @property {'form'|'input-parent'|'selector'} results_anchor
     *     Nodo usato come riferimento geometrico del dropdown.
     * @property {string} results_anchor_selector
     *     Selettore usato quando `results_anchor` vale `selector`.
     * @property {number} results_gap
     *     Distanza in pixel tra il bordo inferiore dell'anchor e il dropdown.
     * @property {boolean} hide_native_clear
     *     Nasconde il pulsante nativo di cancellazione degli input search.
     * @property {boolean} reset_on_close
     *     Svuota input, risultati e richiesta pendente alla chiusura del searchbox.
     * @property {string} close_scope_selector
     *     Contenitore entro cui cercare i controlli di chiusura.
     * @property {Array<string>} close_control_selectors
     *     Selettori dei controlli che chiudono o ripiegano il searchbox.
     */

    /**
     * Profilo normalizzato associato a uno o più form di ricerca.
     *
     * @typedef {Object} CCABSSearchProfile
     * @property {string} id Identificatore univoco del profilo.
     * @property {string} scope Scope logico inviato al server.
     * @property {Array<string>} post_type Post type inviati al server.
     * @property {Array<string>} selectors Selettori dei form associati.
     * @property {string} label Etichetta leggibile del contesto.
     * @property {boolean} show_thumb Abilitazione thumbnail.
     * @property {CCABSSearchProfileUI} ui Configurazione UI del profilo.
     */

    // ------------------------------------------------------------
    // Risoluzione debug
    // ------------------------------------------------------------

    /**
     * Il debug può essere attivato:
     *
     * 1. manualmente da console:
     *      window.AJX_CLP_DBG = true;
     *
     * 2. tramite configurazione localizzata:
     *      CFG.debug = true | 1 | "1" | "true";
     *
     * Viene fatta una normalizzazione esplicita perché wp_localize_script()
     * può produrre valori booleani, numerici oppure stringhe.
     */
    const DEBUG = !!(w.AJX_CLP_DBG === true || CFG?.debug === true || CFG?.debug === 1 || CFG?.debug === '1' || CFG?.debug === 'true');

    /**
     * Logger diagnostico locale.
     *
     * - stampa `error` anche quando il debug è spento;
     * - gli altri livelli vengono stampati solo con debug attivo;
     * - non genera mai eccezioni se la console non è disponibile
     *   oppure se un metodo console non è invocabile.
     *
     * @param {'log'|'info'|'warn'|'error'} level
     * @param {string} message
     * @param {*} [data]
     * @return {void}
     */
    function diag(level, message, data) {
        if (!DEBUG && level !== 'error') {
            return;
        }

        const fn = console[level] || console.log;

        try {
            data === undefined ? fn.call(console, PREFIX, message) : fn.call(console, PREFIX, message, data);
        } catch (_) {
            // La diagnostica non deve mai interrompere la ricerca.
        }
    }

    // ------------------------------------------------------------
    // Diagnostica caricamento modulo
    // ------------------------------------------------------------

    /**
     * Prima sonda:
     * conferma che il file sia stato realmente valutato dal browser
     * e mostra lo stato delle dipendenze al momento dell'esecuzione.
     */
    diag('log', 'module evaluated', {
        jquery: $.fn?.jquery || null,
        hasConfig: !!CFG,
        hasPre: !!ABS,
        config: CFG,
        readyState: document.readyState,
    });

    // ------------------------------------------------------------
    // Guard strutturali
    // ------------------------------------------------------------

    /**
     * Senza configurazione localizzata o namespace PRE non è possibile:
     * - conoscere endpoint / nonce;
     * - leggere il contesto;
     * - usare il debouncer condiviso.
     *
     * In questo caso il modulo termina esplicitamente.
     */
    if (!CFG || !ABS) {
        diag('error', 'bootstrap missing', {
            CC_Ajax_Blog_Search: CFG,
            CC_ABS: ABS,
        });

        return;
    }

    /**
     * Verifica reale del debouncer.
     *
     * Forma corretta:
     *     typeof ABS.debounce !== 'function'
     *
     * Non usare:
     *     !typeof ABS.debounce === 'function'
     *
     * perché `typeof` restituisce una stringa e la negazione verrebbe
     * applicata prima del confronto.
     */
    if (typeof ABS.debounce !== 'function') {
        diag('error', 'CC_ABS.debounce is not a function', ABS);
        return;
    }

    // ------------------------------------------------------------
    // Risoluzione selettori e profili
    // ------------------------------------------------------------

    /**
     * Normalizza una lista di stringhe ricevuta dalla configurazione PHP.
     *
     * La normalizzazione:
     * - scarta valori non stringa;
     * - applica trim;
     * - elimina valori vuoti;
     * - elimina duplicati mantenendo l'ordine.
     *
     * @param {*} value
     * @return {Array<string>}
     */
    function normalizeStringList(value) {
        if (!Array.isArray(value)) {
            return [];
        }

        return [
            ...new Set(
                value
                    .filter((item) => typeof item === 'string')
                    .map((item) => item.trim())
                    .filter(Boolean),
            ),
        ];
    }

    /**
     * Normalizza la configurazione UI facoltativa di un profilo.
     *
     * I default mantengono il comportamento storico:
     * - dropdown ancorato al form;
     * - nessun reset automatico;
     * - controllo nativo dell'input invariato.
     *
     * @param {*} value
     * @return {CCABSSearchProfileUI}
     */
    function normalizeProfileUI(value) {
        const raw = value && typeof value === 'object' && !Array.isArray(value) ? value : {};

        const allowedAnchors = ['form', 'input-parent', 'selector'];
        const requestedAnchor = typeof raw.results_anchor === 'string' ? raw.results_anchor.trim() : 'form';

        const parsedGap = Number.parseFloat(raw.results_gap);

        return {
            results_anchor: allowedAnchors.includes(requestedAnchor) ? requestedAnchor : 'form',
            results_anchor_selector:
                typeof raw.results_anchor_selector === 'string'
                    ? raw.results_anchor_selector.trim()
                    : '',
            results_gap: Number.isFinite(parsedGap) && parsedGap >= 0 ? parsedGap : 8,
            hide_native_clear: raw.hide_native_clear === true,
            reset_on_close: raw.reset_on_close === true,
            close_scope_selector:
                typeof raw.close_scope_selector === 'string'
                    ? raw.close_scope_selector.trim()
                    : '',
            close_control_selectors: normalizeStringList(raw.close_control_selectors),
        };
    }

    /**
     * Selettori provenienti dal contesto storico del plugin.
     *
     * @type {Array<string>}
     */
    const legacySelectors = normalizeStringList(CFG.context?.selectors);

    /**
     * Profilo compatibile con la configurazione precedente
     * all'introduzione dei profili indipendenti per form.
     *
     * Viene usato quando PHP non espone profili espliciti.
     *
     * @type {CCABSSearchProfile}
     */
    const legacyProfile = {
        id: 'legacy',
        scope: typeof CFG.context?.scope === 'string' && CFG.context.scope.trim() ? CFG.context.scope.trim() : 'global',
        post_type: normalizeStringList(CFG.context?.post_type),
        selectors: legacySelectors.length ? legacySelectors : ['.search-form'],
        label: '',
        show_thumb: !!CFG.show_thumb,
        ui: normalizeProfileUI(null),
    };

    /**
     * Profili grezzi generati lato PHP tramite il filtro:
     *
     *     cc_ajax_blog_search_profiles
     *
     * @type {Object<string, Object>}
     */
    const rawProfiles = CFG.profiles && typeof CFG.profiles === 'object' && !Array.isArray(CFG.profiles) ? CFG.profiles : {};

    /**
     * Profili espliciti normalizzati e utilizzabili.
     *
     * I profili senza ID o senza selettori validi vengono scartati.
     *
     * @type {Array<CCABSSearchProfile>}
     */
    const configuredProfiles = Object.entries(rawProfiles)
        .map(([id, config]) => {
            const profileId = typeof id === 'string' ? id.trim() : '';

            const profileSelectors = normalizeStringList(config?.selectors);

            return {
                id: profileId,
                scope: typeof config?.scope === 'string' && config.scope.trim() ? config.scope.trim() : 'global',
                post_type: normalizeStringList(config?.post_type),
                selectors: profileSelectors,
                label: typeof config?.label === 'string' ? config.label.trim() : '',
                show_thumb: typeof config?.show_thumb === 'boolean' ? config.show_thumb : !!CFG.show_thumb,
                ui: normalizeProfileUI(config?.ui),
            };
        })
        .filter((profile) => {
            return profile.id && profile.selectors.length;
        });

    /**
     * Profili effettivamente attivi nella pagina corrente.
     *
     * La presenza di profili espliciti impedisce al selettore legacy
     * di intercettare form estranei alla configurazione corrente.
     *
     * @type {Array<CCABSSearchProfile>}
     */
    const activeProfiles = configuredProfiles.length ? configuredProfiles : [legacyProfile];

    /**
     * Lista piatta e deduplicata dei selettori attivi.
     *
     * @type {Array<string>}
     */
    const selectors = [...new Set(activeProfiles.flatMap((profile) => profile.selectors))];

    /**
     * Selettore aggregato usato dalle scansioni DOM.
     *
     * @type {string}
     */
    const selector = selectors.join(',');

    /**
     * Determina il profilo associato a uno specifico form.
     *
     * I profili vengono controllati nell'ordine ricevuto da PHP.
     * Il primo selettore corrispondente determina il profilo.
     *
     * Un selettore CSS non valido viene ignorato e registrato
     * nella diagnostica senza interrompere gli altri profili.
     *
     * @param {HTMLFormElement|HTMLElement} form
     * @return {CCABSSearchProfile}
     */
    function resolveProfile(form) {
        const matchedProfile = activeProfiles.find((profile) => {
            return profile.selectors.some((profileSelector) => {
                try {
                    return form.matches(profileSelector);
                } catch (error) {
                    diag('warn', 'invalid profile selector', {
                        profile: profile.id,
                        selector: profileSelector,
                        error,
                    });

                    return false;
                }
            });
        });

        return matchedProfile || legacyProfile;
    }


    /**
     * Risolve il nodo che definisce larghezza e posizione del dropdown.
     *
     * Modalità supportate:
     * - `form`: il form completo;
     * - `input-parent`: il contenitore immediato dell'input;
     * - `selector`: un nodo selezionato dentro il form, il form stesso
     *   oppure un suo antenato.
     *
     * Un selettore assente o non valido ricade sempre sul form.
     *
     * @param {JQuery} $form
     * @param {JQuery} $input
     * @param {CCABSSearchProfile} profile
     * @return {JQuery}
     */
    function resolveResultsAnchor($form, $input, profile) {
        const ui = profile.ui || legacyProfile.ui;

        if (ui.results_anchor === 'input-parent') {
            const $parent = $input.parent();

            return $parent.length ? $parent.first() : $form;
        }

        if (ui.results_anchor === 'selector' && ui.results_anchor_selector) {
            try {
                if ($form.is(ui.results_anchor_selector)) {
                    return $form;
                }

                const $inside = $form.find(ui.results_anchor_selector).first();

                if ($inside.length) {
                    return $inside;
                }

                const $closest = $form.closest(ui.results_anchor_selector).first();

                if ($closest.length) {
                    return $closest;
                }
            } catch (error) {
                diag('warn', 'invalid results anchor selector', {
                    profile: profile.id,
                    selector: ui.results_anchor_selector,
                    error,
                });
            }
        }

        return $form;
    }

    /**
     * Risolve i controlli che chiudono o ripiegano il searchbox.
     *
     * La ricerca resta confinata nello scope dichiarato dal profilo.
     * In assenza di scope esplicito viene usato il parent del form.
     *
     * @param {JQuery} $form
     * @param {CCABSSearchProfile} profile
     * @return {JQuery}
     */
    function resolveCloseControls($form, profile) {
        const ui = profile.ui || legacyProfile.ui;

        if (!ui.reset_on_close || !ui.close_control_selectors.length) {
            return $();
        }

        let $scope = $form.parent();

        if (ui.close_scope_selector) {
            try {
                const $resolvedScope = $form.closest(ui.close_scope_selector).first();

                if ($resolvedScope.length) {
                    $scope = $resolvedScope;
                }
            } catch (error) {
                diag('warn', 'invalid close scope selector', {
                    profile: profile.id,
                    selector: ui.close_scope_selector,
                    error,
                });
            }
        }

        const matchedControls = [];

        ui.close_control_selectors.forEach((controlSelector) => {
            try {
                if ($scope.is(controlSelector)) {
                    matchedControls.push($scope.get(0));
                }

                $scope.find(controlSelector).each(function () {
                    matchedControls.push(this);
                });
            } catch (error) {
                diag('warn', 'invalid close control selector', {
                    profile: profile.id,
                    selector: controlSelector,
                    error,
                });
            }
        });

        return $(matchedControls.filter(Boolean));
    }

    /**
     * Seconda sonda:
     * mostra il contesto ricevuto e quanti form sono già presenti
     * al momento della valutazione del modulo.
     *
     * `initialMatches: 0` non è necessariamente un errore:
     * il tema potrebbe aggiungere il popup successivamente.
     */
    diag('log', 'resolved selectors', {
        selectors,
        selector,
        initialMatches: selector ? $(selector).length : 0,
        context: CFG.context || null,
        configuredProfiles,
        activeProfiles,
    });

    // ------------------------------------------------------------
    // Helpers UI locali
    // ------------------------------------------------------------

    /**
     * Mostra il box risultati attraverso la classe prevista dal CSS.
     *
     * @param {JQuery} $box
     * @return {void}
     */
    function showBox($box) {
        $box.addClass('cc-ajax-search-results--visible');
    }

    /**
     * Nasconde e svuota completamente il box risultati.
     *
     * Viene usato quando:
     * - il campo ricerca diventa vuoto;
     * - si deve azzerare lo stato precedente.
     *
     * @param {JQuery} $box
     * @return {void}
     */
    function hideBox($box) {
        $box.removeClass('cc-ajax-search-results--visible').empty();
    }

    /**
     * Costruisce l'URL della ricerca WordPress completa.
     *
     * L'URL conserva il profilo che ha originato la ricerca,
     * permettendo alla SERP WordPress di applicare lo stesso perimetro
     * usato dalla richiesta AJAX.
     *
     * Parametri prodotti:
     * - s;
     * - cc_abs_profile, salvo il profilo legacy;
     * - post_type[];
     * - scope.
     *
     * Il fallback al profilo legacy mantiene compatibilità con
     * eventuali chiamate precedenti prive del secondo parametro.
     *
     * @param {string} term
     * @param {CCABSSearchProfile} [profile]
     * @return {string}
     */
    function buildSearchUrl(term, profile) {
        const resolvedProfile = profile || legacyProfile;
        const params = new URLSearchParams();

        params.set('s', term);

        if (resolvedProfile.id && resolvedProfile.id !== 'legacy') {
            params.set('cc_abs_profile', resolvedProfile.id);
        }

        resolvedProfile.post_type.forEach((postType) => {
            params.append('post_type[]', postType);
        });

        if (resolvedProfile.scope) {
            params.set('scope', resolvedProfile.scope);
        }

        return w.location.origin + '/?' + params.toString();
    }
    /**
     * Costruisce il footer con collegamento alla pagina risultati completa.
     *
     * @param {string} term
     * @param {CCABSSearchProfile} profile
     * @return {string}
     */
    function buildFooter(term, profile) {
        return `
        <div class="cc-ajax-search-footer">
            <a
                class="cc-ajax-search-all"
                href="${buildSearchUrl(term, profile)}"
            >
                Mostra tutti i risultati →
            </a>
        </div>
    `;
    }
    /**
     * Costruisce l'intestazione del box risultati.
     *
     * Il termine viene escapato tramite un nodo jQuery temporaneo,
     * così eventuale markup digitato dall'utente non viene interpretato.
     *
     * @param {string} term
     * @param {CCABSSearchProfile} [profile]
     * @return {string}
     */
    function buildHeader(term, profile) {
        const resolvedProfile = profile || legacyProfile;

        const labels = {
            single: 'singolo',
            archive: 'archivio',
            global: 'globale',
        };

        const scopeLabel = resolvedProfile.label || labels[resolvedProfile.scope] || resolvedProfile.scope || 'ricerca';

        const safeTerm = $('<div>').text(term).html();

        return `
        <div class="cc-ajax-search-heading">
            Risultati per "<strong>${safeTerm}</strong>" — ${scopeLabel}
        </div>
    `;
    }

    /**
     * Renderizza un errore visibile all'utente.
     *
     * I dettagli tecnici vengono inviati solamente alla diagnostica,
     * mentre nel DOM viene inserito il messaggio configurato lato PHP.
     *
     * @param {JQuery} $box
     * @param {*} details
     * @return {void}
     */
    function renderError($box, details) {
        diag('error', 'render error', details);

        $box.html(`<div class="cc-ajax-search-error">${CFG.error_text || 'Errore nella ricerca.'}</div>`);

        showBox($box);
    }

    /**
     * Renderizza la lista dei risultati.
     *
     * Supporta:
     * - stato senza risultati;
     * - layout con thumbnail;
     * - layout senza thumbnail;
     * - data;
     * - excerpt;
     * - footer verso la ricerca completa;
     * - configurazione indipendente per ciascun profilo.
     *
     * @param {JQuery} $box
     * @param {Array<object>} items
     * @param {string} term
     * @param {CCABSSearchProfile} [profile]
     * @return {void}
     */
    function renderResults($box, items, term, profile) {
        const resolvedProfile = profile || legacyProfile;

        diag('log', 'render results', {
            term,
            count: items?.length || 0,
            items,
            profile: {
                id: resolvedProfile.id,
                scope: resolvedProfile.scope,
                post_type: resolvedProfile.post_type,
                show_thumb: resolvedProfile.show_thumb,
            },
        });

        if (!items || !items.length) {
            $box.html(`<div class="cc-ajax-search-empty">${CFG.no_results_text || 'Nessun articolo trovato.'}</div>`);

            showBox($box);
            return;
        }

        let html = buildHeader(term, resolvedProfile) + '<ul class="cc-ajax-search-list">';

        items.forEach((item) => {
            /**
             * La thumbnail viene usata soltanto quando:
             * - la feature è abilitata lato PHP;
             * - il singolo risultato contiene un URL immagine valido.
             */
            const hasThumb = resolvedProfile.show_thumb && item.thumb;

            let itemClass = 'cc-ajax-search-item';

            if (hasThumb) {
                itemClass += ' cc-ajax-search-item--with-thumb';
            }

            html += `<li class="${itemClass}"><a href="${item.url}">`;

            if (hasThumb) {
                /**
                 * Layout con thumbnail:
                 *
                 * ROW
                 * ├── colonna thumbnail
                 * │   ├── immagine
                 * │   └── data
                 * └── colonna contenuto
                 *     ├── titolo
                 *     └── excerpt
                 */
                html += `
                    <!-- START .cc-ajax-search-row -->
                    <span class="cc-ajax-search-row">

                        <!-- START .cc-ajax-search-thumb-col -->
                        <span class="cc-ajax-search-thumb-col">
                            <span class="cc-ajax-search-thumb">
                                <img src="${item.thumb}" alt="">
                            </span>

                            ${item.date ? `<span class="cc-ajax-search-date cc-ajax-search-date--under-thumb">${item.date}</span>` : ''}
                        </span>
                        <!-- END .cc-ajax-search-thumb-col -->

                        <!-- START .cc-ajax-search-body-col -->
                        <span class="cc-ajax-search-body-col">
                            <span class="cc-ajax-search-title">
                                ${item.title}
                            </span>

                            ${item.excerpt ? `<span class="cc-ajax-search-excerpt cc-ajax-search-excerpt--full">${item.excerpt}</span>` : ''}
                        </span>
                        <!-- END .cc-ajax-search-body-col -->

                    </span>
                    <!-- END .cc-ajax-search-row -->
                `;
            } else {
                /**
                 * Fallback senza thumbnail:
                 * layout verticale semplice.
                 */
                html += `
                    <span class="cc-ajax-search-title">${item.title}</span>

                    ${item.date ? `<span class="cc-ajax-search-date">${item.date}</span>` : ''}

                    ${item.excerpt ? `<span class="cc-ajax-search-excerpt">${item.excerpt}</span>` : ''}
                `;
            }

            html += '</a></li>';
        });

        html += '</ul>' + buildFooter(term, resolvedProfile);

        $box.html(html);
        showBox($box);
    }

    // ------------------------------------------------------------
    // Collegamento di un singolo form
    // ------------------------------------------------------------

    /**
     * Inizializza un form di ricerca.
     *
     * Il metodo è idempotente:
     * `data('ccAjaxSearchInited')` impedisce binding multipli
     * quando lo stesso nodo viene incontrato da scansioni successive.
     *
     * @param {HTMLFormElement|HTMLElement} form
     * @param {string} reason Motivo della scansione: dom-ready | mutation
     * @return {boolean} true se il form è stato inizializzato
     */
    function attachForm(form, reason) {
        const $form = $(form);

        // Il form è già stato inizializzato da una scansione precedente.
        if ($form.data('ccAjaxSearchInited')) {
            return false;
        }
        /**
         * Profilo risolto una sola volta per il singolo form.
         *
         * Ogni form conserva così il proprio perimetro anche quando
         * nella pagina sono presenti altri form ABS indipendenti.
         *
         * @type {CCABSSearchProfile}
         */
        const profile = resolveProfile(form);

        $form.attr('data-cc-abs-profile', profile.id);

        if (profile.ui.hide_native_clear) {
            $form.addClass('cc-abs-search--hide-native-clear');
        }

        /**
         * WordPress usa normalmente:
         *     input[name="s"]
         *
         * Il modulo non viene applicato a form che non rispettano
         * questo contratto.
         */
        const $input = $form.find("input[name='s']").first();

        if (!$input.length) {
            diag('warn', 'matched element has no input[name="s"]', {
                reason,
                form,
            });

            return false;
        }

        // Marca il form prima di registrare eventi e creare nodi.
        $form.data('ccAjaxSearchInited', true);

        /**
         * L'anchor viene scelto dal profilo e definisce:
         * - larghezza del dropdown;
         * - bordo inferiore da cui calcolare la posizione verticale;
         * - contesto di posizionamento assoluto.
         */
        const $resultsAnchor = resolveResultsAnchor(
            $form,
            $input,
            profile
        );

        $resultsAnchor
            .addClass('cc-abs-results-anchor')
            .attr('data-cc-abs-results-anchor', profile.id)
            .css(
                '--cc-abs-results-gap',
                `${profile.ui.results_gap}px`
            );

        /**
         * Riutilizza un eventuale box legacy immediatamente successivo
         * al form, quindi lo sposta sotto l'anchor configurato.
         *
         * Lo spostamento è intenzionale: il dropdown deve rispettare
         * larghezza e altezza del form o del wrapper scelto dal profilo.
         */
        let $resultsBox = $form.next('.cc-ajax-search-results');

        if (!$resultsBox.length) {
            $resultsBox = $resultsAnchor
                .children('.cc-ajax-search-results')
                .first();
        }

        if (!$resultsBox.length) {
            $resultsBox = $(
                '<div class="cc-ajax-search-results" aria-live="polite"></div>'
            );
        }

        $resultsBox
            .attr('data-cc-abs-profile', profile.id)
            .appendTo($resultsAnchor);

        /**
         * Riferimento all'ultima richiesta inviata dal singolo form.
         *
         * Viene mantenuto nello scope di attachForm() affinché form diversi
         * possano gestire richieste indipendenti.
         */
        let xhr = null;

        /**
         * Ripristina completamente lo stato del singolo form.
         *
         * Viene usata quando il searchbox viene chiuso o ripiegato:
         * - annulla la richiesta ancora pendente;
         * - svuota il campo;
         * - rimuove risultati ed errori;
         * - conserva il form pronto per una nuova apertura.
         *
         * @param {string} trigger Origine diagnostica del reset.
         * @return {void}
         */
        function resetSearch(trigger) {
            if (xhr && xhr.readyState !== 4) {
                xhr.abort();
                xhr = null;
            }

            $input.val('');
            hideBox($resultsBox);

            diag('log', 'search reset', {
                trigger,
                profile: profile.id,
                form,
            });
        }

        /**
         * Collega gli eventuali controlli di chiusura dichiarati
         * dal profilo. Il core non crea pulsanti aggiuntivi.
         */
        const $closeControls = resolveCloseControls(
            $form,
            profile
        );

        if ($closeControls.length) {
            $closeControls.on(
                'click.ccAbsSearchReset',
                function () {
                    resetSearch('close-control');
                }
            );
        }

        /**
         * Esegue realmente la ricerca.
         *
         * @param {string} trigger Origine: submit | input/debounced
         * @return {void}
         */
        function runSearch(trigger) {
            const term = String($input.val() || '').trim();

            /**
             * Sonda completa prima della richiesta.
             *
             * Permette di verificare:
             * - evento scatenante;
             * - termine;
             * - endpoint;
             * - action;
             * - contesto;
             * - presenza nonce.
             */
            diag('log', 'search triggered', {
                trigger,
                term,
                form,
                ajax_url: CFG.ajax_url,
                action: CFG.action,
                profile: profile.id,
                scope: profile.scope,
                post_type: profile.post_type,
                noncePresent: !!CFG.nonce,
            });

            // Input vuoto: nasconde il dropdown e non interroga il server.
            if (!term) {
                hideBox($resultsBox);
                return;
            }

            /**
             * ajax_url e nonce sono prerequisiti obbligatori.
             *
             * In loro assenza mostriamo immediatamente l'errore,
             * evitando una richiesta destinata a fallire.
             */
            if (!CFG.ajax_url || !CFG.nonce) {
                renderError($resultsBox, {
                    reason: 'missing ajax_url or nonce',
                    ajax_url: CFG.ajax_url,
                    noncePresent: !!CFG.nonce,
                });

                return;
            }

            /**
             * Se l'utente digita nuovamente prima della risposta,
             * la richiesta precedente viene annullata.
             *
             * Evita race condition in cui una risposta vecchia
             * sovrascrive risultati più recenti.
             */
            if (xhr && xhr.readyState !== 4) {
                xhr.abort();
                diag('log', 'previous request aborted');
            }

            /**
             * Richiesta AJAX verso WordPress.
             *
             * Il GET conserva il comportamento storico del plugin.
             * `cache: false` aiuta durante il debug e impedisce al browser
             * di riutilizzare risposte precedenti.
             */
            xhr = $.ajax({
                url: CFG.ajax_url,
                method: 'GET',
                dataType: 'json',
                cache: false,
                data: {
                    action: CFG.action || 'cc_ajax_blog_search',
                    nonce: CFG.nonce,
                    s: term,
                    cc_abs_profile: profile.id !== 'legacy' ? profile.id : '',
                    post_type: profile.post_type,
                    scope: profile.scope,
                },
            })
                .done(function (resp, textStatus, jqXHR) {
                    /**
                     * Risposta HTTP ricevuta e interpretata come JSON.
                     */
                    diag('log', 'AJAX done', {
                        status: jqXHR.status,
                        textStatus,
                        response: resp,
                    });

                    /**
                     * Formato atteso da wp_send_json_success():
                     *
                     * {
                     *     success: true,
                     *     data: {
                     *         results: [...]
                     *     }
                     * }
                     */
                    if (resp && resp.success && resp.data) {
                        renderResults($resultsBox, resp.data.results || [], term, profile);
                    } else {
                        renderError($resultsBox, {
                            reason: 'malformed response',
                            response: resp,
                        });
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    /**
                     * L'abort è intenzionale quando parte una nuova ricerca:
                     * non deve essere mostrato come errore all'utente.
                     */
                    if (textStatus === 'abort') {
                        return;
                    }

                    /**
                     * Per gli errori reali conserviamo:
                     * - status HTTP;
                     * - stato jQuery;
                     * - eccezione;
                     * - corpo grezzo della risposta.
                     */
                    renderError($resultsBox, {
                        status: jqXHR.status,
                        textStatus,
                        errorThrown,
                        responseText: jqXHR.responseText,
                    });
                });
        }

        /**
         * Ricerca live con debounce.
         *
         * Il delay ridotto a 350 ms rende la UI reattiva,
         * evitando comunque una richiesta per ogni singolo carattere.
         */
        const debouncedSearch = ABS.debounce(() => runSearch('input/debounced'), 350);

        /**
         * Submit:
         * - blocca la navigazione standard;
         * - esegue subito la ricerca;
         * - non attende il debounce.
         */
        $form.on('submit.ccAbsSearch', function (event) {
            event.preventDefault();
            runSearch('submit');
        });

        /**
         * Evento `input`:
         * intercetta digitazione, incolla, autofill e modifiche mobile.
         *
         * È più completo del solo `keyup`.
         */
        $input.on('input.ccAbsSearch', function () {
            debouncedSearch();
        });

        /**
         * Conferma finale del binding.
         */
        diag('log', 'form attached', {
            reason,
            form,
            input: $input.get(0),
            profile: {
                id: profile.id,
                scope: profile.scope,
                post_type: profile.post_type,
                selectors: profile.selectors,
                show_thumb: profile.show_thumb,
                ui: profile.ui,
            },
            resultsAnchor: $resultsAnchor.get(0),
            closeControls: $closeControls.length,
        });

        return true;
    }

    // ------------------------------------------------------------
    // Scansione DOM
    // ------------------------------------------------------------

    /**
     * Cerca e inizializza i form presenti dentro una radice DOM.
     *
     * Viene usata:
     * - una prima volta sull'intero document al DOM ready;
     * - successivamente sui nodi aggiunti tramite MutationObserver.
     *
     * @param {Document|HTMLElement|Node} root
     * @param {string} reason
     * @return {number} numero di nuovi form inizializzati
     */
    function scan(root, reason) {
        /**
         * Un selector vuoto rappresenta una disabilitazione esplicita
         * dell'AJAX search per il contesto corrente.
         */
        if (!selector) {
            diag('warn', 'empty selector: AJAX search disabled for this context');

            return 0;
        }

        const $root = $(root || document);
        let attached = 0;

        /**
         * Se il nodo radice stesso corrisponde al selettore,
         * deve essere inizializzato.
         *
         * È importante per MutationObserver:
         * il nodo aggiunto potrebbe essere direttamente il form.
         */
        if ($root.is(selector)) {
            attached += attachForm($root.get(0), reason) ? 1 : 0;
        }

        /**
         * Inizializza anche tutti i form discendenti dalla radice.
         */
        $root.find(selector).each(function () {
            attached += attachForm(this, reason) ? 1 : 0;
        });

        /**
         * Sonda riepilogativa della scansione.
         */
        diag('log', 'scan completed', {
            reason,
            matched: $(selector).length,
            newlyAttached: attached,
        });

        return attached;
    }

    // ------------------------------------------------------------
    // Init
    // ------------------------------------------------------------

    $(function () {
        /**
         * Prima scansione:
         * intercetta i form già presenti al DOM ready.
         */
        scan(document, 'dom-ready');

        /**
         * I popup di ricerca di alcuni temi vengono creati o reinseriti
         * nel DOM soltanto dopo il caricamento iniziale.
         *
         * MutationObserver permette di intercettarli senza:
         * - polling;
         * - timeout arbitrari;
         * - dipendenze da eventi proprietari del tema.
         */
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    /**
                     * Scansioniamo solamente nodi elemento.
                     *
                     * nodeType === 1:
                     * Node.ELEMENT_NODE
                     */
                    if (node.nodeType === 1) {
                        scan(node, 'mutation');
                    }
                });
            });
        });

        /**
         * Osserva aggiunte di nodi in tutto il body.
         */
        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        /**
         * Espone l'observer per diagnostica manuale.
         *
         * Da console:
         *     window.CC_ABS.searchObserver
         *
         * Per fermarlo:
         *     window.CC_ABS.searchObserver.disconnect()
         */
        w.CC_ABS.searchObserver = observer;

        diag('log', 'MutationObserver active');
    });
})(window, jQuery);
