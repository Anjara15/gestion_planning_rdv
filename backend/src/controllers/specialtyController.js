const Specialty = require('../models/Specialty');

exports.getSpecialties = async (req, res) => {
  try {
    const specialties = await Specialty.findAll({
      attributes: ['id', 'name', 'icon', 'color'],
      order: [['name', 'ASC']],
    });

    const formattedSpecialties = specialties.map((specialty) => ({
      id: specialty.id,
      name: specialty.name,
      icon: specialty.icon || 'Heart',
      color: specialty.color || 'text-primary',
    }));

    res.json(formattedSpecialties);
  } catch (err) {
    console.error('Error fetching specialties:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.createSpecialty = async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Le champ name est requis' });
    }

    const specialty = await Specialty.create({
      name: String(name).trim(),
      icon: icon || null,
      color: color || null,
    });

    res.status(201).json(specialty);
  } catch (err) {
    console.error('Error creating specialty:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la creation de la specialite' });
  }
};

exports.updateSpecialty = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;

    const specialty = await Specialty.findByPk(id);
    if (!specialty) {
      return res.status(404).json({ error: 'Specialite non trouvee' });
    }

    if (name !== undefined) specialty.name = String(name).trim();
    if (icon !== undefined) specialty.icon = icon;
    if (color !== undefined) specialty.color = color;

    await specialty.save();
    res.json(specialty);
  } catch (err) {
    console.error('Error updating specialty:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise a jour de la specialite' });
  }
};

exports.deleteSpecialty = async (req, res) => {
  try {
    const { id } = req.params;
    const specialty = await Specialty.findByPk(id);
    if (!specialty) {
      return res.status(404).json({ error: 'Specialite non trouvee' });
    }

    await specialty.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting specialty:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de la specialite' });
  }
};
