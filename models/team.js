const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const teamSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true, //as email needs to be unique
            validate: [isEmail, "Please enter a valid email"],
        },
        maleDhol: {
            type: Number,
            required: true
        },

        maleTasha: {
            type: Number,
            required: true
        },

        femaleDhol: {
            type: Number,
            required: true
        },

        femaleTasha: {
            type: Number,
            required: true
        },
        address: {
            type: String,
            required: true
        },

        videoLink: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },


        mobile: {
            type: Number,
            required: true,
        },

        // numberOfEvents: {
        //     type: Number,
        //     default: 0
        // },

        //new fields :
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        resetPasswordTokenForForgotPassword: String,

    }
);

teamSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// login team
teamSchema.statics.login = async function (email, password) {
    const team = await this.findOne({ email });
    if (team) {
        const auth = await bcrypt.compare(password, team.password);
        if (auth) {
            return team;
        }
        throw Error("Incorrect Password");
    }
    throw Error("Incorrect Email");
};

const Team = mongoose.model("Team", teamSchema);

module.exports = Team;