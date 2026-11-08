---
title: 'Configuration du webhook du référentiel'
description: 'Configurez les webhooks signés en lecture seule pour les référentiels GitHub, GitLab, Forgejo et Gitea.'
---

> Instantané source archivé. Les étiquettes des produits utilisent Repovio. Utilisez les identifiants de configuration
> et les références de conteneur des fichiers de déploiement balisés de cette version sans modification.

Repovio peut recevoir des webhooks signés pour synchroniser un référentiel suivi plus tôt que son intervalle
d'interrogation normal. Il ne crée, ne met à jour, ne supprime ou ne teste jamais les webhooks via les API du
fournisseur. Un administrateur configure manuellement chaque webhook de référentiel dans GitHub, GitLab, Forgejo ou
Gitea.

Ouvrez les **Dépôts**, sélectionnez un dépôt suivi et utilisez sa carte**Webhook de dépôt**. La carte affiche l'URL de
rappel spécifique au référentiel, génère ou accepte un secret de signature et signale la dernière livraison acceptée.
Repovio n'envoie jamais cette configuration au fournisseur.

Les webhooks sont une optimisation, pas une source de vérité. La charge utile signée doit identifier le référentiel
sélectionné par l'URL de rappel. Repovio lit ensuite les données actuelles via l'adaptateur fournisseur en lecture seule
configuré. Les livraisons acceptées mettent en file d'attente une synchronisation durable du référentiel ; les
livraisons reçues dans les 15 secondes sont regroupées. L'intervalle d'interrogation de secours par défaut est de 30
minutes.

<a id="configure-a-repository-webhook"></a>

## Configurer un webhook de référentiel

1. Ajoutez le référentiel à Repovio et ouvrez sa carte **Webhook du référentiel**.
2. Copiez l'URL de rappel.
3. Générez un secret de signature unique à haute entropie ou collez le jeton de signature exact fourni par le
   fournisseur. Ne réutilisez jamais un jeton d'accès ou le secret d'un autre référentiel.
4. Enregistrez le secret. Repovio le crypte avec AES-256-GCM et ne le renvoie jamais via l'API.
5. Configurez l'URL de rappel et le secret dans les paramètres du fournisseur de ce référentiel.
6. Gardez la vérification TLS activée et envoyez une livraison test.

Les rappels stables utilisent `/api/webhooks/<provider>/<repository-id>`. Des rappels
`/api/v1/webhooks/<provider>/<repository-id>` versionnés sont également disponibles. Les URL de rappel de compte de
fournisseur à partir de Repovio 0.2.9 et versions antérieures ne sont plus acceptées. Après la mise à niveau, recréez
chaque webhook avec son rappel de référentiel et un nouveau secret de référentiel.

Les livraisons réussies renvoient HTTP `202` avec `{ "accepted": true }`. Les ID de remise du fournisseur répétés
renvoient `{ "accepted": true, "duplicate": true }` et ne mettent pas en file d’attente une autre synchronisation. Les
référentiels inconnus ou désactivés, les comptes de fournisseur désactivés, les secrets manquants, les signatures non
valides, les ID de référentiel de fournisseur incompatibles et les ID de livraison manquants sont rejetés sans exposer
les détails de configuration.

La synchronisation en file d'attente survit aux redémarrages de l'API. Plusieurs instances utilisent des baux de base de
données et ne synchronisent pas simultanément le même compte fournisseur. Les en-têtes de limite de débit retardent le
travail du compte concerné, tandis que les nouvelles tentatives limitées gèrent les échecs transitoires.

<a id="github-actions"></a>

## GitHub Actions

1. Ouvrez les **Paramètres → Webhooks** du référentiel et choisissez**Ajouter un webhook**.
2. Utilisez `https://repovio.example.com/api/webhooks/github/<repository-id>` comme URL de charge utile.
3. Sélectionnez `application/json`, collez le secret du référentiel et abonnez-vous aux **Exécutions de workflow**
   (`workflow_run`).
