const { Telegraf } = require('telegraf')
const mongoose = require('mongoose')


const server = '127.0.0.1:27017'
const database = 'tbot'
const userSchem = new mongoose.Schema({ userid: Number, username: String })

const fs = require('fs')
const tea = JSON.parse(fs.readFileSync('config.json', 'utf-8'))

const bot = new Telegraf(tea.TOKEN)
bot.start(async (ctx) => {
  ctx.reply(`Welcome ${ctx.message.from.username}`)
  const userm = mongoose.model('users', userSchem)
  let user = await userm.findOne({ username: ctx.message.from.username })
  if (!user){
      user = await userm.create({ userid: ctx.message.from.id, username: ctx.message.from.username })  
    }
})
bot.help((ctx) => ctx.reply('Send me a sticker'))
bot.on('sticker', (ctx) => ctx.reply(ctx.message.sticker.emoji))
bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch()

bot.command('stop', (ctx) => {
  if (ctx.message.from.id === tea.OWNER) {
    ctx.reply(true)
  } else ctx.reply(false)
})

bot.command('td', (ctx) => {
    let tx = (ctx.message.text).split(' ')
    tx = (tx.slice(1,tx.length)).join(' ')
      if (tx.length) {
        ctx.reply(tx)
      }
})

bot.on('message',
  function (ctx) {
    const ctm = ctx.message
    const wt = fs.createWriteStream('./tbot.log', {flags: 'a'})
    wt.write(JSON.stringify(ctm) + '\n')

    ctx.reply(
      `Message id: ${ctm.message_id}
      ID: ${ctm.from.id}
      Name: ${ctm.from.first_name}
      User Name: ${ctm.from.username}
      Language: ${ctm.from.language_code}
      Bot: ${ctm.from.is_bot}
      Date: ${ctm.date}
      Text: ${ctm.text}
      Type: ${ctm.chat.type}`
    ) 
  })

//DataBase
mongoose.connect(`mongodb://${server}/${database}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
}).then(() => {
    console.log('MongoDB connected!!');
}).catch(err => {
    console.log('Failed to connect to MongoDB', err);
});

// Enable graceful stop
//process.once('SIGINT', () => bot.stop('SIGINT'))
//process.once('SIGTERM', () => bot.stop('SIGTERM'))
