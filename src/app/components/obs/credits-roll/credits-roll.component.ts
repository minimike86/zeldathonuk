import {AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';
import {BehaviorSubject, interval, Observable} from 'rxjs';
import {map, tap, timeout} from 'rxjs/operators';
import {TrackedDonation, TrackedDonationId} from '../../../services/firebase/donation-tracking/tracked-donation';
import {DonationTrackingService} from '../../../services/firebase/donation-tracking/donation-tracking.service';

@Component({
  selector: 'app-credits-roll',
  templateUrl: './credits-roll.component.html',
  styleUrls: ['./credits-roll.component.scss']
})
export class CreditsRollComponent implements OnInit, AfterViewInit {

  public trackedDonations$: Observable<TrackedDonation[]>;
  public trackedDonations: TrackedDonation[];
  public highlightDonations$: BehaviorSubject<TrackedDonation[]> = new BehaviorSubject<TrackedDonation[]>([]);

  public showTitle = null;
  public showCards = null;
  public showThankYou = false;

  @ViewChild('audioElement', {static: true})
  audioElement: ElementRef;
  public audio: HTMLAudioElement;

  constructor( private renderer: Renderer2,
               private donationTrackingService: DonationTrackingService ) {

    this.trackedDonations$ = this.donationTrackingService.getTrackedDonationArray().pipe(
      map((trackedDonationDocIds: TrackedDonationId[]) => {
        return this.trackedDonations = trackedDonationDocIds.find(x => x.id === 'GAMEBLAST21').donations;
      }),
      map((trackedDonations: TrackedDonation[]) => {
        return trackedDonations.sort((a: TrackedDonation, b: TrackedDonation) => a.donationAmount - b.donationAmount);
      })
    );

    this.trackedDonations$.subscribe(data => {
      let iter = 0;
      for (let i = 0; i <= this.trackedDonations.length; i += 6) {
        setTimeout(() => {
          this.highlightDonations$.next(this.trackedDonations.slice(i, i + 6));
          this.showCards = true;
          setTimeout(() => {
            this.showCards = false;
          }, 3 * 4000);
        }, 3 * 2000 + (3 * 8000 * iter));
        iter++;
      }
      setTimeout(() => {
        this.showTitle = false;
        setInterval(() => {
          this.decreaseVolume();
        }, 5 * 1000);
        setTimeout(() => {
          this.showThankYou = true;
        }, 5 * 1000);
      }, 3 * 2000 + (3 * 8000 * iter) + 2000);
    });

  }

  ngOnInit(): void {

    this.audio = new Audio();
    this.audio.crossOrigin = 'anonymous';
    this.audio.src = 'https://dl.dropboxusercontent.com/s/mjw1dkg63kgnjtw/may%20we%20meet%20again%20%28fis%20theme%29.mp3?dl=0';
    this.audio.volume = 0.5;
    this.audio.autoplay = false;
    this.audio.loop = true;
    this.audio.controls = false;

    setTimeout(() => {
      this.showTitle = true;
    }, 2000);

  }

  ngAfterViewInit(): void {
    this.renderer.appendChild(this.audioElement.nativeElement, this.audio);

    setTimeout(() => {
      this.audio.load();
      this.audio.play().then();
    }, 500);

  }

  increaseVolume() {
    this.audio.volume = this.audio.volume + 0.05 >= 1 ? 1 : this.audio.volume += 0.05;
  }

  decreaseVolume() {
    this.audio.volume = this.audio.volume - 0.05 <= 0 ? 0 : this.audio.volume -= 0.05;
  }

}
