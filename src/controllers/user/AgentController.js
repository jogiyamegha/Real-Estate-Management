const AgentService = require("../../db/services/AgentService");
const {
    TableFields,
    ValidationMsgs,
} = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");

exports.listAllAgents = async (req) => {
    return AgentService.listAllAgents({
        ...req.query
    }).withBasicInfo().execute();
}

exports.deleteAgent = async (req) => {
    const recordId = req.params[TableFields.ID];

    const agentExists = await AgentService.recordExists(recordId);
    if(!agentExists){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }
    const deleteUSer = await AgentService.hardDelete(recordId)
}

exports.updateAgentVerification = async (req) => {
    const recordId = req.params[TableFields.ID];
    const user = await AgentService.getUserById(recordId).withVerified().execute();
    const verifyStatus = user[TableFields.verified];
    await AgentService.updateAgentVerifiedStatus(recordId, !verifyStatus);
}

exports.activateDeactivateAgent = async (req) => {
    const recordId = req.params[TableFields.ID];
    const user = await AgentService.getUserById(recordId).withActiveStatus().execute();
    const activeStatus = user[TableFields.isActive];
    await AgentService.updateAgentActiveness(recordId, !activeStatus);
}