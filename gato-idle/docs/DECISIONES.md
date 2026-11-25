# Swat to the Moon: decisiones del juego

> **Estado: en pausa desde la versión 0.36.1 (25 de noviembre de 2026).** El juego funciona, está completo de principio a fin (del vaso a la Luna) y nada se borró. Se pausó para hacer un idle nuevo reusando lo que sirve (ver [`../../REUSO.md`](../../REUSO.md)).
>
> Este documento resume **qué se decidió y por qué**, para quien retome el juego o quiera aprender de él. El detalle de cada versión está en [`DISENO.md`](DISENO.md) (56 secciones); aquí va lo esencial.

---

## 1. El juego en una frase

Un gato tira de la mesa las cosas de su dueño, cada vez más grandes, hasta tirar la Luna. El dueño es influencer: graba los destrozos, cree que son accidentes, se hace famoso y se muda a casas más grandes.

| Dato | Valor |
|---|---|
| Género | Idle / clicker vertical, una mano |
| Plataformas | Android (Capacitor) y web; un solo código |
| Duración | ~2 a 3.4 horas de juego activo hasta el último jefe, según cuántos anuncios se vean |
| Contenido | 63 objetos en 14 cuartos de 4 casas, 7 aliados, 4 jefes y 10 guardianes |
| Idiomas | Español e inglés |
| Dónde jugarlo | Versión pública: https://claude.ai/artifact/G5SBPUgA7jey1n7vhXLr3B · versión con modo pruebas: https://claude.ai/artifact/HJQf6CbwYjMqnohnBpj7aB |

## 2. Principios que guiaron todo

Estos funcionaron y se recomiendan para cualquier juego nuevo.

1. **Un solo gesto.** Siempre es un manotazo, se toca en cualquier parte de la escena. Lo que cambia es lo que se golpea.
2. **Que sea cómico** (DISENO §22). Antes de agregar algo: "¿qué tiene de gracioso?". El gato con cara de "yo no fui", aliados con manías (el perro se lleva la culpa, la cabra embiste sin razón), escalada absurda.
3. **Personajes inspirados en memes, pero originales.** Nunca copias de fotos ni de personajes con dueño.
4. **Nunca cruel.** Solo se rompen cosas; nadie sale lastimado.
5. **Anuncios solo recompensados y opcionales.** Sin intersticiales. Ver un anuncio acelera hasta ~1.7 veces, sin vaciar el juego.
6. **La lógica no sabe de pantallas.** `src/core/` es TypeScript puro: se prueba y se simula en Node sin navegador.

## 3. Decisiones de diseño que se quedaron

| Decisión | Por qué | Dónde |
|---|---|---|
| El objeto avanza hacia la orilla con cada golpe; su posición es la barra de vida | Se entiende sin números | DISENO §3 |
| Tres estilos de rotura: empujar, rasgar, volcar | Variedad visual sin cambiar el gesto | `objects.json` → `estiloRotura` |
| Fuerza (daño) y Valor (dinero por objeto) como las dos compras principales | La tensión clásica del idle: pegar más contra ganar más | DISENO §4, §54 |
| Aliados que pegan solos, cada uno mejor que el anterior | La parte idle; el juego avanza sin tocar | DISENO §21 |
| Críticos con efecto visible en el gato (garras, sombrero, saco) | Cada mejora cambia cómo se ve el gato | DISENO §24, §25 |
| Reinicio con historia: el dueño **sube el video** y se gana seguidores | El prestigio tiene sentido dentro del mundo | DISENO §27 |
| Árbol del canal con 4 ramas para gastar visualizaciones | Decisiones permanentes entre reinicios | DISENO §40 |
| Mudanza a casas más grandes y un jefe al final de cada casa | Cambio de mundo que se siente como avance | DISENO §36, §38, §49 |
| Progresión por niveles: romper N veces cada objeto, guardián al final de cada cuarto | Metas cortas y claras | DISENO §54 |
| Ganancias mientras no estabas, con ×2 por anuncio | Premio al volver | DISENO §32 |
| Tope de 15 toques por segundo | Ni el multitouch ni los autoclickers rompen el balance | `core/limiter.ts` |
| Pantalla principal sin scroll: escena grande y botones gordos de Fuerza y Valor | Lo que más se usa, siempre a un toque | DISENO §55 |
| Modo pruebas (🛠) con dinero infinito, saltar etapas, puntos de guardado y reiniciar | Probar etapas avanzadas en minutos | DISENO §23, §56 |

## 4. Decisiones que se cambiaron (y lo que se aprendió)

