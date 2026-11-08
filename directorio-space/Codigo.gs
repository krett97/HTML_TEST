/**
 * =============================================================================
 *  BBVA | Directorio Central de Scripts, Tableros y Automatizaciones · Space 1.0
 *  Hub de Herramientas, Scripts y Tableros · Space 1.0 (PTM Banxico)
 * -----------------------------------------------------------------------------
 *  Servidor Google Apps Script (runtime V8) — Codigo.gs
 *
 *  INSTALACIÓN
 *   1. Crea el proyecto (idealmente desde la Hoja de cálculo: Extensiones > Apps
 *      Script) y copia Codigo.gs, Index.html y appsscript.json.
 *   2. Ejecuta instalarDirectorio() una vez desde el editor y autoriza permisos.
 *   3. Implementar > Nueva implementación > Aplicación web:
 *        · Ejecutar como: Yo (propietario)
 *        · Quién tiene acceso: Cualquier usuario de <tu dominio>
 *
 *  CONVENCIONES
 *   · Las funciones públicas (google.script.run) SIEMPRE devuelven un objeto
 *     { ok:true, ... } o { ok:false, error:'mensaje' }; nunca lanzan al cliente.
 *   · Las funciones que terminan en "_" son privadas (GAS no las expone).
 *   · Toda escritura ocurre bajo LockService y deja rastro en BITACORA.
 *   · Ninguna respuesta contiene objetos Date (google.script.run devolvería null).
 *   · Las columnas se ubican por NOMBRE de encabezado (no por posición): se
 *     pueden reordenar y, si falta alguna, se vuelve a crear al final.
 *   · Sin DriveApp: alcances mínimos (spreadsheets + userinfo.email).
 * =============================================================================
 */

// =============================================================================
// 1. CONFIGURACIÓN
// =============================================================================

const CONFIG = {
  TITULO: 'BBVA | Directorio Central de Scripts, Tableros y Automatizaciones · Space 1.0',
  NOMBRE_APP: 'Hub de Herramientas, Scripts y Tableros · Space 1.0 (PTM Banxico)',
  VERSION: '1.0.0',
  SPREADSHEET_ID: '',          // vacío = hoja contenedora / creación automática
  ADMINS_INICIALES: [],        // correos admin además del propietario
  DOMINIOS_PERMITIDOS: [],     // p.ej. ['bbva.com']; vacío = cualquier usuario identificado
  MAX_BITACORA: 5000,
  HOJAS: { LINKS: 'DIRECTORIO_LINKS', CATEGORIAS: 'CATEGORIAS', USUARIOS: 'USUARIOS', BITACORA: 'BITACORA' }
};

// =============================================================================
// 2. CONSTANTES DE DOMINIO
// =============================================================================

const PROP_ID_LIBRO = 'DIRECTORIO_SS_ID';
const NOMBRE_LIBRO_NUEVO = 'Directorio Space 1.0 — Base de Datos';
const NOMBRE_EQUIPO_SEMILLA = 'Equipo Space 1.0';
const ESPERA_BLOQUEO_MS = 15000;          // escrituras normales
const ESPERA_VISITA_MS = 3000;            // contador de visitas (no crítico)
const ESPERA_SECUNDARIA_MS = 200;         // registro de accesos / reparaciones no críticas: si está ocupado, se omite
const VENTANA_ACCESO_MS = 30 * 60 * 1000; // 30 min entre actualizaciones de acceso
const VENTANA_VISITA_S = 30 * 60;         // una visita contabilizada por persona y enlace cada 30 min (CacheService)
const CRECIMIENTO_BITACORA = 500;         // filas que se agregan de una vez a BITACORA cuando se llena
const MAX_BITACORA_PANEL = 300;
const MAX_IMPORTACION = 2000;
const FORMATO_FECHA_HOJA = 'yyyy-mm-dd hh:mm';
const COLOR_ENCABEZADO = '#072146';
const COLOR_POR_DEFECTO = '#004481';
const MSG_OCUPADO = 'El directorio está procesando otra operación. Intenta de nuevo en unos segundos.';
const MSG_NO_ENCONTRADO = 'No se encontró el enlace solicitado. Es posible que haya sido eliminado.';

const SECCIONES = [
  { id: 'equipo', nombre: 'Herramientas del Equipo', descripcion: 'Tableros, scripts, visores, hojas y modelos creados por Space 1.0', icono: 'grid' },
  { id: 'biblioteca', nombre: 'Biblioteca de Conocimiento', descripcion: 'Guías, manuales y referencias: APX, COBOL, JCL, DB2, Apps Script y más', icono: 'book' }
];

const ICONOS_PERMITIDOS = [
  'activity', 'code', 'brain', 'layers', 'table', 'file-text', 'box', 'terminal', 'book', 'database', 'globe', 'chart',
  'shield', 'graduation', 'tool', 'link', 'folder', 'server', 'sparkles', 'star', 'cpu', 'cloud', 'lock', 'users'
];

const ESTADOS_VALIDOS = ['produccion', 'desarrollo', 'historico'];
const ROLES_HOJA = ['ADMIN', 'USUARIO'];

const LIMITES = {
  NOMBRE_MIN: 3, NOMBRE_MAX: 120,
  DESC_MIN: 10, DESC_MAX: 1000,
  TAGS_MAX: 12, TAG_LEN: 40,
  TEC_MAX: 8, TEC_LEN: 40,
  INICIATIVA_MAX: 80, FRECUENCIA_MAX: 60,
  URL_MAX: 2000,
  CAT_NOMBRE_MIN: 2, CAT_NOMBRE_MAX: 60, CAT_DESC_MAX: 200,
  PERFIL_MIN: 2, PERFIL_MAX: 60,
  DETALLE_MAX: 500
};

/** Campos que el cliente puede modificar (el resto los fija el servidor). */
const CAMPOS_EDITABLES = [
  'nombre', 'categoriaId', 'url', 'urlScript', 'descripcion', 'tags', 'tecnologias',
  'iniciativa', 'estado', 'fijado', 'tiempoReal', 'frecuencia'
];

/** Formato de número por tipo lógico de columna. */
const FORMATOS_TIPO = {
  texto: '@', email: '@', lista: '@',
  bool: 'General', boolV: 'General',
  fecha: FORMATO_FECHA_HOJA,
  numero: '0', orden: 'General'
};

const COLORES_PESTANA = { LINKS: '#004481', CATEGORIAS: '#2DCCCD', USUARIOS: '#0284C7', BITACORA: '#64748B' };

/**
 * Esquema de cada hoja: h = encabezado exacto, c = campo JS, t = tipo lógico.
 * Tipos: texto | email | lista (", ") | bool | boolV (vacío = verdadero) | fecha | numero | orden.
 */
const ESQUEMAS = {
  LINKS: [
    { h: 'ID', c: 'id', t: 'texto', ancho: 170 },
    { h: 'Nombre', c: 'nombre', t: 'texto', ancho: 300 },
    { h: 'CategoriaID', c: 'categoriaId', t: 'texto', ancho: 130 },
    { h: 'URL', c: 'url', t: 'texto', ancho: 300 },
    { h: 'URL_Script', c: 'urlScript', t: 'texto', ancho: 220 },
    { h: 'Descripcion', c: 'descripcion', t: 'texto', ancho: 420 },
    { h: 'Tags', c: 'tags', t: 'lista', ancho: 240 },
    { h: 'Tecnologias', c: 'tecnologias', t: 'lista', ancho: 190 },
    { h: 'Iniciativa', c: 'iniciativa', t: 'texto', ancho: 120 },
    { h: 'Estado', c: 'estado', t: 'texto', ancho: 110, opciones: ESTADOS_VALIDOS },
    { h: 'Fijado', c: 'fijado', t: 'bool', ancho: 70 },
    { h: 'TiempoReal', c: 'tiempoReal', t: 'bool', ancho: 90 },
    { h: 'Frecuencia', c: 'frecuencia', t: 'texto', ancho: 170 },
    { h: 'CreadoPor', c: 'creadoPor', t: 'email', ancho: 210 },
    { h: 'CreadoPorNombre', c: 'creadoPorNombre', t: 'texto', ancho: 170 },
    { h: 'FechaCreacion', c: 'fechaCreacion', t: 'fecha', ancho: 140 },
    { h: 'ModificadoPor', c: 'modificadoPor', t: 'email', ancho: 210 },
    { h: 'ModificadoPorNombre', c: 'modificadoPorNombre', t: 'texto', ancho: 170 },
    { h: 'FechaModificacion', c: 'fechaModificacion', t: 'fecha', ancho: 140 },
    { h: 'Visitas', c: 'visitas', t: 'numero', ancho: 80 },
    { h: 'Eliminado', c: 'eliminado', t: 'bool', ancho: 90 },
    { h: 'EliminadoPor', c: 'eliminadoPor', t: 'email', ancho: 210 },
    { h: 'FechaEliminacion', c: 'fechaEliminacion', t: 'fecha', ancho: 140 }
  ],
  CATEGORIAS: [
    { h: 'ID', c: 'id', t: 'texto', ancho: 140 },
    { h: 'Nombre', c: 'nombre', t: 'texto', ancho: 280 },
    { h: 'Seccion', c: 'seccion', t: 'texto', ancho: 110, opciones: ['equipo', 'biblioteca'] },
    { h: 'Icono', c: 'icono', t: 'texto', ancho: 100 },
    { h: 'Color', c: 'color', t: 'texto', ancho: 90 },
    { h: 'Orden', c: 'orden', t: 'orden', ancho: 70 },
    { h: 'Descripcion', c: 'descripcion', t: 'texto', ancho: 380 },
    { h: 'Activa', c: 'activa', t: 'boolV', ancho: 70 }
  ],
  USUARIOS: [
    { h: 'Email', c: 'email', t: 'email', ancho: 240 },
    { h: 'Nombre', c: 'nombre', t: 'texto', ancho: 200 },
    { h: 'Rol', c: 'rol', t: 'texto', ancho: 90, opciones: ROLES_HOJA },
    { h: 'FechaAlta', c: 'fechaAlta', t: 'fecha', ancho: 140 },
    { h: 'UltimoAcceso', c: 'ultimoAcceso', t: 'fecha', ancho: 140 },
    { h: 'Accesos', c: 'accesos', t: 'numero', ancho: 80 }
  ],
  BITACORA: [
    { h: 'Fecha', c: 'fecha', t: 'fecha', ancho: 140 },
    { h: 'Usuario', c: 'usuario', t: 'email', ancho: 220 },
    { h: 'Accion', c: 'accion', t: 'texto', ancho: 150 },
    { h: 'ItemID', c: 'itemId', t: 'texto', ancho: 170 },
    { h: 'ItemNombre', c: 'itemNombre', t: 'texto', ancho: 280 },
    { h: 'Detalle', c: 'detalle', t: 'texto', ancho: 420 }
  ]
};

/** Categorías semilla (tabla 1.2 del contrato). */
const CATEGORIAS_SEMILLA = [
  { id: 'tableros', nombre: 'Tableros en Vivo (Dashboards)', seccion: 'equipo', icono: 'activity', color: '#0284C7', orden: 10, descripcion: 'Monitores y tableros en vivo de operación, telemetría y KPIs del equipo.' },
  { id: 'gas', nombre: 'Scripts de Google (GAS)', seccion: 'equipo', icono: 'code', color: '#0F9D8F', orden: 20, descripcion: 'Automatizaciones y scripts de Google Apps Script creados por el equipo.' },
  { id: 'ml', nombre: 'Modelos ML & Pronósticos', seccion: 'equipo', icono: 'brain', color: '#7C3AED', orden: 30, descripcion: 'Modelos de machine learning, pronósticos y clasificadores de operación.' },
  { id: 'arquitectura', nombre: 'Visores de Arquitectura / Mainframe', seccion: 'equipo', icono: 'layers', color: '#004481', orden: 40, descripcion: 'Visores técnicos de arquitectura, flujos transaccionales y componentes mainframe.' },
  { id: 'hojas', nombre: 'Hojas Maestras (Sheets / Drive)', seccion: 'equipo', icono: 'table', color: '#16A34A', orden: 50, descripcion: 'Libros maestros de Google Sheets, bases de telemetría y carpetas de Drive.' },
  { id: 'docs', nombre: 'Documentación & Warroom', seccion: 'equipo', icono: 'file-text', color: '#D97706', orden: 60, descripcion: 'Documentación operativa, minutas, procedimientos y material del Warroom.' },
  { id: 'guias-apx', nombre: 'Guías APX', seccion: 'biblioteca', icono: 'box', color: '#E11D48', orden: 110, descripcion: 'Guías, manuales y referencias de la tecnología APX.' },
  { id: 'guias-cobol', nombre: 'Guías COBOL / JCL / Mainframe', seccion: 'biblioteca', icono: 'terminal', color: '#475569', orden: 120, descripcion: 'Referencias de COBOL, JCL, utilerías y operación en mainframe z/OS.' },
  { id: 'guias-gas', nombre: 'Guías Apps Script & Google Workspace', seccion: 'biblioteca', icono: 'book', color: '#0EA5E9', orden: 130, descripcion: 'Documentación de Apps Script, HtmlService y servicios de Google Workspace.' },
  { id: 'bd-sql', nombre: 'Bases de Datos (DB2 / SQL)', seccion: 'biblioteca', icono: 'database', color: '#0D9488', orden: 140, descripcion: 'Referencias de DB2, SQL, códigos SQLCODE y buenas prácticas de consulta.' },
  { id: 'web', nombre: 'Desarrollo Web (HTML / CSS / JS)', seccion: 'biblioteca', icono: 'globe', color: '#2563EB', orden: 150, descripcion: 'Guías de HTML, CSS y JavaScript para tableros e interfaces web.' },
  { id: 'python-datos', nombre: 'Python, Datos & ML', seccion: 'biblioteca', icono: 'chart', color: '#9333EA', orden: 160, descripcion: 'Python, análisis de datos, visualización y machine learning.' },
  { id: 'normativa', nombre: 'Normativa & Procesos (Banxico / SPEI)', seccion: 'biblioteca', icono: 'shield', color: '#B45309', orden: 170, descripcion: 'Normativa, circulares, reglas y procesos de Banxico y del SPEI.' },
  { id: 'cursos', nombre: 'Cursos & Capacitación', seccion: 'biblioteca', icono: 'graduation', color: '#DB2777', orden: 180, descripcion: 'Cursos, capacitaciones y rutas de aprendizaje recomendadas.' }
];

