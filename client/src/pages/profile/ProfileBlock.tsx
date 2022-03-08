import React, { useState, cloneElement, isValidElement } from 'react'
import { Button, Form, Input, Col, Typography } from 'antd'
import './ProfileBlock.css'
import api from '../../utils/api'
import { getRegularUserResValidator } from '../../res/regularUserValidate'
import { authSlice } from '../../redux/auth/authSlice'
import { useDispatch } from 'react-redux'
interface ProfileBlockProps {
  fieldName: string
  type: 'plain' | 'edit'
  initialValue: any
  title: string
}

export const ProfileBlock: React.FC<ProfileBlockProps> = ({
  fieldName,
  initialValue,
  type,
  children,
  title,
}) => {
  const dispatch = useDispatch()
  const [value, setValue] = useState(initialValue)
  const [isEditting, setIsEditting] = useState(false)
  const [loading, setLoading] = useState(false)
  const onFinish = async () => {
    setLoading(true)
    try {
      // Request to update user
      const {
        data: { data },
      } = await api.put('/regularUser', {
        [fieldName]: value,
      })
      setLoading(false)
      if (getRegularUserResValidator(data)) {
        dispatch(authSlice.actions.updateRegularUser(data))
        setIsEditting(false)
      }
    } catch (error) {
      setLoading(false)
    }
  }

  return (
    <Col
      xs={24}
      sm={24}
      md={12}
      lg={12}
      xl={11}
      xxl={6}
      className='tw-profile-block'
    >
      {/* Title */}
      <Typography.Title level={5}>{title}</Typography.Title>
      {type === 'plain' ? children : null}
      {type === 'edit' ? (
        <Form
          onFinish={onFinish}
          layout='horizontal'
          style={{ width: '100%', paddingRight: '15px' }}
        >
          <Form.Item>
            <Input
              onChange={(e) => {
                setValue(e.target.value)
                if (e.target.value === initialValue) {
                  setIsEditting(false)
                } else {
                  setIsEditting(true)
                }
              }}
              value={value}
              disabled={loading}
            />
          </Form.Item>
          <Form.Item style={{ display: !isEditting ? 'none' : 'unset' }}>
            <Button
              onClick={() => {
                setValue(initialValue)
                setIsEditting(false)
              }}
              loading={loading}
            >
              Cancel
            </Button>
            <Button
              type='primary'
              style={{ marginLeft: '10px' }}
              htmlType='submit'
            >
              Save
            </Button>
          </Form.Item>
        </Form>
      ) : null}
    </Col>
  )
}