---
title: 'Perfil'
description: 'Altere nomes de contas locais e nome de usuário com verificação de senha atual.'
---

<a id="edit-a-local-profile"></a>

## Edite um perfil local

Abra **Configurações → Geral**. Os usuários locais podem atualizar nomes/sobrenomes opcionais e seu nome de usuário de
login. Nomes pessoais são usados ​​como identidade de exibição preferencial; o nome de usuário permanece disponível para
identificação inequívoca. Os campos têm no máximo 255 caracteres e o nome de usuário não pode ficar vazio.

A alteração do nome de usuário requer a senha atual. Insira-o no formulário de perfil e selecione salvar. Os nomes por
si só não exigem alteração de nome de usuário. Aguarde a solicitação; o salvamento bem-sucedido atualiza a conta atual.
Um nome de usuário duplicado e uma senha atual incorreta produzem erros de validação diferentes. Corrija o campo afetado
e tente novamente.

<a id="identity-managed-accounts"></a>

## Contas gerenciadas por identidade

Os usuários OIDC não podem alterar seu nome de usuário ou nomes de perfil localmente. Repovio sincroniza nomes de
declarações de identidade verificadas no login bem-sucedido. Altere-os no provedor de identidade e faça login novamente.
O avatar permanece editável separadamente em [Configurações de avatar](/docs/next/avatar). Se a solicitação de perfil
falhar, tente novamente após a recuperação da API; não envie senhas por meio de canais de suporte.
