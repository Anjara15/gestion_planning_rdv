const sequelize = require('./src/config/database');
const Specialty = require('./src/models/Specialty');

const specialtiesData = [
  { name: 'Médecine générale', icon: 'Stethoscope', color: 'text-blue-600' },
  { name: 'Médecine interne', icon: 'Activity', color: 'text-indigo-600' },
  { name: 'Chirurgie générale', icon: 'Scissors', color: 'text-red-600' },
  { name: 'Chirurgie orthopédique', icon: 'Bone', color: 'text-orange-600' },
  { name: 'Chirurgie plastique', icon: 'Sparkles', color: 'text-pink-600' },
  { name: 'Neurochirurgie', icon: 'Brain', color: 'text-purple-600' },
  { name: 'Chirurgie thoracique', icon: 'Lungs', color: 'text-teal-600' },
  { name: 'Chirurgie vasculaire', icon: 'Heart', color: 'text-red-500' },
  { name: 'Cardiologie', icon: 'Heart', color: 'text-red-500' },
  { name: 'Dermatologie', icon: 'Sun', color: 'text-yellow-600' },
  { name: 'Endocrinologie', icon: 'Zap', color: 'text-yellow-500' },
  { name: 'Gastro-entérologie', icon: 'Pill', color: 'text-green-600' },
  { name: 'Hématologie', icon: 'Droplet', color: 'text-red-700' },
  { name: 'Infectiologie', icon: 'Shield', color: 'text-green-700' },
  { name: 'Néphrologie', icon: 'Filter', color: 'text-blue-700' },
  { name: 'Neurologie', icon: 'Brain', color: 'text-purple-500' },
  { name: 'Oncologie', icon: 'Target', color: 'text-red-800' },
  { name: 'Pneumologie', icon: 'Wind', color: 'text-cyan-600' },
  { name: 'Rhumatologie', icon: 'Bone', color: 'text-orange-500' },
  { name: 'Pédiatrie', icon: 'Baby', color: 'text-pink-500' },
  { name: 'Pédopsychiatrie', icon: 'Users', color: 'text-purple-400' },
  { name: 'Gynécologie', icon: 'Users', color: 'text-pink-600' },
  { name: 'Obstétrique', icon: 'Baby', color: 'text-pink-400' },
  { name: 'Ophtalmologie', icon: 'Eye', color: 'text-blue-800' },
  { name: 'Oto-rhino-laryngologie', icon: 'Ear', color: 'text-indigo-500' },
  { name: 'Chirurgie dentaire', icon: 'Smile', color: 'text-blue-400' },
  { name: 'Orthodontie', icon: 'AlignJustify', color: 'text-blue-300' },
  { name: 'Kinésithérapie', icon: 'Move', color: 'text-green-500' },
  { name: 'Orthophonie', icon: 'MessageCircle', color: 'text-teal-500' },
  { name: 'Radiologie', icon: 'Camera', color: 'text-gray-600' },
  { name: 'Échographie', icon: 'Monitor', color: 'text-gray-500' },
  { name: 'Médecine d\'urgence', icon: 'AlertTriangle', color: 'text-red-600' },
  { name: 'Psychiatrie', icon: 'Brain', color: 'text-purple-700' },
  { name: 'Anesthésie-réanimation', icon: 'Moon', color: 'text-indigo-700' },
];

async function populateSpecialties() {
  try {
    console.log('🔄 Synchronisation des modèles...');
    await sequelize.sync({ alter: true });

    console.log('📊 Insertion des spécialités...');
    for (const specialty of specialtiesData) {
      await Specialty.findOrCreate({
        where: { name: specialty.name },
        defaults: specialty
      });
    }

    console.log('✅ Spécialités insérées avec succès!');
    console.log(`📈 Total: ${specialtiesData.length} spécialités`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'insertion:', error);
    process.exit(1);
  }
}

populateSpecialties();
