import { createRequire } from "module";
export const modRequire = createRequire(import.meta.url);

/**
 * avoids issues around module imports for running in node
 */