---
title: 'Configurar GitHub App'
description: 'Registre e conecte seu GitHub App com credenciais criptografadas e acesso de instalação somente leitura.'
---

<a id="register-app"></a>

## Registrar o aplicativo

Use um GitHub App por instalação do Repovio; PAT e OAuth continuam disponíveis. Como proprietário, abra Settings,
Developer settings, GitHub Apps e New GitHub App. Escolha nome exclusivo e página do Repovio. Selecione Any account para
várias contas; um aplicativo privado só pode ser instalado na conta proprietária. Não são necessários segredo de cliente
OAuth, URL de retorno ou URL de configuração.

<a id="permissions-and-events"></a>

## Permissões e eventos

Defina as permissões básicas abaixo como Read-only; Metadata é automático. Adicione permissões opcionais de segurança
apenas quando necessárias e disponíveis. Assine os eventos listados; o GitHub envia eventos de instalação
automaticamente. O Repovio restringe tokens gerados à leitura, mesmo se o aplicativo tiver permissões adicionais.

```text
Required repository permissions (Read-only):
Actions (actions)
Issues (issues)
Pull requests (pull_requests)
Metadata (metadata, automatic)

Optional repository permissions (Read-only):
Dependabot alerts (dependabot_alerts)
Code scanning alerts (security_events)
Secret scanning alerts (secret_scanning_alerts)

Webhook events:
workflow_run
issues
pull_request
dependabot_alert
code_scanning_alert
secret_scanning_alert
```

<a id="configure-repovio"></a>

## Configurar Repovio

Ative webhooks usando o endpoint HTTPS público abaixo. PUBLIC_URL deve apontar para a instalação acessível externamente.
Gere um segredo aleatório com pelo menos 16 caracteres e use o mesmo valor no GitHub e no Repovio. Gere uma chave RSA no
GitHub e baixe o arquivo PEM. Em Administração, Contas de provedores, GitHub App, informe ID, slug, chave completa e
segredo, depois verifique e salve. A API valida a identidade e criptografa ambos os segredos no PostgreSQL. Proteja a
chave de criptografia da instalação; os segredos salvos nunca retornam ao navegador.

```text
https://repovio.example.com/api/v1/webhooks/github-app
```

<a id="install-and-connect"></a>

## Instalar e conectar

Instale pelo GitHub, selecione uma conta ou organização e somente os repositórios necessários. Retorne, atualize as
instalações e conecte a conta desejada. Instalações suspensas ou já conectadas não podem ser conectadas novamente. A
lista vem do aplicativo configurado; IDs de callbacks não são considerados confiáveis. Adicione repositórios pela tela
correspondente. Os tokens são renovados automaticamente; importação inicial e consulta periódica complementam webhooks.

Altere o nome local antes de conectar se já existir uma conta PAT ou OAuth com o mesmo nome.

<a id="rotate-and-disconnect"></a>

## Rotacionar e desconectar

Gere uma nova chave no GitHub, salve-a e verifique a sincronização antes de excluir a anterior. Atualize o segredo do
webhook nos dois lados juntos; assinaturas antigas deixam de ser aceitas imediatamente. Campos vazios preservam
segredos. Exclua contas conectadas antes de substituir a identidade ou excluir a configuração; isso também exclui dados
dependentes, então exporte antes. A exclusão local não desinstala o aplicativo no GitHub.

<a id="troubleshooting"></a>

## Solucionar problemas

Confira ID, slug e formato PEM em falhas de configuração. Para assinaturas inválidas, confira segredo, HTTPS e
preservação do corpo original pelo proxy. Se a lista estiver vazia, confira seleção e permissões e atualize. Instalações
removidas ou suspensas preservam dados; restaure o acesso e atualize. Permissões opcionais ausentes não bloqueiam outras
áreas. Consulte Jobs. A consulta periódica continua se os webhooks falharem. Testes simulados não verificam uma
instalação real no GitHub.

## Veja também

- [Contas de provedores](/docs/next/provider-accounts)
- [Configurar OAuth](/docs/next/provider-oauth)
- [Webhooks de provedores](/docs/next/provider-webhooks)
