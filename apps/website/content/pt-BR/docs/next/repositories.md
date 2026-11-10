---
title: 'Repositórios'
description: 'Rastreie repositórios, inspecione atividades e configure sincronização e acesso local.'
---

<a id="browse-and-open-details"></a>

## Navegue e abra detalhes

Abra um repositório na tabela para navegar por Visão geral, Execuções de workflows, Issues, Pull requests, Alertas
de segurança e Configurações. As páginas de atividade mantêm o escopo do repositório e oferecem filtros, ordenação,
paginação e navegação por linha. Alertas exigem permissão de gerenciamento; Configurações fica disponível apenas para
administradores do sistema. O link do provedor abre o repositório externo.

A visão geral mostra informações gerais, retenção, última sincronização, idade dos dados, intervalo, trabalho atual e
atividade recente. Trabalhos pendentes ou em execução mostram progresso e erros classificados sem dados sensíveis.

<a id="add-and-maintain-tracking"></a>

## Adicione e mantenha o rastreamento

Somente administradores de sistema adicionam repositórios. Selecione uma conta de provedor habilitada, aguarde a
descoberta e selecione um ou mais repositórios não rastreados. Repositórios já rastreados são excluídos. Se parte de uma
adição múltipla falhar, as seleções bem-sucedidas permanecerão adicionadas e somente as seleções com falha permanecerão
para nova tentativa. Uma lista de provedores vazia requer primeiro a conexão de um
[conta do provedor](/docs/next/provider-accounts) habilitado.

Os administradores podem ativar/desativar o rastreamento, **Atualizar dados do provedor** e enfileirar uma sincronização
somente leitura. A identidade do repositório usa a conta do provedor e o ID do repositório do provedor estável.
Renomeações/transferências preservam histórico, filtros, associações e canais; a atualização de metadados rejeita um ID
diferente no caminho antigo em vez de reatribuí-lo. Os repositórios desativados retêm os dados armazenados, mas param de
participar da sincronização.

<a id="repository-settings-sections"></a>

## Seções das configurações do repositório

As configurações do repositório têm cinco abas secundárias. Cada seção usa toda a largura disponível, com campos empilhados em telas estreitas. Os links podem ser compartilhados e restaurados ao recarregar ou usar Voltar/Avançar. Geral é a seleção padrão.

| Seção               | Finalidade                             | Endereço                     |
| ------------------- | -------------------------------------- | ---------------------------- |
| Geral               | Prazos de retenção                     | `/repositories/:id/settings` |
| Webhook             | Configuração do webhook do repositório | `?tab=webhook`               |
| Filtros de workflow | Padrões de permissão e bloqueio        | `?tab=workflow-filters`      |
| Membros             | Acesso direto de usuários e papéis     | `?tab=members`               |
| Acesso de grupos    | Acesso adicional de grupos locais      | `?tab=groups`                |

Entradas não salvas e solicitações pendentes permanecem ao trocar de aba durante a mesma visita. Sair das configurações ou abrir outro repositório descarta os rascunhos, inclusive segredos de webhook gerados. Use a ação de salvar ou atribuir da seção para preservar as alterações.

O diálogo de detalhes rápidos foi removido. Links antigos `?repository=` abrem a visão geral. As páginas completas mantêm atualização, sincronização, links do provedor e exclusão local. Alterar a URL não dá acesso às configurações a leitores ou gerentes.

<a id="retention-filters-and-memberships"></a>

## Retenção, filtros e associações

Os administradores definem substituições separadas de retenção de execução de fluxo de trabalho, emissão e solicitação
pull, cada uma de 1 a 3.650 dias. Um valor vazio restaura o [padrão do sistema](/docs/next/settings-system)
correspondente. Os filtros de fluxo de trabalho aceitam padrões glob **ALLOW** e**DENY**; negar tem precedência.
Adicione padrões não vazios ou remova os existentes. Filtros restritivos podem explicar execuções ausentes.

Nas associações, adicione um usuário não administrador como Visualizador ou Gerente, altere sua função de repositório ou
remova o acesso. Os administradores são excluídos da seleção de membros porque já têm acesso irrestrito. Um Gerente
global ainda precisa da associação de Gerente para recursos de gerenciamento de repositório, como alertas de segurança.

<a id="webhooks-and-failures"></a>

## Webhooks e falhas

O cartão de webhook do repositório mostra o URL de retorno de chamada, o estado configurado, as instruções do provedor e
a última entrega. Ele pode gerar/copiar um segredo, salvar configuração, alternar com confirmação explícita ou remover
configuração. Um URL público ausente deve ser corrigido antes do registro do provedor. Os segredos são mostrados apenas
durante a configuração; mantenha-os em um gerenciador secreto. Siga
[Webhooks de repositório](/docs/next/provider-webhooks) para configuração e verificação.

Leitores e gerentes consultam metadados somente leitura na visão geral; configurações continuam exclusivas de administradores. Tente novamente após corrigir a causa e consulte [Trabalhos](/docs/next/guide-jobs) para falhas de sincronização.

<a id="local-user-and-group-management"></a>

## Grupos de acesso locais

Em Acesso de grupos do repositório, atribua Viewer ou Manager, altere ou remova a concessão. Direitos diretos e herdados
se somam; Manager prevalece. Gerenciamento ainda exige papel global Manager; administradores mantêm acesso total.
Remoções valem na próxima solicitação, salvo outra concessão. Grupos locais aceitam contas locais e OIDC, sem
sincronizar claims OIDC.

[Grupos de acesso locais](/docs/next/users#local-access-groups)

<a id="delete-local-tracking"></a>

## Excluir o rastreamento local

Administradores do sistema podem selecionar **Eliminar repositório** na página de detalhes.
A confirmação identifica o repositório e explica a exclusão permanente dos workflows, execuções, issues, pull requests,
alertas de segurança, configurações, permissões, histórico de webhooks, estado de sincronização e histórico de
notificações associados localmente. A conta do provedor e os dados do repositório no provedor permanecem inalterados.

A exclusão fica bloqueada durante uma sincronização; aguarde a conclusão e tente novamente. Solicitações pendentes são
excluídas com o repositório. As assinaturas de notificações perdem o filtro desse repositório; uma assinatura restrita
somente a ele é excluída em vez de se tornar global. Os canais compartilhados são preservados.

O repositório pode ser adicionado novamente pela seleção de provedor existente. O rastreamento recomeça sem restaurar
o histórico ou as configurações locais anteriores.
