const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const login = async (req, res) => {
  try {
    console.log('🔍 Debug: User model:', User); // Debug log to inspect User
    const { username, password } = req.body;
    if (!username || !password) {
      console.warn('❌ Missing username or password');
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      console.warn('❌ User not found:', username);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn('❌ Invalid password for user:', username);
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    console.log('✅ Login successful for user:', username);
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('❌ Error during login:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const register = async (req, res) => {
  try {
    const { username, email, password, specialite } = req.body;

    // Validation des champs requis
    if (!username || !email || !password) {
      console.warn('❌ Missing required fields');
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      console.warn('❌ Username already exists:', username);
      return res.status(400).json({ message: 'Username already exists' });
    }

    // 🔍 DEBUG: Afficher la spécialité reçue
    console.log('🔍 Specialty received from frontend:', specialite);
    console.log('🔍 Specialty type:', typeof specialite);
    console.log('🔍 Specialty trimmed:', specialite ? specialite.trim() : 'null/undefined');

    // Déterminer le rôle basé sur la spécialité
    const trimmedSpecialty = specialite ? specialite.trim() : '';
    const role = trimmedSpecialty ? 'medecin' : 'patient';

    // 🔍 DEBUG: Afficher le rôle déterminé
    console.log('🔍 Role determined:', role);

    // Préparer les données pour la base de données
    const userData = {
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      specialite: trimmedSpecialty || null, // Stocker directement la spécialité telle quelle
    };

    // 🔍 DEBUG: Afficher les données qui vont être sauvegardées
    console.log('🔍 User data to be saved:', {
      username: userData.username,
      email: userData.email,
      role: userData.role,
      specialite: userData.specialite,
      specialiteType: typeof userData.specialite
    });

    // Créer l'utilisateur dans la base de données
    const user = await User.create(userData);

    // 🔍 DEBUG: Afficher les données après sauvegarde
    console.log('🔍 User saved in database:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      specialite: user.specialite,
      specialiteType: typeof user.specialite
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1h' }
    );

    console.log('✅ Registration successful for user:', username, 'with role:', role, 'and specialty:', user.specialite);
    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        specialite: user.specialite, // Retourner la spécialité telle qu'elle est stockée
      },
      token,
    });
  } catch (error) {
    console.error('❌ Error during registration:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Nouvelle fonction pour récupérer la liste des utilisateurs
const getUsers = async (req, res) => {
  try {
    const where = {};
    if (req.query.role) {
      where.role = req.query.role;
    }
    const users = await User.findAll({
      where,
      attributes: ['id', 'username', 'email', 'role', 'specialite', 'numero_ordre', 'telephone', 'adresse', 'age'],
    });
    console.log('✅ Users fetched successfully');
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error.message);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// Fonction pour récupérer l'utilisateur actuel
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'role', 'specialite', 'numero_ordre', 'telephone', 'adresse', 'age'],
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('✅ Current user fetched successfully');
    res.json(user);
  } catch (error) {
    console.error('❌ Error fetching current user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Fonction pour mettre à jour l'utilisateur actuel
const updateMe = async (req, res) => {
  try {
    const { username, specialite, numero_ordre, email, telephone, adresse } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Mettre à jour les champs
    user.username = username || user.username;
    user.specialite = specialite !== undefined ? specialite : user.specialite;
    user.numero_ordre = numero_ordre !== undefined ? numero_ordre : user.numero_ordre;
    user.email = email || user.email;
    user.telephone = telephone !== undefined ? telephone : user.telephone;
    user.adresse = adresse !== undefined ? adresse : user.adresse;
    await user.save();
    console.log('✅ User profile updated successfully');
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      specialite: user.specialite,
      numero_ordre: user.numero_ordre,
      telephone: user.telephone,
      adresse: user.adresse,
      age: user.age,
    });
  } catch (error) {
    console.error('❌ Error updating user profile:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Créer un nouvel utilisateur (admin)
const createUser = async (req, res) => {
  try {
    const { username, email, password, age, role, specialite, telephone, adresse } = req.body;

    // Validation des champs requis
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const userData = {
      username,
      email,
      password: await bcrypt.hash(password, 10),
      role,
      age: age || null,
      telephone: telephone || null,
      adresse: adresse || null,
      specialite: (role === 'medecin' && specialite) ? specialite : null,
    };

    const user = await User.create(userData);
    console.log('✅ User created successfully:', user.username);

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      specialite: user.specialite,
      age: user.age,
      telephone: user.telephone,
      adresse: user.adresse,
    });
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mettre à jour un utilisateur (admin)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, age, role, specialite, telephone, adresse } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mettre à jour les champs
    if (username) {
      const existingUser = await User.findOne({ where: { username, id: { [require('sequelize').Op.ne]: id } } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      user.username = username;
    }
    if (email) user.email = email;
    if (age !== undefined) user.age = age;
    if (role) user.role = role;
    if (specialite !== undefined) user.specialite = role === 'medecin' ? specialite : null;
    if (telephone !== undefined) user.telephone = telephone;
    if (adresse !== undefined) user.adresse = adresse;

    await user.save();
    console.log('✅ User updated successfully:', user.username);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      specialite: user.specialite,
      age: user.age,
      telephone: user.telephone,
      adresse: user.adresse,
    });
  } catch (error) {
    console.error('❌ Error updating user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Supprimer un utilisateur (admin)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const username = user.username;
    await user.destroy();
    console.log('✅ User deleted successfully:', username);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting user:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login,
  register,
  getUsers,
  getMe,
  updateMe,
  createUser,
  updateUser,
  deleteUser
};