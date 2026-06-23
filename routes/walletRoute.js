const express = require(`express`);
const router=express.Router();
const authMiddleware = require(`${__dirname}/../middlewares/authMiddleware`);
const walletController = require(`${__dirname}/../controllers/welletController`);
const authorizationMiddleware = require(`${__dirname}/../middlewares/authorization`);


//  CRUD 

router.use(authMiddleware.protected)
router.use(authorizationMiddleware.role('superadmin', 'manager')); 
// Create Wallet
router.post("/",  walletController.createWallet);

//  Get All Wallets
router.get("/",  walletController.getAllWallets);

//  Get All Wallets sugg
router.get("/getSugg",  walletController.getAllWalletsSugg);

// wallet reach to 100% from limit
router.get("/getFullLimitWallets",  walletController.getFullLimitWallets);

// wallet Nearby to limit 
router.get("/getWarningWallets",  walletController.getWarningWallets);


//  Get Wallet By ID
router.get("/:id",  walletController.getWalletById);

//  Update Wallet
router.put("/:id",  walletController.updateWallet);

//  Delete Wallet
router.delete("/:id",  walletController.deleteWallet);


//Status 

//  Update Status 
router.patch("/:id/status",  walletController.updateWalletStatus);

//  Freeze Wallet
router.patch("/:id/freeze",  walletController.freezeWallet);

//  Unfreeze Wallet
router.patch("/:id/unfreeze",  walletController.unfreezeWallet);


module.exports = router;
