import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { NgIf } from '@angular/common'; // Import NgIf

import * as math from 'mathjs'; // Import math.js

@Component({
    standalone:true,
    selector: 'app-mandelbrot',
    templateUrl: './mandelbrot.component.html',
    styleUrl: './mandelbrot.component.css',
    imports: [FormsModule, NgIf]
})
export class MandelbrotComponent implements AfterViewInit, OnDestroy {
    @ViewChild('fractalCanvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;
    private ctx!: CanvasRenderingContext2D;
    private worker: Worker;
    private isWorkerBusy = false;

    // Component properties to hold form values
    iterationCount = 100;
    useColorFormat = false;
    colorFormatR = 'iters%255';
    colorFormatG = '(iters%127)*2';
    colorFormatB = '(iters%63)*4';
    exportResolution = 2400;
    elapsedTime = '';
    exportProgress = '';
    isRendering = false;  // Add this
    isExporting = false;  // Add this
    currentX = 0;
    currentY = 0;
    _minX = -2.0;
    _maxX = 1.0;
    _minY = -1.5;
    _maxY = 1.5;
    _xRes = 600;
    _yRes = 600;
    windowCoords : {real:number, img:number, realRange:number, imgRange:number} 
        = {real:0,img:0,realRange:0,imgRange:0}
        

    constructor() {
        // Use a dynamic import to load the worker script.
        this.worker = new Worker(new URL('fractal.worker.ts', import.meta.url));
    }

    ngAfterViewInit(): void {
        this.ctx = this.canvas.nativeElement.getContext('2d')!;
        this.renderFractal();
        this.setupCanvasEvents(); //set up the events
    }

    ngOnDestroy(): void {
        this.worker.terminate();
    }

    setupCanvasEvents() {
        const canvasElement = this.canvas.nativeElement;
        canvasElement.addEventListener('click', (e) => {
            this.isRendering = true;
            this.updateCurrentMouseCoords(e);
            let zoomLevel = 0.1;
            if (e.altKey) {
                zoomLevel = 10;
            }
            if (e.ctrlKey) {
                zoomLevel = 1.0;
            }

            this.zoom(zoomLevel);
            this.renderFractal();
        });
    }

    updateCurrentMouseCoords(e: MouseEvent) {
        const rect = this.canvas.nativeElement.getBoundingClientRect();
        this.currentX = e.clientX - rect.left;
        this.currentY = e.clientY - rect.top;
    }

    zoom(percent: number) {
        const frameWidth = this._maxX - this._minX;
        const frameHeight = this._maxY - this._minY;
        const pixelWidth = frameWidth / this._xRes;
        const pixelHeight = frameHeight / this._yRes;

        const pixelX = this._minX + (pixelWidth * this.currentX) + (0.5 * pixelWidth);
        const pixelY = this._maxY - (pixelHeight * this.currentY) + (0.5 * pixelHeight);

        this._minX = pixelX - ((frameWidth / 2) * percent);
        this._maxX = pixelX + ((frameWidth / 2) * percent);
        this._minY = pixelY - ((frameHeight / 2) * percent);
        this._maxY = pixelY + ((frameHeight / 2) * percent);

        this.windowCoords = this.getWindowCoords()
    }

    getWindowCoords(){
        var frameWidth = this._maxX - this._minX;
        var frameHeight = this._maxY - this._minY;
        var pixelWidth = frameWidth / this._xRes;
        var pixelHeight = frameHeight / this._yRes;
        var real = this._minX + (pixelWidth * this.currentX) + (0.5 * pixelWidth);
        var img = this._maxY - (pixelHeight * this.currentY) + (0.5 * pixelHeight);
        var realRange = this._maxX - this._minX;
        var imgRange = this._maxY - this._minY;
        return {real:real, img:img, realRange: realRange, imgRange:imgRange }
    }

    resetHomeAndRender() {
        this._xRes = 600;
        this._yRes = 600;
        this._minX = -2.0;
        this._maxX = 1.0;
        this._minY = -1.5;
        this._maxY = 1.5;
        this.currentX = 0;
        this.currentY = 0;
        this.renderFractal();
        this.windowCoords = this.getWindowCoords()
    }

    // renderBuddhabrot(): void {
    //     if (this.isWorkerBusy) {
    //         return;
    //     }
    //     this.isWorkerBusy = true;
    //     this.isRendering = true; // set to true before starting render
    //     const canvas = this.canvas.nativeElement;
    //     this._xRes = canvas.width;
    //     this._yRes = canvas.height;


    //     var workerMessage = {
    //                 mode: "nebulabrot",
    //                 maxX: this._maxXNeb, minX: this._minXNeb, maxY: this._maxYNeb, minY: this._minYNeb, xRes: this._xResNeb, yRes: this._yResNeb,
    //                 samples: sampleCountInputNeb.value,
    //                 iterationCount: iterationCountInputNeb.value,
    //                 hitWeight: weightInputNeb.value
    //             }


    //     const startTime = Date.now();
    //     this.worker.postMessage(workerMessage);

    //     this.worker.onmessage = (event: MessageEvent) => {
    //         this.isWorkerBusy = false;
    //         this.isRendering = false; // set to false when rendering is complete
    //         console.log(event.data)
    //         if (event.data instanceof ImageData) {
    //             this.ctx.putImageData(event.data, 0, 0);

    //             for (var i = 0; i < event.data.data.length; i += 4) {
    //                 var index = i / 4;
    //                 this.ctx.fillStyle = "rgba(" + event.data.data[i] + "," + event.data.data[i + 1] + "," + event.data.data[i + 2] + "," + 1.0 + ")";
    //                 this.ctx.fillRect(index % this._xRes, (Math.trunc(index / this._xRes) + 1), 1, 1);
    //             }

    //             const endTime = Date.now();
    //             this.elapsedTime = ((endTime - startTime) / 1000).toFixed(2) + " seconds";
    //         } else {
    //             console.log(event.data);
    //         }
    //     };

    //     this.worker.onerror = (error) => {
    //         this.isWorkerBusy = false;
    //         this.isRendering = false;
    //         console.error("Worker error:", error);
    //     };
    // }

    renderFractal(): void {
        if (this.isWorkerBusy) {
            return;
        }
        this.isWorkerBusy = true;
        this.isRendering = true; // set to true before starting render
        const canvas = this.canvas.nativeElement;
        this._xRes = canvas.width;
        this._yRes = canvas.height;


        const workerMessage = {
            mode: 'mandelbrot',
            maxX: this._maxX,
            minX: this._minX,
            maxY: this._maxY,
            minY: this._minY,
            xRes: this._xRes,
            yRes: this._yRes,
            useColorFormat: this.useColorFormat,
            colorFormatR: this.colorFormatR,
            colorFormatG: this.colorFormatG,
            colorFormatB: this.colorFormatB,
            iterationCount: this.iterationCount,
        };

        const startTime = Date.now();
        this.worker.postMessage(workerMessage);

        this.worker.onmessage = (event: MessageEvent) => {
            this.isWorkerBusy = false;
            this.isRendering = false; // set to false when rendering is complete
            console.log(event.data)
            if (event.data instanceof ImageData) {
                this.ctx.putImageData(event.data, 0, 0);

                

                for (var i = 0; i < event.data.data.length; i += 4) {
                    var index = i / 4;
                    this.ctx.fillStyle = "rgba(" + event.data.data[i] + "," + event.data.data[i + 1] + "," + event.data.data[i + 2] + "," + 1.0 + ")";
                    this.ctx.fillRect(index % this._xRes, (Math.trunc(index / this._xRes) + 1), 1, 1);
                }

                const endTime = Date.now();
                this.elapsedTime = ((endTime - startTime) / 1000).toFixed(2) + " seconds";
            } else {
                console.log(event.data);
            }
        };

        this.worker.onerror = (error) => {
            this.isWorkerBusy = false;
            this.isRendering = false;
            console.error("Worker error:", error);
        };
    }

    exportRender(event: MouseEvent) {
        event.preventDefault(); // prevent the default <a> tag behavior
        this.isExporting = true;
        const exportResolutionX = this.exportResolution;
        const exportResolutionY = exportResolutionX; //maintain aspect ratio
        this.exportProgress = "0%";

        const workerMessage = {
            mode: 'mandelbrot',
            maxX: this._maxX,
            minX: this._minX,
            maxY: this._maxY,
            minY: this._minY,
            xRes: exportResolutionX,
            yRes: exportResolutionY,
            useColorFormat: this.useColorFormat,
            colorFormatR: this.colorFormatR,
            colorFormatG: this.colorFormatG,
            colorFormatB: this.colorFormatB,
            iterationCount: this.iterationCount,
        };

        this.worker.postMessage(workerMessage);

        this.worker.onmessage = (event: MessageEvent) => {

            if (event.data instanceof ImageData) {
                console.log(event.data)
                this.exportProgress = "100%"
                var c = document.createElement('canvas');
                c.width = exportResolutionX;
                c.height = exportResolutionY;
                var ctx2 = c.getContext('2d')!;

                for (var i = 0; i < event.data.data.length; i += 4) {
                    var index = i / 4;
                    ctx2.fillStyle = "rgba(" + event.data.data[i] + "," + event.data.data[i + 1] + "," + event.data.data[i + 2] + "," + 1.0 + ")";
                    ctx2.fillRect(index % workerMessage.xRes, (Math.trunc(index / workerMessage.xRes) + 1), 1, 1);
                }

                var link = document.createElement('a');
                link.download = 'mandelbrotHighRes.png';
                link.href = c.toDataURL();
                link.click();

                this.isExporting = false;
                this.exportProgress = "";

            } else if (typeof event.data === 'number') {
                this.exportProgress = Math.round((event.data / exportResolutionY) * 100) + "%";
                console.log("export progress", this.exportProgress)
            } else {
                console.log(event.data);
            }
        };

        this.worker.onerror = (error) => {
            this.isExporting = false;
            console.error("Worker error:", error);
            this.exportProgress = "";
        };
    }

    
}