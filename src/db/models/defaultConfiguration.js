const mongoose = require("mongoose");
const {TableFields, TableNames, DefaultConfigTypes} = require("../../utils/constants");

const userAppSettingsSchema = new mongoose.Schema({
    _id : false,
    [TableFields.iOSVersion] : {
        type : String,
        trim : true,
    },
    [TableFields.androidVersion] : {
        type : String,
        trim : true,
    },
    [TableFields.iOSUnderMaintenance] : {
        type : Boolean,
        default : false,
    },
    [TableFields.androidUnderMaintenance] : {
        type : Boolean,
        default : false,
    },
    [TableFields.iOSForceUpdate] : {
        type : Boolean,
        default : false
    },
    [TableFields.androidForceUpdate] : {
        type : Boolean,
        default : false
    },
});

const defaultConfigSchema = new mongoose.Schema(
    {},
    {
        timestamps : true,
        discriminatorKey : TableFields.type
    }
);

defaultConfigSchema.index({[TableFields.type] : 1});

const DefaultConfigRoot = mongoose.model(TableNames.DefaultConfiguration, defaultConfigSchema);

const UserAppSettings = DefaultConfigRoot.discriminator(
    DefaultConfigTypes.userAppSettings,
    userAppSettingsSchema
);

module.exports = {
    DefaultConfigRoot,
    UserAppSettings
}
