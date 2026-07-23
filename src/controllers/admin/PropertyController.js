const PropertyService = require("../../db/services/PropertyService");
const InquiryService = require("../../db/services/InquiryService");
const ReviewRatingService = require("../../db/services/ReviewRatingService");
const ServiceManager = require("../../db/serviceManager");
const { TableFields, ValidationMsgs, UserTypes, TableNames, RequiredFields } = require("../../utils/constants");
const {Folders} = require("../../utils/metadata");
const {addFile, removeFileById} = require("../../utils/storage");
const ValidationError = require("../../utils/ValidationError");
const CategoryService = require("../../db/services/CategoryService");
const { MongoUtil } = require("../../db/mongoose");
const BookingService = require("../../db/services/BookingService");
const xlsx = require("xlsx");

exports.addProperty = async (req) => {
    let providedFiles = req.file || null;
    let reqBody = req.body;
    let reqUser = req.user;

    let idExists = await PropertyService.existsWithUniqueId(reqBody[TableFields.uniqueId]);

    if(idExists) {
        throw new ValidationError(ValidationMsgs.UniqueIdExists);
    }

    return await parseAndValidateProperty(
        providedFiles,
        reqBody,
        reqUser,
        undefined,
        async (updatedPropertyFields) => {
            const {createdPropertyRecords} = PropertyService.insertRecord(
                updatedPropertyFields
            );
            return { createdPropertyRecords };
        }
    );
}

exports.importProperties = async (req) => {
    let providedFile = req.file || null;
    let associatedCategory = req.body[TableFields.reference];
    let categoryName = req.body[TableFields.categoryName];
    let reqUser = req.user;
    let userId = reqUser[TableFields.ID];

    if(!associatedCategory) {
        throw new ValidationError(ValidationMsgs.AssociatedCategoryReferenceEmpty)
    }

    if(!providedFile) {
        throw new ValidationError(ValidationMsgs.ImageNotFound)
    }

    let propertyDetail = await propertyDataParser(
        providedFile, 
        associatedCategory, 
        categoryName,
        userId
    );
    
    if(propertyDetail.length > 0) {
        await PropertyService.addProperties(propertyDetail);
    }
}

async function propertyDataParser(file = null, categoryId, categoryName, userId) {
    try {
        let results = [];
        let requiredFields = [
            RequiredFields.image,
            RequiredFields.address, 
            RequiredFields.landArea,
            RequiredFields.price,
            RequiredFields.rooms,
            RequiredFields.furnishedStatus,
            RequiredFields.buildDate,
            RequiredFields.availableSlots,
            RequiredFields.isFeatured,
            RequiredFields.phoneCountry,
            RequiredFields.phone,
            RequiredFields.uniqueId
        ];
        
        //parse Excel file
        let workBook = xlsx.read(file.buffer, {type : "buffer"});
        let sheetName = workBook.SheetNames[0];
        let sheet = workBook.Sheets[sheetName];
        let jsonData = xlsx.utils.sheet_to_json(sheet);

        if(jsonData.length === 0) {
            throw new ValidationError(ValidationMsgs.ExcelFileEmpty)
        }

        let associatedCategory = await CategoryService.getUserById(categoryId)
            .withBasicInfo()
            .withId()
            .execute()


        for(let i = 0; i < jsonData.length; i++){
            const row = jsonData[i];
            requiredFields.map((field) => {
                if(!row[field]) {
                    throw new ValidationError(`Missing required field: ${field} in row ${i + 1}. Please check your Excel file format.`);
                }
            });

            let {Image, Address, LandArea, Price, Rooms, FurnishedStatus, BuildDate, AvailableSlots, IsFeatured, PhoneCountry, Phone, UniqueId } = row;

            let existingProperty = await PropertyService.getPropertyForImport(UniqueId).withBasicInfo().execute();

            if(existingProperty) {
                const propertyUpdatedFields = {
                    ...row
                };
                const a = await PropertyService.updateRecord(existingProperty[TableFields.ID], propertyUpdatedFields);
                continue;
            }

            let propertyObj = {
                [TableFields.addedBy] : {
                    [TableFields.reference] : userId
                },
                [TableFields.associatedCategory] : {
                    [TableFields.reference] :  MongoUtil.toObjectId(associatedCategory[TableFields.ID]),
                    [TableFields.categoryName] : associatedCategory[TableFields.name_]
                },
                [TableFields.image] : Image,
                [TableFields.address] : Address,
                [TableFields.landArea] : LandArea,
                [TableFields.price] : Price,
                [TableFields.rooms] : Rooms,
                [TableFields.furnishedStatus] : FurnishedStatus,
                [TableFields.buildDate] : BuildDate,
                [TableFields.availableSlots] : AvailableSlots,
                [TableFields.isFeatured] : IsFeatured,
                [TableFields.phoneCountry] : PhoneCountry,
                [TableFields.phone] : Phone,
                [TableFields.uniqueId] : UniqueId,
            }

            results.push(propertyObj);
        }
        return results;
    } catch (error) {
        throw error;
    }
}

