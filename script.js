/* Comportements de la page. Trois morceaux indépendants : chacun vérifie ce
   dont il a besoin et s'abstient si l'élément manque.

   Principe commun : sans ce fichier, la page reste lisible et utilisable. Le
   script ajoute du confort — l'agenda intégré, le filet du bandeau, l'arrivée
   des lignes — jamais une condition d'accès au contenu. */

(function () {
  "use strict";

  var sobre = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* ── 1. L'agenda Cal.com, installé tout seul ────────────────────────────
     Il n'y a rien à cliquer : l'agenda s'installe à l'approche de la section
     Réserver, pour ne pas faire payer ses soixante-dix requêtes à l'ouverture
     de la page. Si le service ne répond pas, le lien direct reste affiché et
     un message le dit — l'échec ne doit jamais être silencieux.

     Les trois cookies posés par Cal.com (anti-bot Cloudflare, jeton anti-CSRF,
     URL de rappel) sont strictement nécessaires : ils n'appellent pas de
     consentement préalable. Si ce constat cesse d'être vrai, c'est ce
     chargement automatique qu'il faut remettre derrière un geste. */

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

    /* embed.js n'installe pas `window.Cal` : il exige de le trouver déjà en
       place, sous forme de file d'attente, et lève une exception sinon. Les
       appels empilés ici sont rejoués par le script une fois chargé. */
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
      cal.loaded = true; // empêche embed.js de réinjecter son propre script
      window.Cal = cal;
    }

    function echouer() {
      // Le conteneur redevient ce qu'il était : rien. Mieux vaut pas de cadre
      // qu'un cadre vide de 34 rem.
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

      // La cible doit avoir sa hauteur avant l'empilement : l'agenda la
      // mesure au moment où il s'insère.
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

        /* Arrivé mais sans rien rendre : le repli vaut mieux qu'un cadre vide.
           Le minuteur n'est armé que si le module n'a encore rien posé, et il
           reconnaît les deux formes possibles — l'élément `cal-inline` comme
           l'iframe. Chercher la seule iframe effacerait un agenda qui marche le
           jour où Cal.com la placerait dans un shadow root. */
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

    /* Le chargement part au premier signe qu'on se dirige vers la réservation,
       pas à l'ouverture de la page : l'agenda tire près de quatre-vingts
       requêtes, qui n'ont pas à concurrencer l'affichage de l'accroche et des
       tarifs.

       Deux signes, parce qu'il y a deux chemins. Celui qui fait défiler arrive
       par l'observateur, avec 600 px d'avance. Celui qui clique « Prendre
       rendez-vous » ou « Réserver » saute d'un coup : l'observateur ne se
       déclencherait qu'une fois arrivé, sans une milliseconde d'avance. Le clic
       sur le lien d'ancre amorce donc le chargement lui-même. */
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

  /* ── 2. Le bandeau prend un filet dès qu'il flotte ──────────────────── */

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

  /* ── 3. L'arrivée des lignes, une fois ──────────────────────────────── */

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

    // `data-anime` conditionne le masquage initial côté CSS : il n'est posé
    // qu'ici, et seulement une fois l'observateur en place.
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

    // Filet de sécurité : si rien n'est apparu au bout de trois secondes,
    // on montre tout. Une prestation invisible est un contenu perdu.
    window.setTimeout(function () {
      if (!liste.querySelector(".presta.est-entree")) {
        observateur.disconnect();
        tout_montrer();
      }
    }, 3000);
  })();
})();
