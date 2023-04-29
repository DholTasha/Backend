const jwt = require("jsonwebtoken");
const Pathak = require("../models/pathak");

const authPathak = async (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                let AuthError = { error: "Pathak is not authenticated!" };
                res.status(401).send({ AuthError });
            } else {
                const pathak = await Pathak.findById(decodedToken._id);
                req.pathak = pathak;
                req.event = req.body;
                req.event.pathakId = pathak._id;
                next();
            }
        });
    } else {
        let AuthError = { error: "Pathak is not authenticated!" };
        res.status(401).send({ AuthError });
    }
};

module.exports = authPathak;