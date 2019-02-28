
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/solid.auth.service';
import { RdfService } from '../../services/rdf.service';
import * as SolidFileClient from 'solid-file-client';
import { PodHandlerService } from '../../services/pod-handler.service';
import { SolidSession } from '../../models/solid-session.model';
import { Router }  from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import CONTAINERS from '../../containers.json';

//const filedc = require('solid-file-client');

declare let solid: any;
declare let $rdf: any;

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss'],
})

export class WelcomeComponent implements OnInit {

  fileClient = SolidFileClient;
  folderName: string;
  webId: string;
  session: SolidSession;
  profileId: any;
  existingWorkspaces: any[];
  appRootDir: string = CONTAINERS.rootContainer;

  @Input('workspace')  workspace: string;
  @Output('onExistingWorkspaceChange') onExistingWorkspaceChange  = new EventEmitter<any[]>();



  constructor(private router: Router,
              private toastr: ToastrService,
              private auth: AuthService,
              private rdf: RdfService,
              private podhandler: PodHandlerService) { }

  ngOnInit() {
    this.getWebId();

    // Find a better way to call this function
    setTimeout(() => {
      this.getExistingWorkspaces();
    }, 500);

  }

  getWebId = async function() {

    const session = await solid.auth.currentSession();
    this.webId = session.webId.split('profile')[0];
    this.workspace = this.webId + 'public';

  };

  logout() {
    this.auth.solidSignOut();
  }


  initWorkspace() {
      const dest = this.workspace + '/' + this.appRootDir + '/' + this.folderName;
      console.log(dest);
      // check if folder exists
      this.podhandler.initializeContainers(dest);
  }

  // TODO: redirect to dashboard and
  getExistingWorkspaces = async() => {
    this.podhandler.getListWorkSpaces(this.workspace)
   .then( value => {
     if (typeof value === 'object') {
       this.existingWorkspaces = value.folders;
       this.onExistingWorkspaceChange.emit();
     }

    // do something with the workspaces
      console.log('Workspaces: ' + JSON.stringify(value));
   });
  }

  goToWkSpace = (wkspace) => {

    //TODO: pass workspace object to route
    this.router.navigate(['/dashboard']);
  }

  joinWorkSpace = (url: string) => {
    this.podhandler.joinWorkSpace(url);
  }

}
