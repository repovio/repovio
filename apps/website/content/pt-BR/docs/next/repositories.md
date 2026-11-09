---
title: 'Repositórios'
description: 'Rastreie repositórios, inspecione atividades e configure sincronização e acesso local.'
---

<a id="browse-and-open-details"></a>

## Navegue e abra detalhes

Todos os usuários conectados podem listar os repositórios que podem ler. A tabela mostra proprietário/nome, estado
ativado, membros, contagem de execuções retidas, retenção e última sincronização. Use filtragem, classificação,
controles de coluna e paginação habilitados. Abra o link do provedor para o repositório externo, a página de detalhes da
atividade sincronizada ou a caixa de diálogo de configurações. Uma associação ausente ou um repositório removido pode
produzir um estado de detalhe inacessível.

A página de detalhes combina informações gerais, retenção, duração da última sincronização/dados, intervalo configurado,
trabalho atual e fluxos de trabalho recentes, problemas e solicitações pull. Gerentes com acesso de gerenciamento de
repositório e administradores também veem atividades de alerta de segurança. Os trabalhos pendentes/em execução mostram
progresso; avisos e falhas incluem erros de segurança categorizados.

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

Os visualizadores e gerentes recebem um resumo das configurações do repositório somente leitura. Tentar novamente erros
de carregamento/salvamento após a recuperação; inspecione [Tarefas de sincronização](/docs/next/guide-jobs) em busca de
acesso do provedor, limite de taxa ou falhas de sincronização.

<a id="local-user-and-group-management"></a>

## Grupos de acesso locais

Em Acesso de grupos do repositório, atribua Viewer ou Manager, altere ou remova a concessão. Direitos diretos e herdados
se somam; Manager prevalece. Gerenciamento ainda exige papel global Manager; administradores mantêm acesso total.
Remoções valem na próxima solicitação, salvo outra concessão. Grupos locais aceitam contas locais e OIDC, sem
sincronizar claims OIDC.

[Grupos de acesso locais](/docs/next/users#local-access-groups)

<a id="delete-local-tracking"></a>

## Excluir o rastreamento local

Administradores do sistema podem selecionar **Eliminar repositório** na página de detalhes ou no diálogo de configurações.
A confirmação identifica o repositório e explica a exclusão permanente dos workflows, execuções, issues, pull requests,
alertas de segurança, configurações, permissões, histórico de webhooks, estado de sincronização e histórico de
notificações associados localmente. A conta do provedor e os dados do repositório no provedor permanecem inalterados.

A exclusão fica bloqueada durante uma sincronização; aguarde a conclusão e tente novamente. Solicitações pendentes são
excluídas com o repositório. As assinaturas de notificações perdem o filtro desse repositório; uma assinatura restrita
somente a ele é excluída em vez de se tornar global. Os canais compartilhados são preservados.

O repositório pode ser adicionado novamente pela seleção de provedor existente. O rastreamento recomeça sem restaurar
o histórico ou as configurações locais anteriores.
