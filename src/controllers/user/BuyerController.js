const BuyerService = require("../../db/services/BuyerService");
const {
    TableFields,
    ValidationMsgs,
    UserTypes,
    AuthTypes,
    TableNames,
    RequiredFields,
} = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const ServiceManager = require("../../db/serviceManager");
const {MongoUtil} = require("../../db/mongoose");
const Util = require("../../utils/util");

exports.listAllBuyers = async(req) => {
    return await BuyerService.listAllBuyers({
        ...req.query
    }).withBasicInfo().execute();
}

exports.deleteBuyer = async (req) => {
    const recordId = req.params[TableFields.ID];

    if(!(await BuyerService.recordExists(recordId))){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }
    const deleteUSer = BuyerService.hardDelete(recordId)
}

exports.activateDeactivateBuyer = async (req) => {
    const recordId = req.params[TableFields.ID];
    const user = await BuyerService.getUserById(recordId).withActiveStatus().execute();
    const activeStatus = user[TableFields.isActive];
    await BuyerService.updateBuyerActiveness(recordId, !activeStatus);
}