const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

const getTransactionDescription = (type, relatedUser) => {
    switch(type){
        case "DEPOSIT":
            return "Money Deposited";
        case "WITHDRAW":
            return "Money Withdrawed";
        case "TRANSFER_OUT":
            return `Money was sent to ${relatedUser.firstName} ${relatedUser.lastName}`;
        case "TRANSFER_IN":
            return `Money was sent from ${relatedUser.firstName} ${relatedUser.lastName}`;
        default:
            return "Process";
    }
}

const validateTransactionDetails = async (req, res) => {
    const { accountId, type, amount, relatedIban, relatedFirstName, relatedLastName } = req.body;

    let relatedAccountId = null;

    try {
        if (!accountId || !type || !amount || amount <= 0) { //Geçersiz bilgilerde hata mesajı
            logger.warn(`Invalid transaction data from user ${req.user.id}`);
            return res.status(400).json({ message: "Enter valid data"});
        }

        const account = await prisma.bankAccount.findUnique({ //Kullanıcının seçtiği hesap mevcut mu değil mi
            where: { id: accountId },
            include: {user: true}
        });

        if(!account){ //Mevcut değilse hata döndür
            logger.warn(`Transaction failed - account not found: ${accountId}`);
            return res.status(404).json({ message: "Account not found"});
        }

        if (req.user.id !== account.userId) { //Kullanıcı ve hesaptaki idler uyuşmazsa işlem yaptırmama
            logger.warn(`User ${req.user.id} attempted unauthorized transaction on account ${accountId}`);
            return res.status(403).json({ message: "You cannot make transactions to this account." });
        }

        let relatedUser = null; // Karşı tarafın idsini  null yap. para çekme yatırma işlemlerinden dolayı.

        if(type === "TRANSFER_OUT") { //Eğer transfer varsa
            const relatedAccount = await prisma.bankAccount.findUnique({ // Karşı tarafın hesabını bul
                where: {iban: relatedIban},
                include: {user: true}
            });
            if(!relatedAccount) { //Girilen bilgilerde bi hesap yoksa hata döndür.
                logger.warn(`Transfer failed - IBAN not found: ${relatedIban}`);
                return res.status(404).json({message: "Iban not found"});
            }

            //ALıcı isim ve soyisim uyuşmazsa hata
            if (relatedAccount.user.firstName !== relatedFirstName || relatedAccount.user.lastName !== relatedLastName) {
                return res.status(400).json({ message: "IBAN and name/surname do not match" });
            }

            relatedUser = relatedAccount.user; // Hesap bulunursa karşı tarafın userını al.
            relatedAccountId = relatedAccount.id; //Modelde account ile ilişkiyi bu değişkenle kurduğumuz için gönderilen json mesajlarında bunu göndermek zorunda olduğumuz için o ibana ait relatedAccountId buluyoruz ve tanımlıyoruz.

            if(account.balance < amount) { // Girilen miktar balancetan büyükse hata
                logger.warn(`Transfer failed - insufficient balance on account ${accountId}`);
                return res.status(400).json({message: "Insufficient balance"});
            }

            // Gerekli alanlar var mı yoksa null mu kontrolü.
            if (!relatedIban || !relatedFirstName || !relatedLastName) {
                return res.status(400).json({ message: "Missing receiver IBAN or name/surname" });
            }

            logger.info(`Validation successful from account ${accountId} to ${relatedAccountId}, amount: ${amount}`);
        }

        if (type === "WITHDRAW") {
            if (account.balance < amount) { // amount balancetan büyük olamaz
                return res.status(400).json({message: "Insufficient balance"});
            }
        }

        return res.status(200).json({ message: "Validation successful" });
    } catch (e) {
        logger.error(`Validation error: ${e.message}`);
        return res.status(500).json({message: e.message});
    }
}

