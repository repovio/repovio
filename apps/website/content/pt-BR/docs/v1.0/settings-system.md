---
title: 'Configurações do sistema'
description: 'Configure políticas de retenção independentes e o formato de data/hora padrão.'
---

> Instantâneo de origem arquivado. Os rótulos dos produtos usam Repovio. Use os identificadores de configuração e as
> referências de contêiner dos arquivos de implantação marcados desta versão inalterados.

<a id="administrator-access"></a>

## Acesso de administrador

Somente administradores de sistema podem abrir **Configurações → Sistema**. O carregamento mostra um esqueleto; um
carregamento com falha fornece um erro e uma nova tentativa em vez de padrões editáveis ​​inferidos de dados ausentes.
Aguarde a solicitação de configurações antes de salvar as alterações.

<a id="retention-defaults"></a>

## Padrões de retenção

Defina períodos de retenção padrão separados para execuções de fluxo de trabalho, problemas e solicitações pull. Cada
valor deve ser de 1 a 3.650 dias. Um repositório pode substituir cada valor correspondente de forma independente; uma
substituição de repositório vazio restaura o padrão do sistema. A retenção afeta o histórico armazenado localmente, não
os registros do lado do provedor. Reduzir a retenção pode remover dados armazenados mais antigos, portanto, verifique
primeiro os requisitos de relatórios e investigação.

Os controles de retenção e rastreamento do repositório estão documentados em [Repositórios](/docs/v1.0/repositories).
Uma linha histórica ausente pode refletir a retenção em vez de uma falha na sincronização do provedor.

<a id="datetime-formatting"></a>

## Formatação de data/hora

Defina o formato padrão de data/hora e inspecione sua visualização ao vivo antes de salvar. A seleção de localidade
ainda controla o texto da interface traduzido e a formatação sensível à localidade. Salve uma vez; sucesso e falhas de
validação/API são relatados separadamente. Tente novamente após correção ou recuperação de API. Uma preferência de
formatação nunca altera os carimbos de data/hora originais do provedor.
