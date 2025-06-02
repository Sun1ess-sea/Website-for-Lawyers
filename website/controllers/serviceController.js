const db = require('../database/dbRequests');

exports.getServicesPage = async (req, res) => {
  try {
    const services = await db.getAllServices();
    res.render('services', { services });
  } catch (error) {
    console.error('Ошибка при получении списка услуг:', error);
    res.status(500).send('Ошибка сервера');
  }
};

exports.showAboutServicesPage = async (req, res) => {
  try {
    const specializations = await db.getAllLegalSpecializations();
    res.render('about-services', { specializations });
  } catch (error) {
    console.error('Ошибка при загрузке специализаций:', error);
    res.status(500).send('Ошибка сервера');
  }
};
