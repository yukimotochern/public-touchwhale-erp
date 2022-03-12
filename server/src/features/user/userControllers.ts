import { RequestHandler, Response } from 'express'
import { GoogleAuthCallbackHandler } from '../../utils/passportOAuth'
import { PrivateRequestHandler } from '../../middlewares/authMiddleware'
import crypto from 'crypto'

import { sendEmail } from '../../utils/sendEmail'
import { avjErrorWrapper } from '../../utils/ajv'
import ErrorResponse from '../../utils/errorResponse'
import UserModel from './userModel'
import {
  forgetPasswordMessage,
  sixDigitsMessage,
} from '../../utils/emailMessage'
import { uploadImage, deleteImage } from '../../utils/AWS/b2'
import { UserValidator } from './userValidators'
import { ResBody } from '../../types/CustomExpressTypes'
import { send } from '../../utils/customExpress'
import { UserType } from './userTypes'
import mongoose from 'mongoose'

const {
  SignUp,
  Verify,
  SignIn,
  GetUser,
  Update,
  GetAvatarUploadUrl,
  ChangePassword,
  ForgetPassword,
  ResetPassword,
} = UserValidator

const UserAvatarKeyPrifix = 'UserAvatar'

// @route    POST api/v1/user/signUp
// @desc     Sign user up
// @access   Public
export const userSignUp: RequestHandler<{}, ResBody> = async (
  req,
  res,
  next
) => {
  if (SignUp.body(req.body)) {
    const { email } = req.body
    let user = await UserModel.findOne({ email })
    const sixDigits = Math.floor(100000 + Math.random() * 900000).toString()
    if (user) {
      if (user.isActive) {
        // User already register and has been activated
        return next(new ErrorResponse('User already exists.', 409))
      } else {
        // User already register but is not activated
        user.password = sixDigits
      }
    } else {
      user = new UserModel({
        email,
        password: sixDigits,
        provider: 'TouchWhale',
        isOwner: true,
        isActive: false,
      })
    }
    await user.save({ validateBeforeSave: false })
    const message = sixDigitsMessage({ sixDigits })
    await sendEmail({
      to: email,
      subject: 'Your verificatiom code',
      message: message,
    })
    return send(res, 200, {
      message: `Verification code has been send to ${email}`,
    })
  }
  next(avjErrorWrapper(SignUp.body.errors))
}

// @route    POST api/v1/user/signUp/verify
// @desc     Verify user email
// @access   Public
export const userVerify: RequestHandler = async (req, res, next) => {
  if (Verify.body(req.body)) {
    const { email, password } = req.body
    const user = await UserModel.findOne({ email }).select('+password')
    if (!user || user.isActive) {
      return next(new ErrorResponse('User email is invalid.', 401))
    }
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return next(new ErrorResponse('Invalid credentials.', 401))
    }

    return Verify.sendData(res, user.getSignedJWTToken())
  }
  next(avjErrorWrapper(Verify.body.errors))
}

// @route    POST api/v1/user/signIn
// @desc     Sign user in
// @access   Public
export const userSignIn: RequestHandler = async (req, res, next) => {
  if (SignIn.body(req.body)) {
    const { email, login_name, password } = req.body
    let user = await UserModel.findOne({ login_name, email }).select(
      '+password'
    )

    if (user && !user.isActive) {
      return next(
        new ErrorResponse(
          'Your have not completed the sign up process. Please sign up again.',
          400
        )
      )
    }
    if (!user) {
      return next(new ErrorResponse('Invalid credentials.', 401))
    }
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      if (user.provider === 'Google') {
        return next(
          new ErrorResponse(
            'You were registered with Google. Please try that login method.',
            401
          )
        )
      }
      return next(new ErrorResponse('Invalid credentials.', 401))
    }
    return sendTokenResponse(user, 200, res)
  }
  next(avjErrorWrapper(SignIn.body.errors))
}

