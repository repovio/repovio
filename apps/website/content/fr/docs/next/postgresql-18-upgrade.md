---
title: Passer de PostgreSQL 17 à 18
description: Transférer les données vers un nouveau volume PostgreSQL 18 et vérifier la restauration.
---

La pile Compose utilise `postgres:18-alpine` et monte son volume nommé dans `/var/lib/postgresql`. PostgreSQL 18 stocke
le cluster dans un sous-répertoire propre à sa version. Les fichiers PostgreSQL 17 ne peuvent pas être réutilisés
directement. Voir la [documentation officielle de l’image](https://hub.docker.com/_/postgres).

Cette procédure sauvegarde la base de l’application puis la restaure dans un **nouveau volume distinct**. Prévoir une
fenêtre de maintenance. Ne pas la combiner avec le [changement de nom](/docs/next/branding-upgrade) : terminer celui-ci
avec la précédente version PostgreSQL 17. Une mise à jour des sources ne lance aucune migration de production
automatiquement.

<a id="before-maintenance"></a>

## Avant la maintenance

- Conserver toute la configuration précédente, son `.env` et le nom exact du volume PostgreSQL 17. Garder son fichier
  Compose dans le répertoire de cette version pour préserver les chemins relatifs des montages et fichiers
  d’environnement.
- Ne pas modifier `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `TOKEN_ENCRYPTION_KEY` ni `AUTH_JWT_SECRET`. La
  clé permet de déchiffrer les identifiants des fournisseurs et notifications.
- Prévoir l’espace pour la sauvegarde et les deux volumes. Protéger les sauvegardes et `.env` comme des secrets.
- La procédure suppose le rôle de base unique de Repovio. Inventorier séparément rôles, droits, extensions et bases
  supplémentaires ; leur sauvegarde par le dump applicatif n’est pas garantie.
- Répéter restauration et vérification avec une copie jetable. `pnpm test:postgres-upgrade` utilise les migrations
  réelles et des données synthétiques uniquement ; il ne valide pas votre sauvegarde de production.

<a id="stop-writers-and-back-up-postgresql-17"></a>

## Arrêter les écritures et sauvegarder PostgreSQL 17

Exécuter ces commandes dans le **répertoire de la version précédente**, avec sa configuration Compose PostgreSQL 17.
Arrêter aussi les autres processus d’écriture externes. Ne pas démarrer la nouvelle application avant la fin de la
restauration et des vérifications.

```sh
umask 077
docker compose stop web api migrate
backup="$PWD/repovio-postgresql17-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T postgres sh -ec \
  'pg_dump --format=custom --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' > "$backup"
docker compose exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose stop postgres
```

Noter les nombres de référence confidentiellement. Valider le dump en le restaurant, pas seulement par sa taille.
Conserver l’ancien volume et sa configuration. Ne jamais exécuter `docker compose down --volumes` ni supprimer un des
volumes de données.

<a id="restore-into-postgresql-18"></a>

## Restaurer dans PostgreSQL 18

Dans le **répertoire de la nouvelle version**, conserver identifiants et clé. Définir `backup` comme chemin absolu de la
sauvegarde. Choisir un nouveau nom de volume unique et l’enregistrer dans `REPOVIO_POSTGRES_VOLUME` du nouveau `.env`,
différent du volume PostgreSQL 17. Utiliser la surcharge de volume externe pour refuser les noms absents ou mal
orthographiés.

```sh
export REPOVIO_POSTGRES_VOLUME=repovio-postgresql18-upgrade
docker volume create "$REPOVIO_POSTGRES_VOLUME"
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait postgres
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'pg_restore --exit-on-error --no-owner --no-privileges --username "$POSTGRES_USER" --dbname "$POSTGRES_DB"' < "$backup"
docker compose -f compose.yml -f compose.upgrade.yml exec -T postgres sh -ec \
  'psql -X --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "SHOW server_version; SHOW data_directory; SELECT count(*) FROM users; SELECT count(*) FROM repositories; SELECT count(*) FROM notification_channels; SELECT count(*) FROM _prisma_migrations;"'
docker compose -f compose.yml -f compose.upgrade.yml run --rm migrate
docker compose -f compose.yml -f compose.upgrade.yml up --detach --wait api web
```

Utiliser un volume réellement neuf et vide ; si ce nom existe, en choisir un autre. Le point d’entrée refuse les anciens
formats, y compris un volume PostgreSQL 17 monté par erreur à la nouvelle racine ; il ne convertit pas les données. Si
la restauration échoue, garder le dump et l’ancien volume, analyser l’erreur et réessayer avec un autre volume vide. Ne
pas restaurer plusieurs fois dans une base partiellement restaurée.

Comparer les nombres de référence et des relations représentatives. Vérifier connexion, autorisations, notifications et
déchiffrement avec la clé conservée. Examiner santé API et journaux confidentiellement. Redémarrer PostgreSQL 18 et
confirmer la persistance avant de terminer la maintenance. Le répertoire par défaut testé est
`/var/lib/postgresql/18/docker`.

<a id="recovery"></a>

## Récupération

Avant toute nouvelle écriture, arrêter la nouvelle pile et redémarrer la version précédente complète avec son volume
PostgreSQL 17 et sa configuration d’origine. Ne jamais laisser les deux piles écrire simultanément. Garder le nouveau
volume pour diagnostic ; PostgreSQL 17 ne doit jamais ouvrir des fichiers PostgreSQL 18.

Après de nouvelles écritures, l’ancien volume est périmé : y revenir perd ces écritures. Prévoir une réconciliation ou
une récupération testée séparément. Restaurer un dump PostgreSQL 18 dans 17 n’est pas une rétrogradation garantie.
Garder volumes et sauvegardes jusqu’à la clôture explicite de la période de récupération par l’opérateur.

<a id="disposable-verification"></a>

## Vérification sur des ressources jetables

```sh
docker build -f apps/api/Dockerfile -t repovio-api:local .
pnpm test:postgres-upgrade
```

Le test crée des conteneurs, un réseau et des volumes aux noms uniques ; applique les migrations Prisma réelles sur les
deux versions ; vérifie initialisation et base fantôme ; refuse un ancien volume mal monté ; restaure un dump ; compare
toutes les tables publiques ; déchiffre un identifiant synthétique ; vérifie persistance après redémarrage et intégrité
des anciennes données. Le nettoyage supprime uniquement ses ressources. Aucun conteneur, volume, base ou identifiant
existant n’est utilisé. Définir `REPOVIO_TEST_API_IMAGE` pour utiliser une autre image applicative construite
localement.
