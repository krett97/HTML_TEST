# Campo de Slimes: diseño del prototipo

> Versión 0.1.0. Nombre provisional. Nació de pausar el juego del gato
> ([`../../gato-idle/docs/DECISIONES.md`](../../gato-idle/docs/DECISIONES.md)), tomando su base técnica y su
> arte en código ([`../../REUSO.md`](../../REUSO.md)). Referencia de sensación: *Don't Stop The Pop!*
> (cientos de cosas reventando en un área) y el idle del castor (rocas que caen, mundo que cambia por fase).

## 1. El momento divertido

Una explanada de pasto se llena de slimes. **Tocas donde quieres que caigan las flechas**: el círculo se
queda ahí y **dispara solo** cada tanto; las flechas caen, se clavan y todo lo que está dentro recibe
daño. Arrastrar el dedo también mueve el círculo. Al final de la partida el campo está lleno: cientos de
slimes, números de daño y manchas de colores.

**Lección del gato aplicada:** primero el momento de 10 segundos; ningún sistema nuevo hasta que ese se
sienta bien. Poco texto: lo que sigue se descubre jugando.

## 2. El ciclo

1. **Partida de 20 s** (sube con el talento Tiempo hasta 40 s). Los slimes aparecen cada vez más rápido:
   al final, el triple que al principio.
2. **Fin:** reventados y oro ganado. "Mejorar" abre el árbol; "Otra vez", otra partida.
3. **Árbol** en tres secciones (pestañas): se gasta el oro y se vuelve a jugar.

Nunca se pierde: el límite de tiempo es la partida misma. Quien ya jugó, al abrir llega al árbol; quien es
nuevo, directo a jugar (con una pista: "Toca donde quieras que caigan las flechas").

## 3. Los tres árboles (`src/core/datos.ts`)

| Sección | Ataque | Tipo de daño | Talentos |
|---|---|---|---|
| **Jugador** | Tu círculo: lluvia de flechas en el área | Físico | Daño (raíz), Área, Más slimes, Cadencia, Tiempo, Slimes azules, Oro |
| **Mago** | Bola de fuego que revienta en un **rectángulo** (a lo ancho o a lo alto) donde hay alguien | Fuego | Mago (raíz), Mago veloz, Fuego mágico, Explosión grande, Suelo en llamas, Fuego intenso |
| **Arqueros** | Flechas a **un objetivo a la vez**; con Flechas múltiples, a 2, 3… 5 | Físico | Arquero (raíz), Más arqueros (hasta 6), Flechas múltiples, Arco veloz, Puntas de acero |

- Al principio solo se ve **Daño**; cada compra muestra lo que sale de ahí. Las raíces del Mago y los
  Arqueros se ven desde el principio con candado ("Sube Cadencia a 3", "Sube Daño a 3").
- El mago, el fuego y los arqueros pegan en proporción a tu daño (×1.5, ×0.6/s y ×2), así Daño nunca deja
  de valer.
- Cada nodo muestra su ícono, su nivel y su precio; al tocarlo, abajo sale el efecto ("Daño 3 → 4") y el
  botón de compra. Una pestaña con algo comprable lleva un punto rojo; su esquina, el tipo de daño.

## 4. Tipos de daño y enemigos

Seis tipos: **físico, fuego, hielo, energía, muerte y luz**. Hoy hay físico (tus flechas y los arqueros) y
fuego (el mago y su suelo en llamas); los demás se ven en el glosario como "Pronto".

Cada enemigo es **débil** a algunos tipos (recibe ×1.5) y **fuerte** contra otros (×0.5). En la partida,
el golpe a una debilidad sale con número grande y rojizo, y el que choca con una fortaleza, chico y gris.

| Enemigo | Vida | Velocidad | Ataca | Débil a | Fuerte contra | Oro |
|---|---|---|---|---|---|---|
| Slime verde | 3 | Normal | No | Fuego | — | 1 |
| Slime azul (sale con el talento) | 14 | Lenta | No | Hielo, Energía | Fuego | 6 |

**Glosario** (botón del libro en el árbol): los tipos de daño, quién hace cuál y cada enemigo con su vida,
velocidad, si ataca y sus debilidades y fortalezas. Los que aún no salen se ven como silueta con "???".

## 5. La muralla

Abajo del campo hay una muralla de piedra con almenas (se repite a lo ancho) y una torre con estandarte a
la izquierda. Los **arqueros** están parados en los huecos entre almenas y el **mago** arriba de la torre.
Los slimes no bajan hasta ella. Queda espacio para que en el futuro haya enemigos que ataquen la muralla
(el campo `ataque` de cada enemigo ya existe; hoy vale 0).

## 6. Ritmo (`npm run simular`)

Un bot que toca donde hay más slimes cada segundo y compra lo más barato:

| Hito | Minuto |
|---|---|
| Primer arquero | 2.4 |
| Slimes azules | 4.1 |
| Mago | 4.7 |
| Suelo en llamas | 6.6 |
| Partidas de 40 s y cientos de slimes | ~12 |
| Se estanca (falta una segunda zona) | ~15 |

La densidad de slimes se ajusta a la pantalla: en un celular más alto salen proporcionalmente más, para
que se vea igual de lleno (`REF_FIELD_H` en `run.ts`).

## 7. Técnica

- `src/core/` es lógica pura y probada (26 pruebas): `run.ts` (la partida paso a paso; devuelve eventos),
  `stats.ts` (estadísticas desde los talentos), `meta.ts` (oro, árbol, guardado), `datos.ts`, `bot.ts`.
- `src/game/Campo.ts` (Phaser 4) solo dibuja los eventos: sprites reciclados para cientos de slimes,
  números de daño con una **fuente de mapa de bits** hecha al arrancar (`numeros.ts`), partículas, flechas
  de los arqueros dibujadas en una sola capa. El canvas va hasta densidad 2.
- `src/ui/` (Svelte 5): reloj y oro, fin de partida, árbol, glosario y ajustes (sonido, idioma,
  reiniciar desde cero; en la versión de pruebas, oro de regalo y ⏭ para terminar la partida).
- Arte: `tools/arte/dibujar.mjs` con la librería del gato (`lib.mjs`): slimes, mago, arquero, flecha,
  muralla, torre, pasto, decoraciones, 40 íconos y el ícono de la app. Sonido sintetizado (`services/audio.ts`).
- Guardado en `localStorage` (`area-idle:partida`), versionado y tolerante a datos dañados.

## 8. Pendiente (ideas, sin construir)

- **Segunda zona** (bosque, desierto, nieve…) con su jefe al final de una partida; el mundo cambia al pasarla.
- Fuentes de hielo, energía, muerte y luz (nuevos aliados o ramas) y enemigos que las pidan.
- Enemigos que atacan la muralla (y una razón para defenderla).
- Anuncios recompensados: "+10 s a esta partida" y "×2 oro de esta partida".
- Algo de idle mientras no juegas (el mago junta un poco de oro).
