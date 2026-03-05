// Consultation.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Consultation = sequelize.define('Consultation', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
  },
  patient_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  doctor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  symptoms: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  examination: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  treatment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  recommendations: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  follow_up: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  medications: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'consultations',
});

Consultation.belongsTo(User, { as: 'patient', foreignKey: 'patient_id' });
Consultation.belongsTo(User, { as: 'doctor', foreignKey: 'doctor_id' });

module.exports = Consultation;