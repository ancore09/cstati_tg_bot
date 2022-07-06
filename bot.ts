/* eslint-disable @typescript-eslint/no-floating-promises */
import { Composer, Markup, Scenes, session, Telegraf, Context } from 'telegraf'
import {createConnection, QueryError, OkPacket, RowDataPacket} from 'mysql2'
import { token, dbInfo } from './env'
import { getTicketInfo } from './utils/ticketHelper'
import { Guest } from './models/Guest'
import { TicketContext } from './models/TicketContext'

if (token === undefined) {
    throw new Error('token must be provided!')
}

// let arr: Guest[] = []

let connection = createConnection({
    host: dbInfo.host,
    user: dbInfo.user,
    password: dbInfo.password,
    database: dbInfo.database
})

/* Base Scene where all transitions to the other scenes are made */

const baseScene = new Scenes.BaseScene<TicketContext>('base')
baseScene.command('start', async (ctx) => {
    await ctx.reply('С помощью этого бота Вы сможете купить билет. Чтобы продолжить введите /buy')
})
baseScene.command('buy', async (ctx) => {

    // if (ctx.session.guestProp === undefined) {
    //
    //     let guest = arr.find(x => x.id == ctx.from.id)
    //
    //     if (guest === undefined) {
    //         ctx.session.guestProp = new Guest(ctx.from.id)
    //     } else {
    //         ctx.session.guestProp = guest
    //     }
    // }
    //
    // if (ctx.session.guestProp.registered) {
    //     await ctx.reply('Вы уже зарегистрировались')
    //     return
    // }

    if (ctx.session.guestProp === undefined) {
        console.log('Init guest')
        let sql_check = 'SELECT * FROM guests_wave1 WHERE regId = ?'
        let args = [ctx.from.id]

        connection.query(sql_check, args,(err: QueryError, result: RowDataPacket[]) => {
            if (err) {
                console.log(err.message)
                ctx.reply('Что-то пошло не так' + err.message)
                return ctx.scene.leave()
            } else {
                if (result.length == 0) {
                    ctx.session.guestProp = new Guest(ctx.from.id)
                } else {
                    ctx.session.guestProp = new Guest(result[0].regId)
                    ctx.session.guestProp.name = result[0].name
                    ctx.session.guestProp.phone = result[0].phone
                    ctx.session.guestProp.ticket_type = result[0].type
                    ctx.session.guestProp.registered = true
                }

                if (ctx.session.guestProp.registered) {
                    ctx.reply('Вы уже зарегистрировались')
                } else {
                    ctx.scene.enter('disclaimer')
                }
            }
        })
    } else {
        console.log('Guest in ctx')
        if (ctx.session.guestProp.registered) {
            ctx.reply('Вы уже зарегистрировались')
        } else {
            ctx.scene.enter('disclaimer')
        }
    }
    // await ctx.scene.enter('disclaimer')
})

/* Disclaimer scene to display some info */

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

/* Wizard step for entering name */

const nameStepHandler = new Composer<TicketContext>()
nameStepHandler.on('text', async (ctx) => {
    ctx.session.guestProp.name = ctx.message.text

    await ctx.reply('Введите свой номер телефона')
    ctx.wizard.next()
})

/* Wizard step for entering phone */

const phoneStepHandler = new Composer<TicketContext>()
phoneStepHandler.on('text', async (ctx) => {
    ctx.session.guestProp.phone = ctx.message.text

    await ctx.reply('Выберите билет: *описание билетов*', Markup.inlineKeyboard([
        Markup.button.callback('Стандартный билет', 'ticket1'),
        Markup.button.callback('Крутой билет', 'ticket2'),
    ]))
    ctx.wizard.next()
})

/* Wizard step for selecting ticket */

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

/* Wizard step for displaying info */

const preCheckoutStepHandler = new Composer<TicketContext>()
preCheckoutStepHandler.action('ok', async (ctx) => {
    ctx.session.guestProp.registered = true

    // arr.push(ctx.session.guestProp)

    let sql_wave1 = 'INSERT INTO guests_wave1 (regId, name, phone, type, payment) VALUES (?,?,?,?,?)'
    let args = [ctx.session.guestProp.id, ctx.session.guestProp.name, ctx.session.guestProp.phone, ctx.session.guestProp.ticket_type, false]

    connection.query(sql_wave1, args,(err: QueryError, result: OkPacket) => {
        if (err) {
            console.log(err.message)
            ctx.reply('Вы не успели зарегистрироваться на мероприятие: волна закрыта')
            return ctx.scene.leave()
        } else {
            ctx.reply('Вы успешно зарегистрировались на мероприятие')
            ctx.reply('Оплатите билет по следующей ссылке: http://scam.money/cstati')
            return ctx.scene.leave()
        }
    })

    // await ctx.reply('Вы успешно зарегистрировались на мероприятие')
    // await ctx.reply('Оплатите билет по следующей ссылке: http://scam.money/cstati')
    // return ctx.scene.leave()
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

/* Wizard step for editing info */

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

/* Wizard Scene for registration */

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

const bot = new Telegraf<TicketContext>(token)

const stage = new Scenes.Stage<TicketContext>([ticketWizard, disclaimerScene, baseScene], {
    default: 'base'
})

bot.use(session())
bot.use(stage.middleware())
bot.launch()

// bot.telegram.sendMessage(865009597, 'hi')

process.once('SIGINT', () => {
    connection.end()
    bot.stop('SIGINT')
})
process.once('SIGTERM', () => bot.stop('SIGTERM'))
