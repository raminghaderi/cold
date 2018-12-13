import { currentSession } from 'solid-auth-client';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/solid.auth.service';
import { RdfService } from '../services/rdf.service';
import SolidFileClient from 'solid-file-client';
import { HttpClient } from '@angular/common/http';

declare let solid: any;
declare let $rdf: any;

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {

  fileClient = SolidFileClient;
  folderName: String;
  webId: String;
  
  constructor(private auth: AuthService,
              private rdf: RdfService,
              private http: HttpClient) { }

  ngOnInit() {
    this.getWebId();
  }

  getWebId = async function() {

    const session = await solid.auth.currentSession();
    this.webId = session.webId.split('profile')[0] + 'public/';
  };

  logout() {
    this.auth.solidSignOut();
  }

  createFolder() {

      // tslint:disable-next-line:prefer-const
      let url = this.webId + '' + this.folderName;
      console.log(url);
      this.fileClient.createFolder( url ).then( success => {
        if (!success) {
          console.log(this.fileClient.err);
        } else {
          console.log( `Created folder ${url}.`);
        }
    });
  }

}
