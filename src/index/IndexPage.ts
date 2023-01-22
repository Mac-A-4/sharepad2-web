import {
  redirect,
  reload
} from '../common/Redirect'
import {
  userNameStorageVar,
  sessionIdStorageVar,
  userIdStorageVar,
  userTokenStorageVar
} from '../common/Storage'

function reset() {
  sessionIdStorageVar.set(null)
  userIdStorageVar.set(null)
  userTokenStorageVar.set(null)
}

function getQuerySessionId(): string | null {
  let search = new URLSearchParams(window.location.search)
  return search.get('sessionId')
}

function handleQuerySessionId(): void {
  let querySessionId = getQuerySessionId()
  if (querySessionId !== null) {
    reset()
    sessionIdStorageVar.set(querySessionId)
  }
}

(function main() {
  handleQuerySessionId()
  let hasUserName   = userNameStorageVar.has()
  let hasSessionId  = sessionIdStorageVar.has()
  let hasUserId     = userIdStorageVar.has()
  let hasUserToken  = userTokenStorageVar.has()
  if (!hasUserName) {
    redirect('username.html')
  } else if (!hasSessionId && !hasUserId && !hasUserToken) {
    redirect('connect.html')
  } else if (hasSessionId && !hasUserId && !hasUserToken) {
    redirect('connect.html')
  } else if (hasSessionId && hasUserId && hasUserToken) {
    redirect('session.html')
  } else {
    reset()
    reload()
  }
})()
