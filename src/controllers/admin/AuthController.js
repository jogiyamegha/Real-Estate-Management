const AdminService = require("../../db/services/AdminService");
const CategoryService = require("../../db/services/CategoryService");
const PropertyService = require("../../db/services/PropertyService");
const { InterfaceTypes, TableFields, ValidationMsgs } = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");

exports.addAdminUser = async (req) => {
    if(Util.parseBoolean(req.headers.dbuser)) {
        await AdminService.insertUserRecord(req.body);

        let email = req.body[TableFields.email];
        email = (email + "").trim().toLowerCase();
        let user = await AdminService.findByEmail(email).withPassword().withUserType().withBasicInfo().execute();

        const token = user.createAuthToken(InterfaceTypes.Admin.AdminWeb);
        await AdminService.saveAuthToken(user[TableFields.ID], token);
        return {user, token};
    } else {
        throw new ValidationError(ValidationMsgs.NotAllowed);
    }
}

exports.login = async (req) => {
    console.log("reqBody", req.body);
    let email = req.body[TableFields.email];
    if(!email) throw new ValidationError(ValidationMsgs.EmailEmpty);
    email = (email + "").trim().toLowerCase();

    const password = req.body[TableFields.password];
    if(!password) throw new ValidationError(ValidationMsgs.PasswordEmpty);

    let user = await AdminService.findByEmail(email).withPassword().withUserType().withBasicInfo().execute();
    if(user && (await user.isValidAuth(password))){
        const token = user.createAuthToken(InterfaceTypes.Admin.AdminWeb);
        await AdminService.saveAuthToken(user[TableFields.ID], token);
        console.log("Login Successfully!");
        return { user, token};
    } else throw new ValidationError(ValidationMsgs.UnableToLogin);
}

exports.getDashboardData = async () => {
    const categories = await CategoryService.listAllCategories().withId().execute();
    const properties = await PropertyService.listAllProperty().withId().execute();
    const availableProperties = await PropertyService.listAllProperty(
        {
            [TableFields.availability] : true
        }
    ).withId().execute();
    return {
        totalCategoryCount : categories?.records?.length,
        totalPropertyCount : properties?.records?.length,
        availablePropertyCount : availableProperties?.records?.length,
    }
}

exports.logout = async(req) => {
    const headerToken = req.header("Authorization").replace("Bearer ", "");
    AdminService.removeAuth(req.user[TableFields.ID], headerToken);
}