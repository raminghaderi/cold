import { currentSession } from 'solid-auth-client';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
  session: SolidSession;
  profileId:any
  existingWorkspaces: any[];
  @Input('workspace')  workspace: string;
  @Output('onExistingWorkspaceChange') onExistingWorkspaceChange  = new EventEmitter<any[]>();

  
  
  constructor(private auth: AuthService,
              private rdf: RdfService,
              private podhandler:PodHandlerService) { }

  ngOnInit() {
    this.getWebId()
   
    // Find a better way to call this function
    setTimeout(() => {
      this.getExistingWorkspaces()
    }, 500);
  
  }

  getWebId = async function() {

    const session = await solid.auth.currentSession();
    this.webId = session.webId.split('profile')[0];
    this.workspace = this.webId + 'public/';
    
  };

  logout() {
    this.auth.solidSignOut();
  }


  initWorkspace() {
      let url = this.workspace + '' + this.folderName;
      
      // check if folder exists
      this.podhandler.initializeContainers(this.folderName);
  }

  // TODO: redirect to dashboard and 
  getExistingWorkspaces = async() => {
   await this.podhandler.getListWorkSpaces(this.workspace)
   .then( value => {
     if(typeof value === "object") {
       this.existingWorkspaces = value.folders
       this.onExistingWorkspaceChange.emit()
     }
        
    // do something with the workspaces
      console.log("Workspaces: "+JSON.stringify(value))
   })
      
  }
}
