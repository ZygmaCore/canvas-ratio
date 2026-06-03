# Canvas Ratio Release Checklist

## Build
- [ ] npm run build
- [ ] npm run start
- [ ] docker build -t canvas-ratio .
- [ ] docker compose up --build -d

## Smoke Tests
- [ ] / returns 200
- [ ] /canvas returns 200
- [ ] /canvas-ratio.png returns 200
- [ ] no horizontal overflow
- [ ] no console errors during normal flow

## Core Flow
- [ ] add projects 50/30/20
- [ ] add sleep
- [ ] add random event
- [ ] paint cells
- [ ] quota blocks over-painting
- [ ] black blocks painting
- [ ] delete black restores covered colors
- [ ] Pomodoro shows current phase
- [ ] past read-only
- [ ] future unavailable
- [ ] refresh persistence

## Backup
- [ ] export current day
- [ ] export all days
- [ ] import day
- [ ] import all backup

## AI, if enabled
- [ ] Finish Coloring mock fallback
- [ ] Generate Pixel Story mock fallback
- [ ] real Gemini journal with env
- [ ] real Gemini image with env
- [ ] Story Mode works

## Docker
- [ ] container runs node server.js
- [ ] no bind mounts
- [ ] no dev server
