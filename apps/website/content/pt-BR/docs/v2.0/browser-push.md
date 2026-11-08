---
title: 'Envio do navegador'
description: 'Ative notificações por dispositivo e entenda os requisitos do servidor e do navegador.'
---

<a id="server-requirements"></a>

## Requisitos do servidor

O push do navegador é um transporte nativo e não usa Apprise. O operador de implantação define todas as três
configurações:

```dotenv
WEB_PUSH_VAPID_PUBLIC_KEY=...
WEB_PUSH_VAPID_PRIVATE_KEY=...
WEB_PUSH_VAPID_SUBJECT=mailto:admin@example.com
```

Gere um par de chaves VAPID com `npx web-push generate-vapid-keys`. O assunto é um URI `mailto:` ou `https:`. Mantenha a
chave privada em segredo. Sem a configuração completa, o push do navegador é mostrado como indisponível. Use um contexto
de navegador seguro e um navegador que suporte service workers e API Push.

<a id="enable-or-disable-this-device"></a>

## Habilite ou desabilite este dispositivo

Use **Ativar neste dispositivo** e conceda permissão de notificação do navegador quando solicitado. A assinatura
pertence ao usuário e navegador atuais. Um administrador seleciona usuários destinatários em um canal push do navegador;
cada destinatário precisa de um dispositivo habilitado. Recusar a permissão do navegador impede a assinatura; ajuste a
permissão do navegador do site e tente novamente, se desejar. Verifique a disponibilidade/contagem de dispositivos e os
erros relatados antes de enviar um teste.

Desativar o push remove a assinatura deste dispositivo, e não de outros dispositivos. Endpoints e chaves são
criptografados e desduplicados com uma impressão digital não secreta. As respostas HTTP 404/410 removem assinaturas
expiradas. Um navegador indisponível, falta de configuração do servidor, permissão negada ou falha na solicitação de
assinatura exigem que a causa correspondente seja corrigida; a atualização por si só não pode conceder permissão ao
navegador. Consulte [Histórico de entrega](/docs/v2.0/notification-history) para tentativas.
