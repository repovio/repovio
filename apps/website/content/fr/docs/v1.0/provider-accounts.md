---
title: 'Comptes fournisseurs'
description:
  'Connectez-vous et administrez les informations d’identification du fournisseur cryptées et en lecture seule.'
---

> Instantané source archivé. Les étiquettes des produits utilisent Repovio. Utilisez les identifiants de configuration
> et les références de conteneur des fichiers de déploiement balisés de cette version sans modification.

<a id="access-and-list"></a>

## Accès et liste

Les administrateurs système ouvrent **Administration → Comptes de fournisseur**. Le tableau indique le nom, le type de
fournisseur, l'URL de base, l'état activé et la dernière synchronisation. Filtrer par type/activé, trier, modifier les
colonnes et paginer. Les autres rôles n'administrent pas les comptes de fournisseur. Les jetons et les secrets OAuth ne
sont jamais renvoyés dans les données de liste.

<a id="connect-a-provider"></a>

## Connecter un fournisseur

Choisissez **Ajouter un fournisseur** et sélectionnez GitHub, GitLab, Forgejo ou Gitea. Entrez un nom reconnaissable et
l'URL de base de l'instance correcte ; Gitea en nécessite un. Choisissez parmi les méthodes d'authentification que l'API
signale comme configurées. Sans client OAuth correspondant, utilisez un jeton d'accès personnel.**Vérifier et ajouter un
fournisseur** vérifie les informations d'identification PAT avant de les stocker.**Connect Provider** redirige vers le
consentement du fournisseur et revient avec un avis de réussite ou d'échec.

Utilisez uniquement les étendues de lecture dans [Configuration du fournisseur OAuth](/docs/v1.0/provider-oauth). Le
fournisseur OAuth connecte les données du référentiel ; il est distinct du
[Connexion utilisateur OIDC](/docs/v1.0/authentication). Repovio chiffre les informations d'identification au repos et
ne fournit jamais de mutations de ressources du fournisseur, même lorsqu'un jeton en amont pourrait autoriser les
écritures.

<a id="maintain-connections"></a>

## Maintenir les connexions

Activez ou désactivez une ligne pour contrôler la participation. Les actions de ligne en attente bloquent les actions en
conflit pendant la fin des demandes. La désactivation conserve la configuration. La suppression s'exécute
immédiatement ; Tenez compte des données suivies dépendantes avant de sélectionner l’action de suppression. Créez une
connexion de remplacement si la propriété ou les informations d'identification du fournisseur doivent changer via un
flux que l'écran actuel n'expose pas.

Ajoutez des référentiels séparément de [Dépôts](/docs/v1.0/repositories) ; La configuration du webhook appartient aux
référentiels suivis individuels, et non aux comptes de fournisseur. Une découverte vide peut signifier l'absence de
référentiels, une instance incorrecte, des étendues de lecture insuffisantes ou des informations d'identification non
valides. Distinguer les échecs de chargement des options d'authentification, les erreurs de vérification, les
notifications de rappel OAuth et les échecs d'API ; corrigez la cause avant de réessayer. Inspectez les tâches pour
détecter les échecs de synchronisation en cours.