| Antes | Después | Lección |
|---|---|---|
| Herramientas que se compraban en una tienda | Críticos dentro de Mejoras | Menos pantallas; la mejora se ve en el gato |
| Habilidades que se abrían solas por metas | Árbol del canal con ramas (§40) | Al jugador le gusta elegir |
| Turbo ×2 sin espera | ×1.5 con 10 min de espera (§50) | Con ×2 el juego se acababa en 0.6 h; los anuncios no deben vaciar el juego |
| Valor avanzaba al siguiente objeto | Valor solo sube lo que paga ese objeto; se avanza por niveles (§54) | Separar "ganar más" de "avanzar" aclara las decisiones |
| Arte de PixelLab (pixel art generado con IA, de pago) | Caricatura plana dibujada en SVG desde código (§53) | La IA no mantenía un estilo parejo y costaba dinero. El dibujo por código es gratis y el estilo queda garantizado por construcción |
| Lista de mejoras con scroll | Pantalla sin scroll y "Más mejoras" en una ventana (§55) | Lo que más se toca debe estar siempre a la vista |
| Tarjeta fija de "Próximo descubrimiento" | Una línea del gato en el tutorial (§56) | Demasiado texto; lo que sigue se descubre jugando |

## 5. Por qué se pausó

Dicho con honestidad, para no repetirlo en el juego nuevo:

- **Creció a puros agregados.** Canal, árbol, investigación, maquinita, tres tipos de crítico, saco, ranking, 4 casas, 4 jefes y 10 guardianes. Cada pieza tenía sentido sola; juntas hacían un juego con mucho texto y mucho que explicar.
- **63 niveles se sentían eternos.** Uno por objeto, con metas que crecían de 10 a 62 roturas, y siempre a la vista "Nivel 27 de 63".
- **Faltaba espectáculo.** Los idle que gustan (por ejemplo, el del castor con rocas que caen) se entienden de un vistazo: tres botones y muchas cosas reventando en pantalla. Aquí había un solo objeto a la vez.

**Lección para el juego nuevo:** definir primero el momento divertido de 10 segundos (qué se ve y qué se siente al tocar) y no agregar un sistema nuevo hasta que ese momento sea bueno por sí solo.

## 6. Ideas que quedaron sin construir

- **Nivel especial contrarreloj.** Una lluvia de objetos con límite de tiempo, como nivel aparte que se desbloquea en la historia. No se definió cuándo se abre ni qué premia.
- **La avalancha** (descartada): una tabla inclinada sobre la mesa donde los objetos que faltan del nivel esperan en fila y bajan hacia el gato, más un caminito de puntos por cuarto con el guardián al final. El código quedó en [`descartado/avalancha.patch`](descartado/avalancha.patch); se aplica desde la raíz del repo con `git apply gato-idle/docs/descartado/avalancha.patch`.
- **Reducir niveles:** mostrar el avance por cuarto ("Cocina 3 de 5"), metas fijas de 10 roturas, o unos 4 niveles por cuarto.
- **Del plan original, nunca hechos:** evento "¡Llegó el dueño!" (luz roja, luz verde), gatos legendarios, personal del canal, comentarios falsos y títulos de video en un feed, skins del gato, compras (pase VIP).

## 7. Decisiones técnicas

| Pieza | Elección | Comentario |
|---|---|---|
| Lenguaje y build | TypeScript + Vite | Sin problemas |
| Escena | Phaser 4 | Partículas, tweens, cámara que sigue al gato |
| Interfaz | Svelte 5 (HTML/CSS encima del canvas) | Textos nítidos y fáciles de adaptar a PC |
| Android | Capacitor 8 | La app de tienda; el APK de prueba usa un visor WebView simple |
| Números grandes | break_infinity.js envuelto en `core/num.ts` | Nadie usa la librería directo |
| Guardado | JSON versionado con migraciones, dos ranuras alternas, autoguardado cada 20 s | Versión 5 del formato |
| Datos | `src/data/*.json`; los `id` nunca se renombran | El guardado depende de ellos |
| Sonido | Sintetizado con Web Audio, sin archivos | Cada objeto elige su receta de golpe y rotura |
| Arte | SVG desde código con `@resvg/resvg-js`, 8 px por unidad del mundo | Paleta y contorno únicos en `tools/vector/lib.mjs` |
| Anuncios | AdMob recompensado detrás de una interfaz; un falso para web | IDs de prueba en el repo, los reales nunca |
| Balance | Simulador en Node (`npm run simular`) con un bot que compra lo que más rinde | Imprime minutos por hito y la tabla con y sin anuncios |
| Pruebas | 176 unitarias (Vitest) y 13 flujos de punta a punta (Playwright) | Revisan desbordes en 3 tamaños de pantalla |

## 8. Si se retoma

1. Instalar y correr: `cd gato-idle && npm install && npm run dev`. Antes de cada versión: `npm test`, `npm run check` y `npm run e2e`.
2. Empezar por **recortar**: dejar tocar, Fuerza, Valor, aliados, cuartos con guardián y jefe por casa; apagar (no borrar) canal, investigación, maquinita y marca.
3. Decidir la cantidad de niveles (sección 6) y probar la avalancha o el nivel contrarreloj.
4. Para publicar en Google Play: [`PUBLICAR.md`](PUBLICAR.md). Pendientes: nombre definitivo, `appId` definitivo, cuentas de Play y AdMob, y un repo privado (`HTML_TEST` es público).
