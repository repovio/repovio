---
title: 'Abonnements à des événements'
description:
  "Choisissez des événements, des filtres de référentiel et des modèles de flux de travail au sein d'un canal."
---

<a id="configure-subscriptions"></a>

## Configurer les abonnements

Les administrateurs système ouvrent un [canal](/docs/v2.0/notifications) et configurent les abonnements aux événements
dans sa boîte de dialogue de création/modification. L'ancienne route `/notifications/rules` redirige vers les canaux ;
il n'y a pas d'écran de gestion des règles séparé. Cette page documente ce flux de travail de dialogue de canal.

Choisissez la réussite, l'échec ou la récupération du flux de travail ; pull-request ouvert, fermé, rouvert ou
fusionné ; problème ouvert, fermé ou rouvert ; et les événements de dépendance, de code ou d'alerte secrète pris en
charge ouverts/résolus. Sélectionnez les restrictions du référentiel pour chaque événement. Une sélection de référentiel
vide signifie tous les référentiels applicables, et non aucun. Les modèles de nom de workflow s'appliquent uniquement
aux événements de workflow. Enregistrez la chaîne pour conserver ses abonnements.

<a id="preview-matches"></a>

## Aperçu des matchs

L'aperçu est disponible uniquement lorsqu'au moins un événement de flux de travail est sélectionné ; les abonnements non
liés au flux de travail le désactivent. Utilisez l’aperçu pour inspecter jusqu’à 20 enregistrements de flux de travail
correspondants récents avant de les enregistrer. Une correspondance confirme les conditions de filtre actuelles par
rapport aux données conservées ; il ne met pas une livraison en file d'attente. Ne distinguez aucune correspondance des
notifications de données jamais synchronisées, d'échec de synchronisation ou de données partielles. Élargissez la
sélection de référentiels/modèles ou inspectez [Tâches de synchronisation](/docs/v2.0/guide-jobs) lorsque les données
sources ne sont pas disponibles.

La synchronisation initiale établit une base de référence silencieuse pour les événements du cycle de vie et n'inonde
pas les canaux avec d'anciennes transitions ouvertes/fermées. Les transitions observées ultérieurement peuvent produire
des livraisons. La disponibilité du fournisseur et les autorisations de lecture limitent les événements de sécurité
pouvant être observés. Repovio ne modifie jamais les ressources du fournisseur pour faire correspondre une règle.

Si l'aperçu ou l'enregistrement échoue, conservez les valeurs du formulaire, vérifiez l'état de l'API et réessayez. Un
aperçu vide ne prouve pas à lui seul qu'aucun événement futur ne correspondra ou que chaque référentiel sélectionné a
été synchronisé avec succès.
