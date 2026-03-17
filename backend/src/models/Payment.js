const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  patient_id: {
    type: DataTypes.STRING,
    allowNull: false,
    set(value) {
      // Keep DB comparisons consistent: patient_id stored as string in DB
      this.setDataValue('patient_id', value === null || value === undefined ? value : String(value));
    },
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'en_attente',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'payments',
  timestamps: false,
});

module.exports = Payment;
