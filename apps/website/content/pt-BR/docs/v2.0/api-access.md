---
title: 'Acesso à API'
description: 'Abra a documentação da API instalada e use a referência de API estática específica da versão.'
---

<a id="installed-api-documentation"></a>

## Documentação da API instalada

Cada servidor API Repovio fornece sua documentação API interativa em `/docs`. No desenvolvimento local, abra
`http://localhost:3001/docs`. Os terminais REST usam o caminho base `/api/v1`.

Para uma implantação, use a origem da API acessível externamente e o caminho configurado pelo seu proxy reverso. Por
exemplo, se o servidor API estiver exposto em `https://repovio.example.com`, sua documentação poderá ser exposta em
`https://repovio.example.com/docs`. O aplicativo da web não faz proxy automaticamente dessa rota; configure seu proxy
explicitamente se quiser expô-lo. `/api/v1/docs` não é a rota de documentação.

A referência instalada descreve o aplicativo em execução. As solicitações feitas a partir dessa referência interativa
usam sua instância e exigem autenticação e permissões documentadas para cada operação. Consulte
[Autenticação](/docs/v2.0/authentication) para login e configuração de conta. Os tokens de acesso MCP destinam-se a
[Clientes MCP](/docs/v2.0/mcp), não como tokens de suporte REST gerais.

<a id="static-release-reference"></a>

## Referência de lançamento estático

O [Referência da API](/docs/v2.0/api-reference) neste site é um instantâneo somente leitura gerado a partir da revisão
exata do aplicativo da versão selecionada. Ele não precisa de uma instância Repovio em execução e não envia solicitações
de API. Escolha a versão correspondente à sua instalação; a página `/docs` instalada permanece oficial para sua
compilação em execução.

Pesquise por método, caminho ou descrição, inspecione parâmetros e esquemas de resposta ou baixe o JSON OpenAPI completo
na página de referência. Os identificadores de esquema e as descrições da API retêm o idioma do contrato gerado.
