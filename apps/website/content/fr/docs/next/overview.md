---
title: 'Aperçu du Repovio'
description: 'Exécutions de flux de travail en lecture seule, travail du référentiel et alertes de sécurité chez vos fournisseurs.'
---

Repovio est un tableau de bord auto-hébergé pour les actions GitHub, les pipelines GitLab, les actions Forgejo et les
actions Gitea. Suivez les exécutions de flux de travail, les problèmes et les demandes d'extraction sélectionnés,
identifiez les échecs actuels et envoyez des notifications sans modifier les ressources du fournisseur.

<a id="one-permission-scoped-overview"></a>

## Un aperçu de l'étendue des autorisations

- Inspectez l'état du flux de travail, les dernières exécutions, les tendances, les files d'attente d'approbation et les
  travaux nécessitant une attention particulière.
- Lisez les problèmes et extrayez ou fusionnez les demandes parallèlement à leur activité de flux de travail associée.
- Examinez les métadonnées d'alerte de sécurité prises en charge sans stocker les valeurs secrètes.
- Gérez les adhésions aux référentiels, les destinations de notification cryptées et les connexions des fournisseurs en
  lecture seule.
- Utilisez des comptes locaux, OpenID Connect en option et des jetons d'accès personnels MCP en lecture seule.

Les changements de fournisseur, les approbations, les révisions et les réexécutions de flux de travail restent des
actions externes. Les propres contrôles d'administration du Repovio configurent son suivi et ses notifications locales ;
ils n'accordent pas d'accès en écriture au fournisseur.

Commencez par [installation](/docs/next/installation), puis suivez [connexion et navigation](/docs/next/sign-in). Pour
les opérations de production, voir [déploiement et sauvegardes](/docs/next/deployment).
