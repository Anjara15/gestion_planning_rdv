const { Op } = require('sequelize');
const History = require('../models/History');
const User = require('../models/User');

// GET /api/history
exports.getUserHistory = async (req, res) => {
  try {
    const { userId, action, dateRange, limit = 50, offset = 0 } = req.query;

    const whereClause = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (action) {
      whereClause.action = action;
    }

    if (dateRange) {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter': {
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          break;
        }
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        whereClause.createdAt = {
          [Op.gte]: startDate,
        };
      }
    }

    const history = await History.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'email', 'role'],
        },
      ],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', 'DESC']],
    });

    res.json({
      history: history.rows,
      total: history.count,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (error) {
    console.error('Error fetching user history:', error);
    res.status(500).json({ error: "Erreur serveur lors de la recuperation de l'historique" });
  }
};

// POST /api/history
exports.createHistoryEntry = async (req, res) => {
  try {
    const { userId, action, description } = req.body;
    const targetUserId = userId || req.user.id;

    if (!action || !description) {
      return res.status(400).json({ error: 'action et description sont requis' });
    }

    if (!['admin', 'staff'].includes(req.user.role) && Number(targetUserId) !== Number(req.user.id)) {
      return res.status(403).json({ error: 'Non autorise a ecrire cet historique' });
    }

    const user = await User.findByPk(targetUserId);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouve' });
    }

    const entry = await History.create({
      userId: targetUserId,
      action,
      description,
      createdAt: new Date(),
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating history entry:', error);
    res.status(500).json({ error: "Erreur serveur lors de la creation de l'historique" });
  }
};

// PUT /api/history/:id
exports.updateHistoryEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, action, description } = req.body;

    const entry = await History.findByPk(id);
    if (!entry) {
      return res.status(404).json({ error: 'Entree historique non trouvee' });
    }

    if (userId !== undefined) {
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'Utilisateur non trouve' });
      }
      entry.userId = userId;
    }

    if (action !== undefined) entry.action = action;
    if (description !== undefined) entry.description = description;

    await entry.save();
    res.json(entry);
  } catch (error) {
    console.error('Error updating history entry:', error);
    res.status(500).json({ error: "Erreur serveur lors de la mise a jour de l'historique" });
  }
};

// DELETE /api/history/:id
exports.deleteHistoryEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const entry = await History.findByPk(id);
    if (!entry) {
      return res.status(404).json({ error: 'Entree historique non trouvee' });
    }

    await entry.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting history entry:', error);
    res.status(500).json({ error: "Erreur serveur lors de la suppression de l'historique" });
  }
};
