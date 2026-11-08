# Hub de Herramientas, Scripts y Tableros · Space 1.0 (PTM Banxico)

**BBVA | Directorio Central de Scripts, Tableros y Automatizaciones · Space 1.0**

Portal web de una sola página (SPA) para Google Apps Script que funciona como **directorio ejecutivo
e índice interactivo** de todos los tableros, visores técnicos, automatizaciones en Apps Script,
hojas maestras y modelos analíticos del equipo, más una **Biblioteca de Conocimiento** (guías APX,
COBOL / JCL, DB2, Apps Script, normativa, cursos…) que el equipo va alimentando.

| Archivo | Qué es |
|---|---|
| `Codigo.gs` | Backend de Apps Script: `doGet()`, lectura y escritura en Google Sheets, roles, permisos, bitácora y datos semilla. |
| `Index.html` | Toda la interfaz (HTML5 + CSS3 + JavaScript en un solo archivo). También se puede abrir **directamente como archivo local** (modo demo con `localStorage`). |
| `appsscript.json` | Manifiesto opcional (zona horaria `America/Mexico_City`, runtime V8). |

---

## 1. Funcionalidades

- **Buscador instantáneo** (`Ctrl + K` o `/`): busca por nombre, descripción, `#etiqueta`,
  tecnología, iniciativa, categoría o autor. No distingue acentos ni mayúsculas, admite varios
  términos y resalta las coincidencias.
- **Dos secciones**: *Herramientas del Equipo* (tableros, scripts GAS, modelos ML, visores de
  arquitectura, hojas maestras, documentación) y *Biblioteca de Conocimiento* (guías APX,
  COBOL / JCL / Mainframe, Apps Script, DB2 / SQL, desarrollo web, Python, normativa Banxico / SPEI,
  cursos). Los administradores pueden crear más categorías desde la interfaz.
- **Filtros** por categoría (pills), estado (`Producción (Activo)`, `En Desarrollo (MVP)`,
  `Histórico / Consulta`), etiqueta, "Solo mis enlaces" y "Solo favoritos"; varios órdenes.
- **Fijados / Acceso Rápido (Warroom Quincena)**: carrusel con lo fijado por el equipo y tus
  favoritos (★, guardados en tu navegador).
- **Tarjetas y tabla**: cada enlace muestra categoría, estado (punto verde parpadeante si es un
  monitor en tiempo real), descripción, tecnologías, etiquetas clicables, **quién lo subió y
  cuándo**, visitas, y botones *Abrir Herramienta ↗*, *Copiar Enlace*, *Código / Script*,
  *Editar* y *Eliminar*.
- **Ficha de detalle** con todos los datos, historial de alta / modificación y enlace directo a la
  ficha (`?id=`).
- **Alta y edición sin tocar código** (modal con validación y aviso de enlaces duplicados).
- **Exportar** el catálogo a **Markdown** (`Directorio_Space_1_0.md`, tablas por categoría),
  **CSV** y **JSON**; **Imprimir / PDF** con un reporte limpio.
- **Panel de administración**: resumen con estadísticas, usuarios y roles, categorías, papelera
  (restaurar / eliminar definitivamente), bitácora de actividad e importación / respaldo JSON.
- **Tema claro / oscuro**, diseño adaptable a móvil y atajos de teclado (`?` para verlos).

## 2. Perfiles y permisos

| Acción | Invitado | Usuario | Administrador |
|---|:---:|:---:|:---:|
| Buscar, filtrar, abrir y exportar | ✅ | ✅ | ✅ |
| Agregar enlaces | — | ✅ | ✅ |
| Editar (descripción y demás datos) **sus propios** enlaces | — | ✅ | ✅ |
| Eliminar **sus propios** enlaces | — | ✅ | ✅ |
| Editar / eliminar enlaces **de cualquier usuario** | — | — | ✅ |
| Papelera, roles, categorías, bitácora, importación | — | — | ✅ |

- Los permisos se validan **en el servidor** (`Codigo.gs`); la interfaz solo oculta los botones.
- El **propietario** del script (quien lo implementa) siempre es administrador y no se puede
  degradar. Puedes agregar más administradores desde *Panel de administración → Usuarios y roles*
  o en `CONFIG.ADMINS_INICIALES`.
- Al eliminar, el enlace pasa a la **papelera** (borrado lógico); un administrador puede
  restaurarlo o eliminarlo definitivamente.
- **Invitado** = Google no reveló el correo del visitante (ver *Solución de problemas*). Solo puede
  consultar.

## 3. Instalación (10 minutos)

1. Crea una hoja de cálculo de Google nueva (por ejemplo *"Directorio Space 1.0 — BD"*).
2. En la hoja: **Extensiones → Apps Script**.
3. En el editor:
   - Reemplaza el contenido de `Código.gs` con el de **`Codigo.gs`**.
   - **Archivo → + → HTML**, nómbralo exactamente **`Index`** y pega el contenido de **`Index.html`**.
   - *(Opcional)* Configuración del proyecto → "Mostrar el archivo de manifiesto appsscript.json" y
     pega `appsscript.json`.
4. Ajusta el bloque `CONFIG` al inicio de `Codigo.gs` si lo necesitas:
   ```js
   ADMINS_INICIALES: ['correo.admin@tu-dominio.com'],
   DOMINIOS_PERMITIDOS: ['tu-dominio.com'],   // vacío = cualquier usuario identificado
   ```
