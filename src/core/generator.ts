import { findClosestColor, PaletteKey, ColorInfo } from './color_utils';
import { drawPattern } from './draw_utils';

export type Algorithm = 'average' | 'nearest' | 'gradient_enhanced';

export class PerlerBeadGenerator {
  static async generate(
    imageSource: HTMLImageElement,
    targetW: number,
    targetH: number,
    algorithm: Algorithm,
    paletteKey: PaletteKey,
    brightness: number = 0
  ): Promise<string> {
    // 1. Calculate crop and scale (Center Crop)
    const imgW = imageSource.width;
    const imgH = imageSource.height;
    
    const targetRatio = targetW / targetH;
    const imgRatio = imgW / imgH;

    let cropX = 0, cropY = 0, cropW = imgW, cropH = imgH;

    if (imgRatio > targetRatio) {
      // Image is wider, crop width
      cropW = imgH * targetRatio;
      cropX = (imgW - cropW) / 2;
    } else {
      // Image is taller, crop height
      cropH = imgW / targetRatio;
      cropY = (imgH - cropH) / 2;
    }

    const grid: ColorInfo[][] = [];
    const bOffset = brightness * 15; // Slight brightness adjustment

    if (algorithm === 'nearest') {
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Could not get 2d context');

      ctx.drawImage(imageSource, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
      const imageData = ctx.getImageData(0, 0, targetW, targetH).data;
      
      for (let r = 0; r < targetH; r++) {
        const row: ColorInfo[] = [];
        for (let c = 0; c < targetW; c++) {
          const idx = (r * targetW + c) * 4;
          let rVal = imageData[idx] + bOffset;
          let gVal = imageData[idx+1] + bOffset;
          let bVal = imageData[idx+2] + bOffset;
          rVal = Math.min(255, Math.max(0, rVal));
          gVal = Math.min(255, Math.max(0, gVal));
          bVal = Math.min(255, Math.max(0, bVal));
          
          const color = findClosestColor(rVal, gVal, bVal, paletteKey);
          row.push(color);
        }
        grid.push(row);
      }
    } else {
      // Average or Gradient Enhanced
      const cw = Math.floor(cropW);
      const ch = Math.floor(cropH);
      const origCanvas = document.createElement('canvas');
      origCanvas.width = cw;
      origCanvas.height = ch;
      const origCtx = origCanvas.getContext('2d', { willReadFrequently: true })!;
      origCtx.drawImage(imageSource, cropX, cropY, cropW, cropH, 0, 0, cw, ch);
      const origData = origCtx.getImageData(0, 0, cw, ch).data;

      const blockW = cw / targetW;
      const blockH = ch / targetH;

      const rawGrid: {r: number, g: number, b: number}[][] = [];

      for (let r = 0; r < targetH; r++) {
        const row: {r: number, g: number, b: number}[] = [];
        for (let c = 0; c < targetW; c++) {
          let sumR = 0, sumG = 0, sumB = 0, count = 0;
          const startY = Math.floor(r * blockH);
          const endY = Math.min(Math.floor((r + 1) * blockH), ch);
          const startX = Math.floor(c * blockW);
          const endX = Math.min(Math.floor((c + 1) * blockW), cw);

          for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
              const idx = (y * cw + x) * 4;
              sumR += Math.min(255, Math.max(0, origData[idx] + bOffset));
              sumG += Math.min(255, Math.max(0, origData[idx+1] + bOffset));
              sumB += Math.min(255, Math.max(0, origData[idx+2] + bOffset));
              count++;
            }
          }
          
          if (count === 0) count = 1;
          row.push({ r: sumR / count, g: sumG / count, b: sumB / count });
        }
        rawGrid.push(row);
      }

      if (algorithm === 'gradient_enhanced') {
        const enhancedGrid: {r: number, g: number, b: number}[][] = [];
        for (let r = 0; r < targetH; r++) {
          const row: {r: number, g: number, b: number}[] = [];
          for (let c = 0; c < targetW; c++) {
            const center = rawGrid[r][c];
            
            // Calculate local variance/gradient
            let diffSum = 0;
            let neighbors = 0;
            const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            
            for (const [dr, dc] of dirs) {
              const nr = r + dr, nc = c + dc;
              if (nr >= 0 && nr < targetH && nc >= 0 && nc < targetW) {
                const neighbor = rawGrid[nr][nc];
                diffSum += Math.abs(center.r - neighbor.r) + 
                           Math.abs(center.g - neighbor.g) + 
                           Math.abs(center.b - neighbor.b);
                neighbors++;
              }
            }
            
            const avgDiff = neighbors > 0 ? diffSum / neighbors : 0;
            
            // If the area is very flat (low gradient), don't enhance to preserve consistency
            if (avgDiff < 15) {
              row.push({ ...center });
            } else {
              // Weaker unsharp masking for edges
              //  0 -0.3  0
              // -0.3  2.2 -0.3
              //  0 -0.3  0
              const weightCenter = 2.2;
              const weightEdge = -0.3;
              
              let sumR = center.r * weightCenter;
              let sumG = center.g * weightCenter;
              let sumB = center.b * weightCenter;
              let validNeighbors = 0;

              for (const [dr, dc] of dirs) {
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < targetH && nc >= 0 && nc < targetW) {
                  sumR += rawGrid[nr][nc].r * weightEdge;
                  sumG += rawGrid[nr][nc].g * weightEdge;
                  sumB += rawGrid[nr][nc].b * weightEdge;
                  validNeighbors++;
                }
              }
              
              // Compensate for missing edges
              const missingEdges = 4 - validNeighbors;
              sumR += center.r * (missingEdges * weightEdge);
              sumG += center.g * (missingEdges * weightEdge);
              sumB += center.b * (missingEdges * weightEdge);

              row.push({
                r: Math.min(255, Math.max(0, sumR)),
                g: Math.min(255, Math.max(0, sumG)),
                b: Math.min(255, Math.max(0, sumB))
              });
            }
          }
          enhancedGrid.push(row);
        }

        for (let r = 0; r < targetH; r++) {
          const row: ColorInfo[] = [];
          for (let c = 0; c < targetW; c++) {
            const color = findClosestColor(enhancedGrid[r][c].r, enhancedGrid[r][c].g, enhancedGrid[r][c].b, paletteKey);
            row.push(color);
          }
          grid.push(row);
        }
      } else {
        for (let r = 0; r < targetH; r++) {
          const row: ColorInfo[] = [];
          for (let c = 0; c < targetW; c++) {
            const color = findClosestColor(rawGrid[r][c].r, rawGrid[r][c].g, rawGrid[r][c].b, paletteKey);
            row.push(color);
          }
          grid.push(row);
        }
      }
    }

    // 3. Render final pattern
    const outCanvas = document.createElement('canvas');
    const outCtx = outCanvas.getContext('2d')!;
    drawPattern(outCtx, grid);

    return outCanvas.toDataURL('image/png');
  }
}
