const pkg = require("../package");
const year = new Date().getFullYear();

console.info(`/*
 * ${pkg.name} v${pkg.version}
 * Copyright (c) ${year} ${pkg.author}. All rights reserved.
 * Released under the ${pkg.license} license
 * @preserve
 */\n`);
