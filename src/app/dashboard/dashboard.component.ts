import { SolidSession } from './../models/solid-session.model';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { currentSession } from 'solid-auth-client';

// Services
import { AuthService } from '../services/solid.auth.service';
import { RdfService } from '../services/rdf.service';
import { SolidProfile } from '../models/solid-profile.model';
import { PodHandlerService } from '../services/pod-handler.service';

declare let solid: any;


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  profile: SolidProfile;
  loadingProfile: Boolean;
  profileImage: string;
  session: SolidSession;
  webId: string;
  //friends = ['Ramin', 'Samuel', 'Zahra'];
  spaces = ['general', 'survey', 'credentials'];
  friends=[]

  constructor(private auth: AuthService,
              private route: ActivatedRoute,
              private rdf: RdfService,
              private podHandler: PodHandlerService) {}

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    try {
      this.loadingProfile = true;
      this.session = this.rdf.session;
     // this.webId = this.session.webId;


      const profile = await this.rdf.getProfile(this.rdf.session.webId);
     
       
      if (profile) {
      this.profile = profile;
        this.auth.saveOldUserData(profile); 
          
        // LoadFriends
        for (let f=0; f<profile.friends.length; f++){
         let friendProfile = await this.rdf.getProfile(profile.friends[f])
         
          console.log("Friend: "+JSON.stringify(profile.friends[f]))
          this.friends.push(friendProfile)
        }
      }

      this.loadingProfile = false;
      this.setupProfileData();
    } catch (error) {
      console.log(`Error: ${error}`);
    }

  }

  private setupProfileData() {
    if (this.profile) {
      this.profileImage = this.profile.image ? this.profile.image : '/assets/images/profile.png';
    } else {
      this.profileImage = '/assets/images/profile.png';
    }
  }

  logout() {
    this.auth.solidSignOut();
  }

  send() {

  }

}
