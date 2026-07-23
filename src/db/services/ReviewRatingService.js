const {ValidationMsgs, TableFields, TableNames} = require("../../utils/constants");
const Util = require("../../utils/util");
const ValidationError = require("../../utils/ValidationError");
const ReviewRating = require("../models/reviewRating");
const Property = require("../models/property");
const {MongoUtil} = require("../../db/mongoose");

class ReviewRatingService {
    static recordExists = async (recordId) => {
        return await ReviewRating.exists({
            [TableFields.ID] : MongoUtil.toObjectId(recordId)
        })
    }

    static propertyExistsInReviewRating = async (recordId) => {
        return (await ReviewRating.exists({
            [TableFields.associatedProperty + "." + TableFields.reference] : recordId
        }))
            ? true
            : false
    }

    static listAllReviewRating = (filter = {}) => {
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
                needCount ? ReviewRating.countDocuments(searchQuery) : undefined,
                ReviewRating.find(searchQuery, this)
                .limit(parseInt(limit))
                .skip(parseInt(skip))
                .sort({[sortKey] : parseInt(sortOrder)}),
            ]).then(([total, records]) => ({total, records})); 
        });
    };

    static checkUserAlreadyReviewed = async (userId, propertyId) => {
        const reviewIds = await ReviewRating.find();
        let result;
        reviewIds.forEach(id => {
            if( 
                id[TableFields.associatedUser][TableFields.reference].toString() === userId.toString()
                &&
                id[TableFields.associatedProperty][TableFields.reference].toString() === propertyId.toString()
            ){
                result = true;
            } 
            else {
                result = false;
            }
        })
        return result;
    }

    static insertRecord = async (updatedReviewRatingFields = {}) => {
        const reviewRating = new ReviewRating({
            ...updatedReviewRatingFields,
        })
        let error = reviewRating.validateSync();
        if(error) {
            throw error;
        } else {
        let createdReviewRatingRecords = undefined;
            try {
                let createdReviewRatingRecords = await reviewRating.save();
                return { createdReviewRatingRecords };
            } catch (e) {
                if(createdReviewRatingRecords) {
                    await createdReviewRatingRecords.delete();
                }
                throw e;
            }
        }
    }

    static deleteMyReferences = async (cascadeDeleteMethodReference, tableName, ...referenceId) => {
            let records = undefined;
            console.log("in review rating service",cascadeDeleteMethodReference, tableName, ...referenceId )
            switch(tableName) {
                case TableNames.ReviewRating :
                    records = await ReviewRating.find({
                        [TableFields.ID] : {
                            $in : referenceId
                        }
                    });
                    console.log("in review switch case")
                    break;
            }
            if(records && records.length > 0){
                let deletedRecordIds = records.map((a) => a[TableFields.ID]);
                console.log("review deleted", deletedRecordIds)
                await ReviewRating.deleteMany({
                    [TableFields.ID] : {
                        $in: deletedRecordIds
                    }
                });
    
                if(tableName != TableNames.ReviewRating){
                    //it means that the above objects are deleted on request from model's references(And not from model itself)
                    cascadeDeleteMethodReference.call(
                        {
                            ignoreSelfCall : true
                        },
                        TableNames.ReviewRating,
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
            projection[TableFields.review] = 1;
            projection[TableFields.associatedProperty] = 1;
            projection[TableFields.rating] = 1;
            projection[TableFields.associatedUser] = 1;
            return this;
        }
      
        this.execute = async() =>{
            return await methodToExecute.call(projection);
        }
    }
}

module.exports = ReviewRatingService;
