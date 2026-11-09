---
title: 'Аутентификация'
description: 'Настройте локальную аутентификацию, дополнительный вход в систему OpenID Connect и восстановление учетной записи.'
---

<a id="first-run-setup"></a>

## Настройка при первом запуске

После развертывания новой установки откройте ее общедоступный URL-адрес. Repovio перенаправляет каждый запрос на
`/auth/setup` до тех пор, пока не появится первая учетная запись. Введите необязательное имя и фамилию, уникальное имя
пользователя и пароль длиной не менее 12 символов. Учетная запись создается в качестве системного администратора и сразу
же входит в нее.

Установка может быть успешной только один раз. После существования первого пользователя `/auth/setup` перенаправляется
на `/auth/signin`. Существующие установки сохраняют своих текущих пользователей во время обновлений и больше не
отображают настройки.

<a id="openid-connect-single-sign-on"></a>

## Система единого входа OpenID Connect

Repovio поддерживает одного дополнительного поставщика OpenID Connect в дополнение к локальному входу. Системный
администратор настраивает его в разделе **Настройки → Аутентификация**. Этот логин отделен от GitHub, GitLab, Forgejo и
Gitea провайдера OAuth: OIDC идентифицирует пользователя Repovio, тогда как провайдер OAuth предоставляет только доступ
на чтение к ресурсам провайдера.

Прежде чем настраивать провайдера, установите точный URL-адрес обратного вызова API, доступный извне:

```dotenv
PUBLIC_URL=https://repovio.example.com
OIDC_CALLBACK_URL=https://repovio.example.com/api/v1/auth/oidc/callback
```

Зарегистрируйте значение `OIDC_CALLBACK_URL` в качестве разрешенного URI перенаправления у поставщика удостоверений.
Настройте его эмитента, идентификатор клиента, дополнительный секрет клиента, области и утверждение группы в Repovio.
API принимает секрет клиента при сохранении, но никогда не возвращает его значение. Неактивное состояние зашифровано с
помощью `TOKEN_ENCRYPTION_KEY`. Сохраните конфигурацию перед использованием **Проверить соединение**; несохраненные
изменения отключают эту проверку. Подтвердите успешное обнаружение, прежде чем полагаться на вход в систему OIDC.

HTTPS требуется для эмитента и его конечных точек. **Разрешить отправитель HTTP** предназначен только для изолированных
лабораторных сетей; его никогда нельзя включать для развертывания с доступом через Интернет. Вход в систему с локальным
паролем остается доступным в качестве пути восстановления, даже если OIDC включен.

В форме также отображается URL-адрес обратного вызова для копирования, настроенные/наблюдаемые группы и отдельные
элементы управления для замены или очистки сохраненного секрета клиента. Если оставить замену отключенной, сохраненный
секрет сохранится. О сбоях загрузки, сохранения и проверки соединения сообщается отдельно. Исправьте неверную
конфигурацию и сохраните ее еще раз, прежде чем повторить проверку соединения.

<a id="groups-roles-and-identities"></a>

### Группы, роли и удостоверения

Claim групп может быть точным именем или путем через точки, например `realm_access.groups`. Используйте точные значения
с учетом регистра. При нескольких совпадениях приоритет: `SYSTEM_ADMIN`, затем `MANAGER`, затем `VIEWER`. Отсутствующие
или несовпадающие группы отклоняются, если явно не разрешен Viewer без совпадений. Некорректные claims и превышения
лимита групп отклоняются всегда.

Учетная запись OIDC связана только проверенной парой эмитента и субъекта. Repovio никогда не связывает логин OIDC с
локальной учетной записью по адресу электронной почты или имени пользователя. Имя и фамилия синхронизируются из
проверенных заявок при каждом успешном входе в систему; имя пользователя, имена профилей и пароль нельзя изменить
локально. Членство в репозитории остается управляемым в Repovio и никогда не определяется группами поставщиков
удостоверений.

Изменения настроек, связанных с безопасностью, или роли делают существующие bearer-токены OIDC недействительными.
Изменение только отображаемого имени провайдера не делает существующие токены OIDC недействительными. Отключение или
удаление группы провайдера идентификации не позволяет затронутой учётной записи получить новый сеанс и делает предыдущие
сеансы недействительными после следующей отклонённой попытки входа.

