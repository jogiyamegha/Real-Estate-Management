const {ValidationMsgs, TableFields, TableNames} = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const Property = require("../models/property");
const Buyer = require("../models/buyer");
const {MongoUtil} = require("../mongoose");
const CategoryService = require("./CategoryService");

class PropertyService {

    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await Property.findOne({[TableFields.ID]: userId}, this);
        });
    };

    static addProperties = async (recordList = []) => {
        console.log(recordList)
        if(recordList.length === 0){
            throw new ValidationError(ValidationMsgs.NoProperties);
        }
        const bulkWriteQry = await Promise.all(
            recordList.flatMap(async (record) => {
                console.log(record)
                let categoryId = record[TableFields.associatedCategory][TableFields.reference];
                let categoryName = record[TableFields.categoryName];
                let categoryRecord = await CategoryService.getUserById(categoryId)
                .withBasicInfo()
                .execute();

                if(!categoryRecord) {
                    throw new ValidationError(ValidationMsgs.RecordNotFound);
                }

                if(isFieldEmpty(record[TableFields.address])){
                    throw new ValidationError(ValidationMsgs.AddressEmpty);
                }
                if(isFieldEmpty(record[TableFields.landArea])){
                    throw new ValidationError(ValidationMsgs.LandAreaEmpty);
                }
                if(isFieldEmpty(record[TableFields.price])){
                    throw new ValidationError(ValidationMsgs.PriceEmpty);
                }
                if(isFieldEmpty(record[TableFields.rooms])){
                    throw new ValidationError(ValidationMsgs.RoomsEmpty);
                }
                if(isFieldEmpty(record[TableFields.furnishedStatus])){
                    throw new ValidationError(ValidationMsgs.FurnishedStatusEmpty);
                }
                if(isFieldEmpty(record[TableFields.buildDate])){
                    throw new ValidationError(ValidationMsgs.BuildDateEmpty);
                }
                if(isFieldEmpty(record[TableFields.availableSlots])){
                    throw new ValidationError(ValidationMsgs.AvailableSlotsEmpty);
                }
                if(isFieldEmpty(record[TableFields.isFeatured])){
                    throw new ValidationError(ValidationMsgs.isFeaturedEmpty);
                }

                console.log("categoryRecord", categoryRecord)
                let propertyDoc = {
                    [TableFields.addedBy] : record[TableFields.addedBy],
                    [TableFields.associatedCategory] : {
                        [TableFields.reference] : categoryRecord[TableFields.ID],
                        [TableFields.categoryName] : categoryRecord[TableFields.name_]
                    },
                    [TableFields.image] : record[TableFields.image],
                    [TableFields.address] : record[TableFields.address],
                    [TableFields.landArea] : record[TableFields.landArea],
                    [TableFields.price] : record[TableFields.price],
                    [TableFields.rooms] : record[TableFields.rooms],
                    [TableFields.furnishedStatus] : record[TableFields.furnishedStatus],
                    [TableFields.buildDate] : record[TableFields.buildDate],
                    [TableFields.availableSlots] : record[TableFields.availableSlots],
                    [TableFields.isFeatured] : record[TableFields.isFeatured],
                    [TableFields.phoneCountry] : record[TableFields.phoneCountry],
                    [TableFields.phone] : record[TableFields.phone],
                    [TableFields.uniqueId] : record[TableFields.uniqueId]
                }

                console.log("propertyDoc", propertyDoc)
                return {
                    insertOne : {
                        document : propertyDoc,
                    }
                }
            })
        )

        const flattenedBulkWriteQry = bulkWriteQry.flat();
        return await Property.bulkWrite(flattenedBulkWriteQry);
    }

    static getOwnerProperty = (userId) => {
        return new ProjectionBuilder(async function () {
            return await Property.find({ 
               [`${TableFields.addedBy}.${TableFields.reference}`] : userId 
            }, this);
        });
    }
   
    static recordExists = async (recordId) => {
        // console.log(recordId)
        return await Property.exists({
            [TableFields.ID] : MongoUtil.toObjectId(recordId)
        });
    }

    static getPropertyByCategoryId =  (recordId) => {
        return new ProjectionBuilder(async function() {
            return await Property.find({
                [`${TableFields.associatedCategory}.${TableFields.reference}`] : recordId
            })
        })
    }

    static PropertyExistsInCategory = async (recordId) => {
        return (await Property.exists({
            [TableFields.associatedCategory + "." + TableFields.reference] : MongoUtil.toObjectId(recordId),
        })) 
            ? true
            : false
    }
    
    static getMyProperties = async (userId) => {
        const properties = await Property.find({ [`${TableFields.addedBy}.${TableFields.reference}`]: userId});
        return properties;
    }

    static propertyExistsAsFavorites = async (recordId) => {
        const allBuyers = await Buyer.find({[TableFields.favorites] : recordId})
        for(let b of allBuyers){
            await b.removeFromFavorites(recordId)
        }
    }

    static existsWithPhone = async (phone, phoneCountry, exceptionId) => {
        return await Property.exists({
            [TableFields.phone]: phone,
            [TableFields.phoneCountry]: phoneCountry,
            ...(exceptionId
                ? {
                    [TableFields.ID]: {$ne: exceptionId},
                }
                : {}),
            });
    };
        
    static existsWithUniqueId = async (uniqueId, exceptionId) => {
        return (await Property.exists({
            [TableFields.uniqueId] : uniqueId,
            ...( exceptionId
                ? {
                    [TableFields.ID] : { $ne : exceptionId },
                  }
                : {} ),
        }))
            ? true
            : false;
    }

    static insertRecord = async (updatedPropertyFields = {}) => {

        var property = new Property({
            ...updatedPropertyFields,
        })
        
        let error = property.validateSync();
        if(error){
            throw error;
        } else {
            let createdPropertyRecord = undefined;
            try{
                let createdPropertyRecord = await property.save();
                return {createdPropertyRecord};
            } catch (e) {
                if(createdPropertyRecord) {
                    await createdPropertyRecord.delete();
                }
                throw e;
            }
        }
    }

    static getPropertyForImport = (uniqueId) => {
        // return new ProjectionBuilder(async function () {
        //     let populatedFields = this.populate;
        //     let projectionFields = {
        //         ...this,
        //     };
        //     delete projectionFields.populate;
        //     return await Property.findOne(
        //         {
        //             [TableFields.uniqueId] : uniqueId
        //         },
        //         projectionFields
        //     ).populate(populatedFields);
        // });
        return new ProjectionBuilder(async function () {
            return await Property.findOne({[TableFields.uniqueId] : uniqueId})
        })
    };

    static updateRecord = async (recordId, updatedPropertyFields = {}) => {        
        let record = await Property.findByIdAndUpdate(
            MongoUtil.toObjectId(recordId), 
            {
                ...updatedPropertyFields,
                [TableFields._updatedAt] : Date.now()
            },
            {
                new : false, 
                projection : {[TableFields.ID] : 1}
            }
        );

        if(!record) {
            throw new ValidationError(ValidationMsgs.RecordNotFound);
        }
    }

    static updatedPropertyRecord = async (recordId, updatedPropertyFields = {}) => {
        let record = await Property.findByIdAndUpdate(
            recordId,
            {
                ...updatedPropertyFields,
                [TableFields._updatedAt] : Date.now()
            },
            {
                new : false,
                projection : {[TableFields.ID] : 1}
            }
        )
        if(!record){
            throw new ValidationError(ValidationMsgs.RecordNotFound);
        }
    }


    static listAllProperty =  (filter = {}) => {
        return new ProjectionBuilder(async function () {
            let limit = filter.limit || 0;
            let skip = filter.skip || 0;
            let sortKey = filter.sortKey || TableFields._createdAt;
            let sortOrder = filter.sortOrder || -1;
            let needCount = Util.parseBoolean(filter.needCount);
            let searchTerm = filter.searchTerm;
            let startDate = filter.startDate;
            let endDate = filter.endDate;
            let userId = filter.userId;
            let categoryId = filter.categoryId;
            let availability = filter.availability;
            let verified = filter.verified;
            let furnishedStatus = filter.furnishedStatus;

            const qry = {
                [TableFields.deleted]: false,
            };

            if (startDate || endDate) {
                qry[TableFields.date] = {};
                    if (filter.startDate) {
                    qry[TableFields.date].$gte = new Date(filter.startDate);
                }

                if (filter.endDate) {
                    const toDate = new Date(filter.endDate);
                    toDate.setHours(23, 59, 59, 999);
                    qry[TableFields.date].$lte = toDate;
                }
            }
              if (searchTerm) {
                qry["$or"] = [
                    {
                        [TableFields.uniqueId]: {
                            $regex: Util.wrapWithRegexQry(searchTerm),
                            $options: "i",
                        },
                    },
                    {
                        [`${TableFields.addedBy}.${TableFields.reference}`]: {
                            $regex: Util.wrapWithRegexQry(searchTerm),
                            $options: "i",
                        },
                    },
                    {
                        [`${TableFields.associatedCategory}.${TableFields.categoryName}`]: {
                            $regex: Util.wrapWithRegexQry(searchTerm),
                            $options: "i",
                        },
                    },
                ];
            }
            if (availability) {
                qry[TableFields.availability] = filter.availability;
            }
            if (userId) {
                qry[`${TableFields.addedBy}.${TableFields.reference}`] = filter.userId;
            }
            if (categoryId) {
                qry[`${TableFields.associatedCategory}.${TableFields.reference}`] = filter.categoryId;
            }
            if (verified) {
                qry[TableFields.verified] = filter.verified;
            }
            if (furnishedStatus) {
                qry[TableFields.furnishedStatus] = filter.furnishedStatus;
            }

            return await Promise.all([
                needCount ? Property.countDocuments(qry) : undefined,
                Property.find(qry)
                .limit(parseInt(limit))
                .skip(parseInt(skip))
                .sort({[sortKey] : parseInt(sortOrder)}),
            ]).then(([total, records]) => ({total, records})); 
        });
    };

    static getPropertiesByUserId = async (userId) => {
        console.log(Property.find({  [TableFields.addedBy] : userId})) 
    }

    static changePropertyVerifiedStatus = async (recordId, verifyStatus) => {
        await Property.updateOne(
            {
                [TableFields.ID] : MongoUtil.toObjectId(recordId),
            },
            {
                [TableFields.verified] : verifyStatus,
            }
        )
    }

    static existsWithUniqueId = async (uniqueId) => {
        return (await Property.exists({
            [TableFields.uniqueId] : uniqueId,
        }))
            ? true
            : false;
    }

    static deleteMyReferences = async (cascadeDeleteMethodReference, tableName, ...referenceId) => {
        let records = undefined;
        console.log("in property service",cascadeDeleteMethodReference, tableName, ...referenceId);
        switch(tableName) {
            case TableNames.Property :
                records = await Property.find({
                    [TableFields.ID] : {
                        $in : referenceId
                    }
                });
                console.log("in property switch case", records)
                break;
        }
        if(records && records.length > 0){
            let deletedRecordIds = records.map((a) => a[TableFields.ID]);
            console.log("in property last delete ", deletedRecordIds)
            await Property.deleteMany({
                [TableFields.ID] : {
                    $in: deletedRecordIds
                }
            });

            if(tableName != TableNames.Property){
                //it means that the above objects are deleted on request from model's references(And not from model itself)
                cascadeDeleteMethodReference.call(
                    {
                        ignoreSelfCall : true
                    },
                    TableNames.Property,
                    ...deletedRecordIds
                );
            }
        }
    }
}

