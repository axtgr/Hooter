class Store {
  private startItems: any[] = []
  private items: any[] = []
  private endItems: any[] = []

  constructor(private match: (item: any, needle: any) => boolean) {}

  prepend(item: any): void {
    this.startItems.push(item)
  }

  add(item: any): void {
    this.items.push(item)
  }

  append(item: any): void {
    this.endItems.unshift(item)
  }

  get(needle?: any): any {
    if (typeof needle === 'undefined') {
      return this.startItems.concat(this.items, this.endItems)
    }

    return this.startItems.concat(this.items, this.endItems).filter(item => {
      return this.match(item, needle)
    })
  }

  del(needle?: any): void {
    if (typeof needle === 'undefined') {
      this.startItems = []
      this.items = []
      this.endItems = []
    } else {
      this.startItems = this.startItems.filter(item => {
        return !this.match(item, needle)
      })
      this.items = this.items.filter(item => {
        return !this.match(item, needle)
      })
      this.endItems = this.endItems.filter(item => {
        return !this.match(item, needle)
      })
    }
  }
}

export default Store
