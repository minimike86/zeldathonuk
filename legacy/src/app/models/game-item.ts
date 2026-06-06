export class GameItem {
  public name: string;
  public imgUrl: string;
  public collected: boolean;

  constructor(name: string, imgUrl: string, collected: boolean){
    this.name = name;
    this.imgUrl = imgUrl;
    this.collected = false;
  }

  toggleCollectItem() {
    this.collected = !this.collected;
  }

}
