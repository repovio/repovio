---
title: 'avatar'
description: 'Carregue, importe, corte ou remova sua foto de perfil.'
---

<a id="choose-an-image"></a>

## Escolha uma imagem

Cada usuário conectado, incluindo usuários OIDC, pode abrir **Configurações → Geral** e fazer upload de um JPEG, PNG ou
WebP de até 2 MiB. Como alternativa, importe uma imagem de um URL HTTPS público. Uma imagem não quadrada abre a caixa de
diálogo de corte; escolha o corte quadrado e confirme antes do upload. Cancelar a caixa de diálogo deixa o avatar atual
inalterado.

Repovio remove metadados de imagem, renderiza um WebP de 256 × 256 e armazena apenas essa imagem normalizada em
PostgreSQL. Ele não retém a imagem original ou o URL remoto. Tipo inválido, imagem superdimensionada, falha de
importação, falha de decodificação e falha de upload são relatados separadamente; escolha uma imagem compatível ou tente
novamente após corrigir a fonte/conectividade.

<a id="remove-and-display"></a>

## Remover e exibir

Use a ação remover para excluir a imagem atual. Uma remoção malsucedida deixa o avatar existente disponível para nova
tentativa. Sem imagem, a interface exibe iniciais com base no nome pessoal ou nome de usuário. Os grupos de avatares de
membros do repositório mostram no máximo cinco membros e resumem membros adicionais. A visibilidade do avatar segue as
permissões do recurso que o contém. Alterar um avatar Repovio não atualiza a imagem do perfil do seu provedor.
