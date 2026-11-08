---
title: 'Profil'
description: "Modifiez les noms de compte local et le nom d'utilisateur avec la vérification du mot de passe actuel."
---

<a id="edit-a-local-profile"></a>

## Modifier un profil local

Ouvrez **Paramètres → Général**. Les utilisateurs locaux peuvent mettre à jour leurs noms/prénoms facultatifs et leur
nom d'utilisateur de connexion. Les noms personnels sont utilisés comme identité d'affichage préférée ; le nom
d'utilisateur reste disponible pour une identification sans ambiguïté. Les champs ont une longueur maximale de 255
caractères et le nom d'utilisateur ne peut pas être vide.

La modification du nom d'utilisateur nécessite le mot de passe actuel. Saisissez-le dans le formulaire de profil et
sélectionnez Enregistrer. Les noms seuls ne nécessitent pas de changement de nom d’utilisateur. Attendez la demande; la
sauvegarde réussie met à jour le compte actuel. Un nom d'utilisateur en double et un mot de passe actuel incorrect
produisent différentes erreurs de validation. Corrigez le champ concerné et réessayez.

<a id="identity-managed-accounts"></a>

## Comptes gérés par l'identité

Les utilisateurs OIDC ne peuvent pas modifier leur nom d'utilisateur ou leur nom de profil localement. Repovio
synchronise les noms des revendications d'identité vérifiées lors d'une connexion réussie. Modifiez-les auprès du
fournisseur d'identité et reconnectez-vous. L'avatar reste modifiable séparément dans
[Paramètres de l'avatar](/docs/next/avatar). Si la demande de profil échoue, réessayez après la récupération de l'API ;
ne soumettez pas de mots de passe via les canaux d’assistance.
