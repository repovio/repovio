---
title: 'Usuários'
description: 'Revise usuários locais e gerenciados por identidade, funções, exclusão e administração de token MCP.'
---

<a id="review-accounts"></a>

## Revise as contas

Os administradores do sistema abrem **Administração → Usuários**. A tabela mostra nome de usuário, avatar/nome de
exibição, função, origem local/OIDC e carimbos de data/hora criados/atualizados. Filtre por função, classifique, altere
colunas ou paginate. O acesso ao repositório para um Viewer ou Manager requer um
[associação ao repositório](/docs/v2.0/repositories) separado; grupos de provedores de identidade não criam essas
associações.

<a id="provisioning-and-deletion"></a>

## Provisionamento e exclusão

Em Administração → Usuários, selecione Novo usuário na barra. Informe nome único, nomes opcionais, senha de 12–256
caracteres com confirmação e papel; Viewer é o padrão. A criação funciona com OIDC ativo. Identidades OIDC vêm do
provedor e nunca são vinculadas por nome local coincidente.

A ação de exclusão fica disponível para outros usuários e é executada imediatamente; revise a conta antes de
selecioná-la. Você não pode excluir sua própria conta por meio desta API ou tela. A exclusão de um usuário Repovio
remove o acesso local; ele não exclui nenhuma conta de provedor em GitHub, GitLab, Forgejo ou Gitea. Revise o acesso do
usuário afetado antes de excluir.

<a id="user-mcp-tokens"></a>

## Tokens do usuário MCP

Abra a caixa de diálogo do token MCP de um usuário para listar os metadados do token ou revogar um token com
confirmação. Os administradores não podem recuperar valores de token de texto simples ou criar o token de outro usuário
por meio desta caixa de diálogo. Os usuários criam seus próprios tokens em [Configurações MCP](/docs/v2.0/mcp). Listas
vazias e erros de carregamento são distintos; tente novamente após a recuperação da API. Nunca copie valores de token em
relatórios de suporte ou capturas de tela.

<a id="local-user-api"></a>

## Provisione um usuário local por meio da API

Use um cliente API por HTTPS para enviar `POST /api/v1/users` com autenticação de portador de administrador e
`Content-Type: application/json`. Forneça este corpo de solicitação, substituindo os espaços reservados nas entradas
protegidas do cliente:

```json
{
  "username": "new-user",
  "password": "REPLACE_WITH_A_PASSWORD_OF_AT_LEAST_12_CHARACTERS",
  "role": "VIEWER"
}
```

As funções válidas são `VIEWER`, `MANAGER` e `SYSTEM_ADMIN`. Atribua apenas a função necessária e, em seguida, conceda
associações ao repositório separadamente. A resposta contém metadados seguros do usuário, não a senha ou seu hash. Um
nome de usuário duplicado ou uma solicitação inválida devem ser corrigidos antes de tentar novamente. Não armazene
senhas ou tokens de portador em arquivos rastreados, histórico de shell, capturas de tela ou relatórios de problemas.

<a id="create-and-reset-local-accounts"></a>

## Criar e redefinir contas locais

A ação Redefinir senha permite ao administrador substituir uma senha local sem a anterior. Informe e confirme a nova
senha. Sessões JWT existentes ficam inválidas; redefinir a própria encerra a sessão. Contas OIDC não mostram essa ação.
Tokens MCP permanecem válidos.

<a id="local-access-groups"></a>

## Grupos de acesso locais

Abra Administração → Grupos para criar, renomear, excluir e gerenciar membros. Nomes devem ser únicos e não vazios. A
seleção oferece pesquisa e paginação; um usuário pode participar de vários grupos, sem grupos aninhados. Excluir exige
confirmação e remove membros e concessões herdadas, preservando associações diretas.

Em Acesso de grupos do repositório, atribua Viewer ou Manager, altere ou remova a concessão. Direitos diretos e herdados
se somam; Manager prevalece. Gerenciamento ainda exige papel global Manager; administradores mantêm acesso total.
Remoções valem na próxima solicitação, salvo outra concessão. Grupos locais aceitam contas locais e OIDC, sem
sincronizar claims OIDC.

```text
POST   /api/v1/users                              { username, password, role, firstName?, lastName? }
PUT    /api/v1/users/:id/password                 { newPassword }
GET    /api/v1/user-groups                       ?page=1&perPage=10
POST   /api/v1/user-groups                       { name }
PUT    /api/v1/user-groups/:id                    { name }
DELETE /api/v1/user-groups/:id
GET    /api/v1/user-groups/:id/members            ?page=1&perPage=10
PUT    /api/v1/user-groups/:id/members/:userId
DELETE /api/v1/user-groups/:id/members/:userId
GET    /api/v1/repositories/:id/group-memberships
PUT    /api/v1/repositories/:id/group-memberships/:groupId  { role }
DELETE /api/v1/repositories/:id/group-memberships/:groupId
```
