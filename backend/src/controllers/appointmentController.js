const Appointment = require('../models/Appointment');
const User = require('../models/User');
const TimeSlot = require('../models/TimeSlot');
const { Op } = require('sequelize');

exports.getAppointments = async (req, res) => {
  try {
    const { date } = req.query;
    const where = {};
    if (req.user.role === 'medecin') {
      where.medecin_id = req.user.id;
    }
    // Support archive/past query: return appointments with date less than today
    if (req.query.past === 'true' || req.query.archive === 'true') {
      const today = new Date();
      const isoToday = today.toISOString().split('T')[0];
      where.date = { [Op.lt]: isoToday };
    } else if (date) {
      where.date = date;
    }
    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: User, as: 'patient', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'medecin', attributes: ['id', 'username', 'email', 'specialite'] }
      ],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });
    res.json(appointments);
  } catch (err) {
    console.error('❌ Error fetching appointments:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des rendez-vous' });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    // BUG FIX: Remplacement de 'heure' par 'time' pour correspondre au modèle.
    const { patient_id, date, time, specialite, demande, is_new } = req.body;
    const patient = await User.findByPk(patient_id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }
    const appointment = await Appointment.create({
      id: `rdv_${Date.now()}`,
      patient_id,
      date,
      time, // BUG FIX: Utilisation de 'time'
      specialite,
      medecin_id: req.user.id,
      demande,
      is_new,
    });
    res.status(201).json(appointment);
  } catch (err) {
    console.error('❌ Error creating appointment:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du rendez-vous' });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    // BUG FIX: Remplacement de 'heure' par 'time' pour correspondre au modèle.
    const { patient_id, date, time, specialite, demande, is_new } = req.body;
    const appointment = await Appointment.findByPk(id);
    if (!appointment || appointment.medecin_id !== req.user.id) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé ou non autorisé' });
    }
    const patient = await User.findByPk(patient_id);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }
    await appointment.update({
      patient_id,
      date,
      time, // BUG FIX: Utilisation de 'time'
      specialite,
      demande,
      is_new,
    });
    res.json(appointment);
  } catch (err) {
    console.error('❌ Error updating appointment:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du rendez-vous' });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouve' });
    }

    const canDelete =
      req.user.role === 'admin' ||
      req.user.role === 'staff' ||
      (req.user.role === 'medecin' && appointment.medecin_id === req.user.id) ||
      (req.user.role === 'patient' && appointment.patient_id === req.user.id);

    if (!canDelete) {
      return res.status(403).json({ error: 'Non autorise a supprimer ce rendez-vous' });
    }

    await appointment.destroy();
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du rendez-vous' });
  }
};

// Appointments for the logged-in patient
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      where: { patient_id: req.user.id },
      include: [
        { model: User, as: 'medecin', attributes: ['id', 'username', 'email', 'specialite'] },
      ],
      order: [['date', 'ASC'], ['time', 'ASC']],
    });
    res.json(appointments);
  } catch (err) {
    console.error('❌ Error fetching my appointments:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération de vos rendez-vous' });
  }
};

// Available time slots for a given date (generic, not bound to a doctor)
exports.getAvailableSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Paramètre date requis (YYYY-MM-DD)' });
    }

    // Find approved time slots for that date
    const slots = await TimeSlot.findAll({ where: { date, status: 'approved' } });

    const toMinutes = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const toTime = (mins) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0');
      const m = (mins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    // Generate available times (de-duplicated) for the date
    const times = new Set();
    for (const slot of slots) {
      const start = toMinutes(slot.heure_debut);
      const end = toMinutes(slot.heure_fin);
      const step = Number(slot.duree_consultation) || 30;
      for (let t = start; t + step <= end; t += step) {
        times.add(toTime(t));
      }
    }

    const available = Array.from(times).sort().map(time => ({ time }));
    res.json(available);
  } catch (err) {
    console.error('❌ Error fetching available slots:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des créneaux disponibles' });
  }
};

