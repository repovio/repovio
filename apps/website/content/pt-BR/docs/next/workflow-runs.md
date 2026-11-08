---
title: 'Todas as execuções'
description: 'Pesquise, filtre e inspecione o histórico de fluxo de trabalho retido sem alterar os recursos do provedor.'
---

<a id="browse-retained-runs"></a>

## Procure execuções retidas

Abra **Visão geral → Execuções de fluxo de trabalho → Todas as execuções**. Os resultados têm como escopo repositórios
acessíveis e histórico retido. Use filtros de repositório, provedor, status e duração (a duração é inserida em
segundos). Todas as execuções não possuem caixa de pesquisa de texto; Requer atenção, adiciona pesquisa e colunas
detalhadas criadas/iniciadas. Classifique colunas, altere colunas visíveis e paginar os resultados. Limpe os filtros se
uma execução esperada estiver faltando.

As linhas identificam o fluxo de trabalho e o repositório, o provedor, o status normalizado, os carimbos de data/hora do
provedor e a duração quando fornecido. As execuções em fila ou inacabadas podem não ter tempo de conclusão ou duração
final. Os estados normalizados são `queued`, `running`, `success`, `failed`, `cancelled`, `skipped` e `unknown`. Um
estado desconhecido deve ser verificado no provedor.

<a id="open-a-run"></a>

## Abra uma corrida

Use a ação de linha externa para abrir a execução do provedor e seus logs. Repovio não fornece uma tela de execução
editável separada, não faz download de artefatos do provedor nem sincroniza logs completos. Aprovar, executar novamente,
cancelar ou despachar somente no provedor com sua conta de provedor. Para falhas atuais use
[Precisa de atenção](/docs/next/needs-attention); para portões use [Aguardando aprovação](/docs/next/awaiting-approval).

<a id="missing-or-stale-history"></a>

## Histórico ausente ou obsoleto

Uma tabela vazia significa que nenhum registro retido corresponde aos filtros e às suas permissões. A retenção pode
remover execuções mais antigas. Verifique a ativação do repositório, associações, padrões de permissão/negação de fluxo
de trabalho e [Tarefas de sincronização](/docs/next/guide-jobs). Uma atualização de página recarrega os dados
armazenados; ele não ignora a fila de sincronização durável. Tente novamente erros de carregamento após a recuperação da
API.
