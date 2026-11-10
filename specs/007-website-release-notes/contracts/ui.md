# UI Contract: Website Release Notes

## Public routing

| Destination                       | Contract                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------- |
| `/docs/release-notes`             | English global application history, HTTP 200                                 |
| `/<locale>/docs/release-notes`    | Same history with localized interface for every supported non-English locale |
| History URL plus heading fragment | Native permalink to the corresponding rendered release; survives reload      |
| Existing `/docs/<version>/<slug>` | Existing handbook content, tabs, redirects, version controls unchanged       |

The explicit static route owns history; it must not run through the legacy dynamic-slug redirect. No version-prefixed
history aliases or endpoint are added. Invalid unrelated documentation slugs retain their current 404 behavior.

## Toolbar

- Current handbook with API: Get Started, Guides, API, Release Notes in that order.
- Older handbook without API: keep current conditional API omission; append Release Notes after available existing tabs.
- Release Notes uses section identifier `release-notes`; exactly its item is active on history.
- History destination preserves active locale. Existing tab destinations preserve handbook version when invoked from a
  versioned page; from history they target the stable handbook.
- Hide handbook version selector only on history, since it does not filter release history.
- At narrow widths, wrap or scroll navigation accessibly without whole-page horizontal overflow.

## Content

- Localized H1 and description, English-source notice, one shared English Markdown body.
- No duplicate Changelog H1; retain H2 release headings and H3 Changesets categories, complete original entries, and links.
- Newest released version first, all historical versions included. Do not add dates, previews, pending changesets, or
  website-only release history.
- Desktop TOC and accessible mobile release links use the actual renderer-generated heading IDs. Native heading-link
  behavior and keyboard navigation must work with sticky toolbar offsets.
- Shared body gets `lang="en"`; interface follows locale direction and theme. Isolate English body direction if required
  for readable source text in RTL locales.
- Empty history displays localized empty text without TOC entries. Missing source is a build failure, not an empty page.

## SEO and external requests

- Sitemap includes exactly one history destination per supported locale, independent of handbook version count.
- Localized title and description follow current metadata conventions; preserve canonical and language-alternate behavior.
- Zero browser-time GitHub or other release-service requests. No credentials or application API dependency.
- Existing source links remain links; release reading does not mutate any provider resource.

## Acceptance evidence

Production browser checks cover tab activation, direct reload, version-origin navigation, deep links, locale switching,
empty state, complete multiline migration text, keyboard access, and original-tab regressions. Capture screenshots at
375 px and 1440 px for EN, DE, and one RTL locale in light and dark themes. Verify all 13 locales' destination labels
and routes through automated checks. Container validation proves source inclusion and read-only runtime compatibility.
