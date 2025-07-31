const jwt = require("jsonwebtoken");

const auth = (req, res, next) => { //next() çağrıldığında bir sonraki middleware'e veya route’a geçilir
    const token = req.headers.authorization?.split(" ")[1]; 
    //"Bearer dfnflskdfn" gibi gelen verinin sadece dfnflskdfn kısmını almış olduk

    if(!token) {
        return res.status(401).json({ message: "No token"});
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_TOKEN); //JWT token'ı çözümlemek ve doğrulamak için kullanılır.
        req.user = decoded // Artık req.user.id ile erişebiliriz
        next();
    } catch (e) {
        return res.status(401).json({ message: "Token is not valid." });
    }
}

module.exports = auth;