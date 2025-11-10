/* CC Ajax Blog Search
 * Aggancia i widget .widget_search e mostra i risultati in un dropdown sotto il campo
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
    $(".widget_search form.search-form").each(function () {
      var $form = $(this);

      if ($form.data("ccAjaxSearchInited")) {
        return;
      }
      $form.data("ccAjaxSearchInited", true);

      var $input = $form.find("input.search-field");
      if (!$input.length) {
        return;
      }

      // Il wrapper del widget diventa il "relativo" per il dropdown
      var $widget = $form.closest(".widget_search");
      if ($widget.length) {
        $widget.css("position", "relative");
      }

      // Box risultati , nascosto di default ( via classe )
      var $resultsBox = $(
        '<div class="cc-ajax-search-results" aria-live="polite"></div>'
      );
      $resultsBox.insertAfter($form);

      function showBox() {
        $resultsBox.addClass("cc-ajax-search-results--visible");
      }

      function hideBox() {
        $resultsBox.removeClass("cc-ajax-search-results--visible").empty();
      }

      function renderResults(items, term) {
        if (!items || !items.length) {
          $resultsBox.html(
            '<div class="cc-ajax-search-empty">' +
              (CC_Ajax_Blog_Search.no_results_text ||
                "Nessun articolo trovato .") +
              "</div>"
          );
          showBox();
          return;
        }

        var html =
          '<div class="cc-ajax-search-heading">Risultati per "<strong>' +
          $("<div>").text(term).html() +
          '</strong>"</div>';
        html += '<ul class="cc-ajax-search-list">';
        items.forEach(function (item) {
          var hasThumb = CC_Ajax_Blog_Search.show_thumb && item.thumb;

          var itemClass = "cc-ajax-search-item";
          if (hasThumb) {
            itemClass += " cc-ajax-search-item--with-thumb";
          }

          html += '<li class="' + itemClass + '">';
          html += '<a href="' + item.url + '">';

          if (hasThumb) {
            // ROW: thumb + title (2 colonne)
            html += '<span class="cc-ajax-search-row">';

            // Colonna thumb + data sotto
            html += '<span class="cc-ajax-search-thumb-col">';
            html += '<span class="cc-ajax-search-thumb">';
            html += '<img src="' + item.thumb + '" alt="">';
            html += "</span>";
            if (item.date) {
              html +=
                '<span class="cc-ajax-search-date cc-ajax-search-date--under-thumb">' +
                item.date +
                "</span>";
            }
            html += "</span>"; // .cc-ajax-search-thumb-col

            // Colonna titolo (solo testo)
            html += '<span class="cc-ajax-search-body-col">';
            html +=
              '<span class="cc-ajax-search-title">' + item.title + "</span>";
            html += "</span>"; // .cc-ajax-search-body-col

            html += "</span>"; // .cc-ajax-search-row

            // Excerpt a 100% sotto la row
            if (item.excerpt) {
              html +=
                '<span class="cc-ajax-search-excerpt cc-ajax-search-excerpt--full">';
              html += item.excerpt;
              html += "</span>";
            }
          } else {
            // Fallback senza thumb: layout semplice verticale
            html +=
              '<span class="cc-ajax-search-title">' + item.title + "</span>";
            if (item.date) {
              html +=
                '<span class="cc-ajax-search-date">' + item.date + "</span>";
            }
            if (item.excerpt) {
              html +=
                '<span class="cc-ajax-search-excerpt">' +
                item.excerpt +
                "</span>";
            }
          }

          html += "</a>";
          html += "</li>";
        });

        html += "</ul>";
        $resultsBox.html(html);
        showBox();
      }

      function renderError() {
        $resultsBox.html(
          '<div class="cc-ajax-search-error">' +
            (CC_Ajax_Blog_Search.error_text || "Errore nella ricerca .") +
            "</div>"
        );
        showBox();
        // debug minimale
        console.error("CC_Ajax_Blog_Search : AJAX error o risposta non valida");
      }

      var doSearch = debounce(function () {
        var term = $input.val().trim();

        // Se campo vuoto → nascondi box
        if (!term) {
          hideBox();
          return;
        }

        $.ajax({
          url: CC_Ajax_Blog_Search.ajax_url,
          method: "GET",
          dataType: "json",
          data: {
            action: "cc_ajax_blog_search",
            nonce: CC_Ajax_Blog_Search.nonce,
            s: term,
          },
        })
          .done(function (resp) {
            if (resp && resp.success && resp.data) {
              renderResults(resp.data.results || [], term);
            } else {
              // Qui NON dovrebbe mai arrivare con il nostro handler ,
              // se succede lo tratti come errore reale .
              renderError();
            }
          })
          .fail(function () {
            renderError();
          });
      }, 300);

      // Submit classico → in AJAX
      $form.on("submit", function (e) {
        e.preventDefault();
        doSearch();
      });

      // Ricerca live
      $input.on("keyup", function (e) {
        if (e.key === "Enter") {
          return;
        }
        doSearch();
      });

      //On blur puoi eventualmente chiudere il dropdown dopo un attimo ( opzionale )
      $input.on("blur", function () {
        setTimeout(hideBox, 200);
      });
    });
  }

  initAjaxSearch();
});
