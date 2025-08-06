const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes')
const morgan = require('morgan');
const logger = require('./utils/logger');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes)
app.use("/api/account", accountRoutes)
app.use("/api/transaction", transactionRoutes)

// Morgan loglarını da Winston’a yönlendirdik.
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));

// Test route
app.get("/", (req, res) => {
  res.send("Banka API çalışıyor 🚀");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
});