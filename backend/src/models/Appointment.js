const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Appointment = sequelize.define('Appointment', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  specialite: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  medecin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  demande: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  is_new: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  timestamps: true,
  tableName: 'appointments',
});

Appointment.belongsTo(User, { as: 'patient', foreignKey: 'patient_id' });
Appointment.belongsTo(User, { as: 'medecin', foreignKey: 'medecin_id' });

module.exports = Appointment;