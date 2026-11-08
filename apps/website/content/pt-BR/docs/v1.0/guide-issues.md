---
title: 'Problemas'
description: 'Procure problemas sincronizados, filtros e detalhes somente leitura.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

<a id="browse-and-filter"></a>

## Navegue e filtre

Abra **Visão geral → Problemas**. Listas, resumos, opções de filtros e detalhes usam associações de repositório.
Pesquise por título ou número; filtre por provedor, repositório, ciclo de vida, autor, responsável, marco, rótulos e
horário de atualização, quando disponível. Os limites de data atualizados incluem UTC. Vários rótulos selecionados devem
corresponder. Altere a classificação, as colunas visíveis e a paginação com os controles da tabela. Os cartões de resumo
contam problemas abertos, atualizados recentemente, atribuídos e obsoletos. A sincronização inicial lê todos os
problemas abertos e fechados atualizados nos 90 dias anteriores. A desatualização ajuda a encontrar trabalhos abertos
não supervisionados; isso não altera o estado do provedor.

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
[Tarefas de sincronização](/docs/v1.0/guide-jobs). A retenção pode remover registros fechados antigos. Uma página de
detalhes inacessível pode indicar acesso revogado ou registro removido; retornar à lista. Repita as falhas de
solicitação após a recuperação da API.
