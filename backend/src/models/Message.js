const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  fromId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fromName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fromRole: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  toRole: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'messages',
  timestamps: false,
});

module.exports = Message;