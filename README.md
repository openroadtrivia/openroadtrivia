# Open Road Trivia

**The Exploration Learning Game — Route 66 Edition**

A trivia road trip from Chicago to Santa Monica on historic Route 66. Answer questions to drive between cities, explore museums and landmarks, eat at famous diners, stay in legendary hotels, and collect postcards along the way.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Content

- **260** road questions across 13 regions
- **90** Explore stops (39 Discovery, 14 Attraction, 17 Hotel, 20 Restaurant)
- **14** Excursion stops (Grand Canyon, Hoover Dam, Meteor Crater, etc.)
- **7** Hazard encounters
- **20** cities from Chicago to Santa Monica
- **24** route segments with realistic drive times

## Features

- **Pick Your Lane** — choose your trivia category before each question
- **6 stop types** — Discovery, Attraction, Hotel, Restaurant, Excursion, Rest Stop
- **Trip time tracker** — realistic drive times based on road type (25-70 mph)
- **Fatigue system** — sunset warning at 8 hours, hotel stays reset fatigue
- **City mastery** — get every answer right for "City Mastered" status
- **Text-to-speech** — every question read aloud
- **Sound effects** — 7 Web Audio API sounds
- **Auto-save** — progress persists in localStorage
- **PWA ready** — installable to phone homescreen

## Adding Graphics

Drop `.png` files into `public/images/`:

```
public/images/cities/chicago.png
public/images/regions/chicagoland.png
public/images/stops/art-institute-of-chicago.png
```

Naming: lowercase, spaces to dashes, & to "and", drop apostrophes.

## Deploy

Push to GitHub, import at vercel.com, deploy.

## License

Copyright 2026 Open Road Trivia. All rights reserved.
