export class Guest {
    public id: number
    public name: string
    public phone: string
    public ticket_type: number
    public registered: Boolean = false
    public edit: string

    constructor(id) {
        this.id = id
    }
}
