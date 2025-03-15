import { Routes } from '@angular/router';
import { PhotographyComponent } from './photography/photography.component';
import { SoftwareComponent } from './software/software.component';
import { CareerComponent } from './career/career.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'photography', component: PhotographyComponent },
    { path: 'software', component: SoftwareComponent },
    { path: 'career', component: CareerComponent },
  ];
