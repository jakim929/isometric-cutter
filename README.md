# Isometric Tile Cutter

A TypeScript utility for cutting isometric SVG tiles into equal parts and outputting them as a single image.

## Features

- Cuts isometric SVG tiles (2:1 aspect ratio) into a customizable grid
- Outputs as PNG, JPG, or WebP
- Customizable grid size (default 3x3)
- Transparent background support

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/isometric-cutter.git
cd isometric-cutter

# Install dependencies
npm install
```

## Usage

### Basic Usage

```typescript
import { processIsometricTile } from './src/isometricCutter';

// Basic usage with default 3x3 grid
await processIsometricTile('path/to/your.svg', 'output.png');
```

### Advanced Usage

```typescript
import { processIsometricTile } from './src/isometricCutter';

// Custom configuration
await processIsometricTile(
  'path/to/your.svg',
  'output.png',
  {
    // Custom grid size
    columns: 3,
    rows: 3,
    // Output format options
    outputFormat: 'png', // 'png', 'jpg', or 'webp'
    quality: 90, // for jpg/webp
    background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent background
  }
);
```

## Running the Example

An example SVG file is included in the repository:

```bash
# Run the example
npm start
```

This will generate two output files:
- `output-3x3.png` - Default 3x3 grid
- `output-custom.png` - Custom configuration example

## Requirements

- Node.js v14+
- TypeScript
- Sharp image processing library

## License

MIT 