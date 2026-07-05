// Row/column offsets are relative to the pattern's own top-left corner (0,0).
export interface LifePattern {
  name: string;
  description: string;
  cells: [number, number][];
}

export interface LifePatternCategory {
  name: string;
  description: string;
  patterns: LifePattern[];
}

export const LIFE_PATTERN_CATEGORIES: LifePatternCategory[] = [
  {
    name: 'Still lifes',
    description: 'Shapes that never change from one generation to the next.',
    patterns: [
      { name: 'Block', description: 'The simplest still life: a 2x2 square that never changes.', cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
      { name: 'Beehive', description: 'A six-cell still life shaped like a hexagon.', cells: [[0, 1], [0, 2], [1, 0], [1, 3], [2, 1], [2, 2]] },
      { name: 'Loaf', description: 'A seven-cell still life, like a beehive with one corner squared off.', cells: [[0, 1], [0, 2], [1, 0], [1, 3], [2, 1], [2, 3], [3, 2]] },
      { name: 'Boat', description: 'A five-cell still life shaped like a small boat.', cells: [[0, 0], [0, 1], [1, 0], [1, 2], [2, 1]] },
      { name: 'Tub', description: 'A four-cell still life, symmetric in every direction.', cells: [[0, 1], [1, 0], [1, 2], [2, 1]] }
    ]
  },
  {
    name: 'Oscillators',
    description: 'Shapes that cycle through a repeating sequence of states.',
    patterns: [
      { name: 'Blinker', description: 'The smallest oscillator: three cells that flip between a row and a column every generation.', cells: [[0, 0], [0, 1], [0, 2]] },
      { name: 'Toad', description: 'A six-cell oscillator that alternates between two phases every 2 generations.', cells: [[0, 1], [0, 2], [0, 3], [1, 0], [1, 1], [1, 2]] },
      { name: 'Beacon', description: 'Two blocks whose corners flicker on and off every 2 generations.', cells: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 2], [2, 3], [3, 2], [3, 3]] },
      {
        name: 'Pulsar',
        description: 'A large period-3 oscillator, the most common oscillator with a period greater than 2.',
        cells: [
          [0, 2], [0, 3], [0, 4], [0, 8], [0, 9], [0, 10],
          [2, 0], [2, 5], [2, 7], [2, 12],
          [3, 0], [3, 5], [3, 7], [3, 12],
          [4, 0], [4, 5], [4, 7], [4, 12],
          [5, 2], [5, 3], [5, 4], [5, 8], [5, 9], [5, 10],
          [7, 2], [7, 3], [7, 4], [7, 8], [7, 9], [7, 10],
          [8, 0], [8, 5], [8, 7], [8, 12],
          [9, 0], [9, 5], [9, 7], [9, 12],
          [10, 0], [10, 5], [10, 7], [10, 12],
          [12, 2], [12, 3], [12, 4], [12, 8], [12, 9], [12, 10]
        ]
      },
      {
        name: 'Pentadecathlon',
        description: 'A period-15 oscillator, one of the most common long-period oscillators.',
        cells: [
          [0, 2], [0, 7],
          [1, 0], [1, 1], [1, 3], [1, 4], [1, 5], [1, 6], [1, 8], [1, 9],
          [2, 2], [2, 7]
        ]
      }
    ]
  },
  {
    name: 'Spaceships',
    description: 'Shapes that translate across the grid as they oscillate.',
    patterns: [
      { name: 'Glider', description: 'The smallest, most common spaceship; it glides diagonally every 4 generations.', cells: [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]] },
      {
        name: 'Lightweight spaceship',
        description: 'A period-4 spaceship that travels orthogonally, faster than the glider.',
        cells: [[0, 0], [0, 3], [1, 4], [2, 0], [2, 4], [3, 1], [3, 2], [3, 3], [3, 4]]
      },
      {
        name: 'Middleweight spaceship',
        description: 'A period-4 orthogonal spaceship, one row taller than the lightweight version.',
        cells: [[0, 3], [1, 1], [1, 5], [2, 0], [3, 0], [3, 5], [4, 0], [4, 1], [4, 2], [4, 3], [4, 4]]
      }
    ]
  },
  {
    name: 'Methuselahs & guns',
    description: 'Small shapes that evolve chaotically for a long time, or that emit gliders forever.',
    patterns: [
      { name: 'R-pentomino', description: 'A tiny five-cell methuselah that evolves chaotically for 1103 generations before stabilizing.', cells: [[0, 1], [0, 2], [1, 0], [1, 1], [2, 1]] },
      { name: 'Diehard', description: 'A seven-cell pattern that vanishes completely after exactly 130 generations.', cells: [[0, 6], [1, 0], [1, 1], [2, 1], [2, 5], [2, 6], [2, 7]] },
      { name: 'Acorn', description: 'A seven-cell methuselah that takes 5206 generations to stabilize.', cells: [[0, 1], [1, 3], [2, 0], [2, 1], [2, 4], [2, 5], [2, 6]] },
      {
        name: 'Gosper glider gun',
        description: 'The first known gun: it periodically emits a stream of gliders forever.',
        cells: [
          [0, 24],
          [1, 22], [1, 24],
          [2, 12], [2, 13], [2, 20], [2, 21], [2, 34], [2, 35],
          [3, 11], [3, 15], [3, 20], [3, 21], [3, 34], [3, 35],
          [4, 0], [4, 1], [4, 10], [4, 16], [4, 20], [4, 21],
          [5, 0], [5, 1], [5, 10], [5, 14], [5, 16], [5, 17], [5, 22], [5, 24],
          [6, 10], [6, 16], [6, 24],
          [7, 11], [7, 15],
          [8, 12], [8, 13]
        ]
      }
    ]
  }
];
