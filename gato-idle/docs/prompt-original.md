# Prompt para Claude Code — Idle del gato destructor

## Contexto

Soy desarrollador indie y quiero crear un juego **idle / incremental para Android (Google Play)**. Ya hice un juego antes contigo (Castype, con APK y versión web). Este es mi segundo juego. Quiero que sea **original, divertido y con humor**, monetizado principalmente con **anuncios recompensados** y una compra opcional para quitar anuncios.

Antes de escribir código:
1. Lee todo este documento.
2. Propónme el stack técnico (motor/framework, librería de anuncios, sistema de guardado) y una estructura de proyecto. Si no lo sabes, pregúntame qué usé en Castype para reutilizarlo.
3. Dame un plan de implementación por fases para el MVP y espera mi confirmación.

---

## Concepto

**Un gato que destruye las cosas de su dueño, cada vez más grandes, hasta destruir el mundo.**

- **El chiste central (justifica la economía):** el dueño es **influencer**. Graba los destrozos de su gato, los sube y se hacen virales. Más destrucción = más vistas = más dinero = el dueño compra cosas más caras = el gato las rompe. *La destrucción financia la destrucción.*
- **Remate cómico:** el gato *sabe* lo que hace; en el fondo él es el director creativo del canal y el dueño solo es el camarógrafo.
- **Escalada del dueño:** streamer en cuarto rentado → influencer famoso → celebridad → magnate → compra islas → compra la Luna (y el gato la tira de la mesa).
- **Tono:** caricaturesco, absurdo, sin violencia real. Nadie sale lastimado; solo se rompen cosas.
- **Nombre tentativo:** *Knock It Off!* (doble sentido en inglés: "ya párale" / "tíralo de la mesa"). Pendiente verificar que no exista en Play Store.

---

## Ciclo principal (core loop)

1. El jugador **toca la pantalla** y el gato da un **manotazo** al objeto actual.
2. Cada objeto tiene **resistencia** (HP). Con cada manotazo el objeto **se desliza un poco hacia la orilla** (feedback visual del progreso). Ejemplo: un vaso necesita ~5–10 manotazos.
3. Al llegar a la orilla, **cae y se rompe** (animación satisfactoria + partículas + sonido).
4. Cada objeto roto genera **vistas** en el canal → las vistas se convierten en **dinero** (moneda principal).
5. Con dinero se compran mejoras y el dueño "compra" objetos más caros.

### Mejoras principales
- **Fuerza del gato:** más daño por manotazo → menos toques por objeto y acceso a objetos más pesados.
- **Valor de los objetos:** objetos más caros → más vistas por destrozo.

### Regla de diseño clave
**El gesto nunca cambia: siempre es un manotazo con la pata.** Lo que cambia es lo que golpea. El humor viene del contraste (una patita de gato moviendo una bola de demolición de diez toneladas).

---

## Progresión de objetos (escalada)

Vaso → florero → tenis (arañados) → sofá / cortinas → TV → computadora → electrodomésticos (refri, lavadora) → piano → coche → la casa → mansión → edificios → la ciudad → el planeta → la Luna.

### Herramientas del gato (se desbloquean por etapas)
1. **Pata:** vasos, floreros, tenis.
2. **Garras afiladas:** sofá, cortinas, colchón.
3. **Montado en una aspiradora robot:** electrodomésticos y computadoras.
4. **Carrito a control remoto:** muebles y TV.
5. **Grúa con bola de demolición:** el manotazo va a la **palanca**; tumba muros y la casa.
6. **Excavadora / demoledoras:** mansiones y edificios.
7. **Mecha-gato gigante:** ciudades.
8. **Cohete:** la Luna (gran final).

### Escenarios
Departamento → casa → mansión → rascacielos → ciudad → planeta → espacio.

---

## Personal contratado (generadores idle)

Se desbloquean conforme avanzas; cada uno añade una mecánica:

| Personal | Efecto |
|---|---|
| Camarógrafo | Graba solo: genera vistas automáticamente sin tocar |
| Editor | Convierte destrozos en "compilaciones" que valen más |
| Agente de seguros | Recupera un % del valor de lo roto como dinero extra (chiste recurrente: cada vez más desesperado; en el endgame la aseguradora quiebra) |
| Paseador de perros | Trae perros que destruyen por su cuenta |
| Abogado | Protege de demandas de vecinos y del evento del dueño enojado |
| Community manager | Genera vistas mientras el juego está cerrado (ganancias offline) |

