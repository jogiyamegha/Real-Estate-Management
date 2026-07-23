const UserTypes = (function () {
    function UserTypes() {}
    UserTypes.Admin = 1;
    UserTypes.Buyer = 2;
    UserTypes.Seller = 3;
    UserTypes.Agent = 4;
    return UserTypes;
})();

const Status = (function () {
    function Status() {}
    Status.pending = 1;
    Status.confirmed = 2;
    Status.rejected = 3;
    return Status;
})();

const FurnishedStatus = (function () {
    function FurnishedStatus() {}
    FurnishedStatus.unFurnished = 1;
    FurnishedStatus.semiFurnished = 2;
    FurnishedStatus.fullyFurnished = 3;
    return FurnishedStatus;
})();

const RequiredFields = (function () {
    function RequiredFields() {}
    RequiredFields.image = "Image",
    RequiredFields.address = "Address";
    RequiredFields.landArea = "LandArea";
    RequiredFields.price = "Price";
    RequiredFields.rooms = "Rooms";
    RequiredFields.furnishedStatus = "FurnishedStatus";
    RequiredFields.buildDate = "BuildDate";
    RequiredFields.availableSlots = "AvailableSlots";
    RequiredFields.isFeatured = "IsFeatured";
    RequiredFields.phoneCountry = "PhoneCountry";
    RequiredFields.phone = "Phone";
    RequiredFields.uniqueId = "UniqueId";
    
    return RequiredFields;
})();

const FCMPlatformType = (function () {
    function type() {}
    type.Android = 1;
    type.iOS = 2;
    return type;
})();

const InterfaceTypes = (function () {
    function InterfaceType() {}
    InterfaceType.Admin = {
        AdminWeb: "i1",
    };
    InterfaceType.Buyer = {
        BuyerWeb: "i2",
    };
    InterfaceType.Seller = {
        SellerWeb: "i3",
    };
    InterfaceType.Agent = {
        AgentWeb: "i4",
    };
    return InterfaceType;
})();

const ValidationMsgs  = (function () {
    function ValidationMsgs(){}
    ValidationMsgs.NameEmpty = "Name required!";
    ValidationMsgs.EmailEmpty = "Email required!";
    ValidationMsgs.EmailInvalid = "Please enter valid email!";
    ValidationMsgs.DuplicateEmail = "Opps! this email is already in use, please choose another one..";
    ValidationMsgs.PasswordEmpty = "Password required!";
    ValidationMsgs.PasswordInvalid = "Please enter valid password!";
    ValidationMsgs.PhoneInvalid = "Please enter valid Phone number!";
    ValidationMsgs.PropertyIdEmpty = "PropertyId required!";
    ValidationMsgs.UserIdEmpty = "UserId required!";
    ValidationMsgs.VisitDateEmpty = "Visit date required";
    ValidationMsgs.BookingDateEmpty = "Booking date required!";
    ValidationMsgs.ConfirmPriceEmpty = "Confirm price required!";
    ValidationMsgs.CategoryNameEmpty = "Category name required!";
    ValidationMsgs.CategoryAlreadyExists = "Category already exists!";
    ValidationMsgs.CategoryNotExists = "category not exists!";
    ValidationMsgs.InquiryMsgEmpty = "Inquiry Message required!";
    ValidationMsgs.InquiryIdEmpty = "Inquiry Id required!";
    ValidationMsgs.ImageEmpty = "Image required!";
    ValidationMsgs.AddressEmpty = "Address required!";
    ValidationMsgs.LandAreaEmpty = "LandArea required!";
    ValidationMsgs.PriceEmpty = "Price required!";
    ValidationMsgs.AvailableSlotsEmpty = "AvailableSlots required";
    ValidationMsgs.isFeaturedEmpty = "featured or not ?"
    ValidationMsgs.RoomsEmpty = "Rooms required!";
    ValidationMsgs.FurnishedStatusEmpty = "FurnishedStatus required!";
    ValidationMsgs.BuildDateEmpty = "BuildDate required!";
    ValidationMsgs.AvailabilityEmpty = "Availability required!";
    ValidationMsgs.CategoryEmpty = "Category required!";
    ValidationMsgs.ReferenceEmpty = "Reference(id) required!";
    ValidationMsgs.VerifiedEmpty = "Verified required!";
    ValidationMsgs.ReviewEmpty = "Review required!";
    ValidationMsgs.RatingEmpty = "Rating required!";
    ValidationMsgs.RoleEmpty = "Role required!";
    ValidationMsgs.IsActiveEmpty = "Active or not required!";
    ValidationMsgs.DuplicatePhone = "Please use another number!";
    ValidationMsgs.RecordNotFound = "Record not found";
    ValidationMsgs.NotAllowed = "Not-allowed";
    ValidationMsgs.UnableToLogin = "Ooops! Unable to login...";
    ValidationMsgs.AuthFail = "Opps! Authentication fails";
    ValidationMsgs.UniqueIdExists = "UniqueId already exists!";
    ValidationMsgs.BookingRecordNotFound = "Booking records not found!";
    ValidationMsgs.CannotDeleteCategory = "Can not delete category, as it includes properties!";
    ValidationMsgs.CannotDeletePropertyAsBookingExists = "Can not Delete Property As Booking Exists";
    ValidationMsgs.CannotDeletePropertyAsInquiryExists = "Can not Delete Property As Inquiry Exists";
    ValidationMsgs.CannotDeletePropertyAsReviewRatingExists = "Can not Delete Property As ReviewRating Exists";
    ValidationMsgs.InvalidBookingStatus = "Invalid Booking Status";
    ValidationMsgs.OwnerNotFound = "property-Owner Not Found";
    ValidationMsgs.UnauthorizedToChangeBookingStatus = "you are not permitted to change booking status!";
    ValidationMsgs.NotAllowedToEdit = "not allowed to edit this property!";
    ValidationMsgs.NotAllowedToDelete = "not allowed to delete this property";
    ValidationMsgs.AlreadyReviewed = "You have already reviewed this property!";
    ValidationMsgs.ParametersError = "Invalid parameters!";
    ValidationMsgs.UnderMaintenance = "Oops! The app is currently undergoing maintenance. Please try again later!";
    ValidationMsgs.ForceUpdate = "Whoops! Please update the app to continue using it";
    ValidationMsgs.VerifiedFalse = "Sorry! You are not verified by admin!.... wait for sometime till verification"
    ValidationMsgs.UserIsDeleted = "We apologize, but we are unable to log you in as you have been removed by the admin."
    ValidationMsgs.DuplicateData = "Duplicate Data Insert Error";
    ValidationMsgs.ImageNotFound = "Ooopps.. image not found!";
    ValidationMsgs.AssociatedCategoryReferenceEmpty = "AssociatedCategoryReference Empty!";
    ValidationMsgs.NoProperties = "No properties to insert!";
    ValidationMsgs.ExcelFileEmpty = "ooops.. Excel file is empty";
    ValidationMsgs.UniqueIdExists = "Property already exists with this UniqueId..."
    ValidationMsgs.RecordNotExists = 'Record Not Exists!';
    return ValidationMsgs;
})()
   

