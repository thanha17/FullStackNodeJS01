require('dotenv').config();
const express = require('express');
const cors = require('cors');

const configViewEngine = require('./config/viewEngine');
const connection = require('./config/database');
const initApiRoutes = require('./routes/api');

const app = express();
const port = process.env.PORT || 8080;

// CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View engine
configViewEngine(app);

// --- Mount API routes ---
app.use('/v1/api', initApiRoutes); // Mount router đúng cách

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Connect DB & listen
(async () => {
  try {
    console.log("Connecting to database...");
    await connection();
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error("DB connection error:", error);
  }
})();
