import { NgClass, NgFor } from '@angular/common';
import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, HostListener } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  standalone: true,
  selector: 'app-game-of-life',
  templateUrl: './game-of-life.component.html',
  styleUrls: ['./game-of-life.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // Optimize change detection,
  imports: [MatButtonModule, MatGridListModule, NgClass, NgFor]
})
export class GameOfLifeComponent implements OnInit, OnDestroy {
  // --- Configuration ---
  rows = 60;
  cols = 100;
  intervalTime = 100; // ms

  // --- State ---
  // Use a Set to store coordinates of live cells ("row,col")
  activeCells = new Set<string>();
  isRunning = false;
  private intervalId: any = null;

  // drawing state for click-and-drag painting
  isDrawing = false;
  drawAlive = true; // when true we paint alive cells, when false we paint dead

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

  // Called on mouse down over a cell. left-button = paint alive, right-button = paint dead
  onCellMouseDown(i: number, j: number, event: MouseEvent) {
    event.preventDefault();
    this.isDrawing = true;
    this.drawAlive = event.button === 0; // 0 = left, 2 = right
    this.applyDraw(i, j);
  }

  // Called when entering a cell while mouse is held down
  onCellMouseEnter(i: number, j: number, event: MouseEvent) {
    if (!this.isDrawing) return;
    this.applyDraw(i, j);
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
  }
}
