# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Block Blast — an 8×8 puzzle game built with vanilla HTML/CSS/JavaScript. No frameworks, no build step.

## Development

- `npm start` or `npm run dev` — runs Express static server on port 3000 (override with `PORT` env var)
- All game code lives in `public/` (index.html, game.js, style.css)
- server.js is a minimal Express static file server — rarely needs changes

## Code Style

- Pure vanilla JS — no transpilation, no modules, no bundler
- Prettier is used for formatting (runs automatically via Claude Code hook on edits)
- CSS uses custom properties for theming and CSS Grid for layout

## Git

- Work on main branch, push to GitHub when done
- GitHub remote uses SSH (git@github.com:phareim/blocks.git)
