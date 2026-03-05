const Prescription = require('../models/Prescription');
const User = require('../models/User');
const Consultation = require('../models/Consultation');

exports.getPrescriptions = async (req, res) => {
  try {
    const { patient_id } = req.query;
    const where = { doctor_id: req.user.id };
    if (patient_id) where.patient_id = patient_id;
    const prescriptions = await Prescription.findAll({
      where,
      include: [
        { model: User, as: 'patient', attributes: ['id', 'username', 'email'] },
        { model: Consultation, as: 'consultation', attributes: ['id', 'date', 'time'] },
      ],
    });
    res.json(prescriptions);
  } catch (err) {
    console.error('❌ Error fetching prescriptions:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des prescriptions' });
  }
};

exports.createPrescription = async (req, res) => {
  try {
    const { consultation_id, patient_id, date, medications, instructions } = req.body;
    const patient = await User.findByPk(patient_id);
    const consultation = await Consultation.findByPk(consultation_id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }
    if (!consultation || consultation.doctor_id !== req.user.id) {
      return res.status(404).json({ error: 'Consultation non trouvée ou non autorisée' });
    }
    const prescription = await Prescription.create({
      id: `presc_${Date.now()}`,
      consultation_id,
      patient_id,
      doctor_id: req.user.id,
      date,
      medications,
      instructions,
    });
    console.log(`✅ Prescription created: ID=${prescription.id}, patient_id=${patient_id}, date=${date}`);
    res.status(201).json(prescription);
  } catch (err) {
    console.error('❌ Error creating prescription:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création de la prescription' });
  }
};

exports.updatePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const { consultation_id, patient_id, date, medications, instructions } = req.body;
    const prescription = await Prescription.findByPk(id);
    if (!prescription || prescription.doctor_id !== req.user.id) {
      return res.status(404).json({ error: 'Prescription non trouvée ou non autorisée' });
    }
    const patient = await User.findByPk(patient_id);
    const consultation = await Consultation.findByPk(consultation_id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }
    if (!consultation || consultation.doctor_id !== req.user.id) {
      return res.status(404).json({ error: 'Consultation non trouvée ou non autorisée' });
    }
    await prescription.update({
      consultation_id,
      patient_id,
      date,
      medications,
      instructions,
    });
    res.json(prescription);
  } catch (err) {
    console.error('❌ Error updating prescription:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour de la prescription' });
  }
};

exports.deletePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    const prescription = await Prescription.findByPk(id);
    if (!prescription || prescription.doctor_id !== req.user.id) {
      return res.status(404).json({ error: 'Prescription non trouvée ou non autorisée' });
    }
    await prescription.destroy();
    res.json({ message: 'Prescription supprimée avec succès' });
  } catch (err) {
    console.error('❌ Error deleting prescription:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression de la prescription' });
  }
};