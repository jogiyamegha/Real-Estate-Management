const mongoose = require("mongoose");
const validator = require("validator");
const { TableFields, TableNames, ValidationMsgs, FurnishedStatus} = require("../../utils/constants");
const Util = require('../../utils/util');
const {getUrl, Folders} = require("../../utils/storage")

const propertySchema = new mongoose.Schema(
    {
        [TableFields.addedBy] : {
            [TableFields.ID] : false,
            [TableFields.reference] : {
                type : mongoose.Schema.Types.ObjectId,
                ref : TableNames.User,
            }
        },
        [TableFields.associatedCategory] : {
            [TableFields.ID] : false,
            [TableFields.reference] : {
                type : mongoose.Schema.Types.ObjectId,
                ref : TableNames.Category,
            },
            [TableFields.categoryName] : {
                type : String,
                trim : true,
            }
        },
        [TableFields.image] : {
            type : String,
            trim : true,
            required : [true, ValidationMsgs.ImageEmpty]
        },
        [TableFields.address] : {
            type : String,
            trim : true,
            required : [true, ValidationMsgs.AddressEmpty]
        },
        [TableFields.landArea] : {
            type : Number,
            required : [true, ValidationMsgs.LandAreaEmpty]
        },
        [TableFields.price] : {
            type : Number,
            required : [true, ValidationMsgs.PriceEmpty]
        },
        [TableFields.rooms] : {
            type : Number,
            required : [true, ValidationMsgs.RoomsEmpty]
        },
        [TableFields.furnishedStatus] : {
            type : Number,
            enum : Object.values(FurnishedStatus),
            trim : true,
            required : [true, ValidationMsgs.FurnishedStatusEmpty]
        },
        [TableFields.buildDate] : {
            type : Date,
            required : [true, ValidationMsgs.BuildDateEmpty]
        },
        [TableFields.availableSlots] : {
            type : Number,
            required : [true, ValidationMsgs.AvailableSlotsEmpty]
        },
        [TableFields.availability] : {
            type : Boolean,
            default : true,
            required : [true, ValidationMsgs.AvailabilityEmpty]
        },
        [TableFields.isFeatured] : {
            type : Boolean,
            required : [true, ValidationMsgs.isFeaturedEmpty]
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
        [TableFields.uniqueId]: {
            type: String,
            trim: true,
        },
        [TableFields.verified] : {
            type : Boolean,
            default : false,
            required : [true, ValidationMsgs.VerifiedEmpty]
        },
        [TableFields.deleted] : {
            type : Boolean,
            default : false,
        },
        [TableFields._deletedAt]: {
            type: Date,
        },
        [TableFields._createdAt]: {
            type: Date,
            default: Date.now,
        },
        [TableFields._updatedAt]: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timeStamps : true,
        toJSON : {
            transform : function(doc, ret){
                delete ret.createdAt;
                delete ret.updatedAt;
                if (ret.hasOwnProperty([TableFields.image])) {
                    ret[TableFields.image] = getUrl(Folders.image, ret[TableFields.image]);
                }
                delete ret.__v;
            },
        },
    }
)

const Property = mongoose.model(TableNames.Property, propertySchema);
module.exports = Property;