---
title: 'Authentification'
description: "Configurez l'authentification locale, la connexion facultative à OpenID Connect et la récupération de compte."
---

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

Le claim de groupe peut être un nom exact ou un chemin séparé par des points comme `realm_access.groups`. Utilisez des
valeurs exactes, sensibles à la casse. En cas de correspondances multiples, la priorité est `SYSTEM_ADMIN`, puis
`MANAGER`, puis `VIEWER`. Les groupes absents ou sans correspondance sont refusés, sauf activation explicite de l’accès
Viewer sans correspondance. Les claims malformés et les dépassements de groupes sont toujours refusés.

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

Guides des fournisseurs: [Keycloak](#oidc-keycloak) · [Microsoft Entra ID](#oidc-entra-id) · [Auth0](#oidc-auth0)

Pour Authentik, créez un fournisseur OAuth2/OpenID avec le flux de code d'autorisation, l'URL de rappel exacte ci-dessus
et les étendues `openid`, `profile` et `email`. Ajoutez un mappage de portée qui renvoie la revendication de groupe
choisie sous la forme d'un tableau de noms de groupe, attachez le fournisseur à une application, puis copiez l'émetteur,
l'ID client et le secret client de l'application dans Repovio.

Pour un autre fournisseur conforme aux normes, activez le flux de code d'autorisation, exigez S256 PKCE, enregistrez
l'URL de rappel exacte et incluez un `sub` stable ainsi que la revendication de groupe configurée dans le jeton d'ID ou
la réponse UserInfo. Repovio accepte uniquement les signatures de jetons d'identification asymétriques et rejette les
jetons non signés et signés HMAC.

<a id="oidc-keycloak"></a>

#### Keycloak

Dans la console Keycloak, créez le realm repovio et un client OpenID Connect repovio. Activez Client authentication et
Standard flow, désactivez Implicit flow et Direct access grants. Enregistrez exactement le callback ci-dessous dans
Valid redirect URIs, exigez S256 et conservez RS256. Copiez le secret depuis Credentials.

Dans le scope dédié du client, ajoutez un mapper Group Membership : Token Claim Name groups, Full group path désactivé,
Add to ID token activé. Ajoutez profile et email aux scopes par défaut. Créez repovio-admins, repovio-managers et
repovio-viewers, affectez les utilisateurs et associez les noms complets aux rôles Repovio correspondants. Les rôles du
realm ne sont pas des groupes.

```text
Issuer: https://auth.example.com/realms/repovio
Discovery: https://auth.example.com/realms/repovio/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Client ID: repovio
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

Références: [Keycloak](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients)

<a id="oidc-entra-id"></a>

#### Microsoft Entra ID

Dans Entra ID → App registrations, créez une application mono-tenant avec une plateforme Web et le callback exact
ci-dessous, sans émission implicite de jetons. Copiez Application (client) ID et Directory (tenant) ID. Créez un secret
client et copiez Value, pas son identifiant. Utilisez le tenant dans l’issuer v2, jamais common ou organizations.

Dans Token configuration, ajoutez groups aux ID tokens pour les groupes de sécurité avec Group ID. Créez trois groupes,
affectez les utilisateurs et associez leurs identifiants d’objet à SYSTEM_ADMIN, MANAGER et VIEWER ; les noms affichés
ne correspondent pas aux GUID. Le filtrage des groupes affectés peut nécessiter une licence Entra adaptée. Utilisez S256
PKCE et des signatures asymétriques ; renouvelez le secret avant expiration.

Repovio refuse les marqueurs de dépassement des limites de groupes, même si l’accès Viewer sans correspondance est
activé. Il ne consulte ni sources externes de claims ni Microsoft Graph. Réduisez les appartenances émises ou filtrez
les groupes ; ajouter des permissions Graph ne résout pas ce cas.

```text
Issuer: https://login.microsoftonline.com/TENANT_ID/v2.0
Discovery: https://login.microsoftonline.com/TENANT_ID/v2.0/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: groups
SYSTEM_ADMIN: ADMIN_GROUP_OBJECT_ID
MANAGER: MANAGER_GROUP_OBJECT_ID
VIEWER: VIEWER_GROUP_OBJECT_ID
```

Références:
[Microsoft Entra ID](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles)

<a id="oidc-auth0"></a>

#### Auth0

Créez une Regular Web Application, renseignez le callback exact dans Allowed Callback URLs, activez Authorization Code
avec S256 PKCE et choisissez RS256. Réglez Token Endpoint Authentication Method sur Basic. Copiez client ID et secret.
Utilisez l’issuer de discovery du tenant ou du domaine personnalisé, avec sa barre finale ; ne mélangez pas les
domaines.

Créez une Action Login / Post Login avec l’exemple ci-dessous, remplacez REPLACE_WITH_REPOVIO_CLIENT_ID, déployez-la et
ajoutez-la au Login flow. Un administrateur définit app_metadata.repovio_groups pour chaque utilisateur comme tableau de
repovio-admins, repovio-managers ou repovio-viewers ; jamais depuis user_metadata modifiable par l’utilisateur. Auth0
n’émet pas automatiquement ces groupes ; un claim dans le seul access token ne suffit pas. Dans Repovio, utilisez le nom
complet du claim namespaced et associez les trois valeurs aux rôles correspondants.

```text
Issuer: https://YOUR_TENANT.REGION.auth0.com/
Discovery: https://YOUR_TENANT.REGION.auth0.com/.well-known/openid-configuration
Redirect URI: https://repovio.example.com/api/v1/auth/oidc/callback
Scopes: openid profile email
Groups claim: https://repovio.example.com/groups
SYSTEM_ADMIN: repovio-admins
MANAGER: repovio-managers
VIEWER: repovio-viewers
```

```javascript
/** Add administratively managed Repovio groups to this application's ID token. */
exports.onExecutePostLogin = async (event, api) => {
  if (event.client.client_id !== 'REPLACE_WITH_REPOVIO_CLIENT_ID') return;
  const groups = event.user.app_metadata?.repovio_groups;
  api.idToken.setCustomClaim('https://repovio.example.com/groups', Array.isArray(groups) ? groups : []);
};
```

Références: [Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)

<a id="verify-oidc-providers"></a>

#### Vérification et dépannage

Pour chaque fournisseur, enregistrez exactement OIDC_CALLBACK_URL, demandez openid profile email et utilisez
Authorization Code avec S256 PKCE et signature asymétrique. Dans Paramètres → Authentification, sauvegardez issuer,
client ID, secret, scopes et claim de groupe, puis vérifiez la connexion. Discovery ne valide pas les groupes d’un
utilisateur.

Testez SYSTEM_ADMIN, MANAGER, VIEWER et un utilisateur non affecté, qui doit être refusé si l’accès Viewer sans
correspondance est désactivé. Vérifiez orthographe, chemins Keycloak, identifiants Entra et claim namespaced Auth0 dans
l’ID token. Gardez un administrateur local. Les groupes OIDC donnent des rôles globaux ; l’accès aux dépôts nécessite
des autorisations Repovio distinctes. Un seul fournisseur peut être configuré.

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

<a id="local-user-and-group-management"></a>

## Groupes d’accès locaux

Dans Accès des groupes du dépôt, attribuez Viewer ou Manager, modifiez ou retirez le rôle. Les droits directs et hérités
se combinent ; Manager prévaut. La gestion nécessite toujours le rôle global Manager ; les administrateurs restent sans
restriction. Le retrait agit à la requête suivante sauf autre droit conservé. Les groupes locaux acceptent les comptes
locaux et OIDC, sans synchronisation des claims OIDC.

[Groupes d’accès locaux](/docs/next/users#local-access-groups)
