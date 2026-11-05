# Cuestionarios de Google Play

## Clasificación de contenido (IARC)

- Violencia: caricaturesca leve (un gato tira objetos; "peleas" con jefes caricaturescos, sin sangre). → Violencia de fantasía leve.
- Miedo, sexo, lenguaje, drogas, discriminación: no.
- **Apuestas simuladas: sí.** La maquinita del gato es una tragamonedas que se juega solo con fichas del juego; no se compra nada ni se gana nada con valor real.
- Compras dentro de la app: no.
- Interacción entre usuarios: solo el ranking (nombre del gato y nivel) en la versión web; la app de Android no lo tiene en línea.
- Ubicación: no se comparte.

Resultado esperado: PEGI 12 / ESRB Teen o equivalente (por las apuestas simuladas).

## Seguridad de los datos (Data safety)

La app no tiene cuentas ni servidor propio. El progreso se guarda solo en el teléfono.

El SDK de anuncios (Google AdMob) recopila y comparte:

| Dato | Recopilado | Compartido | Para qué | Opcional |
|---|---|---|---|---|
| ID de publicidad del dispositivo | Sí | Sí (Google) | Publicidad, analítica, prevención de fraude | El usuario puede restablecerlo o desactivar anuncios personalizados en Android |
| Interacciones con anuncios, diagnósticos | Sí | Sí (Google) | Publicidad, analítica | No |
| Ubicación aproximada (por IP) | Sí | Sí (Google) | Publicidad | No |

- Los datos se cifran en tránsito (AdMob usa HTTPS).
- No hay forma de pedir el borrado en un servidor propio porque no existe; el jugador borra su partida en Ajustes → Borrar partida.
- Consentimiento: la app muestra el formulario de consentimiento de Google (UMP) donde la ley lo pide (Europa, Reino Unido…).

## Anuncios

- "¿La app contiene anuncios?": **sí** (AdMob, solo recompensados, siempre opcionales).
