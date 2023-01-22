import * as $ from 'jquery'
import {
  userIdStorageVar,
  userNameStorageVar,
  userTokenStorageVar,
  sessionIdStorageVar
} from '../common/Storage'
import {
  redirect
} from '../common/Redirect'
import {
  client
} from '../common/Client'
import {
  SessionIDSchema
} from 'sharepad2-model'

function reset() {
  sessionIdStorageVar.set(null)
  userIdStorageVar.set(null)
  userTokenStorageVar.set(null)
  redirect('index.html')
}

function disable(disabled: boolean) {
  $('input').prop('disabled', disabled)
  $('button').prop('disabled', disabled)
}

function handleUserName() {
  if (!userNameStorageVar.has()) {
    redirect('index.html')
  } else {
    $('#username-input').val(userNameStorageVar.get()!)
  }
}

function handleSessionId() {
  if (sessionIdStorageVar.has()) {
    connect()
  }
}

function connect() {
  disable(true)
  client.connectSession({
    sessionId: sessionIdStorageVar.get()!,
    userName: userNameStorageVar.get()!
  }).then(response => {
    userIdStorageVar.set(response.userId)
    userTokenStorageVar.set(response.userToken)
    redirect('session.html')
  }).catch(error => {
    alert('Error in ConnectSession: ' + error)
    reset()
  })
}

function create() {
  disable(true)
  client.createSession({
  }).then(response => {
    sessionIdStorageVar.set(response.sessionId)
    connect()
  }).catch(error => {
    alert('Error in CreateSession: ' + error)
    reset()
  })
}

function onConnect() {
  let value = $('#session-id-input').val()?.toString()!
  if (!SessionIDSchema.safeParse(value).success) {
    alert('Invalid session id')
    return
  }
  sessionIdStorageVar.set(value)
  connect()
}

(function main() {
  handleUserName()
  handleSessionId()
  $('#account-form').on('submit', () => {
    redirect('username.html')
  })
  $('#connect-form').on('submit', () => {
    onConnect()
  })
  $('#create-form').on('submit', () => {
    create()
  })
})()
