const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const register = async (req, res) => {
    const {email, password, firstName, lastName, phoneNumber} = req.body // Kullanıcının dolduracağı alanları aldık sadece.

    logger.info(`Trying to register user with email: ${email}`);

    try{
        const existingUser = await prisma.user.findUnique({where : {email}}) //emaillerde unique arama yapar
        if(existingUser){ // Eğer bulunursa
            logger.warn(`Registration failed: email already exists (${email})`);
            return res.status(400).json({message : "Email already exist."})
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //email formatı kontrolü

        // ^ -> string başlangıcı
        // [\w\-\.]+ -> kullanıcı adı (harf, sayı, _, -, . olabilir)
        // @ -> @ karakteri
        // ([\w\-]+\.)+ -> alan adı (gmail. veya mail.google. gibi)
        // [\w\-]{2,4} -> uzantı (com, net, org gibi 2-4 karakterli)
        // $ -> string sonu

        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format." });
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

        logger.info(`User registered successfully: ${email}`);
        
        return res.status(201).json({ 
            status : "Created",
            user: newUser,
            token : userToken
         });
    } catch (error) {
        logger.error(`Registration error: ${error.message}`);
        return res.status(500).json({ message: error.message });
    }
}

const login = async (req, res) => {
    const {email, password} = req.body

    logger.info(`Login attempt: ${email}`);

    try {
        const user = await prisma.user.findUnique({where: {email}})
        if(!user) {
            logger.warn(`Login failed - user not found: ${email}`);
            return res.status(404).json({message : "User not found."});
        }
        
        const comparePassword = await bcrypt.compare(password, user.password) // passwordları karşılaştırma
        if(!comparePassword) { // Eğer uyuşmazsa
            logger.warn(`Login failed - invalid password: ${email}`);
            return res.status(401).json({ message: "Invalid password" });
        }
        
        const token = jwt.sign({id: user.id}, process.env.SECRET_TOKEN, {expiresIn: "1d"})
    
        logger.info(`Login successful: ${email}`);
        
        return res.status(200).json({
            status: "Ok",
            user: user,
            token: token
        })
    } catch {
        logger.error(`Login error: ${error.message}`);
        return res.status(500).json({ message: error.message });
    }
}

const getProfile = async (req, res) => {
    userId = req.user.id;

    logger.info(`Get profile for user ID: ${userId}`);

    try {
        const existingUser = await prisma.user.findUnique({
            where: {id: userId},
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                createdAt: true
            }
        });

        if(!existingUser) {
            logger.warn(`User not found in profile fetch: ${userId}`);
            return res.status(404).json({message: "User not found"});
        }

        return res.status(200).json({
            status: "Ok",
            user: existingUser,
        });

    } catch (e) {
        logger.error(`Get profile error: ${e.message}`);
        return res.status(500).json({ message: e.message });
    }
}

const update = async (req, res) => {
    userId = req.user.id;
    const { firstName, lastName, phoneNumber, email, password } = req.body

    logger.info(`Update request for user ID: ${userId}`);

    try {
        // Kullanıcı var mı kontrolü
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!existingUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Boş alan kontrolü
        if (!firstName || !lastName || !phoneNumber || !email) {
            return res.status(400).json({ message: "Enter valid data." });
        }

        // Telefon numarası kontrolü
        if (!/^\d{11}$/.test(phoneNumber)) {
            return res.status(400).json({ message: "Phone number must be exactly 11 digits and numeric." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //Emaili formatı kontrolü

        // ^ -> string başlangıcı
        // [\w\-\.]+ -> kullanıcı adı (harf, sayı, _, -, . olabilir)
        // @ -> @ karakteri
        // ([\w\-]+\.)+ -> alan adı (gmail. veya mail.google. gibi)
        // [\w\-]{2,4} -> uzantı (com, net, org gibi 2-4 karakterli)
        // $ -> string sonu

        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format." });
        }

        // Email başka biri tarafından kullanılıyor mu kontrolü
        if (email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({ where: { email } });
            if (emailExists) {
                logger.warn(`Update failed - email already in use: ${email}`);
                return res.status(400).json({ message: "This email is already in use." });
            }
        }

        const updateData = {
            firstName,
            lastName,
            phoneNumber,
            email,
        };

        // Şifre boş değilse güncelle
        if (password && password.length > 0) {
            if (password.length < 6) {
                return res.status(400).json({ message: "Password must be at least 6 characters long." });
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        //Json formatında veriler gönderilip alınırken json içinde password gözükmesin diyoruz. Güvenlik için.
        //Ama veritabanına hashlanmiş şekilde veri gönderilir ve kaydedilir.
        updatedUser.password = undefined;

        logger.info(`User updated: ${email}`);

        return res.status(200).json({
            status: "Updated",
            user: updatedUser,
        });

    } catch (e) {
        logger.error(`Update error: ${e.message}`);
        return res.status(500).json({message: e.message});
    }
}

module.exports = {register, login, update, getProfile}