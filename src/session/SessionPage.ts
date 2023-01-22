import * as $ from 'jquery'
import {
  redirect
} from '../common/Redirect'
import {
  sessionIdStorageVar,
  userIdStorageVar,
  userNameStorageVar,
  userTokenStorageVar
} from '../common/Storage'
import {
  DocumentNameSchema, ReadSessionResponse
} from 'sharepad2-model'
import {
  client
} from '../common/Client'

interface User {
  userName: string
  userId:   string
}

interface Document {
  documentId:     string
  documentName:   string
  documentUserId: string
}

let userArray:      User[] = []
let documentArray:  Document[] = []

let editorDocumentId: string | null = null
let editorInterval:   number | null = null

function editorReset() {
  if (editorDocumentId !== null) {
    window.clearInterval(editorInterval!)
    editorDocumentId = null
    editorInterval = null
  }
  $('#editor').val('')
  $('#editor').prop('readonly', true)
  $('#editor-document-name').text('None')
  $('#editor-rename-button').prop('disabled', true)
  $('#editor-transfer-button').prop('disabled', true)
  $('#editor-delete-button').prop('disabled', true)
}

function editorBeginReadingInterval(documentId: string) {
  let reading = false
  editorInterval = window.setInterval(() => {
    if (!reading) {
      reading = true
      client.readDocument({
        sessionId: sessionIdStorageVar.get()!,
        userId: userIdStorageVar.get()!,
        userToken: userTokenStorageVar.get()!,
        documentId
      }).then(response => {
        if (editorDocumentId === documentId) {
          $('#editor').val(response.documentData)
        }
        reading = false
      }).catch(error => {
        reading = false
        console.log('Error in ReadDocument: ' + error)
      })
    }
  }, 50)
}

function editorBeginReading(documentId: string) {
  editorReset()
  editorDocumentId = documentId
  client.readDocument({
    sessionId: sessionIdStorageVar.get()!,
    userId: userIdStorageVar.get()!,
    userToken: userTokenStorageVar.get()!,
    documentId
  }).then(response => {
    $('#editor').val(response.documentData)
    editorSetName(documentId)
    editorBeginReadingInterval(documentId)
  }).catch(error => {
    console.log('Error in ReadDocument: ' + error)
  })
}

function editorBeginUpdatingInterval(documentId: string) {
  let updating = false
  let prevDocumentData: string | null = null
  editorInterval = window.setInterval(() => {
    if (!updating && editorDocumentId === documentId) {
      let documentData = $('#editor').val()?.toString()!
      if (prevDocumentData === null || prevDocumentData !== documentData) {
        prevDocumentData = documentData
        updating = true
        client.updateDocument({
          sessionId: sessionIdStorageVar.get()!,
          userId: userIdStorageVar.get()!,
          userToken: userTokenStorageVar.get()!,
          documentId,
          documentData
        }).then(_ => {
          updating = false
        }).catch(error => {
          updating = false
          console.log('Error in UpdateDocument: ' + error)
        })
      }
    }
  }, 50)
}

function editorBeginUpdating(documentId: string) {
  editorReset()
  editorDocumentId = documentId
  client.readDocument({
    sessionId: sessionIdStorageVar.get()!,
    userId: userIdStorageVar.get()!,
    userToken: userTokenStorageVar.get()!,
    documentId
  }).then(response => {
    $('#editor').val(response.documentData)
    $('#editor').prop('readonly', false)
    $('#editor-rename-button').prop('disabled', false)
    $('#editor-transfer-button').prop('disabled', false)
    $('#editor-delete-button').prop('disabled', false)
    editorSetName(documentId)
    editorBeginUpdatingInterval(documentId)
  }).catch(error => {
    console.log('Error in ReadDocument: ' + error)
  })
}

function editorSetName(documentId: string) {
  let document = documentArray.find(e => e.documentId === documentId)
  if (document === undefined) {
    alert('Invalid document id')
    return
  }
  let user = userArray.find(e => e.userId === document?.documentUserId)
  if (user === undefined) {
    alert('Invalid document user id')
    return
  }
  $('#editor-document-name').text(`${document.documentName} (${user.userName})`)
}

function editorBegin(documentId: string) {
  let document = documentArray.find(e => e.documentId === documentId)
  if (document === undefined) {
    alert('Invalid document id')
    return
  }
  if (document.documentUserId === userIdStorageVar.get()!) {
    editorBeginUpdating(documentId)
  } else {
    editorBeginReading(documentId)
  }
}

function reset() {
  sessionIdStorageVar.set(null)
  userIdStorageVar.set(null)
  userTokenStorageVar.set(null)
  redirect('index.html')
}

function handleStorage() {
  let valid =
    userNameStorageVar.has() &&
    sessionIdStorageVar.has() &&
    userIdStorageVar.has() &&
    userTokenStorageVar.has()
  if (!valid) {
    reset()
  }
}

function getShareUrl(): string {
  return `https://sharepad.mdalvz.dev/?sessionId=${sessionIdStorageVar.get()!}`
}

function createDocument(documentName: string) {
  $('#create-document-overlay-create-button').prop('disabled', true)
  client.createDocument({
    sessionId: sessionIdStorageVar.get()!,
    userId: userIdStorageVar.get()!,
    userToken: userTokenStorageVar.get()!,
    documentName,
    documentData: ''
  }).then(_ => {
    $('#create-document-overlay-create-button').prop('disabled', false)
    $('#create-document-overlay').hide()
  }).catch(error => {
    alert('Error in CreateDocument: ' + error)
    reset()
  })
}

