const express = require('express');
const router = express.Router();
const { protect, authorize, checkPermission } = require('../middleware/auth');
const ctrl = require('../controllers/adminController'); 

// 1. تأمين جميع الروابط للأدمن فقط
router.use(protect, authorize('admin'));

// 2. dashboard stats
router.get('/dashboard', ctrl.getDashboardStats);

// 3. user management
router.get('/users', checkPermission('manage_users'), ctrl.getUsers);
//4. promote/demote user role (admin, manager, customer)
router.put('/users/:id/role', checkPermission('manage_users'), ctrl.updateUserRole); 
//5. toggle user active/suspended status
router.put('/users/:id/toggle-status', checkPermission('manage_users'), ctrl.toggleUserStatus);
//6. change user password
router.put('/users/:id/password', checkPermission('manage_users'), ctrl.changeUserPassword);

// 7. settings management
router.put('/settings', checkPermission('manage_settings'), ctrl.updateSettings);
//8. financial ledger access
router.get('/logs', checkPermission('view_ledger'), ctrl.getSystemLogs); 
//9. financial reports access
router.get('/financials', checkPermission('view_analytics'), ctrl.getFinancialReports);
//10. delete user
router.delete('/users/:id', checkPermission('manage_users'), ctrl.deleteUser);

// 11. maintenance mode
router.put('/system/maintenance', checkPermission('manage_maintenance'), ctrl.toggleMaintenanceMode);

module.exports = router;