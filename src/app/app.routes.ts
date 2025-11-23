import { Routes } from '@angular/router';
import { SoftwareComponent } from './components/software/software.component';
import { BioComponent } from './components/bio/bio.component';
import { MandelbrotComponent } from './components/mandelbrot/mandelbrot.component';
import { HomeComponent } from './components/home/home.component';
import { GameOfLifeComponent } from './components/game-of-life/game-of-life.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'mandelbrot', component: MandelbrotComponent },
    // { path: 'photography', component: PhotographyComponent },
    { path: 'gameoflife', component: GameOfLifeComponent },
    { path: 'software', component: SoftwareComponent },
    { path: 'bio', component: BioComponent }, // I don't think I need a career page, just some LinkedIn links
  ];
