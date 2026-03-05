// MedicalRecord.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const MedicalRecord = sequelize.define('MedicalRecord', {
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
  type: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  symptoms: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  recommendations: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  medications: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'medical_records',
});

MedicalRecord.belongsTo(User, { as: 'patient', foreignKey: 'patient_id' });
MedicalRecord.belongsTo(User, { as: 'doctor', foreignKey: 'doctor_id' });

module.exports = MedicalRecord;