/** Enlaces semilla (sección 7 del contrato). */
const ITEMS_SEMILLA = [
  {
    id: 'seed-001', nombre: 'SPEI Control Tower · Telemetría & Predicción ML 24h', categoriaId: 'tableros', url: '',
    fijado: true, tiempoReal: true, frecuencia: 'Tiempo real (cada 10 min)', iniciativa: 'SPEI', tecnologias: ['Apps Script', 'HTML', 'Sheets'],
    descripcion: 'Monitor en tiempo real de operación SPEI (Envío 205 / Recepción 006) en bloques de 10 min, predicción ML del cierre 18:00, vista Día Natural (00:00-23:59 · corte 00h-09h para Dirección General), alertas rojas de Mensaje en X y comparador histórico de quincenas.',
    tags: ['#SPEI', '#ControlTower', '#MachineLearning', '#DíaNatural', '#MensajeEnX', '#Quincenas']
  },
  {
    id: 'seed-002', nombre: 'SPEI por Dentro · Arquitectura & Flujo Operativo', categoriaId: 'arquitectura', url: '',
    fijado: true, tiempoReal: false, frecuencia: 'Consulta (estático)', iniciativa: 'SPEI', tecnologias: ['HTML', 'Mainframe/JCL'],
    descripcion: 'Visor interactivo del flujo interno transaccional de SPEI, colas, store & forward, contenciones de tablas (MSG) y cambio de día a las 18:00 hrs.',
    tags: ['#SPEI', '#Arquitectura', '#Space1.0', '#TablasFlipFlop', '#Batch18h']
  },
  {
    id: 'seed-003', nombre: 'Visor Técnico MP2C', categoriaId: 'arquitectura', url: '',
    fijado: true, frecuencia: 'Consulta (estático)', iniciativa: 'MP2C', tecnologias: ['HTML', 'Mainframe/JCL'],
    descripcion: 'Herramienta de inspección y trazabilidad técnica de componentes, flujos y dependencias MP2C.',
    tags: ['#MP2C', '#Mainframe', '#Trazabilidad', '#VisorTécnico']
  },
  {
    id: 'seed-004', nombre: 'Arquitectura CVV Dinámico', categoriaId: 'arquitectura', url: '',
    fijado: false, frecuencia: 'Consulta (estático)', iniciativa: 'CVV', tecnologias: ['HTML'],
    descripcion: 'Diagrama interactivo y documentación técnica de componentes de la arquitectura de CVV Dinámico.',
    tags: ['#CVVDinámico', '#Arquitectura', '#MediosDePago']
  },
  {
    id: 'seed-005', nombre: 'Generador de Reportes de Revisión Técnica y Auditoría Mainframe (PDF)', categoriaId: 'gas', url: '',
    fijado: false, frecuencia: 'Bajo demanda', iniciativa: 'Space 1.0', tecnologias: ['Apps Script', 'Mainframe/JCL'],
    descripcion: 'Automatización para generar dictámenes ejecutivos de revisión de código (JCL, PROC, Batch, CICS, DB2) estructurados en 9 secciones con exportación directa a PDF institucional.',
    tags: ['#AuditoríaCódigo', '#JCL', '#Batch', '#DB2', '#PDF']
  },
  {
    id: 'seed-006', nombre: 'Motor de Pronóstico ML SPEI & Clasificador de Días Homólogos (MonitorSpei.gs)', categoriaId: 'ml', url: '',
    fijado: true, frecuencia: 'Tiempo real (cada 10 min)', iniciativa: 'SPEI', tecnologias: ['Apps Script', 'Python/ML'],
    descripcion: 'Script backend en Google Apps Script para cálculo de pesos por bloque de 10m, detección de atípicos con suavizado vecino, recalibración en vivo post-09:00 AM y calendario anual de días homólogos y quincenas.',
    tags: ['#AppsScript', '#MachineLearning', '#DíasHomólogos', '#Pronóstico9AM']
  },
  {
    id: 'seed-007', nombre: 'Base Maestra de Telemetría SPEI (Hojas Diarias + Histórico Spei A)', categoriaId: 'hojas', url: '',
    fijado: true, frecuencia: 'Minuto a minuto', iniciativa: 'SPEI', tecnologias: ['Sheets', 'Apps Script'],
    descripcion: 'Libro central de Google Sheets con el registro minuto a minuto de las colas 201, 204, 205, 006, 228, bitácora de eventos, columna D de Mensaje en X / Switch y concentrado anual de quincenas.',
    tags: ['#GoogleSheets', '#BaseDeDatos', '#SpeiA', '#Bitácora']
  },
  {
    id: 'seed-101', nombre: 'Documentación oficial de Google Apps Script', categoriaId: 'guias-gas', url: 'https://developers.google.com/apps-script',
    iniciativa: 'Space 1.0', tecnologias: ['Apps Script'], frecuencia: 'Consulta (estático)',
    descripcion: 'Guías, tutoriales y conceptos oficiales de Apps Script: web apps con HtmlService, triggers, cuotas y buenas prácticas.',
    tags: ['#AppsScript', '#Referencia', '#Google']
  },
  {
    id: 'seed-102', nombre: 'Referencia de servicios Apps Script (SpreadsheetApp, HtmlService…)', categoriaId: 'guias-gas', url: 'https://developers.google.com/apps-script/reference',
    tecnologias: ['Apps Script', 'Sheets'], frecuencia: 'Consulta (estático)',
    descripcion: 'Referencia de clases y métodos de los servicios de Apps Script para Sheets, Drive, Gmail, HTML y utilidades.',
    tags: ['#AppsScript', '#API', '#Referencia']
  },
  {
    id: 'seed-103', nombre: 'IBM Enterprise COBOL for z/OS — Documentación', categoriaId: 'guias-cobol', url: 'https://www.ibm.com/docs/en/cobol-zos',
    tecnologias: ['COBOL', 'Mainframe/JCL'], frecuencia: 'Consulta (estático)',
    descripcion: 'Manuales oficiales de IBM Enterprise COBOL: guía de programación, referencia del lenguaje, opciones de compilación y migración.',
    tags: ['#COBOL', '#Mainframe', '#IBM', '#Referencia']
  },
  {
    id: 'seed-104', nombre: 'IBM z/OS — Documentación (JCL, JES2 y utilerías)', categoriaId: 'guias-cobol', url: 'https://www.ibm.com/docs/en/zos',
    tecnologias: ['Mainframe/JCL'], frecuencia: 'Consulta (estático)',
    descripcion: 'Documentación oficial de z/OS: referencia de JCL, JES2, utilerías (IEBGENER, SORT, IDCAMS) y mensajes del sistema.',
    tags: ['#JCL', '#zOS', '#Mainframe', '#Batch']
  },
  {
    id: 'seed-105', nombre: 'IBM Db2 for z/OS — Documentación', categoriaId: 'bd-sql', url: 'https://www.ibm.com/docs/en/db2-for-zos',
    tecnologias: ['DB2/SQL', 'Mainframe/JCL'], frecuencia: 'Consulta (estático)',
    descripcion: 'Referencia SQL, administración, rendimiento y códigos de error (SQLCODE) de Db2 para z/OS.',
    tags: ['#DB2', '#SQL', '#Mainframe', '#SQLCODE']
  },
  {
    id: 'seed-106', nombre: 'MDN Web Docs (HTML, CSS y JavaScript)', categoriaId: 'web', url: 'https://developer.mozilla.org/es/docs/Web',
    tecnologias: ['HTML', 'JavaScript'], frecuencia: 'Consulta (estático)',
    descripcion: 'Referencia y guías de MDN para HTML, CSS y JavaScript; base para los tableros e interfaces HtmlService.',
    tags: ['#HTML', '#CSS', '#JavaScript', '#Referencia']
  },
  {
    id: 'seed-107', nombre: 'Documentación oficial de Python (español)', categoriaId: 'python-datos', url: 'https://docs.python.org/es/3/',
    tecnologias: ['Python/ML'], frecuencia: 'Consulta (estático)',
    descripcion: 'Tutorial y referencia de la biblioteca estándar de Python para análisis de datos y modelos.',
    tags: ['#Python', '#Datos', '#Referencia']
  },
  {
    id: 'seed-108', nombre: 'Banco de México — Sistemas de Pagos (SPEI)', categoriaId: 'normativa', url: 'https://www.banxico.org.mx',
    iniciativa: 'PTM Banxico', tecnologias: [], frecuencia: 'Consulta (estático)',
    descripcion: 'Sitio oficial de Banxico; consulta la sección de Sistemas de Pagos para normativa, circulares y reglas del SPEI.',
    tags: ['#Banxico', '#SPEI', '#Normativa']
  }
];

// =============================================================================
// 3. PUNTO DE ENTRADA WEB
// =============================================================================

