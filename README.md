# Raml KQL extensions

The catalog behind the **Browse** tab of [Raml KQL](https://github.com/luca-ramseyer/raml-kql)'s Extensions view. `catalog.json` is a list of pointers: for each extension an id, a name, a description and a link to its package. The app fetches it only when you open Browse, and shows what an extension asks for before you install it.

Being listed here is **discovery, not endorsement**. Nothing in the catalog decides what an extension may do (that comes from the package and your permission prompts), and "Verified by Raml KQL" comes from the package's signature, never from this list.

## Add your extension

1. Build and publish a `.rkqlx` package ([Writing extensions](https://github.com/luca-ramseyer/raml-kql/blob/main/docs/guides/writing-extensions.md)), for example as a GitHub release asset. A link like `https://github.com/you/repo/releases/latest/download/my-extension.rkqlx` always serves the newest release.
2. Open a pull request that adds **one entry** to `catalog.json`:

   ```json
   {
     "id": "contoso.whois-lookup",
     "displayName": "WHOIS Lookup",
     "publisher": "contoso",
     "description": "Look up the registrar and age of domains in your results.",
     "categories": ["Enrichment"],
     "package": "https://github.com/contoso/raml-kql-whois/releases/latest/download/whois-lookup.rkqlx",
     "repository": "https://github.com/contoso/raml-kql-whois",
     "version": "1.0.0",
     "license": "MIT"
   }
   ```

3. CI checks the file against the [JSON Schema](https://github.com/luca-ramseyer/raml-kql/blob/main/packages/pack-schema/schemas/rkql-extension-catalog.schema.json) and downloads each package to confirm it is a valid `.rkqlx` whose `package.json` has the entry's id. Run the same check yourself with `npm install && npm run validate`.

## What gets listed

- The source code is public, under an open-source licence.
- The package link is https and serves the `.rkqlx` of the extension in the entry.
- The extension's README explains each permission it asks for and why, and any data it sends anywhere.
- No telemetry or hidden network access. Extensions can only reach hosts they declare, and users are asked first, but a listing is also a promise about intent.
- No impersonation: no Microsoft or other trademarks in the name, no misleading publisher.
- Maintainers may remove an entry that breaks these rules, stops working, or is reported as harmful.

A listing is a review of the entry, not a security audit of the code. Users decide at install time from the permission prompt.

## Your own catalog

Any HTTPS address that serves a file in this format works. Organizations can keep a private list of approved extensions and add its address to the `extensions.catalog.urls` setting in Raml KQL. The first catalog that lists an id wins, so an organization's list can also pin its own version of a package.

## Licence

[MIT](LICENSE).
