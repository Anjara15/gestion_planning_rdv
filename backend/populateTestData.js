/**
 * Script pour peupler la base de données avec des données de test
 *
 * Dépendances requises:
 * - date-fns: npm install date-fns
 *
 * Exécution: node populateTestData.js
 */

const sequelize = require('./src/config/database');
const bcrypt = require('bcrypt');
// Use crypto module for UUID generation instead of uuid package
const crypto = require('crypto');
const { addDays, format, addHours, addMinutes, parseISO } = require('date-fns');

// Function to generate UUID v4 using Node.js crypto module
const uuidv4 = () => {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.randomBytes(1)[0] & 15 >> c / 4).toString(16)
  );
};

// Import models
const User = require('./src/models/User');
const TimeSlot = require('./src/models/TimeSlot');
const Appointment = require('./src/models/Appointment');
const History = require('./src/models/History');
const MedicalRecord = require('./src/models/MedicalRecord');
const Consultation = require('./src/models/Consultation');
const Prescription = require('./src/models/Prescription');
const Specialty = require('./src/models/Specialty');

// Helper function to hash passwords
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Helper function to generate a random date within a range
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to format date to YYYY-MM-DD
const formatDate = (date) => {
  return format(date, 'yyyy-MM-dd');
};

// Helper function to format time to HH:mm:ss
const formatTime = (date) => {
  return format(date, 'HH:mm:ss');
};

