---
title: 'Ereignisabonnements'
description: 'Wählen Sie Ereignisse, Repository-Filter und Workflow-Muster innerhalb eines Kanals aus.'
---

<a id="configure-subscriptions"></a>

## Abonnements konfigurieren

Systemadministratoren öffnen ein [Kanal](/docs/next/notifications) und konfigurieren Ereignisabonnements in seinem
Erstellungs-/Bearbeitungsdialog. Die alte `/notifications/rules`-Route leitet zu Kanälen weiter; Es gibt keinen
separaten Regelverwaltungsbildschirm. Diese Seite dokumentiert diesen Kanaldialog-Workflow.

Wählen Sie zwischen Erfolg, Misserfolg oder Wiederherstellung des Workflows. Pull-Request geöffnet, geschlossen, erneut
geöffnet oder zusammengeführt; Problem geöffnet, geschlossen oder erneut geöffnet; und unterstützte geöffnete/aufgelöste
Abhängigkeits-, Code- oder Secret-Alert-Ereignisse. Wählen Sie für jedes Ereignis Repository-Einschränkungen aus. Eine
leere Repository-Auswahl bedeutet alle anwendbaren Repositorys, nicht keine. Workflow-Namensmuster gelten nur für
Workflow-Ereignisse. Speichern Sie den Kanal, um seine Abonnements beizubehalten.

<a id="preview-matches"></a>

## Vorschau der Übereinstimmungen

Die Vorschau ist nur verfügbar, wenn mindestens ein Workflow-Ereignis ausgewählt ist. Bei Nicht-Workflow-Abonnements
wird es deaktiviert. Verwenden Sie die Vorschau, um vor dem Speichern bis zu 20 aktuelle übereinstimmende
Workflow-Datensätze zu überprüfen. Eine Übereinstimmung bestätigt die aktuellen Filterbedingungen anhand der
gespeicherten Daten. Es wird keine Lieferung in die Warteschlange gestellt. Unterscheiden Sie keine Übereinstimmungen
von nie synchronisierten, fehlgeschlagenen Synchronisierungs- oder Teildatenbenachrichtigungen. Erweitern Sie die
Repository-/Musterauswahl oder überprüfen Sie [Jobs](/docs/next/guide-jobs), wenn Quelldaten nicht verfügbar sind.

Die anfängliche Synchronisierung stellt eine stille Basislinie für Lebenszyklusereignisse her und überflutet Kanäle
nicht mit alten offenen/geschlossenen Übergängen. Später beobachtete Übergänge können zu Lieferungen führen. Die
Verfügbarkeit und Leseberechtigung des Anbieters schränken ein, welche Sicherheitsereignisse beobachtet werden können.
Repovio ändert niemals Anbieterressourcen, um eine Regelübereinstimmung zu erreichen.

Wenn die Vorschau oder das Speichern fehlschlägt, behalten Sie die Formularwerte bei, überprüfen Sie den API-Status und
versuchen Sie es erneut. Eine leere Vorschau allein beweist nicht, dass kein zukünftiges Ereignis zutrifft oder dass
jedes ausgewählte Repository erfolgreich synchronisiert wurde.
