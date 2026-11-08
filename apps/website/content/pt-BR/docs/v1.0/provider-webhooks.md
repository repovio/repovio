---
title: 'Configuração do webhook do repositório'
description: 'Configure webhooks somente leitura assinados para repositórios GitHub, GitLab, Forgejo e Gitea.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

Repovio pode receber webhooks assinados para sincronizar um repositório rastreado antes do intervalo normal de pesquisa.
Ele nunca cria, atualiza, exclui ou testa webhooks por meio de APIs de provedores. Um administrador configura cada
webhook do repositório manualmente em GitHub, GitLab, Forgejo ou Gitea.

Abra **Repositórios**, selecione um repositório rastreado e use seu cartão**Webhook do repositório**. O cartão mostra o
URL de retorno de chamada específico do repositório, gera ou aceita um segredo de assinatura e relata a última entrega
aceita. Repovio nunca envia essa configuração ao provedor.

Webhooks são uma otimização, não a fonte da verdade. A carga assinada deve identificar o repositório selecionado pela
URL de retorno de chamada. Repovio então lê os dados atuais por meio do adaptador de provedor somente leitura
configurado. As entregas aceitas enfileiram uma sincronização de repositório durável; as entregas recebidas em 15
segundos são combinadas. O intervalo de sondagem de fallback padrão é de 30 minutos.

<a id="configure-a-repository-webhook"></a>

## Configure um webhook de repositório

1. Adicione o repositório a Repovio e abra seu cartão **Repository webhook**.
2. Copie o URL de retorno de chamada.
3. Gere um segredo de assinatura exclusivo e de alta entropia ou cole o token de assinatura exato fornecido pelo
   provedor. Nunca reutilize um token de acesso ou segredo de outro repositório.
4. Salve o segredo. Repovio o criptografa com AES-256-GCM e nunca o retorna por meio da API.
5. Configure o URL de retorno de chamada e o segredo nas configurações do provedor desse repositório.
6. Mantenha a verificação TLS habilitada e envie uma entrega de teste.

Os retornos de chamada estáveis usam `/api/webhooks/<provider>/<repository-id>`. Retornos de chamada
`/api/v1/webhooks/<provider>/<repository-id>` versionados também estão disponíveis. URLs de retorno de chamada da conta
do provedor Repovio 0.2.9 e anteriores não são mais aceitos. Após a atualização, recrie cada webhook com seu retorno de
chamada de repositório e um novo segredo de repositório.

Entregas bem-sucedidas retornam HTTP `202` com `{ "accepted": true }`. IDs de entrega de provedor repetidos retornam
`{ "accepted": true, "duplicate": true }` e não enfileiram outra sincronização. Repositórios desconhecidos ou
desabilitados, contas de provedor desabilitadas, segredos ausentes, assinaturas inválidas, IDs de repositório de
provedor incompatíveis e IDs de entrega ausentes são rejeitados sem expor detalhes de configuração.

A sincronização na fila sobrevive às reinicializações da API. Várias instâncias usam concessões de banco de dados e não
sincronizam a mesma conta do provedor simultaneamente. Os cabeçalhos com limite de taxa atrasam o trabalho da conta
afetada, enquanto as novas tentativas limitadas lidam com falhas transitórias.

<a id="github-actions"></a>

## GitHub Ações

1. Abra **Configurações → Webhooks** do repositório e escolha**Adicionar webhook**.
2. Use `https://repovio.example.com/api/webhooks/github/<repository-id>` como URL de carga útil.
3. Selecione `application/json`, cole o segredo do repositório e assine **Execuções de fluxo de trabalho**
   (`workflow_run`).
4. Mantenha a verificação SSL habilitada e salve o webhook.

Repovio verifica `X-Hub-Signature-256` no corpo bruto e usa `X-GitHub-Delivery` para idempotência. Consulte
[documentação do evento webhook](https://docs.github.com/en/webhooks/webhook-events-and-payloads) de GitHub.

<a id="gitlab-pipelines"></a>

## Pipelines GitLab

1. Abra **Configurações → Webhooks** do projeto e selecione**Adicionar novo webhook**.
2. Use `https://repovio.example.com/api/webhooks/gitlab/<repository-id>` como URL.
3. Gere um **Token de assinatura** e salve seu valor completo, incluindo `whsec_`, no cartão de repositório Repovio.
4. Selecione **Eventos de pipeline**, mantenha a verificação SSL ativada, salve e envie uma entrega de teste.

Repovio verifica assinaturas de Webhooks padrão HMAC-SHA256 e prefere `webhook-id` para idempotência. Os cabeçalhos
herdados `X-Gitlab-Token` e `X-Gitlab-Event-UUID` permanecem compatíveis com instâncias mais antigas. Consulte
[documentação do webhook](https://docs.gitlab.com/user/project/integrations/webhooks/) de GitLab.

<a id="forgejo-actions"></a>

## Forgejo Ações

1. Abra **Configurações → Webhooks** do repositório e adicione um webhook JSON nativo**Forgejo**.
2. Use `https://repovio.example.com/api/webhooks/forgejo/<repository-id>` como URL de destino.
3. Cole o segredo do repositório e selecione **Eventos Push** além de quaisquer eventos de Ações disponíveis.
4. Mantenha a verificação TLS habilitada e salve o webhook.

Repovio verifica `X-Forgejo-Signature` e usa `X-Forgejo-Delivery` para idempotência. Os cabeçalhos compatíveis com Gitea
permanecem aceitos para compatibilidade com Forgejo. Veja o Forgejo
[documentação do webhook](https://forgejo.org/docs/latest/user/repository/webhooks/).

<a id="gitea-actions"></a>

## Gitea Ações

1. Abra **Configurações → Webhooks** do repositório e adicione um webhook JSON nativo**Gitea**.
2. Use `https://repovio.example.com/api/webhooks/gitea/<repository-id>` como URL de destino.
3. Cole o segredo do repositório e selecione **Eventos push** além de quaisquer eventos de fluxo de trabalho
   disponíveis.
4. Mantenha a verificação TLS habilitada e salve o webhook.

Repovio verifica `X-Gitea-Signature` no corpo bruto e usa `X-Gitea-Delivery` para idempotência. Veja o Gitea
[documentação do webhook](https://docs.gitea.com/usage/repository/webhooks/).

<a id="troubleshooting"></a>

## Solução de problemas

- `401` significa que Repovio não pôde verificar o repositório, tipo de provedor, segredo, assinatura, ID do repositório
  de carga útil ou ID de entrega. Confirme o UUID do repositório do retorno de chamada e o segredo exato.
- `202` com `duplicate: true` é esperado quando um provedor tenta novamente uma entrega.
- Uma entrega bem-sucedida aciona apenas a sincronização somente leitura; ele nunca modifica o fluxo de trabalho do
  provedor.
- Verifique `/api/health` para status de sincronização do provedor persistente.
- Defina `SCHEDULER_SYNC_INTERVAL_SECONDS=1800` para o substituto de 30 minutos.
- `SCHEDULER_ENABLED=false` retém solicitações enfileiradas, mas pausa o enfileiramento e o processamento de fallback.
