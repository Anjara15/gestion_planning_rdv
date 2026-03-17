const Payment = require('../models/Payment');
const User = require('../models/User');

exports.getPayments = async (req, res) => {
  try {
    let where = {};
    if (req.user.role === 'admin' || req.user.role === 'staff') {
      // optionally filter by patient_id
      if (req.query.patient_id) where.patient_id = String(req.query.patient_id);
    } else if (req.user.role === 'patient') {
      where.patient_id = String(req.user.id);
    } else {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    const payments = await Payment.findAll({ where });
    res.json(payments);
  } catch (err) {
    console.error('❌ Error fetching payments:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des paiements' });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { patient_id, amount, status, description } = req.body;
    let targetPatient = patient_id;
    if (req.user.role === 'patient') {
      targetPatient = req.user.id;
    }
    const patient = await User.findByPk(targetPatient);
    if (!patient || patient.role !== 'patient') {
      return res.status(404).json({ error: 'Patient non trouvé' });
    }
    const payment = await Payment.create({
      id: `pay_${Date.now()}`,
      patient_id: String(targetPatient),
      amount,
      status: status || 'en_attente',
      description,
      createdAt: new Date(),
    });
    res.status(201).json(payment);
  } catch (err) {
    console.error('❌ Error creating payment:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la création du paiement' });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id);
    if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' });
    if (req.user.role === 'patient' && payment.patient_id !== String(req.user.id)) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    if (req.user.role === 'admin' || req.user.role === 'staff' || (req.user.role === 'patient' && payment.patient_id === String(req.user.id))) {
      const { amount, status, description } = req.body;
      await payment.update({ amount, status, description });
      return res.json(payment);
    }
    res.status(403).json({ error: 'Non autorisé' });
  } catch (err) {
    console.error('❌ Error updating payment:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour du paiement' });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await Payment.findByPk(id);
    if (!payment) return res.status(404).json({ error: 'Paiement non trouvé' });
    if (req.user.role === 'patient' && payment.patient_id !== String(req.user.id)) {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    await payment.destroy();
    res.json({ message: 'Paiement supprimé' });
  } catch (err) {
    console.error('❌ Error deleting payment:', err);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du paiement' });
  }
};
