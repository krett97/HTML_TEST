import type { GameData, ToolDef } from './data';
import type { GameState } from './state';

/** Las herramientas gratis (la pata) se tienen desde el inicio aunque no estén en la lista. */
export function ownsTool(state: GameState, tool: ToolDef): boolean {
  return tool.costo.eq(0) || state.herramientas.includes(tool.id);
}

/** La siguiente herramienta por comprar (se compran en orden). */
export function nextTool(state: GameState, data: GameData): ToolDef | null {
  return data.tools.find((tool) => !ownsTool(state, tool)) ?? null;
}
