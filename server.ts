import fs from 'fs';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleApiRequest } from './src/server/apiHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// API routes
app.all('/api/v1/*', async (req, res) => {
  try {
    const apiRes = await handleApiRequest(req.originalUrl || req.url, { rootDir: __dirname });
    if (apiRes) {
      res.status(apiRes.statusCode);
      for (const [key, val] of Object.entries(apiRes.headers)) {
        res.setHeader(key, val);
      }
      return res.send(apiRes.body);
    }
    return res.status(404).json({ error: 'not_found' });
  } catch (err: any) {
    return res.status(500).json({ error: 'internal_server_error', message: err.message });
  }
});

// Static assets
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send(
      '<!DOCTYPE html><html><head><title>Solar Earth</title></head><body><h1>SolarEarth — Compilation de production requise</h1><p>Veuillez exécuter <code>npm run build</code> pour générer les fichiers de production de l\'application PWA.</p></body></html>'
    );
  }
});

if (process.env.NODE_ENV !== 'test' && !process.env.VITEST) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SolarEarth full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
