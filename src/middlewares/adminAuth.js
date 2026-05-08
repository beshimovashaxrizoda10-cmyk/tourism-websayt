const jwt = require('jsonwebtoken');

exports.adminProtect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: "Admin ruxsati talab qilinadi!" });
    }

    try {
        const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
        // .env dagi login bilan mos kelsagina ruxsat beradi
        if (decoded.login === process.env.ADMIN_LOGIN) {
            req.admin = decoded;
            next();
        } else {
            throw new Error();
        }
    } catch (error) {
        return res.status(401).json({ success: false, message: "Token xato yoki muddati o'tgan!" });
    }
};