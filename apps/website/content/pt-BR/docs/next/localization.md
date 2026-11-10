---
title: 'Localização de interface'
description: 'Idiomas de interface suportados, comportamento de fallback e o processo para manter traduções Repovio.'
---

O Repovio oferece os 13 idiomas do site e mantém italiano, holandês, polonês e português: são 17 idiomas no aplicativo.
Português (`pt`) e português do Brasil (`pt-BR`) continuam como opções separadas. A tabela abaixo lista todos os códigos.

O inglês é o idioma padrão e de fallback. O cookie `repovio-locale` tem prioridade sobre um idioma compatível do navegador;
preferências incompatíveis usam inglês. A troca preserva a rota e os parâmetros de consulta. Datas, horas e números seguem
o idioma sem alterar as políticas configuradas de 24 horas e ISO. Árabe e urdu usam layouts da direita para a esquerda;
os demais idiomas, da esquerda para a direita. Nomes, identificadores de repositório, URLs e código dos provedores mantêm
seus valores originais e uma direção legível.

<a id="sign-in-controls-and-language-flags"></a>

## Controles de login e bandeiras

Login, configuração inicial e menu do usuário oferecem os mesmos nomes nativos e bandeiras SVG locais decorativas.
Os nomes continuam sendo os rótulos acessíveis. Menus longos permitem rolagem e uso pelo teclado. O controle permanece
ocupado durante todo o download e bloqueia novas seleções. Se houver falha, o Repovio restaura o idioma anterior e mostra
um erro traduzido. Recarregue a página e selecione o idioma novamente para tentar o download outra vez.

As páginas públicas também oferecem um botão de tema que alterna Sistema, Claro e Escuro. O ícone mostra a preferência;
a dica e o nome acessível descrevem a configuração atual e a próxima ação.

Correspondência entre idioma e país da bandeira:

| Idioma | País | Idioma  | País |
| ------ | ---- | ------- | ---- |
| `en`   | GB   | `zh-CN` | CN   |
| `de`   | DE   | `hi`    | IN   |
| `es`   | ES   | `ar`    | SA   |
| `fr`   | FR   | `bn`    | BD   |
| `it`   | IT   | `pt-BR` | BR   |
| `nl`   | NL   | `id`    | ID   |
| `pl`   | PL   | `ur`    | PK   |
| `pt`   | PT   | `ru`    | RU   |
| `ja`   | JP   |         |      |

Os arquivos de `apps/web/public/flags` vêm de [flag-icons v7.5.0](https://github.com/lipis/flag-icons/tree/v7.5.0), sob a licença MIT incluída. Nenhum serviço externo de imagens ou tradução é necessário.

<a id="adding-or-updating-a-locale"></a>

## Adicionar ou atualizar um idioma

1. Use `apps/web/i18n/locales/en.json` como referência completa atual. Traduza todos os catálogos distribuídos,
   incluindo rótulos acessíveis, validação, estados, parâmetros e significado dos plurais.
2. Registre código, identificação do idioma, nome nativo, arquivo, direção, país e identificação Nuxt UI em
   `apps/web/shared/locales.ts`. Preserve os códigos existentes e diferencie `pt` de `pt-BR`.
3. Mapeie o export Nuxt UI instalado em `apps/web/app/utils/locales.ts`, por exemplo `zh_cn` ou `pt_br`.
4. Adicione a bandeira local com licença e atribuição. Não importe a implementação do site no aplicativo.
5. Execute as verificações e os cenários de navegador. Os testes comparam os idiomas do site e do aplicativo e rejeitam
   mensagens ausentes, parâmetros incompatíveis, sintaxe inválida, mapeamentos UI e bandeiras ausentes. O fallback em inglês
   não substitui uma tradução completa; nomes de produtos e literais técnicos podem permanecer iguais.

Ative Node.js 26.13.0 e pnpm 11.28.9, inicie o aplicativo local e execute:

```sh
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web exec playwright test tests/e2e/localization.spec.ts \
  tests/e2e/auth-preferences.spec.ts tests/e2e/localization-rtl.spec.ts
```

Inspecione capturas em temas claro/escuro e telas estreitas/largas, especialmente RTL, CJK e escritas indianas. Atualize todas as traduções atuais de `next` de forma consistente; os arquivos de versões publicadas permanecem intactos.
