import { Model } from 'mongoose'
import { Response, NextFunction } from 'express'
import { TwItemType } from '../models/TwItem'
import { RequestWithRegularUser } from './authMiddleware'

import ErrorResponse from '../utils/errorResponse'

interface advancedResultResponse extends Response {
	advancedResults?: Object
}

interface advancedResultQuery {
	select?: string
	sort?: string
	pageNum?: string
	limitNum?: string
}

const advancedResult =
	(model: Model<TwItemType>, populateStr?: any) =>
	async (
		req: RequestWithRegularUser,
		res: advancedResultResponse,
		next: NextFunction
	) => {
		if (!req.userJWT?.id) {
			return next(new ErrorResponse('Invalid credentials.', 401))
		}

		const { id } = req.userJWT

		let query
		req.query.user = id

		const reqQuery = { ...req.query }

		const removeFields = ['select', 'sort', 'page', 'limit', 'populate']

		removeFields.forEach((param) => delete reqQuery[param])

		let queryStr = JSON.stringify(reqQuery)
		console.log(JSON.parse(queryStr))

		query = model.find(JSON.parse(queryStr))

		let { select, sort, pageNum, limitNum } = req.query as advancedResultQuery
		// Select fields
		if (req.query.select) {
			const fields = select?.split(',').join(' ')
			query = query.select(fields)
		}

		// Sorting
		if (req.query.sort) {
			const sortBy = sort?.split(',').join(' ')
			query = query.sort(sortBy)
		} else {
			query = query.sort('-createdAt')
		}

		// Pagination
		const page = pageNum ? parseInt(pageNum, 10) : 1
		const limit = limitNum ? parseInt(limitNum, 10) : 30
		const startIndex = (page - 1) * limit
		const endIndex = page * limit
		const total = await model.find(query).count()

		query = query.skip(startIndex).limit(limit)

		if (req.query.populate) {
			query = query.populate(populateStr)
		}

		const results = await query

		// Pagination
		const pagination: any = {}

		//@todo Maybe it can render url for forntend to render in button
		if (endIndex < total) {
			pagination.next = {
				page: page + 1,
				limit,
			}
		}

		if (startIndex > 0) {
			pagination.prev = {
				page: page - 1,
				limit,
			}
		}

		res.advancedResults = {
			count: results.length,
			pagination,
			data: results,
		}

		next()
	}

export { advancedResultResponse }

export default advancedResult
