const Transaction=require(`${__dirname}/../models/transactions`);
const Wallet=require(`${__dirname}/../models/wellet`);
const mongoose=require('mongoose')

exports.getAllPeople = async (req, res) => {
    try {

        const senders = await Transaction.aggregate([
            {
                $match: {
                    senderName: { $ne: null },
                    senderPhone: { $ne: null }
                }
            },
            {
                $group: {
                    _id: "$senderPhone",
                    name: { $first: "$senderName" },
                    phone: { $first: "$senderPhone" }
                }
            }
        ]);

        const receivers = await Transaction.aggregate([
            {
                $match: {
                    receiverName: { $ne: null },
                    receiverPhone: { $ne: null }
                }
            },
            {
                $group: {
                    _id: "$receiverPhone",
                    name: { $first: "$receiverName" },
                    phone: { $first: "$receiverPhone" }
                }
            }
        ]);

        const merged = [...senders, ...receivers];

        const uniquePeople = [
            ...new Map(
                merged.map(item => [
                    item.phone,
                    {
                        name: item.name,
                        phone: item.phone
                    }
                ])
            ).values()
        ];

        res.status(200).json({
            success: true,
            count: uniquePeople.length,
            data: uniquePeople
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



exports.getMerchantReport = async (req, res) => {

    try {

        const { name, fromDate, toDate } = req.body;

        const filter = {};

        if (name) {
            filter.$or = [
                { senderName: name },
                { receiverName: name }
            ];
        }

        if (fromDate || toDate) {

            filter.createdAt = {};

            if (fromDate) {
                filter.createdAt.$gte = new Date(fromDate);
            }

            if (toDate) {

                const end = new Date(toDate);
                end.setHours(23,59,59,999);

                filter.createdAt.$lte = end;
            }

        }

        const transactions = await Transaction.find(filter)
            .populate(
                "walletId",
                "walletName phoneNumber"
            )
            .sort({ createdAt: -1 });

        let totalSent = 0;
        let totalReceived = 0;

        const details = transactions.map(item => {

            let role = "";

            if (item.senderName === name) {

                role = "sender";
                totalSent += item.amount;

            }

            if (item.receiverName === name) {

                role =
                    role === "sender"
                    ? "sender & receiver"
                    : "receiver";

                totalReceived += item.amount;

            }

            return {

                date: item.createdAt,

                amount: item.amount,

                role,

                senderName: item.senderName,

                senderPhone: item.senderPhone,

                receiverName: item.receiverName,

                receiverPhone: item.receiverPhone,

                walletNumber:
                    item.walletId?.phoneNumber || "",

                walletName:
                    item.walletId?.walletName || "",

                notes: item.notes
            };

        });

        res.status(200).json({

            success:true,

            merchant:name,

            totalTransactions:
                details.length,

            totalSent,

            totalReceived,

            netAmount:
                totalReceived -
                totalSent,

            transactions:details

        });

    } catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

};
