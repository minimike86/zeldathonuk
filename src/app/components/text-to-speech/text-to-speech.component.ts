import { Component, OnInit } from '@angular/core';
import Speech from 'speak-tts';
import {DonationHighlightService} from '../../services/firebase/donation-highlight-service/donation-highlight-service.service';
import {HighlightedDonation, TrackedDonation} from '../../services/firebase/donation-tracking/tracked-donation';
import {delay, map} from 'rxjs/operators';
import {faCommentDollar, faCommentSlash} from '@fortawesome/free-solid-svg-icons';


@Component({
  selector: 'app-text-to-speech',
  templateUrl: './text-to-speech.component.html',
  styleUrls: ['./text-to-speech.component.css']
})
export class TextToSpeechComponent implements OnInit {

  public speech: Speech;
  public speakText: string;
  public donationHighlight: HighlightedDonation;

  public faCommentDollar = faCommentDollar;
  public faCommentSlash = faCommentSlash;

  constructor( private donationHighlightService: DonationHighlightService ) {
  }

  ngOnInit(): void {
    this.speech = new Speech(); // will throw an exception if not browser supported
    if (this.speech.hasBrowserSupport()) {
      console.log('speech synthesis supported');
      this.speech.init({
        'volume': 1,
        'lang': 'en-GB',
        'rate': 1.1,
        'pitch': 1,
        'voice': 'Google UK English Female',
        'splitSentences': true
      }).then((data) => {
        // The "data" object contains the list of available voices and the voice synthesis params
        console.log('Speech is ready, voices are available', data);
      }).catch(e => {
        console.error('An error occurred while initializing : ', e);
      });
    }

    this.donationHighlightService.setDonationHighlight({donation: null, show: false});
    this.speakTextString('Text to speech is ready!', 2 * 1000);
    this.donationHighlightService.getHighlightedDonation().pipe(
      delay(1 * 1000),
      map(data => {
        this.donationHighlight = data.find(x => x.id === 'HIGHLIGHT-DONATION');
        if (this.donationHighlight.show) {
          this.speakDonationEvent(this.donationHighlight.donation);
        }
      })
    ).subscribe();
  }

  speakDonationEvent(donation: TrackedDonation) {
    // speak message if there is one
    this.speakText = (donation?.message.length >= 1)
      ? `New donation of ${donation.currency === 'GBP' ? '£' : donation.currency}${donation.donationAmount} from ${donation.name}. ${donation.message}`
      : `New donation of ${donation.currency === 'GBP' ? '£' : donation.currency}${donation.donationAmount} from ${donation.name}.`;
    this.speech.speak({
      text: this.speakText,
      queue: false, // current speech will be interrupted
      listeners: {
        onend: () => {
          const handle = setInterval(() => {
            if (this.speech.speaking()) {
              console.log('still speaking!');
            } else {
              clearInterval(handle);
              // animate hide tracked donation highlight whenever speaking finished
              console.log('hide tracked donation!');
              this.speakText = '';
              this.donationHighlightService.setDonationHighlight({donation: null, show: false});
            }
          }, 100);
        },
      }
    });
  }

  speakTextString(speakText: string, maxDuration: number) {
    this.speakText = speakText;
    this.speech.speak({
      text: this.speakText,
      queue: false, // current speech will be interrupted
      listeners: {
        onend: () => {
          const handle = setInterval(() => {
            if (this.speech.speaking()) {
              console.log('still speaking!');
            } else {
              clearInterval(handle);
            }
          }, 100);
        },
      }
    });
    setTimeout(() => {
      this.speakText = '';
      this.speech.cancel();
    }, maxDuration);
  }

  emergencyStop() {
    this.speech.cancel();
    this.donationHighlightService.setDonationHighlight({donation: null, show: false});
  }

}
