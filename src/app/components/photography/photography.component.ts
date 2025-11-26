import { Component, OnInit } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FlickrService } from '../../services/flickr.service';

@Component({
  selector: 'app-photography',
  standalone: true,
  imports: [HttpClientModule, MatGridListModule, MatButtonModule, CommonModule],
  providers: [FlickrService],
  templateUrl: './photography.component.html',
  styleUrls: ['./photography.component.css']
})
export class PhotographyComponent implements OnInit {
  image_urls: string[] = [];
  albums_to_load: string[] = ['Fancy Lake', 'Green River trip w/ Brad', 'Colorado Trail Sec 2'];
  loading = false;
  errorMessage?: string;

  constructor(private flickrService: FlickrService) {}

  ngOnInit(): void {
    // load the first album by default if available
    if (this.albums_to_load && this.albums_to_load.length > 0) {
      this.getPhotoUrlsInAlbum(this.albums_to_load[0]);
    }
  }

  getPhotoUrlsInAlbum(albumName: string): void {
    if (!albumName) return;
    this.loading = true;
    this.errorMessage = undefined;
    this.image_urls = [];

    this.flickrService.getPhotoUrlsInAlbum(albumName).subscribe({
      next: (urls: string[]) => {
        this.image_urls = urls || [];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching photos for album', albumName, err);
        this.errorMessage = 'Failed to load photos. See console for details.';
        this.loading = false;
      }
    });
  }
}
