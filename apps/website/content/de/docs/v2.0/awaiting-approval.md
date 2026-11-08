---
title: 'Ausstehende Freigaben'
description: 'Finden Sie Anbieter-Genehmigungstore und öffnen Sie deren externe Genehmigungsbildschirme.'
---

<a id="identify-approval-gates"></a>

## Genehmigungstore identifizieren

Öffnen Sie **Workflow-Ausführungen → Ausstehende Freigaben**, um synchronisierte Workflows anzuzeigen, die wegen einer
menschlichen Entscheidung angehalten wurden. Suchen Sie nach Workflow oder Repository und überprüfen Sie Repository,
Anbieter und den zugehörigen Pull-/Merge-Anforderungskontext. Das Seitenleistenabzeichen spiegelt sichtbare
übereinstimmende Läufe wider; Mitgliedschaftsbeschränkungen gelten sowohl für das Abzeichen als auch für den Tisch.

Verwenden Sie **Pull-Anfrage öffnen** für den Kontext oder**Im Anbieter genehmigen**, um die Workflow-Seite des
Anbieters zu öffnen. GitLab kann die zugehörige Änderung als Zusammenführungsanforderung bezeichnen. Die
Workflow-Genehmigung unterscheidet sich von der Codeüberprüfung oder der Zusammenführungsgenehmigung.

<a id="complete-the-provider-action"></a>

## Schließen Sie die Anbieteraktion ab

Authentifizieren Sie sich beim Anbieter und nutzen Sie dessen Genehmigungskontrollen, wenn Ihr Anbieterkonto autorisiert
ist. Repovio sendet niemals eine Genehmigungsanfrage. Bei einem Webhook- oder Abstimmungslesevorgang muss der
aktualisierte Anbieterstatus beobachtet werden, bevor die Zeile verschwindet. Aktualisieren Sie anschließend die
gespeicherte Warteschlange; Eine unveränderte Zeile unmittelbar nach der Genehmigung kann auf eine
Synchronisierungsverzögerung hinweisen.

Eine leere Warteschlange bedeutet, dass derzeit kein sichtbarer synchronisierter Lauf einer Genehmigung bedarf, nicht
aber, dass jedes Repository verbunden ist oder dass Ihr Anbieterkonto über Genehmigungsrechte verfügt. Versuchen Sie es
bei einem Ladefehler erneut und überprüfen Sie [Jobs](/docs/v2.0/guide-jobs).
