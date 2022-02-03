const { Bot, Keyboard, InlineKeyboard, session } = require("grammy")
const mongoose = require("mongoose")
const { P2P, Personal, Detector } = require("qiwi-sdk")
const axios = require("axios")

const fs = require("fs")
const tea = JSON.parse(fs.readFileSync("config.json", "utf-8"))
const bot = new Bot(tea.TOKEN)
const qiwi = new Personal(tea.QIWI_TOKEN, tea.QIWI_WALLET)
const { userSchem, balHisSchem } = require("./schema/data.js")
const userdb = mongoose.model("users", userSchem)
const balHisdb = mongoose.model("balhis", balHisSchem)
let lang = JSON.parse(fs.readFileSync(`./lang/ru.json`, "utf-8"))
const timestamp = Date.now() + 10800000
const priceX = 2

function initial() {
  return {
    up_bal: 0,
    vk_likes: 0,
    vk_viewers: 0,
    vk_folowers: 0,
    vk_repost: 0,
    tt_likes: 0,
    tt_viewers: 0,
    tt_folowers: 0,
    tt_comments: 0,
    tg_viewers: 0,
    tg_folowers: 0,
    ins_likes: 0,
    ins_viewers: 0,
    ins_folowers: 0,
    coupon: 0,
  }
}

bot.use(session({ initial }))

const keyboard = new Keyboard()
  .text(lang.profile)
  .text(lang.up_balk)
  .row()
  .text(lang.ref_system)
  .text(lang.wrap)
  .row()
  .text(lang.about_us)
  .text(lang.my_wrap)
  .row()
  .text(lang.tech_support)
  .row()

const prof_menu = new InlineKeyboard()
  .text(lang.pur_his, "pur_his")
  .text(lang.bal_his, "bal_his")
  .row()
  .text(lang.act_cup, "coupon")

const ref_menu = new InlineKeyboard()
  .text("Рефералы и История начислений", "refer_users")
  .row()
  .text("Получить ссылку отдельным сообщением", "refer_url")
  .row()

const shop_wrap = new InlineKeyboard()
  .text(lang.vk, "vk_nakrutka")
  .text(lang.tt, "tt_nakrutka")
  .row()
  .text(lang.inst, "ins_nakrutka")
  .text(lang.tg, "tg_nakrutka")
  .row()
  .text(lang.close, "close")

const vk_keyboard = new InlineKeyboard()
  .text(lang.likes, "vk_likes")
  .row()
  .text(lang.viewers, "vk_viewers")
  .row()
  .text(lang.followers, "vk_folowers")
  .row()
  .text(lang.act_rep, "vk_repost")
  .row()
  .text(lang.back, "wp_back")

const tt_keyboard = new InlineKeyboard()
  .text(lang.likes, "tt_likes")
  .row()
  .text(lang.viewers, "tt_viewers")
  .row()
  .text(lang.followers, "tt_folowers")
  .row()
  .text(lang.comments, "tt_comments")
  .row()
  .text(lang.back, "wp_back")

const tg_keyboard = new InlineKeyboard()
  .text(lang.viewers, "tg_viewers")
  .row()
  .text(lang.followers, "tg_folowers")
  .row()
  .text(lang.back, "wp_back")

const ins_keyboard = new InlineKeyboard()
  .text(lang.likes, "ins_likes")
  .row()
  .text(lang.viewers, "ins_viewers")
  .row()
  .text(lang.followers, "ins_folowers")
  .row()
  .text(lang.back, "wp_back")

const cloze_ds = new InlineKeyboard().text(lang.close, "close")

