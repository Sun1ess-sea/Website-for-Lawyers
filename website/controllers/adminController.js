const passport = require('passport');
const db = require('../database/dbRequests');
const pool = require('../database/db');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

exports.renderLoginPage = (req, res) => {
    res.render('admin/login', { message: req.flash('error') });
};

exports.loginAdmin = passport.authenticate('local', {
    successRedirect: '/admin/admin-panel',
    failureRedirect: '/admin/login',
    failureFlash: true
});

exports.profile = async (req, res) => {
    res.render('admin/admin-panel', { admin: req.user });
};

exports.logoutAdmin = (req, res) => {
    req.logout(() => {
        res.redirect('/admin/login');
    });
};

exports.getBookings = async (req, res) => {
  try {
    const bookings = await db.getAllBookings();
    res.render('admin/moderating-bookings', { bookings });
  } catch (error) {
    console.error('Ошибка при получении подтвержденных бронирований:', error);
    res.status(500).send('Ошибка сервера');
  }
};

exports.deleteBooking = async (req, res) => {
  const booking_id = req.params.booking_id;

  try {
    const booking = await db.getBookingInfoById(booking_id);

    if (!booking) {
      return res.status(404).send('Бронирование не найдено');
    }

    const { client_email, client_name, schedule_id, booking_date, lawyer_name } = booking;

    await db.deleteBookingById(booking_id);
    await db.setScheduleStatus(schedule_id, false);

    res.redirect('/admin/moderating-bookings');

    // Асинхронная отправка письма
    setImmediate(async () => {
      try {
        const transporter = nodemailer.createTransport({
          host: 'smtp.yandex.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.YANDEX_USER,
            pass: process.env.YANDEX_PASS,
          },
        });

        const htmlContent = `
          <h3>Консультация отменена</h3>
          <p><strong>Клиент:</strong> ${client_name}</p>
          <p>К сожалению, ваша запись к адвокату <strong>${lawyer_name}</strong> 
          на <strong>${new Date(booking_date).toLocaleString("ru-RU")}</strong> была отменена по техническим причинам.</p>
          <p>Пожалуйста, свяжитесь с нами для повторной записи через данную почту или телефон для связи 8(951)738-46-24.</p>
        `;

          const info = await transporter.sendMail({
          from: `"ПЕРСПЕКТИВА" <${process.env.YANDEX_USER}>`,
          to: client_email,
          subject: 'Отмена записи на консультацию',
          html: htmlContent,
        });

      } catch (mailErr) {
        console.error('Ошибка при отправке письма об отмене:', mailErr);
      }
    });

  } catch (err) {
    console.error('Ошибка при удалении брони:', err);
    res.status(500).send('Ошибка сервера');
  }
};

exports.showSchedulePage = async (req, res) => {
  try {
    const schedules = await db.getAllSchedulesWithLawyers();
    res.render('admin/moder-schedule', { schedules });
  } catch (error) {
    console.error('Ошибка при загрузке расписаний:', error);
    res.status(500).send('Ошибка сервера');
  }
};

