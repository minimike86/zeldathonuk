import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {StandardSidePanelComponent} from "./standard-side-panel/standard-side-panel.component";

@Component({
  selector: 'app-obs',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css']
})
export class ObsComponent implements OnInit {
  private layoutString: string;

  @ViewChild(StandardSidePanelComponent)
  private standardSidePanelComponent: StandardSidePanelComponent;

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      this.layoutString = params.get('layout');
    });
  }

  ngOnInit() {
  }

}
