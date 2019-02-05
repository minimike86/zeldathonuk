import { Component, OnInit } from '@angular/core';
import { faTwitch } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-runner-name',
  templateUrl: './runner-name.component.html',
  styleUrls: ['./runner-name.component.css']
})
export class RunnerNameComponent implements OnInit {
  public runnerName: string;
  public faTwitch = faTwitch;

  constructor() {
  }

  ngOnInit() {
    this.runnerName = 'miikkkeeee_';
  }

}
