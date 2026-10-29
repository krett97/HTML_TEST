import { parseGameData } from '../core/data';
import objects from './objects.json';
import casas from './casas.json';
import jefes from './jefes.json';
import tools from './tools.json';
import allies from './allies.json';
import unlocks from './unlocks.json';
import research from './research.json';
import balance from './balance.json';
import habilidades from './habilidades.json';

export const gameData = parseGameData({ objects, casas, jefes, tools, allies, unlocks, research, balance, habilidades });
