import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { UploadComponent } from './features/upload/upload.component';
import { HobbyLobbyComponent } from './features/hobby-lobby/hobby-lobby.component';
import { FiveBelowComponent } from './features/five-below/five-below.component';
import { BatchesComponent } from './features/batches/batches.component';
import { StateService } from './core/services/state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    DashboardComponent,
    UploadComponent,
    HobbyLobbyComponent,
    FiveBelowComponent,
    BatchesComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  readonly state = inject(StateService);

  ngOnInit() {
    this.state.refreshAll();
  }
}
