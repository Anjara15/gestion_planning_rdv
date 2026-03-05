const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Consultation = require('./Consultation');

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
  },
  consultation_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: 'consultations',
      key: 'id',
    },
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
  medications: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'prescriptions',
});

Prescription.belongsTo(User, { as: 'patient', foreignKey: 'patient_id' });
Prescription.belongsTo(User, { as: 'doctor', foreignKey: 'doctor_id' });
Prescription.belongsTo(Consultation, { as: 'consultation', foreignKey: 'consultation_id' });

module.exports = Prescription;