### Otras mascotas destructoras (cada una con su estilo)
- **Perro:** muerde zapatos, destroza el sofá, entierra cosas.
- **Perico:** arranca cortinas, imita la alarma.
- **Mapache:** saquea la cocina y el refri.
- **Cabra:** se come literalmente todo.
- Endgame: gato del tamaño de un edificio, perro kaiju.

---

## Gatos legendarios (se desbloquean con reinicios)

| Gato | Efecto |
|---|---|
| Gato de Schrödinger | Vivo y muerto a la vez: cada video se publica en dos universos → ×2 vistas |
| Gato de Cheshire | Se vuelve invisible: el dueño nunca te cacha |
| Gato negro | Mala suerte: probabilidad de que los objetos se rompan solos |
| Gato con botas | Probabilidad de "patada crítica" que tumba el objeto de un golpe |
| Bastet (diosa gata egipcia) | Multiplica las ganancias de reinicio |
| Félicette (primera gata real en el espacio, 1963) | Desbloquea la fase espacial |

> Usar solo versiones originales/genéricas o de dominio público. Nada de diseños de personajes con derechos (p. ej., no basarse en versiones de películas).

---

## Reinicios (prestigio en capas)

1. **La mudanza** (reinicio básico): los dueños se mudan a una casa más cara. Se pierden objetos y personal; se gana un **bonus permanente**.
2. **Las 7 vidas** (reinicio grande): se ganan **"vidas"** como moneda de prestigio, que desbloquean gatos legendarios.
3. **El Big Bang** (reinicio final): al destruir el mundo empieza un universo nuevo con reglas distintas.

---

## Eventos

- **"¡Llegó el dueño!":** cada cierto tiempo aparece el dueño. Si te cacha, pierdes un poco de dinero/vistas, salvo que veas un anuncio para **"echarle la culpa al perro"**.

---

## Monetización

**Anuncios recompensados (opcionales, nunca forzados):**
- **Zoomies:** ×3 velocidad por 2 minutos.
- **Los dueños se fueron de vacaciones:** ganancias offline ×2.
- **Caja de cartón:** caja misteriosa con premio aleatorio (disponible cada X minutos).
- **Echarle la culpa al perro:** evita la penalización del evento del dueño.

**Compras:**
- Quitar anuncios (los recompensados se reclaman sin video).
- Pack de inicio barato.

Evitar intersticiales agresivos.

---

## Alcance del MVP (primera versión)

No meter todo. El MVP incluye:
- Ciclo base: toque → manotazo → objeto se desliza → cae → se rompe → vistas/dinero.
- Mejoras de fuerza y de valor de objetos.
- Primeras 3–4 herramientas y sus objetos (pata → garras → aspiradora robot → carrito a control remoto).
- 3–4 empleados: camarógrafo, editor, agente de seguros, community manager.
- Ganancias offline.
- Primer reinicio: **la mudanza**.
- 2 gatos legendarios: **Schrödinger** y **Cheshire**.
- Evento "¡Llegó el dueño!".
- Anuncios recompensados (integrar con IDs de prueba primero).
- Guardado local persistente.

Todo lo demás (resto de herramientas, mascotas, 7 vidas, Big Bang) va en actualizaciones posteriores.

---

## Requisitos técnicos

- Orientación vertical, pensado para una mano.
- **Balance basado en datos:** objetos, costos, multiplicadores y empleados definidos en archivos de configuración (JSON o equivalente), no hardcodeados, para poder balancear sin tocar lógica.
- Soporte para **números muy grandes** (notación tipo 1.5K, 2.3M, 4.1B, aa, ab…).
- Cálculo correcto de ganancias offline con tope de horas.
- Guardado automático frecuente y al salir de la app.
- Arquitectura que permita agregar objetos, herramientas, empleados y gatos legendarios sin reescribir sistemas.
- Feedback ("juice"): vibración ligera, partículas, sonido de rotura, números flotantes de vistas.
- Estilo visual pixel art caricaturesco (puedo generar los assets con PixelApp; mientras tanto usa placeholders simples).

---

## Lo que espero de ti

1. Propuesta de stack y estructura de carpetas.
2. Plan por fases del MVP.
3. Esperar mi confirmación y luego implementar fase por fase, explicando brevemente cada entrega y cómo probarla.
