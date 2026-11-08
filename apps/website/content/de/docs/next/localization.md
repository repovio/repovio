---
title: 'Schnittstellenlokalisierung'
description: 'Unterstützte Schnittstellensprachen, Fallback-Verhalten und der Prozess zur Pflege von Repovio-Übersetzungen.'
---

Repovio liefert seine Weboberfläche in Englisch (`en`), Deutsch (`de`), Spanisch (`es`), Französisch (`fr`), Italienisch
(`it`), Niederländisch (`nl`), Polnisch (`pl`) und Portugiesisch aus (`pt`). Das Sprachmenü im Anwendungskopf steht
jedem angemeldeten Benutzer zur Verfügung. Durch die Auswahl einer Sprache wird die Präferenz im Browser-Cookie
`repovio-locale` gespeichert und bei zukünftigen Besuchen angewendet.

Englisch ist die deterministische Standard- und Ersatzsprache. Wenn eine Browsereinstellung oder ein gespeichertes
Cookie kein unterstütztes Gebietsschema identifiziert, rendert Repovio Englisch. Datums-, Uhrzeit- und
Zahlenformatierung verwenden das ausgewählte Gebietsschema.

<a id="sign-in-controls-and-language-flags"></a>

## Anmeldebedienung und Sprachflaggen

Anmeldung und Einrichtung des ersten Administrators bieten unter dem Formular eine Sprachauswahl mit aktiver Sprache und
Flagge. Während des Ladens bleibt sie beschäftigt. Eine separate Theme-Schaltfläche wechselt zwischen System, Hell und
Dunkel und speichert die Auswahl. Ihr Symbol zeigt die aktuelle Einstellung; Tooltip und zugänglicher Name beschreiben
diese und die nächste Aktion.

Das Sprachmenü zeigt dekorative lokale SVG-Flaggen neben den muttersprachlichen Namen. Namen bleiben die zugänglichen
Beschriftungen; Flaggen ersetzen sie nicht. Die Zuordnung von Sprache zu Land lautet: `en` → GB, `de` → DE, `es` → ES,
`fr` → FR, `it` → IT, `nl` → NL, `pl` → PL, `pt` → PT.

Die Dateien in `apps/web/public/flags` stammen aus [flag-icons v7.5.0](https://github.com/lipis/flag-icons/tree/v7.5.0)
unter der beiliegenden MIT-Lizenz. Externe Bildanfragen sind nicht erforderlich. Bei einer neuen Sprache auch Flagge und
Zuordnung in `useLocales` ergänzen.

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
