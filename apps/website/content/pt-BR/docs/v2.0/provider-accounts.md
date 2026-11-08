---
title: 'Contas de provedor'
description: 'Conecte e administre credenciais de provedor criptografadas e somente leitura.'
---

As instruções PAT/OAuth desta página usam webhooks por repositório. Conexões GitHub App usam um webhook central e são
configuradas pelo diálogo do aplicativo.

<a id="access-and-list"></a>

## Acesso e lista

Os administradores do sistema abrem **Administração → Contas do provedor**. A tabela mostra nome, tipo de provedor, URL
base, estado ativado e última sincronização. Filtre por tipo/habilitado, classifique, altere colunas e paginar. Outras
funções não administram contas de provedor. Tokens e segredos OAuth nunca são retornados nos dados da lista.

<a id="connect-a-provider"></a>

## Conecte um provedor

Escolha **Adicionar provedor** e selecione GitHub, GitLab, Forgejo ou Gitea. Insira um nome reconhecível e o URL base da
instância correto; Gitea requer um. Escolha entre os métodos de autenticação que a API reporta conforme configurado. Sem
um cliente OAuth correspondente, use um token de acesso pessoal.**Verificar e adicionar provedor** verifica as
credenciais PAT antes de armazená-las.**Conectar provedor** redireciona para o consentimento do provedor e retorna com
um aviso de sucesso ou falha.

Use apenas os escopos de leitura em [Configuração do provedor OAuth](/docs/v2.0/provider-oauth). O provedor OAuth
conecta dados do repositório; ele é separado de [Login do usuário OIDC](/docs/v2.0/authentication). Repovio criptografa
credenciais em repouso e nunca fornece mutações de recursos do provedor, mesmo quando um token upstream pode autorizar
gravações.

<a id="maintain-connections"></a>

## Manter conexões

Ative ou desative uma linha para controlar a participação. As ações de linha pendentes bloqueiam ações conflitantes
enquanto as solicitações são concluídas. A desativação mantém a configuração. A exclusão é executada imediatamente;
considere os dados rastreados dependentes antes de selecionar a ação de exclusão. Crie uma conexão de substituição se a
propriedade ou as credenciais do provedor precisarem ser alteradas por meio de um fluxo que a tela atual não expõe.

Adicione repositórios separadamente de [Repositórios](/docs/v2.0/repositories); A configuração do webhook pertence a
repositórios rastreados individuais, não a contas de provedor. A descoberta vazia pode significar ausência de
repositórios, uma instância incorreta, escopos de leitura insuficientes ou credenciais inválidas. Distinguir falhas de
carregamento de opções de autenticação, erros de verificação, avisos de retorno de chamada OAuth e falhas de API;
corrija a causa antes de tentar novamente. Inspecione os trabalhos em busca de falhas contínuas de sincronização.

[Configurar GitHub App](/docs/v2.0/github-app)
