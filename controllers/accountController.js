const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../utils/logger');

function generateAccountNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function generateIban(accountNumber) {
    return `TR0001${accountNumber}`;
}

const createAccount = async (req, res) => {
    const { name } = req.body; //Arayüzden sadece bu bilgi json olarak post edildiği için tek bunu yazdık
    const userId = req.user.id; //authMiddlewarede token doğrulaması sonrası gerekli id atanır buraya

    logger.info(`User ${userId} is creating a new bank account`);

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

        logger.info(`Account created successfully: ${account.id} (${iban})`);

        return res.status(201).json({
            status: "Created",
            account: account
        });
    } catch (e) {
        logger.error(`Account creation failed: ${e.message}`);
        return res.status(500).json({ message: e.message });
    }
}

const getAccounts = async (req, res) => {
    const userId = req.user.id;

    logger.info(`Fetching accounts for user ${userId}`);

    try {
        //Veritabanından aktif kullanıcı için hesapları al
        const accounts = await prisma.bankAccount.findMany({
            where: {userId},
            orderBy: {createdAt: "desc"}
        });

        logger.info(`Fetched accounts successfully for user ${userId}`);

        return res.status(200).json({
            status: "success",
            accounts: accounts
        })
    } catch (e) {
        logger.error(`Error fetching accounts: ${e.message}`);
        return res.status(500).json({ message: e.message });
    }
}

const getAccountById = async (req, res) => {
    const userId = req.user.id;
    const accountId = parseInt(req.params.id); // Endpoint/account/:id şeklinde olcak.

    logger.info(`Fetching account ${accountId} for user ${userId}`);

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

        logger.info(`Fetched account ${accountId} successfully for user ${userId}`);

        return res.status(200).json({
            status: "Success",
            account: account
        });
    } catch (e) {
        logger.error(`Error fetching account ${accountId}: ${e.message}`);
        return res.status(500).json({ message: e.message});
    }
 }

 const deleteAccount = async (req, res) => {
    const userId = req.user.id;
    const accountId = parseInt(req.params.id);

    logger.info(`User ${userId} requests deletion for account ${accountId}`);

    try {
        const account = await prisma.bankAccount.findUnique({
            where: {id: accountId},
        });

        if (account.balance > 0) {
            logger.warn(`Account ${accountId} deletion blocked due to non-zero balance`);
            return res.status(400).json({message: "Account balance is not zero. Cannot delete account."})
        }

        await prisma.bankAccount.delete({
            where: {
                id: accountId,
                userId: userId,
            }
        });

        logger.info(`Account ${accountId} deleted successfully`);

        return res.status(200).json({ message: "Account deleted successfully."});

    } catch (e) {
        logger.error(`Account deletion failed: ${e.message}`);
        return res.status(500).json({ message: e.message});
    }  
}


module.exports = {createAccount, getAccounts, getAccountById, deleteAccount}