exports.updateProperty = async (req) => {
    const providedFiles = req.file || null;
    const reqBody = req.body;
    const reqUser = req.user;

    const propertyId = req.params[TableFields.ID];
    const property = await PropertyService.getUserById(propertyId).withBasicInfo().execute();

    if(!property){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    const ownerId = await PropertyService.getUserById(propertyId).withAddedBy().execute();
    
    return await parseAndValidateProperty(
        providedFiles,
        reqBody,
        reqUser,
        property,
        async(updatePropertyFields) => {
            if(reqUser[TableFields.ID].toString() === ownerId[TableFields.addedBy][TableFields.reference].toString()){
                const result = await PropertyService.updatedPropertyRecord(propertyId, updatePropertyFields);
                return result;
            } else {
                throw new ValidationError(ValidationMsgs.NotAllowedToEdit)
            }
        }
    )
}

exports.deleteProperty = async (req) =>{
    const recordId = req.params[TableFields.ID];
    const reqUser = req.user;

    if(!(await PropertyService.recordExists(recordId))){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    if(await BookingService.propertyExistsInBooking(recordId)){
        throw new ValidationError(ValidationMsgs.CannotDeletePropertyAsBookingExists)
    }

    if(await InquiryService.propertyExistsInInquiry(recordId)){
        throw new ValidationError(ValidationMsgs.CannotDeletePropertyAsInquiryExists)
    }

    if(await ReviewRatingService.propertyExistsInReviewRating(recordId)){
        throw new ValidationError(ValidationMsgs.CannotDeletePropertyAsReviewRatingExists)
    }

    const ownerId = await PropertyService.getUserById(recordId).withAddedBy().execute();
    
    if(ownerId[TableFields.addedBy][TableFields.reference].toString() === reqUser[TableFields.ID].toString()){
        await ServiceManager.cascadeDelete(TableNames.Property, recordId);
    } else {
        throw new ValidationError(ValidationMsgs.NotAllowedToDelete)
    }
}

exports.categoryVisePropertyList = async (req) => {
    const categoryId = req.params[TableFields.ID];

    let record = await PropertyService.getPropertyByCategoryId(categoryId)
    .withAddedBy()
    .withBasicInfo()
    .execute();

    if(!record) {
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }
    return record;
}

exports.listAllProperties = async (req) => {
    return await PropertyService.listAllProperty({
        ...req.query
    }).withBasicInfo().execute();
}

exports.getPropertyInfo =  async (req) => {
    let record = await PropertyService.getUserById(req.params[TableFields.ID])
    .withBasicInfo()
    .withBooleanFields()
    .withId()
    .execute();

    if(!record){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }
    return record;
}

exports.updatePropertyVerification = async (req) => {
    const recordId = req.params[TableFields.ID];
    const reqBody = req.body
    const status = reqBody[TableFields.verified];
    const property = await PropertyService.recordExists(recordId);
    if(!property) {
        throw new ValidationError(ValidationMsgs.RecordNotExists)
    }
    return await PropertyService.changePropertyVerifiedStatus(recordId, status);
}

exports.getMyBookedProperty = async (req) => {
    const reqUser = req.user;
    const userId = reqUser[TableFields.ID];

    const myProperties = await PropertyService.getMyProperties(userId);

    if(myProperties.length === 0){
        return [];
    }

    const bookings = await BookingService.getBookings(myProperties).withBasicInfo().execute();
    return bookings;
}

async function parseAndValidateProperty(
    providedFile,
    reqBody,
    reqUser,
    existingProperty = {},
    onValidationCompleted = async () => {}
) {
   
    const id = MongoUtil.newObjectId();

    if(isFieldEmpty(reqBody[TableFields.address], existingProperty[TableFields.address])){
        throw new ValidationError(ValidationMsgs.AddressEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.landArea], existingProperty[TableFields.landArea])){
        throw new ValidationError(ValidationMsgs.LandAreaEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.price], existingProperty[TableFields.price])){
        throw new ValidationError(ValidationMsgs.PriceEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.rooms], existingProperty[TableFields.rooms])){
        throw new ValidationError(ValidationMsgs.RoomsEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.furnishedStatus], existingProperty[TableFields.furnishedStatus])){
        throw new ValidationError(ValidationMsgs.FurnishedStatusEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.buildDate], existingProperty[TableFields.buildDate])){
        throw new ValidationError(ValidationMsgs.BuildDateEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.availableSlots], existingProperty[TableFields.availableSlots])){
        throw new ValidationError(ValidationMsgs.AvailableSlotsEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.isFeatured], existingProperty[TableFields.isFeatured])){
        throw new ValidationError(ValidationMsgs.isFeaturedEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.categoryReference], existingProperty[TableFields.categoryReference])){
        throw new ValidationError(ValidationMsgs.ReferenceEmpty)
    }
  
    const categoryId = reqBody[TableFields.categoryReference]

    if(!await CategoryService.recordExists(categoryId)) {
        throw new ValidationError(ValidationMsgs.CategoryNotExists);
    }

    const categoryInfo = await CategoryService.getUserById(categoryId).withBasicInfo().execute();

    const existingImageKey = existingProperty[TableFields.image];
    let persistedImageKey = existingImageKey;
    try {
        if (providedFile) {
            let newImageKey = await addFile(
                Folders.image,
                providedFile.originalname,
                providedFile.buffer,
                true,
                providedFile
            );
            persistedImageKey = newImageKey;
            console.log("persistedImageKey", persistedImageKey)
        }

        let response = await onValidationCompleted({
            [TableFields.image] : persistedImageKey,
            [TableFields.address] : reqBody[TableFields.address],
            [TableFields.landArea] : reqBody[TableFields.landArea],
            [TableFields.price] : reqBody[TableFields.price],
            [TableFields.rooms] : reqBody[TableFields.rooms],
            [TableFields.furnishedStatus] : reqBody[TableFields.furnishedStatus],
            [TableFields.buildDate] : reqBody[TableFields.buildDate],
            [TableFields.availableSlots] : reqBody[TableFields.availableSlots],
            [TableFields.isFeatured] : reqBody[TableFields.isFeatured],
            [TableFields.availability] :  reqBody[TableFields.availability] || true,
            [TableFields.phoneCountry] : reqBody[TableFields.phoneCountry],
            [TableFields.phone] : reqBody[TableFields.phone],
            [TableFields.verified] : reqBody[TableFields.verified] || false,
            [TableFields.uniqueId] : reqBody[TableFields.uniqueId],
            [TableFields.addedBy] : {
                [TableFields.reference] : reqUser[TableFields.ID],
            },
            [TableFields.associatedCategory] : {
                [TableFields.reference] : reqBody[TableFields.categoryReference],
                [TableFields.categoryName] : categoryInfo?.[TableFields.name_]
            }
        }
    )
      return response;
    
    } catch (error) {
        throw error;
    }
}

function isFieldEmpty(providedField, existingField) {
    if (providedField != undefined) {
        return false;
    } else if (existingField) {
        return false;
    }
    return true;
}

