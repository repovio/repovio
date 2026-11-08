---
title: 'Painel'
description: 'Leia a integridade atual do fluxo de trabalho, resumos de trabalho e gráficos históricos.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

<a id="scope-and-date-range"></a>

## Escopo e intervalo de datas

Cada cartão e gráfico usa apenas repositórios que o usuário conectado pode ler. Selecione **Últimos 7 dias**,**Últimos
30 dias** ou**Últimos 90 dias** para obter estatísticas históricas. O intervalo de tempo altera totais de execuções
concluídas, tendências de sucesso/erro, duração e distribuição de status. As contagens atuais de filas e itens de
trabalho permanecem resumos do estado atual. Selecione**Atualizar** para recarregar o painel; o controle permanece
ocupado até que suas solicitações sejam resolvidas.

<a id="summary-and-navigation"></a>

## Resumo e navegação

O resumo do fluxo de trabalho contém taxa de sucesso/contagem concluída, contagem ativa em fila/em execução, duração
média concluída, falhas atuais, contagem de aprovação pendente e totais de tempo de execução. Siga as falhas atuais para
[Precisa de atenção](/docs/v1.0/needs-attention) ou as aprovações pendentes para
[Aguardando aprovação](/docs/v1.0/awaiting-approval). Os resumos de problemas e solicitações pull vinculam-se às suas
próprias listas filtradas. Gerentes e administradores também veem resumos de alertas de segurança para repositórios que
gerenciam.

A placa de execuções ativas abre um filtro `preset=active` removível; os cartões de itens de trabalho atuais também
abrem predefinições removíveis. As alterações manuais do filtro liberam a predefinição.

O gráfico de tendências compara execuções concluídas com êxito e com falha ao longo do tempo. A distribuição de status
agrupa estados normalizados. **Últimas execuções** mostra a atividade recente do fluxo de trabalho com links para o
provedor. Não é um visualizador de log do provedor incorporado. Repovio não pode aprovar ou executar novamente fluxos de
trabalho de qualquer widget de painel.

<a id="empty-and-partial-results"></a>

## Resultados vazios e parciais

Nenhuma execução concluída no período selecionado produz gráficos vazios. Nenhuma falha atual é diferente de uma conexão
de provedor ausente. Se uma solicitação falhar, um banner de erro identificará a carga parcial enquanto as seções
disponíveis permanecerão visíveis. Atualize após a recuperação ou inspecione
[Tarefas de sincronização](/docs/v1.0/guide-jobs) e a última sincronização do repositório.
