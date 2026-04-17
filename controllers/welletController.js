const walletModel=require(`${__dirname}/../models/wellet`);
const mongoose=require('mongoose')
// create wallet
exports.createWallet = async (req, res) => {
    try {
        const {
            walletName,
            phoneNumber,
            walletProvider,
            ownerName,
            Limit,
            status,
            balance   
        } = req.body;

        // validation
        if (!walletName || !phoneNumber|| !walletProvider || !ownerName || !Limit) {
            return res.status(400).json({
                message: "من فضلك يجب ملئ جميع الحقول المطلوبه !"
            });
        }
        if(Limit<balance){
               return res.status(400).json({
                message: "لا يمكن ان الرصيد الافتتاحي يتجازر ال limit ( الحد المسموح به)"
            });
        }

        const existWallet = await walletModel.findOne({ phoneNumber });

        if (existWallet) {
            return res.status(400).json({
                message: "هذا المحفظه مسجله بالفعل"
            });
        }

        const newWallet = await walletModel.create({
            walletName,
            phoneNumber,
            walletProvider,
            ownerName,
            Limit,
            status: status || "active",
            balance: balance || 0, 
            totalIncoming: balance || 0, 
            totalOutgoing: 0
        });

        return res.status(201).json({
            message: "تم إنشاء المحفظة بنجاح",
            newWallet
        });

    } catch (err) {
        return res.status(500).json({
            message: `خطأ أثناء إضافة المحفظة ${err.message}`
        });
    }
};


//  update wallet
exports.updateWallet = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID غير صالح"
            });
        }

        const updatedWallet = await walletModel.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedWallet) {
            return res.status(404).json({
                message: "المحفظة غير موجودة"
            });
        }

        res.status(200).json({
            message: "تم تعديل المحفظة بنجاح",
            updatedWallet
        });

    } catch (err) {
        res.status(500).json({
            message: `خطأ أثناء تعديل المحفظة: ${err.message}`
        });
    }
};

// delete wallet
exports.deleteWallet = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID غير صالح"
            });
        }
  
          
        const deletedWallet = await walletModel.findByIdAndDelete(id);

        if (!deletedWallet) {
            return res.status(404).json({
                message: "المحفظة غير موجودة"
            });
        }
        

  
        res.status(200).json({
            message: "تم حذف المحفظة بنجاح",
            deletedWallet
        });

    } catch (err) {
        res.status(500).json({
            message: `خطأ أثناء حذف المحفظة: ${err.message}`
        });
    }
};

// get all wallets

exports.getAllWallets = async (req, res) => {
    try {

        const wallets = await walletModel.find().sort({ createdAt: -1 });

        const now = new Date();

        // نعدي على كل Wallet
        for (let wallet of wallets) {

            const last = new Date(wallet.lastReset);

            if (
                now.getMonth() !== last.getMonth() ||
                now.getFullYear() !== last.getFullYear()
            ) {
                wallet.monthlyIncoming = 0;
                wallet.monthlyOutgoing = 0;
                wallet.lastReset = now;

                await wallet.save(); // نحفظ التعديل
            }
        }

        res.status(200).json({
            message: "تم جلب المحافظ بنجاح",
            wallets
        });

    } catch (err) {
        res.status(500).json({
            message: `خطأ أثناء جلب المحافظ: ${err.message}`
        });
    }
};

// get all wallets sugg
exports.getAllWalletsSugg = async (req, res) => {
    try {
        const wallets = await walletModel.find({status:"active"},{walletName:1,phoneNumber:1 ,walletProvider:1 ,balance:1 ,ownerName:1 ,Limit:1});

        res.status(200).json({
            message: "تم جلب المحافظ بنجاح",
            wallets
        });

    } catch (err) {
        res.status(500).json({
            message: `خطأ أثناء جلب المحافظ: ${err.message}`
        });
    }
};


// get wallet by id
exports.getWalletById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID غير صالح"
            });
        }

        const wallet = await walletModel.findById(id);

        if (!wallet) {
            return res.status(404).json({
                message: "هذه المحفظة غير موجودة"
            });
        }

        res.status(200).json({
            message: "تم جلب المحفظة بنجاح",
            wallet
        });

    } catch (err) {
        res.status(500).json({
            message: `خطأ أثناء جلب المحفظة: ${err.message}`
        });
    }
};

// update status
exports.updateWalletStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        //  Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID غير صالح"
            });
        }

        //  Validate status
        if (!["active", "inactive"].includes(status)) {
            return res.status(400).json({
                message: "القيمة يجب أن تكون active أو inactive"
            });
        }

        const wallet = await walletModel.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!wallet) {
            return res.status(404).json({
                message: "المحفظة غير موجودة"
            });
        }

        res.status(200).json({
            message: `تم تغيير حالة المحفظة إلى ${status}`,
            wallet
        });

    } catch (err) {
        res.status(500).json({
            message: `خطأ أثناء تحديث الحالة: ${err.message}`
        });
    }
};

// freeze/unfreeze

// freeze
exports.freezeWallet = async (req, res) => {
    try {
        const { id } = req.params;

                //  Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID غير صالح"
            });
        }

        const wallet = await walletModel.findByIdAndUpdate(
            id,
            { status: "inactive" },
            { new: true }
        );

        if (!wallet) {
            return res.status(404).json({
                message: "المحفظة غير موجودة"
            });
        }

        res.status(200).json({
            message: "تم تجميد المحفظة بنجاح",
            wallet
        });

    } catch (err) {
        res.status(500).json({
            message: `خطأ أثناء تجميد المحفظة: ${err.message}`
        });
    }
};

// unfreeze
exports.unfreezeWallet = async (req, res) => {
    try {
        const { id } = req.params;
                //  Validate ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID غير صالح"
            });
        }

        const wallet = await walletModel.findByIdAndUpdate(
            id,
            { status: "active" },
            { new: true }
        );

        if (!wallet) {
            return res.status(404).json({
                message: "المحفظة غير موجودة"
            });
        }

        res.status(200).json({
            message: "تم تفعيل المحفظة بنجاح",
            wallet
        });

    } catch (err) {
        res.status(500).json({
            message: `خطأ أثناء تفعيل المحفظة: ${err.message}`
        });
    }
};


function checkMonthlyReset(wallet) {
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

    return wallet;
}
