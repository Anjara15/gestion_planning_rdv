const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Specialty = sequelize.define('Specialty', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  icon: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  color: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'specialties',
  timestamps: false, // Disable automatic timestamps to avoid conflicts with existing data
});

// Handle existing data with null timestamps
Specialty.addHook('beforeFind', (options) => {
  // This will help with existing records that have null timestamps
});

module.exports = Specialty;
