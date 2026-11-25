# Campo de Slimes (nombre provisional)

Idle de áreas para celular (vertical, una mano) y navegador. Tocas donde quieres que caigan tus
flechas y el círculo dispara solo ahí. Cada **nivel** trae una cantidad de slimes y hay que reventarlos
todos antes de que se acabe el tiempo; si no, se reintenta o se juega el anterior para juntar oro. Con
el oro mejoras tres árboles: el tuyo, el del mago (rectángulos de fuego) y el de los arqueros (un
objetivo a la vez, luego varios).

**Estado: prototipo 0.2.0.** Una zona (Campo verde) con niveles sin fin, dos enemigos (slime verde y
azul, desde el nivel 4), 18 talentos en tres secciones, seis tipos de daño (dos en juego: físico y
fuego) y un glosario de enemigos.

- Diseño y decisiones: [`docs/DISENO.md`](docs/DISENO.md)
- Lo que se tomó del juego del gato: [`../REUSO.md`](../REUSO.md)

## Comandos

```
npm install
npm run dev          # jugar en el navegador
npm test             # pruebas de la lógica (Vitest)
npm run check        # tipos de los componentes Svelte
npm run simular      # simulador de balance: un bot juega 80 partidas y compra
npm run e2e          # pruebas de punta a punta (Playwright, puerto 4174)
npm run arte         # redibuja todo el arte (SVG en código → PNG)
npm run build:archivo     # el juego en un solo HTML (con modo pruebas)
npm run build:compartir   # el mismo HTML sin modo pruebas
npm run apk:prueba        # APK de prueba (visor WebView)
```
