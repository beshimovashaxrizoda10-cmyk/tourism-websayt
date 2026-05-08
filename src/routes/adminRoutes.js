const express = require('express');
const router = express.Router();
const { 
    adminLogin, getDashboardData, getUserFullDetails, 
    adminAdvancedSearch, getAdminBook, updateAdminBook, deleteEverything 
} = require('../controllers/adminController');
const { adminProtect } = require('../middlewares/adminAuth');

router.post('/login', adminLogin);

router.get('/dashboard', adminProtect, getDashboardData);
router.get('/users/:id', adminProtect, getUserFullDetails);
router.get('/search', adminProtect, adminAdvancedSearch);

// YANGLIK: Kitoblar uchun admin yo'llari
router.get('/books/:id', adminProtect, getAdminBook);
router.put('/books/:id', adminProtect, updateAdminBook);

router.delete('/delete/:type/:id', adminProtect, deleteEverything);

module.exports = router;