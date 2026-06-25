const mongoose=require('mongoose');

const walletSchema=new mongoose.Schema({
    walletName:{
        type:String,
        required:true,
         trim:true
    },
    phoneNumber:{
         type:String,
         required:true,
         unique:true,
         match: [/^(010|011|012|015)[0-9]{8}$/, 'هذا ليس رقم صحيح من محافظ مصر']
    },
    walletProvider:{
        type:String,
        required:true,
            enum: {
        values: ["Vodafone", "Etisalat", "Orange", "WE"],
        message: "هذه الشركة غير مدعومة في نظام المحافظ الإلكترونية"
    }

    },
    ownerName:{
        type:String,
        required:true,
         trim:true
    },
    Limit:{
        type:Number,
        required:true,
    },
    status :{
        type:String,
        enum:["active" , "inactive" ],
        default:"active"
    }
    ,
    totalIncoming:{
    type:Number,
    default:0
    },
    totalOutgoing:{
        type:Number,
        default:0
    },
    balance: {
        type: Number,
        default: 0
        },
            fees: {
    type: Number,
    default: 0
},

monthlyIncoming: { type: Number, default: 0 },
monthlyOutgoing: { type: Number, default: 0 },
lastReset: { type: Date, default: Date.now }
},{timestamps:true});

const walletModel=mongoose.model("Wallet",walletSchema);
module.exports=walletModel;
