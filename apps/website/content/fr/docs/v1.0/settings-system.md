---
title: 'Paramètres système'
description: 'Configurez des politiques de rétention indépendantes et le format date/heure par défaut.'
---

> Instantané source archivé. Les étiquettes des produits utilisent Repovio. Utilisez les identifiants de configuration
> et les références de conteneur des fichiers de déploiement balisés de cette version sans modification.

<a id="administrator-access"></a>

## Accès administrateur

Seuls les administrateurs système peuvent ouvrir **Paramètres → Système**. Le chargement montre un squelette ; un échec
de chargement génère une erreur et réessaye au lieu des valeurs par défaut modifiables déduites des données manquantes.
Attendez la demande de paramètres avant d’enregistrer les modifications.

<a id="retention-defaults"></a>

## Valeurs de conservation par défaut

Définissez des périodes de conservation par défaut distinctes pour les exécutions de flux de travail, les problèmes et
les demandes d'extraction. Chaque valeur doit être comprise entre 1 et 3 650 jours. Un référentiel peut remplacer chaque
valeur correspondante indépendamment ; un remplacement de référentiel vide restaure cette valeur par défaut du système.
La conservation affecte l'historique stocké localement, et non les enregistrements côté fournisseur. Un raccourcissement
de la conservation peut supprimer les anciennes données stockées. Vérifiez donc d'abord les exigences en matière de
reporting et d'enquête.

Les contrôles de conservation et de suivi du référentiel sont documentés dans [Dépôts](/docs/v1.0/repositories). Une
ligne historique manquante peut refléter une rétention plutôt qu'un échec de synchronisation du fournisseur.

<a id="datetime-formatting"></a>

## Formatage de la date/heure

Définissez le format date/heure par défaut et inspectez son aperçu en direct avant de l'enregistrer. La sélection des
paramètres régionaux contrôle toujours le texte de l'interface traduit et le formatage sensible aux paramètres
régionaux. Enregistrez une fois ; le succès et les échecs de validation/API sont signalés séparément. Réessayez après
correction ou récupération de l'API. Une préférence de formatage ne modifie jamais les horodatages d’origine du
fournisseur.
