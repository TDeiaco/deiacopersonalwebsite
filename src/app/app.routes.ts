import { Routes } from '@angular/router';
import { PhotographyComponent } from './components/photography/photography.component';
import { SoftwareComponent } from './components/software/software.component';
import { CareerComponent } from './components/career/career.component';
import { HomeComponent } from './components/home/home.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'photography', component: PhotographyComponent },
    { path: 'software', component: SoftwareComponent },
    { path: 'career', component: CareerComponent },
  ];
