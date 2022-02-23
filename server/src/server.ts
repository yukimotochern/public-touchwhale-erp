import path from 'path'
import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

// routes
import api_v1 from './routes/api'
import user from './routes/user/userRoutes'

import connectDB from './utils/mongodb'
import 'colorts/lib/string'

const app = express()
app.use(cookieParser())

// Load env vars
dotenv.config({ path: path.join('.', 'src', 'config', 'config.env') })

// Connect to MongoDB
connectDB()

// Init Middleware
app.use(express.json({ limit: '999999MB' }))

// Mount API
app.use('/api/v1', api_v1)
app.use('/api/v1/user', user)

const PORT = process.env.SERVER_PORT || 5000

const server = app.listen(PORT, () =>
	console.log(
		`[server] Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
			.yellow.bold
	)
)
server.setTimeout(999999999)

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: any, promise) => {
	if (typeof err.message === 'string') {
		console.log(`Unhandled Rejection: ${err.message}`)
	} else {
		console.error(`Unknown thing thrown: ${err}`)
	}
	// Close server & exit process
	server.close(() => process.exit(1))
})