bot.command("start", async (ctx) => {
  if (ctx.message.chat.id < 0) return
  cmf = ctx.message.from
  ctx.user = await userdb.findOne({ userid: cmf.id })
  const bsc = await userdb.countDocuments()
  const uid = 5271211 + bsc
  if (!ctx.user) {
    await userdb.create({
      id: uid,
      userid: cmf.id,
      username: cmf.username,
      lang: cmf.language_code,
      refer_id: ctx.match,
    })
    if (ctx.match) {
      const referUser = await userdb.findOne({ id: ctx.match })
      referUser.refer.unshift({ userid: uid })
      referUser.save()
    }
    await ctx.reply(`Добро пожаловать ${cmf.username || ""}`, {
      reply_markup: keyboard,
    })
    await bot.api.sendMessage(
      tea.ADMINGROUP,
      `👤 Зарегистрирован новый пользователь: <a href="tg://user?id=${
        cmf.id
      }">${cmf.username || "Без Имени"}</a>\n🕺 Реферал: ${ctx.match || "Нет"}`,
      { parse_mode: "HTML" }
    )
  } else {
    await ctx.reply("Спасибо, что решили воспользоваться нашим сервисом", {
      reply_markup: keyboard,
    })
  }
})

bot.command("check", async (ctx) => {
  try {
    ctx.user = await userdb.findOne({ userid: ctx.message?.from.id })
    const cmtA =
      +ctx.message?.text.split(" ")[1] ||
      ctx.message?.text.split(" ")[1].replace("@", "")
    if (ctx.user.acclvl < 7) return ctx.reply("Нет прав использовать команду")
    const user = Number(cmtA)
      ? await userdb.findOne({ userid: cmtA })
      : await userdb.findOne({ username: cmtA })
    if (!user) return ctx.reply("Пользователь не найден")
    console.log(user)
    const banCheck = user.acclvl < 0 ? "Да" : user.acclvl > 0 ? "Нет" : false
    ctx.reply(
      `🤵Имя пользователя: ${user.username}\n💸Баланс пользователя: ${user.bal}\n❌Бан аккаунта: ${banCheck}\n💰Покупок в боте: ${user.wrapHist.length}`
    )
  } catch (e) {
    ctx.reply(`Ошибка: ${e}`)
  }
})

bot.command("test", async (ctx) => {
  try {
    ctx.user = await userdb.findOne({ userid: ctx.message?.from.id })
    const cmtA = ctx.message?.text.slice(6)
    if (ctx.user.acclvl < 7) return ctx.reply("Нет прав использовать команду")
    const rq = await axios.request(
      `https://wiq.ru/api/?key=${tea.WIQ_TOKEN}&action=services`
    )
    const rt = rq.data.filter(x => x.ID == 4)
    ctx.reply(rt[0].description)
  } catch (e) {
    console.log(e)
    ctx.reply(`Ошибка: ${e}`)
  }
})

bot.command("order", async (ctx) => {
  try {
    ctx.user = await userdb.findOne({ userid: ctx.message?.from.id })
    const cmtA = +ctx.message?.text.slice(6)
    if (ctx.user.acclvl < 7) return ctx.reply("Нет прав использовать команду")
    const rq = await axios.request(
      `https://wiq.ru/api/?key=${tea.WIQ_TOKEN}&action=status&order=${cmtA}`
    )
    const statusParse =
      rq.data.status == "Completed"
        ? "Завершено"
        : rq.data.status == "In progress"
        ? "Активен"
        : rq.data.status == "Pending"
        ? "Обрабатывается"
        : rq.data.status == "Partial"
        ? "Прерван"
        : rq.data.status == "Canceled"
        ? "Отменен"
        : rq.data.status
    ctx.reply(`Заказ №${cmtA}\nСтатус: ${statusParse}\nСсылка: ${rq.data.link}\nТип Заказа: ${rq.data.service}\nКол-во: ${rq.data.quantity}\nВыполнено: ${rq.data.charge}`, { disable_web_page_preview: true })
  } catch (e) {
    console.log(e)
    ctx.reply(`Ошибка: ${e}`)
  }
})

bot.command("sendall", async (ctx) => {
  try {
    ctx.user = await userdb.findOne({ userid: ctx.message?.from.id })
    const cmtA = ctx.message?.text.slice(9)
    if (ctx.user.acclvl < 7) return ctx.reply("Нет прав использовать команду")
    const user = await userdb.find({})
    user.forEach((x, y, z) => {
      bot.api.sendMessage(user[y].userid, cmtA)
    })
  } catch (e) {
    ctx.reply(`Ошибка: ${e}`)
  }
})

