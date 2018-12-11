import { currentSession } from 'solid-auth-client';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/solid.auth.service';
import { RdfService } from '../services/rdf.service';

declare let solid: any;

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {

  webId: String;
  constructor(private auth: AuthService,
              private rdf: RdfService) { }

  ngOnInit() {
    this.getWebId();
  }

  getWebId = async function(){

    const session = await solid.auth.currentSession();
    this.webId = session.webId.split('profile')[0] + 'public/';
  }

  logout() {
    this.auth.solidSignOut();
  }
}
