---
title: 'Trabalhos de sincronização de repositório'
description: 'Monitore e inicie manualmente os trabalhos de sincronização do repositório Repovio.'
---

Abra **Jobs** na seção**Operações** para inspecionar o trabalho de sincronização de cada repositório habilitado que você
pode acessar. O resumo mostra trabalhos em execução, em espera, com falha e ociosos. A tabela identifica o repositório,
o provedor, os domínios sincronizados, a fase atual, o progresso do item, a tentativa e a mensagem de erro segura mais
recente.

<a id="read-job-state"></a>

## Ler o estado do trabalho

- **Idle** significa que nenhuma sincronização está na fila ou em execução para o repositório.
- **Pendente** significa que a solicitação durável está aguardando o horário agendado ou um trabalhador disponível.
- **Em execução** mostra a fase ativa e o progresso do item quando o fornecedor informa um total mensurável.
- **Failed** retém um resumo seguro de erros e uma contagem de tentativas até que o repositório seja enfileirado
  novamente.
- **Aviso** significa que outros escopos foram concluídos enquanto um ou mais tipos de alerta de segurança estavam
  indisponíveis.

A coluna escopos identifica se o trabalho lê fluxos de trabalho, problemas, pull requests, alertas de segurança ou uma
combinação deles. Um tempo de espera pode refletir a coalescência do webhook, a espera de novas tentativas ou instruções
de limite de taxa do provedor; atualizar repetidamente a página não avança o horário programado.

<a id="start-or-retry-synchronization"></a>

## Inicie ou tente novamente a sincronização

Um administrador do sistema pode iniciar cada tarefa atualmente inativa, com falha ou de aviso com **Executar tudo** ou
usar**Executar** ou**Tentar novamente** em uma linha do repositório. Os trabalhos que já estão pendentes ou em execução
não serão enfileirados novamente. O botão de inicialização permanece em estado de carregamento até que a solicitação
seja concluída; em seguida, siga a linha conforme ela passa por pendente, em execução e inativa ou com falha.

Os trabalhos manuais usam a mesma fila de sincronização do provedor durável e somente leitura que a reconciliação
agendada e os webhooks verificados. Eles recuperam dados do provedor, mas não podem modificar repositórios, fluxos de
trabalho, problemas ou pull requests.

Os trabalhos bem-sucedidos retornam para **Idle** e não são retidos como histórico de execução. Os trabalhos com falha
permanecem visíveis até que um webhook posterior, um ciclo de reconciliação ou uma nova tentativa manual os coloque na
fila novamente. Se uma nova tentativa continuar falhando, verifique a conta do provedor, os escopos de leitura, o URL
base e o estado do limite de taxa em [Administração e configurações](/docs/v2.0/provider-accounts) antes de tentar
novamente.

<a id="refresh-and-table-controls"></a>

## Atualização e controles de tabela

Os trabalhos são atualizados automaticamente a cada cinco segundos. O padrão da tabela é dez linhas por página e lembra
o tamanho da página. Executar tudo inclui trabalhos inativos, com falha e de aviso; linhas pendentes/em execução não
podem ser enfileiradas novamente. As falhas de carregamento inicial e em segundo plano são mostradas separadamente das
falhas de trabalho. A classificação e a paginação ajudam a inspecionar instalações maiores.
