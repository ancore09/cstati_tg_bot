/* eslint-disable @typescript-eslint/no-floating-promises */
import { Composer, Markup, Scenes, session, Telegraf, Context } from 'telegraf'

import { token } from './env'

if (token === undefined) {
    throw new Error('BOT_TOKEN must be provided!')
}

class Guest {
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

function getTicketDescription(type: number) {
    switch (type) {
        case 1:
            return "Стандартный билет"
        case 2:
            return "Крутой билет"
    }
}

function getTicketInfo(ctx: any) {
    return '------Информация о регистрации------\n' +
        'Номер регистрации: ' + ctx.session.guestProp.id + '\n' +
        'Имя: ' + ctx.session.guestProp.name + '\n' +
        'Номер телефона: ' + ctx.session.guestProp.phone + '\n' +
        'Билет: ' + getTicketDescription(ctx.session.guestProp.ticket_type) + '\n'
}

interface TicketSession extends Scenes.WizardSession {
    // will be available under `ctx.session.mySessionProp`
    guestProp: Guest
}

interface TicketContext extends Context {
    // will be available under `ctx.myContextProp`
    myContextProp: string

    // declare session type
    session: TicketSession
    // declare scene type
    scene: Scenes.SceneContextScene<TicketContext, Scenes.WizardSessionData>
    // declare wizard type
    wizard: Scenes.WizardContextWizard<TicketContext>
}

let arr: Guest[] = []

const nameStepHandler = new Composer<TicketContext>()
nameStepHandler.on('text', async (ctx) => {
    ctx.session.guestProp.name = ctx.message.text

    await ctx.reply('Введите свой номер телефона')
    ctx.wizard.next()
})

const phoneStepHandler = new Composer<TicketContext>()
phoneStepHandler.on('text', async (ctx) => {
    ctx.session.guestProp.phone = ctx.message.text

    await ctx.reply('Выберите билет: *описание билетов*', Markup.inlineKeyboard([
        Markup.button.callback('Стандартный билет', 'ticket1'),
        Markup.button.callback('Крутой билет', 'ticket2'),
    ]))
    ctx.wizard.next()
})

const ticketStepHandler = new Composer<TicketContext>()
ticketStepHandler.action('ticket1', async (ctx) => {
    ctx.session.guestProp.ticket_type = 1

    await ctx.reply(getTicketInfo(ctx),
        Markup.inlineKeyboard([
            Markup.button.callback('Купить', 'ok'),
            Markup.button.callback('Изменить', 'edit'),
            Markup.button.callback('Отменить', 'cancel'),
        ]))
    return ctx.wizard.next()
})

ticketStepHandler.action('ticket2', async (ctx) => {
    ctx.session.guestProp.ticket_type = 2

    await ctx.reply(getTicketInfo(ctx),
        Markup.inlineKeyboard([
            Markup.button.callback('Купить', 'ok'),
            Markup.button.callback('Изменить', 'edit'),
            Markup.button.callback('Отменить', 'cancel'),
        ]))
    return ctx.wizard.next()
})

const preCheckoutStepHandler = new Composer<TicketContext>()
preCheckoutStepHandler.action('ok', async (ctx) => {
    ctx.session.guestProp.registered = true

    arr.push(ctx.session.guestProp)

    await ctx.reply('Вы успешно зарегистрировались на мероприятие')
    await ctx.reply('Оплатите билет по следующей ссылке: http://scam.money/cstati')
    return ctx.scene.leave()
})

preCheckoutStepHandler.action('edit', async (ctx) => {
    await ctx.reply('Выберете, что нужно отредактировать', Markup.inlineKeyboard([
        Markup.button.callback('Фио', 'name'),
        Markup.button.callback('Телефон', 'phone'),
        Markup.button.callback('Билет', 'ticket')
    ]))
    return ctx.wizard.next()
})

preCheckoutStepHandler.action('cancel', async (ctx) => {
    ctx.session.guestProp = undefined

    await ctx.reply('Регистрация отменена')
    return ctx.scene.leave()
})

const editStepHandler = new Composer<TicketContext>()
editStepHandler.action('name', async (ctx) => {
    ctx.session.guestProp.edit = 'name'
    return await ctx.reply('Введите имя')
})

editStepHandler.action('phone', async (ctx) => {
    ctx.session.guestProp.edit = 'phone'
    return await ctx.reply('Введите номер телефона')
})

editStepHandler.action('ticket', async (ctx) => {
    ctx.session.guestProp.edit = 'ticket'
    await ctx.reply('Выберите билет: *описание билетов*', Markup.inlineKeyboard([
        Markup.button.callback('Стандартный билет', 'ticket1'),
        Markup.button.callback('Крутой билет', 'ticket2'),
    ]))
    return ctx.wizard.selectStep(3)
})

editStepHandler.on('text', async (ctx) => {
    // @ts-ignore
    switch (ctx.session.guestProp.edit) {
        case 'name':
            ctx.session.guestProp.name = ctx.message.text
            await ctx.reply(getTicketInfo(ctx),
                Markup.inlineKeyboard([
                    Markup.button.callback('Купить', 'ok'),
                    Markup.button.callback('Изменить', 'edit'),
                    Markup.button.callback('Отменить', 'cancel'),
                ]))
            return ctx.wizard.back()
        case 'phone':
            ctx.session.guestProp.phone = ctx.message.text
            await ctx.reply(getTicketInfo(ctx),
                Markup.inlineKeyboard([
                    Markup.button.callback('Купить', 'ok'),
                    Markup.button.callback('Изменить', 'edit'),
                    Markup.button.callback('Отменить', 'cancel'),
                ]))
            return ctx.wizard.back()
    }
})


const ticketWizard = new Scenes.WizardScene(
    'ticket-wizard',
    async (ctx) => {
        await ctx.reply('Введите свое полное имя')
        ctx.wizard.next()
    },
    nameStepHandler,
    phoneStepHandler,
    ticketStepHandler,
    preCheckoutStepHandler,
    editStepHandler
)

const disclaimerScene = new Scenes.BaseScene<TicketContext>('disclaimer')
disclaimerScene.enter(async (ctx) => {
    await ctx.reply('*Отказ от ответственности во время мероприятия*', Markup.inlineKeyboard([
        Markup.button.callback('Принимаю', 'accept'),
    ]))
})

disclaimerScene.on('text',async (ctx) => {
    await ctx.reply('*Отказ от ответственности во время мероприятия*', Markup.inlineKeyboard([
        Markup.button.callback('Принимаю', 'accept'),
    ]))
})

disclaimerScene.action('accept', async (ctx) => {
    await ctx.reply('Запускается процесс регистрации')
    ctx.scene.enter('ticket-wizard')
})

const baseScene = new Scenes.BaseScene<TicketContext>('base')
baseScene.command('start', async (ctx) => {
    await ctx.reply('С помощью этого бота Вы сможете купить билет. Чтобы продолжить введите /buy')
})
baseScene.command('buy', async (ctx) => {
    if (ctx.session.guestProp === undefined) {

        let guest = arr.find(x => x.id == ctx.from.id)

        if (guest === undefined) {
            ctx.session.guestProp = new Guest(ctx.from.id)
        } else {
            ctx.session.guestProp = guest
        }
    }

    if (ctx.session.guestProp.registered) {
        await ctx.reply('Вы уже зарегистрировались')
        return
    }

    await ctx.scene.enter('disclaimer')
})

const bot = new Telegraf<TicketContext>(token)

const stage = new Scenes.Stage<TicketContext>([ticketWizard, disclaimerScene, baseScene], {
    default: 'base'
})

bot.use(session())
bot.use(stage.middleware())
bot.launch()

// bot.telegram.sendMessage(865009597, 'hi')

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
