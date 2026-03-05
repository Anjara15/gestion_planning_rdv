const Consultation = require('../models/Consultation');
const User = require('../models/User');

exports.getConsultations = async (req, res) => {
  try {
    const { patient_id } = req.query;
    const where = { doctor_id: req.user.id };
    if (patient_id) where.patient_id = patient_id;
    const consultations = await Consultation.findAll({
      where,
      include: [{ model: User, as: 'patient', attributes: ['id', 'username', 'email'] }],
    });
    res.json(consultations);
  } catch (err) {
    console.error('❌ Error fetching consultations:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des consultations' });
  }
};

exports.createConsultation = async (req, res) => {
  try {
    const { patient_id, date, time, symptoms, examination, diagnosis, treatment, recommendations, follow_up, medications } = req.body;
    const patient = await User.findByPk(patient_id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }
    const consultation = await Consultation.create({
      id: `cons_${Date.now()}`,
      patient_id,
      doctor_id: req.user.id,
      date,
      time,
      symptoms,
      examination,
      diagnosis,
      treatment,
      recommendations,
      follow_up,
      medications,
    });
    console.log(`✅ Consultation created: ID=${consultation.id}, patient_id=${patient_id}, date=${date}`);
    res.status(201).json(consultation);
  } catch (err) {
    console.error('❌ Error creating consultation:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création de la consultation' });
  }
};

exports.updateConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, date, time, symptoms, examination, diagnosis, treatment, recommendations, follow_up, medications } = req.body;
    const consultation = await Consultation.findByPk(id);
    if (!consultation || consultation.doctor_id !== req.user.id) {
      return res.status(404).json({ error: 'Consultation non trouvée ou non autorisée' });
    }
    const patient = await User.findByPk(patient_id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }
    await consultation.update({
      patient_id,
      date,
      time,
      symptoms,
      examination,
      diagnosis,
      treatment,
      recommendations,
      follow_up,
      medications,
    });
    res.json(consultation);
  } catch (err) {
    console.error('❌ Error updating consultation:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de la consultation' });
  }
};

exports.deleteConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const consultation = await Consultation.findByPk(id);
    if (!consultation || consultation.doctor_id !== req.user.id) {
      return res.status(404).json({ error: 'Consultation non trouvée ou non autorisée' });
    }
    await consultation.destroy();
    res.json({ message: 'Consultation supprimée avec succès' });
  } catch (err) {
    console.error('❌ Error deleting consultation:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de la consultation' });
  }
};