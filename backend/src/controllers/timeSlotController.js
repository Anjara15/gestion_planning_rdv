const TimeSlot = require('../models/TimeSlot');
const User = require('../models/User');

// List shared time slots (supports date range + pagination)
exports.getTimeSlots = async (req, res) => {
  try {
    const where = {};
    const { date, date_from, date_to } = req.query;
    if (req.user?.role === 'medecin') {
      where.medecin_id = req.user.id;
    } else if (req.query.medecin_id) {
      where.medecin_id = req.query.medecin_id;
    }
    if (date) where.date = date;
    if (date_from || date_to) {
      where.date = {};
      if (date_from) where.date.$gte = date_from; // Sequelize v6 syntax via Op will be handled below
      if (date_to) where.date.$lte = date_to;
    }

    const { Op } = require('sequelize');
    if (where.date && (where.date.$gte || where.date.$lte)) {
      const range = {};
      if (where.date.$gte) range[Op.gte] = where.date.$gte;
      if (where.date.$lte) range[Op.lte] = where.date.$lte;
      where.date = range;
    }

    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    const { rows, count } = await TimeSlot.findAndCountAll({ where, limit, offset, order: [['date', 'ASC'], ['heure_debut', 'ASC']] });
    // If client requests raw array (backwards-compatible option), return rows directly
    if (req.query && req.query.raw === 'true') {
      return res.json(rows);
    }
    res.json({ items: rows, total: count, limit, offset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des créneaux' });
  }
};

// Create a slot (accepts camelCase or snake_case from frontend)
exports.createTimeSlot = async (req, res) => {
  try {
    const date = req.body.date;
    const heure_debut = req.body.heure_debut ?? req.body.heureDebut;
    const heure_fin = req.body.heure_fin ?? req.body.heureFin;
    const duree_consultation = req.body.duree_consultation ?? req.body.dureeConsultation;
    const type_consultation = req.body.type_consultation ?? req.body.typeConsultation;
    const salle_consultation = req.body.salle_consultation ?? req.body.salleConsultation;
    const max_patients = req.body.max_patients ?? req.body.maxPatients;

    // allow admin to create a slot for a specific doctor (medecin_id)
    const medecin_id = req.body.medecin_id ? req.body.medecin_id : (req.user.role === 'medecin' ? req.user.id : null);

    const timeSlot = await TimeSlot.create({
      id: `slot_${Date.now()}`,
      date,
      heure_debut,
      heure_fin,
      duree_consultation,
      type_consultation,
      salle_consultation,
      max_patients,
      medecin_id,
      created_by: req.user.id,
      status: 'pending',
    });
    res.status(201).json(timeSlot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du créneau' });
  }
};

// Update a slot (accepts camelCase or snake_case)
exports.updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const date = req.body.date;
    const heure_debut = req.body.heure_debut ?? req.body.heureDebut;
    const heure_fin = req.body.heure_fin ?? req.body.heureFin;
    const duree_consultation = req.body.duree_consultation ?? req.body.dureeConsultation;
    const type_consultation = req.body.type_consultation ?? req.body.typeConsultation;
    const salle_consultation = req.body.salle_consultation ?? req.body.salleConsultation;
    const max_patients = req.body.max_patients ?? req.body.maxPatients;

    const timeSlot = await TimeSlot.findByPk(id);
    if (!timeSlot) {
      return res.status(404).json({ error: 'Créneau non trouvé' });
    }
    // allow admin to update any slot; creators or assigned medecin can also update
    if (req.user.role !== 'admin' && timeSlot.created_by !== req.user.id && timeSlot.medecin_id !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé à modifier ce créneau' });
    }
    await timeSlot.update({
      date,
      heure_debut,
      heure_fin,
      duree_consultation,
      type_consultation,
      salle_consultation,
      max_patients,
    });
    res.json(timeSlot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du créneau' });
  }
};

// Delete a slot
exports.deleteTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const timeSlot = await TimeSlot.findByPk(id);
    if (!timeSlot) {
      return res.status(404).json({ error: 'Créneau non trouvé' });
    }
    // allow admin to delete any slot; creators can also delete
    if (req.user.role !== 'admin' && timeSlot.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Non autorisé à supprimer ce créneau' });
    }
    await timeSlot.destroy();
    res.json({ message: 'Créneau supprimé avec succès' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du créneau' });
  }
};

// Admin: list all time slots with extended filters
exports.adminListTimeSlots = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const where = {};
    const { date, date_from, date_to, type, salle, created_by, status } = req.query;
    if (date) where.date = date;
    if (date_from || date_to) {
      where.date = where.date || {};
      if (date_from) where.date[Op.gte] = date_from;
      if (date_to) where.date[Op.lte] = date_to;
    }
    if (type) where.type_consultation = type;
    if (salle) where.salle_consultation = salle;
    if (created_by) where.created_by = created_by;
    if (status) where.status = status;

    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = Math.max(parseInt(req.query.offset || '0', 10), 0);

    const { rows, count } = await TimeSlot.findAndCountAll({
      where,
      limit,
      offset,
      order: [['date', 'ASC'], ['heure_debut', 'ASC']],
    });
    // Support returning raw rows directly when requested by client
    if (req.query && req.query.raw === 'true') {
      return res.json(rows);
    }
    res.json({ items: rows, total: count, limit, offset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des créneaux (admin)' });
  }
};

// Admin: approve a time slot
exports.approveTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const ts = await TimeSlot.findByPk(id);
    if (!ts) return res.status(404).json({ error: 'Créneau non trouvé' });
    await ts.update({ status: 'approved' });
    res.json({ success: true, timeSlot: ts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors de l'approbation du créneau" });
  }
};

// Admin: reject a time slot
exports.rejectTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const ts = await TimeSlot.findByPk(id);
    if (!ts) return res.status(404).json({ error: 'Créneau non trouvé' });
    await ts.update({ status: 'rejected' });
    res.json({ success: true, timeSlot: ts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur lors du rejet du créneau" });
  }
};
