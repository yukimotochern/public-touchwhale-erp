import { PrivateRequestHandler } from './authMiddleware'
import ErrorResponse from '../utils/errorResponse'

import TwItem, { TwItemPayload } from '../models/TwItem'

import { Request, NextFunction, Response } from 'express'
import { RequestWithRegularUser } from './authMiddleware'

interface itemOwnerResponse extends Response {
	item?: TwItemPayload
}

interface itemOwnerResponseHandler {
	(
		req: RequestWithRegularUser,
		res: itemOwnerResponse,
		next: NextFunction
	): void | Promise<void>
}

const itemOwnerMiddleware: itemOwnerResponseHandler = async (
	req,
	res,
	next
) => {
	try {
		if (!req.userJWT?.id) {
			return next(new ErrorResponse('Invalid credentials.', 401))
		}

		const itemId = req.params.id

		const item = await TwItem.findById(itemId)

		// Ensure that item must exist and user have ownership with this item
		if (!item || item.user.toString() !== req.userJWT.id) {
			return next(new ErrorResponse('Item not found', 404))
		}

		res.item = item

		next()
	} catch (err) {
		return next(new ErrorResponse('Server Error', 401, err))
	}
}

export { itemOwnerResponseHandler }

export default itemOwnerMiddleware
