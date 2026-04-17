const Wallet = require(`${__dirname}/../models/wellet`);
const Transaction = require(`${__dirname}/../models/transactions`);
const User = require(`${__dirname}/../models/user`);

exports.downloadBackup = async (req, res) => {
  try {
    const wallets = await Wallet.find();
    const transactions = await Transaction.find();
    const users = await User.find();

    const data = {
      wallets,
      transactions,
      users,
      backupDate: new Date()
    };

    const jsonData = JSON.stringify(data, null, 2);

    // مهم جدًا
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=backup.json'
    );

    res.send(jsonData);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};