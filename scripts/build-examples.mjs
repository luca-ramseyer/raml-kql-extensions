// Builds the example extensions in examples/ and packages each into dist/<name>.rkqlx with
// raml-kql-ext (from @raml-kql/extension-cli).
//
//   npm run build
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const examples = path.join(root, 'examples');
const out = path.join(root, 'dist');
const cli = path.join(root, 'node_modules', '@raml-kql', 'extension-cli', 'dist', 'cli.cjs');

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const name of readdirSync(examples)) {
  const dir = path.join(examples, name);
  if (!existsSync(path.join(dir, 'package.json'))) continue;
  rmSync(path.join(dir, 'dist'), { recursive: true, force: true });
  // @raml-kql/extension-api is bundled into each extension (it only talks to the host).
  const common = {
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    logLevel: 'warning',
  };
  if (existsSync(path.join(dir, 'src', 'extension.ts'))) {
    await build({
      ...common,
      entryPoints: [path.join(dir, 'src', 'extension.ts')],
      outfile: path.join(dir, 'dist', 'extension.js'),
    });
  }
  const ui = path.join(dir, 'src', 'ui');
  if (existsSync(ui)) {
    const scripts = readdirSync(ui).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    const entries = scripts.filter((f) => existsSync(path.join(ui, f.replace(/\.ts$/, '.html'))));
    // UI scripts are classic scripts: a sandboxed frame has an opaque origin, and module
    // scripts would need CORS to load from rkql-ext:.
    await build({
      ...common,
      format: 'iife',
      entryPoints: entries.map((f) => path.join(ui, f)),
      outdir: path.join(dir, 'dist', 'ui'),
      loader: { '.json': 'json' },
      minify: true,
    });
    for (const file of readdirSync(ui).filter((f) => /\.(html|css)$/.test(f))) {
      copyFileSync(path.join(ui, file), path.join(dir, 'dist', 'ui', file));
    }
  }
  execFileSync('node', [cli, 'package', dir, '-o', path.join(out, `${name}.rkqlx`)], {
    stdio: 'inherit',
  });
}