// @route    GET api/v1/user/googleOAuth/callback
// @desc     Call back function for Google OAuth
// @access   Public
export const userOAuthCallback: RequestHandler = async (req, res, next) => {
  let redirectHome = process.env.BACKEND_PROD_URL
  if (process.env.NODE_ENV === 'development') {
    redirectHome = `${process.env.FRONTEND_DEV_URL}`
  }
  try {
    if (req.user) {
      const profile = req.user._json
      const email = profile.email
      if (!email) {
        throw new ErrorResponse(
          'Unable to obtain the required information(email) from Google.'
        )
      }
      let user = await UserModel.findOne({ email })
      if (!user) {
        user = new UserModel({
          isActive: true,
          isOwner: true,
          email: profile?.email,
          password: crypto.randomBytes(10).toString('hex'),
          avatar: profile?.picture,
          provider: 'Google',
          username: profile?.name,
          active: true,
        })

        await user.save()
      } else {
        if (user.provider !== 'Google') {
          user.provider = 'Google'
          await user.save()
        }
      }
      setToken(user, res)
      return res.redirect(redirectHome)
    } else {
      throw new ErrorResponse('Did not obtain information from Google.')
    }
  } catch (err) {
    // Error redirect to /signIn with message
    let message = 'Something went wrong.'
    if (err instanceof ErrorResponse) {
      message = err.message
    }
    message = encodeURI(
      `${message} Please try again latter or use the password login method.`
    )
    let signInPath = `${redirectHome}/signIn#${message}`
    return res.redirect(signInPath)
  }
}

// @route    GET api/v1/user/signOut
// @desc     Sign user out
// @access   Public
export const userSignOut: RequestHandler = async (req, res, next) => {
  res.clearCookie('token', {
    path: '/',
    domain:
      process.env.NODE_ENV === 'development'
        ? process.env.DEV_DOMAIN
        : process.env.PROD_DOMAIN,
    httpOnly: true,
  })
  res.clearCookie('token', {
    path: '/',
    domain: '127.0.0.1',
    httpOnly: true,
  })
  res.end()
}

// @route    GET api/v1/user/
// @desc     Get user infomation
// @access   Private
export const getUser: PrivateRequestHandler = async (req, res, next) => {
  if (req.userJWT) {
    const user = await UserModel.findById(req.userJWT.id)
    if (user) {
      return GetUser.sendData(res, user)
    } else {
      return next(new ErrorResponse('Server Error'))
    }
  } else {
    return next(new ErrorResponse('Server Error'))
  }
}

// @route    PUT api/v1/user/
// @desc     Update user infomation
// @access   Private
export const updateUser: PrivateRequestHandler = async (req, res, next) => {
  if (Update.body(req.body)) {
    if (req.userJWT) {
      const user = await UserModel.findByIdAndUpdate(req.userJWT.id, req.body, {
        new: true,
        runValidators: true,
      })
      if (user) {
        return Update.sendData(res, user)
      }
      return next(new ErrorResponse('Server Error'))
    } else {
      return next(new ErrorResponse('Server Error'))
    }
  } else {
    return next(avjErrorWrapper(Update.body.errors))
  }
}

// @route    GET api/v1/user/avatar
// @desc     Get B2 url for frontend to make a put request
// @access   Private
export const userGetAvatarUploadUrl: PrivateRequestHandler = async (
  req,
  res,
  next
) => {
  if (req.userJWT?.id) {
    const { id } = req.userJWT
    const user = await UserModel.findById(id)
    if (!user) {
      return next(new ErrorResponse('Server Error.'))
    }
    const { Key, url } = await uploadImage(UserAvatarKeyPrifix, id)
    let avatar = `https://tw-user-data.s3.us-west-000.backblazeb2.com/${Key}`
    user.avatar = avatar
    await user.save()
    return GetAvatarUploadUrl.sendData(res, { uploadUrl: url, avatar })
  }
  return next(new ErrorResponse('Server Error', 500))
}

// @route    DELETE api/v1/user/avatar
// @desc     DELET User Avatar
// @access   Private
export const deleteAvatar: PrivateRequestHandler = async (req, res, next) => {
  if (req.userJWT?.id) {
    const { id } = req.userJWT
    const user = await UserModel.findById(id)
    if (!user) {
      return next(new ErrorResponse('Server Error.'))
    }
    await deleteImage(UserAvatarKeyPrifix, id)
    user.avatar = undefined
    await user.save()
    return send(res, 200, { message: 'Avatar deleted.' })
  }
  return next(new ErrorResponse('Server Error', 500))
}

