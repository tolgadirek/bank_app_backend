const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateAccountNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function generateIban(accountNumber) {
    return `TR0001${accountNumber}`;
}

const createAccount = async (req, res) => {
    const { name } = req.body; //Kulllanıcı arayüzde sadece burayı dolduracağı için sadece name aldık.
    const userId = req.user.id; //authMiddlewarede token doğrulaması sonrası gerekli id atanır buraya

    try {
        const accountNumber = generateAccountNumber();
        const iban = generateIban(accountNumber);

        const account = await prisma.bankAccount.create({
            data: {
                userId,
                name,
                accountNumber,
                iban
            }
        });

        return res.status(201).json({
            status: "Created",
            account: account
        });
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

const getAccounts = async (req, res) => {
    const userId = req.user.id;

    try {
        //Veritabanından aktif kullanıcı için hesapları al
        const accounts = await prisma.bankAccount.findMany({
            where: {userId},
            orderBy: {createdAt: "desc"}
        });

        return res.status(200).json({
            status: "success",
            accounts: accounts
        })
    } catch (e) {
        return res.status(500).json({ message: e.message });
    }
}

const getAccountById = async (req, res) => {
    const userId = req.user.id;
    const accountId = parseInt(req.params.id); // Endpoint/account/:id şeklinde olcak.

    try {
        const account = await prisma.bankAccount.findFirst({
            where: {
                id: accountId,
                userId: userId
            },
            include: {
                user: true, // Kullanıcı bilgilerini de getir
            }
        });

        return res.status(200).json({
            status: "Success",
            account: account
        });
    } catch (e) {
        return res.status(500).json({ message: e.message});
    }
 }

 const deleteAccount = async (req, res) => {
    const userId = req.user.id;
    const accountId = parseInt(req.params.id);
    try {
        const account = await prisma.bankAccount.findUnique({
            where: {id: accountId},
        });

        if (account.balance > 0) {
            return res.status(400).json({message: "Account balance is not zero. Cannot delete account."})
        }

        await prisma.bankAccount.delete({
            where: {
                id: accountId,
                userId: userId,
            }
        });

        return res.status(200).json({ message: "Account deleted successfully."});

    } catch (e) {
        return res.status(500).json({ message: e.message});
    }  
}


module.exports = {createAccount, getAccounts, getAccountById, deleteAccount}