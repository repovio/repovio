---
title: 'Accès aux API'
description: "Ouvrez la documentation de l'API installée et utilisez la référence de l'API statique spécifique à la version."
---

<a id="installed-api-documentation"></a>

## Documentation de l'API installée

Chaque serveur API Repovio propose sa documentation API interactive sur `/docs`. En développement local, ouvrez
`http://localhost:3001/docs`. Les points de terminaison REST utilisent le chemin de base `/api/v1`.

Pour un déploiement, utilisez l'origine de l'API accessible en externe et le chemin configuré par votre proxy inverse.
Par exemple, si le serveur API est exposé sous `https://repovio.example.com`, sa documentation peut être exposée sous
`https://repovio.example.com/docs`. L'application Web ne proxy pas automatiquement cette route ; configurez
explicitement votre proxy si vous souhaitez l'exposer. `/api/v1/docs` n’est pas la voie de documentation.

La référence installée décrit l'application en cours d'exécution. Les requêtes effectuées à partir de cette référence
interactive utilisent votre instance et nécessitent l'authentification et les autorisations documentées pour chaque
opération. Voir [Authentification](/docs/next/authentication) pour la connexion et la configuration du compte. Les
jetons d'accès MCP sont destinés au [Clients MCP](/docs/next/mcp), et non en tant que jetons de support REST généraux.

<a id="static-release-reference"></a>

## Référence de la version statique

Le [Référence API](/docs/next/api-reference) sur ce site Web est un instantané en lecture seule généré à partir de la
révision exacte de l'application de la version sélectionnée. Il ne nécessite aucune instance Repovio en cours
d’exécution et n’envoie pas de requêtes API. Choisissez la version correspondant à votre installation ; la page `/docs`
installée fait autorité pour votre build en cours d'exécution.

Recherchez par méthode, chemin ou description, inspectez les paramètres et les schémas de réponse, ou téléchargez le
JSON OpenAPI complet à partir de la page de référence. Les identifiants de schéma et les descriptions d'API conservent
la langue du contrat généré.
