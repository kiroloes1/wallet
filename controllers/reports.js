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
                $group: {
                    _id: "$senderName",
                    name: { $first: "$senderName" }
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
                $group: {
                    _id: "$receiverName",
                    name: { $first: "$receiverName" }
                }
            }
        ]);

        const merged = [...senders, ...receivers];

        const uniquePeople = [
            ...new Map(
                merged.map(item => [
                    item.name,
                    {
                        name: item.name
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
                "walletName"
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
                totalReceived -
                totalSent,

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
startDate.setDate(startDate.getDate()-7);

}

else if(period==="monthly"){

startDate=new Date();
startDate.setMonth(startDate.getMonth()-1);

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
let phoneField;

if(reportType==="incoming"){

groupField="$senderName";
phoneField="$senderPhone";

}

else{

groupField="$receiverName";
phoneField="$receiverPhone";

}

const pipeline=[];

pipeline.push({
$match:filter
});

pipeline.push({

$group:{

_id:{
name:groupField,
phone:phoneField
},

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

merchantName:"$_id.name",

phone:"$_id.phone",

totalAmount:1,

transactionsCount:1,

lastTransaction:1

}

});

if(search){

pipeline.push({

$match:{

merchantName:{

$regex:search,

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
