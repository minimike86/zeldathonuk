import {AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';

@Component({
  selector: 'app-audio-visualizer',
  templateUrl: './audio-visualizer.component.html',
  styleUrls: ['./audio-visualizer.component.css']
})
export class AudioVisualizerComponent implements OnInit, AfterViewInit {

  @ViewChild('canvas', {static: false})
  canvas: ElementRef<HTMLCanvasElement>;
  public ctx: CanvasRenderingContext2D;
  public canvasToggle = false;

  @ViewChild('audioElement', {static: false})
  audioElement: ElementRef;
  public audio: HTMLAudioElement;

  public audioLibrary: AudioLibraryItem[] = [];
  public playingLibraryIndex: number;

  public audioCtx: AudioContext;
  public source: MediaElementAudioSourceNode;
  public analyser: AnalyserNode;

  constructor(private renderer: Renderer2) {
  }

  ngOnInit(): void {
    // Define audio files
    const together = {
      url: './assets/audio/Ian%20Aisling%20-%20Together%20-%20A%20Zelda%20Animation%20OST%20-%2005%20Fi\'s%20Theme%20Reimagined.mp3',
      songName: 'Together - A Zelda Animation OST',
      songAuthor: 'by Ian Aisling'
    };
    this.audioLibrary.push(together);
    const meowMeowBowWow = {
      url: './assets/audio/Zelda - Link\'s Awakening - Sword Search Remix - Dj CUTMAN\'s Meow Meow & Bow Wow - GameChops.mp3',
      songName: 'Meow Meow & Bow Wow',
      songAuthor: 'by Dj CUTMAN'
    };
    this.audioLibrary.push(meowMeowBowWow);
    this.playingLibraryIndex = 0;
    // Define audio element
    this.audio = new Audio();
    this.audio.src = this.audioLibrary[0].url;
    this.audio.autoplay = false;
    this.audio.controls = false;
  }

  ngAfterViewInit(): void {
    // Get canvas context
    this.ctx = this.canvas.nativeElement.getContext('2d');
    // Add audio to audio container ElementRef
    this.renderer.appendChild(this.audioElement.nativeElement, this.audio);
    this.visualizeAudioStatic(this.audioLibrary[0].url);
    setTimeout(() => {
      this.getAudioContext();
    }, 1000);
  }

  onCanvasClick() {
    this.canvasToggle = !this.canvasToggle;
  }

  getAudioContext() {
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.source = this.audioCtx.createMediaElementSource(this.audio);
    this.source.mediaElement.onended = () => {
      this.playingLibraryIndex = this.playingLibraryIndex === 0 ? 1 : 0;
      this.source.mediaElement.src = this.playingLibraryIndex === 0 ? this.audioLibrary[0].url : this.audioLibrary[1].url;
      this.source.mediaElement.load();
      this.source.mediaElement.play().then();
    };
    this.source.mediaElement.play().then();
    this.source.connect(this.analyser);
    this.analyser.fftSize = 2048;
    this.analyser.connect(this.audioCtx.destination);
    this.visualizeAnalyser();
  }

  visualizeAnalyser() {
    setInterval(() => {
      // const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      // this.analyser.getByteFrequencyData(dataArray);
      // this.analyser.getByteTimeDomainData(dataArray);
      const dataArray = new Float32Array(this.analyser.frequencyBinCount);
      if (this.canvasToggle) {
        this.analyser.getFloatTimeDomainData(dataArray);
      } else {
        this.analyser.getFloatFrequencyData(dataArray);
      }
      const filtered = this.getFilteredRawData(dataArray);
      const normalised = this.getNormalisedAudioData(filtered);
      this.draw(normalised);
    }, 30 / 1000);
  }

  visualizeAudioStatic(url) {
    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => this.audioCtx?.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        const filtered = this.getFilteredAudioData(audioBuffer);
        const normalised = this.getNormalisedAudioData(filtered);
        this.draw(normalised);
      });
  }

  getFilteredRawData(rawData: Float32Array | Uint8Array): any[] {
    const samples = 64; // Number of samples we want to have in our final data set
    const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i; // the location of the first sample in the block
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
      }
      filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
    }
    return filteredData;
  }

  getFilteredAudioData(audioBuffer: AudioBuffer): any[] {
    const rawData: Float32Array = audioBuffer?.getChannelData(0);  // We only need to work with one channel of data
    const samples = 256; // Number of samples we want to have in our final data set
    const blockSize = Math.floor(rawData?.length / samples); // the number of samples in each subdivision
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i; // the location of the first sample in the block
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
      }
      filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
    }
    return filteredData;
  }

  getNormalisedAudioData(filteredData: any): any[] {
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    return filteredData.map(n => n * multiplier);
  }

  draw(normalizedData) {
    const dpr = window.devicePixelRatio || 1;
    const padding = 20;
    this.canvas.nativeElement.width = this.canvas.nativeElement.offsetWidth * dpr;
    this.canvas.nativeElement.height = (this.canvas.nativeElement.offsetHeight + padding * 2) * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.translate(0, this.canvas.nativeElement.offsetHeight / 2 + padding);  // Set Y = 0 to be in the middle of the canvas

    // draw the line segments
    const width = this.canvas.nativeElement.offsetWidth / normalizedData.length;
    // console.log('normalizedData:', normalizedData);
    for (let i = 0; i < normalizedData.length; i++) {
      const x = width * i;
      let height = normalizedData[i] * this.canvas.nativeElement.offsetHeight - padding;
      if (height < 0) {
        height = 0;
      } else if (height > this.canvas.nativeElement.offsetHeight / 2) {
        height = 1;
      }
      // console.log('drawLineSegment:', x, height, width, (i + 1) % 2);
      this.drawLineSegment(this.ctx, x, height, width, (i + 1) % 2);
    }
  }

  drawPlayLine(ctx) {
    const time = this.audio.currentTime;
    const dur = this.audio.duration;
  }

  drawLineSegment(ctx, x, y, width, isEven) {
    ctx.lineWidth = 1; // how thick the line is
    ctx.strokeStyle = '#9932CC'; // what color our line is
    ctx.beginPath();
    y = isEven ? y : -y;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, y);
    ctx.arc(x + width / 2, y, width / 2, Math.PI, 0, isEven);
    ctx.lineTo(x + width, 0);
    ctx.stroke();
  }

}


interface AudioLibraryItem {
  url: string;
  songName: string;
  songAuthor: string;
}
