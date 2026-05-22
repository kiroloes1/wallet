const express = require('express');
require('dotenv').config()
const app = express();
const path = require("path");
const cookieParser = require('cookie-parser');
app.use(cookieParser());
app.set('trust proxy', true);
const cors =require('cors')
const bodyParser = require('body-parser');
app.use(cors({
  origin: true,
  credentials: true
}));


const config=require(`${__dirname}/config/configDB`);
const userRoute=require(`${__dirname}/routes/userRoute`);
const walletRoute=require(`${__dirname}/routes/walletRoute`);
const transactionRoute=require(`${__dirname}/routes/transactionRoute`);
const adminRoute=require(`${__dirname}/routes/adminRoute`);
const dashboard=require(`${__dirname}/routes/reports`);
const backup=require(`${__dirname}/routes/backup`);

config.connectDB("mongodb+srv://kerosystem12_db_user:Rf3Ee22PGTcWTJse@wallet.hmgg7hy.mongodb.net/walletDB?retryWrites=true&w=majority");




app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



app.use('/v1/users',userRoute);
app.use('/v1/admins',adminRoute);
app.use('/v1/wallet',walletRoute);
app.use('/v1/transaction',transactionRoute);
app.use('/v1/dashboard',dashboard);
app.use('/v1/backup',backup);


// const Wallet = require("./models/wellet");
// const Transaction = require("./models/transactions");

// const wallets = [
//   {
//     walletName: "Vodafone Wallet Ahmed",
//     phoneNumber: "01012345678",
//     walletProvider: "Vodafone",
//     ownerName: "Ahmed Ali",
//     Limit: 5000,
//     balance: 2000
//   },
//   {
//     walletName: "Orange Wallet Sara",
//     phoneNumber: "01298765432",
//     walletProvider: "Orange",
//     ownerName: "Sara Mohamed",
//     Limit: 8000,
//     balance: 3000
//   },
//   {
//     walletName: "Etisalat Wallet Omar",
//     phoneNumber: "01155667788",
//     walletProvider: "Etisalat",
//     ownerName: "Omar Hassan",
//     Limit: 10000,
//     balance: 5000
//   },
//   {
//     walletName: "WE Wallet Lina",
//     phoneNumber: "01511223344",
//     walletProvider: "We",
//     ownerName: "Lina Adel",
//     Limit: 6000,
//     balance: 1500
//   },
//   {
//     walletName: "Vodafone Wallet Tamer",
//     phoneNumber: "01099887766",
//     walletProvider: "Vodafone",
//     ownerName: "Tamer Saeed",
//     Limit: 7000,
//     balance: 2500
//   }
// ];
// const transactions = [
//   {
//     walletPhone: "01012345678",
//     senderName: "Ahmed Ali",
//     receiverName: "Sara Mohamed",
//     senderPhone: "01012345678",
//     receiverPhone: "01298765432",
//     type: "send",
//     amount: 500,
//     notes: "Rent payment",
//     isInternalTransfer: true,
//     createdAt: new Date("2026-01-02")
//   },

//   {
//     walletPhone: "01298765432",
//     senderName: "Ahmed Ali",
//     receiverName: "Sara Mohamed",
//     senderPhone: "01012345678",
//     receiverPhone: "01298765432",
//     type: "receive",
//     amount: 500,
//     notes: "Rent payment",
//     isInternalTransfer: true,
//     createdAt: new Date("2026-01-02")
//   },

//   {
//     walletPhone: "01155667788",
//     senderName: "Omar Hassan",
//     receiverName: "Lina Adel",
//     senderPhone: "01155667788",
//     receiverPhone: "01511223344",
//     type: "send",
//     amount: 1200,
//     notes: "Loan",
//     isInternalTransfer: true,
//     createdAt: new Date("2026-01-05")
//   },

//   {
//     walletPhone: "01511223344",
//     senderName: "Omar Hassan",
//     receiverName: "Lina Adel",
//     senderPhone: "01155667788",
//     receiverPhone: "01511223344",
//     type: "receive",
//     amount: 1200,
//     notes: "Loan",
//     isInternalTransfer: true,
//     createdAt: new Date("2026-01-05")
//   },

//   {
//     walletPhone: "01099887766",
//     senderName: "Tamer Saeed",
//     receiverName: "Ahmed Ali",
//     senderPhone: "01099887766",
//     receiverPhone: "01012345678",
//     type: "send",
//     amount: 300,
//     notes: "Coffee payment",
//     isInternalTransfer: true,
//     createdAt: new Date("2026-01-10")
//   },

//   {
//     walletPhone: "01012345678",
//     senderName: "Tamer Saeed",
//     receiverName: "Ahmed Ali",
//     senderPhone: "01099887766",
//     receiverPhone: "01012345678",
//     type: "receive",
//     amount: 300,
//     notes: "Coffee payment",
//     isInternalTransfer: true,
//     createdAt: new Date("2026-01-10")
//   },

//   {
//     walletPhone: "01298765432",
//     senderName: "Sara Mohamed",
//     receiverName: "Omar Hassan",
//     senderPhone: "01298765432",
//     receiverPhone: "01155667788",
//     type: "send",
//     amount: 800,
//     notes: "Shopping",
//     isInternalTransfer: true,
//     createdAt: new Date("2026-01-15")
//   }
// ];
// async function seed() {
//   await Wallet.deleteMany({});
//   await Transaction.deleteMany({});

//   const createdWallets = await Wallet.insertMany(wallets);

//   const walletMap = {};
//   createdWallets.forEach(w => {
//     walletMap[w.phoneNumber] = w._id;
//   });

//   const txs = transactions.map(tx => ({
//     walletId: walletMap[tx.walletPhone],
//     senderName: tx.senderName,
//     receiverName: tx.receiverName,
//     senderPhone: tx.senderPhone,
//     receiverPhone: tx.receiverPhone,
//     type: tx.type,
//     amount: tx.amount,
//     notes: tx.notes,
//     isInternalTransfer: tx.isInternalTransfer,
//     createdAt: tx.createdAt
//   }));

//   await Transaction.insertMany(txs);

//   console.log("🔥 Seed completed successfully");
//   process.exit();
// }

// seed();





const PORT=process.env.PORT || 5000;
app.listen(PORT,()=>{
    console.log(`Server is running on port ${PORT}`);
})
