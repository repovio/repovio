---
title: "Alertes d'analyse secrète"
description: 'Examinez les alertes d’analyse secrète avec un accès à la gestion à l’échelle du référentiel.'
---

> Instantané source archivé. Les étiquettes des produits utilisent Repovio. Utilisez les identifiants de configuration
> et les références de conteneur des fichiers de déploiement balisés de cette version sans modification.

<a id="access-and-provider-support"></a>

## Accès et assistance du fournisseur

Ouvrez **Présentation → Alertes de sécurité → Alertes d'analyse secrète**. Les gestionnaires ont besoin d'un accès de
gestion au référentiel ; les administrateurs système peuvent inspecter tous les référentiels. Les téléspectateurs ne
peuvent pas accéder aux données d'alerte. Les listes, les options de filtrage, les compteurs, les détails, l'activité du
référentiel et les métriques du tableau de bord appliquent les mêmes restrictions d'accès.

GitHub prend en charge ce type d'alerte via ses API de sécurité. GitLab mappe les vulnérabilités d'analyse des
dépendances, de SAST et de détection secrète aux vues d'alerte correspondantes, sous réserve des autorisations
d'instance/licence et de jeton. Forgejo et Gitea signalent actuellement que ces types ne sont pas pris en charge. Un
avertissement pour un type indisponible ne fait pas échouer les autres étendues de synchronisation.

<a id="review-findings"></a>

## Examiner les résultats

Utilisez la recherche et les filtres de référentiel, de fournisseur, de gravité et d'état disponibles, le tri, les
colonnes visibles et la pagination. Les états incluent `OPEN`, `RESOLVED` et `DISMISSED` ; la gravité comprend critique,
élevée, moyenne, faible, informative et inconnue. Les filtres secrets incluent en outre le type de secret et le
fournisseur de secret ; n’entrez jamais de valeur secrète réelle. Les limites de date mises à jour et la recherche de
texte spécifique au type permettent de réduire les grandes listes. Sélectionnez un résultat pour inspecter le type de
secret, l'emplacement sûr, l'état de détection et les métadonnées du fournisseur sans la valeur du secret. Repovio
stocke uniquement les métadonnées sur liste blanche ; les charges utiles brutes du fournisseur, les informations
d'identification, les fragments de jetons et les valeurs secrètes ne sont jamais conservés. Les champs manquants peuvent
refléter les capacités du fournisseur plutôt qu'une erreur de traitement.

Utilisez **Ouvrir dans le fournisseur** pour enquêter et corriger le problème. Repovio ne rejette, ne résout, ne rouvre
ni ne modifie les alertes. La première lecture réussie par référentiel et type d'alerte établit une référence
silencieuse. Les transitions ouvertes, résolues, rejetées ou rouvertes ultérieurement peuvent déclencher un
[canaux de notification](/docs/v1.0/notifications) abonné.

<a id="empty-unavailable-and-stale-data"></a>

## Données vides, indisponibles et obsolètes

Effacez les filtres et vérifiez l’appartenance à la direction si aucun résultat n’apparaît. Inspectez
[Tâches de synchronisation](/docs/v1.0/guide-jobs) pour les types non pris en charge ou les avertissements
d’autorisation. Les comptes GitHub OAuth existants peuvent nécessiter une réautorisation avec `security_events` ; voir
[Fournisseur OAuth](/docs/v1.0/provider-oauth). Réessayez les chargements ayant échoué après la récupération ; l'absence
de résultats visibles ne constitue pas une preuve que le fournisseur a analysé le référentiel ou que chaque type
d'alerte est pris en charge.
