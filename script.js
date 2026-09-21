
(function () {
  "use strict";

  var sobre = window.matchMedia("(prefers-reduced-motion: reduce)");


  (function agenda() {
    var LIEN_CAL = "phoenixroyal78";
    var SCRIPT_CAL = "https://app.cal.com/embed/embed.js";
    var MESSAGE_ECHEC =
      "L'agenda n'a pas pu se charger. Utilisez le lien de réservation " +
      "ci-dessous, ou appelez-moi.";

    var bloc = document.getElementById("agenda");
    var cible = document.getElementById("agenda-cible");

    if (!bloc || !cible) {
      return;
    }

    function amorcer() {
      if (window.Cal) {
        return;
      }

      var empiler = function (destination, args) {
        destination.q.push(args);
      };

      var cal = function () {
        var args = arguments;

        if (args[0] === "init" && typeof args[1] === "string") {
          var espace = args[1];
          var api = function () {
            empiler(api, arguments);
          };
          api.q = [];
          cal.ns[espace] = cal.ns[espace] || api;
          empiler(cal.ns[espace], args);
          empiler(cal, ["initNamespace", espace]);
          return;
        }

        empiler(cal, args);
      };

      cal.ns = {};
      cal.q = [];
      cal.loaded = true; 
      window.Cal = cal;
    }

    function echouer() {
      
      cible.removeAttribute("data-etat");
      cible.textContent = "";

      if (bloc.querySelector(".agenda__erreur")) {
        return;
      }

      var alerte = document.createElement("p");
      alerte.className = "agenda__erreur";
      alerte.setAttribute("role", "alert");
      alerte.textContent = MESSAGE_ECHEC;
      bloc.insertBefore(alerte, bloc.firstChild);
    }

    function charger() {
      amorcer();

      
      cible.setAttribute("data-etat", "attente");

      window.Cal("init", { origin: "https://cal.com" });
      window.Cal("inline", {
        elementOrSelector: "#agenda-cible",
        calLink: LIEN_CAL,
        layout: "month_view"
      });
      window.Cal("ui", {
        layout: "month_view",
        styles: { branding: { brandColor: "#9b1b45" } }
      });

      var script = document.createElement("script");
      script.src = SCRIPT_CAL;
      script.async = true;

      script.addEventListener("load", function () {
        cible.setAttribute("data-etat", "pret");

        if (cible.querySelector("cal-inline, iframe")) {
          return;
        }

        window.setTimeout(function () {
          if (!cible.querySelector("cal-inline, iframe")) {
            echouer();
          }
        }, 6000);
      });

      script.addEventListener("error", function () {
        script.remove();
        echouer();
      });

      document.head.appendChild(script);
    }
    
    var demarre = false;

    function demarrer() {
      if (demarre) {
        return;
      }

      demarre = true;
      charger();
    }

    document.addEventListener("click", function (evenement) {
      var lien = evenement.target.closest ? evenement.target.closest("a[href=\"#reserver\"]") : null;

      if (lien) {
        demarrer();
      }
    });

    window.addEventListener("hashchange", function () {
      if (window.location.hash === "#reserver") {
        demarrer();
      }
    });

    if (window.location.hash === "#reserver" || !("IntersectionObserver" in window)) {
      demarrer();
      return;
    }

    var guetteur = new IntersectionObserver(
      function (entrees) {
        if (entrees[0].isIntersecting) {
          guetteur.disconnect();
          demarrer();
        }
      },
      { rootMargin: "600px 0px" }
    );

    guetteur.observe(bloc);
  })();


  (function bandeau() {
    var barre = document.getElementById("bandeau");

    if (!barre) {
      return;
    }

    var attendu = false;

    function relever() {
      attendu = false;
      barre.classList.toggle("bandeau--pose", window.scrollY > 4);
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!attendu) {
          attendu = true;
          window.requestAnimationFrame(relever);
        }
      },
      { passive: true }
    );

    relever();
  })();


  (function arrivees() {
    var liste = document.getElementById("carte-liste");

    if (!liste || sobre.matches || !("IntersectionObserver" in window)) {
      return;
    }

    var cartes = liste.querySelectorAll(".presta");

    function tout_montrer() {
      cartes.forEach(function (c) {
        c.classList.add("est-entree");
      });
    }

    
    liste.setAttribute("data-anime", "");

    var observateur = new IntersectionObserver(
      function (entrees) {
        entrees.forEach(function (entree) {
          if (entree.isIntersecting) {
            entree.target.classList.add("est-entree");
            observateur.unobserve(entree.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    cartes.forEach(function (c) {
      observateur.observe(c);
    });
    
    window.setTimeout(function () {
      if (!liste.querySelector(".presta.est-entree")) {
        observateur.disconnect();
        tout_montrer();
      }
    }, 3000);
  })();
})();
