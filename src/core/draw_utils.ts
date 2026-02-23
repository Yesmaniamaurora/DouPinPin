import { ColorInfo } from './color_utils';

export function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function drawPattern(
  ctx: CanvasRenderingContext2D,
  grid: ColorInfo[][],
  cellSize: number = 40,
  margin: number = 60
) {
  const rows = grid.length;
  const cols = grid[0].length;

  // Calculate statistics
  const statsMap = new Map<string, { color: ColorInfo, count: number }>();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (!statsMap.has(cell.code)) {
        statsMap.set(cell.code, { color: cell, count: 0 });
      }
      statsMap.get(cell.code)!.count++;
    }
  }
  const stats = Array.from(statsMap.values()).sort((a, b) => b.count - a.count);

  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;

  const statItemWidth = Math.max(120, cellSize * 3);
  const statItemHeight = cellSize;
  const statSpacingX = 20;
  const statSpacingY = 20;

  const maxStatsPerRow = Math.max(1, Math.floor(gridWidth / (statItemWidth + statSpacingX)));
  const statsRows = Math.ceil(stats.length / maxStatsPerRow);
  const statsSectionHeight = statsRows * (statItemHeight + statSpacingY);

  const width = Math.max(gridWidth + margin * 2, statItemWidth + margin * 2);
  const height = gridHeight + margin * 2.5 + statsSectionHeight + margin; // Increased spacing

  const offsetX = (width - gridWidth) / 2;
  const offsetY = margin;

  ctx.canvas.width = width;
  ctx.canvas.height = height;

  // Fill background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${cellSize * 0.35}px sans-serif`;

  // Draw cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const color = grid[r][c];
      const x = offsetX + c * cellSize;
      const y = offsetY + r * cellSize;

      // Fill cell
      ctx.fillStyle = `rgb(${color.rgb[0]}, ${color.rgb[1]}, ${color.rgb[2]})`;
      ctx.fillRect(x, y, cellSize, cellSize);

      // Draw grid line
      ctx.strokeStyle = '#e5e7eb'; // gray-200
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, cellSize, cellSize);

      // Draw text
      const lum = getLuminance(color.rgb[0], color.rgb[1], color.rgb[2]);
      ctx.fillStyle = lum > 128 ? '#111827' : '#ffffff'; // gray-900 or white
      ctx.fillText(color.code, x + cellSize / 2, y + cellSize / 2);
    }
  }

  // Draw thick grid lines every 10 cells
  ctx.strokeStyle = '#4b5563'; // gray-600
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let c = 10; c < cols; c += 10) {
    const x = offsetX + c * cellSize;
    ctx.moveTo(x, offsetY);
    ctx.lineTo(x, offsetY + gridHeight);
  }
  for (let r = 10; r < rows; r += 10) {
    const y = offsetY + r * cellSize;
    ctx.moveTo(offsetX, y);
    ctx.lineTo(offsetX + gridWidth, y);
  }
  // Also draw a thick border around the whole grid
  ctx.rect(offsetX, offsetY, gridWidth, gridHeight);
  ctx.stroke();

  // Draw coordinates
  ctx.fillStyle = '#374151'; // gray-700
  
  for (let c = 0; c < cols; c++) {
    const text = (c + 1).toString();
    const isTen = (c + 1) % 10 === 0;
    ctx.font = isTen ? `bold ${margin * 0.4}px sans-serif` : `${margin * 0.3}px sans-serif`;
    const x = offsetX + c * cellSize + cellSize / 2;
    // Top
    ctx.fillText(text, x, offsetY - margin / 2);
    // Bottom
    ctx.fillText(text, x, offsetY + gridHeight + margin / 2);
  }

  for (let r = 0; r < rows; r++) {
    const text = (r + 1).toString();
    const isTen = (r + 1) % 10 === 0;
    ctx.font = isTen ? `bold ${margin * 0.4}px sans-serif` : `${margin * 0.3}px sans-serif`;
    const y = offsetY + r * cellSize + cellSize / 2;
    // Left
    ctx.fillText(text, offsetX - margin / 2, y);
    // Right
    ctx.fillText(text, offsetX + gridWidth + margin / 2, y);
  }

  // Draw statistics
  const statsStartY = offsetY + gridHeight + margin * 1.5; // Increased spacing
  
  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    const row = Math.floor(i / maxStatsPerRow);
    const col = i % maxStatsPerRow;
    
    // Center the stats block if it's smaller than the grid
    const actualStatsWidth = Math.min(stats.length, maxStatsPerRow) * (statItemWidth + statSpacingX) - statSpacingX;
    const statsOffsetX = (width - actualStatsWidth) / 2;

    const x = statsOffsetX + col * (statItemWidth + statSpacingX);
    const y = statsStartY + row * (statItemHeight + statSpacingY);

    // Draw color block
    ctx.fillStyle = `rgb(${stat.color.rgb[0]}, ${stat.color.rgb[1]}, ${stat.color.rgb[2]})`;
    ctx.fillRect(x, y, cellSize, cellSize);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, cellSize, cellSize);

    // Draw color code inside block
    const lum = getLuminance(stat.color.rgb[0], stat.color.rgb[1], stat.color.rgb[2]);
    ctx.fillStyle = lum > 128 ? '#111827' : '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = `bold ${cellSize * 0.35}px sans-serif`;
    ctx.fillText(stat.color.code, x + cellSize / 2, y + cellSize / 2);

    // Draw count text
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'left';
    ctx.font = `${cellSize * 0.4}px sans-serif`;
    ctx.fillText(` * ${stat.count}`, x + cellSize + 8, y + cellSize / 2);
  }
}
