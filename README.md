# Fabric.js Drawing Application

A modern drawing application built with Fabric.js, React, and TypeScript. This project provides an example implementation of undo/redo history management for Fabric.js canvas, demonstrating how to track and manage canvas state changes effectively.

## Tech Stack

- [React](https://react.dev/) - UI library (v18.3)
- [Vite](https://vitejs.dev/) - Build tool and development server
- [Fabric.js](http://fabricjs.com/) - Canvas manipulation library (v6.5)
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible UI components
- [Perfect Freehand](https://github.com/steveruizok/perfect-freehand) - Smooth drawing algorithm

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- pnpm (Package manager)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

Run the development server:
```bash
pnpm dev
```

### Build

Create a production build:
```bash
pnpm build
```

Preview the production build:
```bash
pnpm preview
```

## Features

- Canvas-based drawing interface
- Comprehensive undo/redo history management for canvas operations
- Brush with support of [Perfect Freehand](https://github.com/steveruizok/perfect-freehand)
- Responsive design
- Modern UI with Tailwind CSS
- Type-safe development with TypeScript

## Project Structure

- `/src` - Source code
  - `/components` - Reusable React components
  - `/features` - Feature-specific code
  - `/entities` - Entity definitions and types
  - `/lib` - Utility functions and helpers
  - `/shared` - Shared resources
