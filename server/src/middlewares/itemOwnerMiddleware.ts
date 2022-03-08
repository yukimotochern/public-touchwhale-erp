// Models
import { TwItem } from '../features/twItem/twItemModel'
import { TwItemSetDetail } from '../features/twItem/twItemModel'

// Util module
import ErrorResponse from '../utils/errorResponse'

// Type definition
import { itemOwnerResponseHandler } from '../features/twItem/twItemType'

// itemOwnerMiddleware will make sure that the accessing user owns that particular resource.
// If the access right is proved, it will set 'res.item' and 'res.itemElement'.
// The latter, 'res.itemElement', will be set only if 'res.item' represents a set.
// res.item => is one of TwItem document
// res.itemElement => is one of TwItemSetDetail document

const itemOwnerMiddleware: itemOwnerResponseHandler = async (
  req,
  res,
  next
) => {
  if (req.userJWT?.id) {
    const itemId = req.params.id
    const populate = req.query.populate

    let query = TwItem.findById(itemId)

    if (populate) {
      query = query.populate('setOfElement', 'element')
    }

    const item = await query

    // Ensure that item must exist and user have ownership with this item
    if (!item || item.user.toString() !== req.userJWT.id) {
      return next(new ErrorResponse('Item not found', 404))
    }

    // if item represent a set, middleware will set itemSetElement to res
    if (item.item_type === 'set') {
      const itemSetElement = await TwItemSetDetail.findOne({
        parentItem: item.id,
      })
      if (itemSetElement) {
        res.itemSetElement = itemSetElement
      }
    }
    res.item = item

    next()
  } else {
    return next(new ErrorResponse('Server Error', 500))
  }
}

export default itemOwnerMiddleware