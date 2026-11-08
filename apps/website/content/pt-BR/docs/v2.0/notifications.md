---
title: 'Canais de notificação'
description: 'Crie destinos de notificação globais, inscreva-se em eventos e teste a entrega.'
---

<a id="access-and-channel-list"></a>

## Acesso e lista de canais

Abra **Operações → Notificações → Canais**. Os canais são de configuração Repovio global, não de configuração do
gerenciador de propriedade do repositório. Os administradores do sistema criam, editam, testam, ativam/desativam e
excluem canais. O status de gerenciador de repositório não concede administração de canal. A tabela mostra nome, tipo,
metadados de destino seguro, eventos inscritos, estado ativado e horário de atualização; use filtros de
tipo/habilitados, classificação, controles de coluna e paginação.

<a id="create-a-destination"></a>

## Crie um destino

Escolha **Adicionar canal**, insira um nome, selecione um tipo e configure o destino:

- **E-mail:** Host/porta SMTP, segurança de transporte, remetente, autenticação opcional e destinatários.
- **Gotify:** URL do servidor, token do aplicativo e prioridade.
- **ntfy:** servidor, tópico, autenticação/token opcional e prioridade.
- **Discord:** destino do webhook.
- **URL Apprise personalizado:** um URL de serviço Apprise compatível.
- **Navegador push:** usuários destinatários; cada destinatário deve ativar [seu dispositivo](/docs/v2.0/browser-push).

Configure [assinaturas e visualização de eventos](/docs/v2.0/notification-rules) na mesma caixa de diálogo. Salve e
aguarde a solicitação antes de fechar. Falhas na validação ou salvamento deixam o formulário disponível para correção.

<a id="edit-test-and-remove"></a>

## Edite, teste e remova

O destino é criptografado em repouso. Você pode salvá-lo, mas não pode lê-lo novamente. A edição preserva suas
credenciais armazenadas, a menos que **Substituir configuração de destino** esteja selecionado. O tipo de canal não pode
ser alterado; crie um novo canal. Um canal migrado marcado como**Requer reconfiguração** não pode ser reativado até que
seu destino seja substituído. Os canais push do navegador usam assinaturas de usuários e rejeitam um segredo de destino
de transporte.

Use a ação de teste de linha para enviar uma notificação real ao destino configurado; ele não modifica os dados do
provedor. Revise o resultado em [Histórico de entrega](/docs/v2.0/notification-history). Desative um canal para pausar a
entrega ou exclua-o quando não for mais necessário. A exclusão é executada imediatamente. Nunca cole credenciais em
capturas de tela ou relatórios de suporte.

Email, Gotify, ntfy, Discord e destinos personalizados usam a CLI Apprise incluída na API; um servidor Apprise separado
não é necessário. Se uma solicitação falhar, tente novamente após a recuperação da API. Uma lista vazia significa que
nenhum canal configurado visível corresponde aos filtros; limpe os filtros ou crie um canal. Os detalhes da falha na
entrega contêm apenas mensagens de erro com dados sensíveis removidos.
