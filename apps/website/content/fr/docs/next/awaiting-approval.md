---
title: "En attente d'approbation"
description: 'Recherchez les portes d’approbation des fournisseurs et ouvrez leurs écrans d’approbation externes.'
---

<a id="identify-approval-gates"></a>

## Identifier les portes d'approbation

Ouvrez **Exécutions de workflow → En attente d'approbation** pour afficher les workflows synchronisés suspendus pour une
décision humaine. Recherchez par workflow ou référentiel et inspectez le référentiel, le fournisseur et le contexte de
demande d'extraction/fusion associé. Le badge de la barre latérale reflète les exécutions correspondantes visibles ; des
restrictions d'adhésion s'appliquent à la fois au badge et à la table.

Utilisez **Ouvrir la demande d'extraction** pour le contexte ou**Approuver dans le fournisseur** pour ouvrir la page de
workflow appartenant au fournisseur. GitLab peut appeler la modification associée une demande de fusion. L'approbation
du workflow est différente de la révision du code ou de l'approbation de la fusion.

<a id="complete-the-provider-action"></a>

## Terminez l'action du fournisseur

Authentifiez-vous auprès du fournisseur et utilisez ses contrôles d'approbation si votre compte fournisseur est
autorisé. Repovio n’envoie jamais de demande d’approbation. Un webhook ou une lecture de rapprochement doit respecter
l’état du fournisseur mis à jour avant que la ligne ne disparaisse. Actualisez ensuite la file d'attente stockée ; une
ligne inchangée immédiatement après l'approbation peut refléter un délai de synchronisation.

Une file d'attente vide signifie qu'aucune exécution synchronisée visible ne nécessite actuellement d'approbation, et
non que chaque référentiel soit connecté ou que votre compte fournisseur dispose de droits d'approbation. En cas de
panne de charge, réessayez et inspectez [Tâches de synchronisation](/docs/next/guide-jobs).
