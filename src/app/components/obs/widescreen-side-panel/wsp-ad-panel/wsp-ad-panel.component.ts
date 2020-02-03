import { Component, OnInit } from '@angular/core';
import {interval, Observable} from 'rxjs';

@Component({
  selector: 'app-wsp-ad-panel',
  templateUrl: './wsp-ad-panel.component.html',
  styleUrls: ['./wsp-ad-panel.component.css']
})
export class WspAdPanelComponent implements OnInit {
  public charityLogoUrl: string;
  public charityLogoSwap: boolean;
  private secondsCounter$: Observable<any>;

  public bgImageIndex = 0;
  public bgImageUrls: String[] = [];

  constructor() {
    this.charityLogoSwap = true;
    this.updateCharityLogoUrl();
    this.secondsCounter$ = interval(1000 * 15);
  }

  ngOnInit() {
    this.secondsCounter$.subscribe(n => {
      this.updateCharityLogoUrl();
    });
    this.bgImageUrls = this.getBackgroundImageUrls();
  }

  updateCharityLogoUrl(): void {
    if (this.charityLogoSwap) {
      this.charityLogoUrl = '../../../../assets/img/logo-specialeffect.png';
      this.updateBgImage();
    } else {
      this.charityLogoUrl = '../../../../assets/img/GB20_logo_for_website.png';
    }
    this.charityLogoSwap = !this.charityLogoSwap;
  }

  getBackgroundImageUrls(): String[] {
    const imageUrls: String[] = [];
    // ZELDA ARTWORK IMAGES
    imageUrls.push('url("../../../../../assets/img/obs-bg/botw_jeremy_fenske.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/loz_ghibli.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/loz2_ghibli.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/loz3_ghibli.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/ltop_bg.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/mm_bg.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/Links_Artwork.png")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/windwaker_hd_world_art.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/the_legend_of_zelda_links_awakening_key_art-920x518.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/The Legend of Zelda - The Wind Waker art - feeding the birds.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/oot_bg.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/ss_bg.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/ss_bg.png")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/0caca4a757307e3c3690bec1c4e09c24.png")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/5c86d1a5b1afe0b7cbb10f580d194214.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/7abc3dbae5c5d86ac4a889ec68ef91c5.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/44fa1bb169a3a25e100e5e233f1a436a.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/125e85f60111c34a0ccc91f3a8d7653f.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/3591a2525e05894eeb4206b22b400ea8.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/7152886afdadf5d2d847444314ebacd7.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/artwork-the-legend-of-zelda-the-legend-of-zelda-skyward-sword-link-wallpaper-preview.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/fe7c428ea22190d60798f281b5046f54.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/tumblr_pqy65jjn8k1v3330oo1_1280.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/tumblr_pqy65jjn8k1v3330oo2_1280.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/tumblr_pqy65jjn8k1v3330oo3_1280.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/tumblr_pqy65jjn8k1v3330oo4_1280.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/tumblr_pqy65jjn8k1v3330oo6_1280.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/tumblr_pqy65jjn8k1v3330oo7_1280.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/tumblr_pv0lscRUpQ1sf03xgo1_1280.png")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/zelda-links-awakening-art.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/833sfdgdsfghdsfg458.png")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/tp1_bg.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/tp2_bg.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/tp3_bg.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/tp4_bg.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/zelda_2_barba_bg.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/ww2_bg.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/ww_bg.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/Zelda-DLC-header.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/Zelda-header.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/oot2_bg.jpg")');
    // SPECIAL EFFECT IMAGES
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/5hfgyufk8.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/1310-1024x576.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/20170930_STP003_0.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/ajaygameblast.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/disabled_gamers_1550906990.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/DzIZDVaX4AQXHMn.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/DzIZEwXWsAAxCQW.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/ea-blog-image-specialeffect-2.jpg.adapt.crop16x9.1023w.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/screen-shot-2018-01-22-at-9-55-31-am-e1516643821150.png")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/specialeffect_picjpeg.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/specialeffectcontr_610.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/Xbox-Adaptive-Controller-Microsoft-experimenta-4-800x675.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/zephyrus3.jpg")');
    return imageUrls;
  }

  updateBgImage(): void {
    setTimeout(data => {
      this.bgImageIndex = this.bgImageIndex <= this.bgImageUrls.length ? this.getRandomInt(this.bgImageUrls.length) : 0;
    }, 1000 * 5);
  }

  getRandomInt(max: number) {
    return Math.floor(Math.random() * Math.floor(max));
  }

}
