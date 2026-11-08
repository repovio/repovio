---
title: 'Histórico de entrega'
description: 'Inspecione os resultados da notificação e os detalhes de entrega segura por tentativa.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

<a id="review-deliveries"></a>

## Revise as entregas

Somente administradores de sistema podem abrir **Notificações → Histórico de entrega**. A tabela distingue entregas de
eventos de testes e mostra tipo de evento, repositório, link sujeito/provedor, canal, estado, contagem de tentativas,
próxima tentativa e erro final limpo. Filtre por tipo/status e use classificação, controles de coluna e paginação.

Abra um delivery para seu assunto, solicitante quando presente, canal, status e carimbo de data/hora por tentativa,
rótulo do dispositivo e erro. Segredos, destinos de transporte brutos e credenciais de provedor nunca são retornados. As
entregas push do navegador podem conter tentativas para dispositivos assinados separados.

<a id="interpret-outcomes"></a>

## Interpretar resultados

O tempo de pendência/nova tentativa descreve o trabalho de entrega durável, não uma fila de fluxo de trabalho do
provedor. Uma tentativa bem-sucedida confirma que o transporte aceitou a entrega; uma falha requer investigação da
configuração do canal e do serviço de destino. Não há ações de repetição, cancelamento ou repetição manual nesta
visualização do histórico. Corrija o [canal](/docs/v1.0/notifications) e use sua ação de teste para verificar a
configuração.

Uma tabela vazia pode refletir filtros ou nenhuma entrega retida. Uma solicitação de lista/detalhe com falha é exibida
separadamente; tente novamente após a recuperação. A sincronização inicial pode intencionalmente não produzir entregas
de ciclo de vida. O link externo do assunto abre o contexto do provedor sem conceder acesso de gravação ao Repovio.