<a id="provider-examples"></a>

### Примеры поставщиков

Руководства провайдеров: [Keycloak](#oidc-keycloak) · [Microsoft Entra ID](#oidc-entra-id) · [Auth0](#oidc-auth0)

Для Authentik создайте поставщика OAuth2/OpenID с потоком кода авторизации, точным URL-адресом обратного вызова,
указанным выше, и областями `openid`, `profile` и `email`. Добавьте сопоставление области, которое возвращает выбранное
утверждение группы в виде массива имен групп, присоедините поставщика к приложению, затем скопируйте издателя
приложения, идентификатор клиента и секрет клиента в Repovio.

Для другого совместимого со стандартами поставщика включите поток кода авторизации, требуйте S256 PKCE, зарегистрируйте
точный URL-адрес обратного вызова и включите стабильный `sub`, а также настроенное утверждение группы в токен
идентификатора или ответ UserInfo. Repovio принимает только асимметричные подписи ID-токена и отклоняет неподписанные
токены и токены, подписанные HMAC.

<a id="oidc-keycloak"></a>

#### Keycloak

В консоли Keycloak создайте realm repovio и клиент OpenID Connect repovio. Включите Client authentication и Standard
flow, отключите Implicit flow и Direct access grants. В Valid redirect URIs укажите точный callback ниже, потребуйте
S256 и сохраните RS256. Скопируйте секрет из Credentials.

В выделенном scope клиента добавьте mapper Group Membership: Token Claim Name groups, Full group path выключен, Add to
ID token включен. Добавьте profile и email в scopes по умолчанию. Создайте repovio-admins, repovio-managers и
repovio-viewers, назначьте пользователей и сопоставьте полные имена групп ролям Repovio. Роли realm не являются
членством в группах.

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

Справочные материалы: [Keycloak](https://www.keycloak.org/docs/latest/server_admin/index.html#_oidc_clients)

<a id="oidc-entra-id"></a>

#### Microsoft Entra ID

В Entra ID → App registrations зарегистрируйте однотенантное приложение с платформой Web и точным callback ниже, без
неявной выдачи токенов. Скопируйте Application (client) ID и Directory (tenant) ID. Создайте секрет клиента и скопируйте
Value, а не ID секрета. Используйте ID тенанта в issuer v2, не common или organizations.

В Token configuration добавьте groups в ID tokens для групп безопасности с Group ID. Создайте три группы, назначьте
пользователей и сопоставьте ID объектов групп с SYSTEM_ADMIN, MANAGER и VIEWER. Отображаемые имена не совпадают с GUID.
Фильтрация назначенных групп может требовать соответствующую лицензию Entra. Используйте S256 PKCE и асимметричные
подписи; обновляйте секрет до истечения срока.

Repovio отклоняет маркеры превышения лимита групп даже при разрешенном доступе Viewer без совпадений. Внешние источники
claims и Microsoft Graph не запрашиваются. Уменьшите число выдаваемых членств или настройте фильтрацию групп; разрешения
Graph проблему не решают.

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

Справочные материалы:
[Microsoft Entra ID](https://learn.microsoft.com/en-us/security/zero-trust/develop/configure-tokens-group-claims-app-roles)

<a id="oidc-auth0"></a>

#### Auth0

Создайте Regular Web Application, укажите точный callback в Allowed Callback URLs, включите Authorization Code с S256
PKCE и выберите RS256. Установите Token Endpoint Authentication Method в Basic. Скопируйте client ID и секрет. Возьмите
issuer из discovery выбранного тенанта или собственного домена с завершающей косой чертой; не смешивайте домены.

Создайте Action Login / Post Login по примеру ниже, замените REPLACE_WITH_REPOVIO_CLIENT_ID, разверните и добавьте в
Login flow. Администратор задает app_metadata.repovio_groups каждого пользователя как массив с repovio-admins,
repovio-managers или repovio-viewers; не используйте редактируемые пользователем user_metadata для авторизации. Auth0 не
выдает эти группы автоматически; claim только в access token недостаточен. В Repovio укажите полное имя namespaced claim
и сопоставьте три значения ролям.

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

Справочные материалы: [Auth0](https://auth0.com/docs/secure/tokens/json-web-tokens/create-custom-claims)

<a id="verify-oidc-providers"></a>

#### Проверка и устранение неполадок

Для каждого провайдера точно зарегистрируйте OIDC_CALLBACK_URL, запросите openid profile email и используйте
Authorization Code с S256 PKCE и асимметричной подписью. Сохраните issuer, client ID, секрет, scopes и claim групп в
Настройки → Аутентификация, затем проверьте соединение. Discovery не проверяет группы пользователя.

Протестируйте SYSTEM_ADMIN, MANAGER, VIEWER и неназначенного пользователя, которому должен быть запрещен вход при
отключенном Viewer без совпадений. Проверьте написание групп, пути Keycloak, ID объектов Entra и namespaced claim Auth0
в ID token. Сохраните локального администратора для восстановления. Группы OIDC дают только глобальные роли; доступ к
репозиториям требует отдельных разрешений Repovio. Настраивается только один провайдер.

<a id="oidc-api-contract"></a>

### OIDC Контракт API

| Метод        | Путь                         | Доступ                  | Цель                                                                                          |
| ------------ | ---------------------------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| `GET`        | `/api/v1/auth/oidc/status`   | Публичный               | Возвращает только фактическую доступность и необязательное имя поставщика.                    |
| `GET`        | `/api/v1/auth/oidc/start`    | Публичный               | Запускает код авторизации с привязкой к браузеру и транзакцию S256 PKCE.                      |
| `GET`        | `/api/v1/auth/oidc/callback` | Публичный               | Проверяет ответ поставщика и выполняет перенаправление с помощью одноразового фрагмента кода. |
| `POST`       | `/api/v1/auth/oidc/exchange` | Публичный               | Использует код фрагмента один раз и возвращает обычный носитель `AuthResult`.                 |
| `GET`, `PUT` | `/api/v1/auth/oidc/config`   | Системный администратор | Считывает или обновляет секретные настройки OIDC.                                             |
| `POST`       | `/api/v1/auth/oidc/check`    | Системный администратор | Проверяет сохраненную конфигурацию обнаружения, не изменяя ее.                                |

Обратный вызов никогда не помещает JWT-носитель в URL-адрес. Его непрозрачный код обмена истекает через 60 секунд и
может быть использован только один раз. Ошибки провайдера сводятся к стабильным кодам ошибок до того, как они достигнут
браузера или журналов.

<a id="change-your-password"></a>

## Измените свой пароль

Войдя в систему, откройте **Настройки → Общие → Изменить пароль**. Введите текущий пароль, новый пароль и его
подтверждение. Repovio сохраняет вход в текущий браузер с использованием заменяющего токена доступа и делает
недействительными токены, хранящиеся во всех остальных сеансах входа в систему.

<a id="reset-a-forgotten-password"></a>

## Сброс забытого пароля

Repovio намеренно не имеет сброса пароля по электронной почте. Администратор развертывания может сбросить локальную
учетную запись из каталога, содержащего `compose.yml`. Прочитайте заменяющий пароль, не повторяя его и не сохраняя в
истории оболочки, а затем отправьте его в контейнер API через стандартный ввод:

```bash
read -rsp 'New Repovio password: ' REPOVIO_NEW_PASSWORD
printf '\n'
printf '%s\n' "$REPOVIO_NEW_PASSWORD" \
  | docker compose exec -T api node dist/scripts/reset-password.js USERNAME
unset REPOVIO_NEW_PASSWORD
```

Замените `USERNAME` точным именем пользователя для входа. Для этой команды требуется пароль длиной от 12 до 256
символов, она обновляет только эту локальную учетную запись и делает недействительными все существующие токены доступа.
После этого войдите снова с новым паролем. Команда отклоняет учетные записи, управляемые OIDC, поскольку у них нет
локального пароля.

<a id="local-user-and-group-management"></a>

## Локальные группы доступа

В разделе группового доступа репозитория назначьте Viewer или Manager, измените или удалите право. Прямые и групповые
права объединяются, Manager сильнее. Управление требует глобальной роли Manager; системные администраторы не ограничены.
Отзыв действует со следующего запроса, если нет другого права. Группы работают с локальными и OIDC-записями, без
синхронизации OIDC claims.

[Локальные группы доступа](/docs/next/users#local-access-groups)
