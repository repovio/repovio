---
title: 'Solicitações pull'
description: 'Procure solicitações pull sincronizadas, filtros e detalhes somente leitura.'
---

<a id="browse-and-filter"></a>

## Navegue e filtre

Abra **Visão geral → Solicitações pull**. Listas, resumos, opções de filtros e detalhes usam associações de repositório.
Pesquise por título ou número; filtre por provedor, repositório, ciclo de vida, autor, responsável, estado do rascunho,
status do fluxo de trabalho, requisito de aprovação, rótulos e horário de atualização. Os limites de data atualizados
incluem UTC. Vários rótulos selecionados devem corresponder. Altere a classificação, as colunas visíveis e a paginação
com os controles da tabela. Os cartões de resumo contam alterações abertas, rascunhos, fluxos de trabalho com falha e
aprovações de fluxo de trabalho. GitLab usa o termo solicitação de mesclagem. Os detalhes mostram ramificações de
origem/destino, estado do rascunho, ciclo de vida e status agregado do fluxo de trabalho. A agregação usa a execução
mais recente para cada fluxo de trabalho vinculado; os resultados com falha têm precedência sobre os resultados em
execução, pendentes, cancelados, bem-sucedidos e desconhecidos. Um requisito de aprovação de fluxo de trabalho não é
aprovação de revisão de código, aprovação de mesclagem ou indicador de conflito de mesclagem.

<a id="inspect-details"></a>

## Inspecione detalhes

Selecione uma linha para abrir sua página de detalhes Repovio. Revise a identidade, o repositório, o autor, os
responsáveis, os rótulos, o marco, o estado do provedor, os carimbos de data e hora e a descrição limpa do Markdown. O
contexto do fluxo de trabalho vinculado é mostrado quando disponível. HTML incorporado e marcações inseguras são
removidas. Comentários, reações, anexos e diferenças de código não são sincronizados. Use o link do provedor para
comentar, atribuir, rotular, fechar, revisar, aprovar ou mesclar. Repovio não executa nenhuma dessas gravações.

<a id="synchronization-and-failures"></a>

## Sincronização e falhas

Webhooks assinados enfileiram leituras específicas do repositório após uma janela de fusão de 15 segundos; A
reconciliação de 30 minutos cobre eventos perdidos. Uma atualização do navegador recarrega os dados armazenados. Se um
registro estiver ausente, limpe os filtros, verifique a ativação e a associação do repositório e inspecione
[Tarefas de sincronização](/docs/next/guide-jobs). A retenção pode remover registros fechados antigos. Uma página de
detalhes inacessível pode indicar acesso revogado ou registro removido; retornar à lista. Repita as falhas de
solicitação após a recuperação da API.
