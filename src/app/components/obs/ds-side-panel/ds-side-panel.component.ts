import { Component, OnInit } from '@angular/core';
import {concatMap, delay, map, takeWhile} from 'rxjs/operators';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import {HighlightedDonation, HighlightedDonationId} from '../../../services/firebase/donation-tracking/tracked-donation';
import {Observable, of} from 'rxjs';
import {DonationHighlightService} from '../../../services/firebase/donation-highlight-service/donation-highlight-service.service';

@Component({
  selector: 'app-ds-side-panel',
  templateUrl: './ds-side-panel.component.html',
  styleUrls: ['./ds-side-panel.component.css']
})
export class DsSidePanelComponent implements OnInit {

  public timeAgo: TimeAgo;
  public donationHighlight$: Observable<HighlightedDonation>;

  constructor( private donationHighlightService: DonationHighlightService ) {
  }

  ngOnInit() {
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB');

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

}
