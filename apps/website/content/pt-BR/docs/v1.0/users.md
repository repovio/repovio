---
title: 'Usuários'
description: 'Revise usuários locais e gerenciados por identidade, funções, exclusão e administração de token MCP.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

<a id="review-accounts"></a>

## Revise as contas

Os administradores do sistema abrem **Administração → Usuários**. A tabela mostra nome de usuário, avatar/nome de
exibição, função, origem local/OIDC e carimbos de data/hora criados/atualizados. Filtre por função, classifique, altere
colunas ou paginate. O acesso ao repositório para um Viewer ou Manager requer um
[associação ao repositório](/docs/v1.0/repositories) separado; grupos de provedores de identidade não criam essas
associações.

<a id="provisioning-and-deletion"></a>

## Provisionamento e exclusão

A página Usuários não possui formulário de criação de usuário ou edição de usuário. Usuários locais adicionais são
criados por meio da API de usuário protegida somente pelo administrador usando nome de usuário, senha e função. Os
usuários OIDC são provisionados por meio de login de identidade configurado. Consulte
[Autenticação](/docs/v1.0/authentication) para mapeamento e separação de contas. Não deduza uma ação de edição do
usuário pela presença de um perfil editável em sua própria página Configurações.

A ação de exclusão fica disponível para outros usuários e é executada imediatamente; revise a conta antes de
selecioná-la. Você não pode excluir sua própria conta por meio desta API ou tela. A exclusão de um usuário Repovio
remove o acesso local; ele não exclui nenhuma conta de provedor em GitHub, GitLab, Forgejo ou Gitea. Revise o acesso do
usuário afetado antes de excluir.

<a id="user-mcp-tokens"></a>

## Tokens do usuário MCP

Abra a caixa de diálogo do token MCP de um usuário para listar os metadados do token ou revogar um token com
confirmação. Os administradores não podem recuperar valores de token de texto simples ou criar o token de outro usuário
por meio desta caixa de diálogo. Os usuários criam seus próprios tokens em [Configurações MCP](/docs/v1.0/mcp). Listas
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
