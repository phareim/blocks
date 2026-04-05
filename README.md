# Block Blast

An 8x8 puzzle game where you drag and drop blocks onto the board to complete rows and columns. Built with vanilla HTML, CSS, and JavaScript.

## How to play

- Drag blocks from the tray onto the board
- Complete full rows or columns to clear them and score points
- Chain multiple clears for combo bonuses
- Game ends when no remaining pieces can be placed

## Getting started

```
npm install
npm start
```

Open http://localhost:3000 in your browser. Set a custom port with `PORT=8080 npm start`.

## Project structure

```
public/
  index.html    Game markup
  game.js       Game logic (grid, shapes, scoring, drag & drop)
  style.css     Styling and animations
server.js       Express static file server
```
