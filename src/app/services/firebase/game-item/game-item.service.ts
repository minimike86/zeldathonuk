import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {GameItemsId, GameItems, GameItem} from './game-item';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GameItemService {
  private gameItemsCollection: AngularFirestoreCollection<GameItems>;
  private gameItemsData: GameItemsId[];

  // TODO: Refactor into seperate firebase service

  constructor(private db: AngularFirestore) {
    this.gameItemsCollection = db.collection<GameItems>('/game-progress');
    this.getGameItems().subscribe( data => {
      this.gameItemsData = data;
    });
  }

  getGameItems(): Observable<GameItemsId[]> {
    return this.gameItemsCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const id = a.payload.doc.id;
        const data = a.payload.doc.data() as GameItems;
        return { id, ...data };
      }))
    );
  }

  collectItem(firestorePath: string, array: GameItem[]): void {
    console.log('collectItem: ', firestorePath, array);
    this.gameItemsCollection.doc(firestorePath).update({'items': array});
  }

  public addMinishCapData() {
    this.gameItemsCollection.doc('MINISH-CAP').set({
      'items':
        [
          {
            'name': 'Smith\'s Sword',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Smith\'s Sword Sprite.png',
            'collected': false
          },
          {
            'name': 'White Sword',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC White Sword Sprite.png',
            'collected': false
          },
          {
            'name': 'White Sword (Two Elements)',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC White Sword (Two Elements) Sprite.png',
            'collected': false
          },
          {
            'name': 'White Sword (Three Elements)',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC White Sword (Three Elements) Sprite.png',
            'collected': false
          },
          {
            'name': 'Four Sword',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Four Sword Sprite.png',
            'collected': false
          },
          {
            'name': 'Gust Jar',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Gust Jar Sprite.png',
            'collected': false
          },
          {
            'name': 'Cane of Pacci',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Cane of Pacci Sprite.png',
            'collected': false
          },
          {
            'name': 'Boomerang',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Boomerang Sprite.png',
            'collected': false
          },
          {
            'name': 'Magical Boomerang',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Magical Boomerang Sprite.png',
            'collected': false
          },
          {
            'name': 'Small Shield',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Small Shield Sprite.png',
            'collected': false
          },
          {
            'name': 'Mirror Shield',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Mirror Shield Sprite.png',
            'collected': false
          },
          {
            'name': 'Mole Mitts',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Mole Mitts Sprite.png',
            'collected': false
          },
          {
            'name': 'Flame Lantern',
            'imgUrl': '../../../../../assets/img/game-items/mc/FlameLantern TMC.gif',
            'collected': false
          },
          {
            'name': 'Bomb',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Bomb Sprite.png',
            'collected': false
          },
          {
            'name': 'Remote Bomb',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Remote Bomb Sprite.png',
            'collected': false
          },
          {
            'name': 'Pegasus Boots',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Pegasus Boots Sprite.png',
            'collected': false
          },
          {
            'name': 'Roc\'s Cape',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Roc\'s Cape Sprite.png',
            'collected': false
          },
          {
            'name': 'Ocarina of Wind',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Ocarina of Wind Sprite.png',
            'collected': false
          },
          {
            'name': 'Bow',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Bow Sprite.png',
            'collected': false
          },
          {
            'name': 'Light Arrows',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Light Arrows Sprite.png',
            'collected': false
          },
          {
            'name': 'Bottle 1',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Bottle Sprite.png',
            'collected': false
          },
          {
            'name': 'Bottle 2',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Bottle Sprite.png',
            'collected': false
          },
          {
            'name': 'Bottle 3',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Bottle Sprite.png',
            'collected': false
          },
          {
            'name': 'Bottle 4',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Bottle Sprite.png',
            'collected': false
          },
          {
            'name': 'Kinstone Bag',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Kinstone Bag Sprite.png',
            'collected': false
          },
          {
            'name': 'Tingle Trophy',
            'imgUrl': '../../../../../assets/img/game-items/mc/TingleTrophy.png',
            'collected': false
          },
          {
            'name': 'Tiger Scroll (Spin Attack)',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png',
            'collected': false
          },
          {
            'name': 'Tiger Scroll (Sword Beam)',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png',
            'collected': false
          },
          {
            'name': 'Tiger Scroll (Dash Attack)',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png',
            'collected': false
          },
          {
            'name': 'Tiger Scroll (Peril Beam)',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png',
            'collected': false
          },
          {
            'name': 'Tiger Scroll (Rock Breaker)',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png',
            'collected': false
          },
          {
            'name': 'Tiger Scroll (Roll Attack)',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png',
            'collected': false
          },
          {
            'name': 'Tiger Scroll (Down Thrust)',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png',
            'collected': false
          },
          {
            'name': 'Tiger Scroll (Great Spin Attack)',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Tiger Scrolls Sprite.png',
            'collected': false
          },
          {
            'name': 'Mysterious Shell',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Mysterious Shell Sprite.png',
            'collected': false
          },
          {
            'name': 'Carlov Medal',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Carlov Medal Sprite.png',
            'collected': false
          },
          {
            'name': 'Grip Ring',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Grip Ring Sprite.png',
            'collected': false
          },
          {
            'name': 'Power Bracelets',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Power Bracelets Sprite.png',
            'collected': false
          },
          {
            'name': 'Flippers',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Flippers Sprite.png',
            'collected': false
          },
          {
            'name': 'Broken Picori Blade',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Broken Picori Blade Sprite.png',
            'collected': false
          },
          {
            'name': 'Spare Key',
            'imgUrl': '../../../../../assets/img/game-items/mc/Sparekey.png',
            'collected': false
          },
          {
            'name': 'Wake-Up Mushroom',
            'imgUrl': '../../../../../assets/img/game-items/mc/WakeUpMushroom.png',
            'collected': false
          },
          {
            'name': 'Graveyard Key',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Graveyard Key Sprite.png',
            'collected': false
          },
          {
            'name': 'Bomb Bag',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Big Bomb Bag Sprite.png',
            'collected': false
          },
          {
            'name': 'Quiver',
            'imgUrl': '../../../../../assets/img/game-items/mc/BigQuiver(TMC).png',
            'collected': false
          },
          {
            'name': 'Wallet',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Wallet Sprite.png',
            'collected': false
          },
          {
            'name': 'Joy Butterfly',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Joy Butterfly Sprite.png',
            'collected': false
          },
          {
            'name': 'Jabber Nut',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Jabber Nut Sprite.png',
            'collected': false
          },
          {
            'name': 'Earth Element',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Earth Element Sprite.png',
            'collected': false
          },
          {
            'name': 'Fire Element',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Fire Element Sprite.png',
            'collected': false
          },
          {
            'name': 'Water Element',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Water Element Sprite.png',
            'collected': false
          },
          {
            'name': 'Wind Element',
            'imgUrl': '../../../../../assets/img/game-items/mc/TMC Wind Element Sprite.png',
            'collected': false
          }
        ]});
  }

  public addMajorasMaskData() {
    this.gameItemsCollection.doc('MAJORAS-MASK').set({
      'items':
      [
      {
        'name': 'Ocarina of Time',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D_Ocarina_of_Time_Icon.png',
        'collected': false
      },
      {
        'name': 'Hero\'s Bow',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D_Hero\'s_Bow_Icon.png',
        'collected': false
      },
      {
        'name': 'Fire Arrow',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D_Fire_Arrow_Icon.png',
        'collected': false
      },
      {
        'name': 'Ice Arrow',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D_Ice_Arrow_Icon.png',
        'collected': false
      },
      {
        'name': 'Light Arrow',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D_Light_Arrow_Icon.png',
        'collected': false
      },
      {
        'name': 'Bombs',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Bomb Icon.png',
        'collected': false
      },
      {
        'name': 'Bombchu',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Bombchu Icon.png',
        'collected': false
      },
      {
        'name': 'Deku Stick',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Deku Stick Icon.png',
        'collected': false
      },
      {
        'name': 'Deku Nut',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Deku Nut Icon.png',
        'collected': false
      },
      {
        'name': 'Magic Bean',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Magic Bean Icon.png',
        'collected': false
      },
      {
        'name': 'Powder Keg',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Powder Keg Icon.png',
        'collected': false
      },
      {
        'name': 'Pictograph Box',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Pictograph Box Icon.png',
        'collected': false
      },
      {
        'name': 'Lens of Truth',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Lens of Truth Icon.png',
        'collected': false
      },
      {
        'name': 'Hookshot',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Hookshot Icon.png',
        'collected': false
      },
      {
        'name': 'Great Fairy\'s Sword',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Great Fairy\'s Sword Icon.png',
        'collected': false
      },
      {
        'name': 'Bottle 1',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Empty Bottle Icon.png',
        'collected': false
      },
      {
        'name': 'Bottle 2',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Empty Bottle Icon.png',
        'collected': false
      },
      {
        'name': 'Bottle 3',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Empty Bottle Icon.png',
        'collected': false
      },
      {
        'name': 'Bottle 4',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Empty Bottle Icon.png',
        'collected': false
      },
      {
        'name': 'Bottle 5',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Empty Bottle Icon.png',
        'collected': false
      },
      {
        'name': 'Bottle 6',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Empty Bottle Icon.png',
        'collected': false
      },
      {
        'name': 'Kokiri Sword',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Kokiri Sword Icon.png',
        'collected': false
      },
      {
        'name': 'Razor Sword',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Razor Sword Icon.png',
        'collected': false
      },
      {
        'name': 'Gilded Sword',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Gilded Sword Icon.png',
        'collected': false
      },
      {
        'name': 'Hero\'s Shield',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Hero\'s Shield Icon.png',
        'collected': false
      },
      {
        'name': 'Mirror Shield',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Mirror Shield Icon.png',
        'collected': false
      },
      {
        'name': 'Adult Wallet',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Adult Wallet Icon.png',
        'collected': false
      },
      {
        'name': 'Giant\'s Wallet',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Giant\'s Wallet Icon.png',
        'collected': false
      },
      {
        'name': 'Bomb Bag',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Bomb Bag Icon.png',
        'collected': false
      },
      {
        'name': 'Big Bomb Bag',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Big Bomb Bag Icon.png',
        'collected': false
      },
      {
        'name': 'Biggest Bomb Bag',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Biggest Bomb Bag Icon.png',
        'collected': false
      },
      {
        'name': 'Quiver',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Quiver Icon.png',
        'collected': false
      },
      {
        'name': 'Big Quiver',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Big Quiver Icon.png',
        'collected': false
      },
      {
        'name': 'Biggest Quiver',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Biggest Quiver Icon.png',
        'collected': false
      },
      {
        'name': 'Odolwa\'s Remains',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Odolwa\'s Remains Icon.png',
        'collected': false
      },
      {
        'name': 'Goht\'s Remains',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Goht\'s Remains Icon.png',
        'collected': false
      },
      {
        'name': 'Gyorg\'s Remains',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Gyorg\'s Remains Icon.png',
        'collected': false
      },
      {
        'name': 'Twinmold\'s Remains',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Twinmold\'s Remains Icon.png',
        'collected': false
      },
      {
        'name': 'Town Title Deed',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Town Title Deed Icon.png',
        'collected': false
      },
      {
        'name': 'Swamp Title Deed',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Swamp Title Deed Icon.png',
        'collected': false
      },
      {
        'name': 'Mountain Title Deed',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Mountain Title Deed Icon.png',
        'collected': false
      },
      {
        'name': 'Ocean Title Deed',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Ocean Title Deed Icon.png',
        'collected': false
      },
      {
        'name': 'Bombers\' Notebook',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Bombers\' Notebook Icon.png',
        'collected': false
      },
      {
        'name': 'Room Key',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Room Key Icon.png',
        'collected': false
      },
      {
        'name': 'Letter to Kafei',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Letter to Kafei Icon.png',
        'collected': false
      },
      {
        'name': 'Pendant of Memories',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Pendant of Memories Icon.png',
        'collected': false
      },
      {
        'name': 'Special Delivery to Mama',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Special Delivery to Mama Icon.png',
        'collected': false
      },
      {
        'name': 'Moon\'s Tear',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Moon\'s Tear Icon.png',
        'collected': false
      },
      {
        'name': 'Fishing Hole Pass',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D_Fishing_Hole_Pass_Icon.png',
        'collected': false
      },
      {
        'name': 'Postman\'s Hat',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Postman\'s Hat Icon.png',
        'collected': false
      },
      {
        'name': 'All-Night Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D All-Night Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Blast Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Blast Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Stone Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Stone Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Great Fairy Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Great Fairy Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Deku Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Deku Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Keaton Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Keaton Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Bremen Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Bremen Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Bunny Hood',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Bunny Hood Icon.png',
        'collected': false
      },
      {
        'name': 'Don Gero\'s Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Don Gero\'s Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Mask of Scents',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Mask of Scents Icon.png',
        'collected': false
      },
      {
        'name': 'Goron Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Goron Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Romani\'s Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Romani\'s Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Troupe Leader\'s Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Troupe Leader\'s Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Kafei\'s Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Kafei\'s Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Couple\'s Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Couple\'s Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Mask of Truth',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Mask of Truth Icon.png',
        'collected': false
      },
      {
        'name': 'Zora Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Zora Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Kamaro\'s Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Kamaro\'s Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Gibdo Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Gibdo Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Garo\'s Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Garo\'s Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Captain\'s Hat',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Captain\'s Hat Icon.png',
        'collected': false
      },
      {
        'name': 'Giant\'s Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Giant\'s Mask Icon.png',
        'collected': false
      },
      {
        'name': 'Fierce Deity\'s Mask',
        'imgUrl': '../../../../../assets/img/game-items/mm/MM3D Fierce Deity\'s Mask Icon.png',
        'collected': false
      }
    ]});
  }

  public addSpiritTracksData() {
    this.gameItemsCollection.doc('SPIRIT-TRACKS').set({
      'items':
        [
          {
            'name': 'Whirlwind',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Whirlwind.png',
            'collected': false
          },
          {
            'name': 'Boomerang',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Boomerang.png',
            'collected': false
          },
          {
            'name': 'Whip',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Whip_Sprite.png',
            'collected': false
          },
          {
            'name': 'Bow',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Bow_Sprite.png',
            'collected': false
          },
          {
            'name': 'Bow of Light',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Bow_of_Light_Sprite.png',
            'collected': false
          },
          {
            'name': 'Bombs',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Bomb_Icon.png',
            'collected': false
          },
          {
            'name': 'Sand Wand',
            'imgUrl': '../../../../../assets/img/game-items/st/SandWand.png',
            'collected': false
          },
          {
            'name': 'Spirit Flute',
            'imgUrl': '../../../../../assets/img/game-items/st/Spirit_flute.png',
            'collected': false
          },
          {
            'name': 'Red Potion',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Red_Potion_Icon.png',
            'collected': false
          },
          {
            'name': 'Purple Potion',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Purple_Potion_Icon.png',
            'collected': false
          },
          {
            'name': 'Yellow Potion',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Yellow_Potion_Icon.png',
            'collected': false
          },
          {
            'name': 'Recruit\'s Sword',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Recruit_Sword_Menu_Sprite.png',
            'collected': false
          },
          {
            'name': 'Lokomo Sword',
            'imgUrl': '../../../../../assets/img/game-items/st/LokomoSword.png',
            'collected': false
          },
          {
            'name': 'Engineer\'s Clothes',
            'imgUrl': '../../../../../assets/img/game-items/st/Enjineers_clothes.png',
            'collected': false
          },
          {
            'name': 'Recruit Uniform',
            'imgUrl': '../../../../../assets/img/game-items/st/Recruit_uniform.png',
            'collected': false
          },
          {
            'name': 'Shield',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Shield_Icon.png',
            'collected': false
          },
          {
            'name': 'Shield of Antiquity',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Shield_Of_Antiquity_Menu_Sprite.png',
            'collected': false
          },
          {
            'name': 'Arrows',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Quiver_50.png',
            'collected': false
          },
          {
            'name': 'Light Arrows',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Light_Arrows.png',
            'collected': false
          },
          {
            'name': 'Bomb Bag',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Bomb_Bag_Model.png',
            'collected': false
          },
          {
            'name': 'Compass of Light',
            'imgUrl': '../../../../../assets/img/game-items/st/Compass_of_Light.png',
            'collected': false
          },
          {
            'name': 'Engineer Certificate',
            'imgUrl': '../../../../../assets/img/game-items/st/Enjineers_clothes.png',
            'collected': false
          },
          {
            'name': 'Prize Postcard',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Prize_Postcards_Model.png',
            'collected': false
          },
          {
            'name': 'Rabbit Net',
            'imgUrl': '../../../../../assets/img/game-items/st/RabbitNet.png',
            'collected': false
          },
          {
            'name': 'Forest Rail Map',
            'imgUrl': '../../../../../assets/img/game-items/st/map/Forest_Rail_Map.png',
            'collected': false
          },
          {
            'name': 'Snow Rail Map',
            'imgUrl': '../../../../../assets/img/game-items/st/map/Snow_Rail_Map.png',
            'collected': false
          },
          {
            'name': 'Ocean Rail Map',
            'imgUrl': '../../../../../assets/img/game-items/st/map/Ocean_Rail_Map.png',
            'collected': false
          },
          {
            'name': 'Fire Rail Map',
            'imgUrl': '../../../../../assets/img/game-items/st/map/FireGlyph.png',
            'collected': false
          },
          {
            'name': 'Swordsman\'s Scroll #1',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Sword_Scrolls_Menu_Sprite1.png',
            'collected': false
          },
          {
            'name': 'Swordsman\'s Scroll #2',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Sword_Scrolls_Menu_Sprite2.png',
            'collected': false
          },
          {
            'name': 'Tear of Light #1',
            'imgUrl': '../../../../../assets/img/game-items/st/Tear_of_Light.png',
            'collected': false
          },
          {
            'name': 'Tear of Light #2',
            'imgUrl': '../../../../../assets/img/game-items/st/Tear_of_Light.png',
            'collected': false
          },
          {
            'name': 'Tear of Light #3',
            'imgUrl': '../../../../../assets/img/game-items/st/Tear_of_Light.png',
            'collected': false
          },
          {
            'name': 'Club Card',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Club_Card.png',
            'collected': false
          },
          {
            'name': 'Silver Card',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Silver_Card_Sprite.png',
            'collected': false
          },
          {
            'name': 'Gold Card',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Gold_Card_Sprite.png',
            'collected': false
          },
          {
            'name': 'Platinum Card',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Platinum_Card_Sprite.png',
            'collected': false
          },
          {
            'name': 'Diamond Card',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Diamond_Card_Sprite.png',
            'collected': false
          },
          {
            'name': 'Letters',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Letters.png',
            'collected': false
          },
          {
            'name': 'Stamp Book',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Stamp_Book_Menu_Sprite.png',
            'collected': false
          },
          {
            'name': 'Outset Village Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Aboda_Village_Stamp.png',
            'collected': false
          },
          {
            'name': 'Castle Town Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Castle_Town_Stamp.png',
            'collected': false
          },
          {
            'name': 'Whittleton Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Wittletown_Village_Stamp.png',
            'collected': false
          },
          {
            'name': 'Forest Sanctuary Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Forest_Sanctuary_Stamp.png',
            'collected': false
          },
          {
            'name': 'Forest Temple Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Forest_Temple_Stamp.png',
            'collected': false
          },
          {
            'name': 'Anouki Village Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Anouki_Village_Stamp.png',
            'collected': false
          },
          {
            'name': 'Snow Sanctuary Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Snow_Sanctuary_Stamp.png',
            'collected': false
          },
          {
            'name': 'Wellspring Station Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Wellspring_Station_Stamp.png',
            'collected': false
          },
          {
            'name': 'Snow Temple Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Snow_Temple_Stamp.png',
            'collected': false
          },
          {
            'name': 'Trading Post Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Trading_Post_Stamp.png',
            'collected': false
          },
          {
            'name': 'Papuchia Village Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Papuchia_Village_Stamp.png',
            'collected': false
          },
          {
            'name': 'Ocean Sanctuary Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Ocean_Sanctuary_Stamp.png',
            'collected': false
          },
          {
            'name': 'Ocean Temple Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Ocean_Temple_Stamp.png',
            'collected': false
          },
          {
            'name': 'Goron Village Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Goron_Village_Stamp.png',
            'collected': false
          },
          {
            'name': 'Fire Sanctuary Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Fire_Sanctuary_Stamp.png',
            'collected': false
          },
          {
            'name': 'Fire Temple Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Fire_Temple_Stamp.png',
            'collected': false
          },
          {
            'name': 'Pirate Hideout Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Pirate_Hideout_Stamp.png',
            'collected': false
          },
          {
            'name': 'Sand Sanctuary Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Sand_Sanctuary_Stamp.png',
            'collected': false
          },
          {
            'name': 'Sand Temple Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Sand_Temple_Stamp.png',
            'collected': false
          },
          {
            'name': 'Tower of Spirits Stamp',
            'imgUrl': '../../../../../assets/img/game-items/st/stamp/Tower_of_Spirits_Stamp.png',
            'collected': false
          },
          {
            'name': 'Spirit Engine',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Spirit_Engine.png',
            'collected': false
          },
          {
            'name': 'Practical Cannon',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Practical_Cannon.png',
            'collected': false
          },
          {
            'name': 'Solid Passenger Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Solid_Passenger_Car.png',
            'collected': false
          },
          {
            'name': 'Trusty Freight Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Trusty_Freight_Car.png',
            'collected': false
          },
          {
            'name': 'Wooden Engine',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Wooden_Engine.png',
            'collected': false
          },
          {
            'name': 'Wooden Cannon',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Wooden_Cannon.png',
            'collected': false
          },
          {
            'name': 'Wood Passenger Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Wood_Passenger_Car.png',
            'collected': false
          },
          {
            'name': 'Wooden Freight Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Wooden_Freight_Car.png',
            'collected': false
          },
          {
            'name': 'Steel Engine',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Steel_Engine.png',
            'collected': false
          },
          {
            'name': 'Heavy Cannon',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Heavy_Cannon.png',
            'collected': false
          },
          {
            'name': 'Sturdy Passenger Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Sturdy_Passenger_Car.png',
            'collected': false
          },
          {
            'name': 'Efficient Freight Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Efficient_Freight_Car.png',
            'collected': false
          },
          {
            'name': 'Skull Engine',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Skull_Engine.png',
            'collected': false
          },
          {
            'name': 'Skull Cannon',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Skull_Cannon.png',
            'collected': false
          },
          {
            'name': 'Skull Passenger Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Skull_Passenger_Car.png',
            'collected': false
          },
          {
            'name': 'Skull Freight Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Skull_Freight_Car.png',
            'collected': false
          },
          {
            'name': 'Stagecoach Engine',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Stagecoach_Engine.png',
            'collected': false
          },
          {
            'name': 'Tower Cannon',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Tower_Cannon.png',
            'collected': false
          },
          {
            'name': 'Quaint Passenger Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Quaint_Passenger_Car.png',
            'collected': false
          },
          {
            'name': 'Garden Freight Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Garden_Freight_Car.png',
            'collected': false
          },
          {
            'name': 'Dragonhead Engine',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Dragonhead_Engine.png',
            'collected': false
          },
          {
            'name': 'Dragon Cannon',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Dragon_Cannon.png',
            'collected': false
          },
          {
            'name': 'Dragon Passenger Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Dragon_Passenger_Car.png',
            'collected': false
          },
          {
            'name': 'Dragon Freight Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Dragon_Freight_Car.png',
            'collected': false
          },
          {
            'name': 'Sweet Engine',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Sweet_Engine.png',
            'collected': false
          },
          {
            'name': 'Honey Cannon',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Honey_Cannon.png',
            'collected': false
          },
          {
            'name': 'Cake Passenger Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Cake_Passenger_Car.png',
            'collected': false
          },
          {
            'name': 'Pie Freight Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Pie_Freight_Car.png',
            'collected': false
          },
          {
            'name': 'Golden Engine',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Golden_Engine.png',
            'collected': false
          },
          {
            'name': 'Brawny Cannon',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Brawny_Cannon.png',
            'collected': false
          },
          {
            'name': 'Royal Passenger Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Royal_Passenger_Car.png',
            'collected': false
          },
          {
            'name': 'Golden Freight Car',
            'imgUrl': '../../../../../assets/img/game-items/st/train-car/Golden_Freight_Car.png',
            'collected': false
          },
          {
            'name': 'Train Cargo: Cucco',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Cucco_Sprite.png',
            'collected': false
          },
          {
            'name': 'Train Cargo: Dark Ore',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Dark_Ore.png',
            'collected': false
          },
          {
            'name': 'Train Cargo: Fish',
            'imgUrl': '../../../../../assets/img/game-items/st/Fish_Icon_ST.png',
            'collected': false
          },
          {
            'name': 'Train Cargo: Goron Iron',
            'imgUrl': '../../../../../assets/img/game-items/st/Goron_Iron_Icon.png',
            'collected': false
          },
          {
            'name': 'Train Cargo: Lumber',
            'imgUrl': '../../../../../assets/img/game-items/st/Lumber_Icon.png',
            'collected': false
          },
          {
            'name': 'Train Cargo: Mega Ice',
            'imgUrl': '../../../../../assets/img/game-items/st/ST_Mega_Ice.png',
            'collected': false
          },
          {
            'name': 'Train Cargo: Vessel',
            'imgUrl': '../../../../../assets/img/game-items/st/Vessel_Icon.png',
            'collected': false
          }
        ]});
  }

  public addAdventureOfLinkData() {
    this.gameItemsCollection.doc('ADVENTURE-OF-LINK').set({
      'items':
        [
          {
            'name': 'Candle',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Candle_Sprite.png',
            'collected': false
          },
          {
            'name': 'Hammer',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Hammer_Sprite.png',
            'collected': false
          },
          {
            'name': 'Handy Glove',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Handy_Glove_Sprite.png',
            'collected': false
          },
          {
            'name': 'Raft',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Raft_Sprite.png',
            'collected': false
          },
          {
            'name': 'Boots',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Boots_Sprite.png',
            'collected': false
          },
          {
            'name': 'Flute',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Flute_Sprite.png',
            'collected': false
          },
          {
            'name': 'Magical Key',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Magical_Key_Sprite.png',
            'collected': false
          },
          {
            'name': 'Cross',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Cross_Sprite.png',
            'collected': false
          },
          {
            'name': 'Trophy',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Trophy_Sprite.png',
            'collected': false
          },
          {
            'name': 'Mirror',
            'imgUrl': '../../../../../assets/img/game-items/aol/Magic_Mirror.png',
            'collected': false
          },
          {
            'name': 'Water of Life',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Water_of_Life_Sprite.png',
            'collected': false
          },
          {
            'name': 'Water',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Water_of_Life_Sprite.png',
            'collected': false
          },
          {
            'name': 'Child',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Child_Sprite.png',
            'collected': false
          },
          {
            'name': 'Shield',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Shield_(Magic)_Artwork.png',
            'collected': false
          },
          {
            'name': 'Jump',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Jump_Artwork.png',
            'collected': false
          },
          {
            'name': 'Life',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Life_Artwork_2.png',
            'collected': false
          },
          {
            'name': 'Fairy',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Fairy_Artwork.png',
            'collected': false
          },
          {
            'name': 'Fire',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Fire_Artwork.png',
            'collected': false
          },
          {
            'name': 'Reflect',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Reflect_Artwork.png',
            'collected': false
          },
          {
            'name': 'Spell',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Spell_Artwork.png',
            'collected': false
          },
          {
            'name': 'Thunder',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Thunder_Artwork.png',
            'collected': false
          },
          {
            'name': 'Doll #1',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Doll_Sprite.png',
            'collected': false
          },
          {
            'name': 'Doll #2',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Doll_Sprite.png',
            'collected': false
          },
          {
            'name': 'Doll #3',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Doll_Sprite.png',
            'collected': false
          },
          {
            'name': 'Doll #4',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Doll_Sprite.png',
            'collected': false
          },
          {
            'name': 'Heart Container #1',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Bowl_of_Hearts_Sprite.png',
            'collected': false
          },
          {
            'name': 'Heart Container #2',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Bowl_of_Hearts_Sprite.png',
            'collected': false
          },
          {
            'name': 'Heart Container #3',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Bowl_of_Hearts_Sprite.png',
            'collected': false
          },
          {
            'name': 'Heart Container #4',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Bowl_of_Hearts_Sprite.png',
            'collected': false
          },
          {
            'name': 'Magic Container #1',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Magic_Bowl_Sprite.png',
            'collected': false
          },
          {
            'name': 'Magic Container #2',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Magic_Bowl_Sprite.png',
            'collected': false
          },
          {
            'name': 'Magic Container #3',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Magic_Bowl_Sprite.png',
            'collected': false
          },
          {
            'name': 'Magic Container #4',
            'imgUrl': '../../../../../assets/img/game-items/aol/TAoL_Magic_Bowl_Sprite.png',
            'collected': false
          },
        ]});
  }

}
