import express from 'express';
import http from 'http';
import path from 'path'

const app = express();

app.use(express.static(path.join(".", 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(path.join(".", "dist", "index.html")));
});

const httpServer = http.createServer(app);

const PORT = process.env.PORT || 5173;

httpServer.listen(PORT, () => {
  console.log(`Servidor HTTPS ouvindo na porta ${PORT}`);
});