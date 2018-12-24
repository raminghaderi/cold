import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { currentSession } from 'solid-auth-client';

// Services
import { AuthService } from '../services/solid.auth.service';


@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  friends = ['Ramin', 'Samuel', 'Zahra'];
  spaces = ['general', 'survey', 'credentials'];
  workspaces = ['planspiel', 'solid', 'kubernetes'];

  constructor(private auth: AuthService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.loadSession();
  }

  loadSession = async () => {
    // this.session = await currentSession();
  }

  logout() {
    this.auth.solidSignOut();
  }

}
