
export class StorageVar {

  private readonly target: Storage
  private readonly key: string

  public constructor(target: Storage, key: string) {
    this.target = target
    this.key = key
  }

  public get(): string | null {
    return this.target.getItem(this.key)
  }

  public set(value: string | null): void {
    if (value !== null) {
      this.target.setItem(this.key, value)
    } else {
      this.target.removeItem(this.key)
    }
  }

  public has(): boolean {
    return this.get() !== null
  }

}

export const userNameStorageVar   = new StorageVar(localStorage, 'userName')
export const sessionIdStorageVar  = new StorageVar(sessionStorage, 'sessionId')
export const userIdStorageVar     = new StorageVar(sessionStorage, 'userId')
export const userTokenStorageVar  = new StorageVar(sessionStorage, 'userToken')
