function getTicketDescription(type: number) {
    switch (type) {
        case 1:
            return "Стандартный билет"
        case 2:
            return "Крутой билет"
    }
}

export function getTicketInfo(ctx: any) {
    return '------Информация о регистрации------\n' +
        'Номер регистрации: ' + ctx.session.guestProp.id + '\n' +
        'Имя: ' + ctx.session.guestProp.name + '\n' +
        'Номер телефона: ' + ctx.session.guestProp.phone + '\n' +
        'Билет: ' + getTicketDescription(ctx.session.guestProp.ticket_type) + '\n'
}
