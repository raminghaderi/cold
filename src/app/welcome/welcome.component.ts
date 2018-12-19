import { currentSession } from 'solid-auth-client';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/solid.auth.service';
import { RdfService } from '../services/rdf.service';
import * as SolidFileClient from 'solid-file-client';
import { PodHandlerService } from '../services/pod-handler.service';
import { SolidSession } from '../models/solid-session.model';
import { Observable } from 'rxjs';

//const filedc = require('solid-file-client');

declare let solid: any;
declare let $rdf: any;

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})

export class WelcomeComponent implements OnInit {

  fileClient = SolidFileClient;
  folderName: string;
  webId: string;
  workspace: string;
  session: SolidSession;
  profileId:any

  
  
  constructor(private auth: AuthService,
              private rdf: RdfService,
              private podhandler:PodHandlerService) { }

  ngOnInit() {
    this.getSession()
  }

  getSession(){
     this.auth.session.subscribe((val: SolidSession)=>{
      this.session = val
    this.profileId = this.session.webId
    this.webId = this.session.webId.split('profile')[0]
      this.initForm()
  //   console.log(JSON.stringify(this.session));
    })
  }

  async initForm (){
  let loc = await this.podhandler.getStorageLocation(this.profileId)
    console.log("loc: "+loc)
     this.workspace = loc+''+'public/'
 
  }

  logout() {
    this.auth.solidSignOut();
  }


  initWorkspace() {
      let url = this.workspace + '' + this.folderName;
      console.log(url);
      // check if folder exists
      this.podhandler.initializeContainers(this.folderName);

  }

  // TODO: redirect to dashboard and 


}
