---
title: 'Connectez-vous'
description: "Utilisez les informations d'identification locales ou OpenID Connect et terminez une session en toute sécurité."
---

<a id="local-sign-in"></a>

## Connexion locale

Ouvrez `/auth/signin`, saisissez le nom d'utilisateur et le mot de passe locaux, puis sélectionnez **Connexion**.
Attendez la fin de l'authentification. Les informations d'identification rejetées vous laissent sur le formulaire ;
vérifiez le nom d'utilisateur et interrogez l'opérateur de déploiement sur
[récupération de mot de passe](/docs/next/authentication#reset-a-forgotten-password). Repovio n’a pas de flux de
réinitialisation de mot de passe par courrier électronique.

Une nouvelle installation ouvre [Configuration de première exécution](/docs/next/setup) à la place. Une fois
authentifiés, la navigation et les résultats dépendent de votre rôle et de votre appartenance au référentiel. Un tableau
de bord vide ne signifie pas que la connexion a échoué.

<a id="openid-connect"></a>

## OpenID Connect

Lorsqu'un administrateur active OIDC, utilisez le bouton de connexion supplémentaire du fournisseur. Terminez
l'authentification sur la propre page du fournisseur d'identité et laissez le rappel se terminer. Un mappage de groupe
refusé, une transaction expirée ou un échec du fournisseur renvoie une erreur ; lancez une nouvelle tentative de
connexion. OIDC ne lie jamais un compte local existant en faisant correspondre son adresse e-mail.

La connexion OIDC est distincte des connexions du fournisseur OAuth. Il authentifie un utilisateur Repovio ; il ne
connecte pas les référentiels GitHub, GitLab, Forgejo ou Gitea. Les noms et mots de passe gérés par l’identité doivent
être modifiés auprès du fournisseur d’identité.

<a id="sign-out"></a>

## Se déconnecter

Choisissez de vous déconnecter dans le menu utilisateur. La déconnexion supprime la session du navigateur sans supprimer
les référentiels, ni modifier les informations d'identification du fournisseur ni modifier les ressources du
fournisseur. Sur un appareil partagé, déconnectez-vous lorsque vous avez terminé. Si une session API expire,
reconnectez-vous avant de réessayer l'action qui a échoué. La connexion par mot de passe local reste disponible lorsque
OIDC est activé.
