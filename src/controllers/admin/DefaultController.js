const fs = require("fs");
var path = require("path");
const { InterfaceTypes, ValidationMsgs } = require("../../utils/constants");
const {UserAppSettingsService} = require("../../db/services/DefaultConfigService");
const ValidationError = require("../../utils/ValidationError");

exports.getPrivacyPolicy = async function (req) {
    var filePath = path.join(__dirname, "../../", "storage/cms", "privacyPolicy.txt");

    let pagecontent = "";
    if(fs.existsSync(filePath)) {
        pagecontent = fs.readFileSync(filePath, "utf8");
    }
    return pagecontent;
};

exports.getAboutUs = async function (req) {
    var filePath = path.join(__dirname, "../../", "storage/cms", "aboutUs.txt");

    let pagecontent = "";
    if (fs.existsSync(filePath)) {
        pagecontent = fs.readFileSync(filePath, "utf8");
    }
    return pagecontent;
};

exports.getTermsAndConditions = async function (req) {
    var filePath = path.join(__dirname, "../../", "storage/cms", "termsAndConditions.txt");

    let pagecontent = "";
    if (fs.existsSync(filePath)) {
        pagecontent = fs.readFileSync(filePath, "utf8");
    }
    return pagecontent;
};

exports.editAboutUs = async function (req, res) {
    try {
        var filePath = path.join(__dirname, "../../", "storage/cms", "aboutUs.txt");

        if (fs.existsSync(filePath)) {
            fs.writeFile(filePath, req.body.content, function (err) {
                if (err) throw err;
            });
        } else {
            fs.writeFile(filePath, req.body.content, function (err) {
                if (err) throw err;
            });
        }
    } catch (error) {
        throw new error();
    }
};

exports.editPrivacyPolicy = async function (req, res) {
    try {
        var filePath = path.join(__dirname, "../../", "storage/cms", "privacyPolicy.txt");

        if (fs.existsSync(filePath)) {
            fs.writeFile(filePath, req.body.content, function (err) {
                if (err) throw err;
            });
        } else {
            fs.writeFile(filePath, req.body.content, function (err) {
                if (err) throw err;
            });
        }
    } catch (error) {
        throw new error();
    }
};

exports.editTermsAndConditions = async function (req, res) {
    try {
        var filePath = path.join(__dirname, "../../", "storage/cms", "termsAndConditions.txt");

        if (fs.existsSync(filePath)) {
            fs.writeFile(filePath, req.body.content, function (err) {
                if (err) throw err;
            });
        } else {
            fs.writeFile(filePath, req.body.content, function (err) {
                if (err) throw err;
            });
        }
    } catch (error) {
        throw new error();
    }
};


exports.updateAppSettings = async (req) => {
    let interface = req.body.interface;
    if(interface == InterfaceTypes.Buyer.BuyerWeb || interface == InterfaceTypes.Agent.AgentWeb || InterfaceTypes.Seller.SellerWeb) {
        return await UserAppSettingsService.updateUserAppSettings(req.body).execute();
    } else {
        throw new ValidationError(ValidationMsgs.ParametersError)
    }
}

exports.getAppSettings = async (req) => {
    let interfaceType = req.query.interface;
    let record;
    if(interfaceType == InterfaceTypes.Buyer.BuyerWeb || interfaceType == InterfaceTypes.Agent.AgentWeb || interfaceType == InterfaceTypes.Seller.SellerWeb) {
        record = await UserAppSettingsService.getUserAppSettings().withAndroid().withIOS().execute();
        if(!record) {
            record = await UserAppSettingsService.updateUserAppSettings().withAndroid().withIOS().execute();
        }
    } else {
        throw new ValidationError(ValidationMsgs.ParametersError);
    }
    return record;
}