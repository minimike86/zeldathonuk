import {Injectable} from '@angular/core';
import {GameItem} from "../../models/game-item";

@Injectable({
  providedIn: 'root'
})
export class GameItemService {
  private gameItems: GameItem[];

  //TODO: Refactor into seperate firebase service

  constructor() {
  }

  loadMajorasMask() {
    //Empty the array
    this.gameItems = [];
    //Inventory Items
    this.gameItems.push(new GameItem('Ocarina of Time', '../../../../../assets/img/game-items/mm/MM3D_Ocarina_of_Time_Icon.png', false));
    this.gameItems.push(new GameItem('Hero\'s Bow', '../../../../../assets/img/game-items/mm/MM3D_Hero\'s_Bow_Icon.png', false));
    this.gameItems.push(new GameItem('Fire Arrow', '../../../../../assets/img/game-items/mm/MM3D_Fire_Arrow_Icon.png', false));
    this.gameItems.push(new GameItem('Ice Arrow', '../../../../../assets/img/game-items/mm/MM3D_Ice_Arrow_Icon.png', false));
    this.gameItems.push(new GameItem('Light Arrow', '../../../../../assets/img/game-items/mm/MM3D_Light_Arrow_Icon.png', false));
    this.gameItems.push(new GameItem('Bombs', '../../../../../assets/img/game-items/mm/MM3D Bomb Icon.png', false));
    this.gameItems.push(new GameItem('Bombchu', '../../../../../assets/img/game-items/mm/MM3D Bombchu Icon.png', false));
    this.gameItems.push(new GameItem('Deku Stick', '../../../../../assets/img/game-items/mm/MM3D Deku Stick Icon.png', false));
    this.gameItems.push(new GameItem('Deku Nut', '../../../../../assets/img/game-items/mm/MM3D Deku Nut Icon.png', false));
    this.gameItems.push(new GameItem('Magic Bean', '../../../../../assets/img/game-items/mm/MM3D Magic Bean Icon.png', false));
    this.gameItems.push(new GameItem('Powder Keg', '../../../../../assets/img/game-items/mm/MM3D Powder Keg Icon.png', false));
    this.gameItems.push(new GameItem('Pictograph Box', '../../../../../assets/img/game-items/mm/MM3D Pictograph Box Icon.png', false));
    this.gameItems.push(new GameItem('Lens of Truth', '../../../../../assets/img/game-items/mm/MM3D Lens of Truth Icon.png', false));
    this.gameItems.push(new GameItem('Hookshot', '../../../../../assets/img/game-items/mm/MM3D Hookshot Icon.png', false));
    this.gameItems.push(new GameItem('Great Fairy\'s Sword', '../../../../../assets/img/game-items/mm/MM3D Great Fairy\'s Sword Icon.png', false));
    this.gameItems.push(new GameItem('Bottle 1', '../../../../../assets/img/game-items/mm/MM3D Empty Bottle Icon.png', false));
    this.gameItems.push(new GameItem('Bottle 2', '../../../../../assets/img/game-items/mm/MM3D Empty Bottle Icon.png', false));
    this.gameItems.push(new GameItem('Bottle 3', '../../../../../assets/img/game-items/mm/MM3D Empty Bottle Icon.png', false));
    this.gameItems.push(new GameItem('Bottle 4', '../../../../../assets/img/game-items/mm/MM3D Empty Bottle Icon.png', false));
    this.gameItems.push(new GameItem('Bottle 5', '../../../../../assets/img/game-items/mm/MM3D Empty Bottle Icon.png', false));
    this.gameItems.push(new GameItem('Bottle 6', '../../../../../assets/img/game-items/mm/MM3D Empty Bottle Icon.png', false));
    //Equipment
    this.gameItems.push(new GameItem('Kokiri Sword', '../../../../../assets/img/game-items/mm/MM3D Kokiri Sword Icon.png', false));
    this.gameItems.push(new GameItem('Razor Sword', '../../../../../assets/img/game-items/mm/MM3D Razor Sword Icon.png', false));
    this.gameItems.push(new GameItem('Gilded Sword', '../../../../../assets/img/game-items/mm/MM3D Gilded Sword Icon.png', false));
    this.gameItems.push(new GameItem('Hero\'s Shield', '../../../../../assets/img/game-items/mm/MM3D Hero\'s Shield Icon.png', false));
    this.gameItems.push(new GameItem('Mirror Shield', '../../../../../assets/img/game-items/mm/MM3D Mirror Shield Icon.png', false));
    this.gameItems.push(new GameItem('Adult Wallet', '../../../../../assets/img/game-items/mm/MM3D Adult Wallet Icon.png', false));
    this.gameItems.push(new GameItem('Giant\'s Wallet', '../../../../../assets/img/game-items/mm/MM3D Giant\'s Wallet Icon.png', false));
    this.gameItems.push(new GameItem('Bomb Bag', '../../../../../assets/img/game-items/mm/MM3D Bomb Bag Icon.png', false));
    this.gameItems.push(new GameItem('Big Bomb Bag', '../../../../../assets/img/game-items/mm/MM3D Big Bomb Bag Icon.png', false));
    this.gameItems.push(new GameItem('Biggest Bomb Bag', '../../../../../assets/img/game-items/mm/MM3D Biggest Bomb Bag Icon.png', false));
    this.gameItems.push(new GameItem('Quiver', '../../../../../assets/img/game-items/mm/MM3D Quiver Icon.png', false));
    this.gameItems.push(new GameItem('Big Quiver', '../../../../../assets/img/game-items/mm/MM3D Big Quiver Icon.png', false));
    this.gameItems.push(new GameItem('Biggest Quiver', '../../../../../assets/img/game-items/mm/MM3D Biggest Quiver Icon.png', false));
    //Quest Items
    this.gameItems.push(new GameItem('Odolwa\'s Remains', '../../../../../assets/img/game-items/mm/MM3D Odolwa\'s Remains Icon.png', false));
    this.gameItems.push(new GameItem('Goht\'s Remains', '../../../../../assets/img/game-items/mm/MM3D Goht\'s Remains Icon.png', false));
    this.gameItems.push(new GameItem('Gyorg\'s Remains', '../../../../../assets/img/game-items/mm/MM3D Gyorg\'s Remains Icon.png', false));
    this.gameItems.push(new GameItem('Twinmold\'s Remains', '../../../../../assets/img/game-items/mm/MM3D Twinmold\'s Remains Icon.png', false));
    this.gameItems.push(new GameItem('Town Title Deed', '../../../../../assets/img/game-items/mm/MM3D Town Title Deed Icon.png', false));
    this.gameItems.push(new GameItem('Swamp Title Deed', '../../../../../assets/img/game-items/mm/MM3D Swamp Title Deed Icon.png', false));
    this.gameItems.push(new GameItem('Mountain Title Deed', '../../../../../assets/img/game-items/mm/MM3D Mountain Title Deed Icon.png', false));
    this.gameItems.push(new GameItem('Ocean Title Deed', '../../../../../assets/img/game-items/mm/MM3D Ocean Title Deed Icon.png', false));
    this.gameItems.push(new GameItem('Bombers\' Notebook', '../../../../../assets/img/game-items/mm/MM3D Bombers\' Notebook Icon.png', false));
    this.gameItems.push(new GameItem('Room Key', '../../../../../assets/img/game-items/mm/MM3D Room Key Icon.png', false));
    this.gameItems.push(new GameItem('Letter to Kafei', '../../../../../assets/img/game-items/mm/MM3D Letter to Kafei Icon.png', false));
    this.gameItems.push(new GameItem('Pendant of Memories', '../../../../../assets/img/game-items/mm/MM3D Pendant of Memories Icon.png', false));
    this.gameItems.push(new GameItem('Special Delivery to Mama', '../../../../../assets/img/game-items/mm/MM3D Special Delivery to Mama Icon.png', false));
    this.gameItems.push(new GameItem('Moon\'s Tear', '../../../../../assets/img/game-items/mm/MM3D Moon\'s Tear Icon.png', false));
    this.gameItems.push(new GameItem('Fishing Hole Pass', '../../../../../assets/img/game-items/mm/MM3D_Fishing_Hole_Pass_Icon.png', false));
    //Masks
    this.gameItems.push(new GameItem('Postman\'s Hat', '../../../../../assets/img/game-items/mm/MM3D Postman\'s Hat Icon.png', false));
    this.gameItems.push(new GameItem('All-Night Mask', '../../../../../assets/img/game-items/mm/MM3D All-Night Mask Icon.png', false));
    this.gameItems.push(new GameItem('Blast Mask', '../../../../../assets/img/game-items/mm/MM3D Blast Mask Icon.png', false));
    this.gameItems.push(new GameItem('Stone Mask', '../../../../../assets/img/game-items/mm/MM3D Stone Mask Icon.png', false));
    this.gameItems.push(new GameItem('Great Fairy Mask', '../../../../../assets/img/game-items/mm/MM3D Great Fairy Mask Icon.png', false));
    this.gameItems.push(new GameItem('Deku Mask', '../../../../../assets/img/game-items/mm/MM3D Deku Mask Icon.png', false));
    this.gameItems.push(new GameItem('Keaton Mask', '../../../../../assets/img/game-items/mm/MM3D Keaton Mask Icon.png', false));
    this.gameItems.push(new GameItem('Bremen Mask', '../../../../../assets/img/game-items/mm/MM3D Bremen Mask Icon.png', false));
    this.gameItems.push(new GameItem('Bunny Hood', '../../../../../assets/img/game-items/mm/MM3D Bunny Hood Icon.png', false));
    this.gameItems.push(new GameItem('Don Gero\'s Mask', '../../../../../assets/img/game-items/mm/MM3D Don Gero\'s Mask Icon.png', false));
    this.gameItems.push(new GameItem('Mask of Scents', '../../../../../assets/img/game-items/mm/MM3D Mask of Scents Icon.png', false));
    this.gameItems.push(new GameItem('Goron Mask', '../../../../../assets/img/game-items/mm/MM3D Goron Mask Icon.png', false));
    this.gameItems.push(new GameItem('Romani\'s Mask', '../../../../../assets/img/game-items/mm/MM3D Romani\'s Mask Icon.png', false));
    this.gameItems.push(new GameItem('Troupe Leader\'s Mask', '../../../../../assets/img/game-items/mm/MM3D Troupe Leader\'s Mask Icon.png', false));
    this.gameItems.push(new GameItem('Kafei\'s Mask', '../../../../../assets/img/game-items/mm/MM3D Kafei\'s Mask Icon.png', false));
    this.gameItems.push(new GameItem('Couple\'s Mask', '../../../../../assets/img/game-items/mm/MM3D Couple\'s Mask Icon.png', false));
    this.gameItems.push(new GameItem('Mask of Truth', '../../../../../assets/img/game-items/mm/MM3D Mask of Truth Icon.png', false));
    this.gameItems.push(new GameItem('Zora Mask', '../../../../../assets/img/game-items/mm/MM3D Zora Mask Icon.png', false));
    this.gameItems.push(new GameItem('Kamaro\'s Mask', '../../../../../assets/img/game-items/mm/MM3D Kamaro\'s Mask Icon.png', false));
    this.gameItems.push(new GameItem('Gibdo Mask', '../../../../../assets/img/game-items/mm/MM3D Gibdo Mask Icon.png', false));
    this.gameItems.push(new GameItem('Garo\'s Mask', '../../../../../assets/img/game-items/mm/MM3D Garo\'s Mask Icon.png', false));
    this.gameItems.push(new GameItem('Captain\'s Hat', '../../../../../assets/img/game-items/mm/MM3D Captain\'s Hat Icon.png', false));
    this.gameItems.push(new GameItem('Giant\'s Mask', '../../../../../assets/img/game-items/mm/MM3D Giant\'s Mask Icon.png', false));
    this.gameItems.push(new GameItem('Fierce Deity\'s Mask', '../../../../../assets/img/game-items/mm/MM3D Fierce Deity\'s Mask Icon.png', false));
  }

