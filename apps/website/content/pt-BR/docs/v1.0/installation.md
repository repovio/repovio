---
title: 'Guia do usuário Repovio'
description:
  'Comece a usar Repovio para visualizar repositórios, status do fluxo de trabalho e ações de aprovação necessárias.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

Repovio é um painel de status de fluxo de trabalho somente leitura. Ele permite que usuários autorizados inspecionem a
atividade do repositório sem criar, executar novamente, aprovar ou excluir nada em GitHub, GitLab, Forgejo ou Gitea.

<a id="before-you-begin"></a>

## Antes de começar

Você precisa do URL de uma instalação Repovio e de uma conta OIDC local ou configurada. O primeiro administrador conclui
a configuração única; usuários locais adicionais são provisionados por meio da API protegida ou os usuários fazem login
por meio do OIDC configurado. O acesso aos dados do provedor depende da sua função e das associações ao repositório; o
login não expõe automaticamente todos os repositórios configurados.

Repovio usa três funções de aplicativo:

- **O visualizador** pode inspecionar repositórios, fluxos de trabalho, problemas e solicitações pull atribuídos
  explicitamente.
- **Gerente** tem acesso de leitura e pode inspecionar alertas de segurança para repositórios onde a associação também
  é**Gerente**. Canais de notificação, assinaturas, testes e histórico são administrados globalmente pelos
  administradores do sistema.
- **O administrador do sistema** pode acessar todos os repositórios e gerenciar contas de provedores, repositórios,
  associações, usuários, tokens MCP e padrões de aplicativos.

As funções de aplicativo nunca concedem acesso de gravação em GitHub, GitLab, Forgejo ou Gitea. Se uma ação alterar o
estado do provedor, Repovio abrirá a interface do provedor em vez de executar a ação.

<a id="recommended-first-session"></a>

## Primeira sessão recomendada

1. [Entrar](/docs/v1.0/sign-in), aprenda [navegação](/docs/v1.0/navigation) e experimente [procurar](/docs/v1.0/search).
2. Revise [Painel](/docs/v1.0/guide-dashboard), [Todas as execuções](/docs/v1.0/workflow-runs),
   [Precisa de atenção](/docs/v1.0/needs-attention) e [Aguardando aprovação](/docs/v1.0/awaiting-approval).
3. Inspecione [Problemas](/docs/v1.0/guide-issues) e [Solicitações pull](/docs/v1.0/guide-pull-requests).
4. Abra [Repositórios](/docs/v1.0/repositories) para entender os dados que você pode ver.
5. Os administradores configuram [canais de notificação](/docs/v1.0/notifications) e
   [assinaturas de eventos](/docs/v1.0/notification-rules).

Os administradores do sistema devem então continuar com [Administração e configurações](/docs/v1.0/provider-accounts). A
implantação, o registro do provedor, a configuração do webhook, o backup e a recuperação estão vinculados às páginas do
manual correspondentes.

<a id="when-a-page-is-empty-or-unavailable"></a>

## Quando uma página está vazia ou indisponível

Uma página vazia pode significar que nenhum dado do provedor correspondente foi sincronizado, que os filtros excluem
todos os resultados ou que sua conta não tem associação no repositório. Limpe os filtros ativos e verifique primeiro a
seleção do repositório. Uma mensagem de erro de carregamento significa que os dados solicitados não puderam ser
recuperados; tente novamente a ação da página e peça ao administrador da instalação para inspecionar a API e os
trabalhos de sincronização se o erro persistir.
