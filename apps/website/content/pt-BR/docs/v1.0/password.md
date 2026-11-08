---
title: 'Senha'
description: 'Altere uma senha local e entenda a invalidação e recuperação de sessão.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

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
usar o [comando de recuperação local](/docs/v1.0/authentication#reset-a-forgotten-password) documentado; rejeita contas
OIDC e invalida sessões existentes. Nunca coloque uma senha substituta no histórico do shell ou em um relatório de
problemas.
