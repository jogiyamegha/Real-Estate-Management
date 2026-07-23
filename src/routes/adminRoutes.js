const API = require("../utils/apiBuilder");
const CategoryController = require("../controllers/admin/CategoryController");
const AuthController = require("../controllers/admin/AuthController");
const PropertyController = require("../controllers/admin/PropertyController");
const BuyerController = require("../controllers/user/BuyerController");
const SellerController = require("../controllers/user/SellerController");
const AgentController = require("../controllers/user/AgentController");
const InquiryController = require("../controllers/user/buyer/InquiryController");
const BookingController = require("../controllers/user/buyer/BookingController");
const ReviewRatingController = require("../controllers/user/buyer/ReviewRatingController");
const DefaultController = require("../controllers/admin/DefaultController");
const { TableFields } = require("../utils/constants");
const ImageHandler = require("../middleware/imageVerifier");

const router = API.configRoute("/admin")

/**
 * -------------------------------
 * Auth Routes 
 * -------------------------------
 */
.addPath("/signup")
.asPOST(AuthController.addAdminUser)
.build()

.addPath("/login")
.asPOST(AuthController.login)
.build()

.addPath("/logout")
.asPOST(AuthController.logout)
.useAdminAuth()
.build()

/**
 * -------------------------------
 * Category 
 * -------------------------------
 */


.addPath("/category/add")
.asPOST(CategoryController.addCategory)
.useAdminAuth()
.build()

.addPath("/category/list")
.asGET(CategoryController.listAllCategories)
.useAdminAuth()
.build()

.addPath(`/category/update/:${TableFields.ID}`)
.asUPDATE(CategoryController.updateCategory)
.useAdminAuth()
.build()

.addPath(`/category/delete/:${TableFields.ID}`)
.asDELETE(CategoryController.deleteCategory)
.useAdminAuth()
.build()



/**
 * -------------------------------
 * Dashboard
 * -------------------------------
*/

.addPath('/dashboard')
.asGET(AuthController.getDashboardData)
.useAdminAuth()
.build()

/**
 * -------------------------------
 * Property
 * -------------------------------
*/

.addPath("/property/add")
.asPOST(PropertyController.addProperty)
.useAdminAuth()
.userMiddlewares(ImageHandler.single([TableFields.image]))
.build()

.addPath("/property/import")
.asPOST(PropertyController.importProperties)
.useAdminAuth()
.userMiddlewares(ImageHandler.uploadCSVFile([TableFields.file]))
.build()

.addPath(`/property/update/:${TableFields.ID}`)
.asUPDATE(PropertyController.updateProperty)
.useAdminAuth()
.userMiddlewares(ImageHandler.single([TableFields.image]))
.build()

.addPath(`/property/delete/:${TableFields.ID}`)
.asDELETE(PropertyController.deleteProperty)
.useAdminAuth()
.build()

.addPath(`/category-vise-property-list/:${TableFields.ID}`)
.asGET(PropertyController.categoryVisePropertyList)
.useAdminAuth()
.build()

.addPath("/property/list")
.asGET(PropertyController.listAllProperties)
.useAdminAuth()
.build()

.addPath(`/property/info/:${[TableFields.ID]}`)
.asGET(PropertyController.getPropertyInfo)
.useAdminAuth()
.build()

.addPath(`/property/verification/:${[TableFields.ID]}`)
.asUPDATE(PropertyController.updatePropertyVerification)
.useAdminAuth()
.build()

.addPath("/my-booked-property")
.asGET(PropertyController.getMyBookedProperty)
.useAdminAuth()
.build()

/**
 * -------------------------------
 * User
 * -------------------------------
*/

.addPath("/buyer-list")
.asGET(BuyerController.listAllBuyers)
.useAdminAuth()
.build()

.addPath("/seller-list")
.asGET(SellerController.listAllSellers)
.useAdminAuth()
.build()

.addPath("/agent-list")
.asGET(AgentController.listAllAgents)
.useAdminAuth()
.build()

.addPath(`/buyer-delete/:${[TableFields.ID]}`)
.asDELETE(BuyerController.deleteBuyer)
.useAdminAuth()
.build()

.addPath(`/seller-delete/:${[TableFields.ID]}`)
.asDELETE(SellerController.deleteSeller)
.useAdminAuth()
.build()

.addPath(`/agent-delete/:${[TableFields.ID]}`)
.asDELETE(AgentController.deleteAgent)
.useAdminAuth()
.build()

.addPath(`/agent/verification/:${[TableFields.ID]}`)
.asPOST(AgentController.updateAgentVerification)
.useAdminAuth()
.build()

.addPath(`/buyer-active/:${[TableFields.ID]}`)
.asUPDATE(BuyerController.activateDeactivateBuyer)
.useAdminAuth()
.build()

.addPath(`/seller-active/:${[TableFields.ID]}`)
.asUPDATE(SellerController.activateDeactivateSeller)
.useAdminAuth()
.build()

.addPath(`/agent-active/:${[TableFields.ID]}`)
.asUPDATE(AgentController.activateDeactivateAgent)
.useAdminAuth()
.build()

/**
 * -------------------------------
 * Inquiry routes
 * -------------------------------
*/

.addPath("/inquiry-list")
.asGET(InquiryController.listAllInquiries)
.useAdminAuth()
.build()

.addPath(`/inquiry-reply/:${[TableFields.ID]}`)
.asPOST(InquiryController.addInquiryReply)
.useAdminAuth()
.build()

/**
 * -------------------------------
 * Booking routes
 * -------------------------------
*/

.addPath(`/booking-status-update/:${[TableFields.ID]}`)
.asUPDATE(BookingController.updateBookingStatus)
.useAdminAuth()
.build()


/**
 * -------------------------------
 * Review Rating routes
 * -------------------------------
*/

.addPath("/review-rating-list")
.asGET(ReviewRatingController.listAllReviewRatings)
.useAdminAuth()
.build()

/**
 * -------------------------------------
 * App Settings Route
 * -------------------------------------
 */
.addPath("/appSettings")
.asUPDATE(DefaultController.updateAppSettings)
.useAdminAuth()
.build()

.addPath("/appSettings/list")
.asGET(DefaultController.getAppSettings)
.useAdminAuth()
.build()


.getRouter()
module.exports = router;