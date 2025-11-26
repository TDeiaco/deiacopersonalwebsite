import { Component, OnInit, HostListener } from '@angular/core';
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
  albums_to_load: string[] = ['Fancy Lake', 
                              'Green River trip w/ Brad', 
                              'Colorado Trail Sec 2',
                              'BlackLivesMatter, Denver CO'];
  loading = false;

  // modal state
  selectedImage: string | null = null;
  currentIndex = -1;

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
    this.currentIndex = this.image_urls.indexOf(url);
    if (this.currentIndex === -1 && this.image_urls.length) {
      this.currentIndex = 0;
    }
    this.selectedImage = this.image_urls[this.currentIndex] ?? url;
  }

  closeImage() {
    this.selectedImage = null;
    this.currentIndex = -1;
  }

  prevImage() {
    if (!this.image_urls || this.image_urls.length === 0) return;
    if (this.currentIndex <= 0) {
      this.currentIndex = this.image_urls.length - 1;
    } else {
      this.currentIndex--;
    }
    this.selectedImage = this.image_urls[this.currentIndex];
  }

  nextImage() {
    if (!this.image_urls || this.image_urls.length === 0) return;
    if (this.currentIndex >= this.image_urls.length - 1) {
      this.currentIndex = 0;
    } else {
      this.currentIndex++;
    }
    this.selectedImage = this.image_urls[this.currentIndex];
  }

  // keyboard support: Esc to close, arrows to navigate
  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent) {
    if (!this.selectedImage) return;
    if (event.key === 'Escape') {
      this.closeImage();
    } else if (event.key === 'ArrowLeft') {
      this.prevImage();
    } else if (event.key === 'ArrowRight') {
      this.nextImage();
    }
  }
}
