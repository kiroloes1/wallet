const Wallet = require(`${__dirname}/../models/wellet`);
const Transaction = require(`${__dirname}/../models/transactions`);

exports.getDashboard = async (req, res) => {
  try {

    const now = new Date();
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

await Wallet.updateMany(
  { lastReset: { $lt: startOfMonth } },
  {
    $set: {
      monthlyIncoming: 0,
      monthlyOutgoing: 0,
      lastReset: now
    }
  }
);
  
    // Wallet Stats
  

    const totalWallets = await Wallet.countDocuments();

    const activeWallets = await Wallet.countDocuments({ status: "active" });
    const inactiveWallets = await Wallet.countDocuments({ status: "inactive" });

    // المحافظ القريبة من limit (مثلاً 90%)
const nearMonthlyLimit = await Wallet.countDocuments({
  $or: [
    {
      $expr: {
        $gte: [
          "$monthlyOutgoing",
          { $multiply: ["$Limit", 0.75] }
        ]
      }
    },
    {
      $expr: {
        $gte: [
          "$monthlyIncoming",
          { $multiply: ["$Limit", 0.75] }
        ]
      }
    }
  ]
});

    // إجمالي الفلوس في كل المحافظ
    const totalBalanceResult = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$balance" }
        }
      }
    ]);

    const totalBalance = totalBalanceResult[0]?.total || 0;

  
    // Incoming / Outgoing
  

    const totals = await Wallet.aggregate([
      {
        $group: {
          _id: null,
          totalIncoming: { $sum: "$totalIncoming" },
          totalOutgoing: { $sum: "$totalOutgoing" },
          monthlyIncoming: { $sum: "$monthlyIncoming" },
          monthlyOutgoing: { $sum: "$monthlyOutgoing" }
        }
      }
    ]);

    const {
      totalIncoming = 0,
      totalOutgoing = 0,
      monthlyIncoming = 0,
      monthlyOutgoing = 0
    } = totals[0] || {};

  
    // Internal Transactions
  

    const internalTransactions = await Transaction.countDocuments({
      isInternalTransfer: true
    });

  
    // Response
  

    res.status(200).json({
      wallets: {
        totalWallets,
        activeWallets,
        inactiveWallets,
        nearLimitWallets,
        totalBalance
      },
      transactions: {
        totalIncoming,
        totalOutgoing,
        monthlyIncoming,
        monthlyOutgoing,
        internalTransactions
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
