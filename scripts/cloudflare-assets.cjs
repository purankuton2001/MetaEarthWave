const fs = require('node:fs');
// Unused archival 28 MB texture exceeds Workers' 25 MiB asset limit.
// Keep the source image; exclude only this unused file from deployment.
fs.writeFileSync('out/.assetsignore', '/earth.jpg\n');
