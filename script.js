
(function () {
  "use strict";

  var sobre = window.matchMedia("(prefers-reduced-motion: reduce)");


  (function agenda() {
    var LIEN_CAL = "phoenixroyal78";
    var SCRIPT_CAL = "https://app.cal.com/embed/embed.js";
    var TELEPHONE = "06 00 00 00 00";

    /* Le message d'échec porte lui-même ses deux issues, au lieu de renvoyer
       à un lien voisin : la page peut changer, l'encadré reste vrai. */
    var MESSAGE_ECHEC = "L'agenda n'a pas pu se charger. Vous pouvez ";

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
      alerte.appendChild(document.createTextNode(MESSAGE_ECHEC));

      var versCal = document.createElement("a");
      versCal.href = "https://cal.com/" + LIEN_CAL;
      versCal.textContent = "ouvrir la page de réservation";
      alerte.appendChild(versCal);

      alerte.appendChild(document.createTextNode(", ou appeler le "));

      var versTelephone = document.createElement("a");
      versTelephone.href = "tel:+33" + TELEPHONE.replace(/\D/g, "").slice(1);
      versTelephone.textContent = TELEPHONE;
      alerte.appendChild(versTelephone);
      alerte.appendChild(document.createTextNode("."));

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

  /* ── 4. La galerie en perspective ───────────────────────────────────────
*/

  (function galerie() {
    var vitre = document.getElementById("galerie-vitre");
    var liste = document.getElementById("galerie-liste");

    if (!vitre || !liste || sobre.matches || !("ResizeObserver" in window)) {
      return;
    }

    // Réglages repris du composant d'origine.
    var ECART = 40;           // l'espace entre deux photos, en pixels
    var DOUCEUR = 0.02;       // plus c'est bas, plus le glissement traîne
    var ASSOMBRIT = 0.85;     // combien les petites photos s'éteignent
    var ECHELLE_MAX = 2.5;
    var ECHELLE_MIN = 0.1;
    var MOLETTE = 1;
    var GLISSE = 1.5;

    [].slice.call(liste.children).forEach(function (vue) {
      var copie = vue.cloneNode(true);
      copie.setAttribute("aria-hidden", "true");
      liste.appendChild(copie);
    });

    var vues = [].slice.call(liste.children);
    var cible = 0;      // là où la bande doit aller
    var actuel = 0;     // là où elle est vraiment, qui rattrape la cible
    var largeur = 0;
    var largeurVue = 0;
    var pas = 0;
    var image = 0;      // le numéro d'animation en cours, 0 si arrêtée
    var dernier = 0;

    function mesurer() {
      largeur = vitre.clientWidth;
      largeurVue = vues[0].offsetWidth;
      pas = largeurVue + ECART;
    }

    function enroule(valeur, span) {
      return ((valeur % span) + span) % span;
    }

    function placer(ecoule) {
      if (!pas || !largeur) {
        return;
      }

      var span = vues.length * pas;

      if (actuel > span || actuel < -span) {
        var saut = Math.trunc(actuel / span) * span;
        actuel -= saut;
        cible -= saut;
      }
      
      actuel += (cible - actuel) * (1 - Math.pow(1 - DOUCEUR, ecoule * 60));

      var marge = (largeur - largeurVue) / 2;
      var moitie = largeur / 2;

      for (var i = 0; i < vues.length; i += 1) {
        var brut = i * pas - actuel + marge;
        var x = enroule(brut + pas, span) - pas;
        var distance = x + largeurVue / 2 - moitie;
        var echelle;
        var pousse;

        if (distance > 0) {
          echelle = Math.min(ECHELLE_MAX, 1 + distance / largeur);
          pousse = (echelle - 1) * largeurVue * 0.75;
        } else {
          echelle = Math.max(ECHELLE_MIN, 1 + distance / largeur);
          pousse = 0;
        }

        vues[i].style.transform =
          "translate3d(" + (x + pousse) + "px, -50%, 0) scale(" + echelle + ")";

        vues[i].style.filter =
          echelle < 1
            ? "brightness(" +
              (1 - ((1 - echelle) / (1 - ECHELLE_MIN)) * ASSOMBRIT) +
              ")"
            : "none";
      }
    }

    function battement(maintenant) {
      image = window.requestAnimationFrame(battement);
      var ecoule = dernier ? Math.min((maintenant - dernier) / 1000, 0.1) : 1 / 60;
      dernier = maintenant;
      placer(ecoule);
    }

    function demarrer() {
      if (!image) {
        dernier = 0;
        image = window.requestAnimationFrame(battement);
      }
    }

    function arreter() {
      if (image) {
        window.cancelAnimationFrame(image);
        image = 0;
      }
    }

    
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entrees) {
        if (entrees[0].isIntersecting) {
          demarrer();
        } else {
          arreter();
        }
      }).observe(vitre);
    } else {
      demarrer();
    }

    new ResizeObserver(function () {
      mesurer();
      placer(0);
    }).observe(vitre);

    /* Bascule en mode piloté, puis placement immédiat : sans ce premier
       calcul, les photos passeraient par une image empilées au même endroit. */
    vitre.setAttribute("data-slider", "");
    mesurer();
    placer(0);
$

    vitre.addEventListener(
      "wheel",
      function (evenement) {
        if (Math.abs(evenement.deltaX) <= Math.abs(evenement.deltaY)) {
          return;
        }

        evenement.preventDefault();
        cible += evenement.deltaX * MOLETTE;
      },
      { passive: false }
    );

    var doigt = null;
    var dernierX = 0;

    vitre.addEventListener("pointerdown", function (evenement) {
      if (doigt !== null) {
        return;
      }

      doigt = evenement.pointerId;
      dernierX = evenement.clientX;
      vitre.setPointerCapture(doigt);
    });

    vitre.addEventListener("pointermove", function (evenement) {
      if (doigt !== evenement.pointerId) {
        return;
      }

      cible += (dernierX - evenement.clientX) * GLISSE;
      dernierX = evenement.clientX;
    });

    function lacher(evenement) {
      if (doigt !== evenement.pointerId) {
        return;
      }

      if (vitre.hasPointerCapture(doigt)) {
        vitre.releasePointerCapture(doigt);
      }

      doigt = null;
    }

    vitre.addEventListener("pointerup", lacher);
    vitre.addEventListener("pointercancel", lacher);

    // Au clavier : une photo par appui.
    vitre.addEventListener("keydown", function (evenement) {
      var sens = { ArrowRight: 1, ArrowLeft: -1 }[evenement.key];

      if (!sens || evenement.altKey || evenement.ctrlKey || evenement.metaKey) {
        return;
      }

      evenement.preventDefault();
      cible += pas * sens;
    });
  })();
})();