const ResponseMessages = (function () {
    function ResponseMessages() {}
    ResponseMessages.Ok = "Ok";
    ResponseMessages.NotFound = "Data not found!";
    ResponseMessages.signInSuccess = "Sign In successfully!";
    ResponseMessages.signOutSuccess = "Sign Out successfully!";
    return ResponseMessages;
})();

const GeneralMessages = (function () {
    function GeneralMessages() {}
    // GeneralMessages.forgotPasswordEmailSubject = "Reset your password";
    // GeneralMessages.invitationEmailSubject = "Your OnWard Education Account is Ready!";
    GeneralMessages.PendingSubject = "Updates Pending";
    // GeneralMessages.inquiryReplySubject = "Your inquiry-Reply still pending!";
    return GeneralMessages;
})();

const TableNames = (function () {
    function TableNames(){}
    TableNames.Admin = "admins";
    TableNames.Booking = "bookings";
    TableNames.Category = "categories";
    TableNames.Inquiry = "inquiries";
    TableNames.Property = "properties";
    TableNames.ReviewRating = "reviewratings";
    TableNames.User = "users";
    TableNames.Buyer = "buyers";
    TableNames.Seller = "sellers";
    TableNames.Agent = "agents";
    TableNames.DefaultConfiguration = "defaultconfigurations";

    return TableNames;
})();

