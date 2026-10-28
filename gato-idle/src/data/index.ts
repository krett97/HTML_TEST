import { parseGameData } from '../core/data';
import objects from './objects.json';
import tools from './tools.json';
import allies from './allies.json';
import balance from './balance.json';

export const gameData = parseGameData({ objects, tools, allies, balance });
