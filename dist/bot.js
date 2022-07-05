"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-floating-promises */
const telegraf_1 = require("telegraf");
const env_1 = require("./env");
if (env_1.token === undefined) {
    throw new Error('BOT_TOKEN must be provided!');
}
class Guest {
    constructor(id) {
        this.registered = false;
        this.id = id;
    }
}
function getTicketDescription(type) {
    switch (type) {
        case 1:
            return "Стандартный билет";
        case 2:
            return "Крутой билет";
    }
}
function getTicketInfo(ctx) {
    return '------Информация о регистрации------\n' +
        'Номер регистрации: ' + ctx.session.guestProp.id + '\n' +
        'Имя: ' + ctx.session.guestProp.name + '\n' +
        'Номер телефона: ' + ctx.session.guestProp.phone + '\n' +
        'Билет: ' + getTicketDescription(ctx.session.guestProp.ticket_type) + '\n';
}
let arr = [];
const nameStepHandler = new telegraf_1.Composer();
nameStepHandler.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.session.guestProp.name = ctx.message.text;
    yield ctx.reply('Введите свой номер телефона');
    ctx.wizard.next();
}));
const phoneStepHandler = new telegraf_1.Composer();
phoneStepHandler.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.session.guestProp.phone = ctx.message.text;
    yield ctx.reply('Выберите билет: *описание билетов*', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback('Стандартный билет', 'ticket1'),
        telegraf_1.Markup.button.callback('Крутой билет', 'ticket2'),
    ]));
    ctx.wizard.next();
}));
const ticketStepHandler = new telegraf_1.Composer();
ticketStepHandler.action('ticket1', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.session.guestProp.ticket_type = 1;
    yield ctx.reply(getTicketInfo(ctx), telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback('Купить', 'ok'),
        telegraf_1.Markup.button.callback('Изменить', 'edit'),
        telegraf_1.Markup.button.callback('Отменить', 'cancel'),
    ]));
    return ctx.wizard.next();
}));
ticketStepHandler.action('ticket2', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.session.guestProp.ticket_type = 2;
    yield ctx.reply(getTicketInfo(ctx), telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback('Купить', 'ok'),
        telegraf_1.Markup.button.callback('Изменить', 'edit'),
        telegraf_1.Markup.button.callback('Отменить', 'cancel'),
    ]));
    return ctx.wizard.next();
}));
const preCheckoutStepHandler = new telegraf_1.Composer();
preCheckoutStepHandler.action('ok', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.session.guestProp.registered = true;
    arr.push(ctx.session.guestProp);
    yield ctx.reply('Вы успешно зарегистрировались на мероприятие');
    yield ctx.reply('Оплатите билет по следующей ссылке: http://scam.money/cstati');
    return ctx.scene.leave();
}));
preCheckoutStepHandler.action('edit', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('Выберете, что нужно отредактировать', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback('Фио', 'name'),
        telegraf_1.Markup.button.callback('Телефон', 'phone'),
        telegraf_1.Markup.button.callback('Билет', 'ticket')
    ]));
    return ctx.wizard.next();
}));
preCheckoutStepHandler.action('cancel', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.session.guestProp = undefined;
    yield ctx.reply('Регистрация отменена');
    return ctx.scene.leave();
}));
const editStepHandler = new telegraf_1.Composer();
editStepHandler.action('name', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.session.guestProp.edit = 'name';
    return yield ctx.reply('Введите имя');
}));
editStepHandler.action('phone', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.session.guestProp.edit = 'phone';
    return yield ctx.reply('Введите номер телефона');
}));
editStepHandler.action('ticket', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.session.guestProp.edit = 'ticket';
    yield ctx.reply('Выберите билет: *описание билетов*', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback('Стандартный билет', 'ticket1'),
        telegraf_1.Markup.button.callback('Крутой билет', 'ticket2'),
    ]));
    return ctx.wizard.selectStep(3);
}));
editStepHandler.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    // @ts-ignore
    switch (ctx.session.guestProp.edit) {
        case 'name':
            ctx.session.guestProp.name = ctx.message.text;
            yield ctx.reply(getTicketInfo(ctx), telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('Купить', 'ok'),
                telegraf_1.Markup.button.callback('Изменить', 'edit'),
                telegraf_1.Markup.button.callback('Отменить', 'cancel'),
            ]));
            return ctx.wizard.back();
        case 'phone':
            ctx.session.guestProp.phone = ctx.message.text;
            yield ctx.reply(getTicketInfo(ctx), telegraf_1.Markup.inlineKeyboard([
                telegraf_1.Markup.button.callback('Купить', 'ok'),
                telegraf_1.Markup.button.callback('Изменить', 'edit'),
                telegraf_1.Markup.button.callback('Отменить', 'cancel'),
            ]));
            return ctx.wizard.back();
    }
}));
const ticketWizard = new telegraf_1.Scenes.WizardScene('ticket-wizard', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('Введите свое полное имя');
    ctx.wizard.next();
}), nameStepHandler, phoneStepHandler, ticketStepHandler, preCheckoutStepHandler, editStepHandler);
const disclaimerScene = new telegraf_1.Scenes.BaseScene('disclaimer');
disclaimerScene.enter((ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('*Отказ от ответственности во время мероприятия*', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback('Принимаю', 'accept'),
    ]));
}));
disclaimerScene.on('text', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('*Отказ от ответственности во время мероприятия*', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback('Принимаю', 'accept'),
    ]));
}));
disclaimerScene.action('accept', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('Запускается процесс регистрации');
    ctx.scene.enter('ticket-wizard');
}));
const baseScene = new telegraf_1.Scenes.BaseScene('base');
baseScene.command('start', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield ctx.reply('С помощью этого бота Вы сможете купить билет. Чтобы продолжить введите /buy');
}));
baseScene.command('buy', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    if (ctx.session.guestProp === undefined) {
        let guest = arr.find(x => x.id == ctx.from.id);
        if (guest === undefined) {
            ctx.session.guestProp = new Guest(ctx.from.id);
        }
        else {
            ctx.session.guestProp = guest;
        }
    }
    if (ctx.session.guestProp.registered) {
        yield ctx.reply('Вы уже зарегистрировались');
        return;
    }
    yield ctx.scene.enter('disclaimer');
}));
const bot = new telegraf_1.Telegraf(env_1.token);
const stage = new telegraf_1.Scenes.Stage([ticketWizard, disclaimerScene, baseScene], {
    default: 'base'
});
bot.use((0, telegraf_1.session)());
bot.use(stage.middleware());
bot.launch();
// bot.telegram.sendMessage(865009597, 'hi')
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
//# sourceMappingURL=bot.js.map