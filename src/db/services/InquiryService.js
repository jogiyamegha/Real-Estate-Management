const {ValidationMsgs, TableFields, TableNames} = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const Inquiry = require("../models/inquiry");
const Property = require("../models/property");
const {MongoUtil} = require("../mongoose");

class InquiryService {
    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await Inquiry.findOne({[TableFields.ID]: userId}, this);
        });
    };
    
    static recordExists = async (recordId) => {
        return await Inquiry.exists({
            [TableFields.ID] : MongoUtil.toObjectId(recordId)
        })
    }

    static propertyExistsInInquiry = async (recordId) => {
        return (await Inquiry.exists({
            [TableFields.associatedProperty + "." + TableFields.reference] : recordId
        }))
            ? true
            : false
    }

    static listAllInquiries = (filter = {}) => {
        return new ProjectionBuilder(async function () {
            let limit = filter.limit || 0;
            let skip = filter.skip || 0;
            let sortKey = filter.shortKey || TableFields._createdAt;
            let sortOrder = filter.sortOrder || 1;
            let needCount = Util.parseBoolean(filter.needCount);
            let searchQuery = {};

            let searchTerm = filter.searchTerm;
            if(searchTerm){
                searchQuery = {
                    [TableFields.name_] : {
                        $regex : Util.wrapWithRegexQry(searchTerm),
                        $options : "i",
                    }
                }
            }
            return await Promise.all([
                needCount ? Inquiry.countDocuments(searchQuery) : undefined,
                Inquiry.find(searchQuery, this)
                .limit(parseInt(limit))
                .skip(parseInt(skip))
                .sort({[sortKey] : parseInt(sortOrder)}),
            ]).then(([total, records]) => ({total, records})); 
        });
    };

    static getMyInquiries =  (userId) => {
        return new ProjectionBuilder(async function() {
            const inquiries = await Inquiry.find({[`${TableFields.associatedUser}.${TableFields.reference}`] : userId});
            return inquiries;
        })
    }

    static insertRecord = async (updatedInquiryFields = {}) => {
        const inquiry = new Inquiry({
            ...updatedInquiryFields,
        })
        let error = inquiry.validateSync();
        if(error) {
            throw error;
        } else {
        let createdInquiryRecords = undefined;
            try {
                let createdInquiryRecords = await inquiry.save();
                return { createdInquiryRecords };
            } catch (e) {
                if(createdInquiryRecords) {
                    await createdInquiryRecords.delete();
                }
                throw e;
            }
        }
    }

    static deleteMyReferences = async (cascadeDeleteMethodReference, tableName, ...referenceId) => {
        let records = undefined;
        switch(tableName) {
            case TableNames.Inquiry :
                records = await Inquiry.find({
                    [TableFields.ID] : {
                        $in : referenceId
                    }
                });

                break;
        }
        if(records && records.length > 0){
            let deletedRecordIds = records.map((a) => a[TableFields.ID]);
            await Inquiry.deleteMany({
                [TableFields.ID] : {
                    $in: deletedRecordIds
                }
            });

            if(tableName != TableNames.Inquiry){
                //it means that the above objects are deleted on request from model's references(And not from model itself)
                cascadeDeleteMethodReference.call(
                    {
                        ignoreSelfCall : true
                    },
                    TableNames.Inquiry,
                    ...deletedRecordIds
                );
            }
        }
    }
}

const ProjectionBuilder = class {
    constructor(methodToExecute) {
        // const projection = {
        //     populate : {},
        // };

        const projection = {};
        this.withBasicInfo = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.message] = 1;
            projection[TableFields.associatedProperty] = 1;
            projection[TableFields.associatedUser] = 1;
            projection[TableFields.inquiryReply] = 1;
            projection[TableFields.inquiryReplyStatus] = 1;
            projection[TableFields.repliedUser] = 1;
            projection[TableFields.repliedUserName] = 1;
            projection[TableFields.repliedUserEmail] = 1;
            return this;
        }
      
        this.withReply = () => {
            projection[TableFields.inquiryReply] = 1;
            return this;
        }
        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        }
        const putInPopulate = (path, selection, model, deepPopulateObj) => {
            if (projection.populate[path]) {
                let existingRecord = projection.populate[path];
                existingRecord.select += " " + selection
                projection.populate[path] = existingRecord
            } else {
                projection.populate[path] = { path: path, select: selection, model, populate: deepPopulateObj }
            }
        }
        this.execute = async() =>{
            return await methodToExecute.call(projection);
        }
        // this.execute = async () => {
        //     if (Object.keys(projection.populate) == 0) {
        //         delete projection.populate
        //     } else {
        //         projection.populate = Object.values(projection.populate)
        //     }
        //     return await methodToExecute.call(projection)
        // }
    }
}

module.exports = InquiryService;