bot.command("stat", async (ctx) => {
  try {
    ctx.user = await userdb.findOne({ userid: ctx.message?.from.id })
    if (ctx.user.acclvl < 7) return ctx.reply("Нет прав использовать команду")
    const user = await userdb.find({})
    const balance = await balHisdb.find({})
    const balComp = balance.filter((x) => x.status === "Complite")
    balComp.balUp = 0
    const balMonth = balComp.filter(
      (x) => x.reqDate.getTime() > timestamp - 2592000000
    )
    balMonth.balUp = 0
    let result = `Статистика:\n`
    balComp.forEach((x, y, z) => {
      balComp.balUp += balComp[y].balUp
      balMonth.balUp += balMonth[y].balUp
    })
    result += `👥Пользователей в боте: ${user.length} \n🌆Пополнений за месяц: ${balMonth.balUp} ₽\n💰Общая сумма Пополнений: ${balComp.balUp} ₽`
    ctx.reply(result)
  } catch (e) {
    ctx.reply(`Ошибка: ${e}`)
  }
})

bot.command("give", async (ctx) => {
  try {
    ctx.user = await userdb.findOne({ userid: ctx.message?.from.id })
    const cmtA =
      +ctx.message?.text.split(" ")[1] ||
      ctx.message?.text.split(" ")[1].replace("@", "")
    const cmtB = +ctx.message?.text.split(" ")[2]
    if (!Number(cmtB) || ctx.user.acclvl < 7)
      return ctx.reply("Нельзя использовать команду")
    const user = Number(cmtA)
      ? await userdb.findOne({ userid: cmtA })
      : await userdb.findOne({ username: cmtA })
    if (!user) return ctx.reply("Пользователь не найден")
    ctx.reply(
      `${
        cmtB > 0
          ? "Баланс пользователя пополнен на"
          : "Баланс пользователя снижен на"
      } ${cmtB} P`
    )
    bot.api.sendMessage(
      user.userid,
      `${
        cmtB > 0
          ? "💰Ваш баланс пополнен на"
          : "⚜️Администратор снизил ваш баланс на"
      } ${cmtB} P`
    )
    user.bal = user.bal + cmtB
    await user.save()
  } catch (e) {
    ctx.reply(`Ошибка: ${e}`)
  }
})

bot.command("setAccess", async (ctx) => {
  try {
    ctx.user = await userdb.findOne({ userid: ctx.message?.from.id })
    const cmtA =
      +ctx.message?.text.split(" ")[1] ||
      ctx.message?.text.split(" ")[1].replace("@", "")
    const cmtB = +ctx.message?.text.split(" ")[2]
    if (!Number.isInteger(cmtB) || ctx.user.acclvl < 7)
      return ctx.reply("Нельзя использовать команду")
    if (cmtB < -1 || cmtB > 7) return ctx.reply("Нельзя меньше -1 или больше 7")
    const ParceAccesId =
      cmtB == -1
        ? "Заблокированный"
        : cmtB == 0
        ? "Пользователь"
        : cmtB == 1
        ? "Бронзовый"
        : cmtB == 2
        ? "Серебряный"
        : cmtB == 3
        ? "Золотой"
        : cmtB == 4
        ? "Для своих"
        : cmtB == 5
        ? "Резерв"
        : cmtB == 6
        ? "Резерв"
        : cmtB == 7
        ? "Создатель"
        : "Any"
    const user = Number(cmtA)
      ? await userdb.findOne({ userid: cmtA })
      : await userdb.findOne({ username: cmtA })
    if (!user) return ctx.reply("Пользователь не найден")
    ctx.reply(`Уровень доступа пользователя теперь ${ParceAccesId}`)
    bot.api.sendMessage(
      user.userid,
      `Ваш уровень доступа теперь ${ParceAccesId}`
    )
    user.acclvl = cmtB
    await user.save()
  } catch (e) {
    ctx.reply(`Ошибка: ${e}`)
    return
  }
})

