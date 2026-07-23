const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken")
const validator = require("validator");
const ValidationError = require("../../utils/ValidationError");
const { TableNames ,TableFields, ValidationMsgs, UserTypes } = require("../../utils/constants");
const BuyerService = require("../services/BuyerService");
const Util = require("../../utils/util");

const buyerSchema = new mongoose.Schema(
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
        [TableFields.userType]: {
            type: Number,
            enum: Object.values(UserTypes),
        },
        [TableFields.approved]: {
            type: Boolean,
            default: true,
        },
        [TableFields.deleted] : {
            type : Boolean,
            default : false,
        },
        [TableFields.tokens] : [
            {
                [TableFields.ID] : false,
                [TableFields.token] : {
                    type : String
                }
            }
        ],
        [TableFields.favorites] : [
            {
                [TableFields.property] : {
                    type : mongoose.Types.ObjectId,
                    ref : TableNames.Property,
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

buyerSchema.methods.addToFavorites = async function (property, user) {
    //check if property already exists using some()
    const alreadyExists = user[TableFields.favorites].some(
        fav => fav.equals(property._id)
    );
    
    if(!alreadyExists){
        user[TableFields.favorites].push(property._id);
        await user.save();
        console.log("Added to favorites!")
    } else {
        console.log("This property already exists in favorites!");
    }
}

buyerSchema.methods.removeFromFavorites = async (property, user) => {
    const alreadyExists = user[TableFields.favorites].some(
        fav => fav.equals(property._id)
    );

    if(alreadyExists){
        user[TableFields.favorites].pull(property._id);
        await user.save();
        console.log("removed from favorites");
    } else {
        throw new ValidationError(ValidationMsgs.RecordNotFound)
    }
}


buyerSchema.methods.isValidAuth = async function (password){
    return await bcrypt.compare(password, this.password);
};

buyerSchema.methods.isValidPassword = function (password) {
    const regEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regEx.test(password);
}

buyerSchema.methods.createAuthToken = function() {
    const token = jwt.sign(
        {
            [TableFields.ID] : this[TableFields.ID].toString(),
        },
        process.env.JWT_BUYER_PK,
        {
            expiresIn : '24h'
        }
    );
    return token;
}

buyerSchema.pre("save", async function (next) {
    if( this.isModified(TableFields.password)){
        this[TableFields.password] = await bcrypt.hash(this[TableFields.password], 8);
    }
    next();
})

buyerSchema.index({[TableFields.email] : 1}, {unique : true});

const Buyer = mongoose.model(TableNames.Buyer, buyerSchema);
module.exports = Buyer;