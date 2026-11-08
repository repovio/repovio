---
title: "A besoin d'attention"
description: 'Examinez les contextes de workflow dont l’exécution la plus récente a échoué.'
---

<a id="current-failures"></a>

## Échecs actuels

Ouvrez **Exécutions du workflow → Attention requise**. Contrairement aux exécutions ayant échoué dans l'historique,
cette file d'attente conserve les contextes de flux de travail exploitables dont l'exécution la plus récente a échoué.
Une exécution réussie plus récente, une modification associée fermée ou une modification fusionnée supprime le contexte
après la synchronisation. Les exécutions plus anciennes à l'échelle d'une branche peuvent être associées à la demande
d'extraction/fusion active au moment de leur démarrage. Le badge de la barre latérale utilise la même file d'attente
avec autorisation.

Recherchez et utilisez les contrôles de table disponibles pour affiner le contexte du workflow/référentiel. Ouvrez son
lien d'exécution externe pour les journaux et les mesures correctives. Ouvrez la modification associée lorsqu'elle est
présente. Repovio ne réexécute, n'annule, ne modifie ou ne répartit jamais les flux de travail.

<a id="diagnose-missing-or-stale-entries"></a>

## Diagnostiquer les entrées manquantes ou obsolètes

Un résultat vide peut être correct après une analyse de remplacement réussie. Pour les pannes plus anciennes, utilisez
[Toutes les exécutions](/docs/next/workflow-runs). Effacez les filtres et vérifiez les adhésions au référentiel avant de
traiter un contexte absent comme des données manquantes. Les actions du fournisseur sont observées de manière
asynchrone ; inspectez [Tâches de synchronisation](/docs/next/guide-jobs) si l’état reste obsolète. Les erreurs de
chargement et de demande sont distinctes d’une file d’attente vide ; réessayez après la récupération de l'API.
