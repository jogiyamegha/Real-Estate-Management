const jwt = require("jsonwebtoken");
const { ValidationMsgs, TableFields, TableNames, InterfaceTypes, ResponseStatus, AuthTypes, UserTypes} = require("../utils/constants")
const Util = require("../utils/util");
const ValidationError = require("../utils/ValidationError");
const AgentService = require("../db/services/AgentService");

const auth = async (req, res, next) => {
    try {
        const headerToken = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(headerToken, process.env.JWT_AGENT_PK);
        const agent = await AgentService.getUserByIdAndToken(decoded[TableFields.ID], headerToken)
        .withBasicInfo()
        .withVerified()
        .execute();

       
        if(!agent) {
            throw new ValidationError();
        }

        if(agent[TableFields.verified] == true){
            req.user = agent;
            req.user[TableFields.userType] = UserTypes.Agent;
            req.user[TableFields.authType] = AuthTypes.Agent;
            req.user[TableFields.interface] = decoded[TableFields.interface] || InterfaceTypes.Agent.AgentWeb;
            next();
        } else {
            res.status(ResponseStatus.Unauthorized).send(Util.getErrorMessageFromString(ValidationMsgs.AuthFail))
        }
    } catch (e) {
        if( !(e instanceof ValidationError)){
            console.log(e);
        }
        //Error due to :
        // - No token in header OR
        // - Token not exists in the database
        res.status(ResponseStatus.Unauthorized).send(Util.getErrorMessageFromString(ValidationMsgs.AuthFail));
    }
};
module.exports = auth;