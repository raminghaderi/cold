import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { currentSession } from 'solid-auth-client';

// Services
import { AuthService } from '../services/solid.auth.service';

declare let solid: any;


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  friends = ['Ramin', 'Samuel', 'Zahra'];
  spaces = ['general', 'survey', 'credentials'];
  webId: string;

  constructor(private auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.getWebId();
  }

  getWebId = async function() {

    const session = await solid.auth.currentSession();
    this.webId = session.webId.split('profile')[0];
    console.log(this.webId);  
  };

  logout() {
    this.auth.solidSignOut();
  }

  send() {

  }

}
