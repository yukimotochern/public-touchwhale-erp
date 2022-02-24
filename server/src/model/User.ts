import mongoose from 'mongoose'
import bcrtpt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { timeStamp } from 'console'

interface UserType {
  email: string
  password: string
  avatar?: string
  company_name?: string
  forgetPasswordToken?: string
  forgetPasswordExpire?: Date
  resetEmailToken?: string
  resetEmailExpire?: Date
  createdAt: Date
  updatedAt: Date
  matchPassword: (password: string) => Promise<boolean>
  getForgetPasswordToken: () => string
}

const UserSchema = new mongoose.Schema<UserType>(
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

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next()
  }

  const salt = await bcrtpt.genSalt(10)
  this.password = await bcrtpt.hash(this.password, salt)
})

UserSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWTSECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  })
}

UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrtpt.compare(enteredPassword, this.password)
}

UserSchema.methods.getForgetPasswordToken = function () {
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

const UserModel = mongoose.model<UserType>('User', UserSchema)

export { UserType }

export default UserModel