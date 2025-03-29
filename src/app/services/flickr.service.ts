// import { Injectable } from '@angular/core';

// @Injectable({
//   providedIn: 'root'
// })
// export class FlickrService {

//   constructor() { }
// }

import { HttpClient, HttpClientModule, HttpParams } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class FlickrService {

  constructor(private http: HttpClient) {}

  private flickrOptions = {
    taylorsUserId: '', // replace with actual value
    customerKey: '', // replace with actual value
  };

  getPhotoUrls(
    searchText: string = '',
    perPage: number = 500,
    minTakenDate: string = '',
    maxTakenDate: string = ''
  ): Observable<string[]> {
    const urlParameters = new HttpParams()
      .set('method', 'flickr.photos.search')
      .set('user_id', this.flickrOptions.taylorsUserId)
      .set('per_page', perPage.toString())
      .set('oauth_nonce', '5f0d130f7e654e71aba8c60410933190')
      .set('oauth_timestamp', '1609109854')
      .set('oauth_version', '1.0')
      .set('oauth_signature_method', 'HMAC-SHA1')
      .set('oauth_consumer_key', this.flickrOptions.customerKey)
      .set('sort', 'date-posted-desc')
      .set('extras', 'url_l'); // Fetch 'url_l' size photos

    if (searchText) {
      urlParameters.set('text', searchText);
    }

    if (minTakenDate && maxTakenDate) {
      urlParameters.set('min_taken_date', minTakenDate);
      urlParameters.set('max_taken_date', maxTakenDate);
    }

    const uri = `https://api.flickr.com/services/rest/`; // Base URL for Flickr API

    
    return this.http.get(uri, {
      params: urlParameters, 
      responseType: 'text'
    }).pipe(
      map((response: string) => this.parseXML(response))
    );
  }

  // Utility function to parse XML string and extract photo URLs
  private parseXML(xmlString: string): string[] {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Assuming the XML structure contains <url> elements that hold the URLs
    const urls: string[] = [];
    const urlElements = xmlDoc.getElementsByTagName('photo'); // Adjust to your XML structure

    for (let i = 0; i < urlElements.length; i++) {
      const url = urlElements[i].getAttribute('url_l'); // Or use getAttribute() if needed
      if (url) {
        urls.push(url);
      }
    }

    return urls;
  }

  // Converts ArrayBuffer to a string using TextDecoder (works in modern browsers)
  private convertArrayBufferToText(buffer: ArrayBuffer): string {
    const decoder = new TextDecoder('utf-8');  // Assuming UTF-8 encoding
    return decoder.decode(buffer); // Decodes the ArrayBuffer to a string
  }

  getPhotoSetId(photosetName: string): Observable<string> {
    const urlParameters = new HttpParams()
      .set('method', 'flickr.photosets.getList')
      .set('user_id', this.flickrOptions.taylorsUserId)
      .set('per_page', '500')
      .set('oauth_nonce', '5f0d130f7e654e71aba8c60410933190')
      .set('oauth_timestamp', '1609109854')
      .set('oauth_version', '1.0')
      .set('oauth_signature_method', 'HMAC-SHA1')
      .set('oauth_consumer_key', this.flickrOptions.customerKey);

    const uri = `https://api.flickr.com/services/rest/`; // Base URL for Flickr API

    return this.http.get<any>(uri, { params: urlParameters }).pipe(
      map(response => {
        const photosets = response.photosets.photoset;
        const photoset = photosets.find((ps: any) => ps.title._content === photosetName);
        return photoset ? photoset.id : '';
      })
    );
  }

  getPhotoUrlsInAlbum(
    albumName: string = '',
    perPage: number = 500,
    minTakenDate: string = '',
    maxTakenDate: string = ''
  ): Observable<string[]> {
    return this.getPhotoSetId(albumName).pipe(
      switchMap(photosetId => {
        const urlParameters = new HttpParams()
          .set('method', 'flickr.photosets.getPhotos')
          .set('user_id', this.flickrOptions.taylorsUserId)
          .set('photoset_id', photosetId)
          .set('per_page', perPage.toString())
          .set('oauth_nonce', '5f0d130f7e654e71aba8c60410933190')
          .set('oauth_timestamp', '1609109854')
          .set('oauth_version', '1.0')
          .set('oauth_signature_method', 'HMAC-SHA1')
          .set('oauth_consumer_key', this.flickrOptions.customerKey)
          .set('extras', 'url_l'); // Fetch 'url_l' size photos

        const uri = `https://api.flickr.com/services/rest/`; // Base URL for Flickr API

        return this.http.get<any>(uri, { params: urlParameters }).pipe(
          map(response => {
            const urls: string[] = [];
            if (response && response.photoset && response.photoset.photo) {
              const photos = response.photoset.photo;
              photos.forEach((photo: any) => {
                if (photo.url_l) {
                  urls.push(photo.url_l);
                }
              });
            }
            return urls;
          })
        );
      })
    );
  }
}

