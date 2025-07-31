const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getTransactionDescription = (type, relatedUser) => {
    switch(type){
        case "DEPOSIT":
            return "Money Deposited";
        case "WITHDRAW":
            return "Money withdrawed";
        case "TRANSFER_OUT":
            return `Money was sent to ${relatedUser.firstName} ${relatedUser.lastName}`;
        case "TRANSFER_IN":
            return `Money was sent from ${relatedUser.firstName} ${relatedUser.lastName}`;
        default:
            return "Process";
    }
}

const createTransaction = async (req, res) => {
    const { accountId, type, amount, relatedAccountId } = req.body; //Ui tarafından gelecek bilgiler

    try {
        if (!accountId || !type || !amount || amount <= 0) { //Geçersiz bilgilerde hata mesajı
            return res.status(400).json({ message: "Enter valid data"});
        }

        const account = await prisma.bankAccount.findUnique({ //Kullanıcının seçtiği hesap mevcut mu değil mi
            where: { id: accountId },
        });

        if(!account){ //Mevcut değilse hata döndür
            return res.status(404).json({ message: "Account not found"});
        }

        if (req.user.id !== account.userId) { //Kullanıcı ve hesaptaki idler uyuşmazsa işlem yaptırmama
            return res.status(403).json({ message: "You cannot make transactions to this account." });
        }

        let relatedUser = null; // Karşı tarafın idsini  null yap. para çekme yatırma işlemlerinden dolayı.

        if(["TRANSFER_OUT", "TRANSFER_IN"].includes(type)) { //Eğer transfer varsa
            const relatedAccount = await prisma.bankAccount.findUnique({ // Karşı tarafın hesabını bul
                where: {id: relatedAccountId},
                include: {user: true}
            });
            if(!relatedAccount) { //Girilen bilgilerde bi hesap yoksa hata döndür.
                return res.status(404).json({messsage: "No such account found"});
            }
            relatedUser = relatedAccount.user; // Hesap bulunursa karşı tarafın userını al.
        }
        const description = getTransactionDescription(type, relatedUser); //AÇıklama oluştur.

        const newTransaction = await prisma.transaction.create({ // Hesap hareketi oluştur.
            data: {
                accountId,
                type,
                amount,
                relatedAccountId: relatedAccountId || null,
                description
            }
        });
        return res.status(201).json({
            status: 201,
            transaction: newTransaction
        });
    } catch (e) {
        return res.status(500).json({message: e.message});
    }
}

const getTransactionsByAccount = async (req, res) => {
    const accountId = parseInt(req.params.id);

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
        return res.status(500).json({message: e.message});
    }
}

module.exports = {createTransaction, getTransactionsByAccount}