const { Op } = require('sequelize');
const Message = require('../models/Message');

// fetch conversation between two roles (medecin <-> patient)
exports.getMessages = async (req, res) => {
  try {
    const { fromRole, toRole } = req.query;
    if (!fromRole || !toRole) {
      return res.status(400).json({ error: 'Paramètres fromRole et toRole requis' });
    }

    const msgs = await Message.findAll({
      where: {
        [Op.or]: [
          { fromRole, toRole },
          { fromRole: toRole, toRole: fromRole },
        ],
      },
      order: [['createdAt', 'ASC']],
    });
    res.json(msgs);
  } catch (err) {
    console.error('❌ Error fetching messages:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des messages' });
  }
};

exports.createMessage = async (req, res) => {
  try {
    const { toRole, content } = req.body;
    if (!toRole || !String(content || '').trim()) {
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    }

    const msg = await Message.create({
      id: `msg_${Date.now()}`,
      fromId: String(req.user.id),
      fromName: req.user.username || req.user.role,
      fromRole: req.user.role,
      toRole,
      content: String(content).trim(),
      createdAt: new Date(),
    });

    res.status(201).json(msg);
  } catch (err) {
    console.error('❌ Error creating message:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du message' });
  }
};
