import { Component, OnInit, Injectable } from '@angular/core';

import { NbMenuItem } from '@nebular/theme';



// Services
import { AuthService } from '../services/solid.auth.service';
import { SolidProfile } from '../models/solid-profile.model';
import { PodHandlerService } from '../services/pod-handler.service';
import { UserProfileService } from '../services/user-profile.service';



import { SolidSession } from '../models/solid-session.model';
import { ActivatedRoute } from '@angular/router';

declare let solid: any;
declare let $rdf: any;
/**
 * NbMenuItem eg:
 * menu: NbMenuItem[] = [
  {
    title: 'Dashboard',
    icon: 'nb-home',
    link: '/pages/dashboard',
    home: true,
  },
  {
    title: 'FEATURES',
    group: true,
  }, ]
 */

@Injectable()
@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})


export class DashboardComponent implements OnInit {
  profile: SolidProfile;

  profileImage: string;
  session: SolidSession;
  profileId: string;
  webId: string;
  //friends = ['Ramin', 'Samuel', 'Zahra'];
  existingWorkspaces: {}[] = [];
  friends = [];

  selectedItem: any;
  fetcher: any;

  owner: string;

  menu:  NbMenuItem[] = [
    {
      title: 'Dashboard',
      icon: 'nb-home',
      link: '/',
      home: true,
    },
    {
      title: 'Chat Spaces',
      group: true,

    },

  ];

  constructor(private auth: AuthService,
    private route: ActivatedRoute,
    private podhandler: PodHandlerService,
    private userService: UserProfileService) {
     }

  ngOnInit() {
      this.fetcher =   this.fetcher = this.podhandler.rdf.fetcher;
    this.loadProfile(this.getAvailableWorkspaces);
  }


  async loadProfile(callBackFn= undefined) {
    try {
    //  this.loadingProfile = true;
      this.session =  await solid.auth.currentSession();
      this.profileId = this.session.webId;
      this.webId = this.profileId.split('/profile')[0];

      const profile = await this.podhandler.rdf.getProfile(this.profileId);

      if (profile) {
      this.profile = profile;
        this.auth.saveOldUserData(profile);

        // LoadFriends
        for (let f = 0; f < profile.friends.length; f++) {
         const friendProfile = await this.podhandler.rdf.getProfile(profile.friends[f]);
          this.friends.push(friendProfile);
        }

        this.setupProfilePic();
      this.userService.setUserProfile(this.profile);
      }

    if (callBackFn != undefined)  callBackFn();
    } catch (error) {
      console.log(`Error: ${error}`);
    }
  }

    private setupProfilePic() {
    this.profile.picture =  this.profile.picture ? this.profile.picture : '/assets/images/profile.png';
    }

    getAvailableWorkspaces = async() => {
     const storageSpace = this.webId + '/public';
      await this.podhandler.getListWorkSpaces(storageSpace)
    .then( value => {
       if (typeof value === 'object') {
          this.existingWorkspaces  = value.folders;
   }

   this.generateMenu();
  // do something with the workspaces
    console.log('Workspaces: ' + JSON.stringify(value));
 });

}

generateMenu() {
  const itemGroup = {
    title: 'Spaces',
  icon: 'nb-chat',
  expanded: true,
  children: [],
  };



  this.existingWorkspaces.forEach((workspace: any) => {
    const item = {
      title: '',
    link: '',
    payload: {},

    };

    item.title = workspace.name;
    item.link = '/dashboard/chat/' + workspace.name,
   item.payload  = workspace,
    itemGroup.children.push(item);

  });

  if (itemGroup.children.length > 0)
      this.menu = [...this.menu, itemGroup];
}

}
