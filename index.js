const express = require('express');
const app = express();
require('dotenv').config();
const db = require('./db.js');


const bodyParser = require('body-parser');
const path = require('path');
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
const port = process.env.PORT || 3000;

const userRoutes = require('./routes/userRoutes.js');
app.use('/user', userRoutes);

const candidateRoutes = require('./routes/candidateRoutes.js');
app.use('/candidate', candidateRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});