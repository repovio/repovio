---
title: 'Visão geral do Repovio'
description:
  'Execuções de fluxo de trabalho somente leitura, trabalho de repositório e alertas de segurança em seus provedores.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

Repovio é um painel auto-hospedado para ações GitHub, pipelines GitLab, ações Forgejo e ações Gitea. Rastreie execuções
de fluxo de trabalho selecionadas, problemas e solicitações pull, identifique falhas atuais e envie notificações sem
modificar os recursos do provedor.

<a id="one-permission-scoped-overview"></a>

## Uma visão geral com escopo de permissão

- Inspecione a integridade do fluxo de trabalho, as últimas execuções, tendências, filas de aprovação e trabalhos que
  precisam de atenção.
- Leia problemas e extraia ou mescle solicitações junto com suas atividades de fluxo de trabalho relacionadas.
- Revise os metadados de alerta de segurança suportados sem armazenar valores secretos.
- Gerencie associações de repositórios, destinos de notificação criptografados e conexões de provedor somente leitura.
- Use contas locais, OpenID Connect opcional e tokens de acesso pessoais somente leitura MCP.

Alterações de provedores, aprovações, revisões e reexecuções de fluxo de trabalho permanecem ações externas. Os próprios
controles de administração do Repovio configuram seu rastreamento local e notificações; eles não concedem acesso de
gravação ao provedor.

Comece com [instalação](/docs/v1.0/installation) e siga [login e navegação](/docs/v1.0/sign-in). Para operações de
produção, consulte [implantação e backups](/docs/v1.0/deployment).
