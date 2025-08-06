const { createLogger, transports, format } = require('winston');
const path = require('path');

const logger = createLogger({
  level: 'info', // info, warn, error => hepsini kapsar.
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    new transports.File({
      filename: path.join(__dirname, '../logs/error.log'), // Level error dediğimiz için sadece error kayıtlanır.
      level: 'error',
    }),
    new transports.File({
      filename: path.join(__dirname, '../logs/combined.log'), // default olarak leveli info.
    }),
  ],
});

module.exports = logger;