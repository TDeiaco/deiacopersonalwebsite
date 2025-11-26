import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FlickrService {

  constructor(private http: HttpClient) {}

  private flickrOptions = {
    taylorsUserId: '188663432@N05',
    apiKey: 'fed6bea777ca78d2ec5a5e83c33b9318'
  };

  // Search photos (returns JSON)
  getPhotoUrls(searchText = '', perPage = 500, minTakenDate = '', maxTakenDate = ''): Observable<string[]> {
    let params = new HttpParams()
      .set('method', 'flickr.photos.search')
      .set('api_key', this.flickrOptions.apiKey)
      .set('user_id', this.flickrOptions.taylorsUserId)
      .set('per_page', perPage.toString())
      .set('extras', 'url_l')
      .set('format', 'json')
      .set('nojsoncallback', '1')
      .set('sort', 'date-posted-desc');

    if (searchText) params = params.set('text', searchText);
    if (minTakenDate && maxTakenDate) {
      params = params.set('min_taken_date', minTakenDate).set('max_taken_date', maxTakenDate);
    }

    return this.http.get<any>('https://api.flickr.com/services/rest/', { params }).pipe(
      map(res => {
        if (!res || res.stat !== 'ok') return [];
        const photos = res.photos?.photo || [];
        return photos.map((p: any) => p.url_l).filter((u: any) => !!u);
      })
    );
  }

  // Get photoset id by name (returns JSON)
  getPhotoSetId(photosetName: string): Observable<string> {
    let params = new HttpParams()
      .set('method', 'flickr.photosets.getList')
      .set('api_key', this.flickrOptions.apiKey)
      .set('user_id', this.flickrOptions.taylorsUserId)
      .set('format', 'json')
      .set('nojsoncallback', '1');

    return this.http.get<any>('https://api.flickr.com/services/rest/', { params }).pipe(
      map(res => {
        if (!res || res.stat !== 'ok') return '';
        const sets = res.photosets?.photoset || [];
        const found = sets.find((s: any) => s.title?._content === photosetName || s.title === photosetName);
        return found ? found.id : '';
      })
    );
  }

  // New: get basic photoset info (id, title, description)
  getPhotoSetInfo(photosetName: string): Observable<{ id: string; title: string; description: string } | null> {
    let params = new HttpParams()
      .set('method', 'flickr.photosets.getList')
      .set('api_key', this.flickrOptions.apiKey)
      .set('user_id', this.flickrOptions.taylorsUserId)
      .set('format', 'json')
      .set('nojsoncallback', '1');

    return this.http.get<any>('https://api.flickr.com/services/rest/', { params }).pipe(
      map(res => {
        if (!res || res.stat !== 'ok') return null;
        const sets = res.photosets?.photoset || [];
        const found = sets.find((s: any) => {
          const title = s.title?._content ?? s.title;
          return title === photosetName;
        });
        if (!found) return null;
        const title = found.title?._content ?? found.title ?? photosetName;
        const description = found.description?._content ?? found.description ?? '';
        return { id: found.id, title, description };
      })
    );
  }

  // Get photos in a photoset (returns JSON)
  getPhotoUrlsInAlbum(albumName = '', perPage = 500): Observable<string[]> {
    return this.getPhotoSetId(albumName).pipe(
      switchMap(photosetId => {
        if (!photosetId) return of([]);
        let params = new HttpParams()
          .set('method', 'flickr.photosets.getPhotos')
          .set('api_key', this.flickrOptions.apiKey)
          .set('photoset_id', photosetId)
          .set('user_id', this.flickrOptions.taylorsUserId)
          .set('per_page', perPage.toString())
          .set('extras', 'url_l')
          .set('format', 'json')
          .set('nojsoncallback', '1');

        return this.http.get<any>('https://api.flickr.com/services/rest/', { params }).pipe(
          map(res => {
            if (!res || res.stat !== 'ok') return [];
            const photos = res.photoset?.photo || [];
            return photos.map((p: any) => p.url_l).filter((u: any) => !!u);
          })
        );
      })
    );
  }
}