/** Sirve la SPA. */
function doGet(e) {
  // Para incrustar el directorio en Google Sites (u otro iframe) agrega:
  //   .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
  // Se deja el valor por defecto (más seguro contra clickjacking).
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle(CONFIG.TITULO)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// =============================================================================
// 4. API PÚBLICA (google.script.run)
// =============================================================================

/** Catálogo completo para la SPA (cualquier visitante, incluso invitado). */
function obtenerCatalogoHerramientas() {
  return ejecutar_('obtenerCatalogoHerramientas', function (ctx) {
    asegurarDatosIniciales_(ctx);
    const yo = usuarioActual_(ctx);
    const items = leerItems_(ctx, true)
      .filter(function (it) { return !it.eliminado; })
      .map(function (it) { return publicarItem_(ctx, it); });
    const categorias = leerCategorias_(ctx).map(publicarCategoria_);
    // Al final: su bloqueo vacía la caché del contexto y no debe obligar a releer el catálogo.
    registrarAcceso_(ctx);
    return {
      usuario: resumenUsuario_(yo),
      items: items,
      categorias: categorias,
      secciones: JSON.parse(JSON.stringify(SECCIONES)),
      config: {
        titulo: CONFIG.TITULO,
        nombreApp: CONFIG.NOMBRE_APP,
        version: CONFIG.VERSION,
        appUrl: urlApp_(),
        dominiosPermitidos: (CONFIG.DOMINIOS_PERMITIDOS || []).slice(),
        servidor: 'gas'
      },
      fechaServidor: aIso_(new Date())
    };
  });
}

/** Crea (sin id / id inexistente) o actualiza un enlace. */
function guardarHerramienta(item) {
  return ejecutar_('guardarHerramienta', function (ctx) {
    const yo = exigirEscritura_(ctx);
    if (!esObjeto_(item)) throw errorUsuario_('Los datos del enlace no son válidos.');
    return conBloqueo_(ctx, function () {
      const items = leerItems_(ctx, false);
      const id = textoLinea_(item.id);
      const existente = id ? buscarEnLista_(items, id) : null;
      if (existente) {
        if (existente.eliminado) throw errorUsuario_('Este enlace está en la papelera. Un administrador debe restaurarlo antes de editarlo.');
        if (!puedeEditar_(ctx, existente)) throw errorUsuario_('Solo puedes editar los enlaces que tú agregaste.');
      }
      const datos = validarItem_(ctx, item, existente);
      // En edición solo se valida duplicado si la URL cambió (evita re-confirmar duplicados ya aceptados).
      const urlCambio = !existente || normalizarUrl_(existente.url) !== normalizarUrl_(datos.url);
      if (urlCambio) verificarDuplicado_(items, datos.url, existente ? existente.id : '', item.confirmarDuplicado === true);

      const tabla = tabla_(ctx, 'LINKS');
      const ahora = aIso_(new Date());
      let reg;
      let accion;
      if (existente) {
        reg = Object.assign({}, existente, datos, {
          modificadoPor: yo.email, modificadoPorNombre: yo.nombre, fechaModificacion: ahora
        });
        escribirFilas_(tabla, existente._fila, [reg]);
        accion = 'actualizado';
        registrarBitacora_(ctx, 'EDITAR', reg.id, reg.nombre, { campos: camposCambiados_(existente, reg) });
      } else {
        reg = Object.assign(itemVacio_(), datos, {
          id: nuevoId_(), creadoPor: yo.email, creadoPorNombre: yo.nombre, fechaCreacion: ahora
        });
        agregarRegistros_(tabla, [reg]);
        accion = 'creado';
        registrarBitacora_(ctx, 'CREAR', reg.id, reg.nombre, { categoria: reg.categoriaId, url: reg.url });
      }
      ctx.cache.items = null;
      return { item: publicarItem_(ctx, reg), accion: accion };
    });
  });
}

/** Envía un enlace a la papelera (admin o autor). */
function eliminarHerramienta(id) {
  return ejecutar_('eliminarHerramienta', function (ctx) {
    const yo = exigirEscritura_(ctx);
    return conBloqueo_(ctx, function () {
      const it = exigirItem_(ctx, id);
      if (it.eliminado) throw errorUsuario_('El enlace ya se encuentra en la papelera.');
      if (!puedeEditar_(ctx, it)) throw errorUsuario_('Solo puedes eliminar los enlaces que tú agregaste.');
      const reg = Object.assign({}, it, { eliminado: true, eliminadoPor: yo.email, fechaEliminacion: aIso_(new Date()) });
      escribirFilas_(tabla_(ctx, 'LINKS'), it._fila, [reg], ['eliminado', 'eliminadoPor', 'fechaEliminacion']);
      registrarBitacora_(ctx, 'ELIMINAR', it.id, it.nombre, { categoria: it.categoriaId });
      ctx.cache.items = null;
      return { id: it.id };
    });
  });
}

/** Fija / desfija un enlace en el Warroom (admin o autor). */
function fijarHerramienta(id, fijado) {
  return ejecutar_('fijarHerramienta', function (ctx) {
    exigirEscritura_(ctx);
    return conBloqueo_(ctx, function () {
      const it = exigirItem_(ctx, id);
      if (it.eliminado) throw errorUsuario_('El enlace está en la papelera.');
      if (!puedeEditar_(ctx, it)) throw errorUsuario_('Solo puedes fijar los enlaces que tú agregaste.');
      const reg = Object.assign({}, it, { fijado: aBooleano_(fijado) });
      escribirFilas_(tabla_(ctx, 'LINKS'), it._fila, [reg], ['fijado']);
      registrarBitacora_(ctx, 'FIJAR', it.id, it.nombre, { fijado: reg.fijado });
      ctx.cache.items = null;
      return { item: publicarItem_(ctx, reg) };
    });
  });
}

/**
 * Incrementa el contador de visitas (cualquier visitante; sin bitácora).
 * Cuenta una visita por persona y enlace cada 30 min (marca en CacheService): los clics repetidos
 * no toman el bloqueo ni escriben en la hoja, así un ciclo de llamadas no retiene a los escritores.
 */
function registrarVisita(id) {
  return ejecutar_('registrarVisita', function (ctx) {
    const clave = textoLinea_(id);
    if (!clave) throw errorUsuario_('Identificador de enlace no válido.');
    const marca = marcaVisita_(ctx, clave);
    if (marca && cacheLeer_(marca)) {
      const visto = exigirItem_(ctx, clave);
      if (visto.eliminado) throw errorUsuario_(MSG_NO_ENCONTRADO);
      return { visitas: visto.visitas, contabilizada: false };
    }
    try {
      const r = conBloqueo_(ctx, function () {
        const it = exigirItem_(ctx, clave);
        if (it.eliminado) throw errorUsuario_(MSG_NO_ENCONTRADO);
        const visitas = (it.visitas || 0) + 1;
        escribirFilas_(tabla_(ctx, 'LINKS'), it._fila, [{ visitas: visitas }], ['visitas']);
        ctx.cache.items = null;
        return { visitas: visitas, contabilizada: true };
      }, ESPERA_VISITA_MS);
      if (marca) cacheGuardar_(marca, VENTANA_VISITA_S);
      return r;
    } catch (e) {
      if (!e || !e.ocupado) throw e;
      // Sin bloqueo disponible: no se cuenta la visita, pero no es un error para el usuario.
      const it = buscarItem_(ctx, clave);
      return { visitas: it ? it.visitas : 0, contabilizada: false };
    }
  });
}

/** Datos del panel de administración. */
function obtenerPanelAdmin() {
  return ejecutar_('obtenerPanelAdmin', function (ctx) {
    exigirAdmin_(ctx);
    const items = leerItems_(ctx, false);
    const activos = items.filter(function (it) { return !it.eliminado; });
    const papelera = items.filter(function (it) { return it.eliminado; })
      .sort(function (a, b) { return compararTexto_(b.fechaEliminacion, a.fechaEliminacion); });
    const usuarios = listarUsuariosPanel_(ctx, activos);
    return {
      usuarios: usuarios,
      bitacora: leerBitacora_(ctx, MAX_BITACORA_PANEL),
      papelera: papelera.map(function (it) { return publicarItem_(ctx, it); }),
      estadisticas: calcularEstadisticas_(ctx, activos, papelera, usuarios)
    };
  });
}

/** Restaura un enlace de la papelera (admin). */
function restaurarHerramienta(id) {
  return ejecutar_('restaurarHerramienta', function (ctx) {
    exigirAdmin_(ctx);
    return conBloqueo_(ctx, function () {
      const it = exigirItem_(ctx, id);
      if (!it.eliminado) throw errorUsuario_('El enlace no está en la papelera.');
      const reg = Object.assign({}, it, { eliminado: false, eliminadoPor: '', fechaEliminacion: '' });
      escribirFilas_(tabla_(ctx, 'LINKS'), it._fila, [reg], ['eliminado', 'eliminadoPor', 'fechaEliminacion']);
      registrarBitacora_(ctx, 'RESTAURAR', it.id, it.nombre, { categoria: it.categoriaId });
      ctx.cache.items = null;
      return { item: publicarItem_(ctx, reg) };
    });
  });
}

/** Elimina definitivamente un enlace que ya está en la papelera (admin). */
function purgarHerramienta(id) {
  return ejecutar_('purgarHerramienta', function (ctx) {
    exigirAdmin_(ctx);
    return conBloqueo_(ctx, function () {
      const it = exigirItem_(ctx, id);
      if (!it.eliminado) throw errorUsuario_('Solo se pueden eliminar definitivamente los enlaces que están en la papelera.');
      borrarFila_(tabla_(ctx, 'LINKS'), it._fila);
      registrarBitacora_(ctx, 'PURGAR', it.id, it.nombre, { categoria: it.categoriaId, url: it.url });
      ctx.cache.items = null;
      return { id: it.id };
    });
  });
}

/** Asigna rol 'admin' | 'usuario' a un correo (admin). */
function guardarRolUsuario(email, rol) {
  return ejecutar_('guardarRolUsuario', function (ctx) {
    const yo = exigirAdmin_(ctx);
    const correo = normalizarEmail_(textoLinea_(email));
    if (!esEmailValido_(correo)) throw errorUsuario_('El correo electrónico no es válido.');
    const r = sinAcentos_(texto_(rol).trim().toLowerCase());
    const rolNuevo = (r === 'admin' || r === 'administrador') ? 'ADMIN' : (r === 'usuario' ? 'USUARIO' : '');
    if (!rolNuevo) throw errorUsuario_('Rol no válido. Usa "admin" o "usuario".');
    if (rolNuevo === 'ADMIN' && !dominioPermitido_(correo) && correo !== ctx.owner) {
      throw errorUsuario_('El dominio de ' + correo + ' no está permitido en este directorio.');
    }
    if (rolNuevo === 'USUARIO') {
      if (correo === ctx.owner) throw errorUsuario_('El propietario del directorio siempre es administrador y no puede ser degradado.');
      if (esAdminInicial_(correo)) throw errorUsuario_('Este administrador está definido en CONFIG.ADMINS_INICIALES; quítalo de la configuración para cambiar su rol.');
    }
    return conBloqueo_(ctx, function () {
      const usuarios = leerUsuarios_(ctx);
      if (rolNuevo === 'USUARIO' && correo === yo.email && contarAdmins_(ctx) <= 1) {
        throw errorUsuario_('Eres el último administrador: promueve a otra persona antes de quitarte el rol.');
      }
      const tabla = tabla_(ctx, 'USUARIOS');
      const actual = usuarios.porEmail[correo] || null;
      const anterior = actual ? actual.rol : '';
      let reg;
      // La caché de usuarios se actualiza en sitio: la respuesta (usuarioPanel_) no relee la hoja.
      if (actual) {
        escribirFilas_(tabla, actual._fila, [{ rol: rolNuevo }], ['rol']);
        actual.rol = rolNuevo;
        reg = actual;
      } else {
        reg = { email: correo, nombre: nombreDesdeEmail_(correo), rol: rolNuevo, fechaAlta: aIso_(new Date()), ultimoAcceso: '', accesos: 0 };
        agregarRegistros_(tabla, [reg]);
        usuarios.lista.push(reg);
        usuarios.porEmail[correo] = reg;
      }
      registrarBitacora_(ctx, 'ROL', correo, reg.nombre, { rol: rolNuevo, anterior: anterior });
      const activos = leerItems_(ctx, false).filter(function (it) { return !it.eliminado; });
      return { usuario: usuarioPanel_(ctx, reg, contarPorAutor_(activos)) };
    });
  });
}

/** Crea o actualiza una categoría (admin). */
function guardarCategoria(cat) {
  return ejecutar_('guardarCategoria', function (ctx) {
    exigirAdmin_(ctx);
    if (!esObjeto_(cat)) throw errorUsuario_('Los datos de la categoría no son válidos.');
    return conBloqueo_(ctx, function () {
      const cats = leerCategorias_(ctx);
      const idEntrada = textoLinea_(cat.id);
      const existente = idEntrada ? cats.filter(function (c) { return c.id === idEntrada; })[0] || null : null;
      const datos = validarCategoria_(cat, existente, cats);
      const tabla = tabla_(ctx, 'CATEGORIAS');
      let reg;
      if (existente) {
        reg = Object.assign({}, existente, datos);
        escribirFilas_(tabla, existente._fila, [reg]);
      } else {
        const base = slug_(idEntrada || datos.nombre);
        reg = Object.assign({ id: slugUnico_(base, cats) }, datos);
        agregarRegistros_(tabla, [reg]);
      }
      ctx.cache.categorias = null;
      registrarBitacora_(ctx, 'CATEGORIA', reg.id, reg.nombre, {
        accion: existente ? 'actualizada' : 'creada',
        campos: existente ? camposCambiados_(existente, reg, ['nombre', 'seccion', 'icono', 'color', 'orden', 'descripcion', 'activa']) : undefined
      });
      return { categoria: publicarCategoria_(reg) };
    });
  });
}

/** Elimina una categoría sin enlaces activos (admin). */
function eliminarCategoria(id) {
  return ejecutar_('eliminarCategoria', function (ctx) {
    exigirAdmin_(ctx);
    return conBloqueo_(ctx, function () {
      const clave = textoLinea_(id);
      const cat = leerCategorias_(ctx).filter(function (c) { return c.id === clave; })[0];
      if (!cat) throw errorUsuario_('No se encontró la categoría solicitada.');
      const enUso = leerItems_(ctx, false).filter(function (it) { return !it.eliminado && it.categoriaId === clave; }).length;
      if (enUso > 0) {
        throw errorUsuario_('La categoría tiene ' + enUso + (enUso === 1 ? ' enlace' : ' enlaces') + '. Muévelos o desactívala.');
      }
      borrarFila_(tabla_(ctx, 'CATEGORIAS'), cat._fila);
      ctx.cache.categorias = null;
      registrarBitacora_(ctx, 'CATEGORIA_ELIMINAR', cat.id, cat.nombre, { seccion: cat.seccion });
      return { id: cat.id };
    });
  });
}

/** Cambia el nombre visible del usuario actual. */
function actualizarMiPerfil(nombre) {
  return ejecutar_('actualizarMiPerfil', function (ctx) {
    const yo = exigirEscritura_(ctx);
    const limpio = textoLinea_(nombre);
    if (limpio.length < LIMITES.PERFIL_MIN || limpio.length > LIMITES.PERFIL_MAX) {
      throw errorUsuario_('El nombre debe tener entre ' + LIMITES.PERFIL_MIN + ' y ' + LIMITES.PERFIL_MAX + ' caracteres.');
    }
    return conBloqueo_(ctx, function () {
      const tabla = tabla_(ctx, 'USUARIOS');
      const usuarios = leerUsuarios_(ctx);
      validarNombrePerfil_(limpio, yo.email, usuarios, leerItems_(ctx, false));
      const actual = usuarios.porEmail[yo.email] || null;
      const anterior = actual ? actual.nombre : '';
      if (actual) {
        escribirFilas_(tabla, actual._fila, [{ nombre: limpio }], ['nombre']);
      } else {
        // Rol guardado USUARIO: el de propietario / ADMINS_INICIALES se calcula en cada ejecución (rolDeEmail_).
        const ahora = aIso_(new Date());
        agregarRegistros_(tabla, [{
          email: yo.email, nombre: limpio, rol: 'USUARIO',
          fechaAlta: ahora, ultimoAcceso: ahora, accesos: 1
        }]);
      }
      ctx.cache.usuarios = null;
      yo.nombre = limpio;
      registrarBitacora_(ctx, 'PERFIL', yo.email, limpio, { anterior: anterior });
      return { usuario: resumenUsuario_(yo) };
    });
  });
}

/** Importa enlaces (upsert por id). Acepta un arreglo o el JSON de exportación {items:[...]}. */
function importarHerramientas(items) {
  return ejecutar_('importarHerramientas', function (ctx) {
    const yo = exigirAdmin_(ctx);
    let lista = items;
    if (typeof lista === 'string') {
      try { lista = JSON.parse(lista); } catch (err) { throw errorUsuario_('El texto proporcionado no es un JSON válido.'); }
    }
    if (esObjeto_(lista) && Array.isArray(lista.items)) lista = lista.items;
    if (!Array.isArray(lista)) throw errorUsuario_('Se esperaba una lista de enlaces (arreglo JSON o el formato de exportación con "items").');
    if (!lista.length) throw errorUsuario_('No hay enlaces para importar.');
    if (lista.length > MAX_IMPORTACION) throw errorUsuario_('Máximo ' + MAX_IMPORTACION + ' enlaces por importación.');

    return conBloqueo_(ctx, function () {
      const tabla = tabla_(ctx, 'LINKS');
      // Diccionarios sin prototipo: ids como "constructor" o "__proto__" no deben encontrar miembros heredados.
      const porId = nuevoMapa_();
      leerItems_(ctx, false).forEach(function (it) { porId[it.id] = it; });
      const nuevos = [];
      const modificados = nuevoMapa_();
      const errores = [];
      const res = { creados: 0, actualizados: 0, omitidos: 0 };
      const ahora = aIso_(new Date());

      lista.forEach(function (entrada, i) {
        const nombreEntrada = esObjeto_(entrada) ? textoLinea_(entrada.nombre) : '';
        const etiqueta = 'Elemento ' + (i + 1) + (nombreEntrada ? ' ("' + recortar_(nombreEntrada, 60) + '")' : '');
        try {
          if (!esObjeto_(entrada)) throw errorUsuario_('no es un objeto de enlace válido.');
          let id = textoLinea_(entrada.id);
          if (id && !esIdSeguro_(id)) id = ''; // id no seguro → se genera uno nuevo
          const existente = id ? porId[id] || null : null;
          if (existente && existente.eliminado) throw errorUsuario_('está en la papelera; restáuralo antes de importarlo.');
          const datos = validarItem_(ctx, entrada, existente);
          const autor = autorImportado_(ctx, entrada, existente, yo, ahora);
          const tipoVisitas = typeof entrada.visitas;
          const visitasEntrada = (tipoVisitas === 'number' || tipoVisitas === 'string') ? Number(entrada.visitas) : NaN;
          const visitas = (isFinite(visitasEntrada) && visitasEntrada >= 0 && entrada.visitas !== '' && entrada.visitas !== null)
            ? Math.floor(visitasEntrada) : (existente ? existente.visitas : 0);
          if (existente) {
            const reg = Object.assign({}, existente, datos, autor, {
              visitas: visitas, modificadoPor: yo.email, modificadoPorNombre: yo.nombre, fechaModificacion: ahora
            });
            if (existente._nuevo) nuevos[nuevos.indexOf(existente)] = reg;
            else modificados[reg._fila] = reg;
            porId[reg.id] = reg;
            res.actualizados++;
          } else {
            const reg = Object.assign(itemVacio_(), datos, autor, { id: id || nuevoId_(), visitas: visitas, _nuevo: true });
            nuevos.push(reg);
            porId[reg.id] = reg;
            res.creados++;
          }
        } catch (e) {
          res.omitidos++;
          errores.push(etiqueta + ': ' + (e && e.message ? e.message : String(e)));
        }
      });

      // Escritura en bloque: filas modificadas contiguas en un solo setValues.
      const filas = Object.keys(modificados).map(Number).sort(function (a, b) { return a - b; });
      try {
        let bloque = [];
        filas.forEach(function (f, idx) {
          bloque.push(modificados[f]);
          const siguiente = filas[idx + 1];
          if (siguiente !== f + 1) {
            escribirFilas_(tabla, bloque[0]._fila, bloque);
            bloque = [];
          }
        });
        agregarRegistros_(tabla, nuevos);
      } catch (e) {
        // Una falla a mitad de la escritura puede dejar cambios parciales: se registran en la bitácora.
        ctx.cache.items = null;
        registrarBitacora_(ctx, 'IMPORTAR', '', '', {
          incompleta: true, error: recortar_(e && e.message ? e.message : String(e), 200),
          creados: res.creados, actualizados: res.actualizados, omitidos: res.omitidos
        });
        throw e;
      }
      ctx.cache.items = null;
      registrarBitacora_(ctx, 'IMPORTAR', '', '', res);
      return { creados: res.creados, actualizados: res.actualizados, omitidos: res.omitidos, errores: errores };
    });
  });
}

/** Reinserta enlaces y categorías semilla cuyo id ya no existe (admin). */
function cargarSemillaFaltante() {
  return ejecutar_('cargarSemillaFaltante', function (ctx) {
    exigirAdmin_(ctx);
    return conBloqueo_(ctx, function () {
      const r = sembrarFaltantes_(ctx);
      registrarBitacora_(ctx, 'SEMILLA', '', '', { origen: 'manual', items: r.items, categorias: r.categorias });
      return { agregados: r.items, categoriasAgregadas: r.categorias };
    });
  });
}

/**
 * Ejecutar manualmente desde el editor: crea/repara hojas, siembra datos y registra al propietario.
 * Como toda función sin "_" también se puede llamar con google.script.run: exige rol admin
 * (desde el editor quien ejecuta es el propietario, que siempre es admin).
 */
function instalarDirectorio() {
  return ejecutar_('instalarDirectorio', function (ctx) {
    exigirInstalador_(ctx);
    return conBloqueo_(ctx, function () {
      exigirInstalador_(ctx); // re-verificación con datos frescos (caso de arranque sin administradores)
      Object.keys(ESQUEMAS).forEach(function (clave) { tabla_(ctx, clave); });
      asegurarDatosIniciales_(ctx);
      const propietario = ctx.owner || ctx.email;
      if (propietario) {
        const tabla = tabla_(ctx, 'USUARIOS');
        const actual = leerUsuarios_(ctx).porEmail[propietario] || null;
        if (!actual) {
          agregarRegistros_(tabla, [{
            email: propietario, nombre: nombreDesdeEmail_(propietario), rol: 'ADMIN',
            fechaAlta: aIso_(new Date()), ultimoAcceso: '', accesos: 0
          }]);
        } else if (actual.rol !== 'ADMIN') {
          escribirFilas_(tabla, actual._fila, [{ rol: 'ADMIN' }], ['rol']);
        }
        ctx.cache.usuarios = null;
      }
      const url = libro_(ctx).getUrl();
      Logger.log('Directorio instalado correctamente. Base de datos: ' + url);
      return { url: url };
    });
  });
}

// =============================================================================
// 5. EJECUCIÓN, CONTEXTO Y BLOQUEOS
// =============================================================================

/** Envoltura común: crea contexto, captura errores y garantiza respuesta serializable. */
function ejecutar_(nombre, fn) {
  const ctx = crearContexto_();
  try {
    const r = fn(ctx) || {};
    return aPlano_(Object.assign({ ok: true }, r));
  } catch (e) {
    if (e && e.esUsuario) return aPlano_(Object.assign({ ok: false, error: e.message }, e.extra || {}));
    const msg = e && e.message ? e.message : String(e);
    console.error('[' + nombre + '] ' + msg + (e && e.stack ? '\n' + e.stack : ''));
    return { ok: false, error: 'Ocurrió un error inesperado en el servidor (' + nombre + '): ' + msg };
  }
}

/** Contexto por ejecución (en GAS cada llamada es una ejecución nueva). */
function crearContexto_() {
  return {
    ss: null, tablas: {}, cache: {}, bloqueado: false, yo: null,
    email: emailActivo_(), owner: emailPropietario_(), ahora: new Date()
  };
}

/** Ejecuta fn bajo el ScriptLock (reentrante dentro del mismo contexto). */
function conBloqueo_(ctx, fn, esperaMs) {
  if (ctx.bloqueado) return fn();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(esperaMs === undefined ? ESPERA_BLOQUEO_MS : esperaMs)) {
    const err = errorUsuario_(MSG_OCUPADO);
    err.ocupado = true;
    throw err;
  }
  ctx.bloqueado = true;
  // Releer datos frescos: otra ejecución pudo escribir antes de obtener el bloqueo.
  ctx.cache = {};
  Object.keys(ctx.tablas).forEach(function (k) { ctx.tablas[k].datos = null; ctx.tablas[k].ultimaFila = null; });
  try {
    return fn();
  } finally {
    ctx.bloqueado = false;
    try { SpreadsheetApp.flush(); } catch (err) { /* sin efecto */ }
    lock.releaseLock();
  }
}

