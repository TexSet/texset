# TexSet desktop

An Electron shell that runs TexSet as a native app — no Docker, no separate
LaTeX install for most people. It bundles a small TeX distribution (TinyTeX) and
prefers a system LaTeX install if you already have one.

Electron is used (rather than Tauri) because TexSet has a Node backend — the
Next.js API, `better-sqlite3`, and spawning `latexmk` — so the standalone server
runs inside the app via Electron's Node.

> Status: scaffold. The build has to be assembled and tested on the target OS
> (Windows for the Microsoft Store). The notes below are the steps; expect to
> iterate, especially around the native module and TinyTeX.

## How it works

`main.js` starts `resources/standalone/server.js` (the Next standalone server) on
`127.0.0.1:7475`, then opens a window pointing at it. It sets:

- `TEXSET_DATA_DIR` to the OS user-data folder, so projects persist per user.
- `TEXSET_TEX_BIN_DIR` to the bundled TinyTeX `bin` folder. The app prefers a
  system LaTeX engine and only falls back to this (see `src/lib/tex.ts`).

## Building (outline)

Run these on the OS you're targeting. For the Microsoft Store, that's Windows.

1. **Build the web app** (repo root):
   ```bash
   pnpm install
   pnpm build
   ```

2. **Assemble the server bundle** into `desktop/resources/standalone`:
   - copy `.next/standalone` → `desktop/resources/standalone`
   - copy `.next/static` → `desktop/resources/standalone/.next/static`
   - copy `public` → `desktop/resources/standalone/public`

3. **Rebuild the native module for Electron.** `better-sqlite3` ships a binary
   built for system Node; it must match Electron's Node ABI. From `desktop/`,
   after `pnpm install`, run `electron-rebuild` against
   `resources/standalone/node_modules` (or reinstall `better-sqlite3` there with
   Electron headers). This is the step most likely to need attention.

4. **Bundle TinyTeX** into `desktop/resources/tinytex`. Install TinyTeX
   (https://yihui.org/tinytex/) for the target platform and copy its folder here
   so `resources/tinytex/bin/<platform>/latexmk` exists. TinyTeX installs missing
   packages on demand (needs internet the first time for uncommon ones).

5. **Package**:
   ```bash
   cd desktop
   pnpm install
   pnpm dist:win     # or dist:mac / dist:linux
   ```

## Microsoft Store

`electron-builder`'s `appx` target produces an `.appx`/`.msix`. To publish:

- Register on Partner Center and create the app listing to get your identity
  values, then set `build.appx.identityName`, `publisher`, and
  `publisherDisplayName` in `package.json` to match.
- Build the package, then upload it through Partner Center.

The MSIX runs the bundled `server.js` and TinyTeX binaries from inside the package
(allowed), so no external install is required at runtime.

## Try it in dev

With the web app built and `resources/standalone` assembled, from `desktop/`:

```bash
pnpm install
pnpm start
```
