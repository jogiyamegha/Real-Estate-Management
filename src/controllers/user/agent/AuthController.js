const AgentService = require("../../../db/services/AgentService");
const {TableFields, ValidationMsgs, InterfaceTypes} = require("../../../utils/constants");
const ValidationError = require("../../../utils/ValidationError");
const Util = require("../../../utils/util");

exports.addAgentUser = async (req) => {
        await AgentService.insertUserRecord(req.body);

        let email = req.body[TableFields.email];
        email = (email + "").trim().toLowerCase();
        let user = await AgentService.findByEmail(email).withPassword().withUserType().withBasicInfo().execute();

        const token = user.createAuthToken(InterfaceTypes.Agent.AgentWeb);
        await AgentService.saveAuthToken(user[TableFields.ID], token);
        console.log("signUp successfully!");
        return {user, token};
}

exports.login = async (req) => {
    let email = req.body[TableFields.email];
    if(!email) throw new ValidationError(ValidationMsgs.EmailEmpty);
    email = (email + "").trim().toLowerCase();

    const password = req.body[TableFields.password];
    if(!password) throw new ValidationError(ValidationMsgs.PasswordEmpty);

    let user = await AgentService.findByEmail(email)
    .withPassword()
    .withUserType()
    .withBasicInfo()
    .execute();

    if(user && (await user[TableFields.verified] == false)) {
        throw new ValidationError(ValidationMsgs.VerifiedFalse)
    }

    if(user && (await user[TableFields.deleted] == true)) {
        throw new ValidationError(ValidationMsgs.UserIsDeleted);
    }

    if(user && (await user.isValidAuth(password)) && user[TableFields.isActive]){
        const token = user.createAuthToken(InterfaceTypes.Agent.AgentWeb);
        await AgentService.saveAuthToken(user[TableFields.ID], token);
        console.log("Login Successfully!");
        return { user, token };
    } else throw new ValidationError(ValidationMsgs.UnableToLogin);
}

exports.logout = async(req) => {
    const headerToken = req.header("Authorization").replace("Bearer ", "");
    AgentService.removeAuth(req.user[TableFields.ID], headerToken);
}