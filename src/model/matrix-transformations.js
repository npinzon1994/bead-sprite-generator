import KDTree from "./kd-tree";

export function parseColors(pixels) {
  const colors = {};
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    const colorKey = `R${r}G${g}B${b}A${a}`;

    if (!colors[colorKey]) {
      colors[colorKey] = { r, g, b, a };
    }
  }
  return colors;
}

export function toMatrix(rgbArray, colorMode = "RGBA") {
 if (rgbArray.length % 3 !== 0 && rgbArray.length % 4 !== 0) {
    throw new Error("Invalid pixel data length. Image may be corrupted.");
  }

  const r = [];
  const g = [];
  const b = [];
  const a = [];

  //for converting values from IMAGE (accounting for transparent pixels)
  if (colorMode === "RGBA") {
    for (let i = 0; i < rgbArray.length; i += 4) {
      r.push(rgbArray[i]);
      g.push(rgbArray[i + 1]);
      b.push(rgbArray[i + 2]);
      a.push(rgbArray[i + 3]);
    }
  }

  //for converting values from WEB SCRAPER (their data omits alpha values)
  if (colorMode === "RGB") {
    for (let i = 0; i < rgbArray.length; i += 3) {
      r.push(rgbArray[i]);
      g.push(rgbArray[i + 1]);
      b.push(rgbArray[i + 2]);
    }
  }

  //only include alpha values if they exist
  return a.length > 0 ? [r, g, b, a] : [r, g, b];
}

export function RGBAtoXYZA(rgbaMatrix) {
  //checking for empty input matrix
  if (
    rgbaMatrix.length === 4 &&
    (!Array.isArray(rgbaMatrix) ||
      rgbaMatrix.length < 3 ||
      rgbaMatrix.some((row) => !Array.isArray(row) || row.length === 0))
  ) {
    throw new Error("Input matrix cannot be empty");
  }

  if (
    rgbaMatrix.length === 3 &&
    (!Array.isArray(rgbaMatrix) ||
      rgbaMatrix.length < 3 ||
      rgbaMatrix.some((row) => !Array.isArray(row) || row.length === 0))
  ) {
    throw new Error("Lookup table cannot be empty");
  }

  const CONVERSION_MATRIX = [
    [0.4124564, 0.3575761, 0.1804375],
    [0.2126729, 0.7151522, 0.072175],
    [0.0193339, 0.119192, 0.9503041],
  ];
  const r = rgbaMatrix[0];
  const g = rgbaMatrix[1];
  const b = rgbaMatrix[2];

  //filling in alpha values whether it's the INPUT MATRIX or LOOKUP TABLE (doesn't have alpha values) 
  const a = rgbaMatrix.length === 4 ? rgbaMatrix[3] : Array(r.length).fill(255);

  //separating RGB values for matrix multiplication
  const newMatrix_RGB = [r, g, b];
  // console.log("New RGB Matrix: ", newMatrix_RGB);

  const normalizedValues = newMatrix_RGB.map((innerArray) =>
    innerArray.map((value) => value / 255)
  );
  // console.log("Normalized Values: ", normalizedValues);

  const linearizedValues = normalizedValues.map((innerArray) =>
    innerArray.map((value) =>
      value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
    )
  );
  // console.log("Linearized Values: ", linearizedValues);

  // Get dimensions of the matrices
  const rowsA = CONVERSION_MATRIX.length;
  const colsA = CONVERSION_MATRIX[0].length;
  const colsB = linearizedValues[0].length;

  // Initialize the result matrix with zeros (to ensure it isn't sparse)
  const result = Array(rowsA)
    .fill(null)
    .map(() => Array(colsB).fill(0));

  // Perform the matrix multiplication
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        //k keeps track of elements in dot product
        result[i][j] += CONVERSION_MATRIX[i][k] * linearizedValues[k][j];
      }
    }
  }
  // console.log("Converting RGB to XYZ");
  // console.log("XYZ Array: ", result);
  return { xyz: result, a };
}

function transformationFunction_XYZtoLAB(t) {
  return t > 0.008856 ? Math.cbrt(t) : 7.787 * t + (16 / 116);
}

export function XYZtoLab(
  xyzPixel,
  whitePoint = { X: 0.95047, Y: 1, Z: 1.08883 }
) {
   const { x, y, z } = xyzPixel;
  
    //D65 reference white point
    const { X: Xn, Y: Yn, Z: Zn } = whitePoint;
  
    //X, Y, and Z come from matrix we get back from RGBtoXYZ conversion
  
    //Normalize XYZ by the reference white point
    const Xr = x / Xn;
    const Yr = y / Yn;
    const Zr = z / Zn;
  
    //apply transformation function
    const fX = transformationFunction_XYZtoLAB(Xr);
    const fY = transformationFunction_XYZtoLAB(Yr);
    const fZ = transformationFunction_XYZtoLAB(Zr);
  
    //calculate CIELAB values
    const L = 116 * fY - 16;
    const a = 500 * (fX - fY);
    const b = 200 * (fY - fZ);
  
    return [L, a, b];
}

export function LabToXYZ(
  labPixel,
  whitePoint = { X: 0.95047, Y: 1, Z: 1.08883 }
) {
  const L = labPixel[0];
  const a = labPixel[1];
  const b = labPixel[2];

  const { X: Xn, Y: Yn, Z: Zn } = whitePoint;

  // Reverse f(t) transformation
  const delta = 6 / 29;
  const fInverse = (t) => (t > delta ? t ** 3 : 3 * delta ** 2 * (t - 4 / 29));

  // Calculate fX, fY, and fZ
  const fY = (L + 16) / 116;
  const fX = fY + a / 500;
  const fZ = fY - b / 200;

  // Apply fInverse to get normalized Xr, Yr, Zr
  const Xr = fInverse(fX);
  const Yr = fInverse(fY);
  const Zr = fInverse(fZ);

  // Denormalize by multiplying with the reference white point
  const x = Xr * Xn;
  const y = Yr * Yn;
  const z = Zr * Zn;

  // console.log("XYZ Point: ", { x, y, z });

  return { x, y, z };
}

