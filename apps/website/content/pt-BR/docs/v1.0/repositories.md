---
title: 'Repositórios'
description: 'Rastreie repositórios, inspecione atividades e configure sincronização e acesso local.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

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
[conta do provedor](/docs/v1.0/provider-accounts) habilitado.

Os administradores podem ativar/desativar o rastreamento, **Atualizar dados do provedor** e enfileirar uma sincronização
somente leitura. A identidade do repositório usa a conta do provedor e o ID do repositório do provedor estável.
Renomeações/transferências preservam histórico, filtros, associações e canais; a atualização de metadados rejeita um ID
diferente no caminho antigo em vez de reatribuí-lo. Os repositórios desativados retêm os dados armazenados, mas param de
participar da sincronização.

<a id="retention-filters-and-memberships"></a>

## Retenção, filtros e associações

Os administradores definem substituições separadas de retenção de execução de fluxo de trabalho, emissão e solicitação
pull, cada uma de 1 a 3.650 dias. Um valor vazio restaura o [padrão do sistema](/docs/v1.0/settings-system)
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
[Webhooks de repositório](/docs/v1.0/provider-webhooks) para configuração e verificação.

Os visualizadores e gerentes recebem um resumo das configurações do repositório somente leitura. Tentar novamente erros
de carregamento/salvamento após a recuperação; inspecione [Tarefas de sincronização](/docs/v1.0/guide-jobs) em busca de
acesso do provedor, limite de taxa ou falhas de sincronização.