function handleSessionOverlay() {
  $('#session-button').on('click', () => {
    $('#session-overlay-session-id-input').val(sessionIdStorageVar.get()!)
    $('#session-overlay-user-id-input').val(userIdStorageVar.get()!)
    $('#session-overlay-username-input').val(userNameStorageVar.get()!)
    $('#session-overlay-user-token-input').val(userTokenStorageVar.get()!)
    $('#session-overlay-share-url-input').val(getShareUrl())
    $('#session-overlay').show()
  })
  $('#session-overlay').on('click', () => {
    $('#session-overlay').hide()
  })
  $('#session-overlay-close-button').on('click', () => {
    $('#session-overlay').hide()
  })
  $('#session-overlay > section').on('click', e => {
    e.stopPropagation()
  })
}

function handleCreateDocumentOverlay() {
  $('#create-document-button').on('click', () => {
    $('#create-document-overlay-name-input').val('')
    $('#create-document-overlay').show()
  })
  $('#create-document-overlay').on('click', () => {
    $('#create-document-overlay').hide()
  })
  $('#create-document-overlay-create-button').on('click', () => {
    let value = $('#create-document-overlay-name-input').val()?.toString()!
    if (!DocumentNameSchema.safeParse(value).success) {
      alert('Invalid document name')
      return
    }
    createDocument(value)
  })
  $('#create-document-overlay > section').on('click', e => {
    e.stopPropagation()
  })
}

function onOpenDocument(documentId: string) {
  $('#documents-container .entry').removeClass('selected')
  $(`#document-${documentId}`).addClass('selected')
  editorBegin(documentId)
}

function onUserConnect(userId: string, userName: string) {
  $('#users-container').append(
    $('<div>').attr('id', `user-${userId}`).addClass('entry').append(
      $('<span>').text(userName),
      $('<span>').text(`(${userId})`)
    )
  )
}

function onUserDisconnect(userId: string) {
  $(`#user-${userId}`).remove()
}

function onDocumentCreate(documentId: string, documentName: string, documentUserId: string) {
  $('#documents-container').append(
    $('<div>').attr('id', `document-${documentId}`).addClass('entry').append(
      $('<span>').text(documentName),
      $('<span>').text(`(${documentId})`)
    ).on('click', () => {
      onOpenDocument(documentId)
    })
  )
}

function onDocumentDelete(documentId: string) {
  $(`#document-${documentId}`).remove()
}

function onDocumentRename(documentId: string, documentName: string) {
  $(`#document-${documentId} > span:nth-child(1)`).text(documentName)
}

function onDocumentTransfer(documentId: string, documentUserId: string) {

}

function onReadSession(response: ReadSessionResponse) {
  let userArrayBuffer: User[] = [...userArray]
  let documentArrayBuffer: Document[] = [...documentArray]
  for (let user of response.users) {
    if (!userArray.some(e => e.userId === user.userId)) {
      onUserConnect(user.userId, user.userName)
      userArrayBuffer.push(user)
    }
  }
  for (let user of userArray) {
    if (!response.users.some(e => e.userId === user.userId)) {
      onUserDisconnect(user.userId)
      userArrayBuffer = userArrayBuffer.filter(e => e.userId !== user.userId)
    }
  }
  for (let document of response.documents) {
    if (!documentArray.some(e => e.documentId === document.documentId)) {
      onDocumentCreate(document.documentId, document.documentName, document.documentUserId)
      documentArrayBuffer.push(document)
    }
  }
  for (let document of documentArray) {
    if (!response.documents.some(e => e.documentId === document.documentId)) {
      onDocumentDelete(document.documentId)
      documentArrayBuffer = documentArrayBuffer.filter(e => e.documentId !== document.documentId)
    }
  }
  for (let document of documentArray) {
    let other = response.documents.find(e => e.documentId === document.documentId)
    if (other !== undefined) {
      if (document.documentName !== other.documentName) {
        onDocumentRename(document.documentId, other.documentName)
        documentArrayBuffer = documentArrayBuffer.map(e => {
          if (e.documentId === document.documentId) {
            return {
              ...e,
              documentName: other?.documentName!
            }
          } else {
            return e
          }
        })
      }
      if (document.documentUserId !== other.documentUserId) {
        onDocumentTransfer(document.documentId, other.documentUserId)
        documentArrayBuffer = documentArrayBuffer.map(e => {
          if (e.documentId === document.documentId) {
            return {
              ...e,
              documentUserId: other?.documentUserId!
            }
          } else {
            return e
          }
        })
      }
    }
  }
  userArray = userArrayBuffer
  documentArray = documentArrayBuffer
}

function handleReadSession() {
  let reading = false
  setInterval(() => {
    if (!reading) {
      reading = true
      client.readSession({
        sessionId: sessionIdStorageVar.get()!,
        userId: userIdStorageVar.get()!,
        userToken: userTokenStorageVar.get()!
      }).then(response => {
        onReadSession(response)
        reading = false
      }).catch(error => {
        alert('Error in ReadSession: ' + error)
        reset()
      })
    }
  }, 250)
}

(function main() {
  handleStorage()
  handleSessionOverlay()
  handleCreateDocumentOverlay()
  handleReadSession()
  editorReset()
  $('#leave-button').on('click', () => {
    reset()
  })
})()
