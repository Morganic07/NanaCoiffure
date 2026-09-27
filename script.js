/* Comportements de la page. Quatre morceaux indépendants : chacun vérifie ce
   dont il a besoin et s'abstient si l'élément manque.

   Principe commun : sans ce fichier, la page reste lisible et utilisable. Le
   script ajoute du confort — l'agenda intégré, le filet du bandeau, le lecteur
   de la galerie, l'arrivée des lignes de tarifs et des vidéos — jamais une
   condition d'accès au contenu. */

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


  /* La galerie de vidéos. Sans script, chaque vidéo porte les commandes du
     navigateur et la rangée défile au doigt. Ici on les remplace par un
     lecteur plus sobre, avec trois règles d'usage :
     — une seule vidéo joue à la fois : en lancer une met les autres en pause ;
     — une vidéo qui sort de l'écran, ou un onglet qu'on quitte, s'arrête ;
     — le son est coupé d'office, et le choix de le rétablir vaut pour toutes. */

  (function galerie() {
    var liste = document.getElementById("galerie-liste");

    if (!liste) {
      return;
    }

    var ICONES = {
      lecture: '<svg class="clip__icone--lecture" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
      pause: '<svg class="clip__icone--pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
      muet: '<svg class="clip__icone--muet" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h3.5L12 5v14l-4.5-4H4z"/><path d="M16 9.5l5 5m0-5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
      son: '<svg class="clip__icone--son" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h3.5L12 5v14l-4.5-4H4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>',
      avant: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
      apres: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'
    };

    var avecSon = false;
    var enCours = null;
    var boutonsSon = [];
    var videos = [];

    function creerBouton(classe, contenu) {
      var bouton = document.createElement("button");
      bouton.type = "button";
      bouton.className = classe;
      bouton.innerHTML = contenu;
      return bouton;
    }

    function reglerSon(actif) {
      avecSon = actif;
      videos.forEach(function (v) {
        v.muted = !actif;
      });
      boutonsSon.forEach(function (b) {
        b.setAttribute("aria-pressed", String(actif));
      });
    }

    liste.querySelectorAll(".clip").forEach(function (clip) {
      var video = clip.querySelector("video");
      var legende = clip.querySelector("figcaption");

      if (!video) {
        return;
      }

      var nom = legende ? legende.textContent.trim() : "Réalisation";

      video.removeAttribute("controls");
      video.muted = true;
      videos.push(video);

      var cadre = document.createElement("div");
      cadre.className = "clip__cadre";
      video.parentNode.insertBefore(cadre, video);
      cadre.appendChild(video);

      var lecture = creerBouton(
        "clip__lecture",
        '<span class="clip__pastille">' + ICONES.lecture + ICONES.pause + "</span>"
      );

      var son = creerBouton("clip__son", ICONES.muet + ICONES.son);
      son.setAttribute("aria-label", "Son");
      son.setAttribute("aria-pressed", "false");
      boutonsSon.push(son);

      var progres = document.createElement("div");
      progres.className = "clip__progres";
      progres.setAttribute("aria-hidden", "true");
      var jauge = document.createElement("span");
      progres.appendChild(jauge);

      cadre.appendChild(lecture);
      cadre.appendChild(son);
      cadre.appendChild(progres);

      var alerte = document.createElement("p");
      alerte.className = "clip__alerte";
      alerte.setAttribute("aria-hidden", "true");
      alerte.textContent = "Vidéo indisponible";
      cadre.appendChild(alerte);

      function etiqueter() {
        var action = video.paused ? "Lire la vidéo : " : "Mettre en pause : ";

        if (clip.classList.contains("est-en-echec")) {
          action = "Vidéo indisponible, réessayer : ";
        }

        lecture.setAttribute("aria-label", action + nom);
      }

      function suivre() {
        if (video.duration) {
          jauge.style.setProperty("--avance", String(video.currentTime / video.duration));
        }

        if (!video.paused) {
          window.requestAnimationFrame(suivre);
        }
      }

      /* Fichier introuvable ou illisible : sans cela, la vidéo resterait
         figurée « en lecture » alors que rien ne joue. L'erreur n'arrive
         sur la vidéo que si elle est déclarée par `src` — d'où l'absence de
         `<source>` dans le HTML. */
      function echouer() {
        if (enCours === video) {
          enCours = null;
        }

        video.pause();
        clip.classList.remove("est-en-lecture", "est-entamee");
        clip.classList.add("est-en-echec");
        etiqueter();
      }

      video.addEventListener("error", echouer);

      lecture.addEventListener("click", function () {
        if (!video.paused) {
          video.pause();
          return;
        }

        /* Après un échec, le navigateur ne cherche plus de source de
           lui-même, même si le fichier est revenu : `load()` relance la
           recherche. */
        if (video.networkState === video.NETWORK_NO_SOURCE || video.error) {
          video.load();
        }

        clip.classList.remove("est-en-echec");
        video.muted = !avecSon;
        var promesse = video.play();

        /* Lecture refusée (politique du navigateur, ou lecture interrompue
           par un `load()`) : on revient à l'état de départ au lieu
           d'afficher une pause — sauf si une lecture plus récente a pris le
           relais entre-temps. */
        if (promesse && promesse.catch) {
          promesse.catch(function () {
            if (video.paused) {
              clip.classList.remove("est-en-lecture", "est-entamee");
              etiqueter();
            }
          });
        }
      });

      son.addEventListener("click", function () {
        reglerSon(!avecSon);
      });

      video.addEventListener("play", function () {
        if (enCours && enCours !== video) {
          enCours.pause();
        }

        enCours = video;
        clip.classList.add("est-en-lecture", "est-entamee");
        etiqueter();
        suivre();
      });

      video.addEventListener("pause", function () {
        clip.classList.remove("est-en-lecture");
        etiqueter();
      });

      /* À la fin, la vidéo reprend son affiche : `load()` la remet à zéro,
         et avec `preload="none"` elle ne retélécharge rien avant le prochain
         geste. */
      video.addEventListener("ended", function () {
        if (enCours === video) {
          enCours = null;
        }

        clip.classList.remove("est-en-lecture", "est-entamee");
        jauge.style.setProperty("--avance", "0");
        video.load();
        etiqueter();
      });

      etiqueter();
    });

    if ("IntersectionObserver" in window) {
      var vigie = new IntersectionObserver(
        function (entrees) {
          entrees.forEach(function (entree) {
            if (entree.intersectionRatio < 0.5 && !entree.target.paused) {
              entree.target.pause();
            }
          });
        },
        { threshold: 0.5 }
      );

      videos.forEach(function (v) {
        vigie.observe(v);
      });
    }

    document.addEventListener("visibilitychange", function () {
      if (document.hidden && enCours) {
        enCours.pause();
      }
    });


    /* Le défilé. La rangée défile déjà seule ; on ajoute deux flèches, un
       rail qui situe la partie visible, et les flèches du clavier — que
       `scroll-snap-type: x mandatory` prive de leur effet natif. */

    var cases = liste.querySelectorAll(".galerie__vue");

    if (!cases.length) {
      return;
    }

    liste.setAttribute("data-slider", "");

    var commandes = document.createElement("div");
    commandes.className = "galerie__commandes";

    var piste = document.createElement("div");
    piste.className = "galerie__piste";
    piste.setAttribute("aria-hidden", "true");
    var curseur = document.createElement("span");
    curseur.className = "galerie__curseur";
    piste.appendChild(curseur);

    var avant = creerBouton("galerie__fleche", ICONES.avant);
    avant.setAttribute("aria-label", "Vidéos précédentes");
    avant.setAttribute("aria-controls", "galerie-liste");

    var apres = creerBouton("galerie__fleche", ICONES.apres);
    apres.setAttribute("aria-label", "Vidéos suivantes");
    apres.setAttribute("aria-controls", "galerie-liste");

    commandes.appendChild(piste);
    commandes.appendChild(avant);
    commandes.appendChild(apres);
    liste.parentNode.insertBefore(commandes, liste.nextSibling);

    function pas() {
      var ecart = parseFloat(window.getComputedStyle(liste).columnGap) || 0;
      return cases[0].getBoundingClientRect().width + ecart;
    }

    /* Une vidéo à la fois sur téléphone ; sur grand écran, on avance d'une
       page moins une case, pour garder un repère. */
    function avancer(sens) {
      var nombre = Math.max(1, Math.floor(liste.clientWidth / pas()) - 1);
      liste.scrollBy({ left: sens * nombre * pas() });
    }

    /* `aria-disabled` plutôt que `disabled` : un bouton désactivé perd le
       focus, et la navigation au clavier retomberait en haut de page. */
    function mettreAJour() {
      var reste = liste.scrollWidth - liste.clientWidth;

      commandes.hidden = reste <= 1;
      avant.setAttribute("aria-disabled", String(liste.scrollLeft <= 1));
      apres.setAttribute("aria-disabled", String(liste.scrollLeft >= reste - 1));
      curseur.style.setProperty("--part", String(liste.clientWidth / liste.scrollWidth));
      curseur.style.setProperty("--debut", String(liste.scrollLeft / liste.scrollWidth));
    }

    avant.addEventListener("click", function () {
      if (avant.getAttribute("aria-disabled") !== "true") {
        avancer(-1);
      }
    });

    apres.addEventListener("click", function () {
      if (apres.getAttribute("aria-disabled") !== "true") {
        avancer(1);
      }
    });

    liste.addEventListener("keydown", function (evenement) {
      if (evenement.key !== "ArrowLeft" && evenement.key !== "ArrowRight") {
        return;
      }

      var courante = evenement.target.closest(".galerie__vue");

      if (!courante) {
        return;
      }

      var cible = evenement.key === "ArrowRight"
        ? courante.nextElementSibling
        : courante.previousElementSibling;

      evenement.preventDefault();

      if (!cible) {
        return;
      }

      var bouton = cible.querySelector(".clip__lecture");

      if (bouton) {
        bouton.focus({ preventScroll: true });
      }

      cible.scrollIntoView({ block: "nearest", inline: "start" });
    });

    var attendu = false;

    function planifier() {
      if (!attendu) {
        attendu = true;
        window.requestAnimationFrame(function () {
          attendu = false;
          mettreAJour();
        });
      }
    }

    liste.addEventListener("scroll", planifier, { passive: true });
    window.addEventListener("resize", planifier);
    mettreAJour();
  })();


  /* Deux listes s'animent à l'entrée dans l'écran, de la même façon : les
     lignes de tarifs et les photos de la galerie. Le CSS décrit à quoi
     ressemble l'arrivée ; ici on se contente de poser `data-anime` sur la
     liste, puis `est-entree` sur chaque élément quand il apparaît. */

  [
    { liste: "carte-liste", element: ".presta" },
    { liste: "galerie-liste", element: ".galerie__vue" }
  ].forEach(function (groupe) {
    var liste = document.getElementById(groupe.liste);

    if (!liste || sobre.matches || !("IntersectionObserver" in window)) {
      return;
    }

    var cartes = liste.querySelectorAll(groupe.element);

    function tout_montrer() {
      cartes.forEach(function (c) {
        c.classList.add("est-entree");
      });
    }

    /* `data-anime` conditionne le masquage initial côté CSS : il n'est posé
       qu'ici, et seulement une fois l'observateur prêt. Sans script, rien
       n'est masqué. */
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

    /* Filet de sécurité. Il doit rattraper un observateur en panne, pas une
       visiteuse qui n'est pas encore descendue : une liste hors écran n'a
       rien à rattraper, on repasse plus tard. Sans cette condition, la
       galerie — dernière section de la page — serait révélée avant qu'on
       l'atteigne, et son apparition ne se verrait jamais. */
    function surveiller() {
      var boite = liste.getBoundingClientRect();
      var aLEcran = boite.top < window.innerHeight - 40 && boite.bottom > 40;

      if (!aLEcran) {
        window.setTimeout(surveiller, 2000);
        return;
      }

      if (!liste.querySelector(groupe.element + ".est-entree")) {
        observateur.disconnect();
        tout_montrer();
      }
    }

    window.setTimeout(surveiller, 3000);
  });
})();
