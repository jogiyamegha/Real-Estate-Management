const {TableFields, ValidationMsgs, UserTypes, TableNames} = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const Agent = require("../models/agent");
const Property = require("../models/property");
const { MongoUtil } = require("../mongoose");

class AgentService {

    static findByEmail = (email) => {
        return new ProjectionBuilder(async function () {
            return await Agent.findOne({email}, this);
        })
    };

   

    static recordExists = async (recordId) => {
        return await Agent.exists({
            [TableFields.ID] : MongoUtil.toObjectId(recordId)
        })
    }

    static hardDelete = async (recordId) => {
        await Agent.findByIdAndDelete(recordId);
        const userId = await Property.find({[TableFields.addedBy + "." + TableFields.reference] : recordId})
        await Property.findByIdAndDelete(userId)
    }

    static saveAuthToken = async (userId, token) => {
        await Agent.updateOne(
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
            return await Agent.findOne({[TableFields.ID]: userId}, this);
        });
    };

    static getUserByEmail = (email) => {
        return new ProjectionBuilder(async function() {
            return await Agent.findOne({[TableFields.email] : email}, this);
        })
    };

    static getUserByIdAndToken = (userId, token, lean = false) => {
        return new ProjectionBuilder(async function() {
            return await Agent.findOne(
                {
                    [TableFields.ID] : userId,
                    [TableFields.tokens + "." + TableFields.token] : token,
                },
                this
            ).lean(lean);
        });
    };

    static existsWithEmail = async (email, exceptionId) => {
        return await Agent.exists({
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

        if(await AgentService.existsWithEmail(email)) throw new ValidationError(ValidationMsgs.DuplicateEmail);

        const user = new Agent(reqBody);
        user[TableFields.approved] = true;
        user[TableFields.userType] = UserTypes.Agent;
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

    static updateAgentVerifiedStatus = async (recordId, verifyStatus ) => {
        await Agent.updateOne(
            {
                [TableFields.ID] : MongoUtil.toObjectId(recordId),
            },
            {
                [TableFields.verified] : verifyStatus,
            }
        )
    }

    static listAllAgents = ( filter = {}) => {
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
                needCount ? Agent.countDocuments(searchQuery) : undefined,
                Agent.find(searchQuery, this)
                .limit(parseInt(limit))
                .skip(parseInt(skip))
                .sort({[sortKey] : parseInt(sortOrder)}),
            ]).then(([total, records]) => ({total, records}));
        })
    }


    static removeAuth = async ( sellerId, authToken ) => {
        await Agent.updateOne(
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

    static updateAgentActiveness = async (recordId, activeStatus) => {
        await Agent.updateOne(
            {
                [TableFields.ID]: MongoUtil.toObjectId(recordId),
            },
            {
                [TableFields.isActive]: activeStatus,
            }
        )
    }


    static deleteMyReferences = async (tableName, deleteRecordIds) => {
        let recordsList = [];
        let projection = {[TableFields.ID]: 1};

        switch (tableName) {
            case TableNames.Agent:
                recordsList = await Agent.find(
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

            await Agent.deleteMany({
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
            projection[TableFields.verified] = 1;
            return this; 
        };
        this.withPassword = () => {
            projection[TableFields.password] = 1;
            return this;
        }
        this.withActiveStatus = () => {
            projection[TableFields.isActive] = 1;
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
        this.withVerified = () => {
            projection[TableFields.verified] = 1;
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

module.exports = AgentService;