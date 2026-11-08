---
title: 'avatar'
description: 'Téléchargez, importez, recadrez ou supprimez votre photo de profil.'
---

<a id="choose-an-image"></a>

## Choisissez une image

Chaque utilisateur connecté, y compris les utilisateurs de OIDC, peut ouvrir **Paramètres → Général** et télécharger un
JPEG, un PNG ou un WebP jusqu'à 2 Mio. Vous pouvez également importer une image à partir d’une URL HTTPS publique. Une
image non carrée ouvre la boîte de dialogue de recadrage ; choisissez le recadrage carré et confirmez avant de
télécharger. L'annulation de la boîte de dialogue laisse l'avatar actuel inchangé.

Repovio supprime les métadonnées de l'image, restitue un WebP 256 × 256 et stocke uniquement cette image normalisée dans
PostgreSQL. Il ne conserve pas l'image d'origine ni l'URL distante. Le type invalide, l'image surdimensionnée, l'échec
d'importation, l'échec de décodage et l'échec de téléchargement sont signalés séparément ; choisissez une image prise en
charge ou réessayez après avoir corrigé la source/la connectivité.

<a id="remove-and-display"></a>

## Supprimer et afficher

Utilisez l'action de suppression pour supprimer l'image actuelle. Une suppression échouée laisse l'avatar existant
disponible pour une nouvelle tentative. Sans image, l'interface affiche les initiales basées sur le nom personnel ou le
nom d'utilisateur. Les groupes d'avatars de membres du référentiel affichent au maximum cinq membres et résument les
membres supplémentaires. La visibilité de l'avatar suit les autorisations de la ressource contenant. La modification
d'un avatar Repovio ne met pas à jour la photo de profil de votre fournisseur.
