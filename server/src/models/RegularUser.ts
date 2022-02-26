import mongoose from 'mongoose'
import bcrtpt from 'bcryptjs'
import jwt, { JwtPayload } from 'jsonwebtoken'
import crypto from 'crypto'
import { MongooseErrors } from '../utils/errorResponse'

interface RegularUserType {
	// editable for user
	email: string
	password: string
	avatar?: string
	company_name?: string
	// non-editable for user
	provider: string
	forgetPasswordToken?: string
	forgetPasswordExpire?: Date
	resetEmailToken?: string
	resetEmailExpire?: Date
	createdAt: Date
	updatedAt: Date
	matchPassword: (password: string) => Promise<boolean>
	getForgetPasswordToken: () => string
	getSignedJWTToken: () => string
}

interface RegularUserJWTPayload extends JwtPayload {
	id?: string
	iat?: number
	exp?: number
}

const RegularUserSchema = new mongoose.Schema<RegularUserType>(
	{
		company_name: {
			type: String,
		},
		email: {
			type: String,
			unique: true,
			required: true,
			match: [
				/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
				'Please add a valid email.',
			],
		},
		password: {
			type: String,
			required: true,
			minlength: 8,
			select: false,
		},
		provider: { type: String, enum: ['TouchWhale', 'Google'], required: true },
		avatar: {
			type: String,
		},
		forgetPasswordToken: String,
		forgetPasswordExpire: Date,
		resetEmailToken: String,
		resetEmailExpire: Date,
	},
	// Automatically adding and modifying createdAt and updatedAt by Yuki
	{ timestamps: true }
)

RegularUserSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		next()
	}

	const salt = await bcrtpt.genSalt(10)
	this.password = await bcrtpt.hash(this.password, salt)
})

RegularUserSchema.methods.getSignedJWTToken = function (): string {
	return jwt.sign({ id: this._id }, process.env.JWTSECRET, {
		expiresIn: process.env.JWT_EXPIRE,
	})
}

RegularUserSchema.methods.matchPassword = async function (
	enteredPassword: string
) {
	return await bcrtpt.compare(enteredPassword, this.password)
}

RegularUserSchema.methods.getForgetPasswordToken = function () {
	const token = crypto.randomBytes(20).toString('hex')

	// Set hash token
	this.forgetPasswordToken = crypto
		.createHash('sha256')
		.update(token)
		.digest('hex')

	// Expire in 10 mins
	this.forgetPasswordExpire = Date.now() + 10 * 60 * 1000

	return token
}

RegularUserSchema.methods.getResetEmailToken = function () {
	const token = crypto.randomBytes(20).toString('hex')

	// Set hash token
	this.resetEmailToken = crypto.createHash('sha256').update(token).digest('hex')

	// Expire in 10 mins
	this.resetEmailExpire = Date.now() + 10 * 60 * 1000

	return token
}

const RegularUserModel = mongoose.model<RegularUserType>(
	'regular_user',
	RegularUserSchema
)

export { RegularUserType, RegularUserJWTPayload }

export default RegularUserModel
