const SellerService = require("../../db/services/SellerService");
const {
    TableFields,
    ValidationMsgs,
    UserTypes,
    AuthTypes,
    TableNames,
    RequiredFields,
} = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");

exports.listAllSellers = async (req) => {
    return await SellerService.listAllSellers({
        ...req.query
    }).withBasicInfo().execute();
}

exports.deleteSeller = async (req) => {
    const recordId = req.params[TableFields.ID];
    if(!(await SellerService.recordExists(recordId))){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }
    
    await SellerService.hardDelete(recordId);
}

exports.activateDeactivateSeller = async (req) => {
    const recordId = req.params[TableFields.ID];
    const user = await SellerService.getUserById(recordId).withActiveStatus().execute();
    const activeStatus = user[TableFields.isActive];
    await SellerService.updateSellerActiveness(recordId, !activeStatus);
}

