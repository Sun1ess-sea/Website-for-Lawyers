const pool = require('./db');

const getSixNews = async () => {
  try {
    const query = `
      SELECT news_id, admin_id, image_news, TO_CHAR(create_date, 'DD.MM.YYYY') AS date, title_news, description_news
      FROM news
      ORDER BY create_date DESC
      LIMIT 6;
    `;

    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Ошибка при получении новостей:', error);
    throw error;
  }
};

async function getFiveReviews() {
  try {
    const result = await pool.query('SELECT * FROM reviews ORDER BY review_id DESC LIMIT 5');
    return result.rows;
  } catch (error) {
    console.error('Ошибка при получении последних отзывов:', error);
    throw error;
  }
};

async function getTenLawyers() {
  try {
    const result = await pool.query('SELECT * FROM lawyers ORDER BY lawyer_id ASC LIMIT 10');
    return result.rows;
  } catch (error) {
    console.error('Ошибка при получении адвокатов:', error);
    throw error;
  }
};

// Запросы для страницы новостей
const getNewsPage = async (page = 1, limit = 12) => {
  try {
    const offset = (page - 1) * limit;
    const query = `
      SELECT news_id, admin_id, image_news, TO_CHAR(create_date, 'DD.MM.YYYY') AS date, title_news, description_news
      FROM news
      ORDER BY create_date DESC
      LIMIT $1 OFFSET $2;
    `;

    const result = await pool.query(query, [limit, offset]);
    return result.rows;
  } catch (error) {
    console.error('Ошибка при получении новостей:', error);
    throw error;
  }
};

const getTotalNewsCount = async () => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM news;');
    return parseInt(result.rows[0].count, 10);
  } catch (error) {
    console.error('Ошибка при подсчете новостей:', error);
    throw error;
  }
};

const getNewsById = async (id) => {
  const query = `
    SELECT news_id, admin_id, image_news, TO_CHAR(create_date, 'DD.MM.YYYY') AS date, title_news, description_news
    FROM news
    WHERE news_id = $1;
  `;
  const result = await pool.query(query, [id]);
  return result.rows[0]; // либо объект, либо undefined
};

// Запросы для Booking --------------------------------------------------------------- 
// Получить список специализаций
async function getLegalSpecializations() {
  const result = await pool.query('SELECT ls_id, specialization_name FROM legal_specialization ORDER BY specialization_name');
  return result.rows;
}

// Получить адвокатов по специализации
async function getLawyersBySpecialization(ls_id) {
  const result = await pool.query(
    `SELECT l.lawyer_id, l.lawyer_name
     FROM lawyers l
     JOIN lawyer_specialization ls ON l.lawyer_id = ls.lawyer_id
     WHERE ls.ls_id = $1
     ORDER BY l.lawyer_name`, [ls_id]
  );
  return result.rows;
}

// Получить расписание адвоката
async function getScheduleByLawyer(lawyer_id) {
  const result = await pool.query(
    `SELECT schedule_id, booking_date
     FROM schedule
     WHERE lawyer_id = $1 AND status = FALSE
     ORDER BY booking_date`, [lawyer_id]
  );
  return result.rows;
}

// -------------------------------------------------------------------------

