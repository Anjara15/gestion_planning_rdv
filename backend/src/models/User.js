const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('patient', 'medecin', 'admin', 'staff'),
    allowNull: false,
  },
  specialite: { type: DataTypes.STRING(255), allowNull: true },
  numero_ordre: { type: DataTypes.STRING(50), allowNull: true },
  telephone: { type: DataTypes.STRING(50), allowNull: true },
  adresse: { type: DataTypes.TEXT, allowNull: true },
  age: { type: DataTypes.INTEGER, allowNull: true },
}, {
  timestamps: true,
  tableName: 'users',
});

// Define associations
const History = require('./History');
User.hasMany(History, { foreignKey: 'userId', as: 'history' });
History.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// TimeSlot association will be defined in server.js after all models are loaded

module.exports = User;
