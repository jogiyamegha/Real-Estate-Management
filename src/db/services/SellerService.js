const {TableFields, ValidationMsgs, UserTypes, TableNames} = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const Seller = require("../models/seller");
const Property = require("../models/property");
const { MongoUtil } = require("../mongoose");

class SellerService {
    static findByEmail = (email) => {
        return new ProjectionBuilder(async function () {
            return await Seller.findOne({email}, this);
        })
    };

    static recordExists = async (recordId) => {
        return await Seller.exists({
            [TableFields.ID] : MongoUtil.toObjectId(recordId)
        })
    }

    static hardDelete = async (recordId) => {
        await Seller.findByIdAndDelete(recordId);
        const userId = await Property.find({[TableFields.addedBy + "." + TableFields.reference] : recordId})
        await Property.findByIdAndDelete(userId)
    }

    static saveAuthToken = async (userId, token) => {
        await Seller.updateOne(
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
            return await Seller.findOne({[TableFields.ID]: userId}, this);
        });
    };

    static getUserByEmail = (email) => {
        return new ProjectionBuilder(async function() {
            return await Seller.findOne({[TableFields.email] : email}, this);
        })
    };

    static getUserByIdAndToken = (userId, token, lean = false) => {
        return new ProjectionBuilder(async function() {
            return await Seller.findOne(
                {
                    [TableFields.ID] : userId,
                    [TableFields.tokens + "." + TableFields.token] : token,
                },
                this
            ).lean(lean);
        });
    };

    static existsWithEmail = async (email, exceptionId) => {
        return await Seller.exists({
            [TableFields.email] : email,
            ...(exceptionId 
                ? {
                    [TableFields.ID] : {$ne : exceptionId}
                  }
                : {} ),
        });
    };

    static updateSellerActiveness = async (recordId, activeStatus) => {
        await Seller.updateOne(
            {
                [TableFields.ID]: MongoUtil.toObjectId(recordId),
            },
            {
                [TableFields.isActive]: activeStatus,
            }
        )
    }

    static insertUserRecord = async (reqBody) =>{
        let email = reqBody[TableFields.email];
        email = (email + "").trim().toLocaleLowerCase();
        const password = reqBody[TableFields.password];

        if(!email) throw new ValidationError(ValidationMsgs.EmailEmpty);
        if(!password) throw new ValidationError(ValidationMsgs.PasswordEmpty);
        if(email == password) throw new ValidationError(ValidationMsgs.PasswordInvalid);

        if(await SellerService.existsWithEmail(email)) throw new ValidationError(ValidationMsgs.DuplicateEmail);

        const user = new Seller(reqBody);
        user[TableFields.approved] = true;
        user[TableFields.userType] = UserTypes.Seller;
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

    static listAllSellers = ( filter = {}) => {
        return new ProjectionBuilder(async function() {
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
                needCount ? Seller.countDocuments(searchQuery) : undefined,
                Seller.find(searchQuery, this)
                .limit(parseInt(limit))
                .skip(parseInt(skip))
                .sort({[sortKey] : parseInt(sortOrder)}),
            ]).then(([total, records]) => ({total, records}));
        })
    }

    static removeAuth = async ( sellerId, authToken ) => {
        await Seller.updateOne(
            {
                [TableFields.ID] : sellerId,
            },
            {
                 $pull: {
                    [TableFields.tokens]: {[TableFields.token]: authToken},
                },
            }
        )
    }

    static deleteMyReferences = async (tableName, deleteRecordIds) => {
        let recordsList = [];
        let projection = {[TableFields.ID]: 1};

        switch (tableName) {
            case TableNames.Seller:
                recordsList = await Seller.find(
                    {
                        [TableFields.ID]: {$in: deleteRecordIds},
                    },
                    projection
                );
                break;
            default:
                break;
        }

        if (recordsList.length) {
            let ids = [];
            recordsList.forEach((a) => {
                ids.push(a[TableFields.ID]);
            });

            await Seller.deleteMany({
                [TableFields.ID]: {$in: ids},
            });
        }
    };
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
        this.withActiveStatus = () => {
            projection[TableFields.isActive] = 1;
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

module.exports = SellerService;
