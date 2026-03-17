const Prescription = require('../models/Prescription');
const User = require('../models/User');
const Consultation = require('../models/Consultation');

const includeConfig = [
  { model: User, as: 'patient', attributes: ['id', 'username', 'email'] },
  { model: User, as: 'doctor', attributes: ['id', 'username', 'email'] },
  { model: Consultation, as: 'consultation', attributes: ['id', 'date', 'time'] },
];

const fetchPrescriptionWithRelations = async (id) =>
  Prescription.findByPk(id, {
    include: includeConfig,
  });

exports.getPrescriptions = async (req, res) => {
  try {
    const { patient_id } = req.query;
    let where = {};
    if (req.user.role === 'medecin') {
      where.doctor_id = req.user.id;
      if (patient_id) where.patient_id = patient_id;
    } else if (req.user.role === 'patient') {
      where.patient_id = req.user.id;
    } else if (req.user.role === 'admin' || req.user.role === 'staff') {
      if (patient_id) where.patient_id = patient_id;
    }
    const prescriptions = await Prescription.findAll({
      where,
      include: includeConfig,
      order: [
        ['date', 'DESC'],
        ['createdAt', 'DESC'],
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
    const consultation = consultation_id ? await Consultation.findByPk(consultation_id) : null;
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }
    if (consultation_id && (!consultation || consultation.doctor_id !== req.user.id)) {
      return res.status(404).json({ error: 'Consultation non trouvée ou non autorisée' });
    }
    const prescription = await Prescription.create({
      id: `presc_${Date.now()}`,
      consultation_id: consultation_id || null,
      patient_id,
      doctor_id: req.user.id,
      date: date || new Date().toISOString().split('T')[0],
      medications: Array.isArray(medications) ? medications : [],
      instructions: instructions || '',
    });
    const hydrated = await fetchPrescriptionWithRelations(prescription.id);
    console.log(`✅ Prescription created: ID=${prescription.id}, patient_id=${patient_id}, date=${prescription.date}`);
    res.status(201).json(hydrated || prescription);
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

    const nextPatientId = patient_id || prescription.patient_id;
    const patient = await User.findByPk(nextPatientId);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    let nextConsultationId = prescription.consultation_id;
    if (typeof consultation_id !== 'undefined') {
      if (consultation_id) {
        const consultation = await Consultation.findByPk(consultation_id);
        if (!consultation || consultation.doctor_id !== req.user.id) {
          return res.status(404).json({ error: 'Consultation non trouvée ou non autorisée' });
        }
        nextConsultationId = consultation_id;
      } else {
        nextConsultationId = null;
      }
    }

    await prescription.update({
      consultation_id: nextConsultationId,
      patient_id: nextPatientId,
      date: date || prescription.date,
      medications: typeof medications !== 'undefined' ? (Array.isArray(medications) ? medications : []) : prescription.medications,
      instructions: typeof instructions !== 'undefined' ? (instructions || '') : prescription.instructions,
    });
    const hydrated = await fetchPrescriptionWithRelations(prescription.id);
    res.json(hydrated || prescription);
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