const ProjectionBuilder = class {
    constructor(methodToExecute) {
        const projection = {};
        this.withBasicInfo = () => {
            projection[TableFields.ID] = 1;
            projection[TableFields.image] = 1;
            projection[TableFields.address] = 1;
            projection[TableFields.landArea] = 1;
            projection[TableFields.price] = 1;
            projection[TableFields.rooms] = 1;
            projection[TableFields.furnishedStatus] = 1;
            projection[TableFields.buildDate] = 1;
            projection[TableFields.availableSlots] = 1;
            projection[TableFields.phone] = 1;
            projection[TableFields.phoneCountry] = 1;
            projection[TableFields.associatedCategory] = 1;
            projection[TableFields.isFeatured] = 1;
            projection[TableFields.verified] = 1;
            projection[TableFields.addedBy] = 1;
            projection[TableFields.uniqueId] = 1;
            return this;
        }
        this.withAddedBy = () => {
            projection[TableFields.addedBy] = 1;
            return this;
        }
        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        }
        this.withVerifyStatus = () => {
            projection[TableFields.verified] = 1;
            return this;
        }
        this.withAvailableSlots = () =>{
            projection[TableFields.availableSlots] = 1;
            return this;
        }
        this.withoutTokens = () => {
            projection[TableFields.tokens] = 0;
            return this;
        };
        this.withBooleanFields = () => {
            projection[TableFields.availability] = 1;
            projection[TableFields.verified] = 1;
            return this;
        }

        this.execute = async() =>{
            return await methodToExecute.call(projection);
        }
    }
}

function isFieldEmpty(providedField) {
    return !(providedField != undefined && providedField);
}

module.exports = PropertyService;