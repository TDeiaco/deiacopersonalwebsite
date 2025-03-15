import { Routes } from '@angular/router';
import { PhotographyComponent } from './photography/photography.component';
import { SoftwareComponent } from './software/software.component';

export const routes: Routes = [
    { path: 'photography', component: PhotographyComponent },
    { path: 'software', component: SoftwareComponent },
  ];
