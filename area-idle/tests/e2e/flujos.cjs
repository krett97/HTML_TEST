// Pruebas de punta a punta: el juego real en Chromium (Playwright). Uso: npm run e2e
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
    const seccion = await page.evaluate((id) => ({ danio: 'jugador', radio: 'jugador', slimes: 'jugador', cadencia: 'jugador', botin: 'jugador', tiempo: 'jugador', oro: 'jugador', inactivo: 'jugador', mago: 'mago', arqueros: 'arqueros', multiflecha: 'arqueros', poder: 'reliquias', critico: 'reliquias', carcaj: 'reliquias', albanil: 'reliquias' })[id], id);
    await page.getByTestId(`seccion-${seccion}`).click();
    await page.getByTestId(`talento-${id}`).click();
    for (let i = 0; i < veces; i++) await page.getByTestId('comprar').click();
  };
  return page;
}

async function flow(name, browser, fn, opts) {
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
    const blanco = await page.evaluate(() => { const e = window.juego.run.enemies[0]; return { x: e.x / 360, y: e.y / window.juego.run.h }; });
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
    for (let i = 0; i < 60 && !(await page.getByTestId('fin').count()); i++) {
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
    check((await page.getByTestId('nivel-actual').textContent()).includes('Nivel 1'), 'el árbol no recuerda el nivel elegido');
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
    check((await page.getByTestId('detalle').textContent()).includes('1/7'), 'no se compró Oro inactivo');
    check(await page.getByTestId('talento-bolsa').count(), 'no apareció Bolsa grande');
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
    await page.evaluate(() => { window.juego.run.cursor = { x: -999, y: -999 }; window.juego.run.muro.vida = 4; });
    let rojos = 0;
    for (let i = 0; i < 40 && !(await page.getByTestId('muralla-caida').count()); i++) {
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
    check(!(await page.getByTestId('detalle').textContent()).includes('0/40'), 'no compró nada en el árbol');
  });

  await flow('guardado: al recargar se queda el oro y el árbol, y se llega al árbol', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(100);
    await page.comprar('danio', 1);
    const oro = await page.getByTestId('oro-total').textContent();
    await page.reload();
    await page.waitForTimeout(1200);
    check(await page.getByTestId('arbol').count(), 'al volver no se llega al árbol');
    check((await page.getByTestId('oro-total').textContent()) === oro, 'el oro no se guardó');
    await page.getByTestId('talento-danio').click();
    check((await page.getByTestId('detalle').textContent()).includes('1/40'), 'el nivel de Daño no se guardó');
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
    await page.getByTestId('talento-danio').click();
    check((await page.getByTestId('detalle').textContent()).includes('0/40'), 'quedó nivel de Daño');
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
      for (let i = 0; i < 16; i++) await page.getByTestId('mas-nivel').click();
      await page.mouse.click(4, 4);
      check(await page.getByTestId('seccion-reliquias').count(), 'no salen las Reliquias');
      check(await page.getByTestId('abrir-ranking').count(), 'no sale el trofeo del ranking');
      // Las 4 pestañas y todo el encabezado (oro, gemas, misiones, glosario, ajustes) dentro de la pantalla.
      const arriba = await page.$$eval('[data-testid^="seccion-"], [data-testid^="abrir-"], [data-testid="oro-total"], [data-testid="gemas"], [data-testid="ritmo-inactivo"]', (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth || r.top < 0; }).map((e) => e.dataset.testid));
      check(arriba.length === 0, `no caben arriba: ${arriba.join(', ')}`);
      for (const sec of ['jugador', 'mago', 'arqueros', 'reliquias']) {
        await page.getByTestId(`seccion-${sec}`).click();
        const fuera = await page.$$eval('[data-testid^="talento-"], [data-testid="jugar"]', (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight; }).map((e) => e.dataset.testid));
        check(fuera.length === 0, `en ${sec} se salen: ${fuera.join(', ')}`);
      }
      check(!(await desborda()), 'el árbol se desborda');
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
