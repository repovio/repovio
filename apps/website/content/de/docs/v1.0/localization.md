---
title: 'Schnittstellenlokalisierung'
description:
  'Unterstützte Schnittstellensprachen, Fallback-Verhalten und der Prozess zur Pflege von Repovio-Übersetzungen.'
---

> Archivierter Quell-Snapshot. Produktetiketten wurden auf Repovio normalisiert. Verwenden Sie für diese historische
> Version unverändert die Konfigurations-IDs und Container-Referenzen aus den mit Tags versehenen
> Bereitstellungsdateien.

Repovio liefert seine Weboberfläche in Englisch (`en`), Deutsch (`de`), Spanisch (`es`), Französisch (`fr`), Italienisch
(`it`), Niederländisch (`nl`), Polnisch (`pl`) und Portugiesisch aus (`pt`). Das Sprachmenü im Anwendungskopf steht
jedem angemeldeten Benutzer zur Verfügung. Durch die Auswahl einer Sprache wird die Präferenz im Browser-Cookie
`ezrepo-locale` gespeichert und bei zukünftigen Besuchen angewendet.

Englisch ist die deterministische Standard- und Ersatzsprache. Wenn eine Browsereinstellung oder ein gespeichertes
Cookie kein unterstütztes Gebietsschema identifiziert, rendert Repovio Englisch. Datums-, Uhrzeit- und
Zahlenformatierung verwenden das ausgewählte Gebietsschema.

<a id="adding-or-updating-a-locale"></a>

## Ein Gebietsschema hinzufügen oder aktualisieren

1. Fügen Sie `apps/web/i18n/locales/<locale>.json` hinzu oder aktualisieren Sie es, indem Sie `en.json` als vollständige
   Schlüsselreferenz verwenden.
2. Registrieren Sie den Gebietsschemacode, den Dateinamen und den nativen Anzeigenamen in `apps/web/nuxt.config.ts`.
3. Behalten Sie alle Nachrichtenschlüssel in `en.json` bei. Die Web-Testsuite prüft diese Parität für jedes
   ausgelieferte Gebietsschema.
4. Fügen Sie englische und deutsche Nachrichten für jede neue für den Benutzer sichtbare Schnittstellenzeichenfolge
   hinzu und fügen Sie dann die entsprechende Übersetzung zu jedem ausgelieferten Gebietsschema hinzu.
5. Führen Sie `pnpm --filter @repovio/web test`, `pnpm --filter @repovio/web typecheck` und den betroffenen
   Playwright-Test aus.

Anbieternamen, Repository-Namen, Workflow-Namen und andere vom Anbieter bereitgestellte Daten bleiben unverändert, da es
sich nicht um eine Repovio-Schnittstellenkopie handelt.