bot.callbackQuery("refer_users", async (ctx) => {
  const cmt = +ctx.update.callback_query.message.text.split("=")[1]
  ctx.answerCallbackQuery({ text: "" })
  let user = await userdb.find({ id: cmt })
  let result = `Ваши рефералы:\n`
  user.refer = user[0].refer
  for (i = 0; i < user.refer.length; i++) {
    result += `• ══─━━── ⫷⫸ ──══─━━ •\nПользователь: #${user.refer[i].userid}\nСумма: ${user.refer[i].gainrur} ₽\n`
  }
  result += `• ══─━━── ⫷⫸ ──══─━━ •`
  ctx.editMessageText(result)
})

bot.callbackQuery("pur_his", async (ctx) => {
  const cmt = ctx.from?.id
  ctx.answerCallbackQuery({ text: "" })
  const user = await userdb.findOne({ userid: cmt })
  let result = `Ваши заказы:\n`
  for (i = 0; i < user.wrapHist.length; i++) {
    const orderid = user.wrapHist[i].orderid
    const rq = await axios.request(
      `https://wiq.ru/api/?key=${tea.WIQ_TOKEN}&action=status&order=${orderid}`
    )
    const urlParse = rq.data.link.split("/")[3]
    const statusParse =
      rq.data.status == "Completed"
        ? "Завершено"
        : rq.data.status == "In progress"
        ? "Активен"
        : rq.data.status == "Pending"
        ? "Обрабатывается"
        : rq.data.status == "Partial"
        ? "Прерван"
        : rq.data.status == "Canceled"
        ? "Отменен"
        : rq.data.status
    result += `• ══─━━── ⫷⫸ ──══─━━ •\nИд: #${orderid}\nДата: ${user.wrapHist[
      i
    ].date.toLocaleString()}\nСтатус: ${statusParse}\nСсылка: <a href="${
      rq.data.link
    }">${urlParse}</a>\n`
  }
  result += `• ══─━━── ⫷⫸ ──══─━━ •`
  ctx.editMessageText(result, {disable_web_page_preview: true, parse_mode: "HTML" })
})

bot.callbackQuery("refer_url", async (ctx) => {
  const referUrl = ctx.update.callback_query.message.text.split(" ")[16]
  ctx.editMessageText(`<code>${referUrl}</code>`, { parse_mode: "HTML" })
})

bot.callbackQuery("coupon", async (ctx) => {
  ctx.editMessageText("Отправьте купон")
  const session = ctx.session
  session.coupon++
})

bot.callbackQuery("up_bal", async (ctx) => {
  ctx.editMessageText("Отправьте сумму пополнения")
  const session = ctx.session
  session.up_bal++
})

async function checkPayments(ctx, trasid) {
  const commentID = Number(trasid)
  let trans = await balHisdb.findOne({ bid: trasid })
  let user = await userdb.findOne({ id: trans.id })
  let refer = await userdb.findOne({ id: user.refer_id })

  const { data } = await qiwi.getPaymentHistory({
    operation: Personal.TransactionType.IN,
    rows: 30,
  })

  const transactions = data.filter((txn) => txn.comment == commentID)
  const transaction = transactions[0]

  if (trans.status === "Complite")
    return ctx.answerCallbackQuery({
      text: `Нельзя два раза начислить за одну покупку`,
    })
  if (trans.status === "Cancel")
    return ctx.answerCallbackQuery({
      text: `Заказ отменен`,
    })
  if (transaction === undefined) {
    ctx.answerCallbackQuery({ text: `Пополнение №${commentID} не найденно` })
    return
  } else {
    ctx.editMessageText(`Новый платёж\n Кошелек пополнен на ${trans.balUp} ₽`)
    user.bal = user.bal + trans.balUp
    await user.save()
    trans.status = "Complite"
    await trans.save()
    if (refer) {
      refer.bal = refer.bal + trans.balUp * 0.05
      const refBal = refer.refer.filter((x) => x.userid == user.id)[0]
      refBal.gainrur = refBal.gainrur + trans.balUp * 0.05
      await refer.save()
    }
    await bot.api.sendMessage(
      tea.ADMINGROUP,
      `Пополнение №${commentID}\nСумма: ${trans.balUp} ₽\nСпособ пополнения: ${
        trans.type
      }\nВремя заказа: ${trans.reqDate.toLocaleString("ru-RU")}\nПокупатель: @${
        user.username
      }\nСтатус: ${trans.status}`
    )
    return
  }
}