const TableFields = (function () {
    function TableFields(){}
    TableFields.ID = "_id";
    TableFields.name_ = "name";
    TableFields.email = "email";
    TableFields.password = "password";
    TableFields.address = "address";
    TableFields.phoneCountry = "phoneCountry";
    TableFields.phone = "phone";
    TableFields.uniqueId = "uniqueId";
    TableFields.tokens = "token";
    TableFields.token = "token";
    TableFields.authType = "authType";
    TableFields.interface = "interface";
    TableFields.propertyReference = "propertyReference";
    TableFields.categoryReference = "categoryReference";
    TableFields.userReference = "userReference";
    TableFields.status = "status";
    TableFields.visitDate = "visitDate";
    TableFields.bookingDate = "bookingDate";
    TableFields.confirmDate = "confirmDate";
    TableFields.confirmPrice = "confirmPrice";
    TableFields.name_ = "name";
    TableFields.message = "message";
    TableFields.propertyReference = "propertyReference";
    TableFields.InquiryReference = "inquiryReference";
    TableFields.inquiryReference = "inquiryReference";
    TableFields.reply = "reply";
    TableFields.inquiryReply = "inquiryReply";
    TableFields.image = "image";
    TableFields.userReference = "userReference";
    TableFields.address = "address";
    TableFields.landArea = "landArea";
    TableFields.rooms = "rooms";
    TableFields.price = "price";
    TableFields.furnishedStatus = "furnishedStatus";
    TableFields.buildDate = "buildDate";
    TableFields.availability = "availability";
    TableFields.availableSlots = "availableSlots";
    TableFields.verified = "verified";
    TableFields.isFeatured = "isFeatured";
    TableFields.review = "review";
    TableFields.rating = "rating";
    TableFields.deleted = "deleted";   
    TableFields.favorites = "favorites";
    TableFields.isActive = "isActive";
    TableFields._createdAt = "createdAt";
    TableFields._updatedAt = "updatedAt";
    TableFields._deletedAt = "_deletedAt";
    TableFields.reference = "reference";
    TableFields.associatedUser = "associatedUser";
    TableFields.associatedCategory = "associatedCategory";
    TableFields.associatedProperty = "associatedProperty";
    TableFields.associatedInquiry = "associatedInquiry";
    TableFields.userType = "userType";
    TableFields.approved = "approved";
    TableFields.uniqueId = "uniqueId";
    TableFields.addedBy = "addedBy";
    TableFields.property = "property";
    TableFields.type = "type";
    TableFields.androidVersion = "androidVersion";
    TableFields.iOSVersion = "iOSVersion";
    TableFields.androidForceUpdate = "androidForceUpdate";
    TableFields.iOSForceUpdate = "iOSForceUpdate";
    TableFields.androidUnderMaintenance = "androidUnderMaintenance";
    TableFields.iOSUnderMaintenance = "iOSUnderMaintenance";
    TableFields.categoryName = "categoryName";
    TableFields.propertyReference = "propertyReference";
    TableFields.startTime = "startTime";
    TableFields.endTime = "endTime";
    TableFields.totalHours = "totalHours";
    TableFields.date = "date";
    TableFields.ownerName = "ownerName";
    TableFields.ownerEmail = "ownerEmail";
    TableFields.inquiryReplyStatus = "inquiryReplyStatus";
    TableFields.repliedUser = "repliedUser";
    TableFields.repliedUserName = "repliedUserName";
    TableFields.repliedUserEmail = "repliedUserEmail";
    TableFields.file = "file";

    return TableFields;
})()

const AuthTypes = (function () {
    function types() {}
    types.Admin = 1;
    types.Buyer = 2;
    types.Seller = 3;
    types.Agent = 4;
    return types;
})();

const Types = (function () {
    function types() {}
    types.admin = 1;
    types.buyer = 2;
    types.seller = 3;
    types.agent = 4;
    return types;
})();


const ResponseStatus = (function () {
    function ResponseStatus() {}
    ResponseStatus.Failed = 0;
    ResponseStatus.Success = 200;
    ResponseStatus.BadRequest = 400;
    ResponseStatus.Unauthorized = 401;
    ResponseStatus.NotFound = 404;
    ResponseStatus.UpgradeRequired = 426;
    ResponseStatus.AccountDeactivated = 3001;
    ResponseStatus.InternalServerError = 500;
    ResponseStatus.ServiceUnavailable = 503;
    return ResponseStatus;
})();
const DefaultConfigTypes = (function () {
    function types() {}
    types.userAppSettings = "appSettings"; //default configuration type
    return types;
})();

const ApiResponseCode = (function () {
    function ApiResponseCode() {}
    ApiResponseCode.ClientOrServerError = 400;
    ApiResponseCode.ResponseSuccess = 200;
    ApiResponseCode.AuthError = 401;
    ApiResponseCode.UnderMaintenance = 503; //Service Unavailable
    ApiResponseCode.ForceUpdate = 409; //Version Control
    return ApiResponseCode;
})();

const ResponseFields = (function () {
    function ResponseFields() {}
    ResponseFields.status = "status";
    ResponseFields.message = "message";
    ResponseFields.result = "result";
    return ResponseFields;
})();

module.exports = {
    ValidationMsgs,
    TableNames,
    TableFields,
    ResponseStatus,
    ResponseFields,
    ResponseMessages,
    UserTypes,
    Status,
    FurnishedStatus,
    FCMPlatformType,
    InterfaceTypes,
    AuthTypes,
    Types,
    GeneralMessages,
    ApiResponseCode,
    DefaultConfigTypes,
    RequiredFields,
};
