---
title: 'Authentification'
description:
  "Configurez l'authentification locale, la connexion facultative à OpenID Connect et la récupération de compte."
---

> Instantané source archivé. Les étiquettes des produits utilisent Repovio. Utilisez les identifiants de configuration
> et les références de conteneur des fichiers de déploiement balisés de cette version sans modification.

<a id="first-run-setup"></a>

## Configuration de première exécution

Après avoir déployé une nouvelle installation, ouvrez son URL publique. Repovio redirige chaque demande vers
`/auth/setup` jusqu'à ce que le premier compte existe. Saisissez un prénom et un nom facultatifs, un nom d'utilisateur
unique et un mot de passe d'au moins 12 caractères. Le compte est créé en tant qu'administrateur système et connecté
immédiatement.

L'installation ne peut réussir qu'une seule fois. Une fois le premier utilisateur existant, `/auth/setup` redirige vers
`/auth/signin`. Les installations existantes conservent leurs utilisateurs actuels pendant les mises à niveau et
n'affichent plus la configuration.

<a id="openid-connect-single-sign-on"></a>

## Authentification unique OpenID Connect

Repovio prend en charge un fournisseur OpenID Connect en option en plus de la connexion locale. Un administrateur
système le configure sous **Paramètres → Authentification**. Cette connexion est distincte du fournisseur GitHub,
GitLab, Forgejo et Gitea OAuth : OIDC identifie un utilisateur Repovio, tandis que le fournisseur OAuth accorde
uniquement un accès en lecture aux ressources du fournisseur.

