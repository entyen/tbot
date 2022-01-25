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
  .text(lang.pur_his, "in_dev")
  .row()
  .text(lang.up_bal, "up_bal")
  .text(lang.bal_his, "in_dev")
  .row()
  .text(lang.act_cup, "in_dev")

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
    await ctx.reply(`Добро пожаловать ${cmf.username || ""}`, {
      reply_markup: keyboard,
    })
  } else {
    await ctx.reply("Спасибо, что решили воспользоваться нашим сервисом", {
      reply_markup: keyboard,
    })
  }
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

  if (trans.status === "Cancel")
    return ctx.answerCallbackQuery({
      text: `Заказ отменен`,
    })
  if (trans.status === "Complite")
    return ctx.answerCallbackQuery({
      text: `Нельзя два раза начислить за одну покупку`,
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
      refer.save()
    }
    await bot.api.sendMessage(
      -463135822,
      `Пополнение №${commentID}\nСумма: ${trans.balUp} ₽\nСпособ пополнения: ${
        trans.type
      }\nВремя заказа: ${trans.reqDate.toLocaleString("ru-RU")}\nПокупатель: @${
        user.username
      }\nСтатус: ${trans.status}`
    )
    return
  }
}

bot.callbackQuery("check_paym_v", async (ctx) => {
  const cmt = ctx.update.callback_query.message.text.split(" ")[2]
  checkPayments(ctx, cmt)
})

bot.callbackQuery("check_paym_x", async (ctx) => {
  const cmt = ctx.update.callback_query.message.text.split(" ")[2]
  let trans = await balHisdb.findOne({ bid: cmt })
  trans.status = "Cancel"
  trans.save()
  ctx.answerCallbackQuery({ text: "" })
  ctx.editMessageText("Отмена пополнения")
})

bot.callbackQuery("in_dev", async (ctx) => {
  const cmt = ctx.update.callback_query.message.text.split(" ")[2]
  ctx.answerCallbackQuery({ text: "В разработке" })
})

