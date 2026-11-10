---
title: 'Localisation des interfaces'
description: "Langues d'interface prises en charge, comportement de secours et processus de maintenance des traductions Repovio."
---

Repovio prend en charge les 13 langues du site et conserve l’italien, le néerlandais, le polonais et le portugais :
17 langues sont proposées dans l’application. Le portugais (`pt`) et le portugais du Brésil (`pt-BR`) restent distincts.
Le tableau ci-dessous répertorie tous les codes.

L’anglais est la langue par défaut et de repli. Le cookie `repovio-locale` est prioritaire sur une langue de navigateur
prise en charge ; une préférence non prise en charge utilise l’anglais. Changer de langue conserve la route et ses
paramètres de requête. Dates, heures et nombres suivent la langue sans modifier les règles configurées de 24 heures et ISO.
L’arabe et l’ourdou s’affichent de droite à gauche ; les autres langues, de gauche à droite. Noms, identifiants de dépôts,
URL et code provenant des fournisseurs conservent leurs valeurs et un ordre lisible.

<a id="sign-in-controls-and-language-flags"></a>

## Commandes de connexion et drapeaux

Connexion, configuration initiale et menu utilisateur proposent les mêmes noms natifs et drapeaux SVG locaux décoratifs.
Les noms restent les libellés accessibles. Les longs menus défilent et restent utilisables au clavier. Le contrôle reste
occupé pendant tout le téléchargement et bloque les sélections répétées. En cas d’échec, Repovio restaure la langue
précédente et affiche une erreur traduite. Rechargez la page et sélectionnez à nouveau la langue pour réessayer.

Les pages publiques proposent aussi un bouton de thème parcourant Système, Clair et Sombre. Son icône indique la préférence ;
son infobulle et son nom accessible décrivent la préférence actuelle et l’action suivante.

Correspondance entre langue et pays du drapeau :

| Langue | Pays | Langue  | Pays |
| ------ | ---- | ------- | ---- |
| `en`   | GB   | `zh-CN` | CN   |
| `de`   | DE   | `hi`    | IN   |
| `es`   | ES   | `ar`    | SA   |
| `fr`   | FR   | `bn`    | BD   |
| `it`   | IT   | `pt-BR` | BR   |
| `nl`   | NL   | `id`    | ID   |
| `pl`   | PL   | `ur`    | PK   |
| `pt`   | PT   | `ru`    | RU   |
| `ja`   | JP   |         |      |

Les fichiers de `apps/web/public/flags` proviennent de [flag-icons v7.5.0](https://github.com/lipis/flag-icons/tree/v7.5.0), sous la licence MIT incluse. Aucun service externe d’images ou de traduction n’est requis.

<a id="adding-or-updating-a-locale"></a>

## Ajouter ou modifier une langue

1. Utilisez `apps/web/i18n/locales/en.json` comme référence complète actuelle. Traduisez tous les catalogues distribués,
   y compris libellés accessibles, validation, états, paramètres et sens des pluriels.
2. Enregistrez code, balise linguistique, nom natif, fichier, direction, pays et identifiant Nuxt UI dans
   `apps/web/shared/locales.ts`. Préservez les codes existants et distinguez `pt` de `pt-BR`.
3. Associez l’export Nuxt UI installé dans `apps/web/app/utils/locales.ts`, par exemple `zh_cn` ou `pt_br`.
4. Ajoutez le drapeau local avec sa licence et son attribution. N’importez pas l’implémentation du site dans l’application.
5. Exécutez les contrôles et scénarios de navigateur. Les tests comparent les langues du site et de l’application et
   rejettent messages manquants, paramètres incompatibles, syntaxe invalide, associations UI et drapeaux absents. Le repli
   anglais ne remplace pas une traduction complète ; noms de produits et littéraux techniques peuvent rester identiques.

Activez Node.js 26.13.0 et pnpm 11.28.9, démarrez l’application locale, puis exécutez :

```sh
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web exec playwright test tests/e2e/localization.spec.ts \
  tests/e2e/auth-preferences.spec.ts tests/e2e/localization-rtl.spec.ts
```

Examinez les captures claires/sombres et étroites/larges, notamment RTL, CJK et écritures indiennes. Actualisez toutes les traductions courantes de `next` ; les archives de versions publiées restent inchangées.
