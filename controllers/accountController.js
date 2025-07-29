const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function generateAccountNumber() {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function generateIban(accountNumber) {
    return `TR0001${accountNumber}`;
}

const createAccount = async (req, res) => {
    const { name } = req.body;
    const userId = req.user.id;

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

        res.status(201).json({
            status: "Created",
            account: account
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
}

const getAccounts = async (req, res) => {
    const userId = req.user.id;

    try {
        const accounts = await prisma.bankAccount.findMany({
            where: {userId},
            orderBy: {createdAt: "desc"}
        });

        res.status(200).json({
            status: "success",
            accounts: accounts
        })
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
}

module.exports = {createAccount, getAccounts}