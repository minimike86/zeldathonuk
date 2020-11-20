import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DonationIncentive, Prize } from '../../models/prize-incentives';

@Component({
  selector: 'app-incentives',
  templateUrl: './incentives.component.html',
  styleUrls: ['./incentives.component.css']
})
export class IncentivesComponent implements OnInit {

  @ViewChild('activities') public activitiesRef: ElementRef;
  @ViewChild('raffle') public raffleRef: ElementRef;

  public donationIncentives: DonationIncentive[] = [];
  public prizes: Prize[] = [];

  constructor() { }

  ngOnInit() {

    this.donationIncentives.push(
      {
        name: 'Twitch Viewership',
        type: 'Audience',
        typeColour: 'badge-success',
        constraint: '',
        constraintColour: '',
        imageSrcUrl: '../../../assets/img/challenges/twitch-views.jpg',
        imageHrefUrl: '../../../assets/img/challenges/twitch-views.jpg',
        description: '<a href="https://www.twitch.tv/zeldathonuk/" class="bg-dark text-success font-weight-bold px-1">Raid</a>, <a href="https://www.twitch.tv/zeldathonuk/" class="bg-dark text-success font-weight-bold px-1">Host</a>, ' +
          '<a href="https://www.twitch.tv/zeldathonuk/" class="bg-dark text-success font-weight-bold px-1">Share</a>, and <a href="https://www.twitch.tv/zeldathonuk/" class="bg-dark text-success font-weight-bold px-1">Watch</a> the stream is the best thing ' +
          'you can do to support us! More views = more donations for ' +
          '<a href="https://www.specialeffect.org.uk/what-we-do" target="_blank" class="bg-dark text-light font-weight-bold px-1">SpecialEffect</a>',
        donationAmount: 0
      },
      {
        name: 'EXERCISE',
        type: 'ZeldathonUK Team',
        typeColour: 'badge-success',
        constraint: '',
        constraintColour: '',
        imageSrcUrl: '../../../assets/img/challenges/exercise.jpg',
        imageHrefUrl: '../../../assets/img/challenges/exercise.jpg',
        description: '<span class="bg-dark text-success font-weight-bold px-1">Donate £20</span> and you can request that one of us has to exercise. Push-ups, sit-ups, we have even done ' +
          '<a class="bg-dark text-white font-weight-bold px-1" href="https://clips.twitch.tv/SolidFamousLaptopOSsloth" target="_blank">backflips</a> in the past!',
        donationAmount: 20
      },
      {
        name: 'Commission Henry',
        type: 'Henry',
        typeColour: 'badge-success',
        constraint: 'When Henry\'s On-stream',
        constraintColour: 'badge-warning',
        imageSrcUrl: '../../../assets/img/challenges/majoras-mask-pen.jpg',
        imageHrefUrl: '../../../assets/img/challenges/majoras-mask-pen.jpg',
        description: '<span class="bg-dark text-success font-weight-bold px-1">Donate £50</span> and you can commission some beautiful artwork from Heennnrrrryyyyyyyyy!',
        donationAmount: 50
      },
    );

    this.prizes.push(
      {
        name: 'Wind Waker Master Sword',
        description: '<a href="https://www.twitch.tv/msec" target="_blank" class="bg-dark text-warning font-weight-bold px-1">msec</a> ' +
          'has 3D printed this full size Master Sword (Wind Waker version) that could be yours!',
        imageUrl: '../../../assets/img/prizes/84801418_2741328955947748_8136095740112928768_o.jpg',
        quantity: 1,
        won: false
      },
      {
        name: 'Breath of the Wild Hylian Shield',
        description: '<a href="https://www.twitch.tv/msec" target="_blank" class="bg-dark text-warning font-weight-bold px-1">msec</a> ' +
          'has 3D printed this full size Hylian Shield (Breath of the Wild) that could be yours!',
        imageUrl: 'https://cdn.thingiverse.com/renders/a7/1d/83/b6/c0/eb00f376e15185996e15bf09787d211b_preview_featured.jpg',
        quantity: 1,
        won: false
      },
      {
        name: 'Wind Waker Baton',
        description: '<a href="https://www.twitch.tv/msec" target="_blank" class="bg-dark text-warning font-weight-bold px-1">msec</a> ' +
          'has 3D printed this full size Wind Waker baton that could be yours!',
        imageUrl: '../../../assets/img/prizes/84537730_2742128679201109_6921051424809811968_o.jpg',
        quantity: 5,
        won: false
      },
      {
        name: 'Ocarina of Time 3DS Flute',
          description: '<a href="https://www.nintendo.co.uk/" target="_blank" class="bg-dark text-danger font-weight-bold px-1">Nintendo UK</a> ' +
            'have given us thirty Legend of Zelda promotional items for our prize winners to win!',
        imageUrl: '../../../assets/img/prizes/s-l300.jpg',
        quantity: 30,
        won: false
      },
    );

  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/655011391974449/?fundraiser_source=https://www.zeldathon.co.uk/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2020', '_blank');
  }

  scrollToActivities() {
    setTimeout(() => {
      this.activitiesRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'start' });
    }, 100);
  }

  scrollToRaffle() {
    setTimeout(() => {
      this.raffleRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'start' });
    }, 100);
  }

}
