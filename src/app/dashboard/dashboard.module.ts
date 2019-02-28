import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { ChatComponent } from './chat/chat.component';

import { ThemeModule } from '../@theme/theme.module';
import { AuthModule } from '../auth/auth.module';
import { PodHandlerService } from '../services/pod-handler.service';
import { RdfService } from '../services/rdf.service';
import { AuthService } from '../services/solid.auth.service';
import { ProfileComponent } from './profile/profile.component';
import { WelcomeComponent } from './welcome/welcome.component';

@NgModule({
  declarations: [DashboardComponent, ChatComponent, ProfileComponent, WelcomeComponent],
  imports: [
    ThemeModule,
    DashboardRoutingModule,
    AuthModule,
  ],
  providers: [],
})
export class DashboardModule { }
