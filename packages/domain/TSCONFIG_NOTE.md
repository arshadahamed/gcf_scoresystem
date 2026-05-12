The tsconfig.json uses `"extends": "./node_modules/@scf/config/tsconfig/node.json"` (relative path) instead of the idiomatic `"@scf/config/tsconfig/node.json"` form.

This is a workaround for a tsconfck/Vite 5 bug where the exports-map resolver appends `.json.json` when resolving JSON files through package export maps, causing vitest to fail. The relative path bypasses the exports resolver entirely.

If Vite or tsconfck is upgraded and the bug is fixed, restore the idiomatic form.
