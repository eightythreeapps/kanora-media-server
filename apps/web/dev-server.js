// Simple Express server for SPA with React Router
const express = require('express');
const { createServer: createViteServer } = require('vite');
const path = require('path');
const fs = require('fs');

async function createServer() {
  const app = express();

  try {
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      root: __dirname,
      server: { middlewareMode: true },
      appType: 'spa',
      configFile: path.resolve(__dirname, 'vite.config.ts'),
    });

    // Use vite's connect instance as middleware
    app.use(vite.middlewares);

    // Handle all routes that should be managed by the SPA router
    app.use('*', (req, res, next) => {
      // Check if the request is for an API route, asset, or other non-SPA route
      const url = req.originalUrl;

      if (url.startsWith('/api') || url.includes('.') || url === '/') {
        return next();
      }

      // Otherwise, serve the index.html for SPA routing
      res.sendFile(path.resolve(__dirname, 'index.html'));
    });

    const PORT = process.env.PORT || 4200;
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (e) {
    console.error('Error starting server:', e);
  }
}

createServer();
