const Category = require("../models/category");
const Property = require("../models/property");
const { TableFields,TableNames, ValidationMsgs } = require("../../utils/constants");
const ValidationError = require("../../utils/ValidationError");
const Util = require('../../utils/util');
const { MongoUtil } = require("../mongoose");
const { removeFileById } = require("../../utils/storage");
class CategoryService {
    static getUserById = (userId) => {
        return new ProjectionBuilder(async function () {
            return await Category.findOne({[TableFields.ID]: userId}, this);
        });
    };

    static categoryAlreadyExists = async (name) => {
        const exists = await Category.find({[TableFields.name_] : name })
        if(exists.length > 0){
            return true;
        } else {
            return false;
        }
    }

    static recordExists = async (categoryId) => {
        return await Category.exists({
            [TableFields.ID] : categoryId,
            [TableFields.deleted] : false
        });
    }

    static insertRecord = async ( categoryFields = {} ) => {
        
        var category = new Category({
            ...categoryFields
        })
        
        let error = category.validateSync();
        if(error){
            throw error;
        } else {
            try{
                let createdCategoryRecord = await category.save();                
                return createdCategoryRecord;
            } catch(e){
                if(createdCategoryRecord){
                    await createdCategoryRecord.delete();
                }
            }
        }

    }

    static recordExists = async (recordId) => {
        return await Category.exists({
            [TableFields.ID] : MongoUtil.toObjectId(recordId)
        });
    }

    static updateCategoryRecord = async (recordId, updatedCategoryFields = {}) => {
        let name = await CategoryService.getUserById(recordId).withBasicInfo().execute()
        console.log(name[TableFields.name_])
        let record = await Category.findByIdAndUpdate(
            recordId,
            {
                ...updatedCategoryFields,
                [TableFields._updatedAt] : Date.now()
            },
            {
                new : false,
                projection : {[TableFields.ID] : 1}
            }
        )

        if(!record){
            throw new ValidationError(ValidationMsgs.RecordNotFound)
        }
        if(name[TableFields.name_]) {
            await Property.updateMany(
                { [`${TableFields.associatedCategory}.${TableFields.reference}`]: recordId },
                { $set: { [`${TableFields.associatedCategory}.${TableFields.categoryName}`]: name[TableFields.name_] } }
            );
        }
    };

    static listAllCategories = ( filter = {}) => {
        return new ProjectionBuilder(async function () {
            let limit = parseInt(filter.limit) || 0;
            let page = parseInt(filter.pageNo || filter.page) || 1;
            let skip = filter.skip || 0;
            let sortKey = filter.sortKey || TableFields._createdAt;
            let sortOrder = filter.sortOrder || 1;
            let needCount = Util.parseBoolean(filter.needCount);
            let searchQuery = {
                [TableFields.deleted]: { $ne: true },
            };

            let searchTerm = filter.searchTerm;
            if (searchTerm) {
                const regex = {
                    $regex: Util.wrapWithRegexQry(searchTerm),
                    $options: "i",
                };

                searchQuery.$or = [
                    { [TableFields.name_]: regex },
                ];
            }

            return await Promise.all([
                needCount ? Category.countDocuments(searchQuery) : undefined,
                Category.find(searchQuery, this)
                    .limit(parseInt(limit))
                    .skip(parseInt(skip)) 
                    .sort({ [sortKey]: parseInt(sortOrder) }),
            ]).then(([total, records]) => ({ total, records, page, limit }));
        });
    }

    static deleteMyReferences = async (cascadeDeleteMethodReference, tableName, ...referenceId) => {
        let records = undefined;
        console.log("in category service",cascadeDeleteMethodReference, tableName, ...referenceId);
        switch(tableName) {
            case TableNames.Category :
                records = await Category.find({
                    [TableFields.ID] : {
                        $in : referenceId
                    }
                });

                console.log("in category switch case")
                break;
        }
        console.log("second records", records)
        if(records && records.length > 0){
            let deletedRecordIds = records.map((a) => a[TableFields.ID]);
            console.log("deletedRecordIds", deletedRecordIds)
            await Category.deleteMany({
                [TableFields.ID] : {
                    $in: deletedRecordIds
                }
            });

            if(tableName != TableNames.Category){
                console.log("tablename check")
                //it means that the above objects are deleted on request from model's references(And not from model itself)
                cascadeDeleteMethodReference.call(
                    {
                        ignoreSelfCall : true
                    },
                    TableNames.Category,
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
            projection[TableFields.name_] = 1;
            return this;
        };
        this.withPropertyFields = () => {
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
            return this;
        }
        this.withId = () => {
            projection[TableFields.ID] = 1;
            return this;
        };
        this.execute = async () => {
            return await methodToExecute.call(projection);
        };
    }
};

module.exports = CategoryService;
