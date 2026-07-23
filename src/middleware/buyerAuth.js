const jwt = require("jsonwebtoken");
const { ValidationMsgs, TableFields, TableNames, InterfaceTypes, ResponseStatus, AuthTypes, UserTypes} = require("../utils/constants")
const Util = require("../utils/util");
const ValidationError = require("../utils/ValidationError");
const BuyerService = require("../db/services/BuyerService");

const auth = async (req, res, next) => {
    try {        
        const headerToken = req.header("Authorization").replace("Bearer ", "");
      
        const decoded = jwt.verify(headerToken, process.env.JWT_BUYER_PK);

        
        const buyer = await BuyerService.getUserByIdAndToken(decoded[TableFields.ID], headerToken)
        .withBasicInfo()
        .withApproved()
        .execute();


        if(!buyer) {
            throw new ValidationError();
        }

        if(buyer[TableFields.approved] == true){
            req.user = buyer;
            req.user[TableFields.userType] = UserTypes.Buyer;
            req.user[TableFields.authType] = AuthTypes.Buyer;
            req.user[TableFields.interface] = decoded[TableFields.interface] || InterfaceTypes.Buyer.BuyerWeb;
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