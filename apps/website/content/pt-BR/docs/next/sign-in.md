---
title: 'Faça login'
description: 'Use credenciais locais ou OpenID Connect e encerre uma sessão com segurança.'
---

<a id="local-sign-in"></a>

## Login local

Abra `/auth/signin`, insira o nome de usuário e a senha locais e selecione **Entrar**. Aguarde até que a autenticação
termine. As credenciais rejeitadas deixam você no formulário; verifique o nome de usuário e pergunte ao operador de
implantação sobre [recuperação de senha](/docs/next/authentication#reset-a-forgotten-password). Repovio não possui fluxo
de redefinição de senha de e-mail.

Uma nova instalação abre [Configuração de primeira execução](/docs/next/setup). Depois de autenticados, a navegação e os
resultados dependem da sua função e das associações ao repositório. Um painel vazio não significa falha no login.

<a id="openid-connect"></a>

## Conexão OpenID

Quando um administrador ativar OIDC, use o botão de login do provedor adicional. Conclua a autenticação na própria
página do provedor de identidade e deixe o retorno de chamada terminar. Um mapeamento de grupo negado, uma transação
expirada ou uma falha no provedor retorna um erro; iniciar uma nova tentativa de login. OIDC nunca vincula uma conta
local existente combinando seu e-mail.

O login OIDC é separado das conexões do provedor OAuth. Autentica um usuário Repovio; ele não conecta repositórios
GitHub, GitLab, Forgejo ou Gitea. Os nomes e senhas gerenciados por identidade devem ser alterados no provedor de
identidade.

<a id="sign-out"></a>

## Sair

Escolha sair no menu do usuário. Sair remove a sessão do navegador sem excluir repositórios, alterar credenciais do
provedor ou modificar recursos do provedor. Em um dispositivo compartilhado, saia quando terminar. Se uma sessão de API
expirar, faça login novamente antes de tentar novamente a ação que falhou. O login com senha local permanece disponível
quando OIDC está ativado.
