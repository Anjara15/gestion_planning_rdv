const express = require('express');
const cors = require('cors');
const sequelize = require('./src/config/database');
require('dotenv').config();

// Load all models to ensure Sequelize registers them and associations are available.
const User = require('./src/models/User');
const TimeSlot = require('./src/models/TimeSlot');
require('./src/models/Appointment');
require('./src/models/MedicalRecord');
require('./src/models/Consultation');
require('./src/models/Prescription');
require('./src/models/History');
require('./src/models/Specialty');

// Define associations that are intentionally centralized here.
User.hasMany(TimeSlot, { foreignKey: 'medecin_id', as: 'timeSlots' });
TimeSlot.belongsTo(User, { as: 'medecin', foreignKey: 'medecin_id' });

const app = express();
const PORT = process.env.PORT || 3000;

const ensureSchemaCompatibility = async () => {
  // Legacy databases may still have appointments.medecin_id as NOT NULL.
  // Patient booking requires nullable doctor assignment before admin assignment.
  await sequelize.query('ALTER TABLE "appointments" ALTER COLUMN "medecin_id" DROP NOT NULL;');
};

app.use(
  cors({
    origin: process.env.CLIENT_URL || ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);
app.use(express.json());

// Request logging for API endpoints.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// API routes.
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/time-slots', require('./src/routes/timeSlotRoute'));
app.use('/api/appointments', require('./src/routes/appointmentRoutes'));
app.use('/api/consultations', require('./src/routes/consultationRoutes'));
app.use('/api/medical-records', require('./src/routes/medicalRecordRoutes'));
app.use('/api/prescriptions', require('./src/routes/prescriptionRoutes'));
app.use('/api/stats', require('./src/routes/statsRoutes'));
app.use('/api/history', require('./src/routes/historyRoutes'));
app.use('/api/specialties', require('./src/routes/specialtyRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'Le serveur fonctionne' });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

// In development, alter keeps schema in sync without dropping existing data.
sequelize
  .sync({ alter: true })
  .then(async () => {
    await ensureSchemaCompatibility();
    console.log('Modeles synchronises avec la base de donnees');
    app.listen(PORT, () => {
      console.log(`Serveur lance sur http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Erreur de synchronisation des modeles:', err);
    process.exit(1);
  });
