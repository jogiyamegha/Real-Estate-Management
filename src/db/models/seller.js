const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const validator = require("validator");
const ValidationError = require("../../utils/ValidationError");
const { TableNames ,TableFields, ValidationMsgs, UserTypes } = require("../../utils/constants");
const Util = require("../../utils/util");

const sellerSchema = new mongoose.Schema(
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
        [TableFields.address] : {
            type : String,
            trim : true
        },
        [TableFields.phoneCountry] : {
            type : String,
            trim : true,
            lowercase : true
        }, 
        [TableFields.phone] : {
            type : String,
            trim : true,
            validate : {
                validator(value){
                    return value ? Util.isValidMobileNumber(value) : true;
                },
                message : (prop)=>  ValidationMsgs.PhoneInvalid
            }
        },
        [TableFields.isActive] : {
            type : Boolean,
            default : true,
            required : [true, ValidationMsgs.IsActiveEmpty]
        },
        [TableFields.deleted] : {
            type : Boolean,
            default : false,
        },
        [TableFields.userType]: {
            type: Number,
            enum: Object.values(UserTypes),
        },
        [TableFields.approved]: {
            type: Boolean,
            default: true,
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
) 

sellerSchema.methods.isValidAuth = async function (password){
    return await bcrypt.compare(password, this.password);
};

sellerSchema.methods.isValidPassword = function (password) {
    const regEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regEx.test(password);
}

sellerSchema.methods.createAuthToken = function() {
    const token = jwt.sign(
        {
            [TableFields.ID] : this[TableFields.ID].toString(),
        },
        process.env.JWT_SELLER_PK,
        {
            expiresIn : '24h'
        }
    );
    return token;
}

sellerSchema.pre("save", async function (next) {
    if( this.isModified(TableFields.password)){
        this[TableFields.password] = await bcrypt.hash(this[TableFields.password], 8);
    }
    next();
})

sellerSchema.index({[TableFields.email] : 1}, {unique : true});

const Seller = mongoose.model(TableNames.Seller, sellerSchema);
module.exports = Seller;