4. Gardez la vérification SSL activée et enregistrez le webhook.

Repovio vérifie `X-Hub-Signature-256` sur le corps brut et utilise `X-GitHub-Delivery` pour l'idempotence. Voir
[documentation sur les événements webhook](https://docs.github.com/en/webhooks/webhook-events-and-payloads) de GitHub.

<a id="gitlab-pipelines"></a>

## Canalisations GitLab

1. Ouvrez les **Paramètres → Webhooks** du projet et sélectionnez**Ajouter un nouveau webhook**.
2. Utilisez `https://repovio.example.com/api/webhooks/gitlab/<repository-id>` comme URL.
3. Générez un **jeton de signature** et enregistrez sa valeur complète, y compris `whsec_`, dans la carte de référentiel
   Repovio.
4. Sélectionnez **Événements de pipeline**, laissez la vérification SSL activée, enregistrez et envoyez une livraison
   test.

Repovio vérifie les signatures Webhooks standard HMAC-SHA256 et préfère `webhook-id` pour l'idempotence. Les anciens
en-têtes `X-Gitlab-Token` et `X-Gitlab-Event-UUID` restent pris en charge pour les anciennes instances. Voir
[documentation sur les webhooks](https://docs.gitlab.com/user/project/integrations/webhooks/) de GitLab.

<a id="forgejo-actions"></a>

## Forgejo Actions

1. Ouvrez les **Paramètres → Webhooks** du référentiel et ajoutez un webhook JSON**Forgejo** natif.
2. Utilisez `https://repovio.example.com/api/webhooks/forgejo/<repository-id>` comme URL cible.
3. Collez le secret du référentiel et sélectionnez **Événements Push** ainsi que tous les événements Actions
   disponibles.
4. Gardez la vérification TLS activée et enregistrez le webhook.

Repovio vérifie `X-Forgejo-Signature` et utilise `X-Forgejo-Delivery` pour l'idempotence. Les en-têtes compatibles Gitea
restent acceptés pour la compatibilité Forgejo. Voir le Forgejo
[documentation sur les webhooks](https://forgejo.org/docs/latest/user/repository/webhooks/).

<a id="gitea-actions"></a>

## Gitea Actions

1. Ouvrez les **Paramètres → Webhooks** du référentiel et ajoutez un webhook JSON**Gitea** natif.
2. Utilisez `https://repovio.example.com/api/webhooks/gitea/<repository-id>` comme URL cible.
3. Collez le secret du référentiel et sélectionnez **Événements push** ainsi que tous les événements de workflow
   disponibles.
4. Gardez la vérification TLS activée et enregistrez le webhook.

Repovio vérifie `X-Gitea-Signature` sur le corps brut et utilise `X-Gitea-Delivery` pour l'idempotence. Voir le Gitea
[documentation sur les webhooks](https://docs.gitea.com/usage/repository/webhooks/).

<a id="troubleshooting"></a>

## Dépannage

- `401` signifie que Repovio n'a pas pu vérifier le référentiel, le type de fournisseur, le secret, la signature, l'ID
  du référentiel de charge utile ou l'ID de livraison. Confirmez l'UUID du référentiel du rappel et le secret exact.
- `202` avec `duplicate: true` est attendu lorsqu'un fournisseur tente une nouvelle livraison.
- Une livraison réussie déclenche uniquement une synchronisation en lecture seule ; cela ne modifie jamais le flux de
  travail du fournisseur.
- Vérifiez `/api/health` pour connaître l'état de synchronisation du fournisseur persistant.
- Réglez `SCHEDULER_SYNC_INTERVAL_SECONDS=1800` pour le repli de 30 minutes.
- `SCHEDULER_ENABLED=false` conserve les demandes en file d'attente mais suspend la mise en file d'attente et le
  traitement de secours.
