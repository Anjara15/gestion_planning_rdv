const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');

exports.getMedicalRecords = async (req, res) => {
  try {
    const { patient_id } = req.query;
    const where = { doctor_id: req.user.id };
    if (patient_id) where.patient_id = patient_id;
    const medicalRecords = await MedicalRecord.findAll({
      where,
      include: [{ model: User, as: 'patient', attributes: ['id', 'username', 'email'] }],
    });
    res.json(medicalRecords);
  } catch (err) {
    console.error('❌ Error fetching medical records:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des dossiers médicaux' });
  }
};

exports.createMedicalRecord = async (req, res) => {
  try {
    const { patient_id, date, type, title, description, symptoms, diagnosis, recommendations, medications } = req.body;
    const patient = await User.findByPk(patient_id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }
    const medicalRecord = await MedicalRecord.create({
      id: `med_${Date.now()}`,
      patient_id,
      doctor_id: req.user.id,
      date,
      type,
      title,
      description,
      symptoms,
      diagnosis,
      recommendations,
      medications,
    });
    console.log(`✅ Medical record created: ID=${medicalRecord.id}, patient_id=${patient_id}, date=${date}`);
    res.status(201).json(medicalRecord);
  } catch (err) {
    console.error('❌ Error creating medical record:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du dossier médical' });
  }
};

exports.updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id, date, type, title, description, symptoms, diagnosis, recommendations, medications } = req.body;
    const medicalRecord = await MedicalRecord.findByPk(id);
    if (!medicalRecord || medicalRecord.doctor_id !== req.user.id) {
      return res.status(404).json({ error: 'Dossier médical non trouvé ou non autorisé' });
    }
    const patient = await User.findByPk(patient_id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }
    await medicalRecord.update({
      patient_id,
      date,
      type,
      title,
      description,
      symptoms,
      diagnosis,
      recommendations,
      medications,
    });
    res.json(medicalRecord);
  } catch (err) {
    console.error('❌ Error updating medical record:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du dossier médical' });
  }
};

exports.deleteMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const medicalRecord = await MedicalRecord.findByPk(id);
    if (!medicalRecord || medicalRecord.doctor_id !== req.user.id) {
      return res.status(404).json({ error: 'Dossier médical non trouvé ou non autorisé' });
    }
    await medicalRecord.destroy();
    res.json({ message: 'Dossier médical supprimé avec succès' });
  } catch (err) {
    console.error('❌ Error deleting medical record:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du dossier médical' });
  }
};