# Phoenix Royal — site vitrine et prise de rendez-vous

Site internet d'une coiffeuse indépendante : présentation des prestations et des
informations pratiques, et prise de rendez-vous en ligne.

## Le besoin

La cliente est une prestataire de coiffure travaillant seule. Elle veut :

- une vitrine qui présente ses prestations, leurs durées et leurs tarifs ;
- les informations pratiques : zone d'intervention ou adresse, horaires, moyens
  de paiement, contact, mentions légales ;
- une prise de rendez-vous en ligne, sans appel téléphonique, disponible 24 h/24 ;
- des rendez-vous qui arrivent directement dans son agenda personnel.

### Périmètre de la v1

| Dans le périmètre | Hors périmètre |
| --- | --- |
| Page unique responsive, mobile d'abord | Compte client, historique des visites |
| Catalogue des prestations (durée, tarif) | Caisse enregistreuse, facturation NF525 |
| Informations pratiques et contact | Vente de produits en ligne |
| Prise de RDV déléguée à un service tiers | Moteur de réservation écrit maison |
| Rappel automatique par e-mail avant le RDV | Programme de fidélité |

L'essentiel du trafic viendra d'un téléphone, souvent depuis Instagram ou Google
Maps. Le mobile n'est pas un cas secondaire : c'est le cas principal.

## État actuel

La page est écrite et branchée sur l'agenda Cal.com
(`cal.com/phoenixroyal78`) : accroche, carte des prestations, informations
pratiques, réservation. La structure et le style sont en place.

Les prestations se présentent en liste verticale : une ligne par prestation,
vignette à gauche, nom et tarif sur la même ligne de lecture, description
dessous. Le pouce les parcourt d'un seul geste, celui qu'il fait déjà pour lire
la page.

**Le contenu, lui, est un jeu d'exemple.** Les sept prestations, leurs durées,
leurs tarifs, le secteur, les horaires, le téléphone et le SIREN sont des
valeurs de démonstration, signalées par un encadré en tête d'`index.html`. Elles
doivent être remplacées par les vraies avant toute mise en ligne.

Les sept fichiers d'`images/` ne sont pas des photos : ce sont des cartons
barrés d'une croix, portant le nom de la prestation et la mention « photo à
remplacer ». La croix est là pour qu'aucun ne passe pour une photo à la taille
où il s'affiche, environ 76 px, où le texte n'est plus lisible. Les remplacer
revient à écraser chaque fichier par la vraie photo, en WebP, au même nom,
cadrée en 4:5 et d'au moins 400 × 500 px — et à réécrire l'attribut `alt`.

## Prise de rendez-vous : l'arbitrage

C'est la seule décision structurante du projet. Elle est prise ici plutôt que
dans le code, parce qu'elle détermine ce qu'il reste à écrire.

### L'API Google Calendar en direct

Techniquement possible, mais l'API ne fournit qu'un agenda : elle ne fournit pas
un moteur de réservation. Il faudrait écrire et maintenir le calcul des créneaux
libres à partir des horaires d'ouverture et de la durée de chaque prestation, le
verrouillage contre la double réservation, les courriels de confirmation, les
liens d'annulation et de report, les rappels, un back-office pour bloquer une
demi-journée, et la gestion des données personnelles au sens du RGPD.

C'est plusieurs semaines de développement, puis une maintenance permanente, pour
reproduire un produit qui existe et qui coûte le prix d'une coupe par mois. À
écarter, sauf raison impérieuse.

### Les trois critères éliminatoires

Le besoin se réduit à trois exigences, et la plupart des offres gratuites du
marché échouent sur l'une d'elles :

1. **gratuit**, durablement, pas en essai de trente jours ;
2. **plusieurs prestations** de durées et de tarifs différents ;
3. **le rendez-vous atterrit dans son Google Agenda**, et son agenda personnel
   bloque en retour les créneaux déjà pris.

Le troisième est le plus discriminant : beaucoup d'éditeurs offrent la
réservation et facturent la synchronisation d'agenda, qui est précisément ce
qu'on leur demande.

### Les candidats

Relevé de septembre 2026, à revérifier avant de s'engager : ces offres bougent.
Chaque lien mène à la source consultée, celle de l'éditeur quand elle existe.
**Une ligne fait exception et le dit** : les tarifs des plateformes beauté ne
sont pas publics, ils reposent ici sur des comparatifs de presse.

