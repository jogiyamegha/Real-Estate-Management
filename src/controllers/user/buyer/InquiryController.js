const InquiryService = require("../../../db/services/InquiryService");
const PropertyService = require("../../../db/services/PropertyService");
const ServiceManager = require("../../../db/serviceManager");
const { TableFields, ValidationMsgs, TableNames } = require("../../../utils/constants");
const ValidationError = require("../../../utils/ValidationError");
const { MongoUtil } = require("../../../db/mongoose");

exports.addInquiry = async (req) => {
    const reqBody = req.body;
    const reqUser = req.user;
    const propertyId = reqBody.reference;

    if(!(await PropertyService.recordExists(propertyId))){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    await parseAndValidateInquiry(
        reqBody,
        reqUser,
        undefined,
        async(updatedInquiryFields) => {
            const { createdInquiryRecords } = InquiryService.insertRecord(updatedInquiryFields);
            return createdInquiryRecords;
        }
    )
}

exports.listAllInquiries = async (req) => {
    return await InquiryService.listAllInquiries({
        ...req.query
    }).withBasicInfo()
    .withReply()
    .execute();
}

exports.listAllMyInquiries = async (req) => {
    const reqUser = req.user;
    const userId = reqUser[TableFields.ID];

    const myInquiries = await InquiryService.getMyInquiries(userId).withBasicInfo().withReply().execute();

    if(myInquiries.length === 0){
        return [];
    }
    return myInquiries;
}

exports.deleteInquiry = async (req) => {
    const recordId = req.params[TableFields.ID];
    if(!(await InquiryService.recordExists(recordId))){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    await ServiceManager.cascadeDelete(TableNames.Inquiry, recordId);
}

exports.addInquiryReply = async (req) => {
    const reqBody = req.body;
    const reqUser = req.user;
    const inquiryId = req.params[TableFields.ID];
    
    console.log(reqUser[TableFields.ID]);
    
    const inquiryExists = await InquiryService.recordExists(inquiryId);
    if(!inquiryExists) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    const inquiry = await InquiryService.getUserById(inquiryId)
    .withBasicInfo()
    .withReply()
    .execute()

    if(!inquiry){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }
    await inquiry.addInquiryReply(reqBody.reply, inquiry);

    inquiry[TableFields.inquiryReplyStatus] = true;

    console.log(inquiry)
    console.log(inquiry[TableFields.repliedUser]);

    inquiry[TableFields.repliedUser] = reqUser[TableFields.ID];
        
    await inquiry.save()
}

async function parseAndValidateInquiry(
    reqBody,
    reqUser,
    existingInquiry = {},
    onValidationCompleted = async () = {}
){
    const id = MongoUtil.newObjectId();
    if(isFieldEmpty(reqBody[TableFields.message], existingInquiry[TableFields.message])){
        throw new ValidationError(ValidationMsgs.InquiryMsgEmpty);
    }
    try {
        let response = await onValidationCompleted({
            [TableFields.message] : reqBody[TableFields.message],
            [TableFields.inquiryReplyStatus] : reqBody[TableFields.inquiryReplyStatus],
            [TableFields.repliedUser] : reqBody[TableFields.repliedUser],
            [TableFields.repliedUserName] : reqBody[TableFields.repliedUserName],
            [TableFields.repliedUserEmail] : reqBody[TableFields.repliedUserEmail],
            [TableFields.associatedProperty] : {
                [TableFields.reference] : reqBody[TableFields.reference]
            },
            [TableFields.associatedUser] : {
                [TableFields.reference] : reqUser[TableFields.ID]
            }
        })
        return response
    } catch(error) {
        throw error;
    }
}

function isFieldEmpty(providedField, existingField) {
    if (providedField != undefined) {
        return false;
    } else if (existingField) {
        return false;
    }
    return true;
}