// Test data for users
const createUsers = async () => {
  console.log('🔄 Creating test users...');
  
  // Create admin user
  const adminPassword = await hashPassword('admin123');
  await User.findOrCreate({
    where: { username: 'admin' },
    defaults: {
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      telephone: '0123456789',
      adresse: '123 Admin Street',
    }
  });
  
  // Create staff user
  const staffPassword = await hashPassword('staff123');
  await User.findOrCreate({
    where: { username: 'staff' },
    defaults: {
      email: 'staff@example.com',
      password: staffPassword,
      role: 'staff',
      telephone: '0123456788',
      adresse: '123 Staff Street',
    }
  });
  
  // Create doctor users
  const doctorSpecialties = [
    { name: 'Dr Martin', specialty: 'Cardiologie', numero_ordre: '12345678' },
    { name: 'Dr Dupont', specialty: 'Dermatologie', numero_ordre: '23456789' },
    { name: 'Dr Dubois', specialty: 'Pédiatrie', numero_ordre: '34567890' },
    { name: 'Dr Bernard', specialty: 'Neurologie', numero_ordre: '45678901' },
    { name: 'Dr Thomas', specialty: 'Ophtalmologie', numero_ordre: '56789012' },
    { name: 'Dr Robert', specialty: 'Chirurgie générale', numero_ordre: '67890123' },
  ];
  
  const doctorUsers = [];
  
  for (const doctor of doctorSpecialties) {
    const doctorPassword = await hashPassword('doctor123');
    const [user, created] = await User.findOrCreate({
      where: { username: doctor.name },
      defaults: {
        email: `${doctor.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        password: doctorPassword,
        role: 'medecin',
        specialite: doctor.specialty,
        numero_ordre: doctor.numero_ordre,
        telephone: `01${Math.floor(10000000 + Math.random() * 90000000)}`,
        adresse: `${Math.floor(100 + Math.random() * 900)} Medical Avenue`,
      }
    });
    
    doctorUsers.push(user);
  }
  
  // Create patient users
  const patientNames = [
    'Alice Martin', 'Bob Dupont', 'Charlie Dubois', 'David Bernard', 'Emma Thomas',
    'François Robert', 'Gabrielle Petit', 'Hugo Richard', 'Isabelle Durand', 'Jules Moreau',
    'Karine Lefebvre', 'Léo Simon', 'Marie Laurent', 'Nicolas Michel', 'Olivia Leroy',
    'Pierre Roux', 'Quentin Girard', 'Rose Fournier', 'Sophie Vincent', 'Thomas Morel'
  ];
  
  const patientUsers = [];
  
  for (const name of patientNames) {
    const patientPassword = await hashPassword('patient123');
    const [user, created] = await User.findOrCreate({
      where: { username: name },
      defaults: {
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        password: patientPassword,
        role: 'patient',
        age: Math.floor(18 + Math.random() * 70),
        telephone: `06${Math.floor(10000000 + Math.random() * 90000000)}`,
        adresse: `${Math.floor(100 + Math.random() * 900)} Patient Street`,
      }
    });
    
    patientUsers.push(user);
  }
  
  console.log(`✅ Created ${doctorUsers.length} doctors and ${patientUsers.length} patients`);
  return { doctorUsers, patientUsers };
};

// Create time slots for doctors
const createTimeSlots = async (doctorUsers) => {
  console.log('🔄 Creating time slots for doctors...');
  
  const timeSlots = [];
  const today = new Date();
  
  for (const doctor of doctorUsers) {
    // Create time slots for the next 14 days
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) {
        continue;
      }
      
      // Morning slot
      const morningStart = new Date(date);
      morningStart.setHours(9, 0, 0);
      
      const morningEnd = new Date(date);
      morningEnd.setHours(12, 0, 0);
      
      const morningSlot = {
        id: uuidv4(),
        date: formatDate(date),
        heure_debut: formatTime(morningStart),
        heure_fin: formatTime(morningEnd),
        duree_consultation: 30,
        type_consultation: 'consultation',
        salle_consultation: `Salle ${Math.floor(1 + Math.random() * 5)}`,
        max_patients: 6,
        status: 'approved',
        medecin_id: doctor.id,
        created_by: 1, // Admin ID
      };
      
      // Afternoon slot
      const afternoonStart = new Date(date);
      afternoonStart.setHours(14, 0, 0);
      
      const afternoonEnd = new Date(date);
      afternoonEnd.setHours(17, 0, 0);
      
      const afternoonSlot = {
        id: uuidv4(),
        date: formatDate(date),
        heure_debut: formatTime(afternoonStart),
        heure_fin: formatTime(afternoonEnd),
        duree_consultation: 30,
        type_consultation: 'consultation',
        salle_consultation: `Salle ${Math.floor(1 + Math.random() * 5)}`,
        max_patients: 6,
        status: 'approved',
        medecin_id: doctor.id,
        created_by: 1, // Admin ID
      };
      
      timeSlots.push(morningSlot, afternoonSlot);
    }
  }
  
  // Create time slots in bulk
  await TimeSlot.bulkCreate(timeSlots, { ignoreDuplicates: true });
  
  console.log(`✅ Created ${timeSlots.length} time slots`);
  return timeSlots;
};

// Create appointments for patients
const createAppointments = async (patientUsers, doctorUsers, timeSlots) => {
  console.log('🔄 Creating appointments for patients...');
  
  const appointments = [];
  const today = new Date();
  
  // Create some appointments for today (for the dashboard to show)
  const todayDoctors = doctorUsers.slice(0, 3); // Take first 3 doctors
  const todayPatients = patientUsers.slice(0, 8); // Take first 8 patients
  
  // Create appointments for today
  for (let i = 0; i < todayPatients.length; i++) {
    const patient = todayPatients[i];
    const doctor = todayDoctors[i % todayDoctors.length];
    
    // Morning appointments
    if (i < 4) {
      const appointmentTime = new Date(today);
      appointmentTime.setHours(9 + i, 0, 0);
      
      appointments.push({
        id: uuidv4(),
        patient_id: patient.id,
        date: formatDate(today),
        time: formatTime(appointmentTime),
        specialite: doctor.specialite,
        medecin_id: doctor.id,
        demande: ['Consultation de routine', 'Douleur', 'Suivi', 'Contrôle'][i % 4],
        is_new: i === 0, // First appointment is new
      });
    } 
    // Afternoon appointments
    else {
      const appointmentTime = new Date(today);
      appointmentTime.setHours(14 + (i - 4), 0, 0);
      
      appointments.push({
        id: uuidv4(),
        patient_id: patient.id,
        date: formatDate(today),
        time: formatTime(appointmentTime),
        specialite: doctor.specialite,
        medecin_id: doctor.id,
        demande: ['Consultation de routine', 'Douleur', 'Suivi', 'Contrôle'][i % 4],
        is_new: false,
      });
    }
  }
  
  // Create an urgent appointment for today
  const urgentPatient = patientUsers[patientUsers.length - 1];
  const urgentDoctor = doctorUsers[0];
  const urgentTime = new Date(today);
  urgentTime.setHours(11, 30, 0);
  
  appointments.push({
    id: uuidv4(),
    patient_id: urgentPatient.id,
    date: formatDate(today),
    time: formatTime(urgentTime),
    specialite: urgentDoctor.specialite,
    medecin_id: urgentDoctor.id,
    demande: 'Urgence - Douleur intense',
    is_new: true,
  });
  
  // Create some future appointments
  for (let i = 0; i < 20; i++) {
    const patient = patientUsers[Math.floor(Math.random() * patientUsers.length)];
    const doctor = doctorUsers[Math.floor(Math.random() * doctorUsers.length)];
    const futureDate = addDays(today, Math.floor(1 + Math.random() * 13));
    
    // Skip weekends
    if (futureDate.getDay() === 0 || futureDate.getDay() === 6) {
      continue;
    }
    
    const isAfternoon = Math.random() > 0.5;
    const appointmentTime = new Date(futureDate);
    
    if (isAfternoon) {
      appointmentTime.setHours(14 + Math.floor(Math.random() * 3), Math.random() > 0.5 ? 0 : 30, 0);
    } else {
      appointmentTime.setHours(9 + Math.floor(Math.random() * 3), Math.random() > 0.5 ? 0 : 30, 0);
    }
    
    appointments.push({
      id: uuidv4(),
      patient_id: patient.id,
      date: formatDate(futureDate),
      time: formatTime(appointmentTime),
      specialite: doctor.specialite,
      medecin_id: doctor.id,
      demande: ['Consultation de routine', 'Douleur', 'Suivi', 'Contrôle', 'Renouvellement ordonnance'][Math.floor(Math.random() * 5)],
      is_new: Math.random() > 0.8, // 20% are new
    });
  }
  
  // Create appointments in bulk
  await Appointment.bulkCreate(appointments, { ignoreDuplicates: true });
  
  console.log(`✅ Created ${appointments.length} appointments`);
  return appointments;
};

// Create history records
const createHistory = async (users) => {
  console.log('🔄 Creating history records...');
  
  const history = [];
  const today = new Date();
  
  // Create login history for all users
  for (const user of users) {
    // Login today
    history.push({
      userId: user.id,
      action: 'Connexion',
      description: `Connexion au système`,
      createdAt: new Date(),
    });
    
    // Past logins
    for (let i = 0; i < 5; i++) {
      const pastDate = addDays(today, -Math.floor(1 + Math.random() * 30));
      
      history.push({
        userId: user.id,
        action: 'Connexion',
        description: `Connexion au système`,
        createdAt: pastDate,
      });
    }
    
    // Other actions for doctors
    if (user.role === 'medecin') {
      // View patient
      history.push({
        userId: user.id,
        action: 'Consultation patient',
        description: `Consultation des détails d'un patient`,
        createdAt: addMinutes(new Date(), -30),
      });
      
      // Create time slot
      history.push({
        userId: user.id,
        action: 'Création créneau',
        description: `Création d'un nouveau créneau`,
        createdAt: addHours(new Date(), -2),
      });
      
      // Edit profile
      history.push({
        userId: user.id,
        action: 'Mise à jour profil',
        description: `Sauvegarde des modifications du profil`,
        createdAt: addDays(new Date(), -1),
      });
    }
    
    // Other actions for patients
    if (user.role === 'patient') {
      // Book appointment
      history.push({
        userId: user.id,
        action: 'Prise de rendez-vous',
        description: `Prise d'un nouveau rendez-vous`,
        createdAt: addDays(new Date(), -2),
      });
      
      // View appointments
      history.push({
        userId: user.id,
        action: 'Consultation RDV',
        description: `Consultation de la liste des rendez-vous`,
        createdAt: addHours(new Date(), -1),
      });
    }
  }
  
  // Create history records in bulk
  await History.bulkCreate(history);
  
  console.log(`✅ Created ${history.length} history records`);
};

