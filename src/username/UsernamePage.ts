import * as $ from 'jquery'
import {
  redirect
} from '../common/Redirect'
import {
  userNameStorageVar
} from '../common/Storage'
import {
  UserNameSchema
} from 'sharepad2-model'

function handleUserName() {
  if (userNameStorageVar.has()) {
    $('#username-input').val(userNameStorageVar.get()!)
  }
}

function onSubmit() {
  let value = $('#username-input').val()?.toString()!
  if (!UserNameSchema.safeParse(value).success) {
    alert('Invalid username')
    return
  }
  userNameStorageVar.set(value)
  redirect('index.html')
}

(function main() {
  handleUserName()
  $('#username-form').on('submit', () => {
    onSubmit()
  })
})()
