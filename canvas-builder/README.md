# Canvas Builder with PDF Export

## Project Overview
A full-stack application to create canvas designs and export them as optimized PDFs. Built with Next.js (Frontend) and Express.js (Backend).

## Tech Stack
- **Frontend**: Next.js 15 (App Router), Tailwind CSS, React, HTML5 Canvas
- **Backend**: Node.js, Express, node-canvas, PDFKit

## Local Setup

### Prerequisites
- Node.js (v18+)
- npm

### Installation

1. **Clone the repository** (if applicable) or navigate to project root.

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   # Start Server (at http://localhost:5000)
   node server.js
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Start App (at http://localhost:3000)
   npm run dev
   ```

4. **Usage**
   - Open [http://localhost:3000](http://localhost:3000).
   - **Tools**:
     - **Select**: Move or inspect elements (future enhancement).
     - **Pencil**: Freehand drawing.
     - **Eraser**: Click any object/path to remove it.
     - **Shapes**: Rectangle, Circle.
     - **Text/Image**: Click canvas to add.
   - **Undo/Redo**: Use the buttons in the sidebar to control history.
   - **Theme**: Toggle Dark/Light mode in the header.
   - **Export**: Click "Export PDF" to download the composition.

## API Usage Example

**POST** `/export/pdf`

**Body:**
```json
{
  "width": 800,
  "height": 600,
  "elements": [
    { "type": "rect", "x": 10, "y": 10, "width": 100, "height": 100, "color": "red" },
    { "type": "text", "x": 50, "y": 50, "text": "Hello", "fontSize": 24, "color": "black" }
  ]
}
```

**Response**: Binary PDF file.

## Live Demo
[Link to Live Demo](http://localhost:3000)