//Запросы для страницы сотрудников (Lawyers)
async function getAllLawyers() {
  const query = `
    SELECT 
      l.lawyer_id,
      l.lawyer_name,
      l.lawyer_title,
      l.lawyer_image,
      l.lawyer_description,
      l.lawyer_experience,
      l.lawyer_email,
      ls.specialization_name
    FROM lawyers l
    LEFT JOIN lawyer_specialization ls_link ON l.lawyer_id = ls_link.lawyer_id
    LEFT JOIN legal_specialization ls ON ls_link.ls_id = ls.ls_id
    ORDER BY l.lawyer_id
  `;

  try {
    const result = await pool.query(query);
    const lawyersMap = new Map();

    for (const row of result.rows) {
      const lawyerId = row.lawyer_id;
      if (!lawyersMap.has(lawyerId)) {
        lawyersMap.set(lawyerId, {
          lawyer_id: row.lawyer_id,
          lawyer_name: row.lawyer_name,
          lawyer_title: row.lawyer_title,
          lawyer_image: row.lawyer_image,
          lawyer_description: row.lawyer_description,
          lawyer_experience: row.lawyer_experience,
          lawyer_email: row.lawyer_email,
          specializations: [],
        });
      }

      if (row.specialization_name) {
        lawyersMap.get(lawyerId).specializations.push(row.specialization_name);
      }
    }

    return Array.from(lawyersMap.values());
  } catch (error) {
    console.error('Ошибка при получении адвокатов с их специализациями:', error);
    throw error;
  }
}

async function getLawyerById(lawyerId) {
  const query = `
    SELECT 
      l.lawyer_id,
      l.lawyer_name,
      l.lawyer_title,
      l.lawyer_image,
      l.lawyer_description,
      l.lawyer_experience,
      l.lawyer_email,
      ls.specialization_name
    FROM lawyers l
    LEFT JOIN lawyer_specialization ls_link ON l.lawyer_id = ls_link.lawyer_id
    LEFT JOIN legal_specialization ls ON ls_link.ls_id = ls.ls_id
    WHERE l.lawyer_id = $1
  `;

  try {
    const result = await pool.query(query, [lawyerId]);

    if (result.rows.length === 0) return null;

    const base = result.rows[0];
    const specializations = result.rows
      .map(row => row.specialization_name)
      .filter(Boolean);

    return {
      lawyer_id: base.lawyer_id,
      lawyer_name: base.lawyer_name,
      lawyer_title: base.lawyer_title,
      lawyer_image: base.lawyer_image,
      lawyer_description: base.lawyer_description,
      lawyer_experience: base.lawyer_experience,
      lawyer_email: base.lawyer_email,
      specializations,
    };
  } catch (err) {
    console.error('Ошибка при получении адвоката:', err);
    throw err;
  }
}

