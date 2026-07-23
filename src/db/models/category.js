const mongoose = require("mongoose");
const { TableFields, TableNames, ValidationMsgs} = require("../../utils/constants");

const categorySchema = new mongoose.Schema( 
    {
        [TableFields.name_] : {
            type : String,
            required : [ true, ValidationMsgs.CategoryNameEmpty]
        },
        [TableFields.deleted] : {
            type : Boolean,
            default : false,
        },
        [TableFields._createdAt]: {
            type: Date,
            default: Date.now,
        },
        [TableFields._updatedAt]: {
            type: Date,
            default: Date.now,
        },
        [TableFields._deletedAt]: {
            type: Date,
        },
    },
     {
        timestamps : true,
        toJSON : {
            transform : function(doc, ret){
                delete ret.createdAt;
                delete ret.updatedAt;
                delete ret.__v;
            },
        },
    }
)

const Category = mongoose.model(TableNames.Category, categorySchema);
module.exports = Category;