const express = require("express");
const router = express.Router();

const downloadBackup  = require(`${__dirname}/../services/createDB`);
const authMiddleware = require(`${__dirname}/../middlewares/authMiddleware`);
const authorizationMiddleware = require(`${__dirname}/../middlewares/authorization`);

// protected routes
router.use(authMiddleware.protected);
router.use(authorizationMiddleware.role('superadmin', 'manager')); 

router.get("/",downloadBackup .downloadBackup  )

module.exports = router;