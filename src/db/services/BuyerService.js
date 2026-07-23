const {TableFields, ValidationMsgs, UserTypes, TableNames, DefaultConfigTypes} = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const Booking = require("../models/booking");
const Buyer = require("../models/buyer");
const Inquiry = require("../models/inquiry");
const Property = require("../models/property");
const {UserAppSettings} = require("../models/defaultConfiguration");
const { MongoUtil } = require("../mongoose");

class BuyerService {

    static getPropertyExists = async (property, user) => {
        const i = user[TableFields.favorites][TableFields.property]
    }

    static findByEmail = (email) => {
        return new ProjectionBuilder(async function () {
            return await Buyer.findOne({email}, this);
        })
    };

    static recordExists = async (recordId) => {
        return await Buyer.exists({
            [TableFields.ID] : MongoUtil.toObjectId(recordId)
        });
    }

    static hardDelete = async (recordId) => {
        await Buyer.findByIdAndDelete(recordId);

        const bookingId = await Booking.find({[TableFields.associatedUser + "." + TableFields.reference] : recordId});
        await Booking.findByIdAndDelete(bookingId);

        const inquiryId = await Inquiry.find({[TableFields.associatedUser + "." + TableFields.reference] : recordId});
        await Inquiry.findByIdAndDelete(inquiryId);
    }

