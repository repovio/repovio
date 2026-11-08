---
title: 'Alertas de verificação secreta'
description: 'Revise alertas de verificação secreta com acesso de gerenciamento no escopo do repositório.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

<a id="access-and-provider-support"></a>

## Acesso e suporte do provedor

Abra **Visão geral → Alertas de segurança → Alertas de verificação secreta**. Os gerentes precisam de acesso de
gerenciamento ao repositório; administradores de sistema podem inspecionar todos os repositórios. Os visualizadores não
podem acessar dados de alerta. Listas, opções de filtro, contadores, detalhes, atividade do repositório e métricas do
painel aplicam as mesmas restrições de acesso.

GitHub oferece suporte a esse tipo de alerta por meio de suas APIs de segurança. GitLab mapeia vulnerabilidades de
verificação de dependência, SAST e detecção de segredo para as visualizações de alerta correspondentes, sujeitas a
permissões de instância/licença e token. Forgejo e Gitea atualmente relatam esses tipos como não suportados. Um aviso
para um tipo indisponível não falha em outros escopos de sincronização.

<a id="review-findings"></a>

## Revise as descobertas

Use pesquisa e repositório disponível, provedor, gravidade e filtros de estado, classificação, colunas visíveis e
paginação. Os estados incluem `OPEN`, `RESOLVED` e `DISMISSED`; a gravidade inclui crítica, alta, média, baixa,
informativa e desconhecida. Os filtros secretos incluem adicionalmente o tipo de segredo e o provedor de segredo; nunca
insira um valor secreto real. Os limites de data atualizados e a pesquisa de texto específica do tipo ajudam a
restringir listas grandes. Selecione uma descoberta para inspecionar o tipo de segredo, o local seguro, o estado de
detecção e os metadados do provedor sem o valor do segredo. Repovio armazena apenas metadados permitidos; cargas brutas
do provedor, credenciais, fragmentos de token e valores secretos nunca são retidos. Os campos ausentes podem refletir as
capacidades do provedor, em vez de um erro de processamento.

Use **Abrir no provedor** para investigar e corrigir. Repovio não descarta, resolve, reabre ou edita alertas. A primeira
leitura bem-sucedida por repositório e tipo de alerta estabelece uma linha de base silenciosa. Transições abertas,
resolvidas, dispensadas ou reabertas posteriormente podem acionar [canais de notificação](/docs/v1.0/notifications)
assinado.

<a id="empty-unavailable-and-stale-data"></a>

## Dados vazios, indisponíveis e obsoletos

Limpe os filtros e verifique a associação ao gerenciamento se nenhuma descoberta aparecer. Inspecione
[Tarefas de sincronização](/docs/v1.0/guide-jobs) para tipos não suportados ou avisos de permissão. As contas GitHub
OAuth existentes podem precisar de reautorização com `security_events`; consulte
[Provedor OAuth](/docs/v1.0/provider-oauth). Tentar novamente cargas com falha após a recuperação; a ausência de
descobertas visíveis não é prova de que o provedor tenha verificado o repositório ou que todos os tipos de alerta sejam
suportados.