// Patient creates an appointment from a selected slot (without doctor)
exports.createAppointmentByPatient = async (req, res) => {
  try {
    const { date, time, specialite, demande } = req.body;
    if (!date || !time) {
      return res.status(400).json({ error: 'date et time sont requis' });
    }

    const appointment = await Appointment.create({
      id: `rdv_${Date.now()}`,
      patient_id: req.user.id,
      date,
      time,
      specialite,
      medecin_id: null,
      demande,
      is_new: true,
    });

    res.status(201).json(appointment);
  } catch (err) {
    console.error('❌ Error creating appointment (patient):', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du rendez-vous' });
  }
};

// List available doctors for a given date (and optional specialty)
exports.getAvailableDoctors = async (req, res) => {
  try {
    const { date, specialite } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Paramètre date requis (YYYY-MM-DD)' });
    }

    // All doctors (optionally filtered by specialty)
    const whereUser = { role: 'medecin' };
    const specialtyQuery = specialite && specialite.trim() ? specialite.trim() : null;
    if (specialtyQuery) {
      whereUser.specialite = { [Op.iLike]: specialtyQuery };
    }
    let medecins = await User.findAll({
      where: whereUser,
      attributes: ['id', 'username', 'email', 'specialite'],
      order: [['username', 'ASC']],
    });
    if (medecins.length === 0 && specialtyQuery) {
      medecins = await User.findAll({
        where: { role: 'medecin' },
        attributes: ['id', 'username', 'email', 'specialite'],
        order: [['username', 'ASC']],
      });
    }

    if (medecins.length === 0) return res.json([]);

    // Slots for the date grouped by doctor
    const slots = await TimeSlot.findAll({
      where: { date, status: { [Op.ne]: 'rejected' } },
    });
    const hasAnySlotForDate = slots.length > 0;
    const slotsByDoctor = new Map();
    for (const s of slots) {
      const key = `${s.medecin_id}`;
      if (!slotsByDoctor.has(key)) slotsByDoctor.set(key, []);
      slotsByDoctor.get(key).push(s);
    }

    // Appointments (taken times) for that date grouped by doctor
    const appointments = await Appointment.findAll({
      where: { date },
      attributes: ['time', 'medecin_id'],
    });
    const takenByDoctor = new Map();
    for (const appt of appointments) {
      const key = `${appt.medecin_id}`;
      if (!takenByDoctor.has(key)) takenByDoctor.set(key, new Set());
      takenByDoctor.get(key).add(appt.time);
    }

    const toMinutes = (t) => {
      const [h, m] = String(t).split(':').map(Number);
      return h * 60 + m;
    };
    const toTime = (mins) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0');
      const m = (mins % 60).toString().padStart(2, '0');
      return `${h}:${m}`;
    };

    // Compute count of available slots per doctor
    const result = medecins.map((doc) => {
      const docSlots = slotsByDoctor.get(`${doc.id}`) || [];
      const taken = takenByDoctor.get(`${doc.id}`) || new Set();
      let availableCount = 0;
      if (!hasAnySlotForDate) {
        // Open scheduling mode: still allow doctor assignment if no slot exists at all.
        availableCount = 1;
      } else {
        for (const slot of docSlots) {
          const start = toMinutes(slot.heure_debut);
          const end = toMinutes(slot.heure_fin);
          const step = Number(slot.duree_consultation) || 30;
          for (let t = start; t + step <= end; t += step) {
            const at = toTime(t);
            if (!taken.has(at)) availableCount += 1;
          }
        }
      }
      return {
        id: doc.id,
        username: doc.username,
        email: doc.email,
        specialite: doc.specialite,
        availableSlots: availableCount,
      };
    }).filter(d => d.availableSlots > 0);

    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching available doctors:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des médecins disponibles' });
  }
};

// Admin: assign a doctor to an appointment if not conflicting
exports.assignDoctor = async (req, res) => {
  try {
    const { id } = req.params; // appointment id
    const { medecin_id } = req.body;
    if (!medecin_id) {
      return res.status(400).json({ error: 'medecin_id est requis' });
    }

    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    const medecin = await User.findByPk(medecin_id);
    if (!medecin || medecin.role !== 'medecin') {
      return res.status(404).json({ error: 'Médecin non trouvé' });
    }

    // Check conflict: same doctor, same date/time
    const conflict = await Appointment.findOne({
      where: { date: appointment.date, time: appointment.time, medecin_id },
    });
    if (conflict) {
      return res.status(409).json({ error: 'Le médecin a déjà un rendez-vous à cette heure' });
    }

    // Optionally ensure there exists a slot for this doctor covering that time.
    const slots = await TimeSlot.findAll({ where: { date: appointment.date, medecin_id } });
    const toMinutes = (t) => {
      const [h, m] = String(t).split(':').map(Number);
      return h * 60 + m;
    };
    const apptMins = toMinutes(appointment.time);
    const fitsInAnySlot = slots.some(s => apptMins >= toMinutes(s.heure_debut) && apptMins < toMinutes(s.heure_fin));
    if (slots.length > 0 && !fitsInAnySlot) {
      return res.status(400).json({ error: "Ce médecin n'a pas de créneau couvrant cet horaire" });
    }

    await appointment.update({ medecin_id });
    res.json({ success: true, appointment });
  } catch (err) {
    console.error('❌ Error assigning doctor:', err);
    res.status(500).json({ error: "Erreur serveur lors de l'assignation du médecin" });
  }
};

// Admin: list pending appointments (no doctor assigned)
exports.getPendingAppointments = async (req, res) => {
  try {
    const where = { medecin_id: null };
    const appointments = await Appointment.findAll({
      where,
      include: [
        { model: User, as: 'patient', attributes: ['id', 'username', 'email', 'telephone'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // flatten patient info for frontend convenience
    const result = appointments.map(a => ({
      id: a.id,
      nom: a.patient?.username ? String(a.patient.username).split(' ')[0] : undefined,
      prenom: a.patient?.username ? String(a.patient.username).split(' ')[1] || '' : undefined,
      email: a.patient?.email || a.email || null,
      telephone: a.patient?.telephone || null,
      date: a.date,
      time: a.time,
      specialite: a.specialite,
      demande: a.demande,
      createdAt: a.createdAt,
    }));

    res.json(result);
  } catch (err) {
    console.error('❌ Error fetching pending appointments:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des rendez-vous en attente' });
  }
};

// Admin: approve (confirm) an appointment
exports.approveAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    // mark as not new and keep medecin_id as is (assignment separate)
    await appointment.update({ is_new: false });

    res.json({ success: true, appointment });
  } catch (err) {
    console.error('❌ Error approving appointment:', err);
    res.status(500).json({ error: "Erreur serveur lors de l'approbation du rendez-vous" });
  }
};

// Admin: reject (delete) an appointment
exports.rejectAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByPk(id);
    if (!appointment) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    await appointment.destroy();
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error rejecting appointment:', err);
    res.status(500).json({ error: "Erreur serveur lors du rejet du rendez-vous" });
  }
};