    static saveAuthToken = async (userId, token) => {
        await Buyer.updateOne(
            {
                [TableFields.ID] : userId
            },
            {
                $push : {
                    [TableFields.tokens] : { 
                        [TableFields.token] : token
                    }
                }
            }
        )
    };

    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await Buyer.findOne({[TableFields.ID]: userId}, this);
        });
    };

    static getUserByEmail = (email) => {
        return new ProjectionBuilder(async function() {
            return await Buyer.findOne({[TableFields.email] : email}, this);
        })
    };

    static getUserByIdAndToken = (userId, token, lean = false) => {
        return new ProjectionBuilder(async function() {
            
            return await Buyer.findOne(
                {
                    [TableFields.ID] : userId,
                    [TableFields.tokens + "." + TableFields.token] : token,
                },
                this
            ).lean(lean);
        });
    };

    static existsWithEmail = async (email, exceptionId) => {
        return await Buyer.exists({
            [TableFields.email] : email,
            ...(exceptionId 
                ? {
                    [TableFields.ID] : {$ne : exceptionId}
                  }
                : {} ),
        });
    };

    static insertUserRecord = async (reqBody) =>{
        let email = reqBody[TableFields.email];
        email = (email + "").trim().toLocaleLowerCase();
        const password = reqBody[TableFields.password];

        if(!email) throw new ValidationError(ValidationMsgs.EmailEmpty);
        if(!password) throw new ValidationError(ValidationMsgs.PasswordEmpty);
        if(email == password) throw new ValidationError(ValidationMsgs.PasswordInvalid);

        if(await BuyerService.existsWithEmail(email)) throw new ValidationError(ValidationMsgs.DuplicateEmail);

        const user = new Buyer(reqBody);
        user[TableFields.approved] = true;
        user[TableFields.userType] = UserTypes.Buyer;
        if(!user.isValidPassword(password)){
            throw new ValidationError(ValidationMsgs.PasswordInvalid);
        }
        try {
            await user.save();
            return user;
        } catch (error) {
            if(error.code == 11000){
                //Mongoose duplicate email error
                throw new ValidationError(ValidationMsgs.DuplicateEmail);
            }
            throw error;
        }
    }

    static listAllBuyers = ( filter = {}) => {
        return new ProjectionBuilder(async function () {
            let limit = filter.limit || 0;
            let skip = filter.skip || 0;
            let sortKey = filter.sortKey || TableFields._createdAt;
            let sortOrder = filter.sortOrder || 1;
            let needCount = Util.parseBoolean(filter.needCount);
            let searchQuery = {};

            let searchTerm = filter.searchTerm;
            if(searchTerm) {
                searchQuery = {
                    [TableFields.name_] : {
                        $regex : Util.wrapWithRegexQry(searchTerm),
                        $options : "i",
                    }
                }
            }

            return await Promise.all([
                needCount ? Buyer.countDocuments(searchQuery) : undefined,
                Buyer.find(searchQuery, this)
                .limit(parseInt(limit))
                .skip(parseInt(skip))
                .sort({[sortKey] : parseInt(sortOrder)}),
            ]).then(([total, records]) => ({total, records}));
        })
    }

    static removeAuth = async ( buyerId, authToken ) => {
        await Buyer.updateOne(
            {
                [TableFields.ID] : buyerId,
            },
            {
                $pull: {
                    [TableFields.tokens]: {[TableFields.token]: authToken},
                },
            }
        )
    }

    static updateBuyerActiveness = async (recordId, activeStatus) => {
        await Buyer.updateOne(
            {
                [TableFields.ID]: MongoUtil.toObjectId(recordId),
            },
            {
                [TableFields.isActive]: activeStatus,
            }
        )
    }

    static getUserAppSettings = (lean = false) => {
        return new AppSettingsProjectionBuilder(async function () {
            let populateFields = this.populate;
            let projectionFields = {
                ...this,
            };
            delete projectionFields.populate;
            return await UserAppSettings.findOne(
                {
                    [TableFields.type]: DefaultConfigTypes.userAppSettings,
                },
                projectionFields
            )
            .lean(lean)
            .populate(populateFields);
        })
    }

    static deleteMyReferences = async (cascadeDeleteMethodReference, tableName, ...referenceId) => {
        let records = undefined;
        console.log("in buyer service",cascadeDeleteMethodReference, tableName, ...referenceId);
        switch(tableName) {
            case TableNames.Buyer : 
            records = await Buyer.find({
                [TableFields.ID] : {
                    $in : referenceId,
                },
            });
            console.log("in buyer switch case");
                break;
        }
        if(records && records.length > 0 ){
            let deletedRecordIds = records.map( (a) => a[TableFields.ID]);
            await Buyer.updateMany(
                {
                    [TableFields.ID] : {
                        $in : deletedRecordIds,
                    },
                },
                {
                    $set : {[TableFields.deleted] : true},
                    $unset : { token : ''}
                }
            );
            if(tableName != TableNames.Buyer) {
                cascadeDeleteMethodReference.call(
                    {
                        ignoreSelfCall : true,
                    },
                    TableNames.Buyer,
                    ...deletedRecordIds
                );
            }
        }
    }
}

const ProjectionBuilder = class {
    constructor(methodToExecute) {
        const projection =  {};
        this.withBasicInfo = () => {
            projection[TableFields.name_] = 1;
            projection[TableFields.ID] = 1;
            projection[TableFields.email] = 1;
            projection[TableFields.userType] = 1;
            projection[TableFields.isActive] = 1;
            projection[TableFields.favorites] = 1;
            return this; 
        };
        this.withPassword = () =>{
            projection[TableFields.password] = 1;
            return this;
        }
        this.withEmail = () => {
            projection[TableFields.email] = 1;
            return this;
        }
        this.withUserType = () => {
            projection[TableFields.userType] = 1;
            return this;
        }
        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        }
        this.withActiveStatus = () => {
            projection[TableFields.isActive] = 1;
            return this;
        }
        this.withApproved = () => {
            projection[TableFields.approved] = 1;
            return this;
        }
        this.withName = () => {
            projection[TableFields.name_] = 1;
            return this;
        };
        this.withPasswordResetToken = () => {
            projection[TableFields.passwordResetToken] = 1;
            return this;
        };
        this.execute = async () => {
            return await methodToExecute.call(projection);
        }

    }
}

const AppSettingsProjectionBuilder = class {
    constructor(methodToExecute) {
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

module.exports = BuyerService;
