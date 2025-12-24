// @ts-nocheck
/**
 * CC Ajax Blog Search — SEARCH
 *
 * Motore di ricerca AJAX.
 *
 * Responsabilità:
 * - intercettare i form di ricerca WordPress
 * - gestire input live + submit
 * - inviare richiesta AJAX
 * - renderizzare risultati / errori
 *
 * Dipendenze:
 * - cc-ajax-blog-search-pre.js (CC_ABS, CC_Ajax_Blog_Search)
 * - jQuery
 *
 * NON fa:
 * - bootstrap
 * - logger setup
 * - sidebar / overlay
 *
 * @version 1.1.0
 */

(function (w, $) {
    'use strict';

    // ------------------------------------------------------------
    // Guard PRE
    // ------------------------------------------------------------
    if (!w.CC_ABS || !w.CC_Ajax_Blog_Search) {
        // errore strutturale silenzioso (niente throw in prod)
        console.error('[CC ABS][SEARCH] PRE missing');
        return;
    }

    const { log, debug } = w.CC_ABS;
    const CFG = w.CC_Ajax_Blog_Search;

    // ------------------------------------------------------------
    // Helpers UI locali
    // ------------------------------------------------------------

    function showBox($box) {
        log.log('[AJX-SEARCH]', 'showBox');
        $box.addClass('cc-ajax-search-results--visible');
    }

    function hideBox($box) {
        log.log('[AJX-SEARCH]', 'hideBox');
        $box.removeClass('cc-ajax-search-results--visible').empty();
    }

    function buildSearchUrl(term) {
        const params = new URLSearchParams();
        params.set('s', term);

        const ctx = CFG.context || {};

        // solo se NON global
        if (ctx.scope && ctx.scope !== 'global') {
            if (Array.isArray(ctx.post_type)) {
                ctx.post_type.forEach((pt) => {
                    params.append('post_type[]', pt);
                });
            }
            params.set('scope', ctx.scope);
        }

        return w.location.origin + '/?' + params.toString();
    }

    function buildFooter(term) {
        const url = buildSearchUrl(term);
        return `
            <div class="cc-ajax-search-footer">
                <a class="cc-ajax-search-all" href="${url}">
                    Mostra tutti i risultati →
                </a>
            </div>
        `;
    }

    function buildHeader(term, count) {
        const scope = CFG.context?.scope || 'global';
        const scopeLabel = w.CC_ABS && typeof w.humanScope === 'function' ? w.humanScope(scope) : scope;

        const safeTerm = $('<div>').text(term).html();
        let text = `Risultati per "<strong>${safeTerm}</strong>" — ${scopeLabel}`;

        return `<div class="cc-ajax-search-heading">${text}</div>`;
    }

    function renderError($box) {
        log.warn('[AJX-SEARCH]', 'renderError');
        $box.html(`<div class="cc-ajax-search-error">${CFG.error_text || 'Errore nella ricerca .'}</div>`);
        showBox($box);
    }

    function renderResults($box, items, term) {
        log.log('[AJX-SEARCH]', 'renderResults', {
            count: items ? items.length : 0,
            term,
        });

        if (!items || !items.length) {
            $box.html(`<div class="cc-ajax-search-empty">${CFG.no_results_text || 'Nessun articolo trovato .'}</div>`);
            showBox($box);
            return;
        }

        let html = buildHeader(term, items?.length || 0);
        html += '<ul class="cc-ajax-search-list">';

        items.forEach((item) => {
            const hasThumb = CFG.show_thumb && item.thumb;
            let itemClass = 'cc-ajax-search-item';
            if (hasThumb) itemClass += ' cc-ajax-search-item--with-thumb';

            html += `<li class="${itemClass}"><a href="${item.url}">`;

            // ROW: thumb + title (2 colonne)
            // Colonna thumb + data sotto
            // Title
            // EXCERPT
            if (hasThumb) {
                html += `
                <!-- START cc-ajax-search-row -->
                    <span class="cc-ajax-search-row">
                    <!-- START-->
                        <span class="cc-ajax-search-thumb-col">
                            <span class="cc-ajax-search-thumb">
                                <img src="${item.thumb}" alt="">
                            </span>
                            ${item.date ? `<span class="cc-ajax-search-date cc-ajax-search-date--under-thumb">${item.date}</span>` : ''}
                        </span>
                        <span class="cc-ajax-search-body-col">
                            <span class="cc-ajax-search-title">${item.title}</span>
                            ${item.excerpt ? `<span class="cc-ajax-search-excerpt cc-ajax-search-excerpt--full">${item.excerpt}</span>` : ''}
                            <!-- END excerpt -->
                        </span> <!-- CLOSE .cc-ajax-search-body-col -->
                    </span> <!-- CLOSE .cc-ajax-search-row -->
                `;
            } else {
                // Fallback senza thumb: layout semplice verticale

                html += `
                    <span class="cc-ajax-search-title">${item.title}</span>
                    ${item.date ? `<span class="cc-ajax-search-date">${item.date}</span>` : ''}
                    ${item.excerpt ? `<span class="cc-ajax-search-excerpt">${item.excerpt}</span>` : ''}
                `;
            }

            html += '</a></li>';
        });

        html += '</ul>';
        html += buildFooter(term);

        $box.html(html);
        showBox($box);
    }

    // ------------------------------------------------------------
    // Core
    // ------------------------------------------------------------
    function initAjaxSearch() {
        log.log('[AJX-SEARCH]', 'initAjaxSearch:start');

        const selectors = (CFG.context && CFG.context.selectors) || ['.search-form'];

        $(selectors.join(',')).each(function () {
            const $form = $(this);
            if ($form.data('ccAjaxSearchInited')) return;
            $form.data('ccAjaxSearchInited', true);

            const $input = $form.find("input[name='s']");
            if (!$input.length) return;

            // wrapper relativo per dropdown
            const $widget = $form.closest('.widget_search');
            if ($widget.length) $widget.css('position', 'relative');

            // risultati
            const $resultsBox = $('<div class="cc-ajax-search-results" aria-live="polite"></div>');
            $resultsBox.insertAfter($form);
            if (!typeof w.CC_ABS?.debounce === 'function') {
                return log.error('[AJX-SEARCH]', 'fail w.CC_ABS.debounce isnt a function');
            }
            const doSearch = w.CC_ABS.debounce(function () {
                const term = $input.val().trim();
                log.log('[AJX-SEARCH]', 'doSearch', { term });

                if (!term) {
                    hideBox($resultsBox);
                    return;
                }

                $.ajax({
                    url: CFG.ajax_url,
                    method: 'GET',
                    dataType: 'json',
                    data: {
                        action: CFG.action || 'cc_ajax_blog_search',
                        nonce: CFG.nonce,
                        s: term,
                        post_type: CFG.context?.post_type,
                        scope: CFG.context?.scope,
                    },
                })
                    .done(function (resp) {
                        if (resp && resp.success && resp.data) {
                            renderResults($resultsBox, resp.data.results || [], term);
                        } else {
                            renderError($resultsBox);
                        }
                    })
                    .fail(function () {
                        renderError($resultsBox);
                    });
            }, 950);

            // eventi
            $form.on('submit', function (e) {
                e.preventDefault();
                doSearch();
            });

            $input.on('keyup', function (e) {
                if (e.key === 'Enter') return;
                doSearch();
            });

            $input.on('blur', function () {
                // opzionale: setTimeout(() => hideBox($resultsBox), 200);
            });
        });
    }

    // ------------------------------------------------------------
    // Init
    // ------------------------------------------------------------
    $(function () {
        initAjaxSearch();
    });
})(window, jQuery);
