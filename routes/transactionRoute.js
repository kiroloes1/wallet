const express = require(`express`);
const router=express.Router();
const authMiddleware = require(`${__dirname}/../middlewares/authMiddleware`);
const transactionController = require(`${__dirname}/../controllers/transactionController`);
const authorizationMiddleware = require(`${__dirname}/../middlewares/authorization`);


//  CRUD 
router.use(authMiddleware.protected);
router.use(authorizationMiddleware.role('superadmin', 'manager')); 

// Create Wallet
router.post("/",  transactionController.createTransactions);

router.put("/:id",  transactionController.updateTransactions);

router.get("/",  transactionController.getTransactions);

router.get("/getTransactionByWallet/:phoneNumber",  transactionController.getTransactionByWallet);
router.get("/getCurrentMonthTransactions",  transactionController.getCurrentMonthTransactions);



router.get("/:id",  transactionController.getTransactionById);

router.delete("/:id",transactionController.deleteTransaction)
module.exports = router;
