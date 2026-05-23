const mongoose=require('mongoose');

const transactionSchema=new mongoose.Schema({
      walletId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Wallet",
        required:true
    },
    senderName:{
        type:String,
    },
    receiverName:{
        type:String,  
    },
        senderPhone:{
        type:String,
    },
        receiverPhone:{
        type:String,
    },
    type :{
        type:String,
        required:true,
        enum:["send", "receive"]
    },
 
    notes:{
        type:String,
    },
    amount:{
        type:Number,
        required:true,
        min:1
    },
    isInternalTransfer:{
        type:Boolean,
        default:false
    }
},
  {  timestamps:{
        createdAt:false,
        updatedAt:true
    }}
);



const transactionModel=mongoose.model("Transaction",transactionSchema);
module.exports=transactionModel;
