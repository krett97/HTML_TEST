// Pruebas de punta a punta: el juego real en Chromium (Playwright). Uso: npm run e2e (o SOLO=niveles
// node tests/e2e/flujos.cjs para uno solo, sobre lo ya construido)
// (levanta `vite preview` en el puerto 4174 si no está corriendo). Sale con código 1 si algo falla.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const URL = 'http://localhost:4174/';
const results = [];

const reachable = () => new Promise((resolve) => http.get(URL, (res) => { res.resume(); resolve(true); }).on('error', () => resolve(false)));

async function server() {
  if (await reachable()) return null;
  const proc = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { cwd: path.resolve(__dirname, '../..'), stdio: 'ignore' });
  for (let i = 0; i < 40 && !(await reachable()); i++) await new Promise((r) => setTimeout(r, 250));
  return proc;
}

function check(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function fresh(browser, opts = {}) {
  const { init, ...ctx } = opts;
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-MX', ...ctx });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  if (init) await context.addInitScript(init);
  await page.goto(opts.url ?? URL);
  await page.waitForTimeout(1200);
  page.tap = async (x = 0.5, y = 0.45) => { const box = await page.getByTestId('campo').boundingBox(); await page.mouse.click(box.x + box.width * x, box.y + box.height * y); };
  page.oro = async (n) => { await page.getByTestId('abrir-ajustes').click(); await page.getByTestId(`oro-${n}`).click(); await page.mouse.click(4, 4); await page.waitForTimeout(150); };
  page.comprar = async (id, veces = 1) => {
    const seccion = await page.evaluate((id) => ({ danio: 'jugador', radio: 'jugador', slimes: 'jugador', cadencia: 'jugador', botin: 'jugador', tiempo: 'jugador', oro: 'jugador', inactivo: 'jugador', autoapuntar: 'jugador', mago: 'mago', arqueros: 'arqueros', multiflecha: 'arqueros', poder: 'reliquias', critico: 'reliquias', carcaj: 'reliquias', albanil: 'reliquias' })[id], id);
    await page.getByTestId(`seccion-${seccion}`).click();
    await page.getByTestId(`talento-${id}`).click();
    for (let i = 0; i < veces; i++) await page.getByTestId('comprar').click();
  };
  return page;
}

async function flow(name, browser, fn, opts) {
  // SOLO=texto npm run e2e: solo los flujos cuyo nombre lo contenga.
  if (process.env.SOLO && !name.includes(process.env.SOLO)) return;
  const page = await fresh(browser, opts);
  try {
    await fn(page);
    check(page.errors.length === 0, `errores en la consola: ${page.errors.join(' | ')}`);
    results.push([name, true]);
  } catch (e) {
    const where = (e.stack || '').split('\n').find((l) => l.includes('flujos.cjs'))?.match(/:(\d+):\d+\)?$/)?.[1];
    results.push([name, false, `${e.message.split('\n')[0]}${where ? ` (línea ${where})` : ''}`]);
  } finally {
    await page.context().close();
  }
}

