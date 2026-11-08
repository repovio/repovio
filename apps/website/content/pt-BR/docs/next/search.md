---
title: 'Pesquisa global'
description: 'Pesquise destinos, repositórios, contas de provedores e execuções de fluxo de trabalho.'
---

<a id="search-the-installation"></a>

## Pesquise a instalação

Abra a pesquisa na barra de aplicativos ou use o atalho de teclado exibido. Insira pelo menos dois caracteres. Os
resultados são agrupados em destinos de navegação, repositórios, contas de provedores e execuções de fluxo de trabalho.
As correspondências de navegação usam rótulos traduzidos de destinos que sua conta pode acessar; os resultados dos
recursos usam nomes de provedores sincronizados.

Percorra os resultados com o teclado ou selecione um com o ponteiro. As correspondências de repositório e conta do
provedor abrem a visualização Repovio correspondente; as correspondências de fluxo de trabalho abrem o URL de execução
do provedor. Pressione **Escape** para fechar a pesquisa e retornar à página anterior. A pesquisa não executa a
descoberta do lado do provedor nem inicia a sincronização.

<a id="access-and-failure-states"></a>

## Acesso e estados de falha

A pesquisa de recursos usa as permissões de repositório do usuário atual. Os resultados da conta do provedor são
limitados aos administradores. Nenhum resultado pode significar uma consulta curta, nenhum registro retido
correspondente ou associação insuficiente. Tente um nome mais específico e inspecione o repositório/trabalho se faltarem
dados sincronizados. O carregamento é mostrado enquanto uma consulta é executada. Em caso de erro de solicitação, tente
novamente a consulta após a recuperação da conectividade da API. A pesquisa nunca revela tokens de provedor ou
credenciais de notificação.
