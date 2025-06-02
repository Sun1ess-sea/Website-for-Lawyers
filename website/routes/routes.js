const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const aboutController = require('../controllers/aboutController');
const bookingController = require('../controllers/bookingController');
const newsController = require('../controllers/newsController');
const lawyersController = require('../controllers/lawyersController');
const serviceController = require('../controllers/serviceController');

// Home page
router.get('/', homeController.showHomePage);
router.post('/submit', homeController.submitQuestion);

// About page
router.get('/about', aboutController.showAboutPage)

// Contacts page
router.get('/contacts', bookingController.showBookingPage);
router.get('/contacts/lawyers/:ls_id', bookingController.getLawyers);
router.get('/contacts/schedule/:lawyer_id', bookingController.getSchedule);
router.post('/contacts/create', bookingController.createBooking);

// News page
router.get('/news', newsController.showNewsPage);
router.get('/news/:id', newsController.showSingleNews);

// Lawyers page
router.get('/lawyers', lawyersController.showLawyersPage);
router.get('/lawyers/:id', lawyersController.getLawyerById);

// Service pages
router.get('/prices', serviceController.getServicesPage);
router.get('/about-services', serviceController.showAboutServicesPage);

module.exports = router;