/** Error esperado (validación / permisos) que se devuelve como {ok:false,error}. */
function errorUsuario_(mensaje, extra) {
  const e = new Error(mensaje);
  e.esUsuario = true;
  if (extra) e.extra = extra;
  return e;
}

// =============================================================================
// 6. IDENTIDAD Y ROLES
// =============================================================================

function emailActivo_() {
  try { return normalizarEmail_(Session.getActiveUser().getEmail()); } catch (e) { return ''; }
}

function emailPropietario_() {
  try { return normalizarEmail_(Session.getEffectiveUser().getEmail()); } catch (e) { return ''; }
}

/** Usuario actual: {email, nombre, rol, esPropietario, puedeEscribir, registro}. */
function usuarioActual_(ctx) {
  if (ctx.yo) return ctx.yo;
  const email = ctx.email;
  const yo = { email: email, nombre: 'Invitado', rol: 'invitado', esPropietario: !!email && email === ctx.owner, registro: null };
  if (email) {
    yo.rol = rolDeEmail_(ctx, email);
    yo.registro = leerUsuarios_(ctx).porEmail[email] || null;
    yo.nombre = (yo.registro && yo.registro.nombre) || nombreDesdeEmail_(email);
  }
  yo.puedeEscribir = yo.rol !== 'invitado';
  ctx.yo = yo;
  return yo;
}

/** Rol efectivo de un correo. El propietario siempre es admin. */
function rolDeEmail_(ctx, email) {
  if (!email) return 'invitado';
  if (ctx.owner && email === ctx.owner) return 'admin';
  if (!dominioPermitido_(email)) return 'invitado';
  if (esAdminInicial_(email)) return 'admin';
  const reg = leerUsuarios_(ctx).porEmail[email];
  return reg && reg.rol === 'ADMIN' ? 'admin' : 'usuario';
}

function dominioPermitido_(email) {
  const dominios = (CONFIG.DOMINIOS_PERMITIDOS || []).map(function (d) {
    return String(d || '').trim().toLowerCase().replace(/^@/, '');
  }).filter(String);
  if (!dominios.length) return true;
  const dominio = String(email).split('@')[1] || '';
  return dominios.some(function (d) { return dominio === d || dominio.slice(-(d.length + 1)) === '.' + d; });
}

function esAdminInicial_(email) {
  return (CONFIG.ADMINS_INICIALES || []).map(normalizarEmail_).indexOf(email) >= 0;
}

function exigirEscritura_(ctx) {
  const yo = usuarioActual_(ctx);
  if (yo.rol === 'invitado') {
    throw errorUsuario_(yo.email
      ? 'Tu cuenta (' + yo.email + ') solo tiene acceso de consulta en este directorio.'
      : 'Estás en modo consulta. Abre el directorio con tu cuenta corporativa para realizar cambios.');
  }
  return yo;
}

function exigirAdmin_(ctx) {
  const yo = usuarioActual_(ctx);
  if (yo.rol !== 'admin') throw errorUsuario_('Esta acción requiere permisos de administrador.');
  return yo;
}

/**
 * instalarDirectorio: solo admin. Excepción de arranque: sin propietario identificable y sin
 * ningún administrador, quien instala (identificado y con dominio permitido) queda como ADMIN.
 */
function exigirInstalador_(ctx) {
  const yo = usuarioActual_(ctx);
  if (yo.rol === 'admin') return yo;
  if (!ctx.owner && yo.rol === 'usuario' && contarAdmins_(ctx) === 0) return yo;
  throw errorUsuario_('Esta acción requiere permisos de administrador.');
}

function puedeEditar_(ctx, it) {
  const yo = usuarioActual_(ctx);
  if (yo.rol === 'admin') return true;
  return yo.rol === 'usuario' && !!it.creadoPor && it.creadoPor === yo.email;
}

function resumenUsuario_(yo) {
  return { email: yo.email, nombre: yo.nombre, rol: yo.rol, esPropietario: yo.esPropietario, puedeEscribir: yo.puedeEscribir };
}

/**
 * Upsert del usuario en USUARIOS (máx. una escritura cada 30 min). Nunca rompe el catálogo.
 * No escribe el rol: el de propietario y CONFIG.ADMINS_INICIALES se calcula en cada ejecución
 * (rolDeEmail_), así quitar un correo de la configuración le retira el rol de inmediato y una
 * ejecución como "usuario efectivo" (URL /dev) no deja un ADMIN permanente en la hoja.
 * Espera corta del bloqueo: si otra escritura lo retiene, el registro se omite (se reintenta en la próxima carga).
 */
