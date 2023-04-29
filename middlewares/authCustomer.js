const jwt = require("jsonwebtoken");
const Customer = require("../models/customer");

const authCustomer = async (req, res, next) => {
    const token = await req.header('Authorization').replace('Bearer ', '')
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                let AuthError = { error: "Customer is not authenticated!" };
                res.status(401).send({ AuthError });
            } else {
                const customer = await Customer.findById(decodedToken._id);
                req.customer = customer;
                next();
            }
        });
    } else {
        let AuthError = { error: "Customer is not authenticated!" };
        res.status(401).send({ AuthError });
    }
};

module.exports = authCustomer;