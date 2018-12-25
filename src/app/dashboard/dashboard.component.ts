import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { currentSession } from 'solid-auth-client';

// Services
import { AuthService } from '../services/solid.auth.service';
import { RdfService } from '../services/rdf.service';
import { SolidProfile } from '../models/solid-profile.model';

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
  friends = ['Ramin', 'Samuel', 'Zahra'];
  spaces = ['general', 'survey', 'credentials'];

  constructor(private auth: AuthService,
              private route: ActivatedRoute,
              private rdf: RdfService) {}

  ngOnInit() {
    this.loadProfile();
  }

  async loadProfile() {
    try {
      this.loadingProfile = true;
      const profile = await this.rdf.getProfile();
      console.log(profile);
      if (profile) {
        this.profile = profile;
        this.auth.saveOldUserData(profile);
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
