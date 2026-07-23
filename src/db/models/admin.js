const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const validator = require("validator");
const ValidationError = require("../../utils/ValidationError");
const { TableNames ,TableFields, ValidationMsgs, UserTypes } = require("../../utils/constants");
const Util = require("../../utils/util");

const adminSchema = new mongoose.Schema(
    {
        [TableFields.name_] : {
            type : String,
            trim : true,
            required : [true, ValidationMsgs.NameEmpty]
        },
        [TableFields.email] : {
            type : String,
            trim : true,
            required : [ true, ValidationMsgs.EmailEmpty],
            unique : true,
            lowerCase : true,
            validate(value){
                if(!validator.isEmail(value)){
                    throw new ValidationError(ValidationMsgs.EmailInvalid);
                }
            }
        },
        [TableFields.password] : {
            type : String,
            minLength : 5,
            trim : true,
            required : [true, ValidationMsgs.PasswordInvalid]
        }, 
        [TableFields.userType] : {
            type : Number,
            enum : Object.values(UserTypes)
        },
        [TableFields.tokens] : [
            {
                [TableFields.ID] : false,
                [TableFields.token] : {
                    type : String
                }
            }
        ], 
    }, 
    {
        timeStamps : true,
        toJSON : {
            transform : function(doc, ret){
                delete ret[TableFields.tokens];
                delete ret[TableFields.password];
                delete ret.createdAt;
                delete ret.updatedAt;
                delete ret.__v;
            },
        },
    }
);

adminSchema.methods.isValidAuth = async function (password){
    
    return await bcrypt.compare(password, this.password);
};

adminSchema.methods.isValidPassword = function (password) {
    const regEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regEx.test(password);
}

adminSchema.methods.createAuthToken = function() {
    const token = jwt.sign(
        {
            [TableFields.ID] : this[TableFields.ID].toString(),
        },
        process.env.JWT_ADMIN_PK,
        {
            expiresIn : '24h'
        }
    );
    return token;
}

adminSchema.pre("save", async function (next) {
    if( this.isModified(TableFields.password)){
        this[TableFields.password] = await bcrypt.hash(this[TableFields.password], 8);
    }
    next();
})

adminSchema.index({[TableFields.email] : 1}, {unique : true});

const Admin = mongoose.model(TableNames.Admin, adminSchema);
module.exports = Admin;