bot.callbackQuery("bal_his", async (ctx) => {
  const cmt = +ctx.update.callback_query.message.text
    .split(" ")[2]
    .match(/[0-9]/g)
    .join("")
  ctx.answerCallbackQuery({ text: "" })
  let balinfo = await balHisdb.find({ id: cmt })
  let result = `Всего у Вас пополнений:\n`
  balinfo = balinfo.filter((x) => x.status == "Complite")
  for (i = 0; i < balinfo.length; i++) {
    result += `• ══─━━── ⫷⫸ ──══─━━ •\nПополнение: #${balinfo[i].bid}\nСумма: ${
      balinfo[i].balUp
    } ₽\nДата Пополнения: ${balinfo[i].reqDate.toLocaleString("ru-RU")}\n`
  }
  result += `• ══─━━── ⫷⫸ ──══─━━ •`
  ctx.editMessageText(result)
})

bot.callbackQuery("check_paym_v", async (ctx) => {
  const cmt = +ctx.update.callback_query.message.text
    .split(" ")[2]
    .match(/[0-9]/g)
    .join("")
  checkPayments(ctx, cmt)
})

bot.callbackQuery("check_paym_x", async (ctx) => {
  const cmt = +ctx.update.callback_query.message.text
    .split(" ")[2]
    .match(/[0-9]/g)
    .join("")
  let trans = await balHisdb.findOne({ bid: cmt })
  trans.status = "Cancel"
  trans.save()
  ctx.answerCallbackQuery({ text: "" })
  ctx.editMessageText(`Отмена пополнения №${trans.bid}`)
})

bot.callbackQuery("in_dev", async (ctx) => {
  ctx.answerCallbackQuery({ text: "В разработке" })
})

bot.callbackQuery("tg_nakrutka", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.replyWithPhoto(
    "https://media.discordapp.net/attachments/461187392074940417/935536232023326791/Telegram.jpg?width=847&height=281",
    {
      caption:
        "• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  Telegram\n• ══─━━── ⫷⫸ ──══─━━ •",
      reply_markup: tg_keyboard,
    }
  )
})

