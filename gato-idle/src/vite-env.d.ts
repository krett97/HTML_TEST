/// <reference types="vite/client" />
/// <reference types="svelte" />

/** Versión de package.json, inyectada por vite.config.ts. */
declare const __APP_VERSION__: string;
/** Modo pruebas disponible (botón 🛠). Se apaga con PRUEBAS=no al compilar la versión de tienda. */
declare const __PRUEBAS__: boolean;
