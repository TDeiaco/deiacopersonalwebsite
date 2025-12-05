import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { DecimalPipe } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-buddhabrot',
  templateUrl: './buddhabrot.component.html',
  styleUrls: ['./buddhabrot.component.css'],
  imports: [FormsModule, NgIf]
})
export class BuddhabrotComponent implements AfterViewInit, OnDestroy {
  @ViewChild('buddhaCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private worker: Worker;
  isRunning = false;
  batchIntervalMs = 250;

  // Buddhabrot parameters
  samplesPerBatch = 50_000; // number of random samples per worker batch
  iterationCount = 1000;
  hitWeight = 1;

  // canvas / accumulator
  public xRes = 700;
  public yRes = 700;
  private accumulator!: Float32Array; // one float per pixel (grayscale hits)
  public maxAcc = 0;
  private batchTimer: any = null;
  public totalSamplesProcessed = 0;

  // view window (same defaults as mandelbrot)
  _minX = -2.0;
  _maxX = 1.0;
  _minY = -1.5;
  _maxY = 1.5;

  constructor() {
    // worker is the same fractal worker used for Mandelbrot; path is relative
    this.worker = new Worker(new URL('../mandelbrot/fractal.worker.ts', import.meta.url));
    this.worker.onmessage = (e: MessageEvent) => this.handleWorkerMessage(e);
    this.worker.onerror = (err) => {
      console.error('Worker error:', err);
      // stop if an error happens
      this.stop();
    };
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d')!;
    // set canvas-based resolution to the element's internal size
    const c = this.canvas.nativeElement;
    this.xRes = c.width || this.xRes;
    this.yRes = c.height || this.yRes;
    this.resetAccumulator(); // initialize accumulator and blank canvas
  }

  ngOnDestroy(): void {
    this.stop();
    this.worker.terminate();
  }

  resetAccumulator(): void {
    this.xRes = this.canvas.nativeElement.width;
    this.yRes = this.canvas.nativeElement.height;
    this.accumulator = new Float32Array(this.xRes * this.yRes);
    this.maxAcc = 0;
    this.totalSamplesProcessed = 0;
    // draw blank
    const blank = new ImageData(this.xRes, this.yRes);
    for (let i = 0; i < blank.data.length; i += 4) {
      blank.data[i] = 0;
      blank.data[i + 1] = 0;
      blank.data[i + 2] = 0;
      blank.data[i + 3] = 255;
    }
    this.ctx.putImageData(blank, 0, 0);
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    // post first batch immediately, then schedule
    this.postWorkerBatch();
    this.batchTimer = setInterval(() => this.postWorkerBatch(), this.batchIntervalMs);
  }

  stop(): void {
    if (!this.isRunning) return;
    clearInterval(this.batchTimer);
    this.batchTimer = null;
    this.isRunning = false;
  }

  singleBatch(): void {
    this.postWorkerBatch();
  }

  private postWorkerBatch(): void {
    // guard
    if (!this.worker) return;
    const message = {
      mode: 'nebulabrot', // worker expects this string for buddhabrot/nebulabrot
      maxX: this._maxX,
      minX: this._minX,
      maxY: this._maxY,
      minY: this._minY,
      xRes: this.xRes,
      yRes: this.yRes,
      samples: this.samplesPerBatch,
      iterationCount: this.iterationCount,
      hitWeight: this.hitWeight
    };
    try {
      this.worker.postMessage(message);
    } catch (err) {
      console.error('Worker.postMessage failed', err);
      this.stop();
    }
  }

  private handleWorkerMessage(e: MessageEvent) {
    if (e.data instanceof ImageData) {
      const img: ImageData = e.data;
      // sum the R channel into accumulator (worker writes hits into channels)
      const data = img.data;
      const w = img.width;
      const h = img.height;
      const len = w * h;
      for (let p = 0, idx = 0; p < len; p++, idx += 4) {
        // use red channel as representative hit count
        const val = data[idx];
        if (val !== 0) {
          this.accumulator[p] += val;
          if (this.accumulator[p] > this.maxAcc) this.maxAcc = this.accumulator[p];
        }
      }

      this.totalSamplesProcessed += this.samplesPerBatch;
      this.drawAccumulatorToCanvas();
    } else if (typeof e.data === 'number') {
      // progress message (optional)
      // console.log('progress', e.data);
    } else {
      // other messages
      // console.log('worker message', e.data);
    }
  }

  private drawAccumulatorToCanvas(): void {
    // normalize accumulator by current max and draw to canvas
    const w = this.xRes;
    const h = this.yRes;
    const out = this.ctx.createImageData(w, h);
    if (this.maxAcc <= 0) {
      // nothing yet
      for (let i = 0; i < out.data.length; i += 4) {
        out.data[i] = 0;
        out.data[i + 1] = 0;
        out.data[i + 2] = 0;
        out.data[i + 3] = 255;
      }
      this.ctx.putImageData(out, 0, 0);
      return;
    }

    // normalization + optional gamma to make faint structure visible
    const gamma = 0.6;
    const max = this.maxAcc;
    for (let p = 0, dst = 0; p < w * h; p++, dst += 4) {
      const v = this.accumulator[p] / max;
      // scale and gamma-correct (adjust gamma to taste)
      const scaled = Math.pow(v, gamma);
      const intensity = Math.min(255, Math.floor(scaled * 255));
      // color mapping: simple grayscale -> map to warm color for nicer look
      out.data[dst] = Math.min(255, intensity * 1.0);           // R
      out.data[dst + 1] = Math.min(255, Math.floor(intensity * 0.6)); // G
      out.data[dst + 2] = Math.min(255, Math.floor(intensity * 0.35)); // B
      out.data[dst + 3] = 255;
    }
    this.ctx.putImageData(out, 0, 0);
  }

  // optional simple zoom helpers (mirror mandelbrot)
  zoomAt(pixelX: number, pixelY: number, percent = 0.5) {
    const frameWidth = this._maxX - this._minX;
    const frameHeight = this._maxY - this._minY;
    const pixelWidth = frameWidth / this.xRes;
    const pixelHeight = frameHeight / this.yRes;
    const real = this._minX + (pixelWidth * pixelX) + 0.5 * pixelWidth;
    const img = this._maxY - (pixelHeight * pixelY) + 0.5 * pixelHeight;
    this._minX = real - ((frameWidth / 2) * percent);
    this._maxX = real + ((frameWidth / 2) * percent);
    this._minY = img - ((frameHeight / 2) * percent);
    this._maxY = img + ((frameHeight / 2) * percent);
    this.resetAccumulator(); // changing window invalidates accumulator
  }

  resetView(): void {
    this._minX = -2.0;
    this._maxX = 1.0;
    this._minY = -1.5;
    this._maxY = 1.5;
    this.resetAccumulator();
  }
}