exports.getSpecializations = async (req, res) => {
  try {
    const specs = await db.getAllSpecializations();
    res.json(specs);
  } catch (error) {
    console.error('Ошибка при получении специализаций:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.getLawyersBySpec = async (req, res) => {
  try {
    const ls_id = req.params.ls_id;
    const lawyers = await db.getLawyersBySpecialization(ls_id);
    res.json(lawyers);
  } catch (error) {
    console.error('Ошибка при получении адвокатов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.addSchedule = async (req, res) => {
  try {
    let { lawyer_id, bookingDate, times } = req.body;
    const admin_id = req.user?.admin_id;

    if (typeof times === 'string') {
      times = [times];
    }

    if (!lawyer_id || !admin_id || !bookingDate || !Array.isArray(times) || times.length === 0) {
      return res.render('admin/moder-schedule', {
        errorMessage: 'Не все обязательные поля заполнены',
        lawyer_id, bookingDate, times
      });
    }

    const hasDuplicates = times.length !== new Set(times).size;
    if (hasDuplicates) {
      return res.render('admin/moder-schedule', {
        errorMessage: 'Время дублируется внутри формы',
        lawyer_id, bookingDate, times
      });
    }

    await db.addScheduleMultipleTimes(lawyer_id, admin_id, bookingDate, times);

    res.redirect('/admin/moder-schedule');
  } catch (error) {
    console.error('Ошибка при добавлении расписания:', error);
    res.render('admin/moder-schedule', {
      errorMessage: error.message,
      lawyer_id: req.body.lawyer_id,
      bookingDate: req.body.bookingDate,
      times: req.body.times
    });
  }
};

exports.getLawyers = async (req, res) => {
  try {
    const lawyers = await db.getLawyersForAdmin();
    res.json(lawyers);
  } catch (err) {
    console.error('Ошибка при получении адвокатов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
};

exports.getLawyersForFilter = async (req, res) => {
  try {
    const lawyers = await db.getLawyersForFilter();
    res.json({ lawyers });
  } catch (error) {
    console.error('Ошибка получения адвокатов:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

exports.getSchedulesWithFilter = async (req, res) => {
  try {
    const { lawyer_id, date_from, date_to } = req.query;
    const schedules = await db.getSchedules({ lawyer_id, date_from, date_to });
    res.json({ schedules });
  } catch (error) {
    console.error('Ошибка получения расписаний:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

exports.deleteSchedule = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await db.deleteScheduleById(id);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Расписание не найдено' });
    }

    res.status(200).json({ message: 'Удалено' });
  } catch (err) {
    console.error('Ошибка удаления:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
}

exports.editSchedule = async (req, res) => {
  try {
    let { schedule_id, lawyer_id, bookingDate, times } = req.body;

    // Получаем первое время из массива times
    const time = Array.isArray(times) ? times[0] : times;

    if (!schedule_id || !lawyer_id || !bookingDate || !time) {
      return res.render('admin/moder-schedule', {
        errorMessage: 'Нужно указать расписание, адвоката, дату и время',
        lawyer_id, bookingDate, time
      });
    }

    await db.updateScheduleById(schedule_id, lawyer_id, bookingDate, time);

    res.redirect('/admin/moder-schedule');
  } catch (error) {
    console.error('Ошибка при обновлении расписания:', error);
    res.render('admin/moder-schedule', {
      errorMessage: error.message,
      lawyer_id: req.body.lawyer_id,
      bookingDate: req.body.bookingDate,
      time: Array.isArray(req.body.times) ? req.body.times[0] : req.body.times
    });
  }
};

exports.adminContentPanel = (req, res) => {
  res.render('admin/admin-content');
};

exports.showAdminServicePage = async (req, res) => {
  try {
    const services = await db.getAllServices();
    res.render('admin/admin-services', { services });
  } catch (err) {
    res.status(500).send('Ошибка сервера');
  }
};

exports.createService = async (req, res) => {
  const { service_name, service_price } = req.body;
  const admin_id = req.user.admin_id;

  try {
    const services = await db.getAllServices();

    const existing = services.find(s => s.service_name.trim().toLowerCase() === service_name.trim().toLowerCase());

    if (existing) {
      return res.render('admin/admin-services', {
        services,
        errorMessage: 'Услуга с таким названием уже существует',
        oldInput: { service_name, service_price }
      });
    }

    await db.createService({ service_name, service_price, admin_id });
    res.redirect('/admin/admin-services');
  } catch (err) {
    console.error('Ошибка при создании услуги:', err);
    res.status(500).send('Ошибка сервера');
  }
};

exports.showEditServicePage = async (req, res) => {
  const serviceId = req.params.service_id;
  try {
    const services = await db.getAllServices();
    const query = `SELECT service_id, admin_id, service_name, service_price FROM services WHERE service_id = $1`;
    const result = await pool.query(query, [serviceId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Услуга не найдена');
    }

    const editService = result.rows[0];

    res.render('admin/admin-services', { services, editService });
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера');
  }
};

exports.updateService = async (req, res) => {
  const { service_id } = req.params;
  const { service_name, service_price } = req.body;
  try {
    const services = await db.getAllServices();
    const existing = services.find(s =>
      s.service_name.trim().toLowerCase() === service_name.trim().toLowerCase() &&
      s.service_id !== Number(service_id)
    );
    if (existing) {
      const editService = services.find(s => s.service_id === Number(service_id));
      return res.render('admin/admin-services', {
        services,
        editService,
        errorMessage: 'Услуга с таким названием уже существует'
      });
    }
    await db.updateService(service_id, service_name, service_price);
    res.redirect('/admin/admin-services');
  } catch (error) {
    console.error('Ошибка при обновлении услуги:', error);
    res.status(500).send('Ошибка сервера');
  }
};

exports.deleteService = async (req, res) => {
  const { service_id } = req.params;

  try {
    await db.deleteService(service_id);

    res.redirect('/admin/admin-services');
  } catch (error) {
    console.error('Ошибка при удалении услуги:', error);
    res.status(500).send('Ошибка сервера');
  }
};

exports.showNewsPage = async (req, res) => {
    try {
        const newsList = await db.getAllNews();
        res.render('admin/admin-news', { newsList });
    } catch (error) {
        console.error('Ошибка при получении новостей:', error);
        res.status(500).send('Ошибка сервера');
    }
};

exports.postAddNews = async (req, res) => {
    try {
        const admin_id = req.user.admin_id;
        const { title, description, bookingDate } = req.body;
        if (!req.file) {
            return res.status(400).send('Фотография обязательна');
        }

        const image_news = '/images/newsPhoto/' + req.file.originalname;

        await db.addNews({
            admin_id,
            title_news: title,
            description_news: description,
            create_date: bookingDate,
            image_news
        });

        res.redirect('/admin/admin-news');
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при добавлении новости');
    }
};

exports.showEditNewsPage = async (req, res) => {
  const newsId = req.params.news_id;

  try {
    const newsList = await db.getAllNews();
    const query = `SELECT * FROM news WHERE news_id = $1`;
    const result = await pool.query(query, [newsId]);
    if (result.rows.length === 0) {
      return res.status(404).send('Новость не найдена');
    }

    const editNews = result.rows[0];

    editNews.create_date = editNews.create_date.toISOString().split('T')[0];



    res.render('admin/admin-news', { newsList, editNews });
  } catch(error) {
    console.error(error);
    res.status(500).send('Ошибка сервера');
  }
};

exports.postDeleteNews = async (req, res) => {
  try {
    const newsId = req.params.news_id;
    await db.deleteNews(newsId);
    res.redirect('/admin/admin-news');
  } catch (err) {
    console.error('Ошибка при удалении новости:', err);
    res.status(500).send('Ошибка при удалении новости');
  }
};

exports.updateNews = async (req, res) => {
  const {news_id} = req.params;
  const {title, description, bookingDate} = req.body;

  try {
    const news = await db.getAllNews();
    const existing = news.find(s =>
      s.title_news.trim().toLowerCase() === title.trim().toLowerCase() &&
      s.description_news.trim().toLowerCase() === description.trim().toLowerCase() &&
      s.news_id !== Number(news_id)
    );

    if (existing) {
      const editNews = news.find(s => s.news_id === Number(news_id));
      return res.render('admin/admin-news', {
        news,
        editNews,
        errorMessage: "Новость с такими данными уже существует"
      });
    }

    const imageNews = '/images/newsPhoto/' + req.file.originalname;

    await db.updateNews(news_id, title, description, bookingDate, imageNews);
    res.redirect('/admin/admin-news');
  } catch(error) {
    console.error('Ошибка при обновлении новости:', news);
    res.status(500).send('Ошибка сервера');
  }
};

exports.showAdminReviews = async (req, res) => {
  try {
    const reviews = await db.getAllReviews();
    res.render('admin/admin-reviews', { reviews });
  } catch (error) {
    console.error('Ошибка при получении отзывов:', error);
    res.status(500).send('Ошибка при загрузке отзывов');
  }
};

exports.showEditReviewPage = async (req, res) => {
  const reviewId = req.params.review_id;

  try {
    const reviews = await db.getAllReviews();
    const query = `SELECT * FROM reviews WHERE review_id = $1`;
    const result = await pool.query(query, [reviewId]);

    if (result.rows.length === 0) {
      return res.status(404).send('Отзыв не найден');
    }

    const editReview = result.rows[0];

    res.render('admin/admin-reviews', { reviews, editReview });
  } catch(error) {
    console.error(error);
    res.status(500).send('Ошибка сервера');
  }
};

exports.updateReview = async (req, res) => {
  const {review_id} = req.params;
  const { title, description } = req.body;
  console.log(req.params);
  console.log(req.body);
  try {
    const reviews = await db.getAllReviews();
    const existing = reviews.find( s =>
      s.title_review.trim().toLowerCase() === title.trim().toLowerCase() &&
      s.description_review.trim().toLowerCase() === description.trim().toLowerCase() &&
      s.review_id !== Number(review_id));

      if (existing) {
        const editReview = reviews.find(s => s.review_id === Number(review_id));
        return res.render('admin/admin-reviews', {
          reviews,
          editReview,
          errorMessage: "Отзыв с такими данными уже существует"
        });
      }

      const imageReview = '/images/reviewPhoto/' + req.file.originalname;

      await db.updateReview(review_id, title, description, imageReview);

      res.redirect('/admin/admin-reviews');
  } catch(error) {
    console.error("Ошибка при обновлении отзыва:", error);
    res.status(500).send('Ошибка сервера');
  }
};

exports.addReview = async (req, res) => {
  try {
    const admin_id = req.user.admin_id; 
    const { title, description } = req.body;
    const review_image = `/images/reviewPhoto/${req.file.filename}`;
    await db.insertReview({ admin_id, review_image, title, description });
    res.redirect('/admin/admin-reviews');
  } catch (error) {
    console.error('Ошибка при добавлении отзыва:', error);
    res.status(500).send('Ошибка при добавлении отзыва');
  }
};

exports.postDeleteReview = async (req, res) => {
  const reviewId = req.params.review_id;
  try {
    await db.deleteReviewById(reviewId);
    res.redirect('/admin/admin-reviews');
  } catch (error) {
    console.error('Ошибка при удалении отзыва:', error);
    res.status(500).send('Ошибка сервера при удалении отзыва');
  }
};

exports.showAdminLawyers = async (req, res) => {
  try {
    const lawyers = await db.getAllLawyersAdmin();
    const specializationsMap = await db.getSpecializationsForLawyers(); // { lawyer_id: [специализации] }

    const enrichedLawyers = lawyers.map(lawyer => ({
      ...lawyer,
      specializations: (specializationsMap[lawyer.lawyer_id] || []).join(', ')
    }));

    const allSpecializations = await db.getAllSpecializationsAdmin();

    res.render('admin/admin-lawyers', {
      lawyers: enrichedLawyers,
      specializations: allSpecializations
    });
  } catch (error) {
    console.error('Ошибка при получении данных адвокатов:', error);
    res.status(500).send('Ошибка сервера');
  }
};

exports.addLawyer = async (req, res) => {
  try {
    const {
      lawyer_name,
      lawyer_title,
      lawyer_description,
      lawyer_experience,
      lawyer_email
    } = req.body;

    const specializations = Array.isArray(req.body.specializations)
      ? req.body.specializations
      : [req.body.specializations];

    const lawyer_image = req.file ? '/images/lawyerPhoto/' + req.file.originalname : null;

    const admin_id = req.user.admin_id;

    // Проверка на дубли
    const isDuplicate = await db.checkLawyerExists(lawyer_name, lawyer_email, lawyer_image);
    if (isDuplicate) {
      const lawyers = await db.getAllLawyersAdmin();
      const specializationsMap = await db.getSpecializationsForLawyers();

      const enrichedLawyers = lawyers.map(lawyer => ({
        ...lawyer,
        specializations: (specializationsMap[lawyer.lawyer_id] || []).join(', ')
      }));

      const allSpecializations = await db.getAllSpecializationsAdmin();

      return res.render('admin/admin-lawyers', {
        lawyers: enrichedLawyers,
        specializations: allSpecializations,
        errorMessage: 'Адвокат с таким именем, почтой или фотографией уже существует'
      });
    }

    // Добавление адвоката
    const newLawyerId = await db.insertLawyer({
      admin_id,
      lawyer_image,
      lawyer_name,
      lawyer_title,
      lawyer_description,
      lawyer_experience,
      lawyer_email
    });

    // Добавление специализаций
    if (specializations && newLawyerId) {
      await db.insertLawyerSpecializations(newLawyerId, specializations);
    }

    res.redirect('/admin/admin-lawyers');
  } catch (error) {
    console.error('Ошибка при добавлении адвоката:', error);
    res.status(500).send('Ошибка сервера');
  }
};


exports.deleteLawyer = async (req, res) => {
  const lawyerId = req.params.lawyer_id;

  try {
    // Сначала удалим специализации
    await db.deleteLawyerSpecializations(lawyerId);

    // Потом самого адвоката
    await db.deleteLawyerById(lawyerId);

    res.redirect('/admin/admin-lawyers');
  } catch (error) {
    console.error('Ошибка при удалении адвоката:', error);
    res.status(500).send('Ошибка при удалении адвоката');
  }
};


exports.showEditLawyerPage = async (req, res) => {
  const lawyerId = req.params.lawyer_id;

  try {
    const lawyers = await db.getAllLawyersAdmin();
    const specializationMap = await db.getSpecializationsForLawyers();
    const enrichedLawyers = lawyers.map(lawyer => ({
      ...lawyer,
      specializations: (specializationMap[lawyer.lawyer_id] || []).join(', ')
    }));

    const editLawyer = await db.getLawyerById(lawyerId);
    if (!editLawyer) {
      return res.status(404).send('Адвокат не найден');
    }

    res.render('admin/admin-lawyers', {
      lawyers: enrichedLawyers,
      editLawyer,
      specializations: await db.getAllSpecializationsAdmin()
    });
  } catch(error) {
    console.error('Ошибка при загрузке страницы редактирования:', error);
    res.status(500).send('Ошибка сервера');
  }
};


exports.updateLawyer = async (req, res) => {
  const lawyerId = req.params.lawyer_id;

  try {
    const { lawyer_name, lawyer_title, lawyer_description, lawyer_experience, lawyer_email } = req.body;
    const currentLawyer = await db.getLawyerById(lawyerId);
    if (!currentLawyer) {
      return res.status(404).send('Адвокат не найден');
    }

    const lawyer_image = req.file ? '/images/lawyerPhoto/' + req.file.originalname : currentLawyer.lawyer_image;

    const isDuplicate = await db.checkDuplicateForUpdateLawyer(lawyer_name, lawyer_email, lawyer_image, lawyerId);

    if (isDuplicate) {
      const [lawyers, specializations] = await Promise.all([
        db.getAllLawyersAdmin(),
        db.getAllSpecializationsAdmin()
      ]);

      const specializationMap = await db.getSpecializationsForLawyers();
      const enrichedLawyers = lawyers.map(lawyer => ({
        ...lawyer,
        specilaizations: (specializationMap[lawyer.lawyer_id] || []).join(', ')
      }));

      return res.render('admin/admin-lawyers', {
        lawyers: enrichedLawyers,
        specializations,
        editLawyer: {...req.body, lawyer_id: lawyerId, lawyer_image},
        errorMessage: 'Адвокат с таким именем, почтой или фотографией уже существует'
      });
    }

    await db.updateLawyerData(lawyerId, {
      lawyer_name, lawyer_title, lawyer_description,
      lawyer_experience, lawyer_email, lawyer_image
    });

    if (req.body.specializations) {
      const specializations = Array.isArray(req.body.specializations) ? req.body.specializations : [req.body.specializations];

      await db.deleteLawyerSpecializations(lawyerId);
      await db.insertLawyerSpecializations(lawyerId, specializations);
    }

    res.redirect('/admin/admin-lawyers');
  } catch(error) {
    console.error('Ошибка при обновлении адвоката:', error);
    res.status(500).send('Ошибка сервера');
  }
};