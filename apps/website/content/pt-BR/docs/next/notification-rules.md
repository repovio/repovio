---
title: 'Assinaturas de eventos'
description: 'Escolha eventos, filtros de repositório e padrões de fluxo de trabalho dentro de um canal.'
---

<a id="configure-subscriptions"></a>

## Configurar assinaturas

Os administradores do sistema abrem um [canal](/docs/next/notifications) e configuram assinaturas de eventos em sua
caixa de diálogo de criação/edição. A rota herdada `/notifications/rules` redireciona para canais; não há tela separada
de gerenciamento de regras. Esta página documenta esse fluxo de trabalho de diálogo de canal.

Escolha o sucesso, a falha ou a recuperação do fluxo de trabalho; solicitação pull aberta, fechada, reaberta ou
mesclada; emissão aberta, fechada ou reaberta; e eventos abertos/resolvidos de dependência, código ou alerta secreto.
Selecione restrições de repositório para cada evento. Uma seleção de repositório vazio significa todos os repositórios
aplicáveis, e não nenhum. Os padrões de nome de fluxo de trabalho aplicam-se somente a eventos de fluxo de trabalho.
Salve o canal para persistir suas inscrições.

<a id="preview-matches"></a>

## Visualizar partidas

A visualização está disponível somente quando pelo menos um evento de fluxo de trabalho é selecionado; assinaturas que
não sejam somente de fluxo de trabalho o desabilitam. Use a visualização para inspecionar até 20 registros de fluxo de
trabalho correspondentes recentes antes de salvar. Uma correspondência confirma as condições atuais do filtro em relação
aos dados retidos; ele não enfileira uma entrega. Distinguir nenhuma correspondência de avisos de dados nunca
sincronizados, de falha de sincronização ou de dados parciais. Amplie a seleção de repositório/padrão ou inspecione
[Tarefas de sincronização](/docs/next/guide-jobs) quando os dados de origem não estiverem disponíveis.

A sincronização inicial estabelece uma linha de base silenciosa para eventos do ciclo de vida e não inunda os canais com
antigas transições abertas/fechadas. Transições observadas posteriormente podem produzir entregas. A disponibilidade do
provedor e as permissões de leitura limitam quais eventos de segurança podem ser observados. Repovio nunca altera os
recursos do provedor para fazer uma correspondência de regra.

Se a visualização ou o salvamento falharem, retenha os valores do formulário, verifique o status da API e tente
novamente. Uma visualização vazia por si só não prova que nenhum evento futuro corresponderá ou que todos os
repositórios selecionados foram sincronizados com sucesso.
