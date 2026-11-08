---
title: 'Localização de interface'
description: 'Idiomas de interface suportados, comportamento de fallback e o processo para manter traduções Repovio.'
---

Repovio envia sua interface web em inglês (`en`), alemão (`de`), espanhol (`es`), francês (`fr`), italiano (`it`),
holandês (`nl`), polonês (`pl`) e português (`pt`). O menu de idiomas no cabeçalho do aplicativo está disponível para
todos os usuários conectados. A escolha de um idioma salva a preferência no cookie do navegador `repovio-locale` e a
aplica em visitas futuras.

O inglês é o padrão determinístico e o substituto. Quando uma preferência do navegador ou um cookie salvo não identifica
uma localidade suportada, Repovio renderiza o inglês. A formatação de data, hora e número usa a localidade selecionada.

<a id="sign-in-controls-and-language-flags"></a>

## Controles de acesso e bandeiras

As páginas de acesso e configuração do primeiro administrador oferecem abaixo do formulário um seletor com idioma ativo
e bandeira. Ele permanece ocupado durante o carregamento. Um botão separado alterna entre Sistema, Claro e Escuro e
salva a preferência. Seu ícone mostra a opção atual; a dica e o nome acessível descrevem essa opção e a próxima ação.

O menu mostra bandeiras SVG locais decorativas ao lado dos nomes nativos. Os nomes continuam sendo os rótulos
acessíveis; as bandeiras não os substituem. A correspondência entre idioma e país é: `en` → GB, `de` → DE, `es` → ES,
`fr` → FR, `it` → IT, `nl` → NL, `pl` → PL, `pt` → PT.

Os arquivos em `apps/web/public/flags` vêm de [flag-icons v7.5.0](https://github.com/lipis/flag-icons/tree/v7.5.0), sob
a licença MIT incluída. Não exigem solicitações externas de imagens. Ao adicionar um idioma, incluir a bandeira e sua
correspondência em `useLocales`.

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
