const bcrypt = require('bcryptjs');
const pool = require('./database/db'); // подключение к БД
// либо: const pool = require('./database/db'); в зависимости от структуры

async function updatePassword() {
  const newPlainPassword = 'Kokosik'; // ← Укажи тут новый пароль
  const adminId = 1;

  try {
    const hashedPassword = await bcrypt.hash(newPlainPassword, 10);

    const result = await pool.query(
      'UPDATE admins SET password = $1 WHERE admin_id = $2 RETURNING *',
      [hashedPassword, adminId]
    );

    if (result.rowCount === 0) {
      console.log('Администратор с таким ID не найден.');
    } else {
      console.log('Пароль успешно обновлён для администратора:', result.rows[0]);
    }
  } catch (error) {
    console.error('Ошибка при обновлении пароля администратора:', error);
  }
}

updatePassword();
