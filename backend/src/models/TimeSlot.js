const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const TimeSlot = sequelize.define('TimeSlot', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  heure_debut: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  heure_fin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  duree_consultation: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  type_consultation: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  salle_consultation: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  max_patients: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending', // pending | approved | rejected
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1, // Assuming user ID 1 exists (e.g., admin)
  },
  // Optionnel: si on souhaite des créneaux génériques non liés à un médecin
  medecin_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',  // Nom de la table User
      key: 'id',
    },
  },
}, {
  timestamps: true,
  tableName: 'time_slots',
});

// Association will be defined in server.js after all models are loaded

module.exports = TimeSlot;