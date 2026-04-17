const express = require("express");
const router = express.Router();

const dashboard = require(`${__dirname}/../controllers/dashboard`);
const authMiddleware = require(`${__dirname}/../middlewares/authMiddleware`);
const authorizationMiddleware = require(`${__dirname}/../middlewares/authorization`);

// protected routes
router.use(authMiddleware.protected);
router.use(authorizationMiddleware.role('superadmin', 'manager')); 

router.get("/",dashboard.getDashboard )

module.exports = router;