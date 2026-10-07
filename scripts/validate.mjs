// Validates catalog.json the way the app reads it, and checks that every entry really points to
// a package of that extension:
//   - the file matches the JSON Schema (run separately by CI with ajv)
//   - ids are unique
//   - each package link downloads (https, at most 50 MB), is a .rkqlx (zip) with a package.json,
//     and the manifest's publisher.name equals the entry's id
//   - prints whether the package is signed (informational: "Verified" is decided by the app)
//
//   node scripts/validate.mjs [catalog.json]
import { readFileSync } from 'node:fs';

import { unzipSync } from 'fflate';

const file = process.argv[2] ?? 'catalog.json';
const catalog = JSON.parse(readFileSync(file, 'utf8'));
const problems = [];
const MAX = 50 * 1024 * 1024;

const ids = new Set();
for (const entry of catalog.extensions) {
  const label = entry.id;
  if (ids.has(entry.id)) problems.push(`${label}: listed twice`);
  ids.add(entry.id);

  let response;
  try {
    response = await fetch(entry.package, { redirect: 'follow' });
  } catch (error) {
    problems.push(`${label}: could not download ${entry.package} (${error.message})`);
    continue;
  }
  if (!response.ok) {
    problems.push(`${label}: ${entry.package} answered HTTP ${response.status}`);
    continue;
  }
  const data = new Uint8Array(await response.arrayBuffer());
  if (data.length > MAX) {
    problems.push(`${label}: the package is larger than 50 MB`);
    continue;
  }
  let files;
  try {
    files = unzipSync(data);
  } catch {
    problems.push(`${label}: the download is not a .rkqlx (zip) package`);
    continue;
  }
  const names = Object.keys(files);
  const roots = new Set(names.map((n) => n.split('/')[0]));
  const prefix = !names.includes('package.json') && roots.size === 1 ? `${[...roots][0]}/` : '';
  const manifestBytes = files[`${prefix}package.json`];
  if (manifestBytes === undefined) {
    problems.push(`${label}: the package has no package.json`);
    continue;
  }
  const manifest = JSON.parse(new TextDecoder().decode(manifestBytes));
  const actual = `${manifest.publisher}.${manifest.name}`;
  if (actual !== entry.id) {
    problems.push(`${label}: the package is ${actual}, not ${entry.id}`);
    continue;
  }
  const signed = names.includes(`${prefix}SIGNATURE.json`);
  console.log(`${label} ${manifest.version}: ok${signed ? ' (signed)' : ' (not signed)'}`);
}

if (problems.length > 0) {
  console.error(problems.map((p) => `  ${p}`).join('\n'));
  process.exit(1);
}
console.log(`${catalog.extensions.length} entries OK.`);
