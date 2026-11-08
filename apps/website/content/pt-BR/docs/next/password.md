---
title: 'Senha'
description: 'Altere uma senha local e entenda a invalidação e recuperação de sessão.'
---

<a id="change-a-password"></a>

## Alterar uma senha

Para uma conta local, abra **Configurações → Geral → Alterar senha**. Digite a senha atual, uma nova senha de 12 a 256
caracteres e a confirmação correspondente. Envie uma vez e aguarde a conclusão. Uma senha atual inválida, uma senha
curta ou uma confirmação incompatível deve ser corrigida antes de tentar novamente.

Uma alteração bem-sucedida retorna um token de substituição para o navegador atual e invalida as outras sessões
existentes da conta. Outros dispositivos deverão fazer login novamente com a nova senha. Isso altera apenas a conta
Repovio, não os PATs do provedor, as credenciais OAuth, as credenciais de notificação ou a configuração do token MCP.

<a id="oidc-and-forgotten-passwords"></a>

## OIDC e senhas esquecidas

As contas gerenciadas por OIDC não possuem um formulário de senha local. Altere a senha do provedor de identidade nesse
provedor. Repovio deliberadamente não possui fluxo de redefinição baseado em e-mail. Um operador de implantação pode
usar o [comando de recuperação local](/docs/next/authentication#reset-a-forgotten-password) documentado; rejeita contas
OIDC e invalida sessões existentes. Nunca coloque uma senha substituta no histórico do shell ou em um relatório de
problemas.

<a id="local-user-and-group-management"></a>

## Criar e redefinir contas locais

A ação Redefinir senha permite ao administrador substituir uma senha local sem a anterior. Informe e confirme a nova
senha. Sessões JWT existentes ficam inválidas; redefinir a própria encerra a sessão. Contas OIDC não mostram essa ação.
Tokens MCP permanecem válidos.

[Grupos de acesso locais](/docs/next/users#local-access-groups)
