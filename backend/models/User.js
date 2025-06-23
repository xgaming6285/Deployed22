const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // За хеширане на пароли

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    // Можеш да добавиш по-сложна валидация на имейл тук, ако не е в контролера
    // match: [
    //   /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    //   'Please add a valid email',
    // ],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Не връщай паролата по подразбиране при заявки
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'affiliate_manager', 'agent', 'pending_approval', 'lead_manager'], // Added 'lead_manager' role
    default: 'pending_approval',
    required: true // Remains true since it has a default value
  },
  leadManagerStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'not_applicable'],
    default: 'not_applicable'
  },
  leadManagerApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  leadManagerApprovedAt: {
    type: Date,
    default: null
  },
  fourDigitCode: {
    type: String,
    validate: {
      validator: function (v) {
        // Изисква се само за агенти
        if (this.role === 'agent') {
          return v && v.length === 4 && /^\d{4}$/.test(v);
        }
        return true; // Не е задължително за други роли
      },
      message: 'Agents must have a 4-digit code'
    },
    // Можеш да добавиш unique: true, ако четирицифреният код трябва да е уникален за всеки агент
    // unique: true, // Внимавай с това, ако агентите могат да имат същия код или е временно
  },
  permissions: {
    canCreateOrders: { type: Boolean, default: true },
    canManageLeads: { type: Boolean, default: false }
  },
  isActive: {
    type: Boolean,
    default: false // <-- КОРИГИРАНО: По подразбиране неактивен, докато не бъде одобрен
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending' // <-- КОРИГИРАНО: По подразбиране статус 'pending'
  },
  eulaAccepted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true, // Автоматично добавя createdAt и updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Индекси за производителност на заявки
userSchema.index({ email: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ fourDigitCode: 1 });

// Middleware за хеширане на паролата преди запазване на потребителя
userSchema.pre('save', async function (next) {
  // Хеширай паролата само ако е променена (или е нов потребител)
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12); // Генерирай salt
    this.password = await bcrypt.hash(this.password, salt); // Хеширай паролата
    next();
  } catch (error) {
    next(error); // Предай грешката на следващия middleware
  }
});

// Метод за сравняване на въведена парола с хешираната в базата
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Сравнява въведената парола с хешираната
  return await bcrypt.compare(candidatePassword, this.password);
};

// Метод за премахване на паролата от JSON изхода
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password; // Изтрий полето password
  return userObject;
};

module.exports = mongoose.model('User', userSchema);