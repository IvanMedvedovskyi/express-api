const jwt = require('jsonwebtoken');
const generateErrorResponse = require('../controllers/generateErrorResponse')

const authenticationToken = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return generateErrorResponse(res, 401, "Unathorized")
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
        if (err) {
            return generateErrorResponse(res, 403, "Invalid token")
        }

        req.user = user;

        next()
    })
}

module.exports = authenticationToken;