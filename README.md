# The Game of Life

<h3> This repository implements the Game of Life:</h3>

- The game consists of an infinite 2D grid of cells. Each cell can be in one of two possible states:
  Alive
  Dead
- The game begins with an initial configuration of cells being "dead"
- The game progresses in steps, called generations. In each generation, the following transitions occur:
  - Any live cell with fewer than two live neighbors dies, as if by underpopulation.
  - Any live cell with two or three live neighbors lives on to the next generation.
  - Any live cell with more than three live neighbors dies, as if by overpopulation.
  - Any dead cell with exactly three live neighbors becomes a live cell, as if by reproduction.
- As cells stay alive across multiple generations, their color will gradually lighten or darken, representing their age
- Some additional features like speed of the simulation are also implemented 