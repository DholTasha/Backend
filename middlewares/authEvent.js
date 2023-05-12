const jwt = require("jsonwebtoken");
const Team = require("../models/team");

const authTeam = async (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                let AuthError = { error: "Team is not authenticated!" };
                res.status(401).send({ AuthError });
            } else {
                const team = await Team.findById(decodedToken._id);
                req.team = team;
                req.event = {...req.body};
                req.event.teamId = team._id;
                next();
            }
        });
    } else {
        let AuthError = { error: "Team is not authenticated!" };
        res.status(401).send({ AuthError });
    }
};

module.exports = authTeam;