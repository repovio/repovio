---
title: 'Mot de passe'
description: "Modifiez un mot de passe local et comprenez l'invalidation et la récupération de session."
---

<a id="change-a-password"></a>

## Changer un mot de passe

Pour un compte local, ouvrez **Paramètres → Général → Modifier le mot de passe**. Saisissez le mot de passe actuel, un
nouveau mot de passe de 12 à 256 caractères et une confirmation correspondante. Soumettez une fois et attendez la fin.
Un mot de passe actuel invalide, un mot de passe court ou une confirmation incompatible doit être corrigé avant de
réessayer.

Une modification réussie renvoie un jeton de remplacement pour le navigateur actuel et invalide les autres sessions
existantes du compte. Les autres appareils doivent se reconnecter avec le nouveau mot de passe. Cela modifie uniquement
le compte Repovio, et non les PAT du fournisseur, les informations d'identification OAuth, les informations
d'identification de notification ou la configuration du jeton MCP.

<a id="oidc-and-forgotten-passwords"></a>

## OIDC et mots de passe oubliés

Les comptes gérés par OIDC n'ont pas de formulaire de mot de passe local. Modifiez le mot de passe du fournisseur
d'identité chez ce fournisseur. Repovio n'a délibérément aucun flux de réinitialisation par courrier électronique. Un
opérateur de déploiement peut utiliser le
[commande de récupération locale](/docs/next/authentication#reset-a-forgotten-password) documenté ; il rejette les
comptes OIDC et invalide les sessions existantes. Ne mettez jamais de mot de passe de remplacement dans l'historique du
shell ou dans un rapport de problème.

<a id="local-user-and-group-management"></a>

## Créer et réinitialiser les comptes locaux

L’action Réinitialiser le mot de passe permet à un administrateur de remplacer un mot de passe local sans connaître le
précédent. Confirmez le nouveau mot de passe. Les sessions JWT existantes deviennent invalides ; votre propre
réinitialisation vous déconnecte. Les comptes OIDC ne proposent pas cette action. Les jetons MCP sont conservés.

[Groupes d’accès locaux](/docs/next/users#local-access-groups)
