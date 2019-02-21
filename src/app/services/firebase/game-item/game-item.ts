export interface GameItemsId extends GameItems {
  id: string;
}

export interface GameItems {
  items: GameItem[];
}

export interface GameItem {
  name: string;
  imgUrl: string;
  collected: boolean;
}
