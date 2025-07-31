const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const {email, password, firstName, lastName, phoneNumber} = req.body // Kullanıcının dolduracağı alanları aldık sadece.

    try{
        
        const existingUser = await prisma.user.findUnique({where : {email}}) //emaillerde unique arama yapar
        if(existingUser){ // Eğer bulunursa
            return res.status(400).json({message : "Email already exist."})
        }
        
        if(password.length < 6){
            return res.status(400).json({message : "Your password must be at least 6 characters long."})
        }
        const hashPassword = await bcrypt.hash(password, 10) //Password hashleme

        if (!/^\d{11}$/.test(phoneNumber)) { // Sadece sayılardan ve 11haneden oluşması dışında hata versin
            return res.status(400).json({ message: "Phone number must be exactly 11 digits and numeric." });
        }

        const newUser = await prisma.user.create({ //User modeli için yeni kayıt oluşturma
            data : {firstName, lastName, email, password: hashPassword, phoneNumber},
        })

        const userToken = jwt.sign({id: newUser.id}, process.env.SECRET_TOKEN, {expiresIn: "1d"}); //User için token oluşturma

        return res.status(201).json({ 
            status : "Created",
            user: newUser,
            token : userToken
         });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

const login = async (req, res) => {
    const {email, password} = req.body

    try {
        const user = await prisma.user.findUnique({where: {email}})
        if(!user) {
            return res.status(404).json({message : "User not found."})
        }
        
        const comparePassword = await bcrypt.compare(password, user.password)
        if(!comparePassword) {
            return res.status(401).json({ message: "Invalid password" });
        }
        
        const token = jwt.sign({id: user.id}, process.env.SECRET_TOKEN, {expiresIn: "1d"})
    
        return res.status(200).json({
            status: "Ok",
            user: user,
            token: token
        })
    } catch {
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {register, login}