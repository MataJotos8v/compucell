const express = require('express');
const fs = require('fs');
const app = express();
const cors = require('cors');

app.use(cors());
app.use(express.json());

// Ruta para obtener productos
app.get('/api/productos', (req, res) => {
  const productos = JSON.parse(fs.readFileSync('productos.json', 'utf8'));
  res.json(productos);
});

// Ruta para guardar productos (opcional, para admin)
app.post('/api/productos', (req, res) => {
  fs.writeFileSync('productos.json', JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));