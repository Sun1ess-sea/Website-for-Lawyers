const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { uploadNewsPhoto, uploadReviewPhotos, uploadLawyerPhotos } = require('../middleware/multer');


const setIsAdminPage = (req, res, next) => {
  res.locals.isAdminPage = true;
  next();
};

router.use(setIsAdminPage);

router.get('/login', adminController.renderLoginPage);
router.post('/login', adminController.loginAdmin);
router.get('/admin-panel', isAuthenticated, adminController.profile);
router.get('/logout', adminController.logoutAdmin);

router.get('/add-admin', isAuthenticated, adminController.showAddAdminPage);
router.post('/add-admin', isAuthenticated, adminController.addAdmin);

router.get('/moderating-bookings', isAuthenticated, adminController.getBookings);
router.post('/bookings/delete/:booking_id', isAuthenticated, adminController.deleteBooking);

router.get('/moder-schedule', isAuthenticated, adminController.showSchedulePage);
router.get('/specializations', isAuthenticated, adminController.getSpecializations);
router.get('/lawyers/by-specialization/:ls_id', isAuthenticated, adminController.getLawyersBySpec);
router.post('/moder-schedule/add', adminController.addSchedule);
router.get('/lawyers', isAuthenticated, adminController.getLawyersForFilter);
router.get('/schedules', isAuthenticated, adminController.getSchedulesWithFilter);
router.delete('/schedules/:id', isAuthenticated, adminController.deleteSchedule);
router.post('/moder-schedule/edit', isAuthenticated, adminController.editSchedule);

router.get('/content', isAuthenticated, adminController.adminContentPanel);

router.get('/admin-services', isAuthenticated, adminController.showAdminServicePage);
router.post('/admin-services', isAuthenticated, adminController.createService);
router.get('/admin-services/edit/:service_id', isAuthenticated, adminController.showEditServicePage);
router.post('/update-service/:service_id', isAuthenticated, adminController.updateService);
router.post('/delete-service/:service_id', isAuthenticated, adminController.deleteService);

router.get('/admin-news', isAuthenticated, adminController.showNewsPage);
router.post('/add-news', isAuthenticated, uploadNewsPhoto.single('photo'), adminController.postAddNews);
router.post('/delete-news/:news_id', isAuthenticated, adminController.postDeleteNews);

router.get('/admin-reviews', isAuthenticated, adminController.showAdminReviews);
router.post('/add-review', isAuthenticated, uploadReviewPhotos.single('photo'), adminController.addReview);
router.post('/delete-review/:review_id', isAuthenticated, adminController.postDeleteReview);

router.get('/admin-lawyers', isAuthenticated, adminController.showAdminLawyers);
router.post('/add-lawyer', isAuthenticated, uploadLawyerPhotos.single('lawyer_image'), adminController.addLawyer);
router.post('/delete-lawyer/:lawyer_id', adminController.deleteLawyer);

module.exports = router;