const { Op, fn, col } = require('sequelize');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Consultation = require('../models/Consultation');

// Statistiques pour le médecin connecté ou globales pour admin/staff
exports.getStats = async (req, res) => {
  try {
    if (req.user.role === 'medecin') {
      const medecinId = req.user.id;

      // Nombre total de rendez-vous
      const totalAppointments = await Appointment.count({
        where: { medecin_id: medecinId }
      });

      // Nombre de patients uniques
      const uniquePatients = await Appointment.findAll({
        where: { medecin_id: medecinId },
        attributes: [[fn('DISTINCT', col('patient_id')), 'patient_id']],
        raw: true
      });
      const totalPatients = uniquePatients.length;

      // Rendez-vous par mois (derniers 12 mois)
      const appointmentsByMonth = await Appointment.findAll({
        where: {
          medecin_id: medecinId,
          date: {
            [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        },
        attributes: [
          [fn('DATE_TRUNC', 'month', col('date')), 'month'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: [fn('DATE_TRUNC', 'month', col('date'))],
        order: [[fn('DATE_TRUNC', 'month', col('date')), 'ASC']],
        raw: true
      });

      // Consultations par mois
      const consultationsByMonth = await Consultation.findAll({
        where: {
          doctor_id: medecinId,
          date: {
            [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12))
          }
        },
        attributes: [
          [fn('DATE_TRUNC', 'month', col('date')), 'month'],
          [fn('COUNT', col('id')), 'count']
        ],
        group: [fn('DATE_TRUNC', 'month', col('date'))],
        order: [[fn('DATE_TRUNC', 'month', col('date')), 'ASC']],
        raw: true
      });

      // Répartition par spécialité (si applicable)
      const appointmentsBySpecialty = await Appointment.findAll({
        where: { medecin_id: medecinId },
        attributes: ['specialite', [fn('COUNT', col('id')), 'count']],
        group: ['specialite'],
        raw: true
      });

      res.json({
        totalAppointments,
        totalPatients,
        appointmentsByMonth: appointmentsByMonth.map(item => ({
          month: item.month,
          count: parseInt(item.count)
        })),
        consultationsByMonth: consultationsByMonth.map(item => ({
          month: item.month,
          count: parseInt(item.count)
        })),
        appointmentsBySpecialty: appointmentsBySpecialty.map(item => ({
          specialty: item.specialite || 'Non spécifiée',
          count: parseInt(item.count)
        }))
      });
    } else {
      // Statistiques globales pour admin/staff
      const totalUsers = await User.count();
      const totalPatients = await User.count({ where: { role: 'patient' } });
      const totalMedecins = await User.count({ where: { role: 'medecin' } });
      const totalAppointments = await Appointment.count();
      const totalAlerts = 0; // Placeholder, as alerts are not implemented in backend

      // Recent activity: last 10 appointments
      const recentActivity = await Appointment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          { model: User, as: 'patient', attributes: ['username'] },
          { model: User, as: 'medecin', attributes: ['username'] }
        ],
        attributes: ['id', 'date', 'createdAt']
      });

      res.json({
        totalUsers,
        totalPatients,
        totalMedecins,
        totalAppointments,
        totalAlerts,
        recentActivity: recentActivity.map(app => ({
          id: app.id,
          date: app.date,
          time: app.createdAt,
          user: app.patient?.username || 'Inconnu',
          action: 'Rendez-vous créé',
          details: `Avec ${app.medecin?.username || 'Médecin inconnu'}`
        }))
      });
    }
  } catch (err) {
    console.error('Erreur récupération stats:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des statistiques' });
  }
};