// @route    PUT api/v1/user/changePassword
// @desc     Update password
// @access   Private
export const changePassword: PrivateRequestHandler = async (req, res, next) => {
  if (ChangePassword.body(req.body) && req.userJWT) {
    const user = await UserModel.findById(req.userJWT.id).select('+password')
    if (user && user.isActive && req.body.currentPassword) {
      if (!(await user.matchPassword(req.body.currentPassword))) {
        return next(new ErrorResponse('Invalid credential.', 400))
      }
      user.password = req.body.newPassword
      await user.save()
      return sendTokenResponse(user, 200, res)
    } else if (user && !user.isActive) {
      user.password = req.body.newPassword
      user.isActive = true
      await user.save()
      return sendTokenResponse(user, 200, res)
    }
    return next(new ErrorResponse('Server Error'))
  } else {
    return next(avjErrorWrapper(ChangePassword.body.errors))
  }
}

// @route    POST api/v1/regularUser/forgetPassword
// @desc     Forget password
// @access   Public
export const forgetPassword: RequestHandler = async (req, res, next) => {
  if (ForgetPassword.body(req.body)) {
    const user = await UserModel.findOne({ email: req.body.email })
    if (!user) {
      return next(new ErrorResponse('There is no user with that email.', 404))
    }
    const token = user.getForgetPasswordToken()
    await user.save({ validateBeforeSave: false })
    // Create url
    const option = {
      protocol: req.protocol,
      host: req.get('host'),
      token,
    }
    const message = forgetPasswordMessage(option)
    try {
      await sendEmail({
        to: req.body.email,
        subject: 'Password reset token',
        message,
      })
      send(res, 200, { message: 'Email sent' })
    } catch (err: any) {
      console.error(err)
      user.forgetPasswordToken = undefined
      user.forgetPasswordExpire = undefined

      await user.save({ validateBeforeSave: false })
      return next(new ErrorResponse('Email could not be sent.', 500, err))
    }
  } else {
    return next(avjErrorWrapper(ForgetPassword.body.errors))
  }
}

// @desc        Reset password
// @route       PUT /api/v1/user/forgetPassword
// @access      Public
export const resetPassword: RequestHandler = async (req, res, next) => {
  if (ResetPassword.body(req.body)) {
    // case 1: body only provide token
    // 1. validate the token
    // 2. reset a new token and return
    // case 2: body provide both token and new password
    // 1. validate the token
    // 2. reset the password
    const forgetPasswordToken = crypto
      .createHash('sha256')
      .update(req.body.token)
      .digest('hex')

    const user = await UserModel.findOne({
      forgetPasswordToken,
      forgetPasswordExpire: { $gt: Date.now() },
    })

    if (!user) {
      return next(new ErrorResponse('Invalid token.', 400))
    }
    if (req.body.password) {
      user.password = req.body.password
      user.forgetPasswordToken = undefined
      user.forgetPasswordExpire = undefined
      await user.save()
      return ResetPassword.sendData(
        res,
        {},
        { message: 'Your password has been set.' }
      )
    } else {
      const token = user.getForgetPasswordToken()
      await user.save({ validateBeforeSave: false })
      return ResetPassword.sendData(
        res,
        { token },
        { message: 'Please use this new token to reset the password.' }
      )
    }
  } else {
    return next(avjErrorWrapper(ResetPassword.body.errors))
  }
}

/*
// @route    POST api/v1/user/
// @desc     
// @access   Public
export const userXXX: RequestHandler = async (req, res, next) => {
  if (XXX.body(req.body)) {
    // return send(res, {})
    // or
    // return XXX.sendData(res, {})
  }
  next(avjErrorWrapper(XXX.body.errors))
}
*/

// Helper functions
const setToken = (user: UserType.Mongoose, res: Response): any => {
  const token = user.getSignedJWTToken()
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 60 * 60 * 1000 * 24
    ), //Expires in days
    httpOnly: true,
  }

  res.cookie('token', token, options)
  return token
}

const sendTokenResponse = (
  user: UserType.Mongoose,
  statusCode: number,
  res: Response
): void => {
  setToken(user, res)
  return send(res, statusCode)
}