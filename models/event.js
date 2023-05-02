const mongoose = require("mongoose");
const { isEmail } = require("validator");
// const bcrypt = require("bcrypt");
// const Joi = require("joi");
// const jwt = require("jsonwebtoken");

const eventSchema = new mongoose.Schema(
    {
        name: {
            type:String,
            required:true
        },
        location: {
            type:String,
            required: true
        },
        maleDhol: {
            type:Number,
            required: true
        },
        maleTasha: {
            type:Number,
            required: true
        },
        femaleDhol: {
            type:Number,
            required: true
        },
        femaleTasha: {
            type:Number,
            required: true
        },
        videoLink: {
            type: String,
            required: true
        },
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Team",
        },
        // customerId: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     required: true,
        //     ref: "Customer",
        // }
    }
)

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;