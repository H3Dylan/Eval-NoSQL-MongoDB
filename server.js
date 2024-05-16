const express = require('express');
const mongoose = require('mongoose');
const router = require('./router');

const app = express();
app.use(express.json());

mongoose.connect('mongodb+srv://h3-b3dev:4NbzvZyqwvr6AGhq@cluster0.slsw98t.mongodb.net/Paris').then(() => {
    console.log('Connexion à MongoDB établie');
}).catch((err) => {
    console.error('Erreur de connexion à MongoDB :', err);
});

app.use('/', router);

const PORT = 1235;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));