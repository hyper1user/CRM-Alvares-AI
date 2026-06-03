# Node 22 Development Runtime

This repository should be developed with Node.js 22 LTS.

Node 24 can break native dependency installation on Windows because `better-sqlite3` may fall back to a local `node-gyp` build and require Visual Studio C++ Build Tools.

## Local Windows Runtime

For this workspace, Node.js `v22.22.3` was installed locally at:

```txt
D:\Project_CRM\.tools\node-v22.22.3-win-x64
```

Use it for the current PowerShell session:

```powershell
$env:Path = "D:\Project_CRM\.tools\node-v22.22.3-win-x64;$env:Path"
node -v
pnpm.cmd install
```

Expected Node version:

```txt
v22.22.3
```

## Version Markers

The repository includes:

- `.nvmrc`
- `.node-version`
- `package.json` `engines`

These files keep local tools, CI, and future contributors pointed at Node 22.
