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

  // modal state
  selectedImage: string | null = null;

  // New properties for album metadata
  currentAlbumName = '';
  currentAlbumDescription = '';

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
    this.image_urls = [];
    this.currentAlbumName = '';
    this.currentAlbumDescription = '';

    // First fetch album info (title + description), then fetch photos
    this.flickrService.getPhotoSetInfo(albumName).subscribe({
      next: info => {
        if (info) {
          this.currentAlbumName = info.title || albumName;
          this.currentAlbumDescription = info.description || '';
        } else {
          // fallback to the provided name if not found
          this.currentAlbumName = albumName;
          this.currentAlbumDescription = '';
        }

        // Now load photos for the album (service will return [] on failure)
        this.flickrService.getPhotoUrlsInAlbum(albumName).subscribe({
          next: (urls: string[]) => {
            this.image_urls = urls || [];
            this.loading = false;
          },
          error: (err) => {
            console.error('Error fetching photos for album', albumName, err);
            this.loading = false;
          }
        });
      },
      error: err => {
        console.error('Error fetching album info for', albumName, err);
        // still try to load photos even if info failed
        this.currentAlbumName = albumName;
        this.currentAlbumDescription = '';
        this.flickrService.getPhotoUrlsInAlbum(albumName).subscribe({
          next: (urls: string[]) => {
            this.image_urls = urls || [];
            this.loading = false;
          },
          error: (err2) => {
            console.error('Error fetching photos for album', albumName, err2);
            this.loading = false;
          }
        });
      }
    });
  }

  openImage(url: string) {
    this.selectedImage = url;
  }

  closeImage() {
    this.selectedImage = null;
  }
}
