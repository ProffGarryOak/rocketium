require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createCanvas, loadImage } = require('canvas');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
  res.send('Canvas Builder API is running');
});

// Helper function to draw elements on a canvas
async function drawElements(ctx, elements) {
  for (const el of elements) {
    if (el.type === 'rect') {
      ctx.fillStyle = el.color;
      ctx.fillRect(el.x, el.y, el.width, el.height);
    } else if (el.type === 'circle') {
      ctx.beginPath();
      ctx.arc(el.x, el.y, el.radius, 0, Math.PI * 2);
      ctx.fillStyle = el.color;
      ctx.fill();
    } else if (el.type === 'text') {
      ctx.font = `${el.fontSize}px sans-serif`;
      ctx.fillStyle = el.color;
      ctx.fillText(el.text, el.x, el.y);
    } else if (el.type === 'path') {
      if (!el.points || el.points.length < 2) continue;
      
      ctx.beginPath();
      ctx.lineWidth = el.strokeWidth || 2;
      ctx.strokeStyle = el.color; // Use strokeStyle for path
      ctx.lineCap = 'round';
      
      const [start, ...rest] = el.points;
      ctx.moveTo(start.x, start.y);
      for (const p of rest) {
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    } else if (el.type === 'image') {
      try {
        let imageSource = el.src;
        // Handle Base64 Data URIs by converting to Buffer
        if (typeof el.src === 'string' && el.src.startsWith('data:')) {
            const base64Data = el.src.split(',')[1]; // Split at first comma
            if (base64Data) {
                imageSource = Buffer.from(base64Data, 'base64');
            }
        }

        const img = await loadImage(imageSource);
        ctx.drawImage(img, el.x, el.y, el.width, el.height);
      } catch (err) {
        console.error('Failed to load image:', err.message);
      }
    }
  }
}

app.post('/export/pdf', async (req, res) => {
  const { width, height, elements } = req.body;

  if (!width || !height || !elements) {
    return res.status(400).json({ error: 'Missing required fields: width, height, elements' });
  }

  try {
    // 1. Create Canvas and Draw
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Canvas is transparent by default. PDF viewers will treat page as white.
    // Preserving transparency ensures PNG export doesn't flatten alpha against white prematurely.

    await drawElements(ctx, elements);

    // 2. Create PDF
    const doc = new PDFDocument({ autoFirstPage: false });
    
    // Stream to response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="canvas-export.pdf"');
    
    doc.pipe(res);

    // Add page with matching dimensions
    // Note: PDFKit uses points (1/72 inch). 1 px roughly matches 1 point for screen viewing, 
    // but we can adjust if needed. For simplicity, we map 1px = 1pt.
    doc.addPage({ size: [width, height] });

    // 3. Optimization: Export canvas to PNG buffer (Preserves transparency/quality)
    const buffer = canvas.toBuffer('image/png');

    // Embed image in PDF
    doc.image(buffer, 0, 0, { width, height });

    doc.end();

  } catch (error) {
    console.error('PDF Export Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
