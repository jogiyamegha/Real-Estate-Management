const mongoose = require("mongoose");
const { TableFields, TableNames, ValidationMsgs} = require("../../utils/constants");

const inquirySchema = new mongoose.Schema( 
    {
        [TableFields.associatedUser] : {
            [TableFields.ID] : false,
            [TableFields.reference] : {
                type : mongoose.Schema.Types.ObjectId,
                ref : TableNames.User,
            },
        },
        [TableFields.associatedProperty] : {
            [TableFields.ID] : false,
            [TableFields.reference] : {
                type : mongoose.Schema.Types.ObjectId,
                ref : TableNames.Property,
            },
        },
        [TableFields.message] : {
            type : String,
            required : [true, ValidationMsgs.InquiryMsgEmpty]
        },
        [TableFields.inquiryReplyStatus] : { 
            type : Boolean,
            default : false
        },
        [TableFields.inquiryReply]: [
            {
                [TableFields.ID] : false,
                [TableFields.reply] : {
                    type : String,
                    trim : true,
                }
            }
        ],
        [TableFields.repliedUser] : {
            type : mongoose.Schema.Types.ObjectId,
            // default : null
        },
        [TableFields.repliedUserName] : {

        },
        [TableFields.repliedUserEmail] : {
            type : String
        }
    },
    {
        timestamps : true,
        toJSON : {
            transform : function(val, ret) {
                delete ret.createdAt;
                delete ret.updatedAt;
                delete ret.__v;
            }
        }
    }
)


inquirySchema.methods.addInquiryReply = async function(replyMsg, inquiry){
    const replyObject = {
        [TableFields.reply] : replyMsg.trim()
    }

    inquiry[TableFields.inquiryReply].push(replyObject);

    await inquiry.save();
    console.log("reply added");
}

const Inquiry = mongoose.model(TableNames.Inquiry, inquirySchema);

module.exports = Inquiry;