function registrarAcceso_(ctx) {
  const yo = usuarioActual_(ctx);
  if (yo.rol === 'invitado') return;
  const reciente = function (reg) {
    const ult = reg && reg.ultimoAcceso ? Date.parse(reg.ultimoAcceso) : 0;
    return !!ult && (ctx.ahora.getTime() - ult) < VENTANA_ACCESO_MS;
  };
  if (reciente(yo.registro)) return;
  try {
    conBloqueo_(ctx, function () {
      const tabla = tabla_(ctx, 'USUARIOS');
      const actual = leerUsuarios_(ctx).porEmail[yo.email] || null;
      const ahora = aIso_(ctx.ahora);
      if (actual) {
        if (reciente(actual)) return;
        escribirFilas_(tabla, actual._fila, [{
          ultimoAcceso: ahora, accesos: (actual.accesos || 0) + 1
        }], ['ultimoAcceso', 'accesos']);
      } else {
        agregarRegistros_(tabla, [{
          email: yo.email, nombre: nombreDesdeEmail_(yo.email), rol: 'USUARIO',
          fechaAlta: ahora, ultimoAcceso: ahora, accesos: 1
        }]);
      }
      ctx.cache.usuarios = null;
    }, ESPERA_SECUNDARIA_MS);
  } catch (e) {
    Logger.log('registrarAcceso_: ' + (e && e.message ? e.message : e));
  }
}

/** Número de administradores efectivos (propietario + iniciales + hoja). */
function contarAdmins_(ctx) {
  const admins = nuevoMapa_();
  if (ctx.owner) admins[ctx.owner] = true;
  (CONFIG.ADMINS_INICIALES || []).map(normalizarEmail_).forEach(function (e) {
    if (e && dominioPermitido_(e)) admins[e] = true;
  });
  leerUsuarios_(ctx).lista.forEach(function (u) {
    if (u.rol === 'ADMIN' && dominioPermitido_(u.email)) admins[u.email] = true;
  });
  return Object.keys(admins).length;
}

// =============================================================================
// 7. LIBRO, HOJAS Y MAPEO DE COLUMNAS
// =============================================================================

/** Resuelve la hoja de cálculo: CONFIG → contenedora → propiedad → nueva. */
function libro_(ctx) {
  if (ctx.ss) return ctx.ss;
  let ss = null;
  if (CONFIG.SPREADSHEET_ID) {
    try { ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID); } catch (e) {
      throw errorUsuario_('No se pudo abrir la hoja configurada en CONFIG.SPREADSHEET_ID. Verifica el ID y los permisos.');
    }
  }
  if (!ss) {
    try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (e) { ss = null; }
  }
  if (!ss) ss = libroDesdePropiedades_(ctx);
  ctx.ss = ss;
  return ss;
}

function libroDesdePropiedades_(ctx) {
  const props = PropertiesService.getScriptProperties();
  const abrir = function (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) {
      throw errorUsuario_('No se pudo abrir la base de datos del directorio (ID ' + id + '). Verifica permisos o elimina la propiedad ' + PROP_ID_LIBRO + ' para crear una nueva.');
    }
  };
  const id = props.getProperty(PROP_ID_LIBRO);
  if (id) return abrir(id);
  return conBloqueo_(ctx, function () {
    const id2 = props.getProperty(PROP_ID_LIBRO);
    if (id2) return abrir(id2);
    const nuevo = SpreadsheetApp.create(NOMBRE_LIBRO_NUEVO);
    props.setProperty(PROP_ID_LIBRO, nuevo.getId());
    try {
      const primera = nuevo.getSheets()[0];
      if (primera && !nuevo.getSheetByName(CONFIG.HOJAS.LINKS)) primera.setName(CONFIG.HOJAS.LINKS);
    } catch (e) { /* cosmético */ }
    Logger.log('Se creó la base de datos del directorio: ' + nuevo.getUrl());
    return nuevo;
  });
}

/** Tabla (hoja + mapa de columnas) asegurada y cacheada en el contexto. */
function tabla_(ctx, clave) {
  if (ctx.tablas[clave]) return ctx.tablas[clave];
  const t = asegurarHoja_(ctx, clave);
  if (!t.parcial) ctx.tablas[clave] = t; // una tabla parcial no se cachea: se reintenta la reparación
  return t;
}

/** Crea la hoja si falta y agrega al final las columnas faltantes (bajo bloqueo). */
function asegurarHoja_(ctx, clave) {
  const ss = libro_(ctx);
  const nombre = CONFIG.HOJAS[clave];
  const esquema = ESQUEMAS[clave];
  const conDatos = clave !== 'BITACORA'; // BITACORA puede tener miles de filas: solo se leen sus encabezados
  let hoja = ss.getSheetByName(nombre);
  let info = hoja ? analizarEncabezados_(hoja, esquema, conDatos) : null;
  if (hoja && !info.faltantes.length) return construirTabla_(clave, hoja, esquema, info);

  const reparar = function () {
    hoja = ss.getSheetByName(nombre);
    if (!hoja) {
      try { hoja = ss.insertSheet(nombre); } catch (e) {
        hoja = ss.getSheetByName(nombre); // otra ejecución la creó
        if (!hoja) throw e;
      }
    }
    info = analizarEncabezados_(hoja, esquema, conDatos);
    if (info.faltantes.length) {
      agregarColumnas_(hoja, clave, info);
      info = analizarEncabezados_(hoja, esquema, conDatos);
    }
    return construirTabla_(clave, hoja, esquema, info);
  };
  // Hoja existente con columnas faltantes, fuera de un bloqueo (lectura): intento breve; si otra
  // ejecución retiene el bloqueo, se lee con el mapa parcial (campos faltantes = '') y la reparación
  // queda para la siguiente ejecución que lo obtenga. Si la hoja no existe hay que crearla: espera normal.
  if (hoja && !ctx.bloqueado) {
    try {
      return conBloqueo_(ctx, reparar, ESPERA_SECUNDARIA_MS);
    } catch (e) {
      if (!e || !e.ocupado) throw e;
      const parcial = construirTabla_(clave, hoja, esquema, info);
      parcial.parcial = true;
      return parcial;
    }
  }
  return conBloqueo_(ctx, reparar, ESPERA_BLOQUEO_MS);
}

/**
 * Lee la fila 1 y ubica cada campo por nombre de encabezado (insensible a mayúsculas/acentos/espacios).
 * Con conDatos lee la hoja completa en una sola llamada (getDataRange) y conserva las filas de datos
 * para la primera lectura de registros (leerRegistros_), en lugar de leer la hoja dos veces.
 */
function analizarEncabezados_(hoja, esquema, conDatos) {
  let valores;
  if (conDatos) {
    valores = hoja.getDataRange().getValues();
    if (valores.length === 1 && valores[0].length === 1 && valores[0][0] === '') valores = []; // hoja vacía (A1)
  } else {
    const ultimaColHoja = hoja.getLastColumn();
    valores = ultimaColHoja > 0 ? hoja.getRange(1, 1, 1, ultimaColHoja).getValues() : [];
  }
  const encabezados = valores.length ? valores[0] : [];
  const ultimaCol = encabezados.length;
  const indice = nuevoMapa_();
  encabezados.forEach(function (h, i) {
    const k = claveEncabezado_(h);
    if (k && !(k in indice)) indice[k] = i + 1;
  });
  const mapa = {};
  const faltantes = [];
  esquema.forEach(function (col) {
    const pos = indice[claveEncabezado_(col.h)];
    if (pos) mapa[col.c] = pos; else faltantes.push(col);
  });
  return {
    mapa: mapa, faltantes: faltantes, ultimaCol: ultimaCol,
    datos: conDatos ? valores.slice(1) : null,
    ultimaFila: conDatos ? valores.length : null
  };
}

/**
 * Tabla: hoja + mapa de columnas. "datos" (filas leídas con los encabezados) se consume una sola vez;
 * "ultimaFila" evita getLastRow al agregar. Ambos se invalidan al tomar el bloqueo y al escribir.
 */
function construirTabla_(clave, hoja, esquema, info) {
  const defs = {};
  let maxCol = info.ultimaCol;
  esquema.forEach(function (col) {
    defs[col.c] = col;
    if (info.mapa[col.c] > maxCol) maxCol = info.mapa[col.c];
  });
  return {
    clave: clave, hoja: hoja, esquema: esquema, defs: defs, mapa: info.mapa, ancho: Math.max(maxCol, 1),
    datos: info.datos || null, ultimaFila: info.ultimaFila === undefined ? null : info.ultimaFila
  };
}

/** Agrega encabezados faltantes al final (o todos, si la hoja está vacía) y les da formato. */
function agregarColumnas_(hoja, clave, info) {
  const hojaVacia = info.ultimaCol === 0;
  const inicio = info.ultimaCol + 1;
  const faltantes = info.faltantes;
  const necesarias = inicio + faltantes.length - 1;
  const maxCols = hoja.getMaxColumns();
  if (necesarias > maxCols) hoja.insertColumnsAfter(maxCols, necesarias - maxCols);
  const rango = hoja.getRange(1, inicio, 1, faltantes.length);
  rango.setNumberFormat('@');
  rango.setValues([faltantes.map(function (c) { return c.h; })]);
  try {
    rango.setFontWeight('bold').setFontColor('#FFFFFF').setBackground(COLOR_ENCABEZADO)
      .setHorizontalAlignment('left').setVerticalAlignment('middle');
    faltantes.forEach(function (col, i) { formatearColumna_(hoja, inicio + i, col); });
    if (hoja.getFrozenRows() < 1) hoja.setFrozenRows(1);
    if (hojaVacia) hoja.setTabColor(COLORES_PESTANA[clave] || COLOR_ENCABEZADO);
  } catch (e) {
    Logger.log('Formato de encabezados (' + hoja.getName() + '): ' + e.message); // solo cosmético
  }
}

/** Ancho, formato de número y validación de lista para una columna de datos. */
function formatearColumna_(hoja, col, def) {
  hoja.setColumnWidth(col, def.ancho || 140);
  const filas = hoja.getMaxRows() - 1;
  if (filas < 1) return;
  const rango = hoja.getRange(2, col, filas, 1);
  rango.setNumberFormat(FORMATOS_TIPO[def.t] || '@');
  if (def.opciones) {
    rango.setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(def.opciones, true).setAllowInvalid(true).build());
  }
}

/** Lee todas las filas de datos como registros {campo: valor, _fila}. */
function leerRegistros_(tabla) {
  let datos = tabla.datos;
  tabla.datos = null; // se consume una sola vez: las lecturas siguientes van a la hoja (datos frescos)
  if (!datos) {
    const ultimaFila = tabla.hoja.getLastRow();
    tabla.ultimaFila = ultimaFila;
    if (ultimaFila < 2) return [];
    datos = tabla.hoja.getRange(2, 1, ultimaFila - 1, tabla.ancho).getValues();
  }
  return convertirFilas_(tabla, datos, 2);
}

/** Última fila con contenido: la conocida por la última lectura/escritura o la que informa la hoja. */
function ultimaFila_(tabla) {
  if (tabla.ultimaFila === null || tabla.ultimaFila === undefined) tabla.ultimaFila = tabla.hoja.getLastRow();
  return tabla.ultimaFila;
}

function convertirFilas_(tabla, datos, filaInicial) {
  const res = [];
  datos.forEach(function (fila, i) {
    const reg = { _fila: filaInicial + i };
    let vacia = true;
    tabla.esquema.forEach(function (col) {
      const pos = tabla.mapa[col.c];
      const v = pos ? fila[pos - 1] : '';
      if (v !== '' && v !== null && v !== undefined) vacia = false;
      reg[col.c] = leerCelda_(v, col.t);
    });
    if (!vacia) res.push(reg);
  });
  return res;
}

/** Escribe (solo columnas mapeadas, por segmentos contiguos) filas consecutivas desde filaInicio. */
function escribirFilas_(tabla, filaInicio, registros, campos) {
  if (!registros.length) return;
  tabla.datos = null; // las filas leídas con los encabezados dejan de estar vigentes
  const lista = (campos || tabla.esquema.map(function (c) { return c.c; }))
    .filter(function (c) { return tabla.defs[c] && tabla.mapa[c]; })
    .map(function (c) { return { def: tabla.defs[c], col: tabla.mapa[c] }; })
    .sort(function (a, b) { return a.col - b.col; });
  const segmentos = [];
  lista.forEach(function (x) {
    const ult = segmentos[segmentos.length - 1];
    if (ult && ult.inicio + ult.cols.length === x.col) ult.cols.push(x);
    else segmentos.push({ inicio: x.col, cols: [x] });
  });
  segmentos.forEach(function (seg) {
    const valores = registros.map(function (r) {
      return seg.cols.map(function (x) { return escribirCelda_(r[x.def.c], x.def.t); });
    });
    const formatos = registros.map(function () {
      return seg.cols.map(function (x) { return FORMATOS_TIPO[x.def.t] || '@'; });
    });
    const rango = tabla.hoja.getRange(filaInicio, seg.inicio, registros.length, seg.cols.length);
    rango.setNumberFormats(formatos); // primero formato: evita autoconversión de textos
    rango.setValues(valores);
  });
}

/**
 * Agrega registros al final de la hoja (amplía filas si hace falta). "crecimiento" = mínimo de filas
 * a insertar de una vez cuando la hoja se llena (BITACORA: evita insertar una fila en cada evento).
 */
function agregarRegistros_(tabla, registros, crecimiento) {
  if (!registros.length) return;
  const hoja = tabla.hoja;
  const inicio = Math.max(ultimaFila_(tabla) + 1, 2);
  const fin = inicio + registros.length - 1;
  const maxFilas = hoja.getMaxRows();
  if (fin > maxFilas) hoja.insertRowsAfter(maxFilas, Math.max(fin - maxFilas, crecimiento || 0));
  escribirFilas_(tabla, inicio, registros);
  tabla.ultimaFila = fin;
  registros.forEach(function (r, i) { r._fila = inicio + i; });
}

