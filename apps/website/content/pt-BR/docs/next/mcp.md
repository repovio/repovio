---
title: 'Acesso MCP'
description: 'Conecte clientes MCP configuráveis por cabeçalho às ferramentas de fluxo de trabalho somente leitura com
  reconhecimento de permissão do Repovio.'
---

Repovio expõe um terminal do Model Context Protocol sem estado em `/mcp`. Ele fornece acesso somente leitura aos mesmos
repositórios, execuções de fluxo de trabalho, filas de falhas, filas de aprovação, resumos e tendências que o usuário
autenticado pode ver em Repovio.

O servidor MCP lê o banco de dados Repovio local. Ele não chama APIs de mutação de provedor, inicia sincronização,
aprova fluxos de trabalho ou altera a configuração Repovio.

O mesmo endpoint `/mcp` aceita o protocolo `2025-06-18` de clientes antigos como Codex e o protocolo moderno
`2026-07-28`. Clientes antigos usam `initialize` seguido de `notifications/initialized`; clientes modernos enviam os
metadados do protocolo em cada solicitação. Ambos expõem as mesmas sete ferramentas somente leitura e autenticam cada
solicitação com o token Bearer do usuário atual. Cada solicitação usa uma nova instância sem sessões MCP persistentes.

<a id="create-an-access-token"></a>

## Crie um token de acesso

Abra **Configurações**, selecione a guia**Acesso MCP** e crie um token nomeado. A expiração é opcional. Copie o token
completo da caixa de diálogo de criação porque Repovio o exibe apenas uma vez e armazena apenas seu hash SHA-256.

A revogação de um token entra em vigor na próxima solicitação. Excluir seu usuário também exclui o token. As alterações
na função do usuário ou nas associações ao repositório são aplicadas imediatamente porque cada solicitação resolve a
autorização atual do banco de dados.

<a id="configure-a-client"></a>

## Configurar um cliente

Use a origem pública Repovio seguida de `/mcp` e envie o token no cabeçalho de autorização:

```text
URL: https://repovio.example.com/mcp
Authorization: Bearer repovio_mcp_REPLACE_WITH_TOKEN
```

A primeira versão tem como alvo clientes MCP que suportam cabeçalhos HTTP personalizados, como editor e clientes de
linha de comando. Ele não fornece descoberta OAuth e não reivindica compatibilidade com hosts que exigem o fluxo MCP
OAuth.

Nunca coloque o token em uma URL, parâmetro de consulta, arquivo de configuração rastreado, histórico de shell ou log.
Prefira o armazenamento secreto do cliente ou uma variável de ambiente sem versão.

<a id="available-tools"></a>

## Ferramentas disponíveis

| Ferramenta               | Finalidade                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------- |
| `list_repositories`      | Lista repositórios rastreados visíveis.                                                 |
| `get_repository`         | Leia um repositório rastreado visível.                                                  |
| `list_workflow_runs`     | Consultar execuções de fluxo de trabalho visíveis normalizadas.                         |
| `list_needs_attention`   | Listar contextos de fluxo de trabalho cuja execução de terminal mais recente falhou.    |
| `list_awaiting_approval` | Liste as execuções visíveis atuais aguardando aprovação do fornecedor.                  |
| `get_dashboard_summary`  | Resuma a integridade visível do fluxo de trabalho para um intervalo de tempo inclusivo. |
| `get_workflow_trend`     | Agregue grupos visíveis de tendências de sucesso e fracasso.                            |

As ferramentas de lista têm como padrão 25 resultados por página e aceitam no máximo 100. A saída da ferramenta contém
JSON estruturado e uma representação de texto correspondente. As datas usam valores UTC ISO 8601.

O servidor não anuncia intencionalmente nenhum recurso, prompt, tarefa, assinatura, ação do provedor ou ferramenta de
configuração do MCP.

<a id="reverse-proxy-requirements"></a>

## Requisitos de proxy reverso

- Encaminhe `POST /mcp` para o contêiner da API sem reescrevê-lo para `/api/v1/mcp`.
- Encaminhar `Authorization`, `Origin`, `Content-Type`, `Accept`, `MCP-Protocol-Version`, `Mcp-Method` e `Mcp-Name`.
- Use TLS no proxy reverso e não registre cabeçalhos de autorização nem solicite strings de consulta.
- Adicione todas as origens de navegador permitidas a `CORS_ORIGIN`. Solicitações sem cabeçalho `Origin` permanecem
  suportadas para clientes nativos; as origens atuais devem corresponder à lista de permissões configurada.

<a id="token-administration"></a>

## Administração de tokens

Os usuários gerenciam seus próprios tokens na guia **Acesso MCP** em Configurações. Os administradores do sistema podem
inspecionar os metadados do token seguro e revogar um token da página Usuários, mas não podem recuperar seu hash ou
segredo de texto simples e não podem criar um token em nome de outro usuário.

<a id="manage-token-states"></a>

## Gerenciar estados de token

A lista de tokens mostra nome, status, prefixo seguro, carimbos de data/hora criados/últimos usados e expiração
opcional. Os nomes podem conter no máximo 100 caracteres. Revogar requer confirmação. Um token revogado ou expirado não
pode autenticar solicitações futuras. Uma lista vazia significa que não existem tokens para o usuário; um erro de
carregamento oferece nova tentativa. Copie o novo token completo antes de fechar sua exibição única. As caixas de
diálogo do token do administrador permitem apenas listagem/revogação, nunca criação para outro usuário.
