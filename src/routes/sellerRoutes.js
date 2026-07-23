const API = require("../utils/apiBuilder");
const AuthController = require("../controllers/user/seller/AuthController");
const PropertyController = require("../controllers/user/PropertyController");
const BookingController = require("../controllers/user/buyer/BookingController");
const { TableFields } = require("../utils/constants");
const ImageHandler = require("../middleware/imageVerifier");

const router = API.configRoute("/seller")

/**
 * -------------------------------
 * Auth Routes 
 * -------------------------------
 */
.addPath("/signup")
.asPOST(AuthController.addSellerUser)
.build()

.addPath("/login")
.asPOST(AuthController.login)
.useAppSettings()
.build()

.addPath("/logout")
.asPOST(AuthController.logout)
.useAppSettings()
.useSellerAuth()
.build()

/**
 * -------------------------------
 * Property Routes 
 * -------------------------------
 */

.addPath("/property")
.asPOST(PropertyController.addProperty)
.userMiddlewares(ImageHandler.single([TableFields.image]))
.useAppSettings()
.useSellerAuth()
.build()

.addPath(`/property-update/:${TableFields.ID}`)
.asUPDATE(PropertyController.updateProperty)
.userMiddlewares(ImageHandler.single([TableFields.image]))
.useAppSettings()
.useSellerAuth()
.build()

.addPath(`/property-delete/:${TableFields.ID}`)
.asDELETE(PropertyController.deleteProperty)
.useAppSettings()
.useSellerAuth()
.build()

.addPath("/property/list")
.asGET(PropertyController.listAllProperties)
.useAppSettings()
.useSellerAuth()
.build()

.addPath(`/category-vise-property-list/:${TableFields.ID}`)
.asGET(PropertyController.categoryVisePropertyList)
.useAppSettings()
.useSellerAuth()
.build()

.addPath(`/property/:${[TableFields.ID]}`)
.asGET(PropertyController.getPropertyInfo)
.useAppSettings()
.useSellerAuth()
.build()

.addPath("/my-properties")
.asGET(PropertyController.getMyProperties)
.useAppSettings()
.useSellerAuth()
.build()


.addPath("/my-booked-properties")
.asGET(PropertyController.getMyBookedProperty)
.useAppSettings()
.useSellerAuth()
.build()

/**
 * -------------------------------
 * Booking Routes 
 * -------------------------------
 */

.addPath(`/booking-status-update/:${[TableFields.ID]}`)
.asUPDATE(BookingController.updateBookingStatus)
.useAppSettings()
.useSellerAuth()
.build()


.getRouter()
module.exports = router;