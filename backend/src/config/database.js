const { Sequelize } = require('sequelize');
require('dotenv').config();

// Ensure all connection parameters are strings
const dbName = String(process.env.DB_NAME || 'cabinet_medical');
const dbUser = String(process.env.DB_USER || 'postgres');
const dbPassword = String(process.env.DB_PASSWORD || 'root');
const dbHost = String(process.env.DB_HOST || 'localhost');
const dbPort = String(process.env.DB_PORT || '5432');
const dbDialect = String(process.env.DB_DIALECT || 'postgres').toLowerCase();

const isMySql = dbDialect === 'mysql' || dbDialect === 'mariadb';
const defineOptions = isMySql
  ? { charset: 'utf8', collate: 'utf8_general_ci' }
  : {};
const dialectOptions = isMySql
  ? { charset: 'utf8', collate: 'utf8_general_ci' }
  : { ssl: false };

const sequelize = new Sequelize(
  dbName,
  dbUser,
  dbPassword,
  {
    host: dbHost,
    port: dbPort,
    dialect: dbDialect,
    logging: false,
    dialectOptions,
    define: defineOptions,
  }
);

module.exports = sequelize;