(async () => {
  const proc = await server();
  const browser = await chromium.launch();

  await flow('primera partida: se juega directo, se toca, se acaba el tiempo y se abre el árbol', browser, async (page) => {
    check(await page.getByTestId('reloj').count(), 'no empezó la partida');
    check(await page.getByTestId('pista').count(), 'no sale la pista de tocar');
    // Toca donde hay un slime (como lo haría alguien que juega).
    // Uno lejos del reloj y de la pista (si no, el toque cae sobre ellos).
    const blanco = await page.evaluate(() => { const r = window.juego.run; const e = r.enemies.find((x) => x.y / r.h > 0.3 && x.y / r.h < 0.75 && x.x > 30 && x.x < 330) ?? r.enemies[0]; return { x: e.x / 360, y: e.y / r.h }; });
    await page.tap(blanco.x, blanco.y);
    await page.waitForTimeout(300);
    check(!(await page.getByTestId('pista').count()), 'la pista no se fue al tocar');
    const cursor = await page.evaluate(() => window.juego.run.cursor);
    check(Math.abs(cursor.x - blanco.x * 360) < 3, `el círculo no fue a donde se tocó (${cursor.x})`);
    await page.waitForTimeout(2500);
    const reventados = await page.evaluate(() => window.juego.run.reventados);
    check(reventados > 0, 'en 2.5 s no reventó ningún slime');
    await page.getByTestId('terminar').click();
    await page.waitForTimeout(500);
    check(await page.getByTestId('perdio').count(), 'no salió "se acabó el tiempo"');
    check((await page.getByTestId('fin-reventados').textContent()).trim() === `${reventados}/15`, 'reventados no cuadra');
    check(await page.getByTestId('reintentar').count() && !(await page.getByTestId('anterior').count()), 'en el nivel 1 debe ofrecer reintentar y no el anterior');
    await page.getByTestId('mejorar').click();
    check(await page.getByTestId('arbol').count(), 'no abrió el árbol');
    check(await page.getByTestId('talento-danio').count(), 'no se ve Daño');
    check(!(await page.getByTestId('talento-radio').count()), 'Área se ve antes de tiempo');
    await page.getByTestId('seccion-mago').click();
    check(await page.getByTestId('talento-mago').count(), 'no se ve el mago (con candado)');
  });

  await flow('árbol: comprar abre lo siguiente y la partida usa lo comprado', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(100);
    await page.comprar('danio', 2);
    check((await page.getByTestId('efecto').textContent()).includes('3 → 4'), 'el efecto de Daño no dice 3 → 4');
    check(await page.getByTestId('talento-radio').count(), 'no se abrió Área');
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(300);
    const danio = await page.evaluate(() => window.juego.run.stats.danio);
    check(danio === 3, `la partida no usa el daño comprado (${danio})`);
    check((await page.getByTestId('reloj').textContent()).includes('00:2'), 'el reloj no arrancó en 20 s');

  });

  await flow('tres secciones: mago con explosiones cuadradas y arqueros con flechas', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(1000000);
    await page.comprar('danio', 3);
    await page.comprar('cadencia', 3);
    await page.comprar('mago');
    await page.comprar('arqueros');
    await page.comprar('multiflecha');
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(400);
    const stats = await page.evaluate(() => window.juego.run.stats);
    check(stats.mago.activo, 'el mago no está en la partida');
    check(stats.arqueros.cantidad === 1 && stats.arqueros.objetivos === 2, 'arqueros mal configurados');
    let flechas = 0;
    let magia = 0;
    await page.evaluate(() => { window.__magia = 0; window.juego.onEvents((evs) => { for (const e of evs) if (e.type === 'impact' && e.fuente === 'mago' && e.forma.tipo === 'rect') window.__magia++; }); });
    for (let i = 0; i < 30; i++) {
      flechas = Math.max(flechas, await page.evaluate(() => window.juego.run.arrows.length));
      await page.waitForTimeout(100);
    }
    magia = await page.evaluate(() => window.__magia);
    check(flechas > 0, 'los arqueros no tiraron flechas');
    check(magia > 0, 'el mago no reventó ningún cuadrado');
  });

  await flow('niveles: ganar abre el siguiente; perder ofrece reintentar o el anterior para juntar oro', browser, async (page) => {
    check((await page.getByTestId('nivel-partida').textContent()).includes('Nivel 1'), 'no dice Nivel 1');
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(1000000);
    for (const [id, n] of [['danio', 5], ['radio', 3], ['cadencia', 4], ['slimes', 3], ['tiempo', 3], ['arqueros', 1], ['multiflecha', 2]]) await page.comprar(id, n);
    await page.getByTestId('jugar').click();
    // Hasta 60 s (en una máquina cargada el reloj del nivel puede ir por delante de los toques).
    for (let i = 0; i < 120 && !(await page.getByTestId('fin').count()); i++) {
      // Toca donde haya un slime, como alguien que juega.
      const b = await page.evaluate(() => { const r = window.juego.run; const e = r && r.enemies[0]; return e ? { x: e.x / 360, y: e.y / r.h } : null; });
      if (b) await page.tap(b.x, b.y);
      await page.waitForTimeout(500);
    }
    check(await page.getByTestId('gano').count(), 'no ganó el nivel 1 con todo comprado');
    check(Number((await page.getByTestId('fin-premio').textContent()).replace(/\D/g, '')) > 0, 'sin premio');
    await page.getByTestId('siguiente').click();
    await page.waitForTimeout(300);
    check((await page.getByTestId('nivel-partida').textContent()).includes('Nivel 2'), 'no pasó al nivel 2');
    await page.getByTestId('terminar').click();
    await page.waitForTimeout(300);
    check(await page.getByTestId('perdio').count(), 'terminar antes de tiempo debe perder');
    await page.getByTestId('anterior').click();
    await page.waitForTimeout(300);
    check((await page.getByTestId('nivel-partida').textContent()).includes('Nivel 1'), 'el anterior no es el nivel 1');
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    // Con el árbol abierto, el selector de nivel se esconde (más lugar); al cerrarlo vuelve.
    check(!(await page.getByTestId('nivel-mas').isVisible()), 'el selector de nivel se ve con el árbol abierto');
    await page.getByTestId('cerrar-arbol').click();
    check((await page.getByTestId('nivel-actual').textContent()).includes('Nivel 1'), 'la pantalla principal no recuerda el nivel elegido');
    await page.getByTestId('nivel-mas').click();
    check((await page.getByTestId('nivel-actual').textContent()).includes('Nivel 2'), 'no deja volver al nivel 2');
    check(await page.getByTestId('nivel-mas').isDisabled(), 'deja ir más allá del nivel abierto');
  });

  await flow('oro mientras no juegas: se abre en el nivel 3 y se cobra al volver', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    check(!(await page.getByTestId('ritmo-inactivo').count()), 'el oro inactivo se ve antes del nivel 3');
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 2; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check(await page.getByTestId('ritmo-inactivo').count(), 'no se ve el oro por minuto en el nivel 3');
    const antes = await page.evaluate(() => window.juego.meta.oro);
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('simular-hora').click();
    await page.waitForTimeout(300);
    check(await page.getByTestId('bienvenida').count(), 'no salió "Mientras no estabas"');
    check((await page.getByTestId('tiempo-fuera').textContent()).includes('1 h'), 'no dice 1 h fuera');
    const oro = await page.evaluate(() => window.juego.view && 0);
    void oro;
    await page.getByTestId('cobrar').click();
    await page.waitForTimeout(200);
    check(!(await page.getByTestId('bienvenida').count()), 'la ventana no se cerró');
    const despues = await page.evaluate(() => window.juego.meta.oro);
    check(despues > antes, `no se cobró el oro (${antes} → ${despues})`);
    // Los talentos: Oro inactivo sale de Ganancia de oro.
    await page.oro(1000000);
    await page.comprar('danio', 1);
    await page.comprar('slimes', 2);
    await page.comprar('oro', 1);
    await page.getByTestId('talento-inactivo').click();
    await page.getByTestId('comprar').click();
    check((await page.getByTestId('detalle').textContent()).includes('1/5'), 'no se compró Oro inactivo');
    check(await page.getByTestId('talento-bolsa').count(), 'no apareció Bolsa grande');
  });

  await flow('anuncio de oro: desde el nivel 3, da unos minutos de oro, luego espera; al volver, ×2 con anuncio', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('cerrar-arbol').click();
    check(!(await page.getByTestId('anuncio-oro').count()), 'el anuncio sale antes del nivel 3');
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 2; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    await page.waitForTimeout(300);
    check(await page.getByTestId('anuncio-oro').isEnabled(), 'no sale el botón del anuncio en el nivel 3');
    const premio = await page.evaluate(() => { let v; window.juego.view.subscribe((x) => (v = x))(); return v.anuncio.oro; });
    // Cerrarlo antes de tiempo no da nada (y se puede volver a intentar).
    const antes = await page.evaluate(() => window.juego.meta.oro);
    await page.getByTestId('anuncio-oro').click();
    check(await page.getByTestId('anuncio-prueba').count(), 'no salió el anuncio');
    await page.getByTestId('cerrar-anuncio').click();
    await page.waitForTimeout(200);
    check((await page.evaluate(() => window.juego.meta.oro)) === antes, 'cerrar el anuncio antes de tiempo dio oro');
    check(await page.getByTestId('anuncio-oro').isEnabled(), 'tras cerrarlo antes de tiempo ya no se puede ver');
    // Visto completo: da el oro, sale "+N de oro" y empieza la espera.
    await page.getByTestId('anuncio-oro').click();
    await page.waitForTimeout(3300);
    await page.getByTestId('cerrar-anuncio').click();
    await page.waitForTimeout(300);
    const despues = await page.evaluate(() => window.juego.meta.oro);
    check(despues - antes >= premio, `el anuncio no dio su oro (${antes} → ${despues}, premio ${premio})`);
    check(await page.getByTestId('anuncio-ganado').count(), 'no sale "+N de oro"');
    check(await page.getByTestId('anuncio-espera').count() && !(await page.getByTestId('anuncio-oro').isEnabled()), 'no empezó la espera para el siguiente');
    check((await page.getByTestId('anuncio-oro').textContent()).includes(`${5} hoy`), 'no cuenta los que quedan hoy');
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('anuncios-recargar').click();
    await page.mouse.click(4, 4);
    await page.waitForTimeout(300);
    check(await page.getByTestId('anuncio-oro').isEnabled(), '"Anuncios: sin espera" no quita la espera');
    // Al volver: cobrar el doble viendo un anuncio.
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('simular-hora').click();
    await page.waitForTimeout(300);
    const inactivo = Number((await page.getByTestId('oro-inactivo').textContent()).replace(/\D/g, ''));
    const sinCobrar = await page.evaluate(() => window.juego.meta.oro);
    await page.getByTestId('cobrar-doble').click();
    await page.waitForTimeout(3300);
    await page.getByTestId('cerrar-anuncio').click();
    await page.waitForTimeout(300);
    check(!(await page.getByTestId('bienvenida').count()), 'la ventana no se cerró tras el anuncio');
    const cobrado = (await page.evaluate(() => window.juego.meta.oro)) - sinCobrar;
    check(inactivo > 0 && cobrado >= 2 * inactivo - 2, `no cobró el doble (${inactivo} → ${cobrado})`);
  });

  await flow('glosario: tipos de daño y enemigos (el azul, oculto hasta abrirlo)', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-glosario').click();
    for (const tipo of ['fisico', 'fuego', 'hielo', 'energia', 'muerte', 'luz']) check(await page.getByTestId(`tipo-${tipo}`).count(), `falta el tipo ${tipo}`);
    const verde = await page.getByTestId('enemigo-verde').textContent();
    check(verde.includes('Slime verde') && verde.includes('No ataca') && verde.includes('×1.5'), `el verde no muestra sus datos: ${verde}`);
    check((await page.getByTestId('enemigo-azul').textContent()).includes('???'), 'el azul se ve antes de abrirlo');
    await page.mouse.click(4, 4);
    // Los azules salen desde el nivel 4.
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 3; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    await page.getByTestId('abrir-glosario').click();
    const azul = await page.getByTestId('enemigo-azul').textContent();
    check(azul.includes('Slime azul') && azul.includes('×0.5'), `el azul no se reveló: ${azul}`);
  });

  await flow('slime rojo: desde el nivel 7 le tira piedras a la muralla; si cae, los aliados no atacan', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(1000000);
    await page.comprar('danio', 3);
    await page.comprar('arqueros', 1);
    await page.getByTestId('abrir-ajustes').click();
    // Nivel 9: los rojos son el 10 % de 79 (en el 5 son el 6 % de 47 y a veces, por azar, no sale ninguno).
    for (let i = 0; i < 8; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check((await page.getByTestId('nivel-actual').textContent()).includes('Nivel 9'), 'no está en el nivel 9');
    await page.getByTestId('jugar').click();
    // Lejos de todo: nadie revienta a los rojos y la muralla recibe piedras.
    // (Desde 0.15.0 las piedras pegan menos al principio: con 1 de vida cae con el primer golpe.)
    await page.evaluate(() => { window.juego.run.cursor = { x: -999, y: -999 }; window.juego.run.muro.vida = 1; });
    let rojos = 0;
    for (let i = 0; i < 60 && !(await page.getByTestId('muralla-caida').count()); i++) {
      rojos = Math.max(rojos, await page.evaluate(() => window.juego.run.enemies.filter((e) => e.kind === 'rojo').length));
      await page.waitForTimeout(250);
    }
    check(rojos > 0, 'no salieron slimes rojos en el nivel 9');
    check(await page.getByTestId('muralla-caida').count(), 'la muralla no cayó o no se avisa');
    const flechas = await page.evaluate(() => window.juego.run.arrows.length);
    await page.waitForTimeout(1600);
    const despues = await page.evaluate(() => window.juego.run.arrows.length);
    check(despues === 0 || despues < flechas, 'los arqueros siguen tirando con la muralla caída');
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-glosario').click();
    const ficha = await page.getByTestId('enemigo-rojo').textContent();
    check(ficha.includes('Slime rojo') && ficha.includes('a la muralla'), `el glosario no muestra al rojo: ${ficha}`);
  });

  await flow('jefe del nivel 10: el Rey Slime con su barra de vida, se le vence y sale en el glosario', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 9; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check((await page.getByTestId('nivel-actual').textContent()).includes('Nivel 10'), 'no está en el nivel 10');
    check((await page.getByTestId('nivel-actual').textContent()).includes('JEFE'), 'el selector no marca el jefe');
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(400);
    check(await page.getByTestId('presenta-jefe').count(), 'no sale el letrero del jefe');
    check((await page.getByTestId('vida-jefe').textContent()).includes('Rey Slime'), 'no está la barra del jefe');
    check((await page.getByTestId('reloj').textContent()).includes('00:3'), 'el nivel de jefe no da 30 s');
    // Lo dejamos casi sin vida y le tocamos encima.
    await page.evaluate(() => { const r = window.juego.run; const b = r.enemies.find((e) => e.kind === 'rey'); b.vida = 0.5; });
    for (let i = 0; i < 20 && !(await page.getByTestId('fin').count()); i++) {
      const p = await page.evaluate(() => { const r = window.juego.run; const b = r.enemies.find((e) => e.kind === 'rey'); return b ? { x: b.x / 360, y: b.y / r.h } : null; });
      if (p) await page.tap(p.x, p.y);
      await page.waitForTimeout(250);
    }
    check(await page.getByTestId('gano').count(), 'no se venció al jefe');
    check((await page.getByTestId('gano').textContent()).includes('Rey Slime'), 'el fin no dice que venciste al Rey Slime');
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-glosario').click();
    const ficha = await page.getByTestId('enemigo-rey').textContent();
    check(ficha.includes('Rey Slime') && ficha.includes('aturdido'), `el glosario no muestra al jefe: ${ficha}`);
  });

  await flow('segunda zona: campo de batalla con goblins y lobos; el Lobo Blanco en el nivel 20', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 10; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check((await page.getByTestId('nivel-actual').textContent()).includes('Campo de batalla'), 'el nivel 11 no dice Campo de batalla');
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(500);
    check((await page.getByTestId('nivel-partida').textContent()).includes('Campo de batalla'), 'la partida no dice Campo de batalla');
    const tipos = await page.evaluate(() => [...new Set(window.juego.run.enemies.map((e) => e.kind))]);
    check(tipos.every((k) => ['goblin', 'lobo'].includes(k)), `en el nivel 11 salieron: ${tipos.join(', ')}`);
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 9; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(500);
    check((await page.getByTestId('vida-jefe').textContent()).includes('Lobo Blanco'), 'el jefe del 20 no es el Lobo Blanco');
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-glosario').click();
    for (const k of ['goblin', 'lobo', 'orco', 'orcoArquero', 'loboBlanco']) check(!(await page.getByTestId(`enemigo-${k}`).textContent()).includes('???'), `el glosario esconde a ${k}`);
  });

  await flow('tercera zona: Pradera amarilla con arañas y lobos negros; esqueletos y bandidos después', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 20; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check((await page.getByTestId('nivel-actual').textContent()).includes('Pradera amarilla'), 'el nivel 21 no dice Pradera amarilla');
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(500);
    check((await page.getByTestId('nivel-partida').textContent()).includes('Pradera amarilla'), 'la partida no dice Pradera amarilla');
    const tipos = await page.evaluate(() => [...new Set(window.juego.run.enemies.map((e) => e.kind))]);
    check(tipos.every((k) => ['arana', 'loboNegro'].includes(k)), `en el nivel 21 salieron: ${tipos.join(', ')}`);
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 4; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    await page.getByTestId('abrir-glosario').click();
    for (const k of ['arana', 'esqueleto', 'loboNegro', 'bandido']) check(!(await page.getByTestId(`enemigo-${k}`).textContent()).includes('???'), `el glosario esconde a ${k}`);
  });

  await flow('Esqueleto Mago en el 30, Desierto del 31 al 40 y el Líder de los bandidos en el 40', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 29; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(500);
    check((await page.getByTestId('vida-jefe').textContent()).includes('Esqueleto Mago'), 'el jefe del 30 no es el Esqueleto Mago');
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check((await page.getByTestId('nivel-actual').textContent()).includes('Desierto'), 'el nivel 31 no dice Desierto');
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(500);
    const tipos = await page.evaluate(() => [...new Set(window.juego.run.enemies.map((e) => e.kind))]);
    check(tipos.every((k) => ['escorpion', 'bandidoDesierto'].includes(k)), `en el nivel 31 salieron: ${tipos.join(', ')}`);
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 9; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(500);
    check((await page.getByTestId('vida-jefe').textContent()).includes('Líder de los bandidos'), 'el jefe del 40 no es el Líder de los bandidos');
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-glosario').click();
    for (const k of ['escorpion', 'bandidoDesierto', 'minotauro', 'ciclope', 'esqueletoMago', 'liderBandido']) check(!(await page.getByTestId(`enemigo-${k}`).textContent()).includes('???'), `el glosario esconde a ${k}`);
  });

  await flow('Montaña de piedra del 41 al 50 y el Dragón de acero en el 50', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 40; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check((await page.getByTestId('nivel-actual').textContent()).includes('Montaña de piedra'), 'el nivel 41 no dice Montaña de piedra');
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(500);
    const tipos = await page.evaluate(() => [...new Set(window.juego.run.enemies.map((e) => e.kind))]);
    check(tipos.every((k) => ['guerreroHierro', 'golem'].includes(k)), `en el nivel 41 salieron: ${tipos.join(', ')}`);
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 9; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(500);
    check((await page.getByTestId('vida-jefe').textContent()).includes('Dragón de acero'), 'el jefe del 50 no es el Dragón de acero');
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-glosario').click();
    for (const k of ['guerreroHierro', 'golem', 'arqueroHierro', 'dragoncito', 'dragonAcero']) check(!(await page.getByTestId(`enemigo-${k}`).textContent()).includes('???'), `el glosario esconde a ${k}`);
    check(!(await page.getByTestId('enemigo-golemito').count()), 'la piedrita sale en el glosario');
  });

  await flow('Supervivencia (nivel 26) y Herrería: oleadas, Runas y mejoras que a veces fallan', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 24; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check(!(await page.getByTestId('abrir-supervivencia').count()), 'la Supervivencia se ve antes del nivel 26');
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check((await page.getByTestId('abrir-supervivencia').textContent()).includes('3/3'), 'no se ven 3/3 entradas');
    await page.getByTestId('abrir-supervivencia').click();
    await page.getByTestId('abrir-herreria').click();
    check(await page.getByTestId('herreria').count(), 'no abre la Herrería');
    check(await page.getByTestId('mejorar-baculo').isDisabled(), 'se puede mejorar sin Runas');
    await page.evaluate(() => window.juego.addRunas(100));
    await page.waitForTimeout(100);
    // La primera mejora siempre sale.
    await page.getByTestId('mejorar-baculo').click();
    check((await page.getByTestId('nivel-baculo').textContent()).includes('+1'), 'el báculo no subió a +1');
    check(await page.getByTestId('forja-exito').count(), 'no dice que salió');
    // Forzamos un fallo: la siguiente vez es más probable.
    const antes = await page.getByTestId('chance-baculo').textContent();
    await page.evaluate(() => { window.__random = Math.random; Math.random = () => 0.999; });
    await page.getByTestId('mejorar-baculo').click();
    await page.evaluate(() => { Math.random = window.__random; });
    check(await page.getByTestId('forja-fallo').count(), 'no dice que falló');
    check((await page.getByTestId('nivel-baculo').textContent()).includes('+1'), 'fallar cambió el nivel');
    const despues = await page.getByTestId('chance-baculo').textContent();
    check(despues !== antes && despues.includes('fallos'), `la probabilidad no subió tras fallar: ${antes} → ${despues}`);
    // Tres mejoras al mago cambian su aspecto.
    await page.evaluate(() => { window.__random = Math.random; Math.random = () => 0; });
    await page.getByTestId('mejorar-tunica').click();
    await page.getByTestId('mejorar-tunica').click();
    await page.evaluate(() => { Math.random = window.__random; });
    check((await page.getByTestId('vista-equipo').getAttribute('src')).includes('mago_1'), 'el mago no cambió de aspecto');
    await page.mouse.click(4, 4);
    await page.waitForTimeout(150);
    // Entrar a las oleadas.
    const runas = await page.evaluate(() => window.juego.meta.runas);
    await page.getByTestId('entrar-oleadas').click();
    await page.waitForTimeout(2500);
    check((await page.getByTestId('oleada-actual').textContent()).includes('Oleada'), 'no se ve la oleada');
    check(await page.getByTestId('bote-runas').count(), 'no se ven las Runas juntadas');
    // Salen arriba y bajan hacia la muralla.
    const pos = await page.evaluate(() => Object.fromEntries(window.juego.run.enemies.filter((e) => !e.elite).map((e) => [e.id, e.y])));
    check(Object.keys(pos).length > 0, 'no salió nadie en la oleada');
    await page.waitForTimeout(1500);
    const bajaron = await page.evaluate((pos) => window.juego.run.enemies.filter((e) => pos[e.id] !== undefined).map((e) => e.y > pos[e.id]), pos);
    check(bajaron.length > 0 && bajaron.every(Boolean), 'los de la oleada no bajan hacia la muralla');
    await page.waitForTimeout(4500);
    const bote = await page.evaluate(() => window.juego.run.oleadas.bote);
    await page.getByTestId('terminar').click();
    await page.waitForTimeout(300);
    check(await page.getByTestId('fin-oleadas').count(), 'no sale el resultado de la Supervivencia');
    check((await page.evaluate(() => window.juego.meta.runas)) === runas + bote, 'no se sumaron las Runas del bote');
    check((await page.evaluate(() => window.juego.meta.supervivencia.entradas)) === 2, 'no gastó una entrada');
    await page.getByTestId('mejorar').click();
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(300);
    await page.getByTestId('terminar').click();
    await page.waitForTimeout(300);
    check(!(await page.getByTestId('fin-oleadas').count()), 'un nivel normal muestra el resultado de la Supervivencia');
  });

  await flow('modo pruebas: "+10 min de juego" avanza la partida como si hubieras jugado', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('jugar-10-min').click();
    await page.waitForTimeout(300);
    const resumen = await page.getByTestId('resultado-simulado').textContent();
    check(/nivel 1 → \d+/.test(resumen), `el resumen no dice el avance: ${resumen}`);
    await page.mouse.click(4, 4);
    const nivel = Number((await page.getByTestId('nivel-actual').textContent()).match(/Nivel (\d+)/)[1]);
    check(nivel >= 8, `en 10 min simulados solo llegó al nivel ${nivel}`);
    await page.getByTestId('talento-danio').click();
    check(!/(^|\D)0\/100/.test(await page.getByTestId('detalle').textContent()), 'no compró nada en el árbol');
  });

  await flow('guardado: al recargar se queda el oro y el árbol, y se llega a la pantalla principal', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(100);
    await page.comprar('danio', 1);
    const oro = await page.getByTestId('oro-total').textContent();
    await page.reload();
    await page.waitForTimeout(1200);
    check(await page.getByTestId('principal').count(), 'al volver no se llega a la pantalla principal');
    check(!(await page.getByTestId('arbol').count()), 'al volver el árbol ya está abierto');
    check((await page.getByTestId('oro-total').textContent()) === oro, 'el oro no se guardó');
    await page.getByTestId('abrir-mejorar').click();
    await page.getByTestId('talento-danio').click();
    check((await page.getByTestId('detalle').textContent()).includes('1/100'), 'el nivel de Daño no se guardó');
  });

  await flow('reiniciar desde cero', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(100);
    await page.comprar('danio', 2);
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('reiniciar').click();
    await page.getByTestId('reiniciar').click();
    await page.waitForTimeout(300);
    check((await page.getByTestId('oro-total').textContent()).trim() === '0', 'quedó oro');
    check(!(await page.getByTestId('arbol').count()), 'tras reiniciar el árbol sigue abierto');
    await page.getByTestId('abrir-mejorar').click();
    await page.getByTestId('talento-danio').click();
    check(/(^|\D)0\/100/.test(await page.getByTestId('detalle').textContent()), 'quedó nivel de Daño');
    await page.reload();
    await page.waitForTimeout(1200);
    check(await page.getByTestId('reloj').count(), 'tras reiniciar no empieza jugando como nuevo');
  });

  await flow('misiones del nivel 11: diarias y permanentes dan gemas que compran Reliquias', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    check(!(await page.getByTestId('abrir-misiones').count()), 'las misiones se ven antes del nivel 11');
    check(!(await page.getByTestId('seccion-reliquias').count()), 'las Reliquias se ven antes del nivel 11');
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 14; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check(await page.getByTestId('abrir-misiones').count(), 'no sale el botón de misiones en el nivel 15');
    check((await page.getByTestId('gemas').textContent()).trim() === '0', 'no empieza con 0 gemas');
    await page.getByTestId('abrir-misiones').click();
    check(await page.getByTestId('misiones').count(), 'no abre la ventana de misiones');
    check((await page.locator('[data-testid^="mision-"]').count()) === 4, 'no hay 3 diarias más el bono');
    check(await page.getByTestId('cobrar-bono').isDisabled(), 'el bono se puede cobrar sin completar');
    await page.getByTestId('misiones-permanentes').click();
    check(!(await page.getByTestId('cobrar-nivel15').isDisabled()), '"Llega al nivel 15" no está lista');
    check(await page.getByTestId('cobrar-nivel20').isDisabled(), '"Llega al nivel 20" está lista sin llegar');
    await page.getByTestId('cobrar-nivel15').click();
    await page.waitForTimeout(150);
    check(!(await page.getByTestId('cobrar-nivel15').count()), 'se puede cobrar dos veces');
    check((await page.getByTestId('misiones').textContent()).includes('5'), 'no muestra las gemas');
    await page.mouse.click(4, 4);
    check((await page.getByTestId('gemas').textContent()).trim() === '5', 'no sumó 5 gemas');
    await page.getByTestId('seccion-reliquias').click();
    await page.getByTestId('talento-poder').click();
    await page.getByTestId('comprar').click();
    await page.waitForTimeout(150);
    check((await page.getByTestId('gemas').textContent()).trim() === '0', 'Poder ancestral no costó 5 gemas');
    check((await page.getByTestId('detalle').textContent()).includes('1/10'), 'Poder ancestral no subió');
    check(await page.getByTestId('oro-total').count(), 'falta el oro');
    // Modo pruebas: +10 gemas y otro día.
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('mas-gemas').click();
    const antes = await page.evaluate(() => window.juego.meta.misiones.diarias.join());
    let cambio = false;
    for (let i = 0; i < 5 && !cambio; i++) {
      await page.getByTestId('nuevo-dia').click();
      cambio = (await page.evaluate(() => window.juego.meta.misiones.diarias.join())) !== antes;
    }
    check(cambio, '"Nuevo día" no cambia las diarias');
    await page.mouse.click(4, 4);
    check((await page.getByTestId('gemas').textContent()).trim() === '10', 'no sumó las 10 gemas de prueba');
  });

  await flow('ranking del nivel 17 sin conexión: tu fila y tu nombre', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 15; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check(!(await page.getByTestId('abrir-ranking').count()), 'el ranking se ve antes del nivel 17');
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    await page.getByTestId('abrir-ranking').click();
    await page.waitForTimeout(300);
    check(await page.getByTestId('ranking-sin-conexion').count(), 'no avisa que no hay ranking en línea');
    check((await page.getByTestId('ranking-tuyo').textContent()).includes('17'), 'tu fila no dice nivel 17');
    await page.getByTestId('nombre-jugador').fill('  Kike  ');
    await page.getByTestId('guardar-nombre').click();
    await page.waitForTimeout(150);
    check((await page.getByTestId('ranking-tuyo').textContent()).includes('Kike'), 'tu fila no trae tu nombre');
    await page.reload();
    await page.waitForTimeout(1200);
    check((await page.evaluate(() => window.juego.meta.nombre)) === 'Kike', 'el nombre no se guardó');
  });

  await flow('ranking compartido (en Claude): tabla ordenada, tu fila se escribe y la basura no entra', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 17; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    await page.getByTestId('abrir-ranking').click();
    await page.waitForTimeout(400);
    check(!(await page.getByTestId('ranking-sin-conexion').count()), 'dice sin conexión teniendo base de datos');
    const filas = await page.$$eval('[data-testid^="ranking-"]', (els) => els.map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
    check(filas.length === 4, `deberían ser 4 filas (3 buenas y la tuya), hay ${filas.length}: ${filas.join(' | ')}`);
    check(filas[0].includes('Lupita') && filas[0].includes('Nivel 31'), `la primera no es Lupita: ${filas[0]}`);
    check(filas[1].includes('Beto') && filas[2].includes('Ana'), `el empate no va por reventados: ${filas.join(' | ')}`);
    check(!filas.some((f) => f.includes('Tramposo')), 'entró una fila con nivel imposible');
    check(filas[3].includes('Nivel 18') && filas[3].includes('4'), `tu fila no va cuarta con nivel 18: ${filas[3]}`);
    await page.getByTestId('nombre-jugador').fill('Kike');
    await page.getByTestId('guardar-nombre').click();
    await page.waitForTimeout(200);
    const mia = await page.evaluate(() => window.__ranking.get('u-yo'));
    check(mia && mia.nombre === 'Kike' && mia.nivel === 18, `no se escribió tu fila: ${JSON.stringify(mia)}`);
    check(await page.evaluate(() => [...window.__ranking.keys()].every((k) => k !== 'u-otro' || window.__ranking.get(k).nombre === 'Lupita')), 'se escribió la fila de otro');
  }, {
    init: () => {
      const filas = new Map([
        ['u-ana', { nombre: 'Ana', nivel: 22, reventados: 500 }],
        ['u-beto', { nombre: 'Beto', nivel: 22, reventados: 9000 }],
        ['u-otro', { nombre: 'Lupita', nivel: 31, reventados: 40000 }],
        ['u-trampa', { nombre: 'Tramposo', nivel: 1e12, reventados: 1 }],
      ]);
      window.__ranking = filas;
      const oyentes = [];
      const avisar = () => {
        const docs = [...filas.entries()].sort((a, b) => b[1].nivel - a[1].nivel).map(([id, d]) => ({ id, data: () => ({ ...d }) }));
        for (const fn of oyentes) fn({ docs, metadata: { fromCache: false } });
      };
      const consulta = { orderBy: () => consulta, limit: () => consulta, onSnapshot: (fn) => { oyentes.push(fn); setTimeout(avisar, 30); return () => {}; } };
      const db = { collection: () => consulta, doc: (ruta) => ({ set: async (data) => { filas.set(ruta.split('/')[1], data); setTimeout(avisar, 10); } }) };
      window.claude = { use: async (n) => (n === 'db' ? db : n === 'user' ? { id: async () => 'u-yo' } : null) };
    },
  });

  await flow('PvP del nivel 19: liga de 100, pelea con batalla, intentos, tienda y fin de semana', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 17; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check(!(await page.getByTestId('abrir-pvp').count()), 'el PvP se ve antes del nivel 19');
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    check((await page.getByTestId('abrir-pvp').textContent()).includes('5/5'), 'el botón no dice 5/5');
    await page.getByTestId('abrir-pvp').click();
    await page.waitForTimeout(300);
    check((await page.getByTestId('pvp-liga').textContent()).includes('Bronce'), 'no empieza en Bronce');
    check((await page.locator('[data-testid="pvp-rival"]').count()) === 99, 'no hay 99 rivales');
    check((await page.locator('[data-testid="pvp-tuyo"]').count()) === 1, 'no está tu fila');
    check(/\d/.test(await page.getByTestId('mi-poder').textContent()), 'no se ve tu poder');
    await page.locator('[data-testid^="pelear-"]').nth(50).click();
    check(await page.getByTestId('batalla').count(), 'no abre la batalla');
    await page.getByTestId('batalla-saltar').click();
    check((await page.getByTestId('pvp-gano').count()) + (await page.getByTestId('pvp-perdio').count()) === 1, 'no sale el resultado');
    await page.getByTestId('batalla-ok').click();
    check((await page.getByTestId('pvp-intentos').textContent()).includes('4/5'), 'no gastó un intento');
    const medallas = Number(await page.getByTestId('pvp-medallas').textContent());
    check(medallas === 1 || medallas === 3, `medallas raras: ${medallas}`);
    // Con medallas (modo pruebas), la tienda vende una pelea extra si no estás lleno.
    await page.mouse.click(4, 4);
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('mas-medallas').click();
    await page.mouse.click(4, 4);
    await page.getByTestId('abrir-pvp').click();
    await page.getByTestId('abrir-tienda-pvp').click();
    check(!(await page.getByTestId('comprar-intento').isDisabled()), 'no deja comprar pelea extra con 4/5');
    await page.getByTestId('comprar-intento').click();
    check(await page.getByTestId('comprar-intento').isDisabled(), 'deja comprar pelea extra con 5/5');
    check((await page.evaluate(() => window.juego.meta.pvp.intentos)) === 5, 'la pelea extra no sumó');
    await page.mouse.click(4, 4);
    await page.mouse.click(4, 4);
    // Modo pruebas: intentos llenos y cerrar la semana.
    await page.evaluate(() => { window.juego.meta.pvp.intentos = 1; });
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('pvp-recargar').click();
    await page.getByTestId('pvp-fin-semana').click();
    await page.mouse.click(4, 4);
    await page.getByTestId('abrir-pvp').click();
    await page.waitForTimeout(200);
    check(await page.getByTestId('pvp-resultado').count(), 'no sale cómo te fue la semana');
    check((await page.getByTestId('pvp-intentos').textContent()).includes('5/5'), 'no llenó los intentos');
    await page.getByTestId('pvp-ok').click();
    check(!(await page.getByTestId('pvp-resultado').count()), 'el resultado no se quita');
    await page.getByTestId('abrir-tienda-pvp').click();
    check(await page.getByTestId('comprar-intento').isDisabled(), 'deja comprar pelea extra con 5/5');
    const oro = await page.evaluate(() => window.juego.meta.oro);
    await page.getByTestId('comprar-oro').click();
    check((await page.evaluate(() => window.juego.meta.oro)) > oro, 'el cofre no dio oro');
    await page.getByTestId('comprar-estandarte').click();
    check((await page.evaluate(() => window.juego.meta.pvp.estandarte)) === 1, 'no subió el Estandarte');
  });

  await flow('pantalla principal: el campo a color con pocos enemigos; tocas y lanzas flechas; Mejorar abre el árbol; tus tropas juntan oro', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.waitForTimeout(300);
    check(await page.getByTestId('principal').count() && (await page.getByTestId('arbol').count()), '"Mejorar" del fin no abre el árbol en la pantalla principal');
    check((await page.getByTestId('abrir-mejorar').getAttribute('aria-pressed')) === 'true', 'el botón Mejorar no se ve apretado con el árbol abierto');
    await page.getByTestId('cerrar-arbol').click();
    await page.waitForTimeout(300);
    check(!(await page.getByTestId('arbol').count()), 'el árbol no se cerró');
    // Sin tropas también hay campo: pocos enemigos, y tu círculo descansa hasta que tocas.
    check(await page.evaluate(() => !!window.juego.run?.guardia), 'no hay guardia en la pantalla principal');
    check(!(await page.getByTestId('ritmo-guardia').count()), 'se ve el oro de las tropas sin tropas');
    check(await page.getByTestId('pista-guardia').count(), 'no sale la pista de tocar el campo');
    check(await page.evaluate(() => window.juego.run.cursor.x < 0), 'el círculo dispara sin tocar');
    check((await page.getByTestId('jugar').textContent()).includes('Jugar nivel'), 'el botón no dice "Jugar nivel"');
    // La muralla sube arriba de la barra de abajo (la cámara se levanta lo que tapa la barra).
    const barra = await page.getByTestId('barra-principal').boundingBox();
    check(barra.height > 80 && Math.abs((await page.evaluate(() => window.juego.abajo)) - barra.height) < 2, 'la escena no sabe cuánto tapa la barra de abajo');
    // Tocas el campo: el círculo va ahí y revienta a un slime quieto.
    const campo = await page.getByTestId('campo').boundingBox();
    const antes = await page.evaluate(() => window.juego.meta.oro);
    await page.mouse.click(campo.x + campo.width * 0.5, campo.y + campo.height * 0.35);
    await page.waitForTimeout(200);
    const cursor = await page.evaluate(() => ({ ...window.juego.run.cursor }));
    check(cursor.x > 150 && cursor.x < 210, `el círculo no fue a donde tocaste (${cursor.x})`);
    await page.evaluate(() => { const r = window.juego.run; for (const e of r.enemies) { e.x = r.cursor.x; e.y = r.cursor.y; e.vx = 0; e.vy = 0; e.giro = 99; e.vida = Math.min(e.vida, 1); } });
    await page.waitForTimeout(1500);
    check(!(await page.getByTestId('pista-guardia').count()), 'la pista no se fue al tocar');
    check((await page.evaluate(() => window.juego.meta.oro)) > antes, 'tus flechas en la pantalla principal no dieron oro');
    // Con oro, Mejorar tiene su punto rojo; comprar el primer arquero y tus tropas pelean solas.
    await page.oro(10000);
    check(await page.getByTestId('punto-mejorar').count(), 'no sale el punto rojo en Mejorar con oro para comprar');
    await page.getByTestId('abrir-mejorar').click();
    check(await page.getByTestId('arbol').count(), 'Mejorar no abre el árbol');
    check(!(await page.getByTestId('punto-mejorar').count()), 'el punto rojo sigue con el árbol abierto');
    await page.comprar('danio', 3);
    await page.comprar('arqueros', 1);
    await page.getByTestId('abrir-mejorar').click();
    await page.waitForTimeout(300);
    check(!(await page.getByTestId('arbol').count()), 'Mejorar no cierra el árbol');
    check(await page.getByTestId('ritmo-guardia').count(), 'no se ve el oro por minuto de las tropas');
    const conTropas = await page.evaluate(() => window.juego.meta.oro);
    await page.waitForTimeout(9000);
    const despues = await page.evaluate(() => window.juego.meta.oro);
    check(despues > conTropas, `las tropas no juntaron oro (${conTropas} → ${despues})`);
    check((await page.evaluate(() => window.juego.run.enemies.length)) <= 12, 'salen demasiados en la pantalla principal');
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(400);
    check(await page.getByTestId('reloj').count(), 'no empezó el nivel');
    check(!(await page.evaluate(() => !!window.juego.run?.guardia)), 'el nivel sigue en modo guardia');
  });

  await flow('autoapuntado: el círculo va solo (despacio) y tocar lo lleva al instante', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(10000);
    await page.comprar('danio', 1);
    await page.comprar('radio', 3);
    await page.comprar('autoapuntar', 1);
    check((await page.getByTestId('detalle').textContent()).includes('1/5'), 'no se compró el Autoapuntado');
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(300);
    // Los slimes, lejos del centro: así el círculo tiene a dónde ir.
    const inicio = await page.evaluate(() => { const r = window.juego.run; for (const e of r.enemies) { e.x = 310; e.y = 120; e.vx = 0; e.vy = 0; e.giro = 99; } r.auto.falta = 0; return { ...r.cursor }; });
    await page.waitForTimeout(2000);
    const luego = await page.evaluate(() => ({ ...window.juego.run.cursor }));
    const avance = Math.hypot(luego.x - inicio.x, luego.y - inicio.y);
    check(avance > 5 && avance < 40, `el círculo no se movió solo y despacio (${avance.toFixed(1)})`);
    await page.tap(0.2, 0.6);
    await page.waitForTimeout(150);
    const tocado = await page.evaluate(() => ({ ...window.juego.run.cursor, manual: window.juego.run.manual }));
    check(Math.abs(tocado.x - 72) < 4 && tocado.manual < 1, `tocar no llevó el círculo al instante (${tocado.x.toFixed(1)})`);
    await page.waitForTimeout(1000);
    const quieto = await page.evaluate(() => ({ ...window.juego.run.cursor }));
    check(Math.abs(quieto.x - tocado.x) < 0.5, 'el autoapuntado no esperó después de tocar');
  });

  for (const [w, h] of [[320, 568], [390, 844], [768, 1024]]) {
    await flow(`pantalla ${w}×${h}: nada se sale`, browser, async (page) => {
      const desborda = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
      check(!(await desborda()), 'la partida se desborda');
      await page.getByTestId('terminar').click();
      await page.waitForTimeout(300);
      check(!(await desborda()), 'el fin se desborda');
      await page.getByTestId('mejorar').click();
      await page.oro(1000000);
      for (const id of ['danio', 'radio', 'slimes', 'cadencia']) await page.comprar(id, 3);
      await page.getByTestId('abrir-ajustes').click();
      for (let i = 0; i < 18; i++) await page.getByTestId('mas-nivel').click();
      await page.mouse.click(4, 4);
      check(await page.getByTestId('seccion-reliquias').count(), 'no salen las Reliquias');
      check(await page.getByTestId('abrir-ranking').count(), 'no sale el trofeo del ranking');
      // Las 4 pestañas y todo el encabezado (oro, gemas, misiones, glosario, ajustes) dentro de la pantalla.
      const arriba = await page.$$eval('[data-testid^="seccion-"], [data-testid^="abrir-"], [data-testid="oro-total"], [data-testid="gemas"], [data-testid="ritmo-inactivo"]', (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth || r.top < 0; }).map((e) => e.dataset.testid));
      check(arriba.length === 0, `no caben arriba: ${arriba.join(', ')}`);
      for (const sec of ['jugador', 'mago', 'arqueros', 'reliquias']) {
        await page.getByTestId(`seccion-${sec}`).click();
        // En pantallas chicas el árbol se desliza: cada nodo, al llevarlo a la vista, cabe completo.
        const fuera = await page.$$eval('[data-testid^="talento-"], [data-testid="jugar"], [data-testid="abrir-mejorar"], [data-testid="cerrar-arbol"]', (els) => els.filter((e) => { e.scrollIntoView({ block: 'nearest' }); const r = e.getBoundingClientRect(); const caja = e.closest('[data-testid="lienzo-arbol"]')?.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight || (caja && (r.top < caja.top - 14 || r.bottom > caja.bottom + 12)); }).map((e) => e.dataset.testid));
        check(fuera.length === 0, `en ${sec} se salen: ${fuera.join(', ')}`);
      }
      check(!(await desborda()), 'el árbol se desborda');
      await page.getByTestId('abrir-pvp').click();
      const fueraPvp = await page.$$eval('[data-testid="pvp-liga"], [data-testid="mi-poder"], [data-testid="abrir-tienda-pvp"], [data-testid="pvp-intentos"]', (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight; }).map((e) => e.dataset.testid));
      check(fueraPvp.length === 0, `en el PvP se salen: ${fueraPvp.join(', ')}`);
      check(!(await desborda()), 'el PvP se desborda');
      await page.mouse.click(4, 4);
      await page.getByTestId('abrir-ajustes').click();
      for (let i = 0; i < 8; i++) await page.getByTestId('mas-nivel').click();
      await page.mouse.click(4, 4);
      const fila = await page.$$eval('[data-testid="abrir-supervivencia"], [data-testid="abrir-pvp"], [data-testid="jugar"]', (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth; }).map((e) => e.dataset.testid));
      check(fila.length === 0, `los botones de abajo no caben: ${fila.join(', ')}`);
      await page.getByTestId('abrir-supervivencia').click();
      await page.getByTestId('abrir-herreria').click();
      check(!(await desborda()), 'la Herrería se desborda');
    }, { viewport: { width: w, height: h } });
  }

  await flow('versión para compartir: sin botones de pruebas', browser, async (page) => {
    check(await page.getByTestId('reloj').count(), 'el archivo no arrancó');
    check(!(await page.getByTestId('terminar').count()), 'trae el botón de terminar de pruebas');
  }, { url: 'file://' + path.resolve(__dirname, '../../dist-archivo/campo-de-slimes.html') });

  await browser.close();
  if (proc) proc.kill();
  for (const [name, ok, msg] of results) console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    ${msg}`}`);
  const fails = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - fails}/${results.length} flujos bien`);
  process.exit(fails ? 1 : 0);
})();