export function XYZtoRGB(xyzPixel) {
 const { x, y, z } = xyzPixel;

  // Transformation matrix for converting XYZ to linear RGB (sRGB D65)
  const M = [
    [3.2406, -1.5372, -0.4986],
    [-0.9689, 1.8758, 0.0415],
    [0.0557, -0.204, 1.057],
  ];

  // Convert XYZ to linear RGB
  const rLinear = M[0][0] * x + M[0][1] * y + M[0][2] * z;
  const gLinear = M[1][0] * x + M[1][1] * y + M[1][2] * z;
  const bLinear = M[2][0] * x + M[2][1] * y + M[2][2] * z;

  // Gamma correction function for sRGB
  const gammaCorrect = (c) =>
    c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

  // Apply gamma correction and clamp values to the [0, 1] range
  const r = Math.min(Math.max(gammaCorrect(rLinear), 0), 1);
  const g = Math.min(Math.max(gammaCorrect(gLinear), 0), 1);
  const b = Math.min(Math.max(gammaCorrect(bLinear), 0), 1);

  // console.log("RGB point: ", {
  //   r: Math.round(r * 255),
  //   g: Math.round(g * 255),
  //   b: Math.round(b * 255),
  // })

  // Scale to 8-bit RGB range [0, 255]
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function processImage(pixels, scrapedColors) {
  //Getting colors into correct shape [[r, g, b, a], [r, g, b, a], ...]
  const colors = Object.values(parseColors(pixels)).flatMap(({ r, g, b, a }) => [r, g, b, a]);

  //using this table because of new scrapedColors structure
  const table = Object.values(scrapedColors).flatMap((color) => [color.r, color.g, color.b]);
  console.log("Raw scraped colors: ", scrapedColors);
  console.log("Scraped Colors Table: ", table);

  //convert and transform
  const colorsMatrix_RGBA = toMatrix(colors);
  const colorsMatrix_XYZA = RGBAtoXYZA(colorsMatrix_RGBA);

  const lookupTableMatrix_RGB = toMatrix(table, "RGB");
  const lookupTableMatrix_XYZA = RGBAtoXYZA(lookupTableMatrix_RGB);

  // Converting each XYZ pixel to Lab pixel -- COLORS FROM IMAGE
  const colors_LabValues = [];
  for (let i = 0; i < colorsMatrix_XYZA.xyz[0].length; i++) {
    const pixel = [];
    for (let j = 0; j < colorsMatrix_XYZA.xyz.length; j++) {
      pixel.push(colorsMatrix_XYZA.xyz[j][i]);
    }
    const xyzPixel = {
      x: pixel[0],
      y: pixel[1],
      z: pixel[2],
    };
    const labPixel = Object.values(XYZtoLab(xyzPixel));
    // console.log("Lab Pixel (IMAGE): ", labPixel);
    colors_LabValues.push(labPixel);
  }

  //Converting each XYZ pixel to Lab pixel -- LOOKUP TABLE
  const lookupTable_LabValues = [];
  for (let i = 0; i < lookupTableMatrix_XYZA.xyz[0].length; i++) {
    const pixel = [];
    for (let j = 0; j < lookupTableMatrix_XYZA.xyz.length; j++) {
      pixel.push(lookupTableMatrix_XYZA.xyz[j][i]);
    }
    const xyzPixel = {
      x: pixel[0],
      y: pixel[1],
      z: pixel[2],
    };
    const labPixel = Object.values(XYZtoLab(xyzPixel));
    // console.log("Lab Pixel (TABLE): ", labPixel);
    lookupTable_LabValues.push(labPixel);
  }

  //now find nearest neighbor
  // console.log("TABLE: ", table);
  const colorLookupTree = new KDTree(lookupTable_LabValues);

  const nuColors = []; //COLOR PALETTE
  for (let i = 0; i < colors_LabValues.length; i++) {
    const labPixel = [colors_LabValues[i][0], colors_LabValues[i][1], colors_LabValues[i][2]]; //separating out RGB for calculation
    const newValue = colorLookupTree.findNearestNeighbor(labPixel).point;
    const xyzPixel = LabToXYZ(newValue); //returns object
    const rgbaPixel = { ...XYZtoRGB(xyzPixel), a: colorsMatrix_RGBA[3][i] };
    nuColors.push(rgbaPixel);
  }

  const colorKeys = Object.keys(parseColors(pixels));
  const newColorKeys = nuColors.map(({ r, g, b, a }) => `R${r}G${g}B${b}A${a}`);

  const colorComparisonChart = {};
  for (let i = 0; i < colorKeys.length; i++) {
    colorComparisonChart[colorKeys[i]] = newColorKeys[i];
  }

  const updatedPixels = [];
  for (let i = 0; i < pixels.length; i += 4) {
    const colorKey = `R${pixels[i]}G${pixels[i + 1]}B${pixels[i + 2]}A${pixels[i + 3]
      }`;

    const extractedValues = colorComparisonChart[colorKey]
      .match(/\d+/g)
      .map(Number);

    updatedPixels.push(
      extractedValues[0],
      extractedValues[1],
      extractedValues[2],
      extractedValues[3]
    );
  }
  return { updatedPixels, lookupTable_LabValues };
}
