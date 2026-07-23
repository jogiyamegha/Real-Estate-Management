const jwt = require("jsonwebtoken");
const { ValidationMsgs, TableFields, TableNames, InterfaceTypes, ResponseStatus, AuthTypes, UserTypes} = require("../utils/constants")
const Util = require("../utils/util");
const ValidationError = require("../utils/ValidationError");
const SellerService = require("../db/services/SellerService");

const auth = async (req, res, next) => {
    try {
        const headerToken = req.header("Authorization").replace("Bearer ", "");
        const decoded = jwt.verify(headerToken, process.env.JWT_SELLER_PK);
        const seller = await SellerService.getUserByIdAndToken(decoded[TableFields.ID], headerToken)
        .withBasicInfo()
        .withApproved()
        .execute();

        if(!seller) {
            throw new ValidationError();
        }

        if(seller[TableFields.approved] == true){
            req.user = seller;
            req.user[TableFields.userType] = UserTypes.Seller;
            req.user[TableFields.authType] = AuthTypes.Seller;
            req.user[TableFields.interface] = decoded[TableFields.interface] || InterfaceTypes.Seller.SellerWeb;
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