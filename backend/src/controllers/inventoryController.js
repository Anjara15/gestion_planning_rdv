const InventoryItem = require('../models/InventoryItem');
const { Op } = require('sequelize');

exports.getInventoryItems = async (req, res) => {
  try {
    const { search, low } = req.query;
    const where = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    const items = await InventoryItem.findAll({
      where,
      order: [['name', 'ASC']],
    });
    const filtered = low === 'true'
      ? items.filter((item) => Number(item.quantity) <= Number(item.threshold || 0))
      : items;
    res.json(filtered);
  } catch (err) {
    console.error('❌ Error fetching inventory items:', err);
    res.status(500).json({ error: "Erreur serveur lors de la récupération de l'inventaire" });
  }
};

exports.createInventoryItem = async (req, res) => {
  try {
    const { name, category, quantity, threshold, unit, notes } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Le nom du produit est requis' });
    }
    const item = await InventoryItem.create({
      id: `inv_${Date.now()}`,
      name: String(name).trim(),
      category: category ? String(category).trim() : null,
      quantity: Number(quantity || 0),
      threshold: Number(threshold || 0),
      unit: unit ? String(unit).trim() : null,
      notes: notes ? String(notes).trim() : null,
    });
    res.status(201).json(item);
  } catch (err) {
    console.error('❌ Error creating inventory item:', err);
    res.status(500).json({ error: "Erreur serveur lors de la création de l'article" });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await InventoryItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: "Article d'inventaire non trouvé" });
    }
    const { name, category, quantity, threshold, unit, notes } = req.body;
    await item.update({
      name: typeof name !== 'undefined' ? String(name).trim() : item.name,
      category: typeof category !== 'undefined' ? String(category).trim() : item.category,
      quantity: typeof quantity !== 'undefined' ? Number(quantity || 0) : item.quantity,
      threshold: typeof threshold !== 'undefined' ? Number(threshold || 0) : item.threshold,
      unit: typeof unit !== 'undefined' ? String(unit).trim() : item.unit,
      notes: typeof notes !== 'undefined' ? String(notes).trim() : item.notes,
    });
    res.json(item);
  } catch (err) {
    console.error('❌ Error updating inventory item:', err);
    res.status(500).json({ error: "Erreur serveur lors de la mise à jour de l'article" });
  }
};

exports.deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await InventoryItem.findByPk(id);
    if (!item) {
      return res.status(404).json({ error: "Article d'inventaire non trouvé" });
    }
    await item.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('❌ Error deleting inventory item:', err);
    res.status(500).json({ error: "Erreur serveur lors de la suppression de l'article" });
  }
};