/** Borra una fila; si es la única fila no inmovilizada, solo limpia su contenido. */
function borrarFila_(tabla, fila) {
  const hoja = tabla.hoja;
  if (hoja.getMaxRows() - Math.max(hoja.getFrozenRows(), 1) <= 1) {
    hoja.getRange(fila, 1, 1, Math.max(hoja.getLastColumn(), 1)).clearContent();
  } else {
    hoja.deleteRow(fila);
  }
  tabla.datos = null;
  tabla.ultimaFila = null;
}

function leerCelda_(v, tipo) {
  switch (tipo) {
    case 'email': return normalizarEmail_(texto_(v));
    case 'lista': return partirLista_(texto_(v));
    case 'bool': return aBooleano_(v);
    case 'boolV': return (v === '' || v === null || v === undefined) ? true : aBooleano_(v);
    case 'fecha': return aIso_(v);
    case 'numero': return aNumero_(v, 0);
    case 'orden': return aNumero_(v, 999);
    default: return texto_(v);
  }
}

function escribirCelda_(v, tipo) {
  switch (tipo) {
    case 'lista': return protegerTexto_((Array.isArray(v) ? v : partirLista_(v)).join(', '));
    case 'bool': case 'boolV': return v === true || aBooleano_(v);
    case 'fecha': return aFecha_(v) || '';
    case 'numero': case 'orden': { const n = Number(v); return isFinite(n) ? n : 0; }
    default: return protegerTexto_(v === null || v === undefined ? '' : String(v));
  }
}

// =============================================================================
// 8. DATOS: ENLACES, CATEGORÍAS, USUARIOS, BITÁCORA
// =============================================================================

/** Enlaces (incluye eliminados). Repara IDs faltantes de filas agregadas a mano si se pide. */
function leerItems_(ctx, repararIds) {
  if (ctx.cache.items) return ctx.cache.items;
  let regs = leerRegistros_(tabla_(ctx, 'LINKS')).filter(function (r) { return r.id || r.nombre; });
  if (repararIds && regs.some(function (r) { return !r.id; })) {
    try {
      conBloqueo_(ctx, function () {
        const tabla = tabla_(ctx, 'LINKS');
        leerRegistros_(tabla).forEach(function (r) {
          if (!r.id && r.nombre) escribirFilas_(tabla, r._fila, [{ id: nuevoId_() }], ['id']);
        });
      }, ESPERA_SECUNDARIA_MS);
      regs = leerRegistros_(tabla_(ctx, 'LINKS')).filter(function (r) { return r.id || r.nombre; });
    } catch (e) {
      Logger.log('No se pudieron asignar IDs faltantes: ' + (e && e.message ? e.message : e));
    }
  }
  const vistos = nuevoMapa_();
  const items = regs.filter(function (r) {
    if (!r.id || vistos[r.id]) return false; // sin id (pendiente) o duplicado: se omite
    vistos[r.id] = true;
    return true;
  }).map(normalizarItemLeido_);
  ctx.cache.items = items;
  return items;
}

/** Normalización tolerante de un registro leído de la hoja. */
function normalizarItemLeido_(r) {
  r.id = textoLinea_(r.id);
  r.nombre = textoLinea_(r.nombre) || '(Sin nombre)';
  r.categoriaId = textoLinea_(r.categoriaId);
  r.url = textoLinea_(r.url);
  r.urlScript = textoLinea_(r.urlScript);
  r.descripcion = textoLargo_(r.descripcion);
  r.tags = normalizarTags_(r.tags);
  r.tecnologias = normalizarTecnologias_(r.tecnologias);
  r.iniciativa = textoLinea_(r.iniciativa);
  r.estado = normalizarEstado_(r.estado) || 'produccion';
  r.frecuencia = textoLinea_(r.frecuencia);
  r.creadoPorNombre = textoLinea_(r.creadoPorNombre) || (r.creadoPor ? nombreDesdeEmail_(r.creadoPor) : '');
  r.modificadoPorNombre = textoLinea_(r.modificadoPorNombre);
  r.visitas = Math.max(0, Math.floor(r.visitas || 0));
  return r;
}

function buscarEnLista_(items, id) {
  for (let i = 0; i < items.length; i++) if (items[i].id === id) return items[i];
  return null;
}

function buscarItem_(ctx, id) {
  const clave = textoLinea_(id);
  return clave ? buscarEnLista_(leerItems_(ctx, false), clave) : null;
}

function exigirItem_(ctx, id) {
  const it = buscarItem_(ctx, id);
  if (!it) throw errorUsuario_(MSG_NO_ENCONTRADO);
  return it;
}

function itemVacio_() {
  return {
    id: '', nombre: '', categoriaId: '', url: '', urlScript: '', descripcion: '', tags: [], tecnologias: [],
    iniciativa: '', estado: 'produccion', fijado: false, tiempoReal: false, frecuencia: '',
    creadoPor: '', creadoPorNombre: '', fechaCreacion: '', modificadoPor: '', modificadoPorNombre: '',
    fechaModificacion: '', visitas: 0, eliminado: false, eliminadoPor: '', fechaEliminacion: ''
  };
}

/** Objeto público (contrato §2) con puedeEditar calculado para el usuario actual. */
function publicarItem_(ctx, it) {
  return {
    id: it.id, nombre: it.nombre, categoriaId: it.categoriaId, url: it.url, urlScript: it.urlScript,
    descripcion: it.descripcion, tags: (it.tags || []).slice(), tecnologias: (it.tecnologias || []).slice(),
    iniciativa: it.iniciativa, estado: it.estado, fijado: !!it.fijado, tiempoReal: !!it.tiempoReal,
    frecuencia: it.frecuencia, creadoPor: it.creadoPor, creadoPorNombre: it.creadoPorNombre,
    fechaCreacion: aIso_(it.fechaCreacion), modificadoPor: it.modificadoPor, modificadoPorNombre: it.modificadoPorNombre,
    fechaModificacion: aIso_(it.fechaModificacion), visitas: Number(it.visitas) || 0, eliminado: !!it.eliminado,
    eliminadoPor: it.eliminadoPor, fechaEliminacion: aIso_(it.fechaEliminacion),
    puedeEditar: puedeEditar_(ctx, it)
  };
}

function itemDesdeSemilla_(s, autor, fechaIso) {
  return Object.assign(itemVacio_(), {
    id: s.id, nombre: s.nombre, categoriaId: s.categoriaId, url: s.url || '', urlScript: '',
    descripcion: s.descripcion, tags: normalizarTags_(s.tags), tecnologias: normalizarTecnologias_(s.tecnologias),
    iniciativa: s.iniciativa || '', estado: 'produccion', fijado: !!s.fijado, tiempoReal: !!s.tiempoReal,
    frecuencia: s.frecuencia || '', creadoPor: autor, creadoPorNombre: NOMBRE_EQUIPO_SEMILLA,
    fechaCreacion: fechaIso, visitas: 0
  });
}

/** Siembra categorías y enlaces si sus hojas no tienen filas de datos (respaldo con datos semilla). */
function asegurarDatosIniciales_(ctx) {
  const vacias = function () {
    return {
      cats: ultimaFila_(tabla_(ctx, 'CATEGORIAS')) < 2, // conocida por la lectura inicial: sin llamadas extra
      items: ultimaFila_(tabla_(ctx, 'LINKS')) < 2
    };
  };
  const previo = vacias();
  if (!previo.cats && !previo.items) return;
  conBloqueo_(ctx, function () {
    const estado = vacias();
    const r = { categorias: 0, items: 0 };
    if (estado.cats) {
      const cats = CATEGORIAS_SEMILLA.map(function (c) { return Object.assign({ activa: true }, c); });
      agregarRegistros_(tabla_(ctx, 'CATEGORIAS'), cats);
      r.categorias = cats.length;
      ctx.cache.categorias = null;
    }
    if (estado.items) {
      const ahora = aIso_(new Date());
      const autor = ctx.owner || ctx.email || '';
      const items = ITEMS_SEMILLA.map(function (s) { return itemDesdeSemilla_(s, autor, ahora); });
      agregarRegistros_(tabla_(ctx, 'LINKS'), items);
      r.items = items.length;
      ctx.cache.items = null;
    }
    if (r.categorias || r.items) registrarBitacora_(ctx, 'SEMILLA', '', '', { origen: 'automatica', items: r.items, categorias: r.categorias });
  });
}

/** Inserta solo las semillas (categorías y enlaces) cuyo id falta. */
function sembrarFaltantes_(ctx) {
  const idsCat = nuevoMapa_();
  leerCategorias_(ctx).forEach(function (c) { idsCat[c.id] = true; });
  const nuevasCats = CATEGORIAS_SEMILLA.filter(function (c) { return !idsCat[c.id]; })
    .map(function (c) { return Object.assign({ activa: true }, c); });
  agregarRegistros_(tabla_(ctx, 'CATEGORIAS'), nuevasCats);
  ctx.cache.categorias = null;

  const idsItems = nuevoMapa_();
  leerItems_(ctx, false).forEach(function (it) { idsItems[it.id] = true; });
  const ahora = aIso_(new Date());
  const autor = ctx.owner || ctx.email || '';
  const nuevos = ITEMS_SEMILLA.filter(function (s) { return !idsItems[s.id]; })
    .map(function (s) { return itemDesdeSemilla_(s, autor, ahora); });
  agregarRegistros_(tabla_(ctx, 'LINKS'), nuevos);
  ctx.cache.items = null;
  return { items: nuevos.length, categorias: nuevasCats.length };
}

/** Categorías normalizadas y ordenadas por "orden". */
function leerCategorias_(ctx) {
  if (ctx.cache.categorias) return ctx.cache.categorias;
  const vistos = nuevoMapa_();
  const res = [];
  leerRegistros_(tabla_(ctx, 'CATEGORIAS')).forEach(function (r) {
    const id = textoLinea_(r.id);
    if (!id || vistos[id]) return;
    vistos[id] = true;
    const seccion = textoLinea_(r.seccion).toLowerCase();
    const icono = textoLinea_(r.icono).toLowerCase();
    const color = textoLinea_(r.color);
    res.push({
      _fila: r._fila, id: id, nombre: textoLinea_(r.nombre) || id,
      seccion: esSeccionValida_(seccion) ? seccion : 'equipo',
      icono: ICONOS_PERMITIDOS.indexOf(icono) >= 0 ? icono : 'folder',
      color: /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : COLOR_POR_DEFECTO,
      orden: r.orden, descripcion: textoLargo_(r.descripcion), activa: r.activa
    });
  });
  res.sort(function (a, b) { return (a.orden - b.orden) || compararTexto_(a.nombre, b.nombre); });
  ctx.cache.categorias = res;
  return res;
}

function publicarCategoria_(c) {
  return { id: c.id, nombre: c.nombre, seccion: c.seccion, icono: c.icono, color: c.color, orden: c.orden, descripcion: c.descripcion, activa: !!c.activa };
}

/** Usuarios registrados: {lista, porEmail}. */
function leerUsuarios_(ctx) {
  if (ctx.cache.usuarios) return ctx.cache.usuarios;
  const porEmail = nuevoMapa_();
  const lista = [];
  leerRegistros_(tabla_(ctx, 'USUARIOS')).forEach(function (r) {
    if (!r.email || porEmail[r.email]) return;
    r.nombre = textoLinea_(r.nombre);
    r.rol = sinAcentos_(textoLinea_(r.rol).toLowerCase()).indexOf('admin') === 0 ? 'ADMIN' : 'USUARIO';
    r.accesos = Math.max(0, Math.floor(r.accesos || 0));
    porEmail[r.email] = r;
    lista.push(r);
  });
  ctx.cache.usuarios = { lista: lista, porEmail: porEmail };
  return ctx.cache.usuarios;
}

function nombreUsuario_(ctx, email) {
  const reg = leerUsuarios_(ctx).porEmail[email];
  return (reg && reg.nombre) || nombreDesdeEmail_(email);
}

function contarPorAutor_(items) {
  const conteo = nuevoMapa_();
  items.forEach(function (it) { if (it.creadoPor) conteo[it.creadoPor] = (conteo[it.creadoPor] || 0) + 1; });
  return conteo;
}

function usuarioPanel_(ctx, u, conteo) {
  return {
    email: u.email,
    nombre: u.nombre || nombreDesdeEmail_(u.email),
    rol: rolDeEmail_(ctx, u.email) === 'admin' ? 'admin' : 'usuario',
    fechaAlta: aIso_(u.fechaAlta),
    ultimoAcceso: aIso_(u.ultimoAcceso),
    accesos: Number(u.accesos) || 0,
    esPropietario: !!ctx.owner && u.email === ctx.owner,
    totalEnlaces: conteo[u.email] || 0
  };
}

/**
 * Usuarios para el panel: registrados + propietario + admins iniciales + autores de enlaces
 * que aún no han abierto el directorio (p. ej. importados), para poder gestionar su rol.
 */
