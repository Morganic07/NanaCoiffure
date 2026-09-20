/* Chargement de l'agenda Cal.com à la demande.

   Rien du service tiers n'est appelé tant que la visiteuse n'a pas cliqué :
   aucune requête, aucun cookie au chargement de la page. Si le script ne
   répond pas, le lien direct vers la page de réservation reste affiché et un
   message le dit — l'échec ne doit jamais être silencieux. */

(function () {
  "use strict";

  var LIEN_CAL = "phoenixroyal78";
  var SCRIPT_CAL = "https://app.cal.com/embed/embed.js";
  var MESSAGE_ECHEC =
    "L'agenda n'a pas pu se charger. Utilisez le lien de réservation " +
    "ci-dessous, ou appelez-moi.";

  var bouton = document.getElementById("agenda-bouton");
  var accueil = document.getElementById("agenda-accueil");
  var cible = document.getElementById("agenda-cible");

  if (!bouton || !accueil || !cible) {
    return;
  }

  /* embed.js n'installe pas `window.Cal` : il exige de le trouver déjà en
     place, sous forme de file d'attente, et lève une exception sinon. Les
     appels empilés ici sont rejoués par le script une fois chargé. */
  function amorcer() {
    if (window.Cal) {
      return;
    }

    var empiler = function (cible, args) {
      cible.q.push(args);
    };

    var cal = function () {
      var args = arguments;

      if (args[0] === "init") {
        var espace = args[1];

        if (typeof espace === "string") {
          var api = function () {
            empiler(api, arguments);
          };
          api.q = [];
          cal.ns[espace] = cal.ns[espace] || api;
          empiler(cal.ns[espace], args);
          empiler(cal, ["initNamespace", espace]);
          return;
        }
      }

      empiler(cal, args);
    };

    cal.ns = {};
    cal.q = [];
    cal.loaded = true; // empêche embed.js de réinjecter son propre script
    window.Cal = cal;
  }

  function echouer() {
    bouton.disabled = false;
    bouton.textContent = "Voir les créneaux";
    accueil.hidden = false;
    cible.hidden = true;

    var deja = accueil.querySelector(".agenda__erreur");
    if (deja) {
      return;
    }

    var alerte = document.createElement("p");
    alerte.className = "agenda__erreur";
    alerte.setAttribute("role", "alert");
    alerte.textContent = MESSAGE_ECHEC;
    accueil.appendChild(alerte);
  }

  function charger() {
    amorcer();

    // La cible doit être visible avant l'empilement : l'agenda calcule sa
    // hauteur au moment où il s'insère.
    cible.hidden = false;

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
      if (!document.querySelector("#agenda-cible cal-inline, #agenda-cible iframe")) {
        // Le script est arrivé mais n'a rien rendu : le repli vaut mieux
        // qu'un cadre vide.
        window.setTimeout(function () {
          if (!cible.querySelector("iframe")) {
            echouer();
          }
        }, 5000);
      }

      accueil.hidden = true;
      cible.setAttribute("tabindex", "-1");
      cible.focus();
    });

    script.addEventListener("error", function () {
      script.remove();
      echouer();
    });

    document.head.appendChild(script);
  }

  bouton.addEventListener("click", function () {
    bouton.disabled = true;
    bouton.textContent = "Chargement de l'agenda…";
    charger();
  });
})();