| Solution | Ce que donne le gratuit | Plusieurs prestations | Google Agenda | Verdict |
| --- | --- | --- | --- | --- |
| **[Cal.com](https://cal.com/pricing)** | Gratuit à vie, 1 utilisatrice, types de RDV et agendas illimités, rappel e-mail par défaut non personnalisable, SMS à l'achat de crédits hors Amérique du Nord, paiements Stripe, module intégrable | Oui | Oui, dans les deux sens | **Retenu** |
| **[Zoho Bookings](https://www.zoho.com/fr/bookings/pricing.html)** | Gratuit à vie, 1 utilisatrice, notifications et rappels e-mail | Oui | Oui, dans les deux sens | Repli solide, éditeur avec hébergement européen |
| **[Google Agenda](https://support.google.com/calendar/answer/16287038?hl=fr)** (natif) | Inclus dans son compte Gmail | **Non — une seule page de réservation, donc une seule durée** | Par construction | Écarté : ni rappels e-mail ni contrôle des conflits multi-agendas sans Google One ou Workspace |
| **[Square Appointments](https://squareup.com/fr/fr/appointments/pricing)** | 1 point de vente, réservation en ligne, **rappels SMS et e-mail inclus**, profils clients | Oui | **Non — réservée au plan Plus, 19 € HT/mois** | Écarté en gratuit ; le meilleur payant d'entrée de gamme |
| **[Setmore](https://www.setmore.com/pricing)** | Jusqu'à 4 utilisateurs, RDV illimités, rappels e-mail | Oui | **Non — synchronisation bidirectionnelle réservée au Pro (~5 $/mois)** | Écarté |
| **[Calendly](https://calendly.com/pricing)** | 1 seul type de RDV actif, 1 connexion d'agenda, **aucun rappel automatique** | **Non** | Oui | Écarté |
| **[SimplyBook.me](https://simplybook.me/fr/pricing)** | 50 RDV/mois, 1 prestataire, 1 fonctionnalité personnalisée | Oui | Non tranché : la page tarifaire ne dit pas si la synchronisation consomme l'unique fonctionnalité personnalisée | Écarté sur le plafond de 50 RDV/mois, sans qu'il soit besoin de trancher |
| Planity, Booksy, Fresha *(tarifs non publics, sources de presse)* | Plus d'offre gratuite en 2026 (~60-95 €/mois, ou commission) | Oui | Oui | Le jour où elle voudra une caisse et un fichier client |

### Décision retenue

**Cal.com, intégré au site.** Le site reste maître de l'expérience et du nom de
domaine ; la réservation est déléguée à un service qui sait déjà faire les
créneaux, les fuseaux, les confirmations et les rappels. L'offre gratuite suffit
pour une praticienne seule, sans limite sur le nombre de prestations, et le
départ reste possible si les conditions tarifaires changent — voir la porte de
sortie plus bas.

Calendly partait avec un avantage réel : le compte existe, il est configuré, et
le prototype le montre déjà à l'œuvre. Ce qui le fait perdre n'est pas sa qualité
mais son offre gratuite — un seul type de rendez-vous actif, alors qu'une coupe,
une couleur et un brushing n'ont ni la même durée ni le même prix. Le garder,
c'est payer l'abonnement dès la deuxième prestation.

**Zoho Bookings** est le repli, à fonctions équivalentes sur le gratuit et avec
un hébergement européen possible. Il s'intègre moins bien dans une page, et son
code étant fermé, la sortie s'y limite à l'export des données.

Le rappel par **SMS** est le point de friction — c'est lui, plus que le rappel
par e-mail, qui fait baisser les rendez-vous non honorés. Une seule offre
gratuite le couvre, celle de Square, mais c'est précisément celle qui ne
synchronise pas Google Agenda : les deux ne se rejoignent qu'à 19 € HT/mois.
Ailleurs, le SMS se paie au crédit ou à l'abonnement. Square est donc le seul
candidat à comparer sérieusement à Cal.com le jour où le SMS deviendra
indispensable.

### Ce que « sécurisé » veut dire ici

Le risque n'est pas l'attaque spectaculaire, c'est la fuite du carnet d'adresses
de ses clientes. Quatre points suffisent à le tenir :

- **le site ne détient rien** — aucune base, aucun serveur applicatif, donc rien
  à voler chez nous. C'est le premier effet de la délégation ;
- **HTTPS partout**, certificat automatique fourni par l'hébergeur statique ;
- **le compte Google de la coiffeuse est le vrai coffre-fort** : c'est lui qui
  détient l'agenda et les coordonnées. Validation en deux étapes obligatoire,
  et relecture des autorisations accordées à l'outil de réservation ;
- **une porte de sortie** : les données s'exportent, et rien ne retient les
  clientes chez l'éditeur — ni place de marché, ni fiche d'établissement qui
  lui appartiendrait. Si les conditions changent, on change de prestataire en
  emportant le carnet. Que Cal.com soit libre (AGPL-3.0) ajoute une réinstallation
  ailleurs, mais elle demande un serveur et une base : c'est un levier pour un
  repreneur technique, pas pour la coiffeuse, et hors du périmètre statique de
  ce dépôt.

**Le site ne stocke aucune donnée personnelle** : pas de formulaire maison, pas
de base, pas de serveur à sécuriser. Cela ne vaut pas exemption : c'est le site
qui provoque la collecte en embarquant le module, ce qui rend l'éditrice
responsable conjointe du traitement avec le prestataire. Les mentions légales et
la politique de confidentialité doivent le nommer.

L'agenda s'affiche sans qu'on ait à le demander, et cela repose sur un relevé :
Cal.com pose trois cookies, tous sur son propre domaine — `__cf_bm` (anti-robot
Cloudflare, 30 minutes), `__Secure-next-auth.csrf-token` et
`__Secure-next-auth.callback-url`, ces deux-là de session. Aucun traceur, rien
dans le stockage local du site. Strictement nécessaires, donc hors du champ du
consentement préalable : pas de bannière à poser. **Ce relevé est à refaire
avant la mise en ligne et à chaque montée de version du module** ; s'il change,
c'est le chargement automatique qu'il faut remettre derrière un geste.

### À confirmer avec la cliente

Ces points conditionnent la configuration, pas l'architecture :

- la liste exacte des prestations, avec durée et tarif ;
- à domicile, en salon, ou les deux — un déplacement impose un temps tampon
  entre deux rendez-vous, et une zone géographique à afficher ;
- l'agenda de référence : Google, Apple ou autre ;
- acompte à la réservation ou non — c'est la parade la plus sérieuse aux
  rendez-vous non honorés, et elle suppose un compte Stripe ;
- rappel par SMS ou non : payant chez le prestataire retenu, au crédit, c'est
  pour cette raison qu'il est resté hors du périmètre v1 ; l'y faire entrer est
  une décision de coût, pas de technique ;
- délai minimum avant un rendez-vous, et délai d'annulation sans frais.

## Stack

Rien de plus que ce que le besoin exige : HTML, CSS et un peu de JavaScript,
sans framework ni étape de compilation. Un site de cette taille n'a pas de dette
à amortir, et la cliente doit pouvoir faire reprendre le code par n'importe qui.

Une seule police, **Merosa**, pour les titres comme pour le texte, **servie
depuis le dépôt** : 28 Ko en woff2. La charger depuis un hébergeur de polices
ferait transiter l'adresse IP de chaque visiteuse vers un tiers, ce que le parti
pris « aucune donnée personnelle » interdit.

Sa licence reste à vérifier auprès de Grezline Studio : le fichier n'en porte
aucune mention, et un usage *webfont* sur un site commercial ne découle pas
d'une licence bureau.

L'hébergement se fera sur une plateforme statique (Netlify, Cloudflare Pages ou
GitHub Pages), en HTTPS, sur son propre nom de domaine.

## Structure

```
index.html    la page ; contenu d'exemple à remplacer, signalé en tête de fichier
style.css     feuille de style
script.js     agenda Cal.com chargé à l'approche de la section, bandeau, arrivées
images/       sept cartons d'attente en WebP, à écraser par ses photos
fonts/        Merosa, en .otf d'origine et en .woff2 dérivé
README.md     ce fichier
```

## Développer

Ouvrir `index.html` dans un navigateur suffit. Pour servir le site comme en
production :

```bash
python3 -m http.server 8000
```

Puis <http://localhost:8000>.

## Suite

1. Interviewer la cliente sur les points laissés ouverts ci-dessus.
2. Figer l'identité visuelle et le contenu réel des prestations.
3. Configurer le compte de réservation et intégrer le module.
4. Mettre en ligne sur son nom de domaine, avec les mentions légales.
