const MedicalRecord = require('../models/MedicalRecord');
const User = require('../models/User');

const isAdminOrStaff = (role) => role === 'admin' || role === 'staff';

exports.getMedicalRecords = async (req, res) => {
  try {
    const { patient_id } = req.query;
    let where = {};
    if (req.user.role === 'medecin') {
      where.doctor_id = req.user.id;
      if (patient_id) where.patient_id = patient_id;
    } else if (req.user.role === 'patient') {
      where.patient_id = req.user.id;
    } else if (isAdminOrStaff(req.user.role)) {
      if (patient_id) where.patient_id = patient_id;
    }
    const medicalRecords = await MedicalRecord.findAll({
      where,
      include: [
        { model: User, as: 'patient', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'doctor', attributes: ['id', 'username', 'email'] },
      ],
      order: [['date', 'DESC']],
    });
    res.json(medicalRecords);
  } catch (err) {
    console.error('❌ Error fetching medical records:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des dossiers médicaux' });
  }
};

exports.createMedicalRecord = async (req, res) => {
  try {
    const { patient_id, doctor_id, date, type, title, description, symptoms, diagnosis, recommendations, medications } = req.body;
    let targetPatient = patient_id;
    let targetDoctor = doctor_id;

    if (req.user.role === 'patient') {
      targetPatient = req.user.id;
      targetDoctor = null;
    }
    if (req.user.role === 'medecin') {
      targetDoctor = req.user.id;
    }

    const patient = await User.findByPk(targetPatient);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }

    if (targetDoctor) {
      const doctor = await User.findByPk(targetDoctor);
      if (!doctor || doctor.role !== 'medecin') {
        return res.status(404).json({ error: 'Médecin non trouvé' });
      }
    }

    const medicalRecord = await MedicalRecord.create({
      id: `med_${Date.now()}`,
      patient_id: targetPatient,
      doctor_id: targetDoctor || null,
      date,
      type,
      title,
      description,
      symptoms,
      diagnosis,
      recommendations,
      medications,
    });
    console.log(`✅ Medical record created: ID=${medicalRecord.id}, patient_id=${targetPatient}, date=${date}`);
    res.status(201).json(medicalRecord);
  } catch (err) {
    console.error('❌ Error creating medical record:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du dossier médical' });
  }
};

exports.updateMedicalRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      patient_id,
      doctor_id,
      date,
      type,
      title,
      description,
      symptoms,
      diagnosis,
      recommendations,
      medications,
    } = req.body;
    const medicalRecord = await MedicalRecord.findByPk(id);
    if (!medicalRecord) {
      return res.status(404).json({ error: 'Dossier médical non trouvé' });
    }

    if (req.user.role === 'medecin' && medicalRecord.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Dossier médical non autorisé' });
    }
    if (req.user.role === 'patient' && medicalRecord.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'Dossier médical non autorisé' });
    }

    const nextPatientId = patient_id || medicalRecord.patient_id;
    const nextDoctorId = typeof doctor_id !== 'undefined' ? doctor_id : medicalRecord.doctor_id;

    if (req.user.role === 'patient') {
      // patients cannot reassign patient_id or doctor_id
      if (nextPatientId !== medicalRecord.patient_id || nextDoctorId !== medicalRecord.doctor_id) {
        return res.status(403).json({ error: 'Modification non autorisée' });
      }
    }

    if (nextPatientId) {
      const patient = await User.findByPk(nextPatientId);
      if (!patient || patient.role !== 'patient') {
        return res.status(404).json({ error: 'Patient non trouvé' });
      }
    }
    if (nextDoctorId) {
      const doctor = await User.findByPk(nextDoctorId);
      if (!doctor || doctor.role !== 'medecin') {
        return res.status(404).json({ error: 'Médecin non trouvé' });
      }
    }

    await medicalRecord.update({
      patient_id: nextPatientId,
      doctor_id: nextDoctorId,
      date: date || medicalRecord.date,
      type: type || medicalRecord.type,
      title: title || medicalRecord.title,
      description: typeof description !== 'undefined' ? description : medicalRecord.description,
      symptoms: typeof symptoms !== 'undefined' ? symptoms : medicalRecord.symptoms,
      diagnosis: typeof diagnosis !== 'undefined' ? diagnosis : medicalRecord.diagnosis,
      recommendations: typeof recommendations !== 'undefined' ? recommendations : medicalRecord.recommendations,
      medications: typeof medications !== 'undefined' ? medications : medicalRecord.medications,
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
    if (!medicalRecord) {
      return res.status(404).json({ error: 'Dossier médical non trouvé' });
    }
    if (req.user.role === 'medecin' && medicalRecord.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Dossier médical non autorisé' });
    }
    if (req.user.role === 'patient' && medicalRecord.patient_id !== req.user.id) {
      return res.status(403).json({ error: 'Dossier médical non autorisé' });
    }
    await medicalRecord.destroy();
    res.json({ message: 'Dossier médical supprimé avec succès' });
  } catch (err) {
    console.error('❌ Error deleting medical record:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du dossier médical' });
  }
};