// Create medical records, consultations, and prescriptions
const createMedicalData = async (patientUsers, doctorUsers) => {
  console.log('🔄 Creating medical records, consultations, and prescriptions...');
  
  // Create medical records for patients
  for (const patient of patientUsers) {
    // Assign a random doctor to the patient
    const doctor = doctorUsers[Math.floor(Math.random() * doctorUsers.length)];
    const recordDate = addDays(new Date(), -Math.floor(1 + Math.random() * 30));
    
    // Create medical record
    const medicalRecord = await MedicalRecord.create({
      id: uuidv4(),
      patient_id: patient.id,
      doctor_id: doctor.id,
      date: formatDate(recordDate),
      type: ['Consultation', 'Examen', 'Suivi', 'Contrôle'][Math.floor(Math.random() * 4)],
      title: ['Première visite', 'Contrôle annuel', 'Consultation de routine', 'Examen médical'][Math.floor(Math.random() * 4)],
      description: 'Dossier médical du patient',
      symptoms: JSON.stringify(
        Math.random() > 0.5 ?
        ['Fièvre', 'Toux', 'Fatigue', 'Maux de tête'].slice(0, Math.floor(1 + Math.random() * 4)) :
        []
      ),
      diagnosis: Math.random() > 0.6 ?
        ['Grippe', 'Infection virale', 'Tension artérielle élevée', 'Allergie saisonnière'][Math.floor(Math.random() * 4)] :
        null,
      recommendations: JSON.stringify(
        Math.random() > 0.7 ?
        ['Repos', 'Hydratation', 'Suivi dans 2 semaines', 'Éviter les efforts physiques'].slice(0, Math.floor(1 + Math.random() * 4)) :
        []
      ),
      medications: JSON.stringify(
        Math.random() > 0.5 ?
        [
          {
            name: ['Doliprane', 'Amoxicilline', 'Ventoline', 'Levothyrox'][Math.floor(Math.random() * 4)],
            dosage: ['500mg', '1000mg', '100mcg', '50mg'][Math.floor(Math.random() * 4)],
            frequency: ['3 fois par jour', '2 fois par jour', 'Matin et soir', 'Au besoin'][Math.floor(Math.random() * 4)],
            duration: ['7 jours', '10 jours', '1 mois', '3 mois'][Math.floor(Math.random() * 4)],
          }
        ] :
        []
      ),
    });
    
    // Create past consultations
    const pastConsultationsCount = Math.floor(Math.random() * 5); // 0-4 past consultations
    
    for (let i = 0; i < pastConsultationsCount; i++) {
      const doctor = doctorUsers[Math.floor(Math.random() * doctorUsers.length)];
      const consultationDate = addDays(new Date(), -Math.floor(30 + Math.random() * 180)); // Past 1-6 months
      
      const consultationTime = new Date(consultationDate);
      consultationTime.setHours(9 + Math.floor(Math.random() * 8), Math.random() > 0.5 ? 0 : 30, 0);
      
      const consultation = await Consultation.create({
        id: uuidv4(),
        patient_id: patient.id,
        doctor_id: doctor.id,
        date: formatDate(consultationDate),
        time: formatTime(consultationTime),
        symptoms: JSON.stringify(['Fièvre', 'Toux', 'Fatigue', 'Maux de tête'].slice(0, Math.floor(1 + Math.random() * 4))),
        examination: 'Examen clinique normal',
        diagnosis: ['Grippe', 'Infection virale', 'Tension artérielle élevée', 'Allergie saisonnière'][Math.floor(Math.random() * 4)],
        treatment: 'Traitement symptomatique',
        recommendations: JSON.stringify(['Repos', 'Hydratation', 'Suivi dans 2 semaines'].slice(0, Math.floor(1 + Math.random() * 3))),
        follow_up: ['1 semaine', '2 semaines', '1 mois', '3 mois'][Math.floor(Math.random() * 4)],
        medications: JSON.stringify([
          {
            name: ['Doliprane', 'Amoxicilline', 'Ventoline', 'Levothyrox'][Math.floor(Math.random() * 4)],
            dosage: ['500mg', '1000mg', '100mcg', '50mg'][Math.floor(Math.random() * 4)],
            frequency: ['3 fois par jour', '2 fois par jour', 'Matin et soir', 'Au besoin'][Math.floor(Math.random() * 4)],
            duration: ['7 jours', '10 jours', '1 mois', '3 mois'][Math.floor(Math.random() * 4)],
          }
        ]),
      });
      
      // Create prescription for some consultations
      if (Math.random() > 0.3) { // 70% chance of prescription
        await Prescription.create({
          id: uuidv4(),
          consultation_id: consultation.id,
          patient_id: patient.id,
          doctor_id: doctor.id,
          date: formatDate(consultationDate),
          medications: JSON.stringify([
            {
              name: ['Doliprane', 'Amoxicilline', 'Ventoline', 'Levothyrox'][Math.floor(Math.random() * 4)],
              dosage: ['500mg', '1000mg', '100mcg', '50mg'][Math.floor(Math.random() * 4)],
              frequency: ['3 fois par jour', '2 fois par jour', 'Matin et soir', 'Au besoin'][Math.floor(Math.random() * 4)],
              duration: ['7 jours', '10 jours', '1 mois', '3 mois'][Math.floor(Math.random() * 4)],
            },
            {
              name: ['Spasfon', 'Smecta', 'Gaviscon', 'Daflon'][Math.floor(Math.random() * 4)],
              dosage: ['500mg', '1 sachet', '10ml', '1 comprimé'][Math.floor(Math.random() * 4)],
              frequency: ['3 fois par jour', '2 fois par jour', 'Après les repas', 'Au besoin'][Math.floor(Math.random() * 4)],
              duration: ['7 jours', '5 jours', '2 semaines', 'Si douleur'][Math.floor(Math.random() * 4)],
            }
          ]),
          instructions: 'Prendre les médicaments selon la prescription',
        });
      }
    }
  }
  
  console.log(`✅ Created medical records and consultations for ${patientUsers.length} patients`);
};

// Main function to populate all test data
const populateTestData = async () => {
  try {
    console.log('🔄 Starting database synchronization...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');
    
    // Create users
    const { doctorUsers, patientUsers } = await createUsers();
    
    // Create time slots
    const timeSlots = await createTimeSlots(doctorUsers);
    
    // Create appointments
    await createAppointments(patientUsers, doctorUsers, timeSlots);
    
    // Create history
    await createHistory([...doctorUsers, ...patientUsers]);
    
    // Create medical data
    await createMedicalData(patientUsers, doctorUsers);
    
    console.log('✅ All test data created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error populating test data:', error);
    process.exit(1);
  }
};

// Run the population script
populateTestData();