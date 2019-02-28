import { Component, OnInit, ViewChild } from '@angular/core';
import { UserProfileService } from '../../services/user-profile.service';
import { PodHandlerService } from '../../services/pod-handler.service';
import { SolidProfile } from '../../models/solid-profile.model';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  profile: any;

  @ViewChild('f') cardForm: NgForm;

  
  constructor(private podhandler: PodHandlerService,
    private userService: UserProfileService) { }

  ngOnInit() {
    this.userService.getUserProfile()
    .subscribe((user: any) => this.profile = user);

     // Clear cached profile data
    // TODO: Remove this code and find a better way to get the old data
    localStorage.removeItem('oldProfileData');
  }

  // Submits the form, and saves the profile data using the auth/rdf service
  async onSubmit () {
    if (!this.cardForm.invalid) {
      try {
        await this.podhandler.rdf.updateProfile(this.cardForm);
        localStorage.setItem('oldProfileData', JSON.stringify(this.profile));
      } catch (err) {
        console.log(`Error: ${err}`);
      }
    }
  }



}
