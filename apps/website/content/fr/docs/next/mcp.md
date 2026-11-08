---
title: 'Accès MCP'
description:
  'Connectez les clients MCP configurables par en-tête aux outils de flux de travail en lecture seule prenant en charge
  les autorisations de Repovio.'
---

Repovio expose un point de terminaison de protocole de contexte de modèle sans état sur `/mcp`. Il fournit un accès en
lecture seule aux mêmes référentiels, exécutions de flux de travail, files d'attente d'échecs, files d'attente
d'approbation, résumés et tendances que l'utilisateur authentifié peut voir dans Repovio.

Le serveur MCP lit la base de données locale Repovio. Il n'appelle pas les API de mutation de fournisseur, ne démarre
pas la synchronisation, n'approuve pas les flux de travail et ne modifie pas la configuration Repovio.

Le même endpoint `/mcp` prend en charge le protocole `2025-06-18` des anciens clients comme Codex et le protocole
moderne `2026-07-28`. Les anciens clients utilisent `initialize` puis `notifications/initialized` ; les clients modernes
envoient les métadonnées du protocole avec chaque requête. Les deux exposent les sept mêmes outils en lecture seule et
authentifient chaque requête avec le jeton Bearer de l’utilisateur actuel. Chaque requête utilise une nouvelle instance
du serveur sans session MCP persistante.

<a id="create-an-access-token"></a>

## Créer un jeton d'accès

Ouvrez **Paramètres**, sélectionnez l'onglet**Accès MCP** et créez un jeton nommé. L'expiration est facultative. Copiez
le jeton complet à partir de la boîte de dialogue de création car Repovio ne l'affiche qu'une seule fois et stocke
uniquement son hachage SHA-256.

La révocation d'un token prend effet à la requête suivante. La suppression de son utilisateur supprime également le
jeton. Les modifications apportées au rôle de l'utilisateur ou aux appartenances au référentiel s'appliquent
immédiatement car chaque demande résout l'autorisation actuelle de la base de données.

<a id="configure-a-client"></a>

## Configurer un client

Utilisez l'origine publique Repovio suivie de `/mcp` et envoyez le token dans l'en-tête d'autorisation :

```text
URL: https://repovio.example.com/mcp
Authorization: Bearer repovio_mcp_REPLACE_WITH_TOKEN
```

La première version cible les clients MCP qui prennent en charge les en-têtes HTTP personnalisés, tels que les clients
d'éditeur et de ligne de commande. Il ne fournit pas de découverte OAuth et ne revendique pas la compatibilité avec les
hôtes qui nécessitent le flux MCP OAuth.

Ne placez jamais le jeton dans une URL, un paramètre de requête, un fichier de configuration suivi, un historique du
shell ou un journal. Préférez le stockage secret du client ou une variable d'environnement non versionnée.

<a id="available-tools"></a>

## Outils disponibles

| Outil                    | Objectif                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `list_repositories`      | Répertoriez les référentiels suivis visibles.                                                |
| `get_repository`         | Lisez un référentiel suivi visible.                                                          |
| `list_workflow_runs`     | Interrogez les exécutions de flux de travail visibles normalisées.                           |
| `list_needs_attention`   | Répertoriez les contextes de workflow dont l’exécution du terminal la plus récente a échoué. |
| `list_awaiting_approval` | Répertoriez les exécutions visibles en cours en attente de l’approbation du fournisseur.     |
| `get_dashboard_summary`  | Résumez l’état visible du flux de travail pour une plage de temps inclusive.                 |
| `get_workflow_trend`     | Regroupez les catégories visibles de tendances de réussite et d’échec.                       |

Les outils de liste contiennent par défaut 25 résultats par page et en acceptent au maximum 100. La sortie de l'outil
contient du JSON structuré et une représentation textuelle correspondante. Les dates utilisent les valeurs ISO 8601 UTC.

Le serveur n'annonce intentionnellement aucune ressource, invite, tâche, abonnement, action du fournisseur ou outil de
configuration MCP.

<a id="reverse-proxy-requirements"></a>

## Exigences du proxy inverse

- Transférez `POST /mcp` vers le conteneur API sans le réécrire dans `/api/v1/mcp`.
- Transférer `Authorization`, `Origin`, `Content-Type`, `Accept`, `MCP-Protocol-Version`, `Mcp-Method` et `Mcp-Name`.
- Utilisez TLS sur le proxy inverse et n'enregistrez pas les en-têtes d'autorisation ni les chaînes de requête de
  requête.
- Ajoutez toutes les origines de navigateur autorisées à `CORS_ORIGIN`. Les requêtes sans en-tête `Origin` restent
  prises en charge pour les clients natifs ; les origines actuelles doivent correspondre à la liste autorisée
  configurée.

<a id="token-administration"></a>

## Administration des jetons

Les utilisateurs gèrent leurs propres jetons dans l'onglet **Accès MCP** sous Paramètres. Les administrateurs système
peuvent inspecter les métadonnées sécurisées des jetons et révoquer un jeton à partir de la page Utilisateurs, mais ne
peuvent pas récupérer son hachage ou son secret en texte brut et ne peuvent pas créer de jeton au nom d'un autre
utilisateur.

<a id="manage-token-states"></a>

## Gérer les états des jetons

La liste des jetons affiche le nom, l'état, le préfixe sécurisé, les horodatages de création/dernière utilisation et
l'expiration facultative. Les noms peuvent contenir au maximum 100 caractères. La révocation nécessite une confirmation.
Un jeton révoqué ou expiré ne peut pas authentifier les demandes futures. Une liste vide signifie qu'aucun jeton
n'existe pour l'utilisateur ; une erreur de chargement propose de réessayer. Copiez le nouveau jeton complet avant de
fermer son affichage unique. Les boîtes de dialogue de jeton d'administrateur autorisent uniquement la liste/la
révocation, jamais la création pour un autre utilisateur.
