---
title: 'Localisation des interfaces'
description:
  "Langues d'interface prises en charge, comportement de secours et processus de maintenance des traductions Repovio."
---

> Instantané source archivé. Les étiquettes des produits ont été normalisées à Repovio. Pour cette version historique,
> utilisez les identifiants de configuration et les références de conteneur de ses fichiers de déploiement balisés sans
> modification.

Repovio propose son interface Web en anglais (`en`), allemand (`de`), espagnol (`es`), français (`fr`), italien (`it`),
néerlandais (`nl`), polonais (`pl`) et portugais. (`pt`). Le menu de langue dans l’en-tête de l’application est
disponible pour chaque utilisateur connecté. Le choix d'une langue enregistre la préférence dans le cookie du navigateur
`ezrepo-locale` et l'applique lors de vos prochaines visites.

L'anglais est la valeur par défaut et la solution de repli déterministe. Lorsqu'une préférence de navigateur ou un
cookie enregistré n'identifie pas de paramètres régionaux pris en charge, Repovio affiche l'anglais. Le formatage de la
date, de l'heure et des nombres utilise les paramètres régionaux sélectionnés.

<a id="adding-or-updating-a-locale"></a>

## Ajout ou mise à jour d'une locale

1. Ajoutez ou mettez à jour `apps/web/i18n/locales/<locale>.json` en utilisant `en.json` comme référence de clé
   complète.
2. Enregistrez son code de paramètres régionaux, son nom de fichier et son nom d'affichage natif dans
   `apps/web/nuxt.config.ts`.
3. Conservez toutes les clés de message présentes dans `en.json` ; la suite de tests Web vérifie cette parité pour
   chaque langue livrée.
4. Ajoutez des messages en anglais et en allemand pour chaque nouvelle chaîne d'interface visible par l'utilisateur,
   puis ajoutez la traduction correspondante à chaque langue livrée.
5. Exécutez `pnpm --filter @repovio/web test`, `pnpm --filter @repovio/web typecheck` et le test Playwright concerné.

Les noms de fournisseur, les noms de référentiel, les noms de flux de travail et les autres données fournies par le
fournisseur restent inchangés car ils ne constituent pas une copie de l'interface Repovio.
