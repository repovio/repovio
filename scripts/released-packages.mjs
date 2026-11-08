import { appendFileSync } from 'node:fs';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

/** Select deployments by Changesets package identity rather than a shared publication boolean. */
export function releasedPackages(packages) {
  return {
    app: packages.some(
      /** Check whether an entry matches `entry.name === 'repovio'`. */ (entry) => entry.name === 'repovio',
    ),
    website: packages.some(
      /** Check whether an entry matches `entry.name === '@repovio/website'`. */ (entry) =>
        entry.name === '@repovio/website',
    ),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const selected = releasedPackages(JSON.parse(process.env.PACKAGES || '[]'));
  for (const [name, value] of Object.entries(selected)) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
  }
}
