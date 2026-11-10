---
title: 'Schnittstellenlokalisierung'
description: 'Unterstützte Schnittstellensprachen, Fallback-Verhalten und der Prozess zur Pflege von Repovio-Übersetzungen.'
---

Repovio unterstützt alle 13 Website-Sprachen und behält Italienisch, Niederländisch, Polnisch und Portugiesisch bei.
Damit stehen 17 App-Sprachen zur Verfügung. Portugiesisch (`pt`) und brasilianisches Portugiesisch (`pt-BR`) sind getrennte
Optionen; die vollständigen Sprachcodes stehen in der Tabelle unten.

Englisch ist Standard und Rückfallsprache. Das Browser-Cookie `repovio-locale` hat Vorrang vor einer unterstützten
Browsersprache; nicht unterstützte Einstellungen fallen auf Englisch zurück. Ein Sprachwechsel erhält Route und
Abfrageparameter. Datums-, Zeit- und Zahlenformate folgen der Sprache; konfigurierte 24-Stunden- und ISO-Regeln bleiben
bestehen. Arabisch und Urdu verwenden Rechts-nach-links-Layouts, alle anderen Sprachen Links-nach-rechts-Layouts.
Namen, Repository-Kennungen, URLs und Code von Providern behalten ihre ursprünglichen Werte und lesbare Richtung.

<a id="sign-in-controls-and-language-flags"></a>

## Anmeldebedienung und Sprachflaggen

Anmeldung, Ersteinrichtung und angemeldetes Benutzermenü bieten dieselben muttersprachlichen Namen und dekorativen
lokalen SVG-Flaggen. Namen bleiben die zugänglichen Beschriftungen. Lange Menüs sind scrollbar und per Tastatur bedienbar.
Das auslösende Steuerelement bleibt während des gesamten Downloads beschäftigt; weitere Sprachwechsel sind gesperrt.
Bei einem Fehler stellt Repovio die vorherige Sprache wieder her und zeigt eine übersetzte Fehlermeldung. Lade die Seite
neu und wähle die Sprache erneut, um einen fehlgeschlagenen Download zu wiederholen.

Die öffentlichen Authentifizierungsseiten bieten außerdem eine Darstellungsschaltfläche, die System, Hell und Dunkel
durchläuft. Symbol, Tooltip und zugänglicher Name beschreiben aktuelle Einstellung und nächste Aktion.

Zuordnung von Sprachcode zu Flaggenland:

| Sprache | Land | Sprache | Land |
| ------- | ---- | ------- | ---- |
| `en`    | GB   | `zh-CN` | CN   |
| `de`    | DE   | `hi`    | IN   |
| `es`    | ES   | `ar`    | SA   |
| `fr`    | FR   | `bn`    | BD   |
| `it`    | IT   | `pt-BR` | BR   |
| `nl`    | NL   | `id`    | ID   |
| `pl`    | PL   | `ur`    | PK   |
| `pt`    | PT   | `ru`    | RU   |
| `ja`    | JP   |         |      |

Die Dateien unter `apps/web/public/flags` stammen aus [flag-icons v7.5.0](https://github.com/lipis/flag-icons/tree/v7.5.0) unter der enthaltenen MIT-Lizenz. Externe Bild- oder Übersetzungsdienste sind nicht erforderlich.

<a id="adding-or-updating-a-locale"></a>

## Sprache hinzufügen oder aktualisieren

1. Verwende `apps/web/i18n/locales/en.json` als vollständige aktuelle Nachrichtenvorlage. Übersetze alle ausgelieferten
   Kataloge einschließlich zugänglicher Beschriftungen, Validierung, Zuständen, Parametern und Pluralbedeutung.
2. Registriere Code, Sprachkennung, muttersprachlichen Namen, Katalogdatei, Richtung, Flaggenland und Nuxt-UI-Kennung in
   `apps/web/shared/locales.ts`. Erhalte vorhandene Codes und unterscheide `pt` von `pt-BR`.
3. Ordne den installierten Nuxt-UI-Export in `apps/web/app/utils/locales.ts` zu, etwa `zh_cn` oder `pt_br`.
4. Ergänze die lokale lizenzierte Flagge mit Quellenangabe. Importiere keine Website-Implementierung in die App.
5. Prüfe Kataloge und Browserabläufe. Tests vergleichen Website- und App-Sprachen und erkennen fehlende Nachrichten,
   falsche Parameter, ungültige Syntax, UI-Zuordnungen und fehlende Flaggen. Englischer Fallback ersetzt keine vollständige
   Übersetzung; unveränderte Produktnamen und technische Literale sind zulässig.

Aktiviere Node.js 26.13.0 und pnpm 11.28.9, starte die lokale App und führe aus:

```sh
corepack pnpm --dir apps/web test
corepack pnpm --dir apps/web lint
corepack pnpm --dir apps/web typecheck
corepack pnpm --dir apps/web exec playwright test tests/e2e/localization.spec.ts \
  tests/e2e/auth-preferences.spec.ts tests/e2e/localization-rtl.spec.ts
```

Prüfe Screenshots in Hell/Dunkel und schmalen/breiten Layouts, besonders RTL-, CJK- und indische Schriften. Aktualisiere alle aktuellen `next`-Übersetzungen konsistent; veröffentlichte Versionsarchive bleiben unverändert.
