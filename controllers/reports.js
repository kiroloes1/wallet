const Transaction=require(`${__dirname}/../models/transactions`);
const Wallet=require(`${__dirname}/../models/wellet`);
const mongoose=require('mongoose')
exports.getAllPeople = async (req, res) => {
    try {

        const senders = await Transaction.aggregate([
            {
                $match: {
                    senderName: { $ne: null }
                }
            },
            {
                $project: {
                    name: "$senderName"
                }
            }
        ]);

        const receivers = await Transaction.aggregate([
            {
                $match: {
                    receiverName: { $ne: null }
                }
            },
            {
                $project: {
                    name: "$receiverName"
                }
            }
        ]);

        const merged = [...senders, ...receivers];

const uniquePeople = [
    ...new Map(
        merged.map(item => {

            const cleanName = item.name?.trim();

            return [
                cleanName,
                {
                    name: cleanName
                }
            ];

        })
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

            const cleanName = name.trim();

            filter.$or = [
                {
                    senderName: {
                        $regex: `^\\s*${cleanName}\\s*$`,
                        $options: "i"
                    }
                },
                {
                    receiverName: {
                        $regex: `^\\s*${cleanName}\\s*$`,
                        $options: "i"
                    }
                }
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
            .populate("walletId", "walletName")
            .sort({ createdAt: -1 });

        let totalSent = 0;
        let totalReceived = 0;

        const details = transactions.map(item => {

            let role = "";

            if (
                item.senderName?.trim() ===
                name?.trim()
            ) {

                role = "sender";
                totalSent += item.amount;

            }

            if (
                item.receiverName?.trim() ===
                name?.trim()
            ) {

                role =
                    role === "sender"
                    ? "sender & receiver"
                    : "receiver";

                totalReceived += item.amount;

            }

            return {

                transactionDate: item.createdAt,

                rawDate: item.createdAt,

                amount: item.amount,

                role,

                senderName: item.senderName,

                receiverName: item.receiverName,

                walletName:
                    item.walletId?.walletName || "",

                notes: item.notes

            };

        });

        res.status(200).json({

            success: true,

            merchant: name,

            totalTransactions: details.length,

            totalSent,

            totalReceived,

            netAmount:
                totalReceived - totalSent,

            transactions: details

        });

    } catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

};
exports.getMerchantAnalytics = async (req,res)=>{

try{

const {
reportType,
period,
fromDate,
toDate,
search
}=req.query;

const filter={};

let startDate;
let endDate=new Date();

if(period==="daily"){

startDate=new Date();
startDate.setHours(0,0,0,0);

}

else if(period==="weekly"){

startDate=new Date();
startDate.setDate(
startDate.getDate()-7
);

}

else if(period==="monthly"){

startDate=new Date();
startDate.setMonth(
startDate.getMonth()-1
);

}

else if(period==="custom"){

if(fromDate)
startDate=new Date(fromDate);

if(toDate){

endDate=new Date(toDate);

endDate.setHours(
23,
59,
59,
999
);

}

}

if(startDate){

filter.createdAt={
$gte:startDate,
$lte:endDate
};

}

let groupField;

if(reportType==="incoming"){

groupField="$senderName";

}

else{

groupField="$receiverName";

}

const pipeline=[];

pipeline.push({
$match:filter
});

pipeline.push({

$project:{

merchantName:{
$trim:{
input:groupField
}
},

amount:1,

createdAt:1

}

});

pipeline.push({

$group:{

_id:"$merchantName",

totalAmount:{
$sum:"$amount"
},

transactionsCount:{
$sum:1
},

lastTransaction:{
$max:"$createdAt"
}

}

});

pipeline.push({

$project:{

_id:0,

merchantName:"$_id",

totalAmount:1,

transactionsCount:1,

lastTransaction:1

}

});

if(search){

const cleanSearch=
search.trim();

pipeline.push({

$match:{

merchantName:{

$regex:
`^\\s*${cleanSearch}\\s*$`,

$options:"i"

}

}

});

}

pipeline.push({

$sort:{

totalAmount:-1

}

});

const result=
await Transaction.aggregate(
pipeline
);

const totalAmount=
result.reduce(

(acc,item)=>

acc+
item.totalAmount

,0

);

res.status(200).json({

success:true,

reportType,

period,

fromDate,

toDate,

totalMerchants:
result.length,

grandTotal:
totalAmount,

data:result

});

}

catch(error){

res.status(500).json({

success:false,

message:error.message

});

}

};
