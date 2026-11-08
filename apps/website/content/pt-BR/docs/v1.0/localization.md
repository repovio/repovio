---
title: 'Localização de interface'
description: 'Idiomas de interface suportados, comportamento de fallback e o processo para manter traduções Repovio.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos foram normalizados para Repovio. Para esta versão histórica,
> use os identificadores de configuração e as referências de contêiner dos arquivos de implantação marcados inalterados.

Repovio envia sua interface web em inglês (`en`), alemão (`de`), espanhol (`es`), francês (`fr`), italiano (`it`),
holandês (`nl`), polonês (`pl`) e português (`pt`). O menu de idiomas no cabeçalho do aplicativo está disponível para
todos os usuários conectados. A escolha de um idioma salva a preferência no cookie do navegador `ezrepo-locale` e a
aplica em visitas futuras.

O inglês é o padrão determinístico e o substituto. Quando uma preferência do navegador ou um cookie salvo não identifica
uma localidade suportada, Repovio renderiza o inglês. A formatação de data, hora e número usa a localidade selecionada.

<a id="adding-or-updating-a-locale"></a>

## Adicionando ou atualizando uma localidade

1. Adicione ou atualize `apps/web/i18n/locales/<locale>.json` usando `en.json` como referência de chave completa.
2. Registre seu código de localidade, nome de arquivo e nome de exibição nativo em `apps/web/nuxt.config.ts`.
3. Mantenha todas as chaves de mensagens presentes em `en.json`; o conjunto de testes da web verifica essa paridade para
   cada localidade enviada.
4. Adicione mensagens em inglês e alemão para cada nova string de interface visível ao usuário e, em seguida, adicione a
   tradução correspondente a cada localidade enviada.
5. Execute `pnpm --filter @repovio/web test`, `pnpm --filter @repovio/web typecheck` e o teste Playwright afetado.

Os nomes dos provedores, dos repositórios, dos fluxos de trabalho e outros dados fornecidos pelo provedor permanecem
inalterados porque não são cópias da interface Repovio.
