import * as math from 'mathjs';

/**
 * Calculates a value based on a given expression and iteration count.
 * The expression must contain a color as the left-hand operand and can use
 * the parameter "iters" as the input.
 *
 * @param expression - The expression to evaluate.
 * @param iterations - The iteration count.
 * @returns The calculated value.
 */
function calcExpression(expression: string, iterations: number): number {
    const scope = {
        iters: iterations,
    };
    return math.evaluate(expression, scope) as number;
}

/**
 * Renders the Mandelbrot set and sends the image data back to the caller.
 *
 * @param maxX - Maximum X value of the frame.
 * @param minX - Minimum X value of the frame.
 * @param maxY - Maximum Y value of the frame.
 * @param minY - Minimum Y value of the frame.
 * @param xRes - Horizontal resolution of the image.
 * @param yRes - Vertical resolution of the image.
 * @param useColorFormat - Whether to use a custom color format.
 * @param colorFormatR - Expression for the red color component.
 * @param colorFormatG - Expression for the green color component.
 * @param colorFormatB - Expression for the blue color component.
 * @param iterationCount - Maximum number of iterations.
 */
function RenderMandelbrot(
    maxX: number,
    minX: number,
    maxY: number,
    minY: number,
    xRes: number,
    yRes: number,
    useColorFormat: boolean,
    colorFormatR: string,
    colorFormatG: string,
    colorFormatB: string,
    iterationCount: number
) { // Changed return type to ImageData
    try {
        const frameWidth = maxX - minX;
        const frameHeight = maxY - minY;
        const pixelWidth = frameWidth / xRes;
        const pixelHeight = frameHeight / yRes;
        const imageData = new ImageData(xRes, yRes);
        console.log(frameWidth);
        console.log(frameHeight);
        console.log(pixelWidth);
        console.log(pixelHeight);

        for (let iy = 0; iy < yRes; iy++) {
            for (let ix = 0; ix < xRes; ix++) {
                const pixelX = minX + (pixelWidth * ix) + (0.5 * pixelWidth);
                const pixelY = maxY - (pixelHeight * iy) + (0.5 * pixelHeight);
                let iteration = 0;

                let x = 0.0;
                let y = 0.0;
                while ((x * x) + (y * y) <= 4.0 && iteration < iterationCount) {
                    const xTemp = (x * x) - (y * y) + pixelX;
                    y = (2 * x * y) + pixelY;
                    x = xTemp;
                    iteration++;
                }

                const startIndex = (iy * (imageData.width * 4)) + (ix * 4);
                if (useColorFormat) {
                    imageData.data[startIndex] = colorFormatR === "default" ? (iteration % 255) : calcExpression(colorFormatR, iteration);
                    imageData.data[startIndex + 1] = colorFormatG === "default" ? ((iteration % 127) * 2) : calcExpression(colorFormatG, iteration);
                    imageData.data[startIndex + 2] = colorFormatB === "default" ? ((iteration % 63) * 4) : calcExpression(colorFormatB, iteration);
                } else {
                    imageData.data[startIndex] = iteration % 255;
                    imageData.data[startIndex + 1] = (iteration % 127) * 2;
                    imageData.data[startIndex + 2] = (iteration % 63) * 4;
                }
                // TODO: Lerp the colors
            }
            if (iy % 100 == 0)
                postMessage(iy);

            if (iy == yRes - 1)
                postMessage(iy);
        }
        postMessage(imageData)
       // return imageData; // Return the ImageData
    } catch (e: any) {
        console.error(e); // Use console.error for errors
        throw e; // Re-throw the error to be caught by the caller
    }
}

/**
 * Renders the Buhddabrot set and sends the image data back to the caller.
 *
 * @param maxX - Maximum X value of the frame.
 * @param minX - Minimum X value of the frame.
 * @param maxY - Maximum Y value of the frame.
 * @param minY - Minimum Y value of the frame.
 * @param xRes - Horizontal resolution of the image.
 * @param yRes - Vertical resolution of the image.
 * @param samples - Number of samples to use.
 * @param iterationCount - Maximum number of iterations.
 * @param hitWeight - Weight to apply to hit pixels.
 */
function RenderBuhddabrot(
    maxX: number,
    minX: number,
    maxY: number,
    minY: number,
    xRes: number,
    yRes: number,
    samples: number,
    iterationCount: number,
    hitWeight: number
): ImageData { //changed return type to imagedata
    try {
        const frameWidth = maxX - minX;
        const frameHeight = maxY - minY;
        const pixelWidth = frameWidth / xRes;
        const pixelHeight = frameHeight / yRes;
        const imageData = new ImageData(xRes, yRes);

        for (let iy = 0; iy < yRes; iy++) {
            for (let ix = 0; ix < xRes; ix++) {
                imageData.data[(ix * (imageData.width * 4)) + (iy * 4)] = 0;
            }
        }

        for (let i = 0; i < samples; i++) {
            const pixelX = ((Math.random() * (maxX - minX)) + minX); // _minX + (pixelWidth * (math.random(0, _xRes)) + (0.5 * pixelWidth));
            const pixelY = ((Math.random() * (maxY - minY)) + minY); // _maxY - (pixelHeight * (math.random(0, _yRes)) - (0.5 * pixelHeight));

            let iteration = 0;
            let x = 0.0;
            let y = 0.0;
            const stops: number[] = [];

            while ((x * x) + (y * y) <= 4.0 && iteration < iterationCount) {
                const xTemp = (x * x) - (y * y) + pixelX;
                y = (2 * x * y) + pixelY;
                x = xTemp;

                let pixelCoordX = (x - minX - (0.5 * pixelWidth)) / pixelWidth;
                pixelCoordX = Math.round(pixelCoordX);

                let pixelCoordY = (maxY - y + (0.5 * pixelHeight)) / pixelHeight;
                pixelCoordY = Math.round(pixelCoordY);

                const index = (pixelCoordX * (imageData.width * 4)) + (pixelCoordY * 4);
                stops.push(index);

                iteration++;
            }

            if (iteration !== iterationCount) {
                stops.forEach((s) => {
                    imageData.data[s] += hitWeight % i;
                    imageData.data[s + 1] += hitWeight % (255 % i);
                    imageData.data[s + 2] += hitWeight % (255 % i);
                });
            }
        }
        postMessage(imageData);
        return imageData;
    } catch (e: any) {
        console.error(e); // Use console.error
        throw e;
    }
}

self.addEventListener("message", function (e) {
    switch (e.data.mode) {
        case "mandelbrot":
            console.log("rendering mandelbrot");
            RenderMandelbrot(e.data.maxX, e.data.minX, e.data.maxY, e.data.minY, e.data.xRes, e.data.yRes, e.data.useColorFormat, e.data.colorFormatR, e.data.colorFormatG, e.data.colorFormatB, e.data.iterationCount);
            break;
        case "nebulabrot":
            console.log("rendering nebulabrot");
            RenderBuhddabrot(e.data.maxX, e.data.minX, e.data.maxY, e.data.minY, e.data.xRes, e.data.yRes, e.data.samples, e.data.iterationCount, e.data.hitWeight);
            break;
    }
}, false);