Définissez l'URL de rappel d'API exacte accessible en externe avant de configurer le fournisseur :

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
```

Enregistrez la valeur de `OIDC_CALLBACK_URL` en tant qu’URI de redirection autorisé auprès du fournisseur d’identité.
Configurez son émetteur, son ID client, son secret client facultatif, ses étendues et sa revendication de groupe dans
Repovio. L'API accepte le secret client lors de l'enregistrement mais ne renvoie jamais sa valeur. Il est chiffré au
repos avec `TOKEN_ENCRYPTION_KEY`. Enregistrez la configuration avant d'utiliser **Vérifier la connexion** ; les
modifications non enregistrées désactivent cette vérification. Confirmez la réussite de la découverte avant de vous fier
à la connexion OIDC.

HTTPS est requis pour l'émetteur et ses points de terminaison. **Autoriser l'émetteur HTTP** est uniquement destiné aux
réseaux de laboratoire isolés ; il ne doit jamais être activé pour un déploiement accessible sur Internet. La connexion
par mot de passe local reste disponible comme chemin de récupération même lorsque OIDC est activé.

Le formulaire affiche également l'URL de rappel pour la copie, les groupes configurés/observés et les contrôles
distincts pour remplacer ou effacer le secret client stocké. Laisser le remplacement désactivé préserve le secret
enregistré. Les échecs de chargement, de sauvegarde et de vérification de connexion sont signalés séparément. Corrigez
la configuration invalide et enregistrez à nouveau avant de réessayer la vérification de la connexion.

<a id="groups-roles-and-identities"></a>

### Groupes, rôles et identités

La revendication de groupe peut être un nom de revendication exact ou un chemin séparé par des points, tel que
`realm_access.groups`. Configurez des valeurs de groupe exactes et sensibles à la casse pour les trois rôles Repovio. Si
plusieurs groupes correspondent, Repovio applique `SYSTEM_ADMIN`, puis `MANAGER`, puis `VIEWER`. Les revendications de
groupe sans correspondance, mal formées, manquantes ou trop grandes sont refusées, sauf si **Autoriser les utilisateurs
sans correspondance en tant que visualiseur** est explicitement activé.

Un compte OIDC est lié uniquement par la paire émetteur/sujet vérifiée. Repovio ne lie jamais une connexion OIDC à un
compte local par adresse e-mail ou nom d'utilisateur. Les noms et prénoms sont synchronisés à partir des revendications
vérifiées à chaque connexion réussie ; le nom de connexion, les noms de profil et le mot de passe ne peuvent pas être
modifiés localement. Les adhésions au référentiel restent gérées dans Repovio et ne sont jamais dérivées de groupes de
fournisseurs d'identité.

Les modifications de configuration liées à la sécurité ou les changements de rôle invalident les jetons bearer OIDC
existants. Modifier uniquement le nom affiché du fournisseur ne les invalide pas. Désactiver ou supprimer un groupe du
fournisseur d’identité empêche le compte concerné d’obtenir une nouvelle session et invalide ses sessions précédentes
après la prochaine tentative de connexion refusée.

<a id="provider-examples"></a>

### Exemples de fournisseurs

Pour Authentik, créez un fournisseur OAuth2/OpenID avec le flux de code d'autorisation, l'URL de rappel exacte ci-dessus
et les étendues `openid`, `profile` et `email`. Ajoutez un mappage de portée qui renvoie la revendication de groupe
choisie sous la forme d'un tableau de noms de groupe, attachez le fournisseur à une application, puis copiez l'émetteur,
l'ID client et le secret client de l'application dans Repovio.

Pour un autre fournisseur conforme aux normes, activez le flux de code d'autorisation, exigez S256 PKCE, enregistrez
l'URL de rappel exacte et incluez un `sub` stable ainsi que la revendication de groupe configurée dans le jeton d'ID ou
la réponse UserInfo. Repovio accepte uniquement les signatures de jetons d'identification asymétriques et rejette les
jetons non signés et signés HMAC.

<a id="oidc-api-contract"></a>

### Contrat API OIDC

| Méthode      | Chemin                       | Accès                  | Objectif                                                                           |
| ------------ | ---------------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| `GET`        | `/api/v1/auth/oidc/status`   | Publique               | Renvoie uniquement la disponibilité effective et le nom du fournisseur facultatif. |
| `GET`        | `/api/v1/auth/oidc/start`    | Publique               | Démarre un code d’autorisation lié au navigateur et une transaction S256 PKCE.     |
| `GET`        | `/api/v1/auth/oidc/callback` | Publique               | Valide la réponse du fournisseur et redirige avec un code de fragment unique.      |
| `POST`       | `/api/v1/auth/oidc/exchange` | Publique               | Consomme le code du fragment une fois et renvoie le support normal `AuthResult`.   |
| `GET`, `PUT` | `/api/v1/auth/oidc/config`   | Administrateur système | Lit ou met à jour les paramètres OIDC sécurisés par les secrets.                   |
| `POST`       | `/api/v1/auth/oidc/check`    | Administrateur système | Vérifie la configuration de découverte enregistrée sans la modifier.               |

Le rappel ne place jamais de support JWT dans une URL. Son code d'échange opaque expire au bout de 60 secondes et ne
peut être utilisé qu'une seule fois. Les erreurs du fournisseur sont réduites à des codes d'erreur stables avant
d'atteindre le navigateur ou les journaux.

<a id="change-your-password"></a>

## Changez votre mot de passe

Une fois connecté, ouvrez **Paramètres → Général → Modifier le mot de passe**. Saisissez le mot de passe actuel, le
nouveau mot de passe et sa confirmation. Repovio maintient le navigateur actuel connecté avec un jeton d'accès de
remplacement et invalide les jetons détenus par toutes les autres sessions de connexion.

<a id="reset-a-forgotten-password"></a>

## Réinitialiser un mot de passe oublié

Repovio n'a délibérément pas de réinitialisation de mot de passe par courrier électronique. Un administrateur de
déploiement peut réinitialiser un compte local à partir du répertoire contenant `compose.yml`. Lisez le mot de passe de
remplacement sans lui faire écho ni le stocker dans l'historique du shell, puis envoyez-le au conteneur API via l'entrée
standard :

```bash
read -rsp 'New Repovio password: ' REPOVIO_NEW_PASSWORD
printf '\n'
printf '%s\n' "$REPOVIO_NEW_PASSWORD" \
  | docker compose exec -T api node dist/scripts/reset-password.js USERNAME
unset REPOVIO_NEW_PASSWORD
```

Remplacez `USERNAME` par le nom d'utilisateur de connexion exact. La commande nécessite un mot de passe compris entre 12
et 256 caractères, met à jour uniquement ce compte local et invalide tous ses jetons d'accès existants. Connectez-vous
ensuite à nouveau avec le nouveau mot de passe. La commande rejette les comptes gérés par OIDC car ils n'ont pas de mot
de passe local.