bot.callbackQuery("tg_nakrutka", async (ctx) => {
  await ctx.deleteMessage()
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
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👀Просмотры Tg\n💰 Цена: ${0.01 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 50 шт.\n Максимальное количество: 1000000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.tg_viewers++
})

bot.callbackQuery("tg_folowers", async (ctx) => {
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👤Подписчики Tg\n💰 Цена: ${0.04 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 500 шт.\n Максимальное количество: 10000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.tg_folowers++
})

bot.callbackQuery("ins_nakrutka", async (ctx) => {
  await ctx.deleteMessage()
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
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  ❤️‍🔥Лайки Inst\n💰 Цена: ${0.01 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 15000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.ins_likes++
})

bot.callbackQuery("ins_viewers", async (ctx) => {
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👀Просмотры Inst\n💰 Цена: ${0.01 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 100 шт.\n Максимальное количество: 1000000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.ins_viewers++
})

bot.callbackQuery("ins_folowers", async (ctx) => {
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👤Подписчики Inst\n💰 Цена: ${0.01 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 50000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.ins_folowers++
})

bot.callbackQuery("tt_nakrutka", async (ctx) => {
  await ctx.deleteMessage()
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
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  ❤️‍🔥Лайки TT\n💰 Цена: ${0.06 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 100000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.tt_likes++
})

bot.callbackQuery("tt_viewers", async (ctx) => {
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👀Просмотры TT\n💰 Цена: ${0.01 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 1000 шт.\n Максимальное количество: 1000000000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.tt_viewers++
})

bot.callbackQuery("tt_folowers", async (ctx) => {
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👤Подписчики TT\n💰 Цена: ${0.03 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 100000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.tt_folowers++
})

bot.callbackQuery("tt_comments", async (ctx) => {
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  💬 Комментарии TT\n💰 Цена: ${0.5 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 1000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.tt_comments++
})

bot.callbackQuery("vk_nakrutka", async (ctx) => {
  await ctx.deleteMessage()
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
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  ❤️‍🔥Лайки VK\n💰 Цена: ${0.06 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 35000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.vk_likes++
})

bot.callbackQuery("vk_viewers", async (ctx) => {
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👀Просмотры VK\n💰 Цена: ${0.04 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 50 шт.\n Максимальное количество: 500000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.vk_viewers++
})

bot.callbackQuery("vk_folowers", async (ctx) => {
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  👤Подписчики VK\n💰 Цена: ${0.09 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 35000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.vk_folowers++
})

bot.callbackQuery("vk_repost", async (ctx) => {
  await ctx.deleteMessage()
  await ctx.reply(
    `• ══─━━── ⫷⫸ ──══─━━ •\n📃 Категория:  🔃Репосты VK\n💰 Цена: ${0.08 * priceX} ₽ \n\nВведите количество товара, которое хотите купить: \n Минимальное количество: 10 шт.\n Максимальное количество: 35000 шт.\n• ══─━━── ⫷⫸ ──══─━━ •`
  )
  const session = ctx.session
  session.vk_folowers++
})

bot.callbackQuery("wp_back", async (ctx) => {
  await ctx.deleteMessage()
  await ctx.reply("Активные категории в магазине:", { reply_markup: shop_wrap })
})

bot.callbackQuery("close", async (ctx) => {
  ctx.editMessageText("Отменено")
})

const nakrutka = async (snum, price, sev, ctx) => {
  const cmt = ctx.message.text
  const session = ctx.session
  if (session[sev] > 1) {
    const rq = await axios.request(
      lang.vk_folow_url
        .replace(/(?<=<).+(?=>)/gm, `$&`)
        .replace("snum", snum)
        .replace("squa", session[sev])
        .replace("url", ctx.message.text)
        .replaceAll(/<|>/g, "")
    )
    if (!rq.data.order) {
      ctx.reply(`Ошибка ${rq.data.Error}`)
      session[sev] = 0
      return
    }
    ctx.user.bal = ctx.user.bal - session[sev] * price
    ctx.user.wrapHist.unshift({ orderid: rq.data.order, date: timestamp })
    ctx.user.save()
    ctx.reply(`Заказ №${rq.data.order} запущен`)
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
      session[sev] = cmp
      ctx.reply("Введите ссылку")
    } else {
      ctx.reply("Неверная сумма")
      session[sev] = 0
    }
    return
  }
}

bot.on("message:text", async (ctx) => {
  cmf = ctx.message.from
  ctx.user = await userdb.findOne({ userid: cmf.id })
  if (!ctx.user) return ctx.reply("Необходимо еще раз нажать на команду /start")
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
  nakrutka(351, (0.06 * priceX), "vk_likes", ctx)
  nakrutka(154, (0.04 * priceX), "vk_viewers", ctx)
  nakrutka(350, (0.09 * priceX), "vk_folowers", ctx)
  nakrutka(352, (0.08 * priceX), "vk_repost", ctx)
  //TT
  nakrutka(306, (0.06 * priceX), "tt_likes", ctx)
  nakrutka(300, (0.01 * priceX), "tt_viewers", ctx)
  nakrutka(305, (0.03 * priceX), "tt_folowers", ctx)
  nakrutka(255, (0.5 * priceX), "tt_comments", ctx)
  //Ins
  nakrutka(60, (0.01 * priceX), "ins_likes", ctx)
  nakrutka(147, (0.01 * priceX), "ins_viewers", ctx)
  nakrutka(3, (0.01 * priceX), "ins_folowers", ctx)
  //TG
  nakrutka(2191, (0.01 * priceX), "tg_viewers", ctx)
  nakrutka(400, (0.04 * priceX), "tg_folowers", ctx)
  if (session.up_bal > 0) {
    if (Number(cmt)) {
      const cmp = Number(cmt)
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
    if (!ctx.user.wrapHist[0].orderid) return ctx.reply("Заказов нет")
    const orderid = ctx.user.wrapHist[0].orderid
    const rq = await axios.request(
      `https://wiq.ru/api/?key=13a00ca1a6b4bd265abcbc00bb900414&action=status&order=${orderid}`
    )
    const urlParse = rq.data.link.split("/")[3]
    const statusParse =
      rq.data.status == "Completed" ? "Завершено" : rq.data.status
    ctx.reply(
      `Заказ №${orderid}\n ${rq.data.quantity}/${rq.data.remains}  <a href="${rq.data.link}">${urlParse}</a> ${statusParse}`,
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
      { parse_mode: "MarkdownV2" }
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