5. Selecciona la función **`instalarDirectorio`** y pulsa **Ejecutar**. Autoriza los permisos
   (hojas de cálculo y correo del usuario). Se crean las pestañas `DIRECTORIO_LINKS`,
   `CATEGORIAS`, `USUARIOS` y `BITACORA` con los datos semilla.
6. **Implementar → Nueva implementación → Aplicación web**:
   - *Ejecutar como*: **Yo** (así los usuarios no necesitan permisos sobre la hoja y no pueden
     saltarse las reglas editándola directamente).
   - *Quién tiene acceso*: **Cualquier usuario de tu organización** (dominio de Google Workspace).
7. Comparte la URL `/exec` con el equipo. Cada vez que cambies el código: **Implementar →
   Administrar implementaciones → Editar → Nueva versión**.

> Si el script no está vinculado a una hoja (proyecto independiente), deja `SPREADSHEET_ID` vacío:
> el script creará automáticamente la hoja *"Directorio Space 1.0 — Base de Datos"* y guardará su
> ID en las propiedades del script. También puedes poner el ID de una hoja existente.

## 4. Modo local (sin servidor)

Abre `Index.html` con doble clic. Funciona igual que la versión publicada, pero los datos se guardan
**solo en tu navegador** (`localStorage`). Incluye un selector de identidad de demostración
(Admin Local, Usuario A, Usuario B, Invitado) para probar los permisos. Útil para revisar el diseño
o hacer una demo antes de publicar.

## 5. Estructura de datos (Google Sheets)

**`DIRECTORIO_LINKS`** — un enlace por fila:

`ID · Nombre · CategoriaID · URL · URL_Script · Descripcion · Tags · Tecnologias · Iniciativa ·
Estado · Fijado · TiempoReal · Frecuencia · CreadoPor · CreadoPorNombre · FechaCreacion ·
ModificadoPor · ModificadoPorNombre · FechaModificacion · Visitas · Eliminado · EliminadoPor ·
FechaEliminacion`

- `Estado`: `produccion`, `desarrollo` o `historico`.
- `Tags` y `Tecnologias`: separados por coma.
- Las columnas se localizan **por nombre de encabezado**: puedes reordenarlas; si falta alguna, el
  script la vuelve a crear.

**`CATEGORIAS`** — `ID · Nombre · Seccion · Icono · Color · Orden · Descripcion · Activa`

**`USUARIOS`** — `Email · Nombre · Rol (ADMIN / USUARIO) · FechaAlta · UltimoAcceso · Accesos`

**`BITACORA`** — `Fecha · Usuario · Accion · ItemID · ItemNombre · Detalle` (últimos 5,000 eventos).

Funciones expuestas a la interfaz (`google.script.run`): `obtenerCatalogoHerramientas()`,
`guardarHerramienta(item)`, `eliminarHerramienta(id)`, `fijarHerramienta(id, fijado)`,
`registrarVisita(id)`, `obtenerPanelAdmin()`, `restaurarHerramienta(id)`,
`purgarHerramienta(id)`, `guardarRolUsuario(email, rol)`, `guardarCategoria(cat)`,
`eliminarCategoria(id)`, `actualizarMiPerfil(nombre)`, `importarHerramientas(items)`,
`cargarSemillaFaltante()`.

## 6. Datos semilla

Se precargan los 7 proyectos del equipo (SPEI Control Tower, SPEI por Dentro, Visor Técnico MP2C,
Arquitectura CVV Dinámico, Generador de Reportes de Auditoría Mainframe, Motor de Pronóstico ML
SPEI y Base Maestra de Telemetría SPEI) **con la URL vacía**: aparecen como *"URL pendiente"* hasta
que un administrador las edite y pegue la URL real. También se incluyen algunas referencias
públicas para la Biblioteca (documentación de Apps Script, IBM COBOL / z/OS / Db2, MDN, Python y
Banxico). Las categorías *Guías APX* y *Cursos & Capacitación* empiezan vacías para que el equipo
agregue sus fuentes.

## 7. Seguridad

- Validación y permisos en el servidor; bloqueo (`LockService`) en todas las escrituras.
- Solo se aceptan URLs `http://` o `https://`.
- Todo el texto del usuario se escapa antes de mostrarse (sin inyección de HTML).
- Protección contra inyección de fórmulas en Sheets y en la exportación CSV.
- Todas las altas, ediciones, eliminaciones y cambios de rol quedan en la `BITACORA`.

## 8. Solución de problemas

| Síntoma | Causa / solución |
|---|---|
| Todos aparecen como **Invitado** | Google solo revela el correo del visitante si pertenece al mismo dominio de Workspace que el propietario (con *Ejecutar como: Yo*). Implementa con acceso *"Cualquier usuario de tu organización"* y abre la app con la cuenta corporativa. Con cuentas personales de Gmail los demás usuarios verán el directorio en modo consulta. |
| "No se pudo obtener el bloqueo" | Muchas escrituras simultáneas; vuelve a intentar en unos segundos. |
| No veo mis cambios de código | Publica una **nueva versión** de la implementación (la URL `/exec` sirve la última versión implementada). |
| Quiero incrustarlo en Google Sites | En `doGet()` agrega `.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)`. |
| Los favoritos no se guardan | Tu navegador bloquea el almacenamiento de sitios de terceros; el resto funciona igual. |