// Запросы для страниц услуг
async function getAllServices() {
  const query = `
    SELECT service_id, admin_id, service_name, service_price
    FROM services
    ORDER BY service_name;
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err) {
    console.error('Ошибка при получении услуг:', err);
    throw err;
  }
}

async function getAllLegalSpecializations() {
  try {
    const query = 'SELECT * FROM legal_specialization ORDER BY specialization_name';
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Ошибка при выполнении запроса getAllLegalSpecializations:', error);
    throw error;
  }
}

// Админ-панель
async function findAdminByLogin (login) {
    const result = await pool.query('SELECT * FROM admins WHERE login = $1', [login]);
    return result.rows[0];
};

async function findAdminById (id) {
    const result = await pool.query('SELECT * FROM admins WHERE admin_id = $1', [id]);
    return result.rows[0];
};

async function createAdmin ({ login, password, admin_name }) {
  const result = await pool.query(
    'INSERT INTO admins (login, password, admin_name) VALUES ($1, $2, $3) RETURNING *',
    [login, password, admin_name]
  );
  return result.rows[0];
};

async function getAllBookings() {
  const result = await pool.query(`
    SELECT
      b.booking_id,
      b.client_name,
      b.client_email,
      b.client_phone,
      s.booking_date
    FROM bookings b
    JOIN schedule s ON b.schedule_id = s.schedule_id
    ORDER BY s.booking_date DESC
  `);

  return result.rows.map(row => {
    const bookingDate = new Date(row.booking_date);
    const date = bookingDate.toISOString().split('T')[0];
    const time = bookingDate.toTimeString().slice(0, 5);

    return {
      booking_id: row.booking_id,
      client_name: row.client_name,
      client_email: row.client_email,
      client_phone: row.client_phone,
      date,
      time
    };
  });
}

async function getBookingInfoById(booking_id) {
  const result = await pool.query(`
    SELECT 
      b.client_email,
      b.client_name,
      s.schedule_id,
      s.booking_date,
      l.lawyer_name
    FROM bookings b
    JOIN schedule s ON b.schedule_id = s.schedule_id
    JOIN lawyers l ON s.lawyer_id = l.lawyer_id
    WHERE b.booking_id = $1
  `, [booking_id]);

  return result.rows[0];
}

// Удалить бронь
async function deleteBookingById(booking_id) {
  await pool.query(`DELETE FROM bookings WHERE booking_id = $1`, [booking_id]);
}

// Обновить статус расписания
async function setScheduleStatus(schedule_id, status) {
  await pool.query(`UPDATE schedule SET status = $1 WHERE schedule_id = $2`, [status, schedule_id]);
}


async function getAllSchedulesWithLawyers() {
  const result = await pool.query(`
    SELECT 
      s.schedule_id,
      s.booking_date,
      s.status,
      l.lawyer_name
    FROM schedule s
    JOIN lawyers l ON s.lawyer_id = l.lawyer_id
    ORDER BY s.booking_date DESC
  `);

  return result.rows.map(row => {
    const bookingDate = new Date(row.booking_date);
    const date = bookingDate.toISOString().split('T')[0];
    const time = bookingDate.toTimeString().split(':').slice(0, 2).join(':');

    return {
      schedule_id: row.schedule_id,
      lawyer_name: row.lawyer_name,
      date,
      time,
      status: row.status
    };
  });
}

async function getAllSpecializations() {
  const result = await pool.query('SELECT ls_id, specialization_name FROM legal_specialization');
  return result.rows;
}

// Получить адвокатов по специализации (повтор - оригинал выше)

async function addScheduleMultipleTimes(lawyer_id, admin_id, bookingDate, times) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Получаем уже существующие записи для адвоката на эту дату
    const result = await client.query(
      `SELECT booking_date
       FROM schedule
       WHERE lawyer_id = $1 AND DATE(booking_date) = $2`,
      [lawyer_id, bookingDate]
    );

    const existingTimes = new Set(
      result.rows.map(row => row.booking_date.toTimeString().slice(0, 5))
    );

    // Находим конфликты
    const duplicates = times.filter(time => existingTimes.has(time));

    if (duplicates.length > 0) {
      throw new Error(`Конфликт времени: ${duplicates.join(', ')}`);
    }

    const insertPromises = times.map(time => {
      const bookingDateTime = `${bookingDate} ${time}:00`;
      return client.query(
        `INSERT INTO schedule (lawyer_id, admin_id, booking_date, status)
         VALUES ($1, $2, $3, false)`,
        [lawyer_id, admin_id, bookingDateTime]
      );
    });

    await Promise.all(insertPromises);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getLawyersForAdmin() {
  const result = await pool.query('SELECT lawyer_id, lawyer_name FROM lawyers ORDER BY lawyer_name');
  return result.rows;
}

async function getLawyersForFilter() {
  const query = `
    SELECT lawyer_id AS id, lawyer_name AS name
    FROM lawyers
    ORDER BY lawyer_name
  `;
  const { rows } = await pool.query(query);
  return rows;
}

async function getSchedules({ lawyer_id, date_from, date_to }) {
  let query = `
    SELECT 
      s.schedule_id, 
      l.lawyer_name, 
      TO_CHAR(s.booking_date::date, 'YYYY-MM-DD') AS date,
      TO_CHAR(s.booking_date, 'HH24:MI') AS time, 
      s.status
    FROM schedule s
    JOIN lawyers l ON s.lawyer_id = l.lawyer_id
    WHERE 1=1
  `;

  const params = [];
  let idx = 1;

  if (lawyer_id) {
    query += ` AND s.lawyer_id = $${idx++}`;
    params.push(lawyer_id);
  }
  if (date_from) {
    query += ` AND s.booking_date::date >= $${idx++}`;
    params.push(date_from);
  }
  if (date_to) {
    query += ` AND s.booking_date::date <= $${idx++}`;
    params.push(date_to);
  }

  query += ` ORDER BY s.booking_date`;

  const { rows } = await pool.query(query, params);
  return rows;
}

async function deleteScheduleById(scheduleId) {
  const query = `DELETE FROM schedule WHERE schedule_id = $1 AND status = false`;
  return pool.query(query, [scheduleId]);
}

async function updateScheduleById(schedule_id, lawyer_id, bookingDate, time) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Получаем уже существующие записи для адвоката на эту дату, кроме той, которую редактируем
    const result = await client.query(
      `SELECT booking_date
       FROM schedule
       WHERE lawyer_id = $1 AND DATE(booking_date) = $2 AND schedule_id != $3`,
      [lawyer_id, bookingDate, schedule_id]
    );

    // Сохраняем существующие времена
    const existingTimes = new Set(
      result.rows.map(row => row.booking_date.toTimeString().slice(0, 5))
    );

    // Проверяем конфликт с новым временем
    if (existingTimes.has(time)) {
      throw new Error(`Конфликт времени: ${time}`);
    }

    const bookingDateTime = `${bookingDate} ${time}:00`;

    // Обновляем запись
    await client.query(
      `UPDATE schedule
       SET lawyer_id = $1,
           booking_date = $2
       WHERE schedule_id = $3`,
      [lawyer_id, bookingDateTime, schedule_id]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function createService({ service_name, service_price, admin_id }) {
  const query = `
    INSERT INTO services (admin_id, service_name, service_price)
    VALUES ($1, $2, $3);
  `;
  const values = [admin_id, service_name, service_price];

  try {
    await pool.query(query, values);
  } catch (err) {
    console.error('Ошибка при добавлении услуги:', err);
    throw err;
  }
};

async function deleteService(id) {
  await pool.query('DELETE FROM services WHERE service_id = $1', [id]);
}

async function updateService(service_id, service_name, service_price) {
  await pool.query(
    'UPDATE services SET service_name = $1, service_price = $2 WHERE service_id = $3',
    [service_name, service_price, service_id]
  );
}

async function getAllNews() {
  const query = `
    SELECT 
      news_id,
      admin_id,
      title_news, 
      description_news, 
      image_news, 
      TO_CHAR(create_date, 'YYYY-MM-DD') AS create_date
    FROM news
    ORDER BY create_date DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

async function addNews({ admin_id, title_news, description_news, create_date, image_news }) {
    const query = `
        INSERT INTO news (admin_id, title_news, description_news, create_date, image_news)
        VALUES ($1, $2, $3, $4, $5)
    `;
    const values = [admin_id, title_news, description_news, create_date, image_news];
    await pool.query(query, values);
};

async function deleteNews (newsId) {
  const query = 'DELETE FROM news WHERE news_id = $1';
  await pool.query(query, [newsId]);
};

async function getAllReviews () {
  const query = `SELECT * FROM reviews ORDER BY review_id DESC`;
  const { rows } = await pool.query(query);
  return rows;
};

async function insertReview ({ admin_id, review_image, title, description }) {
  const query = `
    INSERT INTO reviews (admin_id, image_review, title_review, description_review)
    VALUES ($1, $2, $3, $4)
  `;
  await pool.query(query, [admin_id, review_image, title, description]);
};

async function deleteReviewById(reviewId) {
  const query = 'DELETE FROM reviews WHERE review_id = $1';
  const values = [reviewId];

  await pool.query(query, values);
}

async function getAllLawyersAdmin() {
  const query = 'SELECT * FROM lawyers';
  const result = await pool.query(query);
  return result.rows;
}

async function getAllSpecializationsAdmin() {
  const query = 'SELECT * FROM legal_specialization';
  const result = await pool.query(query);
  return result.rows;
}

async function getSpecializationsForLawyers() {
  const query = `
    SELECT 
      ls.specialization_name,
      ls.ls_id,
      ls.ls_id,
      ls.specialization_description,
      ls.specialization_name,
      ls.specialization_description,
      ls.ls_id,
      ls.specialization_name,
      ls.specialization_description,
      lsp.lawyer_id
    FROM 
      lawyer_specialization lsp
    JOIN 
      legal_specialization ls ON lsp.ls_id = ls.ls_id
  `;

  try {
    const result = await pool.query(query);
    
    // Сгруппируем специализации по lawyer_id
    const specMap = {};
    result.rows.forEach(row => {
      if (!specMap[row.lawyer_id]) {
        specMap[row.lawyer_id] = [];
      }
      specMap[row.lawyer_id].push(row.specialization_name);
    });

    return specMap;
  } catch (error) {
    console.error('Ошибка при получении специализаций адвокатов:', error);
    throw error;
  }
};

async function checkLawyerExists (name, email, imagePath) {
  const query = `
    SELECT * FROM lawyers
    WHERE lawyer_name = $1 OR lawyer_email = $2 OR lawyer_image = $3
  `;
  const values = [name, email, imagePath];

  try {
    const result = await pool.query(query, values);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Ошибка при проверке адвоката:', error);
    throw error;
  }
};

async function insertLawyer (lawyer) {
  const query = `
    INSERT INTO lawyers (
      admin_id,
      lawyer_image,
      lawyer_name,
      lawyer_title,
      lawyer_description,
      lawyer_experience,
      lawyer_email
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING lawyer_id
  `;

  const values = [
    lawyer.admin_id,
    lawyer.lawyer_image,
    lawyer.lawyer_name,
    lawyer.lawyer_title,
    lawyer.lawyer_description,
    lawyer.lawyer_experience,
    lawyer.lawyer_email
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0].lawyer_id;
  } catch (error) {
    console.error('Ошибка при добавлении адвоката:', error);
    throw error;
  }
};