function listarUsuariosPanel_(ctx, activos) {
  const conteo = contarPorAutor_(activos);
  const snapshot = nuevoMapa_();
  activos.forEach(function (it) { if (it.creadoPor && !snapshot[it.creadoPor]) snapshot[it.creadoPor] = it.creadoPorNombre; });
  const vistos = nuevoMapa_();
  const lista = [];
  leerUsuarios_(ctx).lista.forEach(function (u) {
    vistos[u.email] = true;
    lista.push(usuarioPanel_(ctx, u, conteo));
  });
  [ctx.owner].concat((CONFIG.ADMINS_INICIALES || []).map(normalizarEmail_), Object.keys(conteo)).forEach(function (e) {
    if (!e || vistos[e] || !esEmailValido_(e)) return;
    vistos[e] = true;
    const nombre = snapshot[e] && snapshot[e] !== NOMBRE_EQUIPO_SEMILLA ? snapshot[e] : '';
    lista.push(usuarioPanel_(ctx, { email: e, nombre: nombre, fechaAlta: '', ultimoAcceso: '', accesos: 0 }, conteo));
  });
  lista.sort(function (a, b) {
    if (a.rol !== b.rol) return a.rol === 'admin' ? -1 : 1;
    return compararTexto_(a.nombre, b.nombre);
  });
  return lista;
}

function calcularEstadisticas_(ctx, activos, papelera, usuarios) {
  // Diccionarios sin prototipo: valores editados a mano ("__proto__", "constructor") no alteran Object.prototype.
  const porCategoria = nuevoMapa_();
  leerCategorias_(ctx).forEach(function (c) { porCategoria[c.id] = 0; });
  const porEstado = nuevoMapa_();
  ESTADOS_VALIDOS.forEach(function (e) { porEstado[e] = 0; });
  let totalVisitas = 0;
  const autores = nuevoMapa_();
  activos.forEach(function (it) {
    porCategoria[it.categoriaId] = (porCategoria[it.categoriaId] || 0) + 1;
    porEstado[it.estado] = (porEstado[it.estado] || 0) + 1;
    totalVisitas += Number(it.visitas) || 0;
    if (it.creadoPor) {
      if (!autores[it.creadoPor]) autores[it.creadoPor] = { email: it.creadoPor, nombre: '', snapshot: it.creadoPorNombre, total: 0 };
      autores[it.creadoPor].total++;
    }
  });
  const top = Object.keys(autores).map(function (k) {
    const a = autores[k];
    const reg = leerUsuarios_(ctx).porEmail[a.email];
    return { email: a.email, nombre: (reg && reg.nombre) || a.snapshot || nombreDesdeEmail_(a.email), total: a.total };
  }).sort(function (a, b) { return (b.total - a.total) || compararTexto_(a.nombre, b.nombre); }).slice(0, 5);
  return {
    totalItems: activos.length,
    totalEliminados: papelera.length,
    totalUsuarios: usuarios.length,
    totalAdmins: usuarios.filter(function (u) { return u.rol === 'admin'; }).length,
    totalVisitas: totalVisitas,
    porCategoria: porCategoria,
    porEstado: porEstado,
    topContribuidores: top
  };
}

/** Escribe un evento en BITACORA y recorta a CONFIG.MAX_BITACORA. Nunca rompe la operación principal. */
function registrarBitacora_(ctx, accion, itemId, itemNombre, detalle) {
  try {
    const tabla = tabla_(ctx, 'BITACORA');
    let texto = typeof detalle === 'string' ? detalle : JSON.stringify(aPlano_(detalle || {}));
    if (texto === '{}') texto = '';
    agregarRegistros_(tabla, [{
      fecha: new Date(), usuario: ctx.email || 'sistema', accion: accion,
      itemId: itemId || '', itemNombre: recortar_(itemNombre || '', 200), detalle: recortar_(texto, LIMITES.DETALLE_MAX)
    }], CRECIMIENTO_BITACORA);
    // Al superar el máximo se borran de una vez las más antiguas hasta (máximo − holgura): así el
    // borrado ocurre cada ~holgura eventos y no en cada escritura. Nunca se superan MAX_BITACORA filas.
    const maximo = Math.max(1, Math.floor(Number(CONFIG.MAX_BITACORA) || 5000));
    const holgura = Math.min(CRECIMIENTO_BITACORA, Math.floor(maximo / 10));
    const filas = ultimaFila_(tabla) - 1;
    if (filas > maximo) {
      const borrar = filas - (maximo - holgura);
      tabla.hoja.deleteRows(2, borrar); // borra las más antiguas en una sola llamada
      tabla.ultimaFila -= borrar;
    }
  } catch (e) {
    Logger.log('No se pudo registrar en la bitácora (' + accion + '): ' + (e && e.message ? e.message : e));
  }
}

/** Últimos N eventos, del más reciente al más antiguo. */
function leerBitacora_(ctx, limite) {
  const tabla = tabla_(ctx, 'BITACORA');
  const ultima = tabla.hoja.getLastRow();
  if (ultima < 2) return [];
  const n = Math.min(limite, ultima - 1);
  const inicio = ultima - n + 1;
  return convertirFilas_(tabla, tabla.hoja.getRange(inicio, 1, n, tabla.ancho).getValues(), inicio)
    .reverse()
    .map(function (r) {
      return { fecha: r.fecha, usuario: r.usuario, accion: textoLinea_(r.accion), itemId: r.itemId, itemNombre: r.itemNombre, detalle: r.detalle };
    });
}

// =============================================================================
// 9. VALIDACIÓN Y NORMALIZACIÓN
// =============================================================================

/** Valida y normaliza los campos editables. En edición, los campos ausentes conservan su valor. */
function validarItem_(ctx, entrada, existente) {
  const src = {};
  CAMPOS_EDITABLES.forEach(function (c) {
    src[c] = (entrada[c] === undefined && existente) ? existente[c] : entrada[c];
  });

  const nombre = textoLinea_(src.nombre);
  if (!nombre) throw errorUsuario_('El nombre de la herramienta es obligatorio.');
  if (nombre.length < LIMITES.NOMBRE_MIN || nombre.length > LIMITES.NOMBRE_MAX) {
    throw errorUsuario_('El nombre debe tener entre ' + LIMITES.NOMBRE_MIN + ' y ' + LIMITES.NOMBRE_MAX + ' caracteres.');
  }

  const categoriaId = textoLinea_(src.categoriaId);
  if (!categoriaId) throw errorUsuario_('Selecciona una categoría.');
  const cat = leerCategorias_(ctx).filter(function (c) { return c.id === categoriaId; })[0];
  const conservaCategoria = !!existente && existente.categoriaId === categoriaId;
  if (!cat || (!cat.activa && !conservaCategoria)) {
    throw errorUsuario_('La categoría seleccionada no existe o está inactiva.');
  }

  const url = textoLinea_(src.url);
  if (!url) {
    if (!existente || existente.url) throw errorUsuario_('La URL principal es obligatoria.');
  } else {
    validarUrl_(url, 'La URL principal');
  }
  const urlScript = textoLinea_(src.urlScript);
  if (urlScript) validarUrl_(urlScript, 'La URL del script / fuente');

  const descripcion = textoLargo_(src.descripcion);
  if (!descripcion) throw errorUsuario_('La descripción es obligatoria.');
  if (descripcion.length < LIMITES.DESC_MIN || descripcion.length > LIMITES.DESC_MAX) {
    throw errorUsuario_('La descripción debe tener entre ' + LIMITES.DESC_MIN + ' y ' + LIMITES.DESC_MAX + ' caracteres (actual: ' + descripcion.length + ').');
  }

  const iniciativa = textoLinea_(src.iniciativa);
  if (iniciativa.length > LIMITES.INICIATIVA_MAX) throw errorUsuario_('La iniciativa no puede exceder ' + LIMITES.INICIATIVA_MAX + ' caracteres.');
  const frecuencia = textoLinea_(src.frecuencia);
  if (frecuencia.length > LIMITES.FRECUENCIA_MAX) throw errorUsuario_('La frecuencia no puede exceder ' + LIMITES.FRECUENCIA_MAX + ' caracteres.');

  let estado = 'produccion';
  if (texto_(src.estado).trim() !== '') {
    estado = normalizarEstado_(src.estado);
    if (!estado) throw errorUsuario_('Estado no válido. Usa: Producción (Activo), En Desarrollo (MVP) o Histórico / Consulta.');
  }

  return {
    nombre: nombre, categoriaId: categoriaId, url: url, urlScript: urlScript, descripcion: descripcion,
    tags: normalizarTags_(src.tags), tecnologias: normalizarTecnologias_(src.tecnologias),
    iniciativa: iniciativa, estado: estado, fijado: aBooleano_(src.fijado), tiempoReal: aBooleano_(src.tiempoReal),
    frecuencia: frecuencia
  };
}

function validarUrl_(url, etiqueta) {
  if (url.length > LIMITES.URL_MAX) throw errorUsuario_(etiqueta + ' es demasiado larga (máx. ' + LIMITES.URL_MAX + ' caracteres).');
  if (!esUrlValida_(url)) throw errorUsuario_(etiqueta + ' no es válida: debe comenzar con http:// o https:// (ej. https://ejemplo.com).');
}

