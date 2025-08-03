import { build } from "knyt";

import { Counter } from "../src/Counter";

document.body.appendChild(await build(Counter()));
