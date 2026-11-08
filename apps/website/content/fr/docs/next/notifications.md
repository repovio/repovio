---
title: 'Canaux de notification'
description: 'Créez des destinations de notification globales, abonnez-vous à des événements et testez la livraison.'
---

<a id="access-and-channel-list"></a>

## Accès et liste des chaînes

Ouvrez **Opérations → Notifications → Canaux**. Les canaux sont une configuration globale Repovio et non une
configuration de gestionnaire appartenant au référentiel. Les administrateurs système créent, modifient, testent,
activent/désactivent et suppriment des canaux. Le statut de gestionnaire de référentiel n'accorde pas l'administration
des canaux. Le tableau affiche le nom, le type, les métadonnées de destination sûre, les événements souscrits, l'état
activé et l'heure de mise à jour ; utilisez les filtres de type/activés, le tri, les contrôles de colonne et la
pagination.

<a id="create-a-destination"></a>

## Créer une destination

Choisissez **Ajouter un canal**, saisissez un nom, sélectionnez un type et configurez la destination :

- **E-mail :** Hôte/port SMTP, sécurité du transport, expéditeur, authentification facultative et destinataires.
- **Gotify :** URL du serveur, jeton d'application et priorité.
- **ntfy :** serveur, sujet, authentification/jeton facultatif et priorité.
- **Discord :** destination du webhook.
- **URL Apprise personnalisée :** une URL de service Apprise prise en charge.
- **Push du navigateur :** utilisateurs destinataires ; chaque destinataire doit activer
  [leur appareil](/docs/next/browser-push).

Configurez [abonnements aux événements et aperçu](/docs/next/notification-rules) dans la même boîte de dialogue.
Enregistrez et attendez la demande avant de fermer. Les échecs de validation ou de sauvegarde laissent le formulaire
disponible pour correction.

<a id="edit-test-and-remove"></a>

## Modifier, tester et supprimer

La destination est chiffrée au repos. Vous pouvez le sauvegarder, mais vous ne pouvez pas le relire. La modification
conserve ses informations d'identification stockées, sauf si **Remplacer la configuration de destination** est
sélectionné. Le type de canal ne peut pas être modifié ; créez plutôt une nouvelle chaîne. Un canal migré
marqué**Requiert une reconfiguration** ne peut pas être réactivé tant que sa destination n'est pas remplacée. Les canaux
push du navigateur utilisent les abonnements des utilisateurs et rejettent un secret de destination de transport.

Utilisez l'action de test de ligne pour envoyer une véritable notification à la destination configurée ; il ne modifie
pas les données du fournisseur. Vérifiez le résultat dans [Historique de livraison](/docs/next/notification-history).
Désactivez un canal pour suspendre la diffusion ou supprimez-le lorsqu'il n'est plus nécessaire. La suppression
s'exécute immédiatement. Ne collez jamais d’informations d’identification dans des captures d’écran ou des rapports
d’assistance.

Les e-mails, Gotify, ntfy, Discord et les destinations personnalisées utilisent la CLI Apprise fournie avec l'API ; un
serveur Apprise distinct n’est pas requis. Si une requête échoue, réessayez après la récupération de l'API. Une liste
vide signifie qu'aucun canal configuré visible ne correspond aux filtres ; effacez les filtres ou créez une chaîne. Les
détails de l’échec de livraison contiennent uniquement des erreurs nettoyées.
