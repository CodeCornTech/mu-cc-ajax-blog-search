/* CC Ajax Blog Search
 * Aggancia i widget .widget_search e trasforma il submit in una chiamata AJAX
 */
jQuery(function ($) {

  function debounce(fn, delay) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  function initAjaxSearch() {

    $('.widget_search form.search-form').each(function () {
      var $form = $(this);

      if ($form.data('ccAjaxSearchInited')) {
        return;
      }
      $form.data('ccAjaxSearchInited', true);

      var $input = $form.find('input.search-field');
      if (!$input.length) {
        return;
      }

      var $resultsBox = $('<div class="cc-ajax-search-results" aria-live="polite"></div>');
      $resultsBox.insertAfter($form);

      function renderResults(items, term) {
        if (!items || !items.length) {
          $resultsBox.html(
            '<div class="cc-ajax-search-empty">' +
              (CC_Ajax_Blog_Search.no_results_text || 'Nessun articolo trovato .') +
            '</div>'
          );
          return;
        }

        var html = '<div class="cc-ajax-search-heading">Risultati per "<strong>' +
          $('<div>').text(term).html() + '</strong>"</div>';
        html += '<ul class="cc-ajax-search-list">';

        items.forEach(function (item) {
          html += '<li class="cc-ajax-search-item">';
          html +=   '<a href="' + item.url + '">';
          html +=     '<span class="cc-ajax-search-title">' + item.title + '</span>';
          if (item.date) {
            html +=   '<span class="cc-ajax-search-date">' + item.date + '</span>';
          }
          if (item.excerpt) {
            html +=   '<span class="cc-ajax-search-excerpt">' + item.excerpt + '</span>';
          }
          html +=   '</a>';
          html += '</li>';
        });

        html += '</ul>';
        $resultsBox.html(html);
      }

      function renderError() {
        $resultsBox.html(
          '<div class="cc-ajax-search-error">' +
            (CC_Ajax_Blog_Search.error_text || 'Errore nella ricerca .') +
          '</div>'
        );
      }

      var doSearch = debounce(function () {
        var term = $input.val().trim();
        if (!term) {
          $resultsBox.empty();
          return;
        }

        $.ajax({
          url: CC_Ajax_Blog_Search.ajax_url,
          method: 'GET',
          dataType: 'json',
          data: {
            action: 'cc_ajax_blog_search',
            nonce: CC_Ajax_Blog_Search.nonce,
            s: term
          }
        })
          .done(function (resp) {
            if (resp && resp.success) {
              renderResults(resp.data.results || [], term);
            } else {
              renderError();
            }
          })
          .fail(function () {
            renderError();
          });

      }, 300);

      $form.on('submit', function (e) {
        e.preventDefault();
        doSearch();
      });

      $input.on('keyup', function (e) {
        if (e.key === 'Enter') {
          return;
        }
        doSearch();
      });
    });
  }

  initAjaxSearch();
});
