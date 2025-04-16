import { Component, inject } from '@angular/core';
import { Inject } from '@angular/core';
import { FlickrService } from '../../services/flickr.service';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { GameOfLifeComponent } from '../../game-of-life/game-of-life.component';

import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { NgFor } from '@angular/common';


@Component({
  selector: 'app-photography',
  standalone: true,
  imports: [HttpClientModule, MatGridListModule, MatButtonModule, GameOfLifeComponent],
  providers: [FlickrService],
  templateUrl: './photography.component.html',
  styleUrl: './photography.component.css'
})
export class PhotographyComponent {
  private flickrService: FlickrService = inject(FlickrService);  // Inject service
  image_urls: string [] = [];

  constructor()
  {}

  ngOnInit(): void {
    // Call getPhotoUrls and subscribe to the result
    this.getPhotoUrls();
  }

  // Call the service method and set the result to the variable
  getPhotoUrls(): void {
    this.flickrService.getPhotoUrls().subscribe({
      next:(urls: string[]) => {
        // Set the retrieved photo URLs to the component variable
        this.image_urls = urls;
        console.log(this.image_urls)
        //console.log('Fetched Photo URLs:', this.image_urls); // Optionally log the result
      },
      error:(error) => {
        // Handle any errors
        console.error('Error fetching photo URLs:', error);
      }}
    );
  }
}
