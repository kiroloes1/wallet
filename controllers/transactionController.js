const transactionModel=require(`${__dirname}/../models/transactions`);
const WalletModel=require(`${__dirname}/../models/wellet`);
const mongoose=require('mongoose')

// create transaction
// create transaction
exports.createTransactions = async (req, res) => {
           const session = await mongoose.startSession();
    try {
  
         session.startTransaction();
        const {
            senderName,
            receiverName,
            senderPhone,
            receiverPhone,
            type,
            notes,
            amount,
            walletId
        } = req.body;

        // 1. Validation
        if (!type || !amount || !walletId) {
             throw new Error(
                "يجب ملئ جميع الحقول المطلوبه"
            );
        }

        if (amount <= 0) {
             throw new Error(
                 "المبلغ لازم يكون أكبر من صفر"
            );
        }

        if(senderPhone==receiverPhone){
             throw new Error(
             "لا يمكن اجراء تحويل ذاتي "
            );
        }

        // 2. Get walletA (target)
        const walletA = await WalletModel.findById(walletId).session(session);

        if (!walletA) {
             throw new Error(
                 "هذه المحفظة غير موجوده"
            );
        }

     if (checkMonthlyReset(walletA)) {
            await walletA.save({ session });
        }

     if (walletA.status !== "active") {
             throw new Error(
             "هذه المحفظة غير نشظه"
            );
        }
        let isInvalid = false;

        if (walletA) {
        
            if (type === "send" && walletA.phoneNumber !== senderPhone) {
                isInvalid = true;
            }

            
            if (type === "receive" && walletA.phoneNumber !== receiverPhone) {
                isInvalid = true;
            }
        }

        if (isInvalid) {
             throw new Error(
              "رقم المحفظة لا يطابق نوع العملية"
            );
        }



        // 3. Find walletB (optional)
        let walletB = null;

        if (type === "send") {
            walletB = await WalletModel.findOne({ phoneNumber: receiverPhone }).session(session);
        } else if (type === "receive") {
            walletB = await WalletModel.findOne({ phoneNumber: senderPhone }).session(session);
        }
        if (walletB) {
                 if (checkMonthlyReset(walletB)) {
                await walletB.save({ session });
            }
        }

                        // B affected SAME TYPE LOGIC (mirrored operation)
       if (walletB && walletB.status !== "active") {
             throw new Error(
            "المحفظه غير نشطه" + walletB.walletName
            );
        }

        const isInternalTransfer = Boolean(walletB);

        // 4. VALIDATION (only on A)
        if (walletA.balance < amount && type=="send") {
             throw new Error( "رصيد هذه المحفظه غير كافي "
          );
        }

        if (type === "send" && ((walletA.balance - amount < 0) ) ){
             throw new Error( "رصيد هذه المحفظه غير كافي "
            );
        }


        
        if (type === "send" && ( (walletA.monthlyOutgoing + amount) )> walletA.Limit) {
             throw new Error( "هذه العمليه ستجعل المحفظه تتخطي limit  فلا يمكن تنفيذها"
            );
        }


        if ( ( (walletA.balance + amount ) > walletA.Limit ||  (walletA.monthlyIncoming + amount ) > walletA.Limit ) && type === "receive") {
             throw new Error(
            "هذه العمليه ستجعل المحفظه تتخطي limit  فلا يمكن تنفيذها"
            );
        }


        // 5. APPLY SAME LOGIC TO A AND B (IMPORTANT PART)

        const apply = (wallet, sign) => {
            if (!wallet) return;

            wallet.balance += sign * amount;

            if (sign === 1) {
                wallet.totalIncoming += amount;
                wallet.monthlyIncoming += amount;
            } else {
                wallet.totalOutgoing += amount;
                wallet.monthlyOutgoing += amount;
            }
        };

     


        if (walletB && type === "send") {
        if (((walletB.balance + amount) > walletB.Limit) || ((walletB.monthlyIncoming + amount) > walletB.Limit)) {
             throw new Error(
              "المستلم لايمكن ان يستقبل هذه المبلغ لانه سوف يتعدي الlimit " + walletB.walletName
            );
        }
    }else if (walletB && type === "receive") {
        if (((walletB.balance - amount) < 0) || ((walletB.monthlyOutgoing + amount) > walletB.Limit)) {
             throw new Error(
                "المستلم لايمكن ان يرسل هذه المبلغ لانه سوف يتعدي الlimit " + walletB.walletName
            );
        }

    }
    

        // A always affected
        const directionA = type === "send" ? -1 : 1;
        apply(walletA, directionA);



        if (walletB) {
            const directionB = directionA * -1;
            apply(walletB, directionB);
        }

        // ===== SAVE =====
        await walletA.save({ session });
        if (walletB) await walletB.save({ session });


        // ===== TRANSACTION RECORD =====
        const transaction = await transactionModel.create([{
            walletId,
            senderName,
            receiverName,
            senderPhone,
            receiverPhone,
            type,
            notes,
            amount,
            isInternalTransfer
        }], { session });

        
                // ===== COMMIT =====
        await session.commitTransaction();
        session.endSession();


        return res.status(201).json({
            message: "تم العمليه بنجاح" ,
            transaction
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        return res.status(400).json({
            message: err.message,
             stack: err.stack
        });
    }
};
// update transaction
exports.updateTransactions = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            senderName, receiverName, senderPhone, receiverPhone,
            type, notes, amount, walletId
        } = req.body;

        const oldTx = await transactionModel.findById(id);
        if (!oldTx) {
            return res.status(404).json({ message: "هذه العمليه غير موجوده" });
        }

       
        const oldWalletA = await WalletModel.findById(oldTx.walletId);
        let oldWalletB = null;
        if (oldTx.isInternalTransfer) {
            const phoneB = oldTx.type === "send" ? oldTx.receiverPhone : oldTx.senderPhone;
            oldWalletB = await WalletModel.findOne({ phoneNumber: phoneB });
        }

        const undo = (wallet, txType, txAmount, isWalletA) => {
            if (!wallet) return;
            
            const factor = (txType === "send") ? (isWalletA ? 1 : -1) : (isWalletA ? -1 : 1);
            wallet.balance += (txAmount * factor);
            
            if (factor === 1) {
                wallet.totalOutgoing -= txAmount;
                wallet.monthlyOutgoing -= txAmount;
            } else {
                wallet.totalIncoming -= txAmount;
                wallet.monthlyIncoming -= txAmount;
            }
        };




        if (!type || !amount || !walletId) {
            return res.status(400).json({ message: "يجب ملئ جميع الحقول المطلوبه" });
        }
        if (senderPhone === receiverPhone) {
            return res.status(400).json({ message: "لا يمكن اجراء تحويل ذاتي" });
        }


        const newWalletA = await WalletModel.findById(walletId);
        if (!newWalletA || newWalletA.status !== "active") {
            return res.status(400).json({  message: " هذه المحفظة غير نشظه او غير موجوده" });
        }


        let isInvalid = false;
        if (type === "send" && newWalletA.phoneNumber !== senderPhone) isInvalid = true;
        if (type === "receive" && newWalletA.phoneNumber !== receiverPhone) isInvalid = true;
        if (isInvalid) {
            return res.status(400).json({ message: "رقم المحفظة لا يطابق نوع العملية" });
        }

        if (type === "send" && newWalletA.balance < amount) {
            return res.status(400).json({ message: "رصيد هذه المحفظه غير كافي " });
        }
        if (type === "receive" && ((newWalletA.balance + amount )> newWalletA.Limit)) {
            return res.status(400).json({ message: "هذه العمليه ستجعل المحفظه تتخطي limit  فلا يمكن تنفيذها" });
        }


        
        if (oldWalletA) undo(oldWalletA, oldTx.type, oldTx.amount, true);
        if (oldWalletB) undo(oldWalletB, oldTx.type, oldTx.amount, false);


        if (oldWalletA) await oldWalletA.save();
        if (oldWalletB) await oldWalletB.save();



        let newWalletB = null;
        const phoneForB = (type === "send") ? receiverPhone : senderPhone;
        newWalletB = await WalletModel.findOne({ phoneNumber: phoneForB });

        const apply = (wallet, txType, txAmount, isWalletA) => {
            if (!wallet) return;
            const factor = (txType === "send") ? (isWalletA ? -1 : 1) : (isWalletA ? 1 : -1);
            wallet.balance += (txAmount * factor);
            
            if (factor === 1) {
                wallet.totalIncoming += txAmount;
                wallet.monthlyIncoming += txAmount;
            } else {
                wallet.totalOutgoing += txAmount;
                wallet.monthlyOutgoing += txAmount;
            }
        };

        apply(newWalletA, type, amount, true);
        if (newWalletB) apply(newWalletB, type, amount, false);

       
        await newWalletA.save();
        if (newWalletB) await newWalletB.save();

        
        const updatedTx = await transactionModel.findByIdAndUpdate(
            id,
            {
                senderName, receiverName, senderPhone, receiverPhone,
                type, notes, amount, walletId,
                isInternalTransfer: !!newWalletB
            },
            { new: true }
        );

        return res.status(200).json({
            message: "تم تحديث العمليه بنجاح",
            transaction: updatedTx
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// delte transaction
exports.deleteTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        // get a transaction
        const transaction = await transactionModel.findById(id);
        if (!transaction) {
            return res.status(404).json({ message: "المعاملة غير موجودة" });
        }

        // find target wallet A
        const walletA = await WalletModel.findById(transaction.walletId);
        let walletB = null;

        if (transaction.isInternalTransfer) {
            const phoneB = transaction.type === "send" 
                ? transaction.receiverPhone 
                : transaction.senderPhone;
            walletB = await WalletModel.findOne({ phoneNumber: phoneB });
        }

       
        const undoEffect = (wallet, txType, txAmount, isWalletA) => {
            if (!wallet) return;
            
       
            const factor = (txType === "send") ? (isWalletA ? 1 : -1) : (isWalletA ? -1 : 1);
            
            wallet.balance += (txAmount * factor);
            
            if (factor === 1) { 
                wallet.totalOutgoing -= txAmount;
                wallet.monthlyOutgoing -= txAmount;
            } else { 
                wallet.totalIncoming -= txAmount;
                wallet.monthlyIncoming -= txAmount;
            }
        };


        if (walletA) undoEffect(walletA, transaction.type, transaction.amount, true);
        if (walletB) undoEffect(walletB, transaction.type, transaction.amount, false);


        if (walletA) await walletA.save();
        if (walletB) await walletB.save();


        await transactionModel.findByIdAndDelete(id);

        return res.status(200).json({
            message: "تم مسح المعاملة وإلغاء تأثيرها على الأرصدة بنجاح"
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// get all transaction
exports.getTransactions = async (req, res) => {
    try {
        const transactions = await transactionModel
            .find()
            .sort({ createdAt: -1 })
            .populate("walletId");

        return res.status(200).json({
            message: "تم جلب جميع العمليات ",
            count: transactions.length,
            transactions
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

// get by id 
 exports.getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await transactionModel
            .findById(id)
            .populate("walletId");

        if (!transaction) {
            return res.status(404).json({
                message: "العمليه غير موجوده"
            });
        }

        return res.status(200).json({
            message: "تم جلب العمليه بنجاح",
            transaction
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

// get all transaction to wallet 
 exports.getTransactionByWallet = async (req, res) => {
    try {
        const { phoneNumber } = req.params;

        const transaction = await transactionModel
            .find({$or :[{senderPhone:phoneNumber},{receiverPhone:phoneNumber}]})
            .populate("walletId");

        if (!transaction) {
            return res.status(404).json({
                message: "العمليه غير موجوده"
            });
        }

        return res.status(200).json({
            message: "تم جلب العمليات بنجاح",
            transaction
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

// get transaction monthly

exports.getCurrentMonthTransactions = async (req, res) => {
    try {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const transactions = await transactionModel.find({
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        })
        .populate("walletId", "walletName ownerName phoneNumber balance")
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: "All monthly transactions fetched successfully",
            count: transactions.length,
            data: transactions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching monthly transactions",
            error: error.message
        });
    }
};



const checkMonthlyReset = (wallet) => {
    const now = new Date();
    const last = new Date(wallet.lastReset);

    if (
        now.getMonth() !== last.getMonth() ||
        now.getFullYear() !== last.getFullYear()
    ) {
        wallet.monthlyIncoming = 0;
        wallet.monthlyOutgoing = 0;
        wallet.lastReset = now;
    }
};
