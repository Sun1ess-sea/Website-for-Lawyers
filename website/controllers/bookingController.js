const db = require('../database/dbRequests');
const pool = require('../database/db');
const nodemailer = require("nodemailer");

async function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.yandex.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.YANDEX_USER,
      pass: process.env.YANDEX_PASS,
    },
  });
}

async function sendBookingEmail(schedule_id, client_email, client_name, client_phone) {
  try {
    const scheduleResult = await pool.query(`
      SELECT 
        s.booking_date, 
        l.lawyer_name
      FROM schedule s
      JOIN lawyers l ON s.lawyer_id = l.lawyer_id
      WHERE s.schedule_id = $1
    `, [schedule_id]);

    const schedule = scheduleResult.rows[0];

    const htmlContent = `
      <h3>Вы записались на консультацию</h3>
      <p><strong>Клиент:</strong> ${client_name}</p>
      <p><strong>Телефон:</strong> ${client_phone}</p>
      <p><strong>Email:</strong> ${client_email}</p>
      <p><strong>Адвокат:</strong> ${schedule.lawyer_name}</p>
      <p><strong>Дата и время:</strong> ${new Date(schedule.booking_date).toLocaleString("ru-RU")}</p>
      <p><strong>Адрес:</strong> г. Челябинск, ул. Труда, д. 156 «В» цокольный этаж, вход со двора</p>
      <p><strong>Номер телефона для связи:</strong> 8(951)738-46-24</p>
    `;

    const transporter = await createTransporter();

    const info = await transporter.sendMail({
      from: '"ПЕРСПЕКТИВА" <' + process.env.YANDEX_USER + '>',
      to: client_email,
      subject: "Запись на консультацию",
      html: htmlContent,
    });

    console.log("Письмо отправлено:", info.messageId);
    return info.messageId;
    
  } catch (error) {
    console.error("Ошибка при отправке письма:", error);
    throw error;
  }
}


module.exports.showBookingPage = async (req, res) => {
  try {
    const legalSpecializations = await db.getLegalSpecializations();
    res.render('contacts', { legalSpecializations });
  } catch (err) {
    console.error('Ошибка загрузки страницы бронирования:', err);
    res.status(500).send('Ошибка сервера');
  }
};

module.exports.getLawyers = async (req, res) => {
  const { ls_id } = req.params;
  try {
    const lawyers = await db.getLawyersBySpecialization(ls_id);
    res.json(lawyers);
  } catch (err) {
    console.error('Ошибка получения адвокатов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

module.exports.getSchedule = async (req, res) => {
  const { lawyer_id } = req.params;
  try {
    const schedule = await db.getScheduleByLawyer(lawyer_id);
    res.json(schedule);
  } catch (err) {
    console.error('Ошибка получения расписания:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};
  
module.exports.createBooking = async (req, res) => {
  const { schedule_id, client_email, client_phone, client_name } = req.body;

  try {
    // 1. Добавляем бронирование
    await pool.query(
      `INSERT INTO bookings (schedule_id, client_email, client_phone, client_name)
       VALUES ($1, $2, $3, $4)`,
      [schedule_id, client_email, client_phone, client_name]
    );

    // 2. Обновляем статус расписания
    await pool.query(`UPDATE schedule SET status = TRUE WHERE schedule_id = $1`, [schedule_id]);

    // 3. Отвечаем клиенту, чтобы модальное окно выскочило без задержек
    res.status(200).json({ message: "Запись успешно создана" });

    // 4. А потом уже асинхронно отправляем письмо (без await, чтобы не ждать)
    sendBookingEmail(schedule_id, client_email, client_name, client_phone)
      .then(url => {
        console.log("Письмо отправлено, preview URL:", url);
      })
      .catch(err => {
        console.error("Ошибка при отправке письма:", err);
      });

  } catch (err) {
    console.error("Ошибка бронирования:", err);
    res.status(500).json({ error: "Ошибка сервера" });
  }
};