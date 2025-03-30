const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy WebSocket requests
  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'http://localhost:8080',
      ws: true,
      changeOrigin: true,
      logLevel: 'debug',
      onError: (err, req, res) => {
        console.error('WebSocket proxy error:', err);
      }
    })
  );
  
  // Proxy API requests
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      logLevel: 'debug'
    })
  );
};