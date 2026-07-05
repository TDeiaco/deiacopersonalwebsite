import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';
import { LIFE_PATTERN_CATEGORIES, LifePattern, LifePatternCategory } from './game-of-life-patterns';

@Component({
  standalone: true,
  selector: 'app-game-of-life',
  templateUrl: './game-of-life.component.html',
  styleUrls: ['./game-of-life.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimize change detection,
  imports: [MatButtonModule, MatGridListModule, NgClass, NgFor, NgIf]
})
export class GameOfLifeComponent implements OnInit, OnDestroy {
  // --- Configuration ---
  rows = 60;
  cols = 100;
  intervalTime = 100; // ms

  readonly minRows = 10;
  readonly maxRows = 300;
  readonly minCols = 10;
  readonly maxCols = 300;

  // --- State ---
  // Use a Set to store coordinates of live cells ("row,col")
  activeCells = new Set<string>();
  isRunning = false;
  private intervalId: any = null;

  // drawing state for click-and-drag painting
  isDrawing = false;
  drawAlive = true; // when true we paint alive cells, when false we paint dead
  private hasDraggedSinceMouseDown = false;
  private pendingDrawCell: { row: number; col: number } | null = null;

  // --- Pattern stamping ---
  patternCategories: LifePatternCategory[] = LIFE_PATTERN_CATEGORIES;
  selectedCategoryName: string | null = null;
  selectedPatternName: string | null = null;

  // Inject ChangeDetectorRef for manual change detection triggering
  constructor(private cd: ChangeDetectorRef) { }

  ngOnInit(): void {
    // No initial grid needed, start empty or randomize
    // this.randomizeGrid(); // Optionally start with random cells
  }

  ngOnDestroy(): void {
    this.stopGame();
  }

  // Helper to generate the string key for a cell coordinate
  private getCoordKey(row: number, col: number): string {
    // Ensure coordinates wrap around correctly for key generation
    const wrappedRow = (row + this.rows) % this.rows;
    const wrappedCol = (col + this.cols) % this.cols;
    return `${wrappedRow},${wrappedCol}`;
  }

  /**
   * Clears the grid (removes all active cells).
   */
  initializeGrid(): void {
    this.activeCells.clear();
    this.cd.markForCheck(); // Trigger change detection
  }

  /**
   * Applies a new board size (clamped to sensible bounds) and clears the grid,
   * since existing cell coordinates don't necessarily map to a resized board.
   */
  applyBoardSize(rowsValue: string, colsValue: string): void {
    if (this.isRunning) return;

    this.rows = this.clamp(parseInt(rowsValue, 10), this.minRows, this.maxRows, this.rows);
    this.cols = this.clamp(parseInt(colsValue, 10), this.minCols, this.maxCols, this.cols);
    this.initializeGrid();
  }

  private clamp(value: number, min: number, max: number, fallback: number): number {
    if (Number.isNaN(value)) return fallback;
    return Math.min(max, Math.max(min, value));
  }

  /**
   * Randomizes the grid by adding cells to the active set.
   */
  randomizeGrid(): void {
    if (this.isRunning) return;
    this.activeCells.clear();
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++) {
        if (Math.random() > 0.7) { // ~30% chance
          this.activeCells.add(this.getCoordKey(i, j));
        }
      }
    }
    this.cd.markForCheck(); // Trigger change detection
  }

  startGame(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.nextGeneration();
    }, this.intervalTime);
    // No need for markForCheck here, nextGeneration handles it
  }

  stopGame(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.cd.markForCheck(); // Update button states etc.
  }

  resetGame(): void {
    this.stopGame();
    this.initializeGrid();
    // No need for markForCheck here, initializeGrid handles it
  }

  /**
   * Toggles a cell's state by adding/removing it from the active set.
   */
  toggleCell(row: number, col: number): void {
    if (!this.isRunning) {
      const key = this.getCoordKey(row, col);
      if (this.activeCells.has(key)) {
        this.activeCells.delete(key);
      } else {
        this.activeCells.add(key);
      }
      this.cd.markForCheck(); // Trigger change detection
    }
  }

  /**
   * Calculates the next generation based on active cells and their neighbors.
   */
  nextGeneration(): void {
    const neighborCounts = new Map<string, number>();
    const nextActiveCells = new Set<string>();

    // 1. Count neighbors for all active cells and their neighbors
    for (const key of this.activeCells) {
      const [row, col] = key.split(',').map(Number);

      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          // Skip the cell itself for neighbor counting, but consider it for survival check later
          // if (i === 0 && j === 0) continue; // We DO need to consider the cell itself later

          const checkRow = row + i;
          const checkCol = col + j;

          // Use wrapped coordinates for the key
          const neighborKey = this.getCoordKey(checkRow, checkCol);

          // Increment neighbor count for this key
          neighborCounts.set(neighborKey, (neighborCounts.get(neighborKey) || 0) + (i === 0 && j === 0 ? 0 : 1)); // Only count actual neighbors
        }
      }
    }


    // 2. Determine survivors and births
    for (const [key, count] of neighborCounts.entries()) {
      const isCurrentlyActive = this.activeCells.has(key);
      const actualNeighborCount = isCurrentlyActive ? count : count; // The map stores counts *around* a cell, including the cell itself if it was a neighbor of another active cell. Adjust if needed.

      // Recalculate precise neighbors for the candidate cell
      let preciseNeighborCount = 0;
      const [r, c] = key.split(',').map(Number);
       for (let ni = -1; ni <= 1; ni++) {
          for (let nj = -1; nj <= 1; nj++) {
             if (ni === 0 && nj === 0) continue; // Skip self
             const neighborKeyCheck = this.getCoordKey(r + ni, c + nj);
             if (this.activeCells.has(neighborKeyCheck)) {
                 preciseNeighborCount++;
             }
          }
       }


      // Apply Game of Life rules
      if (isCurrentlyActive && (preciseNeighborCount === 2 || preciseNeighborCount === 3)) {
        nextActiveCells.add(key); // Survives
      } else if (!isCurrentlyActive && preciseNeighborCount === 3) {
        nextActiveCells.add(key); // Birth
      }
    }

    // 3. Update the active cells
    this.activeCells = nextActiveCells;
    this.cd.markForCheck(); // Manually trigger change detection
  }

  /**
   * Helper function for the template to check if a cell is alive.
   */
  isCellAlive(row: number, col: number): boolean {
    return this.activeCells.has(this.getCoordKey(row, col));
  }

  // Helper function to create an iterable for *ngFor in the template
  // Since we don't have a grid array anymore.
  get rowsArray(): number[] {
    return Array.from({ length: this.rows }, (_, i) => i);
  }
  get colsArray(): number[] {
    return Array.from({ length: this.cols }, (_, i) => i);
  }

  get availablePatterns(): LifePattern[] {
    const category = this.patternCategories.find(c => c.name === this.selectedCategoryName);
    return category ? category.patterns : [];
  }

  get selectedPattern(): LifePattern | null {
    if (!this.selectedPatternName) return null;
    return this.availablePatterns.find(p => p.name === this.selectedPatternName) || null;
  }

  onCategoryChange(categoryName: string): void {
    this.selectedCategoryName = categoryName || null;
    this.selectedPatternName = null;
    this.cd.markForCheck();
  }

  onPatternChange(patternName: string): void {
    this.selectedPatternName = patternName || null;
    this.cd.markForCheck();
  }

  /**
   * Stamps the currently selected pattern onto the board, centered on (row, col).
   */
  private stampPattern(row: number, col: number): void {
    const pattern = this.selectedPattern;
    if (!pattern) return;

    const maxRow = Math.max(...pattern.cells.map(([r]) => r));
    const maxCol = Math.max(...pattern.cells.map(([, c]) => c));
    const rowOffset = Math.floor(maxRow / 2);
    const colOffset = Math.floor(maxCol / 2);

    for (const [r, c] of pattern.cells) {
      this.activeCells.add(this.getCoordKey(row + r - rowOffset, col + c - colOffset));
    }
    this.cd.markForCheck();
  }

  // Called on mouse down over a cell. left-button = paint alive, right-button = paint dead
  onCellMouseDown(i: number, j: number, event: MouseEvent) {
    event.preventDefault();

    if (this.selectedPattern && !this.isRunning) {
      this.stampPattern(i, j);
      return;
    }

    this.isDrawing = true;
    this.drawAlive = event.button === 0; // 0 = left, 2 = right
    this.hasDraggedSinceMouseDown = false;

    if (this.drawAlive) {
      this.pendingDrawCell = { row: i, col: j };
    } else {
      this.pendingDrawCell = null;
      this.applyDraw(i, j);
    }
  }

  // Called when entering a cell while mouse is held down
  onCellMouseEnter(i: number, j: number, event: MouseEvent) {
    if (!this.isDrawing) return;

    if (!this.hasDraggedSinceMouseDown && this.pendingDrawCell) {
      this.applyDraw(this.pendingDrawCell.row, this.pendingDrawCell.col);
      this.pendingDrawCell = null;
    }

    this.hasDraggedSinceMouseDown = true;
    this.applyDraw(i, j);
  }

  onCellClick(i: number, j: number): void {
    if (this.isRunning || this.hasDraggedSinceMouseDown || this.selectedPattern) {
      return;
    }

    this.pendingDrawCell = null;
    this.toggleCell(i, j);
  }

  // Apply the current draw mode to the given cell (uses existing helpers)
  private applyDraw(i: number, j: number) {
    const alive = this.drawAlive;
    const currentlyAlive = this.isCellAlive(i, j);
    if (alive && !currentlyAlive) {
      this.toggleCell(i, j); // flip to alive
    } else if (!alive && currentlyAlive) {
      this.toggleCell(i, j); // flip to dead
    }
  }

  // Stop drawing when mouse is released anywhere
  @HostListener('window:mouseup')
  onWindowMouseUp() {
    this.isDrawing = false;
    this.hasDraggedSinceMouseDown = false;
    this.pendingDrawCell = null;
  }
}