/** Solo http(s) con host válido; sin espacios ni caracteres peligrosos. */
function esUrlValida_(u) {
  if (!/^https?:\/\//i.test(u)) return false;
  if (/[\s<>"`\\\u0000-\u001F\u007F]/.test(u)) return false;
  const autoridad = u.replace(/^https?:\/\//i, '').split(/[\/?#]/)[0];
  const host = autoridad.replace(/^[^@]*@/, '').replace(/:\d{1,5}$/, '');
  if (!host) return false;
  if (/^\[[0-9a-f:.]+\]$/i.test(host)) return true;
  const etiqueta = '[a-z0-9\\u00a1-\\uffff](?:[a-z0-9\\u00a1-\\uffff_-]*[a-z0-9\\u00a1-\\uffff])?';
  return new RegExp('^' + etiqueta + '(?:\\.' + etiqueta + ')*\\.?$', 'i').test(host);
}

/** Clave para detectar duplicados: host en minúsculas, sin #hash ni "/" final. */
function normalizarUrl_(u) {
  let s = String(u || '').trim();
  if (!s) return '';
  s = s.replace(/#.*$/, '');
  const m = s.match(/^([a-z][a-z0-9+.\-]*:\/\/)([^\/?#]*)(.*)$/i);
  if (m) s = m[1].toLowerCase() + m[2].toLowerCase() + m[3];
  return s.replace(/\/+$/, '');
}

function verificarDuplicado_(items, url, excluirId, confirmado) {
  if (!url || confirmado) return;
  const clave = normalizarUrl_(url);
  const otro = items.filter(function (it) {
    return !it.eliminado && it.id !== excluirId && it.url && normalizarUrl_(it.url) === clave;
  })[0];
  if (otro) {
    throw errorUsuario_('Este enlace ya existe en el directorio: "' + otro.nombre + '"', { duplicado: { id: otro.id, nombre: otro.nombre } });
  }
}

/** Tags: sin espacios internos, prefijo "#", sin duplicados (insensible a mayúsculas), máx. 12 × 40. */
function normalizarTags_(entrada) {
  const vistos = nuevoMapa_();
  const res = [];
  partirLista_(entrada).forEach(function (crudo) {
    if (res.length >= LIMITES.TAGS_MAX) return;
    const base = quitarControl_(crudo).replace(/\s+/g, '').replace(/^#+/, '');
    if (!base) return;
    const tag = ('#' + base).slice(0, LIMITES.TAG_LEN);
    const k = tag.toLowerCase();
    if (vistos[k]) return;
    vistos[k] = true;
    res.push(tag);
  });
  return res;
}

/** Tecnologías: recortadas, sin duplicados, máx. 8 × 40. */
function normalizarTecnologias_(entrada) {
  const vistos = nuevoMapa_(); // sin prototipo: "constructor" o "toString" son tecnologías válidas
  const res = [];
  partirLista_(entrada).forEach(function (crudo) {
    if (res.length >= LIMITES.TEC_MAX) return;
    const t = textoLinea_(crudo).slice(0, LIMITES.TEC_LEN).trim();
    if (!t) return;
    const k = t.toLowerCase();
    if (vistos[k]) return;
    vistos[k] = true;
    res.push(t);
  });
  return res;
}

/** Acepta arreglo o texto separado por comas / punto y coma / saltos de línea. */
function partirLista_(entrada) {
  if (entrada === null || entrada === undefined || entrada === '') return [];
  const res = [];
  (Array.isArray(entrada) ? entrada : [entrada]).forEach(function (x) {
    if (x === null || x === undefined) return;
    texto_(x).split(/[,;\r\n]+/).forEach(function (p) {
      const t = p.trim();
      if (t) res.push(t);
    });
  });
  return res;
}

/** Estado canónico o '' si no se reconoce (acepta etiquetas como "Producción (Activo)"). */
function normalizarEstado_(v) {
  const s = sinAcentos_(texto_(v).trim().toLowerCase());
  if (!s) return '';
  if (ESTADOS_VALIDOS.indexOf(s) >= 0) return s;
  if (s.indexOf('prod') === 0 || s.indexOf('activo') === 0) return 'produccion';
  if (s.indexOf('desa') === 0 || s.indexOf('en desarrollo') === 0 || s === 'mvp') return 'desarrollo';
  if (s.indexOf('hist') === 0 || s.indexOf('consulta') === 0) return 'historico';
  return '';
}

/** Valida una categoría; en edición, los campos ausentes conservan su valor. */
function validarCategoria_(cat, existente, cats) {
  const tomar = function (c) { return (cat[c] === undefined && existente) ? existente[c] : cat[c]; };
  const nombre = textoLinea_(tomar('nombre'));
  if (nombre.length < LIMITES.CAT_NOMBRE_MIN || nombre.length > LIMITES.CAT_NOMBRE_MAX) {
    throw errorUsuario_('El nombre de la categoría debe tener entre ' + LIMITES.CAT_NOMBRE_MIN + ' y ' + LIMITES.CAT_NOMBRE_MAX + ' caracteres.');
  }
  const seccion = textoLinea_(tomar('seccion')).toLowerCase();
  if (!esSeccionValida_(seccion)) throw errorUsuario_('Sección no válida. Usa: ' + SECCIONES.map(function (s) { return s.id; }).join(' o ') + '.');
  const icono = textoLinea_(tomar('icono')).toLowerCase() || 'folder';
  if (ICONOS_PERMITIDOS.indexOf(icono) < 0) throw errorUsuario_('Icono no válido. Elige uno de la lista permitida.');
  const color = textoLinea_(tomar('color')) || COLOR_POR_DEFECTO;
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw errorUsuario_('El color debe tener el formato #RRGGBB.');
  const ordenCrudo = tomar('orden');
  if (ordenCrudo !== null && typeof ordenCrudo === 'object') throw errorUsuario_('El orden debe ser un número.');
  const ordenTexto = texto_(ordenCrudo).trim();
  let orden;
  if (ordenTexto === '') {
    orden = cats.reduce(function (m, c) { return Math.max(m, Number(c.orden) || 0); }, 0) + 10;
  } else {
    orden = Number(ordenTexto.replace(',', '.'));
    if (!isFinite(orden)) throw errorUsuario_('El orden debe ser un número.');
  }
  const descripcion = textoLargo_(tomar('descripcion'));
  if (descripcion.length > LIMITES.CAT_DESC_MAX) throw errorUsuario_('La descripción de la categoría no puede exceder ' + LIMITES.CAT_DESC_MAX + ' caracteres.');
  const activaCruda = tomar('activa');
  const activa = (activaCruda === undefined || activaCruda === null || activaCruda === '') ? true : aBooleano_(activaCruda);
  return { nombre: nombre, seccion: seccion, icono: icono, color: color.toUpperCase(), orden: orden, descripcion: descripcion, activa: activa };
}

function esSeccionValida_(id) {
  return SECCIONES.some(function (s) { return s.id === id; });
}

/**
 * Evita la suplantación con el nombre visible: no puede contener el del equipo semilla ni repetir
 * el de otra persona (comparación sin mayúsculas, acentos ni signos). "Otra persona" = filas de
 * USUARIOS y autores de enlaces que aún no tienen fila (p. ej. importados), con el nombre que muestran.
 */
function validarNombrePerfil_(nombre, email, usuarios, items) {
  const clave = claveNombre_(nombre);
  if (!clave) throw errorUsuario_('El nombre debe incluir letras o números.');
  if (clave.indexOf(claveNombre_(NOMBRE_EQUIPO_SEMILLA)) >= 0) {
    throw errorUsuario_('El nombre "' + NOMBRE_EQUIPO_SEMILLA + '" está reservado para los enlaces semilla del directorio.');
  }
  const coincide = function (correo, visible) { return correo !== email && claveNombre_(visible) === clave; };
  const otro = usuarios.lista.some(function (u) { return coincide(u.email, u.nombre || nombreDesdeEmail_(u.email)); }) ||
    (items || []).some(function (it) {
      if (!it.creadoPor || usuarios.porEmail[it.creadoPor]) return false;
      const visible = it.creadoPorNombre && it.creadoPorNombre !== NOMBRE_EQUIPO_SEMILLA ? it.creadoPorNombre : nombreDesdeEmail_(it.creadoPor);
      return coincide(it.creadoPor, visible);
    });
  if (otro) throw errorUsuario_('Ese nombre ya lo usa otra persona del directorio. Agrega tu segundo apellido o tu área para distinguirte.');
}

/** "Équipo  Space-1.0" → "equipospace10" (letras y números de cualquier alfabeto, en minúsculas). */
function claveNombre_(s) {
  return sinAcentos_(texto_(s).toLowerCase()).replace(/[^\p{L}\p{N}]/gu, '');
}

/** Autor y fecha de creación para importación: se conservan si vienen y son válidos. */
function autorImportado_(ctx, entrada, existente, yo, ahora) {
  const correo = normalizarEmail_(texto_(entrada.creadoPor));
  const fecha = aIso_(entrada.fechaCreacion);
  const ms = fecha ? Date.parse(fecha) : NaN;
  const fechaValida = isFinite(ms) && ms > Date.UTC(2000, 0, 1) && ms <= Date.now() + 86400000;
  let creadoPor;
  let creadoPorNombre;
  if (esEmailValido_(correo)) {
    creadoPor = correo;
    creadoPorNombre = recortar_(textoLinea_(entrada.creadoPorNombre), 80) || nombreUsuario_(ctx, correo);
  } else if (existente) {
    creadoPor = existente.creadoPor;
    creadoPorNombre = existente.creadoPorNombre;
  } else {
    creadoPor = yo.email;
    creadoPorNombre = yo.nombre;
  }
  return {
    creadoPor: creadoPor,
    creadoPorNombre: creadoPorNombre,
    fechaCreacion: fechaValida ? fecha : (existente && existente.fechaCreacion ? existente.fechaCreacion : ahora)
  };
}

/** Lista de campos que cambiaron entre dos versiones. */
function camposCambiados_(antes, despues, campos) {
  return (campos || CAMPOS_EDITABLES).filter(function (c) {
    return JSON.stringify(antes[c]) !== JSON.stringify(despues[c]);
  });
}

// =============================================================================
// 10. UTILIDADES (texto, fechas, booleanos, ids)
// =============================================================================

function esObjeto_(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function esFecha_(v) {
  return Object.prototype.toString.call(v) === '[object Date]';
}

function zona_() {
  try { return Session.getScriptTimeZone() || 'America/Mexico_City'; } catch (e) { return 'America/Mexico_City'; }
}

/**
 * Texto leído de una celda o recibido del cliente (tolerante); quita el apóstrofo de protección
 * contra fórmulas. Objetos y arreglos (salvo Date) → '': nunca se llama String() sobre ellos
 * ({toString:1} lanzaría y {a:1} se guardaría como "[object Object]").
 */
function texto_(v) {
  if (v === null || v === undefined) return '';
  let s;
  if (typeof v === 'string') s = v;
  else if (esFecha_(v)) {
    if (isNaN(v.getTime())) return '';
    try { s = Utilities.formatDate(v, zona_(), 'yyyy-MM-dd HH:mm'); } catch (e) { s = v.toISOString(); }
  } else if (typeof v === 'object' || typeof v === 'function') return '';
  else s = String(v);
  return /^'[=+\-@]/.test(s) ? s.slice(1) : s;
}

function quitarControl_(s) {
  return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
}

/** Texto de una sola línea, espacios colapsados. */
function textoLinea_(v) {
  return quitarControl_(texto_(v).replace(/[\r\n\t]+/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Texto multilínea (descripciones). */
function textoLargo_(v) {
  return quitarControl_(texto_(v).replace(/\r\n?/g, '\n')).trim();
}

/** Protección contra inyección de fórmulas al escribir en la hoja. */
function protegerTexto_(s) {
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function normalizarEmail_(v) {
  return (typeof v === 'string' ? v : texto_(v)).trim().toLowerCase();
}

function esEmailValido_(s) {
  return typeof s === 'string' && s.length <= 254 && /^[^\s@<>()",;:\\]+@[^\s@<>()",;:\\]+\.[a-z]{2,}$/i.test(s);
}

/** "juan.perez_lopez@x.com" → "Juan Perez Lopez". */
function nombreDesdeEmail_(email) {
  const local = String(email || '').split('@')[0];
  const palabras = local.split(/[._\-+]+/).filter(String);
  if (!palabras.length) return String(email || '');
  return palabras.map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase(); }).join(' ');
}

function sinAcentos_(s) {
  try { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { return String(s); }
}

function claveEncabezado_(h) {
  return sinAcentos_(String(h === null || h === undefined ? '' : h).toLowerCase()).replace(/[^a-z0-9]/g, '');
}

function slug_(s) {
  const base = sinAcentos_(String(s || '').toLowerCase()).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
  return base || 'categoria';
}

function slugUnico_(base, cats) {
  const usados = nuevoMapa_();
  cats.forEach(function (c) { usados[c.id] = true; });
  // Nombres de Object.prototype ("constructor") se tratan como usados: el cliente indexa por id.
  const ocupado = function (s) { return !!usados[s] || s in Object.prototype; };
  if (!ocupado(base)) return base;
  let n = 2;
  while (ocupado(base + '-' + n)) n++;
  return base + '-' + n;
}

/** Diccionario sin prototipo: las claves externas (ids, correos) no chocan con miembros heredados. */
function nuevoMapa_() {
  return Object.create(null);
}

/** Id externo aceptable: caracteres seguros y que no sea un miembro de Object.prototype. */
function esIdSeguro_(id) {
  return /^[A-Za-z0-9_.:\-]{1,80}$/.test(id) && !(id in Object.prototype);
}

function nuevoId_() {
  return 'lnk_' + Utilities.getUuid();
}

function recortar_(s, n) {
  s = typeof s === 'string' ? s : texto_(s);
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function compararTexto_(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'es');
}

function aBooleano_(v) {
  if (v === true) return true;
  if (v === false || v === null || v === undefined) return false;
  if (typeof v === 'number') return v === 1;
  if (typeof v === 'object' || typeof v === 'function') return false; // nunca String() sobre objetos
  const s = sinAcentos_(String(v).trim().toLowerCase());
  return ['true', 'verdadero', 'si', '1', 'x', 'yes', 'y', 'on'].indexOf(s) >= 0;
}

function aNumero_(v, porDefecto) {
  if (typeof v === 'number') return isFinite(v) ? v : porDefecto;
  if (v === null || v === undefined || v === '' || typeof v === 'boolean' || typeof v === 'object') return porDefecto;
  const n = parseFloat(String(v).trim().replace(',', '.'));
  return isFinite(n) ? n : porDefecto;
}

/** Fecha (Date, serial de Sheets o texto) → ISO 8601; inválida → ''. */
function aIso_(v) {
  const d = aFecha_(v);
  return d ? d.toISOString() : '';
}

/** Fecha tolerante → Date válido o null. */
function aFecha_(v) {
  if (v === null || v === undefined || v === '') return null;
  if (esFecha_(v)) return isNaN(v.getTime()) ? null : new Date(v.getTime());
  if (typeof v === 'number') {
    if (!isFinite(v) || v <= 0) return null;
    return new Date(Math.round((v - 25569) * 86400000)); // serial de Sheets (época 1899-12-30)
  }
  if (typeof v !== 'string') return null;
  const s = v.trim();
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?\s*(Z|[+-]\d{2}:?\d{2})?$/i);
  if (m) {
    if (m[7]) {
      const ms = Date.parse(s.replace(' ', 'T'));
      return isFinite(ms) ? new Date(ms) : null;
    }
    return fechaLocalValida_(+m[1], +m[2], +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
  }
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) return fechaLocalValida_(+m[3], +m[2], +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)); // dd/mm/aaaa (es-MX)
  const ms = Date.parse(s);
  return isFinite(ms) ? new Date(ms) : null;
}

function fechaLocalValida_(a, mes, dia, h, min, seg) {
  const d = new Date(a, mes - 1, dia, h, min, seg);
  if (isNaN(d.getTime()) || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  return d;
}

/** Copia profunda serializable: Date → ISO, sin undefined/funciones/campos internos "_". */
function aPlano_(v) {
  if (v === null || v === undefined) return null;
  if (esFecha_(v)) return isNaN(v.getTime()) ? '' : v.toISOString();
  if (Array.isArray(v)) return v.map(aPlano_);
  const tipo = typeof v;
  if (tipo === 'number') return isFinite(v) ? v : 0;
  if (tipo === 'string' || tipo === 'boolean') return v;
  if (tipo === 'object') {
    const o = {};
    Object.keys(v).forEach(function (k) {
      if (k.charAt(0) === '_' || v[k] === undefined || typeof v[k] === 'function') return;
      o[k] = aPlano_(v[k]);
    });
    return o;
  }
  return null;
}

function urlApp_() {
  try { return ScriptApp.getService().getUrl() || ''; } catch (e) { return ''; }
}

/**
 * Clave de caché "visita ya contada" del visitante actual para un enlace. El visitante se identifica
 * por correo, o por la clave temporal anónima de Session si no hay correo; sin ninguna, todos los
 * anónimos comparten una marca (máx. una visita anónima por enlace y ventana). null = sin caché.
 */
function marcaVisita_(ctx, id) {
  let quien = ctx.email;
  if (!quien) {
    try { quien = Session.getTemporaryActiveUserKey() ? 'k:' + Session.getTemporaryActiveUserKey() : ''; } catch (e) { quien = ''; }
  }
  try {
    const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, (quien || 'anonimo') + '|' + id, Utilities.Charset.UTF_8);
    return 'vis:' + Utilities.base64EncodeWebSafe(bytes);
  } catch (e) {
    return null;
  }
}

/** CacheService es de mejor esfuerzo: cualquier falla equivale a "sin marca" y nunca rompe la operación. */
function cacheLeer_(clave) {
  try { return CacheService.getScriptCache().get(clave); } catch (e) { return null; }
}

function cacheGuardar_(clave, segundos) {
  try { CacheService.getScriptCache().put(clave, '1', segundos); } catch (e) { /* sin efecto */ }
}
