---
title: 'Navegação'
description: 'Encontre destinos de aplicativos, status, configurações pessoais e informações de versão.'
---

<a id="sidebar"></a>

## Barra lateral

**Visão geral** contém painel, execuções de fluxo de trabalho, problemas, solicitações pull e alertas de segurança
compatíveis.**Operações** contém repositórios, trabalhos e notificações.**Administração** contém contas de provedor,
usuários e configurações para administradores de sistema. As execuções do fluxo de trabalho se expandem para Todas as
execuções, Aguardando aprovação e Precisa de atenção; a navegação de notificação expõe canais e, para administradores,
histórico de entrega.

A barra lateral oferece apenas destinos que sua função pode acessar. Os alertas de segurança requerem permissão de
gerenciamento. Recolher a barra lateral preserva os destinos rotulados. Em telas estreitas, use o controle de navegação
para abrir a barra lateral. O manual documenta todas as áreas de função, mesmo quando sua conta não consegue vê-las.

<a id="status-and-search"></a>

## Status e pesquisa

Use [Procurar](/docs/next/search) na barra de aplicativos para encontrar destinos e recursos sincronizados. A barra de
status informa a conectividade da API, a atividade de sincronização e as contagens de fluxo de trabalho em execução. Seu
contador de fluxo de trabalho em execução abre [Tarefas de sincronização](/docs/next/guide-jobs); a atividade de
sincronização pode incluir o progresso do item. A recuperação da conexão atualiza o status. Um indicador desconectado
significa que as atualizações ao vivo podem estar desatualizadas; inspecione a API e tente novamente antes de confiar
nas contagens exibidas.

<a id="personal-notifications"></a>

## Notificações pessoais

O sino abre os controles do dispositivo e até cinco entregas push recentes destinadas a você. As entradas respeitam
as permissões atuais de repositórios e alertas; uma lista vazia não revela o histórico de outras pessoas. Entregue
significa aceitação pelo serviço push, não leitura. Administradores do sistema podem abrir o histórico administrativo
de entregas no mesmo painel.

<a id="user-menu-and-footer"></a>

## Menu do usuário e rodapé

O menu do usuário abre [Configurações](/docs/next/settings) pessoal, controles de idioma e aparência e sai. O rodapé
leva ao projeto e ao manual. Selecionar a versão exibida abre a caixa de diálogo changelog. Suas notas de lançamento e
indicador de atualização ajudam a identificar uma versão disponível; aplicar uma atualização continua sendo uma operação
de implantação. Os links do provedor abrem recursos externos. As ações exigem permissões do próprio provedor e estão
fora de Repovio.

<a id="table-controls"></a>

## Controles de tabela compartilhada

Quando oferecidas, as opções de tabela configuram a visibilidade, a ordem e a fixação das colunas; a coluna de ações
permanece fixada à direita. As opções persistem por tabela no navegador. A paginação usa a consulta de página. As listas
de fluxo de trabalho, problemas, solicitações pull e alertas começam em 25 linhas; Trabalhos, repositórios, provedores,
usuários, canais e histórico de entrega começam em 10. Os controles de filtro podem ser desativados enquanto suas opções
são carregadas. Limpe as predefinições do painel ou altere os filtros para retornar à sua própria consulta. Esses
controles alteram a visão local, nunca os registros do provedor.
