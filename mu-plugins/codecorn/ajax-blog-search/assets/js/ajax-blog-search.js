/* CC Ajax Blog Search
 * Aggancia i widget .widget_search e mostra i risultati in un dropdown sotto il campo
 */
const AJX_CLP_DB = false; // o false in prod

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

  // ===== DEBUG LAYER =====
  var AJX_CLP_DBG = typeof AJX_CLP_DB !== "undefined" && AJX_CLP_DB === true;

  function dbg() {
    if (!AJX_CLP_DBG) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift("[AJX-SIDEBAR]");
    console.log.apply(console, args);
  }
  // =======================

  function initAjaxSearch() {
    dbg("initAjaxSearch: start");
    $(".widget_search form.search-form").each(function () {
      var $form = $(this);

      if ($form.data("ccAjaxSearchInited")) {
        dbg("initAjaxSearch: already inited, skipping form", $form.get(0));
        return;
      }
      $form.data("ccAjaxSearchInited", true);

      var $input = $form.find("input.search-field");
      if (!$input.length) {
        dbg("initAjaxSearch: no search-field found in form", $form.get(0));
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
        dbg("search: showBox");
        $resultsBox.addClass("cc-ajax-search-results--visible");
      }

      function hideBox() {
        dbg("search: hideBox");
        $resultsBox.removeClass("cc-ajax-search-results--visible").empty();
      }

      function renderResults(items, term) {
        dbg("search: renderResults", {
          count: items ? items.length : 0,
          term: term,
        });
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
        items.forEach(function (item, idx) {
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
        dbg("search: renderError");
        $resultsBox.html(
          '<div class="cc-ajax-search-error">' +
            (CC_Ajax_Blog_Search.error_text || "Errore nella ricerca .") +
            "</div>"
        );
        showBox();
        console.error("CC_Ajax_Blog_Search : AJAX error o risposta non valida");
      }

      var doSearch = debounce(function () {
        var term = $input.val().trim();
        dbg("search: doSearch", { term: term });

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
            dbg("search: AJAX done", resp);
            if (resp && resp.success && resp.data) {
              renderResults(resp.data.results || [], term);
            } else {
              renderError();
            }
          })
          .fail(function (jqXHR, textStatus) {
            dbg("search: AJAX fail", textStatus, jqXHR.status);
            renderError();
          });
      }, 300);

      // Submit classico → in AJAX
      $form.on("submit", function (e) {
        dbg("search: form submit intercepted");
        e.preventDefault();
        doSearch();
      });

      // Ricerca live
      $input.on("keyup", function (e) {
        if (e.key === "Enter") {
          return;
        }
        dbg("search: keyup", e.key);
        doSearch();
      });

      // On blur puoi eventualmente chiudere il dropdown dopo un attimo ( opzionale )
      $input.on("blur", function () {
        dbg("search: blur input");
        setTimeout(hideBox, 200);
      });

      dbg("initAjaxSearch: form inited", $form.get(0));
    });
  }

  //===== collapsable - floating sidebar | BEGIN ======= //
  function initSidebarToggle() {
    dbg("sidebar: initSidebarToggle() called");

    if (
      typeof CC_Ajax_Blog_Search === "undefined" ||
      !CC_Ajax_Blog_Search.sidebar_toggle ||
      !CC_Ajax_Blog_Search.sidebar_toggle.enabled
    ) {
      dbg("sidebar: sidebar_toggle disabled or missing, abort");
      return;
    }

    var cfg = CC_Ajax_Blog_Search.sidebar_toggle;
    var breakpoint = cfg.breakpoint || 992;
    var mode = cfg.mode || "floating";
    var label = cfg.label || "Filtri";

    dbg("sidebar: config", cfg);

    var $ = jQuery;

    var $sidebarInner = $(".sidebar.widget_area .sidebar_inner").first();
    if (!$sidebarInner.length) {
      dbg("sidebar: no .sidebar_inner found, abort");
      return;
    }

    // feature davvero attivo
    document.body.classList.add("cc-sidebar-toggle-enabled");
    dbg("sidebar: cc-sidebar-toggle-enabled added to body");

    // placeholder per posizione originale
    var $placeholder = $(
      '<div class="cc-sidebar-placeholder" style="display:none;"></div>'
    );
    $placeholder.insertBefore($sidebarInner);
    dbg("sidebar: placeholder inserted before sidebar_inner");

    // pannello overlay
    var $panel = $('<div class="cc-sidebar-panel"></div>');
    var $panelInner = $('<div class="cc-sidebar-panel__inner"></div>');
    var $close = $(
      '<button type="button" class="cc-sidebar-panel__close" aria-label="Chiudi filtri">&times;</button>'
    );

    $panelInner.append($close);
    $panelInner.append($sidebarInner);
    $panel.append($panelInner);
    $("body").append($panel);
    dbg("sidebar: panel & panelInner appended to body");

    // toggle button
    var toggleClass = "cc-sidebar-toggle";
    if (mode === "top") {
      toggleClass += " cc-sidebar-toggle--top";
    } else {
      toggleClass += " cc-sidebar-toggle--floating";
    }

    var $toggle = $(
      '<button type="button" class="' + toggleClass + '"></button>'
    );
    $toggle.text(label);
    $("body").append($toggle);
    dbg("sidebar: toggle button appended", { mode: mode, label: label });
    // stato iniziale: pannello chiuso
    closePanel();
    
    function isMobile() {
      var mobile = window.innerWidth <= breakpoint;
      dbg("sidebar: isMobile?", mobile, "width:", window.innerWidth);
      return mobile;
    }

    function openPanel() {
      dbg("sidebar: openPanel()");
      $panel.addClass("cc-sidebar-panel--open").show();
      $toggle.addClass("cc-sidebar-toggle--active");
      document.body.classList.add("cc-sidebar-panel-open");
    }

    function closePanel() {
      dbg("sidebar: closePanel()");
      $panel.removeClass("cc-sidebar-panel--open").hide();
      $toggle.removeClass("cc-sidebar-toggle--active");
      document.body.classList.remove("cc-sidebar-panel-open");
    }

    $toggle.on("click", function (e) {
      dbg("sidebar: toggle click", {
        isOpen: $panel.hasClass("cc-sidebar-panel--open"),
        target: e.target,
      });
      if ($panel.hasClass("cc-sidebar-panel--open")) {
        closePanel();
      } else {
        openPanel();
      }
    });

    $close.on("click", function (e) {
      dbg("sidebar: close button click", e.target);
      closePanel();
    });

    // blocca TUTTI gli eventi "primari" dentro il pannello
    $panelInner.on("click mousedown touchstart touchend", function (e) {
      dbg("sidebar: panelInner event", e.type, {
        target: e.target.tagName,
        classes: e.target.className,
      });
      e.stopPropagation();
    });

    // chiudi cliccando SOLO sull’overlay scuro fuori dal pannello
    $panel.on("click mousedown touchstart touchend", function (e) {
      var $target = jQuery(e.target);
      dbg("sidebar: panel overlay event", e.type, {
        target: e.target.tagName,
        classes: e.target.className,
      });

      // se è dentro il contenuto, non chiudere
      if ($target.closest(".cc-sidebar-panel__inner").length) {
        dbg("sidebar: event inside panelInner, ignore");
        return;
      }

      dbg("sidebar: overlay click -> closePanel()");
      closePanel();
    });

    // airbag extra: impedisci che l'input search chiuda il pannello su mobile
    var $interactive = $panelInner.find("input, select, textarea, button, a");

    $interactive.on("click mousedown touchstart touchend", function (e) {
      dbg("sidebar: interactive event", e.type, {
        tag: e.target.tagName,
        classes: e.target.className,
        name: e.target.name,
      });
      e.stopPropagation();
    });

    function handleResize() {
      dbg("sidebar: handleResize()");
      if (isMobile()) {
        // mobile: sidebar dentro pannello, mantieni stato open/close attuale
        if (!$panelInner.find(".sidebar_inner").length) {
          dbg("sidebar: move sidebar_inner INTO panelInner (mobile)");
          $panelInner.append($sidebarInner);
        }

        dbg("sidebar: mobile layout, keep panel state", {
          isOpen: $panel.hasClass("cc-sidebar-panel--open"),
        });

        $toggle.show(); // bottone visibile
        $placeholder.show(); // placeholder mantiene la posizione logica

        // 🔴 IMPORTANTE: QUI NON TOCCHIAMO open/close
        // niente $panel.hide(), niente removeClass, niente toggle.removeClass
      } else {
        // desktop: riportiamo sidebar dov’era e spegniamo tutto
        dbg("sidebar: desktop mode, restore sidebar_inner");
        closePanel();

        if (
          $placeholder.parent().length &&
          !$placeholder.next().is($sidebarInner)
        ) {
          dbg("sidebar: move sidebar_inner AFTER placeholder");
          $sidebarInner.insertAfter($placeholder);
        }

        $toggle.hide();
        $panel.hide();
        $placeholder.hide();
      }
    }

    // init: pannello chiuso
    dbg("sidebar: initial handleResize()");
    handleResize();
    jQuery(window).on("resize", function () {
      dbg("sidebar: window resize");
      handleResize();
    });
  }
  //===== collapsable - floating sidebar | END ======= //

  initAjaxSearch();
  initSidebarToggle(); // collapsed or floating sidebar
});
