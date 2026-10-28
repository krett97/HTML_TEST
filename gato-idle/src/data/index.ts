import { parseGameData } from '../core/data';
import objects from './objects.json';
import tools from './tools.json';
import allies from './allies.json';
import unlocks from './unlocks.json';
import research from './research.json';
import balance from './balance.json';
import habilidades from './habilidades.json';

export const gameData = parseGameData({ objects, tools, allies, unlocks, research, balance, habilidades });
