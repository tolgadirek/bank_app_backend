const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    const {email, password, firstName, lastName} = req.body

    try{
        
        const existingUser = await prisma.user.findUnique({where : {email}}) //emaillerde arama yapar
        if(existingUser){ // Eğer bulunursa
            res.status(400).json({message : "Email already exist."})
        }
        
        if(password.length < 6){
            res.status(400).json({message : "Your password must be at least 6 characters long."})
        }
        const hashPassword = await bcrypt.hash(password, 10) //Password hashleme

        const newUser = await prisma.user.create({ //Yeni kayıt oluşturma
            data : {firstName, lastName, email, password: hashPassword},
        })

        const userToken = jwt.sign({id: newUser.id}, process.env.SECRET_TOKEN, {expiresIn: "1d"}); //User için token oluşturma

        res.status(201).json({ 
            status : "Created",
            user: newUser,
            token : userToken
         });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

const login = async (req, res) => {
    const {email, password} = req.body

    try {
        const user = await prisma.user.findUnique({where: {email}})
        if(!user) {
            res.status(404).json({message : "User not found."})
        }
        
        const comparePassword = await bcrypt.compare(password, user.password)
        if(!comparePassword) {
            res.status(401).json({ message: "Invalid password" });
        }
        
        const token = jwt.sign({id: user.id}, process.env.SECRET_TOKEN, {expiresIn: "1d"})
    
        res.status(200).json({
            status: "Ok",
            user: user,
            token: token
        })
    } catch {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {register, login}