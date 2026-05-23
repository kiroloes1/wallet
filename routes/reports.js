const express = require("express");
const router = express.Router();

const dashboard = require(`${__dirname}/../controllers/dashboard`);
const report = require(`${__dirname}/../controllers/reports`);

const authMiddleware = require(`${__dirname}/../middlewares/authMiddleware`);
const authorizationMiddleware = require(`${__dirname}/../middlewares/authorization`);

// protected routes
router.use(authMiddleware.protected);
router.use(authorizationMiddleware.role('superadmin', 'manager')); 

router.get("/",dashboard.getDashboard );
router.get("/getAllPeople",report.getAllPeople );
router.get("/getMerchantReport",report.getMerchantReport );




module.exports = router;
