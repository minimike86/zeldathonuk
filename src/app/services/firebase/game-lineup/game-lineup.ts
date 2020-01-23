import {ZeldaGame} from '../../../models/zelda-game';

export interface GameLineUpId extends GameLineUp {
  id: string;
}

export interface GameLineUp {
  gameLineUp: Map<string, ZeldaGame>;
}
