---
title: 'Aguardando aprovação'
description: 'Encontre portões de aprovação de fornecedores e abra suas telas de aprovação externa.'
---

<a id="identify-approval-gates"></a>

## Identificar portas de aprovação

Abra **Execuções de fluxo de trabalho → Aguardando aprovação** para visualizar fluxos de trabalho sincronizados pausados
para uma decisão humana. Pesquise por fluxo de trabalho ou repositório e inspecione o repositório, o provedor e o
contexto de solicitação de pull/mesclagem relacionado. O emblema da barra lateral reflete as corridas correspondentes
visíveis; as restrições de associação se aplicam tanto ao crachá quanto à mesa.

Use **Abrir solicitação pull** para contexto ou**Aprovar no provedor** para abrir a página de fluxo de trabalho de
propriedade do provedor. GitLab pode chamar a alteração relacionada de solicitação de mesclagem. A aprovação do fluxo de
trabalho é diferente da revisão de código ou da aprovação de mesclagem.

<a id="complete-the-provider-action"></a>

## Conclua a ação do provedor

Autentique-se no provedor e use seus controles de aprovação se sua conta de provedor estiver autorizada. Repovio nunca
envia uma solicitação de aprovação. Uma leitura de webhook ou reconciliação deve observar o estado atualizado do
provedor antes que a linha desapareça. Atualize a fila armazenada posteriormente; uma linha inalterada imediatamente
após a aprovação pode refletir atraso na sincronização.

Uma fila vazia significa que nenhuma execução sincronizada visível precisa de aprovação no momento, nem que todos os
repositórios estejam conectados ou que sua conta de provedor tenha direitos de aprovação. Em caso de falha de carga,
tente novamente e inspecione [Tarefas de sincronização](/docs/v2.0/guide-jobs).
