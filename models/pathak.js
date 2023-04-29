const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const jwt = require("jsonwebtoken");

const pathakSchema = new mongoose.Schema(
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

        numberOfEvents: {
            type: Number,
            default: 0
        },

        //new fields :
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        resetPasswordTokenForForgotPassword: String,

    }
);

pathakSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt();
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// login pathak
pathakSchema.statics.login = async function (email, password) {
    const pathak = await this.findOne({ email });
    if (pathak) {
        const auth = await bcrypt.compare(password, pathak.password);
        if (auth) {
            return pathak;
        }
        throw Error("Incorrect Password");
    }
    throw Error("Incorrect Email");
};

const Pathak = mongoose.model("Pathak", pathakSchema);

module.exports = Pathak;