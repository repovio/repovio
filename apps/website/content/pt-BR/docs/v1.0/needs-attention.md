---
title: 'Precisa de atenção'
description: 'Investigue contextos de fluxo de trabalho cuja execução concluída mais recente falhou.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

<a id="current-failures"></a>

## Falhas atuais

Abra **O fluxo de trabalho é executado → Precisa de atenção**. Ao contrário do histórico de execuções com falha, essa
fila mantém contextos de fluxo de trabalho acionáveis ​​cuja execução concluída mais recente falhou. Uma execução
bem-sucedida mais recente, uma alteração relacionada fechada ou uma alteração mesclada remove o contexto após a
sincronização. As execuções mais antigas com escopo de ramificação podem ser associadas à solicitação pull/merge ativa
quando foram iniciadas. O emblema da barra lateral usa a mesma fila com escopo de permissão.

Pesquise e use os controles de tabela disponíveis para restringir o contexto do fluxo de trabalho/repositório. Abra seu
link de execução externa para logs e correção. Abra a alteração relacionada quando presente. Repovio nunca executa
novamente, cancela, edita ou despacha fluxos de trabalho.

<a id="diagnose-missing-or-stale-entries"></a>

## Diagnosticar entradas ausentes ou obsoletas

Um resultado vazio pode ser correto após uma execução de substituição bem-sucedida. Para falhas mais antigas, use
[Todas as execuções](/docs/v1.0/workflow-runs). Limpe os filtros e verifique as associações ao repositório antes de
tratar um contexto ausente como dados ausentes. As ações do provedor são observadas de forma assíncrona; inspecione
[Tarefas de sincronização](/docs/v1.0/guide-jobs) se o estado permanecer obsoleto. Erros de carregamento e solicitação
são separados de uma fila vazia; tente novamente após a recuperação da API.
