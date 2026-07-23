const mongoose = require("mongoose");
const { TableFields, TableNames, ValidationMsgs} = require("../../utils/constants");

const reviewRatingSchema = new mongoose.Schema(
    {
        [TableFields.associatedProperty] : {
            [TableFields.ID] : false,
            [TableFields.reference] : {
                type : mongoose.Schema.Types.ObjectId,
                ref : TableNames.Property,
            },
        },
        [TableFields.associatedUser] : {
            [TableFields.ID] : false,
            [TableFields.reference] : {
                type : mongoose.Schema.Types.ObjectId,
                ref : TableNames.User,
            },
        },
        [TableFields.review] : {
            type : String,
            trim : true,
            required : [true, ValidationMsgs.ReviewEmpty]
        },
        [TableFields.rating] : {
            type : Number,
            required : [true, ValidationMsgs.RatingEmpty]
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

const ReviewRating = mongoose.model(TableNames.ReviewRating, reviewRatingSchema);
module.exports = ReviewRating;