const createTransaction = async (req, res) => {
    const { accountId, type, amount, relatedIban, relatedFirstName, relatedLastName } = req.body;
     //Ui tarafından json formatında post edilen buraya gelecek olan bilgiler

    let relatedAccountId = null; //Para çekme yatırma işlemleri için en başta null yaptık karşı tarafın idsini.

    logger.info(`Transaction attempt: ${type} | Account ID: ${accountId} | Amount: ${amount}`);

    try {
        if (!accountId || !type || !amount || amount <= 0) { //Geçersiz bilgilerde hata mesajı
            logger.warn(`Invalid transaction data from user ${req.user.id}`);
            return res.status(400).json({ message: "Enter valid data"});
        }

        const account = await prisma.bankAccount.findUnique({ //Kullanıcının seçtiği hesap mevcut mu değil mi
            where: { id: accountId },
            include: {user: true}
        });

        if(!account){ //Mevcut değilse hata döndür
            logger.warn(`Transaction failed - account not found: ${accountId}`);
            return res.status(404).json({ message: "Account not found"});
        }

        if (req.user.id !== account.userId) { //Kullanıcı ve hesaptaki idler uyuşmazsa işlem yaptırmama
            logger.warn(`User ${req.user.id} attempted unauthorized transaction on account ${accountId}`);
            return res.status(403).json({ message: "You cannot make transactions to this account." });
        }

        let relatedUser = null; // Karşı tarafın idsini  null yap. para çekme yatırma işlemlerinden dolayı.

        if(["TRANSFER_OUT", "TRANSFER_IN"].includes(type)) { //Eğer transfer varsa
            const relatedAccount = await prisma.bankAccount.findUnique({ // Karşı tarafın hesabını bul
                where: {iban: relatedIban},
                include: {user: true}
            });
            if(!relatedAccount) { //Girilen bilgilerde bi hesap yoksa hata döndür.
                return res.status(404).json({message: "No such account found"});
            }

            //ALıcı isim ve soyisim uyuşmazsa hata
            if (relatedAccount.user.firstName !== relatedFirstName || relatedAccount.user.lastName !== relatedLastName) {
                return res.status(400).json({ message: "IBAN and name/surname do not match" });
            }

            relatedUser = relatedAccount.user; // Hesap bulunursa karşı tarafın userını al.
            relatedAccountId = relatedAccount.id; //Modelde account ile ilişkiyi bu değişkenle kurduğumuz için gönderilen json mesajlarında bunu göndermek zorunda olduğumuz için o ibana ait relatedAccountId buluyoruz ve tanımlıyoruz.

            if(type === "TRANSFER_OUT" && account.balance < amount) { // Girilen miktar balancetan büyükse hata
                return res.status(400).json({message: "Insufficient balance"});
            }

            if(type === "TRANSFER_OUT") { // Gerekli alanlar var mı yoksa null mu kontrolü.
                if (!relatedIban || !relatedFirstName || !relatedLastName) {
                    return res.status(400).json({ message: "Missing receiver IBAN or name/surname" });
                }


                await prisma.bankAccount.update({ // Bu Insufficient balancehesapta balancı azalt
                    where: { id: accountId },
                    data: { balance: {decrement: amount}}
                });

                await prisma.bankAccount.update({ //Karşı tarafta balancı arttır
                    where: {id: relatedAccountId},
                    data: {balance: {increment: amount}}
                });

                await prisma.transaction.create({ //Karşı tarafa yani alıcı tarafa transaction oluştururuz.
                    data: {
                        accountId: relatedAccountId,
                        type: "TRANSFER_IN",
                        amount,
                        relatedAccountId: accountId,
                        description: getTransactionDescription("TRANSFER_IN", account.user)
                    }
                });
            }

            logger.info(`Transfer successful from account ${accountId} to ${relatedAccountId}, amount: ${amount}`);
        }

        if (type === "DEPOSIT") {
            await prisma.bankAccount.update({ // PAra yatırınca amount kadar balance arttır.
                where: {id: accountId},
                data: {balance: {increment: amount}}
            });
            logger.info(`Deposit: ${amount} to account ${accountId}`);
        }

        if (type === "WITHDRAW") {
            if (account.balance < amount) { // amount balancetan büyük olamaz
                return res.status(400).json({message: "Insufficient balance"});
            }

            await prisma.bankAccount.update({ //Para çekince amount kadar balance azalt.
                where: {id: accountId},
                data: {balance: {decrement: amount}}
            });
            logger.info(`Withdraw: ${amount} from account ${accountId}`);
        }

        const description = getTransactionDescription(type, relatedUser); //Açıklama oluştur.

        const newTransaction = await prisma.transaction.create({ // Hesap hareketi oluştur.
            data: {
                accountId,
                type,
                amount,
                relatedAccountId: relatedAccountId || null,
                description
            }
        });

        logger.info(`Transaction created successfully: ${type} | ID: ${newTransaction.id}`);

        return res.status(201).json({
            status: 201,
            transaction: newTransaction
        });
    } catch (e) {
        logger.error(`Transaction error: ${e.message}`);
        return res.status(500).json({message: e.message});
    }
}

const getTransactionsByAccount = async (req, res) => {
    const accountId = parseInt(req.params.id);

    logger.info(`Fetching transactions for account ${accountId}`);

    try {
        const transactions = await prisma.transaction.findMany({
            where: {accountId: accountId},
            orderBy: {createdAt: "desc"},
            include: {
                relatedAccount: { //Karşı tarafın bilgileri için.
                    include: {
                        user: true
                    }
                }
            }
        });

        return res.status(201).json({
            status: 201,
            transactions: transactions
        });
    } catch (e) {
        logger.error(`Transaction fetch error: ${e.message}`);
        return res.status(500).json({message: e.message});
    }
}

module.exports = {createTransaction, getTransactionsByAccount, validateTransactionDetails}