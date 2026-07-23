const mongoose = require("mongoose");
const validator = require("validator");
const { TableFields, TableNames, ValidationMsgs, Status} = require("../../utils/constants");

const bookingSchema = new mongoose.Schema(
    {
        [TableFields.associatedProperty] : {
            [TableFields.ID] : false,
            [TableFields.reference] : {
                type : mongoose.Schema.Types.ObjectId,
                ref : TableNames.Property,
            },
            [TableFields.ownerName] : {
                type : String,
            },
            [TableFields.ownerEmail] : {
                type : String
            }
        },
        [TableFields.associatedUser] : {
            [TableFields.ID] : false,
            [TableFields.reference] : {
                type : mongoose.Schema.Types.ObjectId,
                ref : TableNames.Buyer,
            },
        },
        [TableFields.status] : {
            type : Number,
            enum : Object.values(Status),
            default : Status.pending
        },
        [TableFields.visitDate] : {
            type : Date,
            required : [true, ValidationMsgs.VisitDateEmpty]
        },
        [TableFields.bookingDate] : {
            type : Date,
            default :  Date.now(),
        },
        [TableFields.confirmPrice] : {
            type : Number,
            required : [true, ValidationMsgs.ConfirmPriceEmpty]
        }
    }, 
    {
        timeStamps : true,
        toJSON : {
            transform : function(doc, ret){
                delete ret.createdAt;
                delete ret.updatedAt;
                delete ret.__v;
            },
        },
    }
)

const Booking = mongoose.model(TableNames.Booking, bookingSchema);
module.exports = Booking;