async function insertLawyerSpecializations (lawyerId, specializations) {
  const query = `
    INSERT INTO lawyer_specialization (lawyer_id, ls_id)
    VALUES ($1, $2)
  `;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const specId of specializations) {
      await client.query(query, [lawyerId, specId]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Ошибка при добавлении специализаций:', error);
    throw error;
  } finally {
    client.release();
  }
};

async function deleteLawyerSpecializations (lawyer_id) {
  const query = 'DELETE FROM lawyer_specialization WHERE lawyer_id = $1';
  try {
    await pool.query(query, [lawyer_id]);
  } catch (error) {
    console.error('Ошибка при удалении специализаций адвоката:', error);
    throw error;
  }
};

async function deleteLawyerById (lawyer_id) {
  const query = 'DELETE FROM lawyers WHERE lawyer_id = $1';
  try {
    await pool.query(query, [lawyer_id]);
  } catch (error) {
    console.error('Ошибка при удалении адвоката:', error);
    throw error;
  }
};


module.exports = {
  getSixNews, getFiveReviews, getTenLawyers, getNewsPage, getTotalNewsCount, getNewsById,
  getLegalSpecializations, getLawyersBySpecialization, getScheduleByLawyer, getAllLawyers, getLawyerById,
  getAllServices, getAllLegalSpecializations, findAdminByLogin, findAdminById, createAdmin, getAllBookings, getBookingInfoById,
  deleteBookingById, setScheduleStatus, getAllSchedulesWithLawyers, getAllSpecializations, addScheduleMultipleTimes,
  getLawyersForAdmin, getLawyersForFilter, getSchedules, deleteScheduleById, updateScheduleById,
  createService, deleteService, updateService,
  getAllNews, addNews, deleteNews,
  getAllReviews, insertReview, deleteReviewById,
  getAllLawyersAdmin, getAllSpecializationsAdmin, getSpecializationsForLawyers, checkLawyerExists, insertLawyer,
  insertLawyerSpecializations, deleteLawyerById, deleteLawyerSpecializations

};
