const {DefaultConfigTypes, TableFields} = require("../../utils/constants");
const { UserAppSettings } = require("../models/defaultConfiguration");

class UserAppSettingsService {
    static updateUserAppSettings = (reqBody = {}, lean = false) => {
        return new AppSettingsProjectionBuilder(async function() {
            let populatedFields = this.populate;
            let projectionFields = {
                ...this,
            };
            delete projectionFields.populate;
            return await UserAppSettings.findOneAndUpdate(
                {
                    [TableFields.type] : DefaultConfigTypes.userAppSettings,
                },
                {
                    [TableFields.androidVersion] : reqBody[TableFields.androidVersion],
                    [TableFields.iOSVersion] : reqBody[TableFields.iOSVersion],
                    [TableFields.androidForceUpdate]: reqBody[TableFields.androidForceUpdate],
                    [TableFields.iOSForceUpdate]: reqBody[TableFields.iOSForceUpdate],
                    [TableFields.androidUnderMaintenance]: reqBody[TableFields.androidUnderMaintenance],
                    [TableFields.iOSUnderMaintenance]: reqBody[TableFields.iOSUnderMaintenance],
                },
                {
                    runValidators : true,
                    upsert : true,
                    projection : projectionFields,
                    new : true
                }
            )
            .lean(lean)
            .populate(populatedFields);
        })
    };

    static getUserAppSettings = (lean = false) => {
        return new AppSettingsProjectionBuilder(async function() {
            let populateFields = this.populate;
            let projectionFields = {
                ...this,
            };
            delete projectionFields.populate;
            return await UserAppSettings.findOne(
                {
                    [TableFields.type] : DefaultConfigTypes.userAppSettings,
                },
                projectionFields
            ) 
            .lean(lean)
            .populate(populateFields);
        });
    };
}

const AppSettingsProjectionBuilder = class {
    constructor(methodToExecute){
        const projection = {};
        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        };
        this.withAndroid = () => {
            projection[TableFields.androidForceUpdate] = 1;
            projection[TableFields.androidUnderMaintenance] = 1;
            projection[TableFields.androidVersion] = 1;

            return this;
        };
        this.withIOS = () => {
            projection[TableFields.iOSVersion] = 1;
            projection[TableFields.iOSForceUpdate] = 1;
            projection[TableFields.iOSUnderMaintenance] = 1;
            return this;
        };
        this.execute = async () => {
            return await methodToExecute.call(projection);
        };
    }
};

module.exports = { UserAppSettingsService };