bot.callbackQuery("tg_viewers", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👀Просмотры Tg\n💰 Цена: ${
      0.01 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 50 шт.\n Максимальное количество: 1000000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`,
    {
      reply_markup: cloze_ds,
    }
  )
  const session = ctx.session
  session.tg_viewers++
})

bot.callbackQuery("tg_folowers", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👤Подписчики Tg\n💰 Цена: ${
      0.04 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 500 шт.\n Максимальное количество: 10000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.tg_folowers++
})

bot.callbackQuery("ins_nakrutka", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.replyWithPhoto(
    "https://media.discordapp.net/attachments/461187392074940417/935536077035405312/instagram-wallpapercr.jpg?width=847&height=281",
    {
      caption:
        "• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  Instagram\n• ══─━━── ⫷⫸ ──══─━━ •",
      reply_markup: ins_keyboard,
    }
  )
})

bot.callbackQuery("ins_likes", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  ❤️‍🔥Лайки Inst\n💰 Цена: ${
      0.01 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 15000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.ins_likes++
})

bot.callbackQuery("ins_viewers", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👀Просмотры Inst\n💰 Цена: ${
      0.01 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 100 шт.\n Максимальное количество: 1000000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.ins_viewers++
})

bot.callbackQuery("ins_folowers", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👤Подписчики Inst\n💰 Цена: ${
      0.01 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 50000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.ins_folowers++
})

bot.callbackQuery("tt_nakrutka", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.replyWithPhoto(
    "https://media.discordapp.net/attachments/461187392074940417/935535429460041748/14843332_0.jpg?width=847&height=281",
    {
      caption:
        "• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  Tik Tok\n• ══─━━── ⫷⫸ ──══─━━ •",
      reply_markup: tt_keyboard,
    }
  )
})

bot.callbackQuery("tt_likes", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  ❤️‍🔥Лайки TT\n💰 Цена: ${
      0.06 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 100000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.tt_likes++
})

bot.callbackQuery("tt_viewers", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👀Просмотры TT\n💰 Цена: ${
      0.01 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 1000 шт.\n Максимальное количество: 1000000000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.tt_viewers++
})

bot.callbackQuery("tt_folowers", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👤Подписчики TT\n💰 Цена: ${
      0.03 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 100000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.tt_folowers++
})

bot.callbackQuery("tt_comments", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  💬 Комментарии TT\n💰 Цена: ${
      0.5 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 1000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.tt_comments++
})

bot.callbackQuery("vk_nakrutka", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.replyWithPhoto(
    "https://cdn.discordapp.com/attachments/461187392074940417/935402968004579388/unknown.png",
    {
      caption:
        "• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  ВКонтакте\n• ══─━━── ⫷⫸ ──══─━━ •",
      reply_markup: vk_keyboard,
    }
  )
})

bot.callbackQuery("vk_likes", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  ❤️‍🔥Лайки VK\n💰 Цена: ${
      0.06 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 35000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.vk_likes++
})

bot.callbackQuery("vk_viewers", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👀Просмотры VK\n💰 Цена: ${
      0.04 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 50 шт.\n Максимальное количество: 500000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.vk_viewers++
})

bot.callbackQuery("vk_folowers", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👤Подписчики VK\n💰 Цена: ${
      0.09 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 35000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.vk_folowers++
})

bot.callbackQuery("vk_repost", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  🔃Репосты VK\n💰 Цена: ${
      0.08 * priceX
    } ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 35000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.vk_folowers++
})

bot.callbackQuery("wp_back", async (ctx) => {
  await ctx.deleteMessage().catch((e) => console.log(e))
  await ctx.reply("Активные категории в магазине:", { reply_markup: shop_wrap })
})

bot.callbackQuery("close", async (ctx) => {
  ctx.editMessageText("Отменено")
})

const nakrutka = async (snum, price, sev, ctx) => {
  const cmt = ctx.message.text
  const session = ctx.session
  ctx.user = await userdb.findOne({ userid: ctx.message.from.id })
  if (session[sev] > 1) {
    const urlR =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
    const urlCheck = ctx.message.text.match(urlR)
    if (!urlCheck) {
      ctx.reply("Неверный формат ссылки")
      session[sev] = 0
      return
    }
    console.log(
      lang.vk_folow_url
        .replace(/(?<=<).+(?=>)/gm, `$&`)
        .replace("snum", snum)
        .replace("squa", session[sev])
        .replace("url", ctx.message.text)
        .replaceAll(/<|>/g, "")
    )
    const rq = await axios.request(
      lang.vk_folow_url
        .replace(/(?<=<).+(?=>)/gm, `$&`)
        .replace("snum", snum)
        .replace("squa", session[sev])
        .replace("url", ctx.message.text)
        .replaceAll(/<|>/g, "")
    )
    if (!rq.data.order) {
      ctx.reply(`Ошибка: ${rq.data.Error}`)
      session[sev] = 0
      return
    }
    ctx.user.bal = ctx.user.bal - session[sev] * price
    ctx.user.wrapHist.unshift({ orderid: rq.data.order, date: timestamp })
    ctx.user.save()
    ctx.reply(`Заказ №${rq.data.order} запущен`)
    bot.api.sendMessage(
      tea.ADMINGROUP,
      `Пользователь <a href="tg://user?id=${ctx.user.id}">${
        ctx.user.username || "Без Имени"
      }</a> запустил заказ №${rq.data.order} за ${session[sev] * price} ₽`,
      { parse_mode: "HTML" }
    )
    session[sev] = 0
    return
  }
  if (session[sev] > 0) {
    if (ctx.user.bal < cmt * price) {
      ctx.reply("Не хватает суммы для покупки, пополните баланс в профиле!")
      session[sev] = 0
      return
    }
    if (Number(cmt)) {
      const cmp = Number(cmt)
      if ((cmp > 500000) | (cmp < 1)) {
        ctx.reply("Неверное значение")
        session[sev] = 0
        return
      }
      session[sev] = cmp
      ctx.reply("Введите ссылку")
    } else {
      ctx.reply("Неверная сумма")
      session[sev] = 0
      return
    }
    return
  }
}

bot.on("message:text", async (ctx) => {
  cmf = ctx.message.from
  ctx.user = await userdb.findOne({ userid: cmf.id })
  if (!ctx.user) return ctx.reply("Необходимо еще раз нажать на команду /start")
  if (ctx.user.acclvl === -1) return ctx.reply("Вы заблокированны")
  const options = { year: "numeric", month: "long", day: "numeric" }
  const conv = (str) => {
    const slon = str
      .replace(/(?<=<).+(?=>)/gm, `$&`)
      .replace("userid", ctx.user.id)
      .replace("username", ctx.user.username)
      .replace("num_pur", ctx.user.num_pur)
      .replace("bal", ctx.user.bal)
      .replace("regdate", ctx.user.regDate.toLocaleDateString("ru-RU", options))
      .replaceAll(/<|>/g, "")
    return slon
  }
  const cmt = ctx.message.text
  const session = ctx.session
  //VK
  nakrutka(351, 0.06 * priceX, "vk_likes", ctx)
  nakrutka(154, 0.04 * priceX, "vk_viewers", ctx)
  nakrutka(350, 0.09 * priceX, "vk_folowers", ctx)
  nakrutka(352, 0.08 * priceX, "vk_repost", ctx)
  //TT
  nakrutka(306, 0.06 * priceX, "tt_likes", ctx)
  nakrutka(300, 0.01 * priceX, "tt_viewers", ctx)
  nakrutka(305, 0.03 * priceX, "tt_folowers", ctx)
  nakrutka(255, 0.5 * priceX, "tt_comments", ctx)
  //Ins
  nakrutka(60, 0.01 * priceX, "ins_likes", ctx)
  nakrutka(147, 0.01 * priceX, "ins_viewers", ctx)
  nakrutka(3, 0.01 * priceX, "ins_folowers", ctx)
  //TG
  nakrutka(2191, 0.01 * priceX, "tg_viewers", ctx)
  nakrutka(400, 0.04 * priceX, "tg_folowers", ctx)
  if (session.coupon > 0) {
    ctx.reply("Неверный Купон")
    session.coupon = 0
    return
  }
  if (session.up_bal > 0) {
    if (Number(cmt)) {
      const cmp = Number(cmt)
      if ((cmp > 500000) | (cmp < 0)) {
        ctx.reply("Неверное значение")
        session.up_bal = 0
        return
      }
      const coid = await balHisdb.countDocuments()
      const commentid = 183301 + coid
      await balHisdb.create({
        id: ctx.user.id,
        bid: commentid,
        username: cmf.username,
        bal: ctx.user.bal,
        balUp: cmp,
        balUpCond: ctx.user.bal + cmp,
        status: "Pending",
        reqDate: timestamp,
        type: "QIWI",
      })
      cmr = Math.round(cmp * 100) / 100
      let payUrl = qiwi.createFormUrl(Personal.Recipients.QIWINickname, {
        amount: cmr,
        account: "13DEAD",
        blocked: ["account", "comment", "sum"],
        comment: commentid,
      })
      const balUpKeyboard = new InlineKeyboard()
        .url("Перийти к оплате (Комментарий обязателен)", payUrl)
        .row()
        .text("✅ Проверить пополнение", "check_paym_v")
        .row()
        .text("❌ Отменить пополнение", "check_paym_x")
      ctx.reply(
        lang.up_bal_strings
          .replace(/(?<=<).+(?=>)/gm, `$&`)
          .replace("sum", cmr)
          .replace("name", "13DEAD")
          .replaceAll("transid", commentid)
          .replaceAll(/<|>/g, ""),
        { reply_markup: balUpKeyboard }
      )
      session.up_bal = 0
    } else {
      ctx.reply("Неверная сумма")
      session.up_bal = 0
    }
    return
  }
  if (cmt === lang.my_wrap) {
    if (!ctx.user.wrapHist[0])
      return ctx.reply("⚙️ В работе:\n\nНет активных заказов")
    const orderid = ctx.user.wrapHist[0].orderid
    const rq = await axios.request(
      `https://wiq.ru/api/?key=${tea.WIQ_TOKEN}&action=status&order=${orderid}`
    )
    const urlParse = rq.data.link.split("/")[3]
    const statusParse =
      rq.data.status == "Completed"
        ? "Завершено"
        : rq.data.status == "In progress"
        ? "Активен✅"
        : rq.data.status == "Pending"
        ? "Обрабатывается🕝"
        : rq.data.status == "Partial"
        ? "Прерван❌"
        : rq.data.status == "Canceled"
        ? "Отменен"
        : rq.data.status
    if ((rq.data.status == "Completed") | (rq.data.status == "Canceled"))
      return ctx.reply("⚙️ В работе:\n\nНет активных заказов")
    ctx.reply(
      `⚙️ В работе:\n Заказ №${orderid}\n Статус: ${statusParse}\n Выполнено: ${
        rq.data.quantity - rq.data.remains
      }/${rq.data.quantity}\n ${rq.data.link}`,
      { disable_web_page_preview: true, parse_mode: "HTML" }
    )
  }
  if (cmt === lang.up_balk) {
    ctx.reply("Отправьте сумму пополнения")
    session.up_bal++
  }
  if (cmt === lang.profile) {
    ctx.reply(conv(lang.prof_menu), { reply_markup: prof_menu })
  }
  if (cmt === lang.about_us) {
    ctx.reply(lang.about_us_info, {
      parse_mode: "MarkdownV2",
      reply_markup: keyboard,
    })
  }
  if (cmt === lang.tech_support) {
    ctx.reply(lang.tech_support_test, {
      parse_mode: "MarkdownV2",
      reply_markup: keyboard,
    })
  }
  if (cmt === lang.wrap) {
    ctx.reply("Активные категории в магазине:", {
      parse_mode: "MarkdownV2",
      reply_markup: shop_wrap,
    })
    // ctx.replyWithPhoto("https://cdn.discordapp.com/attachments/461187392074940417/935402968004579388/unknown.png", {caption: "Активные категории в магазине", reply_markup: shop_wrap})
  }
  if (cmt === lang.aval_item) {
    ctx.reply(lang.aval_item_list)
  }
  if (cmt === lang.ref_system) {
    ctx.reply(
      lang.refer
        .replace(/(?<=<).+(?=>)/gm, `$&`)
        .replaceAll("userid", ctx.user.id)
        .replaceAll(/<|>/g, ""),
      { parse_mode: "MarkdownV2", reply_markup: ref_menu }
    )
  }
  if (cmt === lang.rul) {
    ctx.reply(fs.readFileSync("./lang/rul_ru.txt").toString(), {
      reply_markup: keyboard,
    })
  }
})
bot.start()

process.on("uncaughtException", function (err) {
  console.error(err)
  bot.api.sendMessage(tea.ADMINGROUP, `В боте ошибка: <code>${err}</code>`, {
    parse_mode: "HTML",
  })
})

//DataBase
mongoose
  .connect(`mongodb://${tea.DBUSER}:${tea.DBPASS}@${tea.SERVER}/${tea.DB}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  })
  .then(() => {
    console.log("MongoDB connected!!")
  })
  .catch((err) => {
    console.log("Failed to connect to MongoDB", err)
  })
