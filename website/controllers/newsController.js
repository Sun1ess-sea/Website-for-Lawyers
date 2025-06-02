const db = require('../database/dbRequests');

module.exports.showNewsPage = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 12;
  const offset = (page - 1) * limit;

  try {
    const newsList = await db.getNewsPage(page, limit);
    const totalNews = await db.getTotalNewsCount();

    const totalPages = Math.ceil(totalNews / limit);

    res.render('news', {
      news: newsList,
      currentPage: page,
      totalPages: totalPages
    });
  } catch (err) {
    console.error('Ошибка при загрузке страницы новостей:', err);
    res.status(500).send('Ошибка сервера');
  }
};

module.exports.showSingleNews = async (req, res) => {
  const { id } = req.params;

  try {
    const news = await db.getNewsById(id);

    if (!news) {
      return res.status(404).render('404', { message: 'Новость не найдена' });
    }

    res.render('single-news', { news });
  } catch (err) {
    console.error('Ошибка при загрузке новости:', err);
    res.status(500).send('Ошибка сервера');
  }
};
