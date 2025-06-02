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
    const testAccount = await nodemailer.createTestAccount();

    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const mailOptions = {
      from: '"ПЕРСПЕКТИВА" <no-reply@example.com>',
      to: 'corp@example.com',
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
    console.log('Письмо отправлено. Просмотр по ссылке: %s', nodemailer.getTestMessageUrl(info));

    res.json({ status: 'success', message: 'Ваше обращение получено. Мы свяжемся с вами в ближайшее время.' });
  } catch (error) {
    console.error('Ошибка при отправке письма:', error);
    res.status(500).json({ status: 'error', message: 'Произошла ошибка при отправке. Попробуйте позже.' });
  }
};

