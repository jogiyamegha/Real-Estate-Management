const API = require("../utils/apiBuilder");
const AuthController = require("../controllers/user/buyer/AuthController");
const BookingController = require("../controllers/user/buyer/BookingController");
const InquiryController = require("../controllers/user/buyer/InquiryController");
const ReviewRatingController = require("../controllers/user/buyer/ReviewRatingController");
const PropertyController = require("../controllers/user/PropertyController");
const { TableFields } = require("../utils/constants");
const ImageHandler = require("../middleware/imageVerifier");

const router = API.configRoute("/buyer")

/**
 * -------------------------------
 * Auth Routes 
 * -------------------------------
 */
.addPath("/signup")
.asPOST(AuthController.addBuyerUser)
.build()

.addPath("/login")
.asPOST(AuthController.login)
.useAppSettings()
.build()

.addPath("/logout")
.asPOST(AuthController.logout)
.useAppSettings()
.useBuyerAuth()
.build()

/**
 * -------------------------------
 * Property Routes 
 * -------------------------------
 */

.addPath("/property/list")
.asGET(PropertyController.listAllProperties)
.useAppSettings()
.useBuyerAuth()
.build()

.addPath(`/category-vise-property-list/:${TableFields.ID}`)
.asGET(PropertyController.categoryVisePropertyList)
.useAppSettings()
.useBuyerAuth()
.build()

.addPath(`/property/:${[TableFields.ID]}`)
.asGET(PropertyController.getPropertyInfo)
.useAppSettings()
.useBuyerAuth()
.build()

/**
 * -------------------------------
 * Booking Routes 
 * -------------------------------
 */

.addPath("/booking")
.asPOST(BookingController.addBooking)
.useAppSettings()
.useBuyerAuth()
.build()

.addPath(`/booking-cancel/:${[TableFields.ID]}`)
.asDELETE(BookingController.cancelBooking)
.useAppSettings()
.useBuyerAuth()
.build()

/**
 * -------------------------------
 * Inquiry Routes 
 * -------------------------------
 */

.addPath("/inquiry")
.asPOST(InquiryController.addInquiry)
.useAppSettings()
.useBuyerAuth()
.build()

.addPath(`/inquiry-delete/:${TableFields.ID}`)
.asDELETE(InquiryController.deleteInquiry)
.useAppSettings()
.useBuyerAuth()
.build()

.addPath("/inquiry-list")
.asGET(InquiryController.listAllMyInquiries)
.useAppSettings()
.useBuyerAuth()
.build()

/**
 * -------------------------------
 * Rating and Review Routes 
 * -------------------------------
 */

.addPath("/review-rating")
.asPOST(ReviewRatingController.addReviewRating)
.useAppSettings()
.useBuyerAuth()
.build()


/**
 * -------------------------------
 * Favorite property Routes 
 * -------------------------------
 */

.addPath(`/add-to-favorites/:${[TableFields.ID]}`)
.asPOST(PropertyController.addToFavorites)
.useAppSettings()
.useBuyerAuth()
.build()

.addPath(`/remove-from-favorite/:${[TableFields.ID]}`)
.asDELETE(PropertyController.removeFromFavorites)
.useAppSettings()
.useBuyerAuth()
.build()

.getRouter()
module.exports = router;