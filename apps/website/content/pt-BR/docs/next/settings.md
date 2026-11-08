---
title: 'Configurações'
description: 'Encontre configurações pessoais e autenticação somente de administrador e controles de sistema.'
---

<a id="settings-tabs"></a>

## Guias de configurações

Abra **Configurações** no menu do usuário. Todo usuário autenticado pode acessar**Geral** e**MCP**. Os administradores
de sistema também veem**Autenticação** e**Sistema**. O agrupamento de administradores da barra lateral não impede que
outros usuários conectados abram suas configurações pessoais por meio do menu do usuário.

Geral contém [Perfil](/docs/next/profile), [avatar](/docs/next/avatar) e, para contas locais,
[Senha](/docs/next/password). Os usuários gerenciados por OIDC veem um aviso de gerenciamento de identidade em vez de
formulários de perfil/senha local, mas ainda podem editar seu avatar. [MCP](/docs/next/mcp) gerencia tokens pessoais de
acesso somente leitura.

<a id="related-preferences"></a>

## Preferências relacionadas

[Linguagem](/docs/next/language) e [Aparência](/docs/next/appearance) são selecionados nos controles de
aplicativo/usuário. Os administradores configuram [Autenticação OIDC](/docs/next/authentication) e
[Padrões do sistema](/docs/next/settings-system) em suas respectivas guias. Uma guia ausente pode ser correta para sua
função; alterar um URL não concede autorização. Tente novamente as solicitações de configurações com falha somente após
verificar a conectividade da API.
