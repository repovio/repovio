---
title: 'Poussée du navigateur'
description: 'Activez les notifications par appareil et comprenez les exigences du serveur et du navigateur.'
---

<a id="server-requirements"></a>

## Configuration requise pour le serveur

Le push du navigateur est un transport natif et n’utilise pas Apprise. L'opérateur de déploiement configure les trois
paramètres :

```dotenv
WEB_PUSH_VAPID_PUBLIC_KEY=...
WEB_PUSH_VAPID_PRIVATE_KEY=...
WEB_PUSH_VAPID_SUBJECT=mailto:admin@example.com
```

Générez une paire de clés VAPID avec `npx web-push generate-vapid-keys`. Le sujet est un URI `mailto:` ou `https:`.
Gardez la clé privée secrète. Sans la configuration complète, le push du navigateur est affiché comme indisponible.
Utilisez un contexte de navigateur sécurisé et un navigateur prenant en charge les service Workers et l'API Push.

<a id="enable-or-disable-this-device"></a>

## Activer ou désactiver cet appareil

Ouvrez la cloche de la barre d’application pour activer ou désactiver le push sur cet appareil. Le contrôle vérifie
l’abonnement du navigateur et son enregistrement pour le compte actuel. Un abonnement existant ne prouve pas que ce
compte est inscrit. Réessayez après un échec d’enregistrement. À la déconnexion, réessayez le nettoyage de l’appareil
s’il échoue ou choisissez explicitement de poursuivre la déconnexion.

Utilisez **Activer sur cet appareil** et accordez l'autorisation de notification du navigateur lorsque cela est demandé.
L'abonnement appartient à l'utilisateur et au navigateur actuels. Un administrateur sélectionne les utilisateurs
destinataires dans un canal push du navigateur ; chaque destinataire a besoin d'un appareil activé. Le refus de
l'autorisation du navigateur empêche l'abonnement ; ajustez les autorisations du navigateur du site et réessayez si vous
le souhaitez. Vérifiez la disponibilité/le nombre d’appareils et les erreurs signalées avant d’envoyer un test.

La désactivation du push supprime l'abonnement de cet appareil, pas les autres appareils. Les points de terminaison et
les clés sont chiffrés et dédupliqués avec une empreinte digitale non secrète. Les réponses HTTP 404/410 suppriment les
abonnements expirés. Un navigateur indisponible, une configuration de serveur manquante, une autorisation refusée ou un
échec de demande d'abonnement nécessitent que la cause correspondante soit corrigée ; l'actualisation seule ne peut pas
accorder l'autorisation au navigateur. Voir [Historique de livraison](/docs/next/notification-history) pour les
tentatives.
