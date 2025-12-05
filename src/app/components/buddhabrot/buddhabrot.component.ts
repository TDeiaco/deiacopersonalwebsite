import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

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

  // timing / control
  batchIntervalMs = 250;
  private batchTimer: any = null;

  // Buddhabrot parameters
  samplesPerBatch = 50_000; // number of random samples per worker batch
  iterationCount = 1000;
  hitWeight = 1;

  // canvas / accumulator
  public xRes = 700;
  public yRes = 700;
  // accumulator stores R,G,B per pixel (length = w*h*3)
  private accumulator!: Float32Array;
  // per-channel max seen (for normalization)
  public maxAcc = [0, 0, 0];
  public totalSamplesProcessed = 0;

  // view window (same defaults as mandelbrot)
  _minX = -2.0;
  _maxX = 1.0;
  _minY = -1.5;
  _maxY = 1.5;

  // batch/channel bookkeeping
  private batchIndex = 0; // increments each posted batch
  private pendingChannel: number | null = null; // channel (0=R,1=G,2=B) for the in-flight batch

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
    const pixels = this.xRes * this.yRes;
    this.accumulator = new Float32Array(pixels * 3); // R,G,B per pixel
    this.maxAcc = [0, 0, 0];
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
    // start the post/draw loop; post first batch immediately
    this.postWorkerBatch();
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    // Note: if a worker is currently processing, we'll still accept its response,
    // but we won't queue another batch after it.
  }

  singleBatch(): void {
    // post a single batch without changing running state
    this.postWorkerBatch();
  }

  private postWorkerBatch(): void {
    // guard
    if (!this.worker) return;
    // prevent posting a new batch while one is pending
    if (this.pendingChannel !== null) return;

    // determine which channel this batch will contribute to
    const channel = this.batchIndex % 3; // 0 = R, 1 = G, 2 = B
    this.pendingChannel = channel;
    this.batchIndex++;

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
      // we intentionally do not require the worker to echo channel back;
      // the client maps the incoming ImageData to the pendingChannel.
    };
    try {
      this.worker.postMessage(message);
    } catch (err) {
      console.error('Worker.postMessage failed', err);
      this.pendingChannel = null;
      this.stop();
      return;
    }
  }

  private handleWorkerMessage(e: MessageEvent) {
    // If the worker returns an ImageData, sum it into the appropriate color accumulator channel.
    if (e.data instanceof ImageData) {
      const img: ImageData = e.data;
      const data = img.data;
      const w = img.width;
      const h = img.height;
      const len = w * h;

      // pick the channel that was pending when this batch was posted; if none, use round-robin fallback
      const channel = this.pendingChannel !== null ? this.pendingChannel : (this.batchIndex % 3);

      // For stability, sum all three channels from worker into the selected accumulator channel.
      // (Worker may encode hits in any channel; summing ensures energy is captured.)
      for (let p = 0, idx = 0; p < len; p++, idx += 4) {
        const sumHits = data[idx] + data[idx + 1] + data[idx + 2];
        if (sumHits !== 0) {
          const base = p * 3 + channel;
          this.accumulator[base] += sumHits * this.hitWeight;
          if (this.accumulator[base] > this.maxAcc[channel]) {
            this.maxAcc[channel] = this.accumulator[base];
          }
        }
      }

      this.totalSamplesProcessed += this.samplesPerBatch;

      // mark that the pending batch has been consumed
      this.pendingChannel = null;

      // draw the current accumulator to the canvas
      this.drawAccumulatorToCanvas();

      // if still running, schedule the next batch after the interval
      if (this.isRunning) {
        this.batchTimer = setTimeout(() => this.postWorkerBatch(), this.batchIntervalMs);
      }
    } else if (typeof e.data === 'number') {
      // progress message from worker (optional)
      // console.log('worker progress:', e.data);
    } else {
      // other messages
      // console.log('worker message', e.data);
    }
  }

  private drawAccumulatorToCanvas(): void {
    const w = this.xRes;
    const h = this.yRes;
    const out = this.ctx.createImageData(w, h);

    // if nothing yet, draw blank
    if (this.maxAcc[0] <= 0 && this.maxAcc[1] <= 0 && this.maxAcc[2] <= 0) {
      for (let i = 0; i < out.data.length; i += 4) {
        out.data[i] = 0;
        out.data[i + 1] = 0;
        out.data[i + 2] = 0;
        out.data[i + 3] = 255;
      }
      this.ctx.putImageData(out, 0, 0);
      return;
    }

    // normalization + gamma to make structure visible
    const gamma = 0.6;

    const maxR = this.maxAcc[0] > 0 ? this.maxAcc[0] : 1;
    const maxG = this.maxAcc[1] > 0 ? this.maxAcc[1] : 1;
    const maxB = this.maxAcc[2] > 0 ? this.maxAcc[2] : 1;

    for (let p = 0, dst = 0; p < w * h; p++, dst += 4) {
      const rAcc = this.accumulator[p * 3 + 0];
      const gAcc = this.accumulator[p * 3 + 1];
      const bAcc = this.accumulator[p * 3 + 2];

      const rV = Math.pow(Math.min(1, rAcc / maxR), gamma);
      const gV = Math.pow(Math.min(1, gAcc / maxG), gamma);
      const bV = Math.pow(Math.min(1, bAcc / maxB), gamma);

      out.data[dst] = Math.min(255, Math.floor(rV * 255));
      out.data[dst + 1] = Math.min(255, Math.floor(gV * 255));
      out.data[dst + 2] = Math.min(255, Math.floor(bV * 255));
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