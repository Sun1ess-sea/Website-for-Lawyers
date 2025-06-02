const db = require('../database/dbRequests');

exports.showLawyersPage = async (req, res) => {
  try {
    const lawyers = await db.getAllLawyers();
    res.render('lawyers', { lawyers });
  } catch (error) {
    console.error('Ошибка при загрузке страницы адвокатов:', error);
    res.status(500).send('Ошибка сервера');
  }
}

exports.getLawyerById = async (req, res) => {
  const lawyerId = req.params.id;
  try {
    const lawyer = await db.getLawyerById(lawyerId);
    if (!lawyer) {
      return res.status(404).send('Адвокат не найден');
    }

    res.render('single-lawyer', { lawyer });
  } catch (error) {
    console.error('Ошибка получения адвоката:', error);
    res.status(500).send('Ошибка сервера');
  }
}
