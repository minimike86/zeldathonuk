import { Component, OnInit } from '@angular/core';
import {interval, Observable, of} from 'rxjs';
import {concatMap, delay, map, takeWhile} from 'rxjs/operators';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import {DonationHighlightService} from '../../../../services/firebase/donation-highlight-service/donation-highlight-service.service';
import {
  HighlightedDonation,
  HighlightedDonationId
} from '../../../../services/firebase/donation-tracking/tracked-donation';

@Component({
  selector: 'app-ssp-ad-panel',
  templateUrl: './ssp-ad-panel.component.html',
  styleUrls: ['./ssp-ad-panel.component.css']
})
export class SspAdPanelComponent implements OnInit {
  public charityLogoUrl: string;
  public charityLogoSwap: boolean;
  private secondsCounter$: Observable<any>;

  public bgImageIndex = 0;
  public bgImageUrls: String[] = [];

  public timeAgo: TimeAgo;
  public donationHighlight$: Observable<HighlightedDonation>;

  constructor( private donationHighlightService: DonationHighlightService ) {
    this.charityLogoSwap = true;
    this.updateCharityLogoUrl();
    this.secondsCounter$ = interval(1000 * 15);
  }

  ngOnInit() {
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB');

    this.secondsCounter$.subscribe(n => {
      this.updateCharityLogoUrl();
    });

    this.donationHighlight$ = this.donationHighlightService.getHighlightedDonation().pipe(
      map((trackedDonationIds: HighlightedDonationId[]) => trackedDonationIds.find(x => x.id === 'HIGHLIGHT-DONATION')),
      concatMap((highlightedDonations: HighlightedDonation) => of(highlightedDonations).pipe(
        takeWhile((trackedDonation: HighlightedDonation) => trackedDonation.donation !== undefined),
        delay(1 * 1000),
        map((trackedDonation: HighlightedDonation) => {
          console.log('donationHighlight$', trackedDonation);
          if (trackedDonation.donation != null) {
            // replace imgUrl if it is undefined
            trackedDonation.donation.imgUrl = (trackedDonation.donation.imgUrl !== 'undefined')
              ? trackedDonation.donation?.imgUrl
              : this.getRandomThumbnailImageUrl();
          }
          return trackedDonation;
        }),
      ))
    );

    this.bgImageUrls = this.getBackgroundImageUrls();
  }

  updateCharityLogoUrl(): void {
    if (this.charityLogoSwap) {
      this.charityLogoUrl = '../../../../assets/img/logo-specialeffect.png';
      this.updateBgImage();
    } else {
      this.charityLogoUrl = '../../../../assets/img/GB21_logo_for_website.png';
    }
    this.charityLogoSwap = !this.charityLogoSwap;
  }

  getBackgroundImageUrls(): String[] {
    const imageUrls: String[] = [];
    // ZELDATHON TEAM
    imageUrls.push('url("../../../../../assets/img/obs-team/304033_174345772646092_2089677901_n.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-team/470559_287752961305372_1293519474_o.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-team/901591_455444951202838_207106665_o.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-team/903837_455445134536153_340454438_o.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-team/15940510_1232235973523728_1243498660112768403_n.png")');
    imageUrls.push('url("../../../../../assets/img/obs-team/20190122_023316.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-team/52797088_2087154738031843_4432511626494607360_o.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-team/D0N20WEWkAIoQR9.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-team/MikeWarnerjpggallery.jpg")');
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
    imageUrls.push('url("../../../../../assets/img/obs-bg/EQFV1P4U4AEMBhG.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/EQFV2QoU8AAsiGM.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/EQFVz-PVUAEGpUM.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/HEvAqqv.png")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/EsHr6JBXMAE9sxV.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-bg/EtpZSlGUcAMyNSC.jpg")');
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
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/4635A86700000578-0-Special_Effect_use_technology_to_help_people_with_physical_disab-a-41_1510332144579.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/derrydsgadfgsdfhfgikdtyhusdfbcvbdstyweb.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/hqdegfhfghfghrtykjuluolkfault.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/im-a-gamer-now-meet-the-charity-thats-helping-the-disabled-get-into-gaming-501-body-image-1445522988-size_1000.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/sdcpojwpeioutrqoingvadftgerbookJumbo.jpg")');
    imageUrls.push('url("../../../../../assets/img/obs-specialeffect/specialeffehfgkhjkljgklghjkfgnfgvbsdying.jpg")');
    return imageUrls;
  }

  getRandomThumbnailImageUrl(): string {
    const imageUrls: string[] = [];
    imageUrls.push('../../../assets/img/thumbnails/ww-link-tingle.jpg');
    imageUrls.push('../../../assets/img/thumbnails/ss-fi-floating.jpg');
    imageUrls.push('../../../assets/img/thumbnails/oot-saria-avatar.jpg');
    imageUrls.push('../../../assets/img/thumbnails/botw-archer-link.jpg');
    imageUrls.push('../../../assets/img/thumbnails/botw-zelda-flower.jpg');
    imageUrls.push('../../../assets/img/thumbnails/z2-return-of-ganon.png');
    imageUrls.push('../../../assets/img/thumbnails/alttp-gannon-fight.jpg');
    imageUrls.push('../../../assets/img/thumbnails/tp-ganondorf-avatar.jpg');
    imageUrls.push('../../../assets/img/thumbnails/tp-goron-shop-owner.jpg');
    imageUrls.push('../../../assets/img/thumbnails/hylian-shield-avatar.jpg');
    imageUrls.push('../../../assets/img/thumbnails/mm-kid-link-keaton-mask.jpg');
    return imageUrls[Math.floor((Math.random() * imageUrls.length))];
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
