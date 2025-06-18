const dbRequests = require('../database/dbRequests');
const nodemailer = require('nodemailer');

exports.showHomePage = async (req, res) => {
    try {
        const news = await dbRequests.getSixNews();
        const reviews = await dbRequests.getFiveReviews();
        const lawyers = await dbRequests.getTenLawyers();
        res.render('home', { news, reviews, lawyers });
      } catch (error) {
        console.error('Ошибка при загрузке главной страницы:', error);
        res.status(500).send('Ошибка сервера');
    }
};

exports.submitQuestion = async (req, res) => {
  const { req_name, req_email, req_phone, req_message } = req.body;
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

    const mailOptions = {
      from: process.env.YANDEX_USER,
      to: process.env.YANDEX_USER,
      subject: 'Вопрос от клиента',
      html: `
        <h3>Вопрос от клиента</h3>
        <p><strong>Имя:</strong> ${req_name}</p>
        <p><strong>Email:</strong> ${req_email}</p>
        <p><strong>Телефон:</strong> ${req_phone}</p>
        <p><strong>Сообщение:</strong><br>${req_message}</p>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Письмо отправлено.');

    res.json({ status: 'success', message: 'Ваше обращение получено. Мы свяжемся с вами в ближайшее время.' });
  } catch (error) {
    console.error('Ошибка при отправке письма:', error);
    res.status(500).json({ status: 'error', message: 'Произошла ошибка при отправке. Попробуйте позже.' });
  }
};