  loadMinishCap() {
    //Empty the array
    this.gameItems = [];
    //Inventory Items
    this.gameItems.push(new GameItem('Smith\'s Sword', '../../../../../assets/img/game-items/mc/TMC Smith\'s Sword Sprite.png', false));
    this.gameItems.push(new GameItem('White Sword', '../../../../../assets/img/game-items/mc/TMC White Sword Sprite.png', false));
    this.gameItems.push(new GameItem('White Sword (Two Elements)', '../../../../../assets/img/game-items/mc/TMC White Sword (Two Elements) Sprite.png', false));
    this.gameItems.push(new GameItem('White Sword (Three Elements)', '../../../../../assets/img/game-items/mc/TMC White Sword (Three Elements) Sprite.png', false));
    this.gameItems.push(new GameItem('Four Sword', '../../../../../assets/img/game-items/mc/TMC Four Sword Sprite.png', false));
    this.gameItems.push(new GameItem('Gust Jar', '../../../../../assets/img/game-items/mc/TMC Gust Jar Sprite.png', false));
    this.gameItems.push(new GameItem('Cane of Pacci', '../../../../../assets/img/game-items/mc/TMC Cane of Pacci Sprite.png', false));
    this.gameItems.push(new GameItem('Boomerang', '../../../../../assets/img/game-items/mc/TMC Boomerang Sprite.png', false));
    this.gameItems.push(new GameItem('Magical Boomerang', '../../../../../assets/img/game-items/mc/TMC Magical Boomerang Sprite.png', false));
    this.gameItems.push(new GameItem('Small Shield', '../../../../../assets/img/game-items/mc/TMC Small Shield Sprite.png', false));
    this.gameItems.push(new GameItem('Mirror Shield', '../../../../../assets/img/game-items/mc/TMC Mirror Shield Sprite.png', false));
    this.gameItems.push(new GameItem('Mole Mitts', '../../../../../assets/img/game-items/mc/TMC Mole Mitts Sprite.png', false));
    this.gameItems.push(new GameItem('Flame Lantern', '../../../../../assets/img/game-items/mc/FlameLantern TMC.gif', false));
    this.gameItems.push(new GameItem('Bomb', '../../../../../assets/img/game-items/mc/TMC Bomb Sprite.png', false));
    this.gameItems.push(new GameItem('Remote Bomb', '../../../../../assets/img/game-items/mc/TMC Remote Bomb Sprite.png', false));
    this.gameItems.push(new GameItem('Pegasus Boots', '../../../../../assets/img/game-items/mc/TMC Pegasus Boots Sprite.png', false));
    this.gameItems.push(new GameItem('Roc\'s Cape', '../../../../../assets/img/game-items/mc/TMC Roc\'s Cape Sprite.png', false));
    this.gameItems.push(new GameItem('Ocarina of Wind', '../../../../../assets/img/game-items/mc/TMC Ocarina of Wind Sprite.png', false));
    this.gameItems.push(new GameItem('Bow', '../../../../../assets/img/game-items/mc/TMC Bow Sprite.png', false));
    this.gameItems.push(new GameItem('Light Arrows', '../../../../../assets/img/game-items/mc/TMC Light Arrows Sprite.png', false));
    this.gameItems.push(new GameItem('Bottle 1', '../../../../../assets/img/game-items/mc/TMC Bottle Sprite.png', false));
    this.gameItems.push(new GameItem('Bottle 2', '../../../../../assets/img/game-items/mc/TMC Bottle Sprite.png', false));
    this.gameItems.push(new GameItem('Bottle 3', '../../../../../assets/img/game-items/mc/TMC Bottle Sprite.png', false));
    this.gameItems.push(new GameItem('Bottle 4', '../../../../../assets/img/game-items/mc/TMC Bottle Sprite.png', false));
    //Quest Items
    this.gameItems.push(new GameItem('Kinstone Bag', '../../../../../assets/img/game-items/mc/TMC Kinstone Bag Sprite.png', false));
    this.gameItems.push(new GameItem('Tingle Trophy', '../../../../../assets/img/game-items/mc/TingleTrophy.png', false));
    this.gameItems.push(new GameItem('Tiger Scroll (Spin Attack)', '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png', false));
    this.gameItems.push(new GameItem('Tiger Scroll (Sword Beam)', '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png', false));
    this.gameItems.push(new GameItem('Tiger Scroll (Dash Attack)', '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png', false));
    this.gameItems.push(new GameItem('Tiger Scroll (Peril Beam)', '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png', false));
    this.gameItems.push(new GameItem('Tiger Scroll (Rock Breaker)', '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png', false));
    this.gameItems.push(new GameItem('Tiger Scroll (Roll Attack)', '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png', false));
    this.gameItems.push(new GameItem('Tiger Scroll (Down Thrust)', '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png', false));
    this.gameItems.push(new GameItem('Tiger Scroll (Great Spin Attack)', '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png', false));
    this.gameItems.push(new GameItem('Mysterious Shell', '../../../../../assets/img/game-items/mc/TMC Mysterious Shell Sprite.png', false));
    this.gameItems.push(new GameItem('Carlov Medal', '../../../../../assets/img/game-items/mc/TMC Carlov Medal Sprite.png', false));
    this.gameItems.push(new GameItem('Grip Ring', '../../../../../assets/img/game-items/mc/TMC Grip Ring Sprite.png', false));
    this.gameItems.push(new GameItem('Power Bracelets', '../../../../../assets/img/game-items/mc/TMC Power Bracelets Sprite.png', false));
    this.gameItems.push(new GameItem('Flippers', '../../../../../assets/img/game-items/mc/TMC Flippers Sprite.png', false));
    this.gameItems.push(new GameItem('Broken Picori Blade', '../../../../../assets/img/game-items/mc/TMC Broken Picori Blade Sprite.png', false));
    this.gameItems.push(new GameItem('Spare Key', '../../../../../assets/img/game-items/mc/Sparekey.png', false));
    this.gameItems.push(new GameItem('Wake-Up Mushroom', '../../../../../assets/img/game-items/mc/WakeUpMushroom.png', false));
    this.gameItems.push(new GameItem('Graveyard Key', '../../../../../assets/img/game-items/mc/TMC Graveyard Key Sprite.png', false));
    this.gameItems.push(new GameItem('Bomb Bag', '../../../../../assets/img/game-items/mc/TMC Big Bomb Bag Sprite.png', false));
    this.gameItems.push(new GameItem('Quiver', '../../../../../assets/img/game-items/mc/BigQuiver(TMC).png', false));
    this.gameItems.push(new GameItem('Wallet', '../../../../../assets/img/game-items/mc/TMC Wallet Sprite.png', false));
    this.gameItems.push(new GameItem('Joy Butterfly', '../../../../../assets/img/game-items/mc/TMC Joy Butterfly Sprite.png', false));
    this.gameItems.push(new GameItem('Jabber Nut', '../../../../../assets/img/game-items/mc/TMC Jabber Nut Sprite.png', false));
    //Elements
    this.gameItems.push(new GameItem('Earth Element', '../../../../../assets/img/game-items/mc/TMC Earth Element Sprite.png', false));
    this.gameItems.push(new GameItem('Fire Element', '../../../../../assets/img/game-items/mc/TMC Fire Element Sprite.png', false));
    this.gameItems.push(new GameItem('Water Element', '../../../../../assets/img/game-items/mc/TMC Water Element Sprite.png', false));
    this.gameItems.push(new GameItem('Wind Element', '../../../../../assets/img/game-items/mc/TMC Wind Element Sprite.png', false));
  }

  collectItem(name: string) {
    this.gameItems.find(pred => pred.name === name).toggleCollectItem();
    console.log('collectItem', name, this.gameItems.find(pred => pred.name === name).collected);
  }

}
