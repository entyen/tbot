import { TOKEN, OWNER } from './config.js';
import { Telegraf } from 'telegraf'


const bot = new Telegraf(TOKEN)
bot.start((ctx) => ctx.reply('Welcome'))
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply(ctx.message.sticker.emoji))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.command('hipster', (ctx) => ctx.reply('λ'))
bot.launch()

bot.command('stop', (ctx) => {
  if (ctx.message.from.id === OWNER) {
    ctx.reply(true)
  } else ctx.reply(false)
})

//bot.on('message', (ctx) => console.log(ctx.message))
bot.on('message', (ctx) => ctx.reply(
  `Message id: ${ctx.message.message_id}
  ID: ${ctx.message.from.id}
  Name: ${ctx.message.from.first_name}
  User Name: ${ctx.message.from.username}
  Language: ${ctx.message.from.language_code}
  Bot: ${ctx.message.from.is_bot}
  Date: ${ctx.message.date}
  Text: ${ctx.message.text}
  Type: ${ctx.message.chat.type}`,
  console.log(ctx.message)
))

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
