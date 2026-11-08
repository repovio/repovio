---
title: 'Configurações'
description: 'Encontre configurações pessoais e autenticação somente de administrador e controles de sistema.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

<a id="settings-tabs"></a>

## Guias de configurações

Abra **Configurações** no menu do usuário. Todo usuário autenticado pode acessar**Geral** e**MCP**. Os administradores
de sistema também veem**Autenticação** e**Sistema**. O agrupamento de administradores da barra lateral não impede que
outros usuários conectados abram suas configurações pessoais por meio do menu do usuário.

Geral contém [Perfil](/docs/v1.0/profile), [avatar](/docs/v1.0/avatar) e, para contas locais,
[Senha](/docs/v1.0/password). Os usuários gerenciados por OIDC veem um aviso de gerenciamento de identidade em vez de
formulários de perfil/senha local, mas ainda podem editar seu avatar. [MCP](/docs/v1.0/mcp) gerencia tokens pessoais de
acesso somente leitura.

<a id="related-preferences"></a>

## Preferências relacionadas

[Linguagem](/docs/v1.0/language) e [Aparência](/docs/v1.0/appearance) são selecionados nos controles de
aplicativo/usuário. Os administradores configuram [Autenticação OIDC](/docs/v1.0/authentication) e
[Padrões do sistema](/docs/v1.0/settings-system) em suas respectivas guias. Uma guia ausente pode ser correta para sua
função; alterar um URL não concede autorização. Tente novamente as solicitações de configurações com falha somente após
verificar a conectividade da API.
