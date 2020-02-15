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

  constructor(private db: AngularFirestore) {
    this.gameItemsCollection = db.collection<GameItems>('/game-progress');
    this.getGameItemsIds().subscribe( data => {
      this.gameItemsData = data;
    });
  }

  getGameItemsIds(): Observable<GameItemsId[]> {
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

  public addWindWakerHdData() {
    this.gameItemsCollection.doc('WIND-WAKER-HD').set({
      'items':
        [
          {
            'name': 'Hero\'s Sword',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Heros_Sword.png',
            'collected': false
          },
          {
            'name': 'Hero\'s Shield',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Heros_Shield_(TWW).png',
            'collected': false
          },
          {
            'name': 'Master Sword',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Master_Sword(TWW).png',
            'collected': false
          },
          {
            'name': 'Mirror Shield',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Mirror_Shield_(TWW).png',
            'collected': false
          },
          {
            'name': 'Telescope',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Le_telescope.png',
            'collected': false
          },
          {
            'name': 'Sail',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Sail.png',
            'collected': false
          },
          {
            'name': 'Swift Sail',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Swift_Sail.png',
            'collected': false
          },
          {
            'name': 'Wind Waker',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/WindWaker_Large.png',
            'collected': false
          },
          {
            'name': 'Grappling Hook',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Grappling_Hook_(The_Wind_Waker).png',
            'collected': false
          },
          {
            'name': 'Tingle Bottle',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Tingle_Bottle_(TWW).png',
            'collected': false
          },
          {
            'name': 'Picto Box',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Picto_Box_(TWW).png',
            'collected': false
          },
          {
            'name': 'Deluxe Picto Box',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Deluxe_Picto_Box_(TWW).png',
            'collected': false
          },
          {
            'name': 'Power Bracelets',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Power_Bracelets_(WW).png',
            'collected': false
          },
          {
            'name': 'Iron Boots',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Iron_Boots_(TWW).png',
            'collected': false
          },
          {
            'name': 'Magic Armor',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Magicarmortww_Artwork.png',
            'collected': false
          },
          {
            'name': 'Boomerang',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/TWW_Boomerang.png',
            'collected': false
          },
          {
            'name': 'Deku Leaf',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/DekuLeaf_Large.png',
            'collected': false
          },
          {
            'name': 'Hero\'s Bow',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Heros_Bow_(TWW).png',
            'collected': false
          },
          {
            'name': 'Fire & Ice Arrows',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Fire_Ice_Arrows_(TWW).png',
            'collected': false
          },
          {
            'name': 'Light Arrows',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Light_Arrow_(TWW).png',
            'collected': false
          },
          {
            'name': 'Bomb',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Bomb_(TWW).png',
            'collected': false
          },
          {
            'name': 'Hookshot',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Hookshot_(TWW).png',
            'collected': false
          },
          {
            'name': 'Skull Hammer',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Skull_Hammer_(TWW).png',
            'collected': false
          },
          {
            'name': 'Spoils Bag',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Spoilsbag.png',
            'collected': false
          },
          {
            'name': 'Bait Bag',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Bait_Bag.png',
            'collected': false
          },
          {
            'name': 'Delivery Bag',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Delivery_Bag.png',
            'collected': false
          },
          {
            'name': 'Pirate\'s Charm',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Pirates_Charm.png',
            'collected': false
          },
          {
            'name': 'Hero\'s Charm',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Heros_Charm_(TWW).png',
            'collected': false
          },
          {
            'name': 'All-Purpose Bait',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/AllPurposeBait_Large.png',
            'collected': false
          },
          {
            'name': 'Hyoi Pear',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Hyoi_Pear_(TWW).png',
            'collected': false
          },
          {
            'name': 'Complimentary ID',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Complimentary_ID_(TWW).png',
            'collected': false
          },
          {
            'name': 'Fill-Up Coupon',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Fill-Up_Coupon_(TWW).png',
            'collected': false
          },
          {
            'name': 'Cabana Deed',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Cabana_Deed.png',
            'collected': false
          },
          {
            'name': 'Bottle #1',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Bottle_(TWW).png',
            'collected': false
          },
          {
            'name': 'Bottle #2',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Bottle_(TWW).png',
            'collected': false
          },
          {
            'name': 'Bottle #3',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Bottle_(TWW).png',
            'collected': false
          },
          {
            'name': 'Bottle #4',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Bottle_(TWW).png',
            'collected': false
          },
          {
            'name': 'Father\'s Letter',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Father\'s_Letter.png',
            'collected': false
          },
          {
            'name': 'Din\'s Pearl',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Dins_Pearl_(TWW).png',
            'collected': false
          },
          {
            'name': 'Farore\'s Pearl',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Farores_Pearl_(TWW).png',
            'collected': false
          },
          {
            'name': 'Nayru\'s Pearl',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Nayrus_Pearl_(TWW).png',
            'collected': false
          },
          {
            'name': 'Ghost Ship Chart',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Ghost_Ship_Chart_Artwork_(TWW).png',
            'collected': false
          },
          {
            'name': 'Triforce Shard 1',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Triforce_Shard_1_(TWW).png',
            'collected': false
          },
          {
            'name': 'Triforce Shard 2',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Triforce_Shard_2_(TWW).png',
            'collected': false
          },
          {
            'name': 'Triforce Shard 3',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Triforce_Shard_3_(TWW).png',
            'collected': false
          },
          {
            'name': 'Triforce Shard 4',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Triforce_Shard_4_(TWW).png',
            'collected': false
          },
          {
            'name': 'Triforce Shard 5',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Triforce_Shard_5_(TWW).png',
            'collected': false
          },
          {
            'name': 'Triforce Shard 6',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Triforce_Shard_6_(TWW).png',
            'collected': false
          },
          {
            'name': 'Triforce Shard 7',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Triforce_Shard_7_(TWW).png',
            'collected': false
          },
          {
            'name': 'Triforce Shard 8',
            'imgUrl': '../../../../../assets/img/game-items/wwhd/Triforce_Shard_8_(TWW).png',
            'collected': false
          },
        ]});
  }

  public addSkywardSwordData() {
    this.gameItemsCollection.doc('SKYWARD-SWORD').set({
      'items':
        [
          {
            'name': 'Practice Sword',
            'imgUrl': '../../../../../assets/img/game-items/ss/26px-PracticeSword-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Goddess Sword',
            'imgUrl': '../../../../../assets/img/game-items/ss/26px-GoddessSword-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Goddess Longsword',
            'imgUrl': '../../../../../assets/img/game-items/ss/26px-GoddessLongsword-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Goddess White Sword',
            'imgUrl': '../../../../../assets/img/game-items/ss/26px-GoddessWhiteSword-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Master Sword',
            'imgUrl': '../../../../../assets/img/game-items/ss/26px-MasterSword-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'false Master Sword',
            'imgUrl': '../../../../../assets/img/game-items/ss/26px-false-Master-Sword-Icon.png',
            'collected': false
          },
          {
            'name': 'Adventure Pouch',
            'imgUrl': '../../../../../assets/img/game-items/ss/80px-Adventure-Pouch-Model.png',
            'collected': false
          },
          {
            'name': 'Sailcloth',
            'imgUrl': '../../../../../assets/img/game-items/ss/Sailcloth-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Digging Mitts',
            'imgUrl': '../../../../../assets/img/game-items/ss/Digging-Mitts-Icon.png',
            'collected': false
          },
          {
            'name': 'Mogma Mitts',
            'imgUrl': '../../../../../assets/img/game-items/ss/MogmaMitts-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Goddess\'s Harp',
            'imgUrl': '../../../../../assets/img/game-items/ss/Goddess\'sHarp-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Water Dragon Scale',
            'imgUrl': '../../../../../assets/img/game-items/ss/WaterDragonScale-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Fireshield Earrings',
            'imgUrl': '../../../../../assets/img/game-items/ss/FireshieldEarrings-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Small Wallet',
            'imgUrl': '../../../../../assets/img/game-items/ss/SmallWallet-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Medium Wallet',
            'imgUrl': '../../../../../assets/img/game-items/ss/MediumWallet-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Big Wallet',
            'imgUrl': '../../../../../assets/img/game-items/ss/BigWallet-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Extra Wallet',
            'imgUrl': '../../../../../assets/img/game-items/ss/Extra_wallet.png',
            'collected': false
          },
          {
            'name': 'Giant Wallet',
            'imgUrl': '../../../../../assets/img/game-items/ss/GiantWallet-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Tycoon Wallet',
            'imgUrl': '../../../../../assets/img/game-items/ss/TycoonWallet-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Bird Statuette',
            'imgUrl': '../../../../../assets/img/game-items/ss/80px-Bird-Statuette-Box.png',
            'collected': false
          },
          {
            'name': 'Emerald Tablet',
            'imgUrl': '../../../../../assets/img/game-items/ss/80px-Emerald-Tablet.png',
            'collected': false
          },
          {
            'name': 'Ruby Tablet',
            'imgUrl': '../../../../../assets/img/game-items/ss/80px-Rubytablet.png',
            'collected': false
          },
          {
            'name': 'Amber Tablet',
            'imgUrl': '../../../../../assets/img/game-items/ss/80px-Ambertablet.png',
            'collected': false
          },
          {
            'name': 'Life Tree Seedling',
            'imgUrl': '../../../../../assets/img/game-items/ss/Life-Tree-Seedling.png',
            'collected': false
          },
          {
            'name': 'Life Tree Fruit',
            'imgUrl': '../../../../../assets/img/game-items/ss/Life-Tree-Fruit.png',
            'collected': false
          },
          {
            'name': 'Ancient Sea Chart',
            'imgUrl': '../../../../../assets/img/game-items/ss/44px-Ancient-Sea-Chart.png',
            'collected': false
          },
          {
            'name': 'Spirit Vessel Din',
            'imgUrl': '../../../../../assets/img/game-items/ss/33px-Spirit-Vessel-din.png',
            'collected': false
          },
          {
            'name': 'Spirit Vessel Farore',
            'imgUrl': '../../../../../assets/img/game-items/ss/33px-Spirit-Vessel-farore.png',
            'collected': false
          },
          {
            'name': 'Spirit Vessel Nayru',
            'imgUrl': '../../../../../assets/img/game-items/ss/33px-Spirit-Vessel-nayru.png',
            'collected': false
          },
          {
            'name': 'Spirit Vessel',
            'imgUrl': '../../../../../assets/img/game-items/ss/33px-Spirit-Vessel.png',
            'collected': false
          },
          {
            'name': 'Stone Trials',
            'imgUrl': '../../../../../assets/img/game-items/ss/Stone-Trials.png',
            'collected': false
          },
          {
            'name': 'Triforce of Wisdom',
            'imgUrl': '../../../../../assets/img/game-items/ss/Triforce-Piece.png',
            'collected': false
          },
          {
            'name': 'Triforce of Power',
            'imgUrl': '../../../../../assets/img/game-items/ss/Triforce-Piece.png',
            'collected': false
          },
          {
            'name': 'Triforce of Courage',
            'imgUrl': '../../../../../assets/img/game-items/ss/Triforce-Piece.png',
            'collected': false
          },
          {
            'name': 'Wooden Shield',
            'imgUrl': '../../../../../assets/img/game-items/ss/WoodenShield-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Banded Shield',
            'imgUrl': '../../../../../assets/img/game-items/ss/80px-Banded_Shield_SS.png',
            'collected': false
          },
          {
            'name': 'Braced Shield',
            'imgUrl': '../../../../../assets/img/game-items/ss/BracedShield-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Iron Shield',
            'imgUrl': '../../../../../assets/img/game-items/ss/IronShield-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Reinforced Shield',
            'imgUrl': '../../../../../assets/img/game-items/ss/ReinforcedShield-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Fortified Shield',
            'imgUrl': '../../../../../assets/img/game-items/ss/FortifiedShield-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Sacred Shield',
            'imgUrl': '../../../../../assets/img/game-items/ss/65px-SacredShield-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Divine Shield',
            'imgUrl': '../../../../../assets/img/game-items/ss/65px-DivineShield-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Goddess Shield',
            'imgUrl': '../../../../../assets/img/game-items/ss/65px-GoddessShield-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Hylian Shield',
            'imgUrl': '../../../../../assets/img/game-items/ss/80px-Shieldss.jpg',
            'collected': false
          },
          {
            'name': 'Slingshot',
            'imgUrl': '../../../../../assets/img/game-items/ss/61px-SkywardSwordSlingshot.png',
            'collected': false
          },
          {
            'name': 'Scattershot',
            'imgUrl': '../../../../../assets/img/game-items/ss/Scattershot_SS.png',
            'collected': false
          },
          {
            'name': 'Bug-Net',
            'imgUrl': '../../../../../assets/img/game-items/ss/65px-Bug-Net-Icon.png',
            'collected': false
          },
          {
            'name': 'Big-Bug-Net',
            'imgUrl': '../../../../../assets/img/game-items/ss/73px-Big-Bug-Net-Icon.png',
            'collected': false
          },
          {
            'name': 'Beetle',
            'imgUrl': '../../../../../assets/img/game-items/ss/80px-SS_Beetle.png',
            'collected': false
          },
          {
            'name': 'Hook Beetle',
            'imgUrl': '../../../../../assets/img/game-items/ss/76px-HookBeetle-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Quick Beetle',
            'imgUrl': '../../../../../assets/img/game-items/ss/73px-QuickBeetle-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Tough Beetle',
            'imgUrl': '../../../../../assets/img/game-items/ss/69px-ToughBeetle-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Bombs',
            'imgUrl': '../../../../../assets/img/game-items/ss/63px-SSBomb.png',
            'collected': false
          },
          {
            'name': 'Bow',
            'imgUrl': '../../../../../assets/img/game-items/ss/80px-Bow-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Iron Bow',
            'imgUrl': '../../../../../assets/img/game-items/ss/80px-IronBow-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Sacred Bow',
            'imgUrl': '../../../../../assets/img/game-items/ss/80px-SacredBow-SS-Icon.png',
            'collected': false
          },
          {
            'name': 'Gust Bellows',
            'imgUrl': '../../../../../assets/img/game-items/ss/Gust_Bellow.png',
            'collected': false
          },
          {
            'name': 'Whip',
            'imgUrl': '../../../../../assets/img/game-items/ss/SS_Whip2.png',
            'collected': false
          },
          {
            'name': 'Double Clawshots',
            'imgUrl': '../../../../../assets/img/game-items/ss/80px-Double-Clawshots-Model.png',
            'collected': false
          },
          {
            'name': 'Goddess Cube',
            'imgUrl': '../../../../../assets/img/game-items/ss/Goddess-Cube.png',
            'collected': false
          },
          {
            'name': 'Water Basin',
            'imgUrl': '../../../../../assets/img/game-items/ss/Water-Basin.png',
            'collected': false
          },
          {
            'name': 'Key Piece',
            'imgUrl': '../../../../../assets/img/game-items/ss/Piece-Key.png',
            'collected': false
          },
          {
            'name': 'Golden Carving',
            'imgUrl': '../../../../../assets/img/game-items/ss/Golden-Carving.png',
            'collected': false
          },
          {
            'name': 'Dragon Sculpture',
            'imgUrl': '../../../../../assets/img/game-items/ss/Dragon-Sculpture.png',
            'collected': false
          },
          {
            'name': 'Ancient Circuit',
            'imgUrl': '../../../../../assets/img/game-items/ss/Ancient-Circuit.png',
            'collected': false
          },
          {
            'name': 'Blessed Idol',
            'imgUrl': '../../../../../assets/img/game-items/ss/Blessed-Idol.png',
            'collected': false
          },
          {
            'name': 'Squid Carving',
            'imgUrl': '../../../../../assets/img/game-items/ss/Squid-Carving.png',
            'collected': false
          },
          {
            'name': 'Mysterious Crystals',
            'imgUrl': '../../../../../assets/img/game-items/ss/Mysterious-Crystals.png',
            'collected': false
          },
        ]});
  }

  public addLinksAwakeningRemakeData() {
    this.gameItemsCollection.doc('LINKS-AWAKENING-SWITCH').set({
      'items':
        [
          {
            'name': 'Shield',
            'imgUrl': '../../../../../assets/img/game-items/lasr/55px-LANS_Shield_Model.png',
            'collected': false
          },
          {
            'name': 'Sword',
            'imgUrl': '../../../../../assets/img/game-items/lasr/26px-LANS_Sword_Model.png',
            'collected': false
          },
          {
            'name': 'Bomb',
            'imgUrl': '../../../../../assets/img/game-items/lasr/44px-LANS_Bomb_Model.png',
            'collected': false
          },
          {
            'name': 'Boomerang',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Boomerang_Model.png',
            'collected': false
          },
          {
            'name': 'Bow',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Bow_Model.png',
            'collected': false
          },
          {
            'name': 'Fairy Bottle',
            'imgUrl': '../../../../../assets/img/game-items/lasr/51px-LANS_Fairy_Bottle_Model.png',
            'collected': false
          },
          {
            'name': 'Hookshot',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Hookshot_Model.png',
            'collected': false
          },
          {
            'name': 'Koholint Sword',
            'imgUrl': '../../../../../assets/img/game-items/lasr/26px-LANS_Koholint_Sword_Model.png',
            'collected': false
          },
          {
            'name': 'Magic Powder',
            'imgUrl': '../../../../../assets/img/game-items/lasr/44px-LANS_Magic_Powder_Model.png',
            'collected': false
          },
          {
            'name': 'Magical Rod',
            'imgUrl': '../../../../../assets/img/game-items/lasr/24px-LANS_Magic_Rod_Model.png',
            'collected': false
          },
          {
            'name': 'Mirror Shield',
            'imgUrl': '../../../../../assets/img/game-items/lasr/54px-LANS_Mirror_Shield_Model.png',
            'collected': false
          },
          {
            'name': 'Ocarina',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Ocarina_Model.png',
            'collected': false
          },
          {
            'name': 'Pegasus Boots',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Pegasus_Boots_Model.png',
            'collected': false
          },
          {
            'name': 'Power Bracelet',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Power_Bracelet_Model.png',
            'collected': false
          },
          {
            'name': 'Powerful Bracelet',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Powerful_Bracelet_Model.png',
            'collected': false
          },
          {
            'name': 'Roc\'s Feather',
            'imgUrl': '../../../../../assets/img/game-items/lasr/42px-LANS_Roc\'s_Feather_Model.png',
            'collected': false
          },
          {
            'name': 'Shovel',
            'imgUrl': '../../../../../assets/img/game-items/lasr/31px-LANS_Shovel_Model.png',
            'collected': false
          },
          {
            'name': 'Angler Key',
            'imgUrl': '../../../../../assets/img/game-items/lasr/35px-LANS_Angler_Key_Model.png',
            'collected': false
          },
          {
            'name': 'Bird Key',
            'imgUrl': '../../../../../assets/img/game-items/lasr/34px-LANS_Bird_Key_Model.png',
            'collected': false
          },
          {
            'name': 'Face Key',
            'imgUrl': '../../../../../assets/img/game-items/lasr/32px-LANS_Face_Key_Model.png',
            'collected': false
          },
          {
            'name': 'Slime Key',
            'imgUrl': '../../../../../assets/img/game-items/lasr/26px-LANS_Slime_Key_Model.png',
            'collected': false
          },
          {
            'name': 'Tail Key',
            'imgUrl': '../../../../../assets/img/game-items/lasr/25px-LANS_Tail_Key_Model.png',
            'collected': false
          },
          {
            'name': 'Conch Horn',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Conch_Horn_Model.png',
            'collected': false
          },
          {
            'name': 'Coral Triangle',
            'imgUrl': '../../../../../assets/img/game-items/lasr/51px-LANS_Coral_Triangle_Model.png',
            'collected': false
          },
          {
            'name': 'Full Moon Cello',
            'imgUrl': '../../../../../assets/img/game-items/lasr/31px-LANS_Full_Moon_Cello_Model.png',
            'collected': false
          },
          {
            'name': 'Organ of Evening Calm',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Organ_of_Evening_Calm_Model.png',
            'collected': false
          },
          {
            'name': 'Sea Lily\'s Bell',
            'imgUrl': '../../../../../assets/img/game-items/lasr/42px-LANS_Sea_Lily\'s_Bell_Model.png',
            'collected': false
          },
          {
            'name': 'Surf Harp',
            'imgUrl': '../../../../../assets/img/game-items/lasr/53px-LANS_Surf_Harp_Model.png',
            'collected': false
          },
          {
            'name': 'Thunder Drum',
            'imgUrl': '../../../../../assets/img/game-items/lasr/52px-LANS_Thunder_Drum_Model.png',
            'collected': false
          },
          {
            'name': 'Wind Marimba',
            'imgUrl': '../../../../../assets/img/game-items/lasr/62px-LANS_Wind_Marimba_Model.png',
            'collected': false
          },
          {
            'name': 'Yoshi Doll',
            'imgUrl': '../../../../../assets/img/game-items/lasr/38px-LANS_Yoshi_Doll_Model.png',
            'collected': false
          },
          {
            'name': 'Yoshi Doll 🠊 Ribbon',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Ribbon_Model.png',
            'collected': false
          },
          {
            'name': 'Ribbon 🠊 Dog Food',
            'imgUrl': '../../../../../assets/img/game-items/lasr/62px-LANS_Dog_Food_Model.png',
            'collected': false
          },
          {
            'name': 'Dog Food 🠊 Bananas',
            'imgUrl': '../../../../../assets/img/game-items/lasr/60px-LANS_Bananas_Model.png',
            'collected': false
          },
          {
            'name': 'Bananas 🠊 Stick',
            'imgUrl': '../../../../../assets/img/game-items/lasr/23px-LANS_Stick_Model.png',
            'collected': false
          },
          {
            'name': 'Stick 🠊 Beehive',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Honeycomb_Model.png',
            'collected': false
          },
          {
            'name': 'Beehive 🠊 Pineapple',
            'imgUrl': '../../../../../assets/img/game-items/lasr/38px-LANS_Pineapple_Model.png',
            'collected': false
          },
          {
            'name': 'Pineapple 🠊 Hibiscus',
            'imgUrl': '../../../../../assets/img/game-items/lasr/62px-LANS_Hibiscus_Model.png',
            'collected': false
          },
          {
            'name': 'Hibiscus 🠊 Goat\'s Letter',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Goat\'s_Letter_Model.png',
            'collected': false
          },
          {
            'name': 'Goat\'s Letter 🠊 Broom',
            'imgUrl': '../../../../../assets/img/game-items/lasr/24px-LANS_Broom_Model.png',
            'collected': false
          },
          {
            'name': 'Broom 🠊 Fishing Hook',
            'imgUrl': '../../../../../assets/img/game-items/lasr/40px-LANS_Fishing_Hook_Model.png',
            'collected': false
          },
          {
            'name': 'Fishing Hook 🠊 Necklace',
            'imgUrl': '../../../../../assets/img/game-items/lasr/59px-LANS_Necklace_Model.png',
            'collected': false
          },
          {
            'name': 'Necklace 🠊 Scale',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Scale_Model.png',
            'collected': false
          },
          {
            'name': 'Scale 🠊 Magnifying Lens',
            'imgUrl': '../../../../../assets/img/game-items/lasr/35px-LANS_Magnifying_Lens_Model.png',
            'collected': false
          },
          {
            'name': 'Flippers',
            'imgUrl': '../../../../../assets/img/game-items/lasr/36px-LANS_Flippers_Model.png',
            'collected': false
          },
          {
            'name': 'Golden Leaf #1',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Golden_Leaf_Model.png',
            'collected': false
          },
          {
            'name': 'Golden Leaf #2',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Golden_Leaf_Model.png',
            'collected': false
          },
          {
            'name': 'Golden Leaf #3',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Golden_Leaf_Model.png',
            'collected': false
          },
          {
            'name': 'Golden Leaf #4',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Golden_Leaf_Model.png',
            'collected': false
          },
          {
            'name': 'Golden Leaf #5',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Golden_Leaf_Model.png',
            'collected': false
          },
          {
            'name': 'Seashell Sensor',
            'imgUrl': '../../../../../assets/img/game-items/lasr/24px-LANS_Seashell_Sensor_Model.png',
            'collected': false
          },
          {
            'name': 'Secret Medicine',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Secret_Medicine_Model.png',
            'collected': false
          },
          {
            'name': 'Sleepy Toadstool',
            'imgUrl': '../../../../../assets/img/game-items/lasr/55px-LANS_Sleepy_Toadstool_Model.png',
            'collected': false
          },
          {
            'name': 'Middleweight Lure',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Middleweight_Lure_Model.png',
            'collected': false
          },
          {
            'name': 'Heavyweight Lure',
            'imgUrl': '../../../../../assets/img/game-items/lasr/64px-LANS_Heavyweight_Lure_Model.png',
            'collected': false
          },
        ]});
  }

  public addOcarinaOfTimeData() {
    this.gameItemsCollection.doc('OCARINA-OF-TIME').set({
      'items':
        [
          {
            'name': 'Kokiri Tunic',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Kokiri_Tunic_Icon.png',
            'collected': false
          },
          {
            'name': 'Kokiri Boots',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Kokiri_Boots_Icon.png',
            'collected': false
          },
          {
            'name': 'Kokiri Sword',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Kokiri_Sword_Icon.png',
            'collected': false
          },
          {
            'name': 'Deku Shield',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Deku_Shield_Icon.png',
            'collected': false
          },
          {
            'name': 'Deku Stick',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Deku_Stick_Icon.png',
            'collected': false
          },
          {
            'name': 'Deku Nut',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Deku_Nut_Icon.png',
            'collected': false
          },
          {
            'name': 'Fairy Slingshot',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Fairy_Slingshot_Icon.png',
            'collected': false
          },
          {
            'name': 'Kokiri\'s Emerald',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Kokiri\'s_Emerald_Icon.png',
            'collected': false
          },
          {
            'name': 'Fairy Ocarina',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Fairy_Ocarina_Icon.png',
            'collected': false
          },
          {
            'name': 'Weird Egg',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Weird_Egg_Icon.png',
            'collected': false
          },
          {
            'name': 'Cucco',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Cucco_Icon.png',
            'collected': false
          },
          {
            'name': 'Zelda\'s Letter',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Zelda\'s_Letter_Icon.png',
            'collected': false
          },
          {
            'name': 'Hylian Shield',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Hylian_Shield_Icon.png',
            'collected': false
          },
          {
            'name': 'Bottle',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Bottle_Icon.png',
            'collected': false
          },
          {
            'name': 'Goron\'s Bracelet',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Goron_Bracelet_Icon.png',
            'collected': false
          },
          {
            'name': 'Bomb Bag',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Bomb_Bag_Icon.png',
            'collected': false
          },
          {
            'name': 'Bomb',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Bomb_Icon.png',
            'collected': false
          },
          {
            'name': 'Goron\'s Ruby',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Goron\'s_Ruby_Icon.png',
            'collected': false
          },
          {
            'name': 'Magic Bean',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Magic_Bean_Icon.png',
            'collected': false
          },
          {
            'name': 'Silver Scale',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Silver_Scale_Icon.png',
            'collected': false
          },
          {
            'name': 'Ruto\'s Letter',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Ruto\'s_Letter_Icon.png',
            'collected': false
          },
          {
            'name': 'Fish',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Fish_Icon.png',
            'collected': false
          },
          {
            'name': 'Boomerang',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Boomerang_Icon.png',
            'collected': false
          },
          {
            'name': 'Zora\'s Sapphire',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Zora\'s_Sapphire_Icon.png',
            'collected': false
          },
          {
            'name': 'Ocarina of Time',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Ocarina_of_Time_Icon.png',
            'collected': false
          },
          {
            'name': 'Master Sword',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Master_Sword_Icon.png',
            'collected': false
          },
          {
            'name': 'Hookshot',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Hookshot_Icon.png',
            'collected': false
          },
          {
            'name': 'Fairy Bow',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Fairy_Bow_Icon.png',
            'collected': false
          },
          {
            'name': 'Megaton Hammer',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Megaton_Hammer_Icon.png',
            'collected': false
          },
          {
            'name': 'Longshot',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Longshot_Icon.png',
            'collected': false
          },
          {
            'name': 'Lens of Truth',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Lens_of_Truth_Icon.png',
            'collected': false
          },
          {
            'name': 'Fire Arrow',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Fire_Arrow_Icon.png',
            'collected': false
          },
          {
            'name': 'Ice Arrow',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Ice_Arrow_Icon.png',
            'collected': false
          },
          {
            'name': 'Light Arrow',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Light_Arrow_Icon.png',
            'collected': false
          },
          {
            'name': 'Din\'s Fire',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Din\'s_Fire_Icon.png',
            'collected': false
          },
          {
            'name': 'Farore\'s Wind',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Farore\'s_Wind_Icon.png',
            'collected': false
          },
          {
            'name': 'Nayru\'s Love',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Nayru\'s_Love_Icon.png',
            'collected': false
          },
          {
            'name': 'Biggoron Sword',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Biggoron\'s_Sword_Icon.png',
            'collected': false
          },
          {
            'name': 'Goron Tunic',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Goron_Tunic_Icon.png',
            'collected': false
          },
          {
            'name': 'Zora Tunic',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Zora_Tunic_Icon.png',
            'collected': false
          },
          {
            'name': 'Iron Boots',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Iron_Boots_Icon.png',
            'collected': false
          },
          {
            'name': 'Hover Boots',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Hover_Boots_Icon.png',
            'collected': false
          },
          {
            'name': 'Mirror Shield',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Mirror_Shield_Icon.png',
            'collected': false
          },
          {
            'name': 'Silver Gauntlets',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Silver_Gauntlets_Icon.png',
            'collected': false
          },
          {
            'name': 'Golden Gauntlets',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Golden_Gauntlets_Icon.png',
            'collected': false
          },
          {
            'name': 'Adult\'s Wallet',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Adult\'s_Wallet_Icon.png',
            'collected': false
          },
          {
            'name': 'Giant\'s Wallet',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Giant\'s_Wallet_Icon.png',
            'collected': false
          },
          {
            'name': 'Golden Scale',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Golden_Scale_Icon.png',
            'collected': false
          },
          {
            'name': 'Light Medallion',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Light_Medallion_Icon.png',
            'collected': false
          },
          {
            'name': 'Forest Medallion',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Forest_Medallion_Icon.png',
            'collected': false
          },
          {
            'name': 'Fire Medallion',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Fire_Medallion_Icon.png',
            'collected': false
          },
          {
            'name': 'Water Medallion',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Water_Medallion_Icon.png',
            'collected': false
          },
          {
            'name': 'Spirit Medallion',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Spirit_Medallion_Icon.png',
            'collected': false
          },
          {
            'name': 'Shadow Medallion',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Shadow_Medallion_Icon.png',
            'collected': false
          },
          {
            'name': 'Stone of Agony',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT_Stone_of_Agony_Icon.png',
            'collected': false
          },
          {
            'name': 'Shard of Agony',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Shard_of_Agony_Icon.png',
            'collected': false
          },
          {
            'name': 'Gerudo Token',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Gerudo_Token_Icon.png',
            'collected': false
          },
          {
            'name': 'Golden Skulltula Token',
            'imgUrl': '../../../../../assets/img/game-items/oot/OoT3D_Token_Icon.png',
            'collected': false
          },
        ]});
  }

  public addLinkToThePastData() {
    this.gameItemsCollection.doc('LINK-TO-THE-PAST').set({
      'items':
        [
          {
            'name': 'Green Clothes',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Green_Clothes_Sprite.png',
            'collected': false
          },
          {
            'name': 'Fighter\'s Sword',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Fighter\'s_Sword_Sprite.png',
            'collected': false
          },
          {
            'name': 'Fighter\'s Shield',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Fighter\'s_Shield_Sprite.png',
            'collected': false
          },
          {
            'name': 'Bow',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Bow_&_Arrows_Sprite.png',
            'collected': false
          },
          {
            'name': 'Pendant of Courage',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Pendant_of_Courage_Sprite.png',
            'collected': false
          },
          {
            'name': 'Power Glove',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Power_Glove_Sprite.png',
            'collected': false
          },
          {
            'name': 'Book of Mudora',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Book_of_Mudora_Sprite.png',
            'collected': false
          },
          {
            'name': 'Pendant of Power',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Pendant_of_Power_Sprite.png',
            'collected': false
          },
          {
            'name': 'Moon Pearl',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Moon_Pearl_Sprite.png',
            'collected': false
          },
          {
            'name': 'Pendant of Wisdom',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Pendant_of_Wisdom_Sprite.png',
            'collected': false
          },
          {
            'name': 'Master Sword',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Master_Sword_Sprite.png',
            'collected': false
          },
          {
            'name': 'Master Sword Lv2',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Master_Sword_Lv2_Sprite.png',
            'collected': false
          },
          {
            'name': 'Master Sword Lv3',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Master_Sword_Lv3_Sprite.png',
            'collected': false
          },
          {
            'name': 'Red Shield',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Red_Shield_Sprite.png',
            'collected': false
          },
          {
            'name': 'Mirror Shield',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Mirror_Shield_Sprite.png',
            'collected': false
          },
          {
            'name': 'Blue Mail',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Blue_Mail_Sprite.png',
            'collected': false
          },
          {
            'name': 'Red Mail',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Red_Mail_Sprite.png',
            'collected': false
          },
          {
            'name': 'Pegasus Shoes',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Pegasus_Shoes_Sprite.png',
            'collected': false
          },
          {
            'name': 'Titan\'s Mitt',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Titan\'s_Mitt_Sprite.png',
            'collected': false
          },
          {
            'name': 'Zora\'s Flippers',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Zora\'s_Flippers_Sprite.png',
            'collected': false
          },
          {
            'name': 'Silver Arrows',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Bow_&_Silver_Arrows_Sprite.png',
            'collected': false
          },
          {
            'name': 'Boomerang',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Boomerang_Sprite.png',
            'collected': false
          },
          {
            'name': 'Magical Boomerang',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Magical_Boomerang_Sprite.png',
            'collected': false
          },
          {
            'name': 'Hookshot',
            'imgUrl': '../../../../../assets/img/game-items/lttp/Hookshot.png',
            'collected': false
          },
          {
            'name': 'Bombs',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Bomb_Sprite.png',
            'collected': false
          },
          {
            'name': 'Mushroom',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Mushroom_Sprite.png',
            'collected': false
          },
          {
            'name': 'Magic Powder',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Magic_Powder_Sprite.png',
            'collected': false
          },
          {
            'name': 'Fire Rod',
            'imgUrl': '../../../../../assets/img/game-items/lttp/FireRod.png',
            'collected': false
          },
          {
            'name': 'Ice Rod',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Ice_Rod_Sprite.png',
            'collected': false
          },
          {
            'name': 'Bombos Medallion',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Bombos_Medallion_Sprite.png',
            'collected': false
          },
          {
            'name': 'Ether Medallion',
            'imgUrl': '../../../../../assets/img/game-items/lttp/Ether.png',
            'collected': false
          },
          {
            'name': 'Quake Medallion',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Quake_Medallion_Sprite.png',
            'collected': false
          },
          {
            'name': 'Lantern',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Lantern_Sprite.png',
            'collected': false
          },
          {
            'name': 'Hammer',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Hammer_Sprite.png',
            'collected': false
          },
          {
            'name': 'Shovel',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Shovel_Sprite.png',
            'collected': false
          },
          {
            'name': 'Ocarina',
            'imgUrl': '../../../../../assets/img/game-items/lttp/Flute.png',
            'collected': false
          },
          {
            'name': 'Bug-Catching Net',
            'imgUrl': '../../../../../assets/img/game-items/lttp/Bug-CatchingNet.png',
            'collected': false
          },
          {
            'name': 'Magic Bottle',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Magic_Bottle_Sprite.png',
            'collected': false
          },
          {
            'name': 'Cane of Somaria',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Cane_of_Somaria_Sprite.png',
            'collected': false
          },
          {
            'name': 'Cane of Byrna',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Cane_of_Byrna_Sprite.png',
            'collected': false
          },
          {
            'name': 'Magic Cape',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Magic_Cape_Sprite.png',
            'collected': false
          },
          {
            'name': 'Magic Mirror',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Magic_Mirror_Sprite.png',
            'collected': false
          },
          {
            'name': 'Super Bomb',
            'imgUrl': '../../../../../assets/img/game-items/lttp/SuperBomb.png',
            'collected': false
          },
          {
            'name': 'Golden Bee',
            'imgUrl': '../../../../../assets/img/game-items/lttp/ALttP_Bee_Sprite.png',
            'collected': false
          },
          {
            'name': 'Crystal #1',
            'imgUrl': '../../../../../assets/img/game-items/lttp/CrystalMaiden.gif',
            'collected': false
          },
          {
            'name': 'Crystal #2',
            'imgUrl': '../../../../../assets/img/game-items/lttp/CrystalMaiden.gif',
            'collected': false
          },
          {
            'name': 'Crystal #3',
            'imgUrl': '../../../../../assets/img/game-items/lttp/CrystalMaiden.gif',
            'collected': false
          },
          {
            'name': 'Crystal #4',
            'imgUrl': '../../../../../assets/img/game-items/lttp/CrystalMaiden.gif',
            'collected': false
          },
          {
            'name': 'Crystal #5',
            'imgUrl': '../../../../../assets/img/game-items/lttp/CrystalMaiden.gif',
            'collected': false
          },
          {
            'name': 'Crystal #6',
            'imgUrl': '../../../../../assets/img/game-items/lttp/CrystalMaiden.gif',
            'collected': false
          },
          {
            'name': 'Crystal #7',
            'imgUrl': '../../../../../assets/img/game-items/lttp/CrystalMaiden.gif',
            'collected': false
          },
        ]});
  }

  public addBreathOfTheWildData() {
    this.gameItemsCollection.doc('BREATH-OF-THE-WILD').set({
      'items':
        [
          {
            'name': 'Sheikah Slate',
            'imgUrl': '../../../../../assets/img/game-items/botw/40px-BotW_Sheikah_Slate_Icon.png',
            'collected': false
          },
          {
            'name': 'Round Bomb Rune',
            'imgUrl': '../../../../../assets/img/game-items/botw/64px-BotW_Remote_Bomb_Rune_Icon.png',
            'collected': false
          },
          {
            'name': 'Square Bomb Rune',
            'imgUrl': '../../../../../assets/img/game-items/botw/64px-BotW_Remote_Bomb_Rune_Icon_2.png',
            'collected': false
          },
          {
            'name': 'Magnesis Rune',
            'imgUrl': '../../../../../assets/img/game-items/botw/64px-BotW_Magnesis_Rune_Icon.png',
            'collected': false
          },
          {
            'name': 'Stasis Rune',
            'imgUrl': '../../../../../assets/img/game-items/botw/64px-BotW_Stasis_Rune_Icon.png',
            'collected': false
          },
          {
            'name': 'Cryonis Rune',
            'imgUrl': '../../../../../assets/img/game-items/botw/64px-BotW_Cryonis_Rune_Icon.png',
            'collected': false
          },
          {
            'name': 'Camera Rune',
            'imgUrl': '../../../../../assets/img/game-items/botw/64px-BotW_Camera_Rune_Icon.png',
            'collected': false
          },
          {
            'name': 'Master Cycle Zero Rune',
            'imgUrl': '../../../../../assets/img/game-items/botw/64px-BotW_Master_Cycle_Zero_Rune_Icon.png',
            'collected': false
          },
          {
            'name': 'amiibo Rune',
            'imgUrl': '../../../../../assets/img/game-items/botw/64px-BotW_amiibo_Rune_Icon.png',
            'collected': false
          },
          {
            'name': 'Paraglider',
            'imgUrl': '../../../../../assets/img/game-items/botw/40px-BotW_Paraglider_Icon.png',
            'collected': false
          },
          {
            'name': 'Master Sword',
            'imgUrl': '../../../../../assets/img/game-items/botw/BotW_Master_Sword_Icon.png',
            'collected': false
          },
          {
            'name': 'Bow of Light',
            'imgUrl': '../../../../../assets/img/game-items/botw/BotW_Bow_of_Light_Icon.png',
            'collected': false
          },
          {
            'name': 'Hylian Shield',
            'imgUrl': '../../../../../assets/img/game-items/botw/BotW_Hylian_Shield_Icon.png',
            'collected': false
          },
          {
            'name': 'Champion\'s Tunic',
            'imgUrl': '../../../../../assets/img/game-items/botw/BotW_Champion\'s_Tunic_Icon.png',
            'collected': false
          },
          {
            'name': 'Flamebreaker Set',
            'imgUrl': '../../../../../assets/img/game-items/botw/96px-BotW_Link_Wearing_Flamebreaker_Set.jpg',
            'collected': false
          },
          {
            'name': 'Gerudo Set',
            'imgUrl': '../../../../../assets/img/game-items/botw/106px-BotW_Link_Wearing_Gerudo_Set.jpg',
            'collected': false
          },
          {
            'name': 'Snowquill Set',
            'imgUrl': '../../../../../assets/img/game-items/botw/105px-BotW_Link_Wearing_Snowquill_Set.jpg',
            'collected': false
          },
          {
            'name': 'Zora Set',
            'imgUrl': '../../../../../assets/img/game-items/botw/103px-BotW_Link_Wearing_Zora_Set.jpg',
            'collected': false
          },
          {
            'name': 'Thunder Helm',
            'imgUrl': '../../../../../assets/img/game-items/botw/BotW_Thunder_Helm_Key_Item_Icon.png',
            'collected': false
          },
          {
            'name': 'Mipha\'s Grace',
            'imgUrl': '../../../../../assets/img/game-items/botw/40px-BotW_Mipha\'s_Grace_Icon.png',
            'collected': false
          },
          {
            'name': 'Mipha\'s Grace ＋',
            'imgUrl': '../../../../../assets/img/game-items/botw/40px-BotW_Mipha\'s_Grace_＋_Icon.png',
            'collected': false
          },
          {
            'name': 'Revali\'s Gale',
            'imgUrl': '../../../../../assets/img/game-items/botw/50px-BotW_Revali\'s_Gale_Icon.png',
            'collected': false
          },
          {
            'name': 'Revali\'s Gale ＋',
            'imgUrl': '../../../../../assets/img/game-items/botw/50px-BotW_Revali\'s_Gale_＋_Icon.png',
            'collected': false
          },
          {
            'name': 'Daruk\'s_Protection',
            'imgUrl': '../../../../../assets/img/game-items/botw/50px-BotW_Daruk\'s_Protection_Icon.png',
            'collected': false
          },
          {
            'name': 'Daruk\'s Protection ＋',
            'imgUrl': '../../../../../assets/img/game-items/botw/50px-BotW_Daruk\'s_Protection_＋_Icon.png',
            'collected': false
          },
          {
            'name': 'Urbosa\'s_Fury',
            'imgUrl': '../../../../../assets/img/game-items/botw/50px-BotW_Urbosa\'s_Fury_Icon.png',
            'collected': false
          },
          {
            'name': 'Urbosa\'s Fury ＋',
            'imgUrl': '../../../../../assets/img/game-items/botw/50px-BotW_Urbosa\'s_Fury_＋_Icon.png',
            'collected': false
          },
          {
            'name': 'Hestu\'s Maracas',
            'imgUrl': '../../../../../assets/img/game-items/botw/40px-BotW_Hestu\'s_Maracas_Icon.png',
            'collected': false
          },
          {
            'name': 'Travel Medallion',
            'imgUrl': '../../../../../assets/img/game-items/botw/BotW_Travel_Medallion_Icon.png',
            'collected': false
          },
        ]});
  }

}
