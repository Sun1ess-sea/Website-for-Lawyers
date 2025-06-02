const LocalStrategy = require('passport-local').Strategy;
const db = require('../database/dbRequests');
const bcrypt = require('bcrypt');

function initialize(passport) {
  passport.use(new LocalStrategy(async (login, password, done) => {
    try {
      const admin = await db.findAdminByLogin(login);
      if (!admin) return done(null, false, { message: 'Неверный логин' });

      const isMatch = await bcrypt.compare(password, admin.password);
      if (!isMatch) return done(null, false, { message: 'Неверный пароль' });

      return done(null, admin);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((admin, done) => {
    done(null, admin.admin_id);
  });

  passport.deserializeUser(async (admin_id, done) => {
    try {
      const admin = await db.findAdminById(admin_id);
      done(null, admin);
    } catch (err) {
      done(err);
    }
  });
}

module.exports = initialize;
