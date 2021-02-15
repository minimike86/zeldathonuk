import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

@Component({
  selector: 'app-twitch-oauth',
  templateUrl: './twitch-oauth.component.html',
  styleUrls: ['./twitch-oauth.component.css']
})
export class TwitchOAuthComponent implements OnInit {

  public access_token: string;
  public scope: string;
  public state: string;
  public token_type: string;

  constructor(private route: ActivatedRoute) {
    this.route.fragment.subscribe(data => {
      const oauthToken = data.split('&');
      console.log(oauthToken);
      this.access_token = oauthToken.filter((x: string) => x.startsWith('access_token='))[0].replace('access_token=', '');
      this.scope = oauthToken.filter((x: string) => x.startsWith('scope='))[0].replace('scope=', '');
      this.state = oauthToken.filter((x: string) => x.startsWith('state='))[0].replace('state=', '');
      this.token_type = oauthToken.filter((x: string) => x.startsWith('token_type='))[0].replace('token_type=', '');
    });
  }

  ngOnInit(): void {
  }

}
