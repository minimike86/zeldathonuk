import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-obs-layout',
  templateUrl: './obs-layout.component.html',
  styleUrls: ['./obs-layout.component.css']
})
export class ObsLayoutComponent implements OnInit {
  public layoutString: string;

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      this.layoutString = params.get('layout');
    });
  }

  ngOnInit() {
  }


}
