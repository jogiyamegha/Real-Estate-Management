const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const BookingService = require("../../../db/services/BookingService");
const PropertyService = require("../../../db/services/PropertyService");
const ServiceManager = require("../../../db/serviceManager");
const { TableFields, ValidationMsgs, UserTypes, TableNames } = require("../../../utils/constants");
const ValidationError = require("../../../utils/ValidationError");
const {MongoUtil} = require("../../../db/mongoose");

exports.addBooking = async (req) => {
    const reqBody = req.body;
    const reqUser = req.user;
    const propertyId = reqBody.reference;
    const inputDate = reqBody.visitDate;

    console.log(reqBody)

    const currentUserId = reqUser[TableFields.ID];

    const formattedDate = dayjs(inputDate, 'DD/MM/YYYY', true).toDate();
    
    const propertyVerifyStatus = await PropertyService.getUserById(propertyId).withVerifyStatus().execute();

    const propertyAvailableSlots = await PropertyService.getUserById(propertyId).withAvailableSlots().execute();

    const bookingExistsOfUser = await BookingService.getBookingExistsOfUser(propertyId, currentUserId);

    await parseAndValidateBooking(
        reqBody,
        reqUser,
        formattedDate,
        undefined,
        async (updatedBookingFields) => {
            if((propertyVerifyStatus[TableFields.verified] == true)  && (bookingExistsOfUser === false) && (propertyAvailableSlots[TableFields.availableSlots] > 0)) {
                const { createdBookingRecords } = await BookingService.insertRecord( updatedBookingFields );
                return createdBookingRecords;
            }
        }
    )
}

exports.cancelBooking = async (req) => {
    const recordId = req.params[TableFields.ID];
    let record = await BookingService.getUserById(recordId)
    .withBasicInfo()
    .withStatus()
    .execute()

    if(!(await BookingService.recordExists(recordId))){
        throw new ValidationError(ValidationMsgs.RecordNotFound);
    }

    let status = record[TableFields.status];
    if(status === 1) {
        await ServiceManager.cascadeDelete(TableNames.Booking, recordId)
    }
}

exports.updateBookingStatus = async (req) => {
    const reqBody = req.body;  
    const reqUser = req.user; 
    const bookingId = req.params[TableFields.ID];
    
    const BookingExists = await BookingService.recordExists(bookingId);
    if(!BookingExists){
        throw new ValidationError(ValidationMsgs.BookingRecordNotFound)
    }

    const booking = await BookingService.getUserById(bookingId)  
    .withStatus()
    .execute();

    //Validate new status
    const validStatuses = [1,2,3];
    if(!validStatuses.includes(reqBody.status)){
        throw new ValidationError(ValidationMsgs.InvalidBookingStatus)
    }

    //checking status transition validity
    const currentStatus = await booking[TableFields.status];
    const validTransitions = {
        1 : [2, 3],  //pending ->  confirmed and rejected
        2 : [],  //confirmed ->  nothing
        3 : [],      //rejected -> nothing
    };

    if(!validTransitions[currentStatus]?.includes(reqBody.status)){
        throw new ValidationError(`Can not change status from ${currentStatus} to ${reqBody.status}`);
    }

    //get and verify the property owner
    const propertyOwnerId = await BookingService.getOwner(bookingId)
    .withAssociatedProperty()
    .withOwnerEmail()
    .execute();

    console.log("ownerId", propertyOwnerId)

    if(!propertyOwnerId) {
        throw new ValidationError(ValidationMsgs.OwnerNotFound)
    }

    if(propertyOwnerId.toString() !== reqUser[TableFields.ID].toString()){
        throw new ValidationError(ValidationMsgs.UnauthorizedToChangeBookingStatus)
    }

    const propertyId = await BookingService.getPropertyIdFromBooking(bookingId)
    
    const property = await PropertyService.getUserById(propertyId)
    .withAvailableSlots()
    .execute()

    const availableSlots = property[TableFields.availableSlots];

    await BookingService.updateBookingStatus(bookingId, reqBody, property);
    
}

async function parseAndValidateBooking(
    reqBody,
    reqUser,
    formattedDate,
    existingBooking = {},
    onValidationCompleted = async () = {}
){
    const id = MongoUtil.newObjectId();
    if(isFieldEmpty(reqBody[TableFields.visitDate], existingBooking[TableFields.visitDate])){
        throw new ValidationError(ValidationMsgs.VisitDateEmpty);
    }
    if(isFieldEmpty(reqBody[TableFields.confirmPrice], existingBooking[TableFields.confirmPrice])){
        throw new ValidationError(ValidationMsgs.ConfirmPriceEmpty);
    }
    try{
        let response = await onValidationCompleted({
            [TableFields.visitDate] : formattedDate,
            [TableFields.bookingDate] : Date.now(),
            [TableFields.confirmPrice] : reqBody[TableFields.confirmPrice],
            [TableFields.associatedProperty] : {
                [TableFields.reference] : reqBody[TableFields.reference],
                [TableFields.ownerName] : reqBody[TableFields.ownerName],
                [TableFields.ownerEmail] : reqBody[TableFields.ownerEmail]
            },
            [TableFields.associatedUser] : {
                [TableFields.reference] : reqUser[TableFields.ID]
            }
        })
        return response;
    }catch(error){
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

